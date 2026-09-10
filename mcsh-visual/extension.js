'use strict';
/*
 * Mcsh-Visual — a-visual-editor for Mcs*.last.html and Hitp*.last.html files.
 *
 * The editor is a VS Code custom editor that looks like a browser: an address bar
 * with back / forward / reload and a "..." overflow menu (File → Save; Format →
 * Bold, Color, Url), hosting an <iframe> that renders the page from the LOCAL
 * SERVER (so it looks exactly like the live site). A bridge served with the page
 * (Mcsmgr/mcsh-visual/src/mMcshVisual.js, loaded only when the URL carries ?mcshv=1) makes the
 * whole page editable and reports each change as (id, ordinal, text/markup).
 *
 * Editing model ("full", not surgical): every reported change is mirrored into
 * the in-memory document immediately (kept dirty, unsaved). On Save the ENTIRE
 * document is re-serialised to the canonical 2/4-space Mcsh format (format.js)
 * and written to disk; the iframe then reloads to show the canonical page.
 */

const vscode = require('vscode');
const fs = require('fs');
const os = require('os');
const path = require('path');
const omModel = require('./src/mModel');
const omFormat = require('./src/mFormat');
const fFormat = omFormat.fFormat;

const sViewType = 'mcshv.editorVisual';
/** Uris that currently have a Mcsh-Visual editor open (so we reformat on save). */
const oSetUriManaged = new Set();
/** Uris mid-save: the canonical-format edit is ours, so don't treat it as external. */
const oSetUriSaving = new Set();
/** Cached parse of the user's keybindings.json (re-read when its mtime changes). */
let oShortcutsCache = { path: '', mtimeMs: -1, list: [] };
/** fsPath of the file currently shown in the active Mcsh-Visual editor (for ${command:mcshv.currentFile}). */
let sVisualFile = '';
/** Navigate fn of the most-recently-active open Mcsh-Visual editor (null = none open). */
let fNavigateVisual = null;

function fActivate(context) {
  const oProvider = fCreateProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(sViewType, oProvider, {
      webviewOptions: { retainContextWhenHidden: true },
      supportsMultipleEditorsPerDocument: false,
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('mcshv.open', async (uri) => {
      const oTarget = uri || (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri);
      if (!oTarget) return;
      // Left column: the raw source text editor.
      await vscode.window.showTextDocument(oTarget, { viewColumn: vscode.ViewColumn.One, preview: false });
      // Right column: the visual custom editor, which receives focus (default).
      await vscode.commands.executeCommand('vscode.openWith', oTarget, sViewType, {
        viewColumn: vscode.ViewColumn.Beside,
      });
      // Give the visual (right) 60% of the width, source (left) 40%.
      try {
        await vscode.commands.executeCommand('vscode.setEditorLayout', {
          orientation: 0, // side-by-side columns
          groups: [{ size: 0.39 }, { size: 0.61 }],
        });
      } catch (e) { /* layout is best-effort */ }
    })
  );
  // Task variables: ${command:mcshv.currentFile[Dirname|Basename]} resolve to the file the
  // Mcsh-Visual editor is currently showing (its navigated activeDoc) — because a task's
  // ${file} resolves from the active editor, which for the custom editor stays the ORIGINAL
  // bound document even after you navigate. Falls back to the active text editor when one
  // is focused, so the commands behave like ${file} outside the visual editor.
  const fTaskFile = () => {
    const oEd = vscode.window.activeTextEditor;
    const s = (oEd && oEd.document && oEd.document.uri.scheme === 'file') ? oEd.document.uri.fsPath : sVisualFile;
    // Match ${file}: on Windows VS Code's ${file} yields an UPPERCASE drive letter, but
    // uri.fsPath yields lowercase — and consumers (mNamidxFile.mjs) strip a hardcoded
    // 'C:/…/dirMcsh/' prefix case-sensitively, so uppercase the drive to stay a drop-in.
    return s.replace(/^([a-z]):/, (sM, sD) => sD.toUpperCase() + ':');
  };
  // ${command:mcshv.currentWorldview}: worldview ROOT of the current file — the
  // nearest ancestor folder holding a `dirNamidx` (every worldview has one). Lets a
  // task's cwd track the open file's worldview instead of ${workspaceFolder}, so the
  // manager scripts (which read/write dirNamidx/, dirManager/, Mcsqnt.root.json
  // relative to process.cwd()) work from any worldview in a multi-root workspace.
  const fTaskWorldview = () => {
    const s = fTaskFile();
    if (!s) return '';
    let sDir = path.dirname(s);
    const sStop = path.parse(sDir).root;
    for (;;) {
      try { if (fs.existsSync(path.join(sDir, 'dirNamidx'))) return sDir; } catch (e) { /* skip */ }
      const sUp = path.dirname(sDir);
      if (sUp === sDir || sDir === sStop) break;
      sDir = sUp;
    }
    return fWorldviewRoot(s, path.basename(s).replace(/\.last\.html$/i, ''));  // heuristic fallback
  };
  context.subscriptions.push(
    vscode.commands.registerCommand('mcshv.currentFile', () => fTaskFile()),
    vscode.commands.registerCommand('mcshv.currentFileDirname', () => { const s = fTaskFile(); return s ? path.dirname(s) : ''; }),
    vscode.commands.registerCommand('mcshv.currentFileBasename', () => { const s = fTaskFile(); return s ? path.basename(s) : ''; }),
    vscode.commands.registerCommand('mcshv.currentWorldview', () => fTaskWorldview())
  );
  // Open a McsHitp page BY CODE: prompt a Mcs-code prefilled with the current file's
  // code, resolve it to dir<Cat>/<code>.last.html (Hitp → dir<Cat>/dirHitp/…) and open
  // it in Mcsh-Visual (source + visual). Works from the visual editor and from a raw
  // .last.html text editor (bound to Ctrl+Alt+P O in the user's keybindings).
  context.subscriptions.push(
    vscode.commands.registerCommand('mcshv.openByCode', async () => {
      // Current McsHitp file (if any) — used only to prefill the prompt and as the
      // first root candidate. Absent when invoked cold (e.g. from index.html), which
      // is fine: the prompt opens empty and the root is inferred from the workspace.
      const oEd = vscode.window.activeTextEditor;
      const sCur = (oEd && oEd.document.uri.scheme === 'file' && /\.last\.html$/i.test(oEd.document.uri.fsPath))
        ? oEd.document.uri.fsPath : sVisualFile;
      const sCurCode = sCur ? path.basename(sCur).replace(/\.last\.html$/i, '') : '';
      const sInput = await vscode.window.showInputBox({
        prompt: 'Open McsHitp file by code',
        placeHolder: 'e.g. McsStn000005, HitpStnEcon000, Mcs000000',
        value: sCurCode,
        valueSelection: sCurCode ? [0, sCurCode.length] : undefined,
      });
      if (!sInput) return;
      const sCode = sInput.trim().replace(/\.last\.html$/i, '');
      // Resolve across candidate roots: fast deterministic path first, recursive
      // search as the safety net. Handles the cold start (no current file).
      const aRoots = fRootCandidates(sCur, sCurCode);
      let sPath = '';
      for (const sRoot of aRoots) { const p = fPathForCode(sRoot, sCode); if (p && fs.existsSync(p)) { sPath = p; break; } }
      if (!sPath) for (const sRoot of aRoots) { const p = fSearchByCode(sRoot, sCode); if (p) { sPath = p; break; } }
      if (!sPath) { vscode.window.showWarningMessage('Mcsh-Visual: no file for code “' + sCode + '”.'); return; }
      // A visual editor is open → reuse its single tab: navigate its iframe (the
      // bridge `nav` retargets the edit doc + source pane). Else open a fresh pair.
      const sUrl = fNavigateVisual ? fDisplayUrlForPath(sPath) : '';
      if (fNavigateVisual && sUrl) fNavigateVisual(sUrl);
      else await vscode.commands.executeCommand('mcshv.open', vscode.Uri.file(sPath));
    })
  );
  // Source -> Visual: when the active source tab becomes a different editable page
  // (e.g. closing a tab shifts focus to another Mcs/Hitp tab, or clicking one), the
  // open visual editor navigates to it — keeping the two panes mirrored. The reverse
  // (visual -> source) is already done by fOnNavigate's showTextDocument.
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((oEd) => {
      if (!oEd || oEd.document.uri.scheme !== 'file') return;   // focus moved into the visual (not a text editor)
      if (!fNavigateVisual) return;                             // no visual editor open
      const sFs = oEd.document.uri.fsPath;
      if (!/^(Mcs|Hitp).*\.last\.html$/i.test(path.basename(sFs))) return; // only editable pages
      const fNorm = (s) => (s || '').replace(/\\/g, '/').toLowerCase();
      if (fNorm(sFs) === fNorm(sVisualFile)) return;            // visual already shows it -> no loop
      const sUrl = fDisplayUrlForPath(sFs);
      if (sUrl) fNavigateVisual(sUrl);                          // visual follows the focused source tab
    })
  );
  // Canonicalise on EVERY save (File → Save, Ctrl+S, or programmatic) of a doc
  // that has a Mcsh-Visual editor open.
  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument((e) => {
      const sUri = e.document.uri.toString();
      if (!oSetUriManaged.has(sUri)) return;
      oSetUriSaving.add(sUri);                     // the format edit below is ours, not external
      const sSrc = e.document.getText();
      const sOut = fFormat(sSrc);
      if (sOut === sSrc) return;
      const oFullRange = new vscode.Range(e.document.positionAt(0), e.document.positionAt(sSrc.length));
      e.waitUntil(Promise.resolve([vscode.TextEdit.replace(oFullRange, sOut)]));
    })
  );
}

/**
 * Build the custom-editor provider object. VS Code only needs an object with a
 * resolveCustomTextEditor(document, panel, token) method — no class required.
 * `context` is captured by the closure.
 */
function fCreateProvider(context) {
  /**
   * @param {vscode.TextDocument} document
   * @param {vscode.WebviewPanel} panel
   */
  const resolveCustomTextEditor = async (document, panel, _token) => {
    const oWebview = panel.webview;
    oWebview.options = { enableScripts: true, localResourceRoots: [context.extensionUri] };

    const sKey = document.uri.toString();
    oSetUriManaged.add(sKey);

    // The file currently being edited. Starts as the opened document, but the
    // visual is a browser: navigating (link-icon / URL bar) retargets this to the
    // page now shown, so edits/saves follow. `null` = a view-only page.
    let oActiveDoc = document;
    sVisualFile = document.uri.fsPath;           // seed ${command:mcshv.currentFile}
    panel.onDidChangeViewState(() => { if (panel.active) { if (oActiveDoc) sVisualFile = oActiveDoc.uri.fsPath; fNavigateVisual = fNavigate; } });
    const oSetAddedKeys = new Set();             // docs we added to `oSetUriManaged` (cleanup on dispose)
    const sDocRootBase = fDocRootBase(document);

    const sUrl = fLocalhostUrl(document);
    oWebview.html = fBuildShell(oWebview, sUrl);

    let bSelfEditing = false;

    const fToChrome = (m) => oWebview.postMessage(Object.assign({ source: 'mcshv-host' }, m));
    const fSendIds = () => fToChrome({ type: 'ids', ids: oActiveDoc ? omModel.fCollectIds(oActiveDoc.getText()) : [] });
    const fStatus = (m) => fToChrome({ type: 'status', message: m });
    const fReloadFrame = () => fToChrome({ type: 'reload' });
    // Tell the chrome which file-kind is showing, so it shows/hides kind-tagged
    // menu items (e.g. File → Open only on Mcs pages).
    const fSendMenuKind = () => fToChrome({ type: 'menuKind', kind: fFileKind(oActiveDoc) });
    // Navigate THIS visual editor's iframe to another page (reuse the tab). The
    // resulting bridge `nav` retargets oActiveDoc + the source pane (fOnNavigate).
    const fNavigate = (sUrl) => { if (sUrl) fToChrome({ type: 'navigate', url: sUrl }); };
    fNavigateVisual = fNavigate;                 // this editor is the active one at resolve time

    // File → Open (and the Ctrl+Alt+P O chord): open a McsHitp page by code.
    const fOpenByCode = () => vscode.commands.executeCommand('mcshv.openByCode');
    // File → Index and upload (and Ctrl+Alt+P X U): run the workspace task that
    // name-indexes the current file and uploads the changed files.
    const fIndexUpload = () => vscode.commands.executeCommand('workbench.action.tasks.runTask', 'Index names of current-file and upload');
    // File → Index only (and Ctrl+Alt+P X O): name-index the current file, no upload.
    const fIndexOnly = () => vscode.commands.executeCommand('workbench.action.tasks.runTask', 'Index names ONLY of current-file');
    // File → New McsHitp (and Ctrl+Alt+P K M): run the task that creates a new page.
    const fNewFile = () => vscode.commands.executeCommand('workbench.action.tasks.runTask', 'Create new McsHitp file');

    // --- source <-> visual cursor sync ----------------------------------------
    // Flattened cores, cached per document version so cursor-move sync doesn't
    // re-parse the whole file each time.
    let oCoresCache = { version: -1, list: [] };
    const fCoresList = () => {
      if (oActiveDoc && oCoresCache.version !== oActiveDoc.version) {
        oCoresCache = { version: oActiveDoc.version, list: omModel.fFlattenCores(oActiveDoc.getText()) };
      }
      return oCoresCache.list;
    };
    // The left source is a real TextEditor (the custom editor isn't in this list).
    const fSourceEditor = () => vscode.window.visibleTextEditors.find(
      (ed) => oActiveDoc && ed.document.uri.toString() === oActiveDoc.uri.toString());
    let nSuppressSourceSyncUntil = 0;   // ignore selection events we cause ourselves
    let oSyncTimer = null;

    // The webview panel is bound to the ORIGINAL document, but after navigation we
    // edit a different `oActiveDoc`. So drive the tab title ourselves: show the file
    // now being edited, and — since the bound doc stays clean for navigated files —
    // prefix an unsaved marker when the navigated oActiveDoc is dirty. (For the
    // original file VS Code's own dirty dot still shows.)
    let bNavDirty = false;   // deterministic unsaved flag for the navigated oActiveDoc
    const fBaseName = (doc) => (doc ? doc.uri.path.split('/').pop() : '');
    const fIsNavigated = () => !!oActiveDoc && oActiveDoc.uri.toString() !== document.uri.toString();
    const fUpdateTitle = () => {
      panel.title = ((fIsNavigated() && bNavDirty) ? '● ' : '') + fBaseName(oActiveDoc || document);
    };

    // Mirror a bridge-reported change into the active document (unsaved). Returns ok.
    const fApplyReplace = async (msg, newText) => {
      if (!oActiveDoc) return false;
      const oLoc = omModel.fLocate(oActiveDoc.getText(), msg);
      if (!oLoc) return false;
      if (newText === oActiveDoc.getText().slice(oLoc.s, oLoc.e)) return true;
      const oRange = new vscode.Range(oActiveDoc.positionAt(oLoc.s), oActiveDoc.positionAt(oLoc.e));
      const oWe = new vscode.WorkspaceEdit();
      oWe.replace(oActiveDoc.uri, oRange, newText);
      bSelfEditing = true;
      const bOk = await vscode.workspace.applyEdit(oWe);
      bSelfEditing = false;
      if (bOk && fIsNavigated()) { bNavDirty = true; fUpdateTitle(); }   // mark visual tab unsaved
      return bOk;
    };

    // Retarget the edit file when the page navigates (bridge `nav` message).
    const fOnNavigate = async (href) => {
      fToChrome({ type: 'setUrl', url: href });               // address bar
      const oUri = fPathFromUrl(href, sDocRootBase);
      if (oUri && fs.existsSync(oUri.fsPath)) {
        try {
          const oDoc = await vscode.workspace.openTextDocument(oUri);
          oActiveDoc = oDoc;
          sVisualFile = oUri.fsPath;                           // ${command:mcshv.currentFile} follows navigation
          bNavDirty = !!oDoc.isDirty;                          // fresh file's unsaved state
          const k = oUri.toString();
          oSetUriManaged.add(k); oSetAddedKeys.add(k);
          // Switch the LEFT source pane to the navigated file (keep focus on the visual).
          await vscode.window.showTextDocument(oUri, { viewColumn: vscode.ViewColumn.One, preserveFocus: true, preview: false });
          fSendIds();
          fToChrome({ type: 'shortcuts', list: fReadUserShortcuts() }); // auto-sync viewer chords
          fUpdateTitle();                                     // visual tab → navigated file name
          fSendMenuKind();                                    // menu adapts to Mcs/Hitp
          fStatus('editing ' + oUri.path.split('/').pop());
          return;
        } catch (e) { /* fall through to view-only */ }
      }
      oActiveDoc = null;                                      // external / not an editable Mcs page
      bNavDirty = false;
      fToChrome({ type: 'ids', ids: [] });
      fUpdateTitle();
      fSendMenuKind();                                        // view-only → hide kind-tagged items
      fStatus('view-only');
    };

    // Add / remove a <br> marker-line. Structural changes shift ordinals, so we
    // apply the surgical edit then save — canonicalising and reloading the frame
    // (via onDidSave) re-renders and re-annotates from one source of truth.
    const fApplyStructure = async (msg) => {
      if (!oActiveDoc) return false;
      const sText = oActiveDoc.getText();
      const nOff = omModel.fCoreStart(sText, msg);
      if (nOff == null) return false;
      let oEdit = null;
      if (msg.op === 'lineAfter') {
        const r = omModel.fBuildLineAfter(sText, nOff, msg.placeholder);
        if (r) oEdit = { s: r.insertAt, e: r.insertAt, text: r.text };
      } else if (msg.op === 'lineDelete') {
        const r = omModel.fBuildLineDelete(sText, nOff);
        if (r) oEdit = { s: r.removeS, e: r.removeE, text: '' };
      }
      if (!oEdit) return false;
      const oRange = new vscode.Range(oActiveDoc.positionAt(oEdit.s), oActiveDoc.positionAt(oEdit.e));
      const oWe = new vscode.WorkspaceEdit();
      oWe.replace(oActiveDoc.uri, oRange, oEdit.text);
      bSelfEditing = true;
      const bOk = await vscode.workspace.applyEdit(oWe);
      bSelfEditing = false;
      if (bOk && fIsNavigated()) { bNavDirty = true; fUpdateTitle(); }
      return bOk;
    };

    const oChangeSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (!oActiveDoc || e.document.uri.toString() !== oActiveDoc.uri.toString()) return;
      fUpdateTitle();                        // reflect dirty on the visual tab (navigated files)
      if (bSelfEditing) return;              // our own live edit — iframe already shows it
      if (oSetUriSaving.has(e.document.uri.toString())) return; // our canonical-format-on-save edit
      if (e.contentChanges.length === 0) return;
      // Changed elsewhere (e.g. the raw editor). Refresh the id list; the iframe
      // still renders from disk, so only reload after it is saved.
      fSendIds();
    });

    const oSaveSub = vscode.workspace.onDidSaveTextDocument((doc) => {
      if (!oActiveDoc || doc.uri.toString() !== oActiveDoc.uri.toString()) return;
      oSetUriSaving.delete(doc.uri.toString());
      bNavDirty = false; fUpdateTitle();      // clear the unsaved marker on the visual tab
      fStatus('saved · ' + new Date().toLocaleTimeString());
      fReloadFrame();                         // reload re-renders + re-annotates from the written file
    });

    // Source -> visual: a cursor move in the source scrolls the visual to that core.
    const oSelSub = vscode.window.onDidChangeTextEditorSelection((e) => {
      if (!oActiveDoc || e.textEditor.document.uri.toString() !== oActiveDoc.uri.toString()) return;
      if (Date.now() < nSuppressSourceSyncUntil) return;             // our own programmatic move
      if (e.kind === vscode.TextEditorSelectionChangeKind.Command) return;
      const nOff = oActiveDoc.offsetAt(e.selections[0].active);
      if (oSyncTimer) clearTimeout(oSyncTimer);
      oSyncTimer = setTimeout(() => {
        const oHit = omModel.fCoreAtOffset(fCoresList(), nOff);
        if (oHit) fToChrome({ type: 'syncTo', id: oHit.id, ord: oHit.ord });
      }, 100);
    });

    const oMsgSub = oWebview.onDidReceiveMessage(async (msg) => {
      if (!msg) return;
      try {
        // --- messages from the browser chrome (address bar / ... menu) --------
        if (msg.source === 'mcshv-chrome') {
          switch (msg.type) {
            case 'ready': fToChrome({ type: 'setUrl', url: fDisplayUrl(document) }); fSendMenuKind(); break; // ids come from bridge `nav`
            case 'save': if (oActiveDoc) await oActiveDoc.save(); break;
            case 'open': fOpenByCode(); break;
            case 'indexUpload': fIndexUpload(); break;
            case 'indexOnly': fIndexOnly(); break;
            case 'newFile': fNewFile(); break;
            case 'cmd': fToChrome({ type: 'cmd', cmd: msg.cmd }); break; // relay to bridge
            case 'cmdPalette': vscode.commands.executeCommand('workbench.action.showCommands'); break; // Ctrl+Shift+P
            case 'openRaw': vscode.commands.executeCommand('vscode.openWith', (oActiveDoc || document).uri, 'default'); break;
          }
          return;
        }
        // --- messages from the page bridge -----------------------------------
        if (msg.source !== 'mcshv') return;
        switch (msg.type) {
          case 'ready': break;                       // ids are sent from `nav` (below)
          case 'save': if (oActiveDoc) await oActiveDoc.save(); break; // Ctrl+S from the iframe
          case 'open': fOpenByCode(); break;                           // Ctrl+Alt+P O from the iframe
          case 'indexUpload': fIndexUpload(); break;                   // Ctrl+Alt+P X U from the iframe
          case 'indexOnly': fIndexOnly(); break;                       // Ctrl+Alt+P X O from the iframe
          case 'newFile': fNewFile(); break;                           // Ctrl+Alt+P K M from the iframe
          case 'maximizeGroup': vscode.commands.executeCommand('workbench.action.toggleMaximizeEditorGroup'); break; // Ctrl+K Ctrl+M
          case 'cmdPalette': vscode.commands.executeCommand('workbench.action.showCommands'); break; // Ctrl+Shift+P from the iframe
          case 'nav': await fOnNavigate(msg.href); break;
          case 'url': fToChrome({ type: 'setUrl', url: msg.href }); break; // hash jump: address bar only

          case 'edit': {
            const sPlain = String(msg.text == null ? '' : msg.text).replace(/\r?\n/g, ' ');
            const bOk = await fApplyReplace(msg, omModel.fEscapeText(sPlain));
            if (!bOk) { fStatus('edit out of sync — reloading'); fReloadFrame(); }
            else fStatus('edited · unsaved');
            break;
          }
          case 'replace': {
            const bOk = await fApplyReplace(msg, String(msg.text == null ? '' : msg.text));
            if (!bOk) { fStatus('format out of sync — reloading'); fReloadFrame(); }
            else fStatus('formatted · unsaved');
            break;
          }
          case 'structure': {
            const bOk = await fApplyStructure(msg);
            if (bOk) await document.save(); // format + write + reload via onDidSave
            else { fStatus('line op out of sync — reloading'); fReloadFrame(); }
            break;
          }
          case 'sync': {                       // visual click -> move source caret + select line
            const oLoc = oActiveDoc && omModel.fLocate(oActiveDoc.getText(), msg);
            if (!oLoc) break;
            let oEd = fSourceEditor();
            if (!oEd) oEd = await vscode.window.showTextDocument(oActiveDoc.uri, { viewColumn: vscode.ViewColumn.One, preserveFocus: true, preview: false });
            const oStart = oEd.document.positionAt(oLoc.s), oEnd = oEd.document.positionAt(oLoc.e);
            nSuppressSourceSyncUntil = Date.now() + 250;   // don't bounce back as source->visual
            oEd.selection = new vscode.Selection(oStart, oEnd);
            oEd.revealRange(new vscode.Range(oStart, oEnd), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
            break;
          }
          case 'status': fStatus(msg.message); break;
          case 'promptUrl': {   // cmdUrl: prompt via VS Code (window.prompt is blocked in the cross-origin iframe)
            const sHref = await vscode.window.showInputBox({ prompt: 'Preview-link target (href)', value: msg.value || '../dirCor/' });
            if (sHref) fToChrome({ type: 'applyUrl', href: sHref });
            break;
          }
          case 'openRaw': vscode.commands.executeCommand('vscode.openWith', (oActiveDoc || document).uri, 'default'); break;
          case 'bridgeError': console.error('[mcshv bridge]', msg.message); break;
        }
      } catch (err) {
        bSelfEditing = false;
        console.error('[mcshv]', err);
      }
    });

    panel.onDidDispose(() => {
      if (fNavigateVisual === fNavigate) fNavigateVisual = null;   // no visual reuse target once closed
      oSetUriManaged.delete(sKey); oSetUriSaving.delete(sKey);
      oSetAddedKeys.forEach((k) => { oSetUriManaged.delete(k); oSetUriSaving.delete(k); }); // files we retargeted to while browsing
      if (oSyncTimer) clearTimeout(oSyncTimer);
      oChangeSub.dispose(); oSaveSub.dispose(); oSelSub.dispose(); oMsgSub.dispose();
    });
  };

  return { resolveCustomTextEditor };
}

// --- url helpers -----------------------------------------------------------

function fRelPath(document) {
  const oCfg = vscode.workspace.getConfiguration('mcshv');
  const sMarker = String(oCfg.get('docRootFolder') || 'htdocs');
  const sFsPath = document.uri.fsPath.replace(/\\/g, '/');
  const sNeedle = '/' + sMarker.replace(/^\/+|\/+$/g, '') + '/';
  const i = sFsPath.toLowerCase().indexOf(sNeedle.toLowerCase());
  if (i < 0) return null;
  return sFsPath.slice(i + sNeedle.length);
}

function fOrigin() {
  const oCfg = vscode.workspace.getConfiguration('mcshv');
  return String(oCfg.get('serverOrigin') || 'http://localhost').replace(/\/+$/, '');
}

// --- open-by-code helpers --------------------------------------------------

/**
 * Ordered, de-duplicated worldview-root candidates for open-by-code. The current
 * file's root comes first (fast path, preserves today's behaviour); the rest let
 * the command work cold (no current .last.html — e.g. invoked from index.html):
 *   - the active file's own folder (index.html at <root> → <root>);
 *   - each workspace folder, plus its dirMcsh subfolder when present (workspace
 *     opened at dirNodews → resolve inside dirNodews/dirMcsh).
 * fSearchByCode later recurses under whichever of these actually holds the code.
 */
function fRootCandidates(sCur, sCurCode) {
  const a = [];
  const fAdd = (s) => { if (s && !a.some((x) => x.toLowerCase() === s.toLowerCase())) a.push(s); };
  if (sCur) fAdd(fWorldviewRoot(sCur, sCurCode));
  const oEd = vscode.window.activeTextEditor;
  if (oEd && oEd.document.uri.scheme === 'file') fAdd(path.dirname(oEd.document.uri.fsPath));
  for (const oWf of (vscode.workspace.workspaceFolders || [])) {
    const sWf = oWf.uri.fsPath;
    fAdd(sWf);
    const sMcsh = path.join(sWf, 'dirMcsh');
    try { if (fs.existsSync(sMcsh)) fAdd(sMcsh); } catch (e) { /* unreadable → skip */ }
  }
  return a;
}

/**
 * Worldview root (the folder that holds the dir<Cat> folders), inferred from the
 * CURRENT file's path and its code:
 *   <root>/<code>.last.html                         (root-level Mcs, no category)
 *   <root>/dir<Cat>/<code>.last.html                (Mcs)
 *   <root>/dir<Cat>/dirHitp/<code>.last.html         (Hitp)
 */
function fWorldviewRoot(sFsPath, sCode) {
  const sDir = path.dirname(sFsPath);
  if (/^Hitp/i.test(sCode)) return path.dirname(path.dirname(sDir)); // strip dirHitp + dir<Cat>
  const sAlpha = sCode.replace(/^Mcs/i, '').match(/^[A-Za-z]+/);      // has a category?
  return sAlpha ? path.dirname(sDir) : sDir;                          // strip dir<Cat>, else already root
}

/** Category names = dir<Cat> folders under root, minus the 'dir' prefix, longest first. */
function fCategories(sRoot) {
  let a = [];
  try {
    a = fs.readdirSync(sRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory() && /^dir./.test(d.name))
      .map((d) => d.name.slice(3));
  } catch (e) { /* unreadable root → empty */ }
  a.sort((x, y) => y.length - x.length);   // longest match wins (Stnlaw before Stn, TchInf before Tch)
  return a;
}

/**
 * Deterministic path for a code: Mcs → <root>/dir<Cat>/<code>.last.html;
 * Hitp → <root>/dir<Cat>/dirHitp/<code>.last.html; category-less Mcs → <root>/<code>.last.html.
 * The category is the longest known dir<Cat> that prefixes the code's letters
 * (Hitp codes carry extra sub-category letters, e.g. HitpStnEcon → dirStn). null if unknown.
 */
function fPathForCode(sRoot, sCode) {
  const bHitp = /^Hitp/i.test(sCode);
  const sAlpha = (sCode.replace(/^(Mcs|Hitp)/i, '').match(/^[A-Za-z]+/) || [''])[0];
  if (!bHitp && !sAlpha) return path.join(sRoot, sCode + '.last.html');   // e.g. Mcs000000
  const sCat = fCategories(sRoot).find((c) => sAlpha.toLowerCase().indexOf(c.toLowerCase()) === 0);
  if (!sCat) return null;
  const sSub = bHitp ? path.join('dir' + sCat, 'dirHitp') : 'dir' + sCat;
  return path.join(sRoot, sSub, sCode + '.last.html');
}

/** Fallback: recursively find <code>.last.html under root (skipping *.files asset dirs). */
function fSearchByCode(sRoot, sCode) {
  const sTarget = (sCode + '.last.html').toLowerCase();
  const aStack = [sRoot];
  while (aStack.length) {
    const sDir = aStack.pop();
    let aEnt;
    try { aEnt = fs.readdirSync(sDir, { withFileTypes: true }); } catch (e) { continue; }
    for (const oE of aEnt) {
      if (oE.isDirectory()) { if (!/\.files$/i.test(oE.name)) aStack.push(path.join(sDir, oE.name)); }
      else if (oE.name.toLowerCase() === sTarget) return path.join(sDir, oE.name);
    }
  }
  return null;
}

/** File-kind of a document by basename: 'mcs' | 'hitp' | 'none' (view-only). */
function fFileKind(doc) {
  if (!doc) return 'none';
  const sBase = doc.uri.path.split('/').pop() || '';
  if (/^Mcs/i.test(sBase)) return 'mcs';
  if (/^Hitp/i.test(sBase)) return 'hitp';
  return 'none';
}

/** Absolute fs path of the server document-root (up to and incl. the marker). */
function fDocRootBase(document) {
  const oCfg = vscode.workspace.getConfiguration('mcshv');
  const sMarker = String(oCfg.get('docRootFolder') || 'htdocs');
  const sFsPath = document.uri.fsPath.replace(/\\/g, '/');
  const sNeedle = '/' + sMarker.replace(/^\/+|\/+$/g, '') + '/';
  const i = sFsPath.toLowerCase().indexOf(sNeedle.toLowerCase());
  if (i < 0) return null;
  return sFsPath.slice(0, i + sNeedle.length); // e.g. "C:/xampp/htdocs/"
}

/**
 * Reverse of fDisplayUrl: map a page URL back to the workspace file, but only
 * when it is a real, in-doc-root, editable Mcs*.last.html or Hitp*.last.html. Returns a Uri or null
 * (null → treat the page as view-only). Guards origin, path-traversal, pattern.
 */
function fPathFromUrl(href, docRootBase) {
  if (!href || !docRootBase) return null;
  const sOrigin = fOrigin();
  if (href.slice(0, sOrigin.length + 1) !== sOrigin + '/') return null; // external
  let sRel = href.slice(sOrigin.length + 1).split('#')[0].split('?')[0];
  try { sRel = decodeURIComponent(sRel); } catch (e) { return null; }
  sRel = sRel.replace(/\\/g, '/');
  if (/(^|\/)\.\.(\/|$)/.test(sRel)) return null;           // reject .. path traversal
  const sFsPath = docRootBase + sRel;
  if (sFsPath.toLowerCase().indexOf(docRootBase.toLowerCase()) !== 0) return null;
  const sBase = sFsPath.split('/').pop();
  if (!/^(Mcs|Hitp).*\.last\.html$/i.test(sBase)) return null; // only editable Mcs/Hitp pages
  return vscode.Uri.file(sFsPath);
}

/** Clean URL shown in the address bar (no editor flag). */
function fDisplayUrl(document) {
  const sRel = fRelPath(document);
  if (!sRel) return '';
  return `${fOrigin()}/${sRel.split('/').map(encodeURIComponent).join('/')}`;
}

/** URL actually loaded in the iframe (carries ?mcshv=1 so the bridge loads). */
function fLocalhostUrl(document) {
  const sDisp = fDisplayUrl(document);
  return sDisp ? sDisp + '?mcshv=1' : null;
}

/** Clean address-bar URL for an arbitrary fs path (like fDisplayUrl, path-based). */
function fDisplayUrlForPath(sFsPath) {
  const oCfg = vscode.workspace.getConfiguration('mcshv');
  const sMarker = String(oCfg.get('docRootFolder') || 'htdocs');
  const sP = sFsPath.replace(/\\/g, '/');
  const sNeedle = '/' + sMarker.replace(/^\/+|\/+$/g, '') + '/';
  const i = sP.toLowerCase().indexOf(sNeedle.toLowerCase());
  if (i < 0) return '';
  const sRel = sP.slice(i + sNeedle.length);
  return `${fOrigin()}/${sRel.split('/').map(encodeURIComponent).join('/')}`;
}

  // --- webview shell: the browser chrome + iframe ----------------------------

function fBuildShell(webview, url) {
  const sNonce = fMakeNonce();
  const sOrigin = fOrigin();
  const sFrameSrc = [sOrigin, 'http://localhost', 'http://127.0.0.1', 'https://localhost'].join(' ');

  if (!url) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${sNonce}';">
<style>body{font:13px system-ui;padding:20px;color:#ddd;background:#1e1e1e}code{background:#333;padding:1px 5px;border-radius:3px}button{margin-top:8px}</style>
</head><body>
<h3>Mcsh-Visual</h3>
<p>This file isn't under your server document-root, so the live view can't load.</p>
<p>Expected the path to contain <code>/htdocs/</code> (configurable via <code>mcshv.docRootFolder</code> / <code>mcshv.serverOrigin</code>).</p>
<button id="idRaw">Open the raw text editor</button>
<script nonce="${sNonce}">const v=acquireVsCodeApi();document.getElementById('idRaw').onclick=()=>v.postMessage({source:'mcshv-chrome',type:'openRaw'});</script>
</body></html>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${sFrameSrc}; style-src 'unsafe-inline'; script-src 'nonce-${sNonce}';">
<style>
  :root{--bar:#2d2d2d;--bar2:#3a3a3a;--line:#1a1a1a;--fg:#ddd;--accent:#2b6cb0}
  html,body{margin:0 !important;padding:0 !important;height:100%;background:#1e1e1e;overflow:hidden;font:13px system-ui}
  #idChrome{display:flex;align-items:stretch;gap:1px;height:26px;padding:2px 0;background:var(--bar);border-bottom:1px solid var(--line);box-sizing:border-box}
  .clsNavbtn{width:22px;border:0;border-radius:4px;background:transparent;color:var(--fg);cursor:pointer;font-size:13px;line-height:1;display:flex;align-items:center;justify-content:center}
  .clsNavbtn:hover{background:var(--bar2)}
  .clsNavbtn:disabled{opacity:.35;cursor:default;background:transparent}
  /* URL bar: compact (≈ VS Code tab height), grows to fill all remaining width */
  #idUrl{flex:1 1 auto;min-width:120px;align-self:stretch;box-sizing:border-box;border:1px solid var(--line);border-radius:4px;background:#1e1e1e;color:var(--fg);padding:0 8px;font:12px ui-monospace,monospace;outline:none}
  #idUrl:focus{border-color:var(--accent)}
  #idMenuWrap{position:relative;display:flex}
  #idMenu{position:absolute;left:0;top:calc(100% + 2px);min-width:150px;background:#252526;border:1px solid var(--line);border-radius:6px;box-shadow:0 6px 20px rgba(0,0,0,.5);padding:4px;display:none;z-index:20}
  #idMenu.clsOpen{display:block}
  .clsGrp{font:600 10px system-ui;text-transform:uppercase;letter-spacing:.04em;opacity:.55;padding:6px 10px 2px}
  .clsItem{position:relative;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:2px 10px;border-radius:4px;color:var(--fg);cursor:pointer;white-space:nowrap}
  .clsItem:hover{background:var(--accent);color:#fff}
  .clsItem .clsKbd{opacity:.5;font:11px ui-monospace,monospace}
  .clsItem.clsHasSub>.clsCaret{opacity:.6}
  .clsSubmenu{position:absolute;left:100%;top:-5px;min-width:120px;background:#252526;border:1px solid var(--line);border-radius:6px;box-shadow:0 6px 20px rgba(0,0,0,.5);padding:4px;display:none}
  .clsItem.clsHasSub:hover>.clsSubmenu{display:block}
  .clsSep{height:1px;background:var(--line);margin:4px 2px}
  #idStatus{position:absolute;left:8px;bottom:6px;font:11px system-ui;color:#bbb;background:rgba(0,0,0,.45);padding:3px 8px;border-radius:10px;z-index:15;pointer-events:none;opacity:0;transition:opacity .2s}
  #idStatus.clsShow{opacity:1}
  #idHint{position:absolute;left:0;right:0;bottom:0;font:12px system-ui;color:#eee;background:#5a1e1e;padding:8px 12px;display:none;z-index:16}
  #idHint button{color:#fff;background:#333;border:1px solid #555;border-radius:3px;padding:2px 8px;cursor:pointer}
  #idFrameWrap{position:absolute;left:0;right:0;top:26px;bottom:0;background:#1e1e1e}
  iframe{border:0;width:100%;height:100%;display:block}
</style>
</head><body>
<div id="idChrome">
  <button class="clsNavbtn" id="idBack" title="Back">&#8592;</button>
  <button class="clsNavbtn" id="idFwd" title="Forward">&#8594;</button>
  <button class="clsNavbtn" id="idReload" title="Reload">&#8635;</button>
  <div id="idMenuWrap">
    <button class="clsNavbtn" id="idMore" title="Commands">&#8943;</button>
    <div id="idMenu">
      <div class="clsItem clsHasSub">File<span class="clsCaret">&#9656;</span>
        <div class="clsSubmenu">
          <div class="clsItem" title="Create new McsHitp file" data-cmd="cmdNewFile">New McsHitp<span class="clsKbd">Ctrl+Alt+P K M</span></div>
          <div class="clsItem" title="Open file by name" data-cmd="cmdOpen" data-kind="mcs" style="display:none">Open<span class="clsKbd">Ctrl+Alt+P O</span></div>
          <div class="clsItem" data-cmd="cmdSave">Save<span class="clsKbd">Ctrl+S</span></div>
          <div class="clsItem" data-cmd="cmdOpenRaw">Open in source</div>
          <div class="clsItem" title="Index names of current file and upload" data-cmd="cmdIndexUpload" data-kind="edit" style="display:none">Index and upload<span class="clsKbd">Ctrl+Alt+P X U</span></div>
          <div class="clsItem" title="Index names ONLY of current file (no upload)" data-cmd="cmdIndexOnly" data-kind="edit" style="display:none">Index only<span class="clsKbd">Ctrl+Alt+P X O</span></div>
        </div>
      </div>
      <div class="clsItem clsHasSub">Edit<span class="clsCaret">&#9656;</span>
        <div class="clsSubmenu">
          <div class="clsItem clsHasSub">Character<span class="clsCaret">&#9656;</span>
            <div class="clsSubmenu">
              <div class="clsItem" data-cmd="cmdCharArrow1">Arrow 1 &#11106;<span class="clsKbd">Ctrl+Alt+C A 1</span></div>
              <div class="clsItem" data-cmd="cmdCharArrow2">Arrow 2 &#8658;<span class="clsKbd">Ctrl+Alt+C A 2</span></div>
              <div class="clsItem" data-cmd="cmdCharHtmlGt">Html &amp;gt;<span class="clsKbd">Ctrl+Alt+C H G</span></div>
              <div class="clsItem" data-cmd="cmdCharHtmlLt">Html &amp;lt;<span class="clsKbd">Ctrl+Alt+C H L</span></div>
              <div class="clsItem" data-cmd="cmdCharHtmlNbsp">Html &amp;nbsp;<span class="clsKbd">Ctrl+Alt+C H S</span></div>
              <div class="clsItem" data-cmd="cmdCharHitpMain">hitP Main !&#8658;<span class="clsKbd">Ctrl+Alt+C P M</span></div>
            </div>
          </div>
          <div class="clsItem" data-cmd="cmdAddLine">Add line</div>
          <div class="clsItem" data-cmd="cmdRemoveLine">Remove line</div>
        </div>
      </div>
      <div class="clsItem clsHasSub">Format<span class="clsCaret">&#9656;</span>
        <div class="clsSubmenu">
          <div class="clsItem" data-cmd="cmdBold"><b>Bold</b></div>
          <div class="clsItem clsHasSub">Color<span class="clsCaret">&#9656;</span>
            <div class="clsSubmenu">
              <div class="clsItem" data-cmd="cmdRed"><span style="color:#e06">Red</span></div>
              <div class="clsItem" data-cmd="cmdGreen"><span style="color:#3c3">Green</span></div>
            </div>
          </div>
          <div class="clsItem" data-cmd="cmdUrl">Url&#8230;</div>
        </div>
      </div>
    </div>
  </div>
  <input id="idUrl" spellcheck="false" value="">
</div>
<div id="idFrameWrap"><iframe id="idF" data-url="${fEscapeAttr(url)}" src="" allow="clipboard-read; clipboard-write"></iframe></div>
<div id="idStatus"></div>
<div id="idHint"></div>

<script nonce="${sNonce}">
  const vscode = acquireVsCodeApi();
  const f = document.getElementById('idF');
  const url = document.getElementById('idUrl');
  const oMenu = document.getElementById('idMenu');
  const oStatusEl = document.getElementById('idStatus');
  const oHint = document.getElementById('idHint');
  const oBack = document.getElementById('idBack');
  const oFwd = document.getElementById('idFwd');
  let bReady = false, nStatusT = null, nHintT = null;
  const sEditFlag = '?mcshv=1';

  function fToChrome(m){ m.source='mcshv-chrome'; vscode.postMessage(m); }
  // Show items tagged data-kind only for the matching file-kind (mcs/hitp/none);
  // untagged items always show.
  function fApplyMenuKind(sKind){
    document.querySelectorAll('#idMenu [data-kind]').forEach(el => {
      var k = el.getAttribute('data-kind');
      var bShow = (k === sKind) || (k === 'edit' && (sKind === 'mcs' || sKind === 'hitp'));
      el.style.display = bShow ? '' : 'none';
    });
  }
  function fShowStatus(m){ oStatusEl.textContent=m||''; oStatusEl.classList.add('clsShow'); if(nStatusT)clearTimeout(nStatusT); nStatusT=setTimeout(()=>oStatusEl.classList.remove('clsShow'),2600); }
  function fLoadUrl(u){ if(!u)return; if(!/[?&]mcshv=/.test(u)) u += (u.indexOf('?')<0?'?':'&')+'mcshv=1'; f.src=u; }
  // Fresh cache-buster (keeps ?mcshv=1, strips old _r, preserves #hash) so a load that
  // failed while the server was down is never re-served from cache.
  function bust(u){ var h='',i=u.indexOf('#'); if(i>=0){h=u.slice(i);u=u.slice(0,i);} u=u.replace(/[?&]_r=\d+/g,''); if(!/[?&]mcshv=/.test(u)) u+=(u.indexOf('?')<0?'?':'&')+'mcshv=1'; u+=(u.indexOf('?')<0?'?':'&')+'_r='+Date.now(); return u+h; }
  // Re-armable "server down?" hint (shows only if the bridge hasn't announced itself).
  function armHint(){ if(nHintT)clearTimeout(nHintT); nHintT=setTimeout(function(){ if(bReady) return; oHint.style.display='block'; oHint.innerHTML='The live view did not load. Is your local server (XAMPP) running? <button id="idReloadb">Reload</button> <button id="idRawb">Open raw editor</button>'; var r=document.getElementById('idReloadb'); if(r) r.onclick=hardReload; var b=document.getElementById('idRawb'); if(b) b.onclick=function(){ fToChrome({type:'openRaw'}); }; }, 6000); }
  // Reload the iframe from the chrome (no bridge needed) — recovers after the server
  // was started, since the bridge relay can't work when nothing loaded.
  function hardReload(){ bReady=false; oHint.style.display='none'; f.src=bust(f.getAttribute('data-url')||f.src); armHint(); }

  // history.back()/forward() are cross-origin from here (they throw), so relay to
  // the bridge inside the iframe, which is same-origin and can drive its history.
  function fToFrame(type, extra){ try{ f.contentWindow.postMessage(Object.assign({source:'mcshv-host', type}, extra||{}), '*'); }catch(_){} }

  // address bar
  url.addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); fLoadUrl(url.value.trim()); } });
  // Ctrl+S / Cmd+S from the chrome (address bar / toolbar) → save via the host.
  window.addEventListener('keydown', e => {
    if((e.ctrlKey||e.metaKey) && !e.shiftKey && (e.key==='s'||e.key==='S')){ e.preventDefault(); fToChrome({type:'save'}); }
    else if((e.ctrlKey||e.metaKey) && e.shiftKey && (e.key==='p'||e.key==='P')){ e.preventDefault(); fToChrome({type:'cmdPalette'}); }
  });
  // Reload the CURRENT page: the bridge reloads its live location.href — the iframe's
  // src attribute is stale after in-frame navigation, so it would refetch the first file.
  document.getElementById('idReload').onclick = () => { if (bReady) fToFrame('reloadPage', {keepPlace:false}); else hardReload(); };  // ⟳ → bridge reload (honor #hash) or, if no bridge, hard-reload the iframe
  oBack.onclick = () => fToFrame('histBack');
  oFwd.onclick  = () => fToFrame('histFwd');

  // ... menu — never steal focus/selection from the iframe (preventDefault on
  // mousedown), so Format commands still see the caret when the menu is clicked.
  const oMore = document.getElementById('idMore');
  oMore.addEventListener('mousedown', e => e.preventDefault());
  oMenu.addEventListener('mousedown', e => e.preventDefault());
  oMore.onclick = (e) => { e.stopPropagation(); oMenu.classList.toggle('clsOpen'); };
  document.addEventListener('click', () => oMenu.classList.remove('clsOpen'));
  window.addEventListener('blur', () => oMenu.classList.remove('clsOpen'));   // clicking into the iframe closes the menu
  oMenu.addEventListener('click', (e) => {
    const oItem = e.target.closest('.clsItem[data-cmd]');
    if(!oItem) return;
    e.stopPropagation();
    const sCmd = oItem.getAttribute('data-cmd');
    oMenu.classList.remove('clsOpen');
    if(sCmd==='cmdSave') fToChrome({type:'save'});
    else if(sCmd==='cmdOpen') fToChrome({type:'open'});
    else if(sCmd==='cmdNewFile') fToChrome({type:'newFile'});
    else if(sCmd==='cmdIndexUpload') fToChrome({type:'indexUpload'});
    else if(sCmd==='cmdIndexOnly') fToChrome({type:'indexOnly'});
    else if(sCmd==='cmdOpenRaw') fToChrome({type:'openRaw'});
    else fToChrome({type:'cmd', cmd: sCmd});      // cmdBold / cmdRed / cmdGreen / cmdUrl -> bridge
  });

  // relay: iframe(bridge) <-> extension
  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.source === 'mcshv') {
      if (d.type === 'closeMenu') { oMenu.classList.remove('clsOpen'); return; }   // iframe click dismisses the ... menu
      if(d.type==='ready'){ bReady=true; oHint.style.display='none'; }              // bridge loaded → clear the server-down hint
      vscode.postMessage(d);
      return;
    }
    if (d.source === 'mcshv-host') {
      // Post-save reload: do it inside the bridge (location.replace → no new
      // history entry, so Back still steps through pages, not reload-states). The
      // bridge is always present here (we only reload after editing a loaded page).
      if (d.type === 'reload') { fToFrame('reloadPage', {keepPlace:true}); return; }  // post-save/structural → keep edit line
      if (d.type === 'setUrl') { url.value = d.url || ''; return; }
      if (d.type === 'navigate') { fLoadUrl(d.url); return; }   // reuse this tab: load another page
      if (d.type === 'menuKind') { fApplyMenuKind(d.kind); return; }
      if (d.type === 'status') { fShowStatus(d.message); return; }
      try { f.contentWindow.postMessage(d, '*'); } catch(_){}
    }
  });

  fToChrome({type:'ready'});

  // Load the page (cache-busted so a prior server-down failure isn't re-served), and
  // arm the "server down?" hint in case it doesn't come up.
  f.src = bust(f.getAttribute('data-url'));
  armHint();
</script>
</body></html>`;
}

// --- auto-sync viewer chord shortcuts from the user's keybindings.json --------

/** Default path of the user's keybindings.json for this OS (overridable by config). */
function fKeybindingsPath() {
  const oCfg = vscode.workspace.getConfiguration('mcshv');
  const sCustom = oCfg.get('keybindingsPath');
  if (sCustom) return String(sCustom).replace(/\\/g, '/');
  if (process.platform === 'win32' && process.env.APPDATA) {
    return process.env.APPDATA.replace(/\\/g, '/') + '/Code/User/keybindings.json';
  }
  const sHome = os.homedir().replace(/\\/g, '/');
  if (process.platform === 'darwin') return sHome + '/Library/Application Support/Code/User/keybindings.json';
  return sHome + '/.config/Code/User/keybindings.json';
}

/** Strip // and /* *\/ comments (string-aware) and trailing commas → strict JSON. */
function fStripJsonc(sText) {
  let sOut = '', bInStr = false, bEsc = false;
  for (let i = 0; i < sText.length; i++) {
    const c = sText[i], c2 = sText[i + 1];
    if (bInStr) {
      sOut += c;
      if (bEsc) bEsc = false;
      else if (c === '\\') bEsc = true;
      else if (c === '"') bInStr = false;
      continue;
    }
    if (c === '"') { bInStr = true; sOut += c; continue; }
    if (c === '/' && c2 === '/') { while (i < sText.length && sText[i] !== '\n') i++; sOut += '\n'; continue; }
    if (c === '/' && c2 === '*') { i += 2; while (i < sText.length && !(sText[i] === '*' && sText[i + 1] === '/')) i++; i++; continue; }
    sOut += c;
  }
  return sOut.replace(/,(\s*[}\]])/g, '$1');
}

/** Keep only the wrap/insert bindings and shape them for the bridge. */
function fTransformBindings(aBindings) {
  const oSeen = {};
  const aList = [];
  if (!Array.isArray(aBindings)) return aList;
  for (const oB of aBindings) {
    if (!oB || typeof oB.key !== 'string' || !oB.command) continue;
    const sChord = oB.key.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!/^ctrl\+alt\+/.test(sChord)) continue;   // the viewer matcher only starts on ctrl+alt
    if (oSeen[sChord]) continue;                  // first winning binding for a chord
    const oArgs = oB.args || {};
    if (oB.command === 'type' && typeof oArgs.text === 'string') {
      oSeen[sChord] = 1; aList.push({ chord: sChord, kind: 'insert', text: oArgs.text });
    } else if (oB.command === 'editor.action.insertSnippet' && typeof oArgs.snippet === 'string') {
      oSeen[sChord] = 1;
      if (oArgs.snippet.indexOf('${TM_SELECTED_TEXT}') >= 0) aList.push({ chord: sChord, kind: 'wrap', tpl: oArgs.snippet });
      else aList.push({ chord: sChord, kind: 'insert', text: oArgs.snippet });
    }
    // runCommands / findWithArgs / clipboard macros → not representable, skipped.
  }
  return aList;
}

/** Parsed wrap/insert chords from keybindings.json (cached by path+mtime). */
function fReadUserShortcuts() {
  try {
    const sPath = fKeybindingsPath();
    const oStat = fs.statSync(sPath);
    if (sPath === oShortcutsCache.path && oStat.mtimeMs === oShortcutsCache.mtimeMs) return oShortcutsCache.list;
    const aList = fTransformBindings(JSON.parse(fStripJsonc(fs.readFileSync(sPath, 'utf8'))));
    oShortcutsCache = { path: sPath, mtimeMs: oStat.mtimeMs, list: aList };
    return aList;
  } catch (err) {
    console.error('[mcshv] keybindings.json read/parse failed:', err && err.message || err);
    return [];   // bridge keeps its built-in default
  }
}

function fEscapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function fMakeNonce() {
  let s = '';
  const sChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 24; i++) s += sChars.charAt(Math.floor(Math.random() * sChars.length));
  return s;
}

function fDeactivate() {}

module.exports = { activate: fActivate, deactivate: fDeactivate };
