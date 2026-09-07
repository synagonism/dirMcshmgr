const vscode = require('vscode')
const path = require('path')
const fs = require('fs')
const http = require('http')
const cp = require('child_process')

/**
 * Two commands, both backed by the Node static server (dirMcsmgr/server.mjs,
 * web root C:\dirNodews, http://localhost) that replaced XAMPP/Apache:
 *
 *   mcs.openInLocalServer   Map the active file to its http://localhost/… URL
 *                           and show it in the integrated Simple Browser.
 *
 *   mcs.validateAndReport   Run dirMcsmgr/dirValid/validator on the active
 *                           *.last.html, then — when it reports errors or
 *                           warnings — open validator-report.html in the
 *                           integrated Simple Browser (served by server.mjs).
 *
 * Either command starts server.mjs first if http://localhost isn't answering.
 * The path→URL mapping reuses the mcs-visual convention: the mcsv.docRootFolder
 * segment (default "dirNodews") marks the web root; mcsv.serverOrigin (default
 * "http://localhost") is the origin.
 */

// ── url helpers (mirror mcs-visual/extension.js fRelPath/fOrigin/fDisplayUrlForPath) ──
const fCfg = () => vscode.workspace.getConfiguration('mcsv')
const fOrigin = () => String(fCfg().get('serverOrigin') || 'http://localhost').replace(/\/+$/, '')
const fDocRoot = () => String(fCfg().get('docRootFolder') || 'dirNodews')

// Map a filesystem path to its server URL, or null when it is not under the
// configured document-root folder.
function fPageUrl(sFsPath) {
  const sP = sFsPath.replace(/\\/g, '/')
  const sNeedle = '/' + fDocRoot().replace(/^\/+|\/+$/g, '') + '/'
  const nIdx = sP.toLowerCase().indexOf(sNeedle.toLowerCase())
  if (nIdx < 0) return null
  const sRel = sP.slice(nIdx + sNeedle.length)
  return `${fOrigin()}/${sRel.split('/').map(encodeURIComponent).join('/')}`
}

// ── server discovery + auto-start ────────────────────────────────────────────
const fDelay = ms => new Promise(r => setTimeout(r, ms))

// Walk up from a directory until dirMcsmgr/<name> turns up.
function fFindUp(sFromDir, ...aSeg) {
  let sDir = sFromDir
  for (let n = 0; n < 12; n++) {
    const sCand = path.join(sDir, ...aSeg)
    if (fs.existsSync(sCand)) return sCand
    const sUp = path.dirname(sDir)
    if (sUp === sDir) break
    sDir = sUp
  }
  return null
}
const fFindValidator = sFromDir => fFindUp(sFromDir, 'dirMcsmgr', 'dirValid', 'validator.js')
const fFindServer = sFromDir => fFindUp(sFromDir, 'dirMcsmgr', 'server.mjs')

// Resolve true when the origin answers (any HTTP response), false otherwise.
function fPing() {
  return new Promise(resolve => {
    let bDone = false
    const fDone = bVal => { if (!bDone) { bDone = true; resolve(bVal) } }
    try {
      const oReq = http.get(fOrigin() + '/', oRes => { oRes.resume(); fDone(true) })
      oReq.setTimeout(1000, () => { oReq.destroy(); fDone(false) })
      oReq.on('error', () => fDone(false))
    } catch (e) { fDone(false) }
  })
}

// Make sure server.mjs is reachable, starting it (detached, hidden) if not.
async function fEnsureServerUp(sFromDir) {
  if (await fPing()) return
  const sServer = fFindServer(sFromDir)
  if (!sServer) throw new Error('server.mjs not found above the current file')

  // Prefer the existing hidden VBS launcher (matches the logon Scheduled Task);
  // fall back to launching node directly. Either way the server is detached and
  // outlives this extension host — we never kill it on deactivate.
  const sVbs = path.join(path.dirname(sServer), 'start-server-hidden.vbs')
  if (fs.existsSync(sVbs)) {
    cp.spawn('wscript.exe', [sVbs], { detached: true, stdio: 'ignore', windowsHide: true }).unref()
  } else {
    // single shell-command string (not an args array) avoids the shell+args
    // deprecation warning and quotes the path for us
    cp.spawn(`node "${sServer}"`, { cwd: path.dirname(sServer), detached: true, shell: true, windowsHide: true, stdio: 'ignore' }).unref()
  }

  for (let n = 0; n < 20; n++) {
    await fDelay(300)
    if (await fPing()) return
  }
  throw new Error('server did not become reachable on ' + fOrigin())
}

async function fShowInSimpleBrowser(sUrl) {
  try { await vscode.commands.executeCommand('simpleBrowser.show', sUrl) }
  catch (e) { await vscode.env.openExternal(vscode.Uri.parse(sUrl)) }
}

// Every open Simple Browser tab (webview tabs whose viewType is simpleBrowser).
function fSimpleBrowserTabs() {
  const aTab = []
  for (const oGroup of vscode.window.tabGroups.all) {
    for (const oTab of oGroup.tabs) {
      const oIn = oTab.input
      if (oIn instanceof vscode.TabInputWebview && /simplebrowser/i.test(String(oIn.viewType))) {
        aTab.push(oTab)
      }
    }
  }
  return aTab
}

// Show the report in the integrated Simple Browser. If one is already open it is
// reloaded in place (Simple Browser keeps a single reusable view; a cache-busting
// query forces the iframe to re-fetch), and any extra Simple Browser tabs are
// collapsed to the active one so the report never opens in another tab.
async function fShowReport(sUrl) {
  const sBust = sUrl + (sUrl.includes('?') ? '&' : '?') + '_r=' + Date.now()
  try { await vscode.commands.executeCommand('simpleBrowser.show', sBust) }
  catch (e) { await vscode.env.openExternal(vscode.Uri.parse(sUrl)); return }

  const aTab = fSimpleBrowserTabs()
  if (aTab.length > 1) {
    const aExtra = aTab.filter(oTab => !oTab.isActive)
    try { await vscode.window.tabGroups.close(aExtra) } catch (e) { /* ignore */ }
  }
}

function activate(context) {
  const oChannel = vscode.window.createOutputChannel('Mcs Validator')

  // ── open active file in the integrated Simple Browser via server.mjs ───────
  const disOpen = vscode.commands.registerCommand('mcs.openInLocalServer', async () => {
    const oEditor = vscode.window.activeTextEditor
    if (!oEditor) {
      vscode.window.showWarningMessage('Mcs: no active file to open.')
      return
    }
    const sFsPath = oEditor.document.uri.fsPath
    const sUrl = fPageUrl(sFsPath)
    if (!sUrl) {
      vscode.window.showWarningMessage(`Mcs: file is not under the server doc-root ("${fDocRoot()}", set via mcsv.docRootFolder).`)
      return
    }
    try {
      await fEnsureServerUp(path.dirname(sFsPath))
      await fShowInSimpleBrowser(sUrl)
    } catch (e) {
      vscode.window.showErrorMessage(`Mcs: could not open ${sUrl} — ${e.message}`)
    }
  })

  // ── validate active *.last.html and show the report on issues ──────────────
  const disValidate = vscode.commands.registerCommand('mcs.validateAndReport', async () => {
    const oEditor = vscode.window.activeTextEditor
    if (!oEditor) {
      vscode.window.showWarningMessage('Mcs: no active file to validate.')
      return
    }
    const sFile = oEditor.document.uri.fsPath
    if (!/\.last\.html$/i.test(sFile)) {
      vscode.window.showWarningMessage('Mcs: active file is not a *.last.html file.')
      return
    }
    if (oEditor.document.isDirty) { await oEditor.document.save() }

    const sDirFile = path.dirname(sFile)
    const sBase = path.basename(sFile)
    const sValidator = fFindValidator(sDirFile)
    if (!sValidator) {
      vscode.window.showErrorMessage('Mcs: could not locate dirMcsmgr/dirValid/validator.js above the current file.')
      return
    }
    const sReport = path.join(path.dirname(sValidator), 'validator-report.html')

    const sCmd = `node "${sValidator}" "${sDirFile}" --file "${sBase}"`
    oChannel.clear()
    oChannel.appendLine(`$ ${sCmd}`)
    oChannel.show(true)

    cp.exec(sCmd, { cwd: sDirFile, maxBuffer: 32 * 1024 * 1024 }, async (oErr, sOut, sErrOut) => {
      if (sOut) oChannel.append(sOut)
      if (sErrOut) oChannel.append(sErrOut)

      // A clean run prints "✅ No issues found!" and no SUMMARY line, so a
      // missing match with a clean exit just means zero issues.
      const oMatch = /SUMMARY:\s*(\d+)\s*errors?\s*\|\s*(\d+)\s*warnings?/i.exec(sOut || '')
      const nError = oMatch ? parseInt(oMatch[1], 10) : 0
      const nWarn = oMatch ? parseInt(oMatch[2], 10) : 0

      if (nError + nWarn > 0 && fs.existsSync(sReport)) {
        const sReportUrl = fPageUrl(sReport)
        if (!sReportUrl) {
          vscode.window.showErrorMessage(`Mcs: report is not under the server doc-root ("${fDocRoot()}").`)
          return
        }
        try {
          await fEnsureServerUp(sDirFile)
          await fShowReport(sReportUrl)
          vscode.window.setStatusBarMessage(`Mcs: ${nError} error(s), ${nWarn} warning(s) — report opened`, 6000)
        } catch (e) {
          vscode.window.showErrorMessage(`Mcs: could not open report — ${e.message}`)
        }
      } else if (oErr) {
        // non-zero exit without a clean summary -> the validator actually failed
        vscode.window.showErrorMessage('Mcs: validation failed — see the "Mcs Validator" output.')
      } else {
        vscode.window.setStatusBarMessage(`Mcs: ✅ no errors/warnings — ${sBase}`, 6000)
      }
    })
  })

  context.subscriptions.push(disOpen, disValidate, oChannel)
}

function deactivate() {}

module.exports = { activate, deactivate }
