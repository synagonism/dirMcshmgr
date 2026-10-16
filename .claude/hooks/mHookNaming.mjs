/*
 * mHookNaming.mjs - Claude Code PostToolUse hook: checks the type-prefix
 *   naming convention (CLAUDE.md) in edited .js/.mjs files.
 *
 * INPUT: hook JSON on stdin {tool_name, tool_input:{file_path, new_string, content, edits}}
 * OUTPUT: exit 0 = ok, exit 2 + stderr = violations (fed back to Claude).
 *
 * checks declared names: const/let/var, function names and params, arrow params.
 * for Edit only names that appear in the new text are reported,
 * so legacy names elsewhere in the file are not flagged.
 */

import moFs from 'fs'

const
  // prefix: s a o n b f r, nested ao/oo (array/object of objects), mo (module object),
  // or a bare prefix letter as scratch name (n, s, a)
  rPrefix = /^((?:[ao]*[saonbfr]|mo)[A-Z0-9_]|[saonbfr]$)/,
  // Mcs domain tokens kept verbatim
  rDomain = /^(Mcs|lag|id)[A-Z]/,
  oSetExempt = new Set(['i', 'j', 'k', '_']),
  rIdent = /[A-Za-z_$][A-Za-z0-9_$]*/y,
  oSetKeyword = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of',
    'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await'])

let sInput = ''
process.stdin.on('data', sChunk => sInput += sChunk)
process.stdin.on('end', fMain)

function fMain() {
  let oHook
  try { oHook = JSON.parse(sInput) } catch (e) { process.exit(0) }
  const
    oIn = oHook.tool_input || {},
    sFile = oIn.file_path || ''
  if (!/\.(m?js)$/i.test(sFile) || !moFs.existsSync(sFile)) process.exit(0)

  const
    sCode = fBlank(moFs.readFileSync(sFile, 'utf8')),
    aoName = fCollect(sCode)
  let sNew = null
  if (oHook.tool_name === 'Edit') sNew = oIn.new_string || ''
  else if (oHook.tool_name === 'MultiEdit')
    sNew = (oIn.edits || []).map(oE => oE.new_string).join('\n')

  const
    oSetSeen = new Set(),
    aBad = []
  for (const oName of aoName) {
    const sName = oName.sName
    if (oSetSeen.has(sName)) continue
    oSetSeen.add(sName)
    if (rPrefix.test(sName) || rDomain.test(sName) || oSetExempt.has(sName)) continue
    if (sNew !== null && !new RegExp('(^|[^A-Za-z0-9_$])' + sName.replace(/\$/g, '\\$')
        + '([^A-Za-z0-9_$]|$)').test(sNew)) continue
    aBad.push(`  line ${oName.nLine}: '${sName}' (${oName.sKind})`)
  }
  const bClass = /(^|[^A-Za-z0-9_$.])class\s+[A-Za-z_$]/.test(sNew === null ? sCode : fBlank(sNew))

  if (aBad.length === 0 && !bClass) process.exit(0)
  let sMsg = `Naming convention (CLAUDE.md) violations in ${sFile}:\n`
  if (aBad.length) sMsg += aBad.join('\n') + '\n'
    + '  -> use a type prefix: s string, a array, ao array-of-objects, o object/Map,'
    + ' n number, b boolean, f function, r regex (e.g. sName, aoItem, fRead).\n'
  if (bClass) sMsg += '  -> "class" is used; the project writes JavaScript without class.\n'
  process.stderr.write(sMsg)
  process.exit(2)
}

// replaces comments, strings, templates and regex literals with spaces, keeps newlines
function fBlank(sSrc) {
  const aOut = sSrc.split('')
  let n = 0, sPrev = ''
  const fWipe = (nFrom, nTo) => {
    for (let nI = nFrom; nI < nTo && nI < aOut.length; nI++)
      if (aOut[nI] !== '\n') aOut[nI] = ' '
  }
  while (n < sSrc.length) {
    const s1 = sSrc[n], s2 = sSrc.substr(n, 2)
    if (s2 === '//') {
      let nE = sSrc.indexOf('\n', n); if (nE < 0) nE = sSrc.length
      fWipe(n, nE); n = nE; continue
    }
    if (s2 === '/*') {
      let nE = sSrc.indexOf('*/', n + 2); nE = nE < 0 ? sSrc.length : nE + 2
      fWipe(n, nE); n = nE; continue
    }
    if (s1 === '"' || s1 === "'" || s1 === '`') {
      let nE = n + 1
      while (nE < sSrc.length && sSrc[nE] !== s1) {
        if (sSrc[nE] === '\\') nE++
        else if (s1 !== '`' && sSrc[nE] === '\n') break
        nE++
      }
      fWipe(n, nE + 1); n = nE + 1; sPrev = 'x'; continue
    }
    if (s1 === '/' && (sPrev === '' || /[(,=:[!&|?{};+\-*%<>~^]/.test(sPrev) || sPrev === 'k')) {
      let nE = n + 1, bInClass = false
      while (nE < sSrc.length && sSrc[nE] !== '\n') {
        if (sSrc[nE] === '\\') nE++
        else if (sSrc[nE] === '[') bInClass = true
        else if (sSrc[nE] === ']') bInClass = false
        else if (sSrc[nE] === '/' && !bInClass) break
        nE++
      }
      nE++
      while (nE < sSrc.length && /[a-z]/.test(sSrc[nE])) nE++
      fWipe(n, nE); n = nE; sPrev = 'x'; continue
    }
    if (/[A-Za-z_$]/.test(s1)) {
      rIdent.lastIndex = n
      const sWord = rIdent.exec(sSrc)[0]
      sPrev = oSetKeyword.has(sWord) ? 'k' : 'x'
      n += sWord.length; continue
    }
    if (!/\s/.test(s1)) sPrev = s1
    n++
  }
  return aOut.join('')
}

// collects declared names [{sName, nLine, sKind}] from blanked code
function fCollect(sCode) {
  const
    aoName = [],
    fLine = nPos => sCode.slice(0, nPos).split('\n').length,
    fAdd = (sName, nPos, sKind) => aoName.push({sName, nLine: fLine(nPos), sKind})

  // function declarations / expressions and their params
  const rFunction = /\bfunction\b\s*\*?\s*([A-Za-z_$][\w$]*)?\s*\(([^)]*)\)/g
  let aM
  while ((aM = rFunction.exec(sCode))) {
    if (aM[1]) fAdd(aM[1], aM.index, 'function')
    fParams(aM[2], aM.index + aM[0].indexOf('('), 'param')
  }
  // arrow params: (a, b) => / x =>
  const rArrow = /(?:\(([^()]*)\)|\b([A-Za-z_$][\w$]*))\s*=>/g
  while ((aM = rArrow.exec(sCode))) {
    if (aM[1] !== undefined) fParams(aM[1], aM.index, 'param')
    else fAdd(aM[2], aM.index, 'param')
  }
  // const / let / var declarator lists
  const rDecl = /\b(const|let|var)\b/g
  while ((aM = rDecl.exec(sCode))) fDeclList(rDecl.lastIndex, aM[1])
  return aoName

  function fParams(sList, nPos, sKind) {
    for (const sPart of fSplitTop(sList)) fPattern(sPart.split('=')[0], nPos, sKind)
  }

  // names in a binding pattern: x | {a, b: c, ...d} | [a, , b]
  function fPattern(sPat, nPos, sKind) {
    sPat = sPat.trim().replace(/^\.\.\./, '')
    if (!sPat) return
    if (sPat[0] === '{' || sPat[0] === '[') {
      const sInner = sPat.slice(1, sPat.lastIndexOf(sPat[0] === '{' ? '}' : ']'))
      for (let sPart of fSplitTop(sInner)) {
        sPart = sPart.split(/=(?!>)/)[0]
        if (sPat[0] === '{' && sPart.includes(':')) sPart = sPart.slice(sPart.indexOf(':') + 1)
        fPattern(sPart, nPos, sKind)
      }
      return
    }
    const aId = /^[A-Za-z_$][\w$]*$/.exec(sPat)
    if (aId) fAdd(aId[0], nPos, sKind)
  }

  // reads declarators after const/let/var until the statement ends
  function fDeclList(nPos, sKind) {
    while (true) {
      while (/\s/.test(sCode[nPos] || '')) nPos++
      const nStart = nPos
      // binding: identifier or pattern
      if (sCode[nPos] === '{' || sCode[nPos] === '[') nPos = fSkipGroup(nPos)
      else {
        rIdent.lastIndex = nPos
        const aId = rIdent.exec(sCode)
        if (!aId) return
        nPos += aId[0].length
      }
      fPattern(sCode.slice(nStart, nPos), nStart, sKind)
      // initializer: skip to top-level ',' (next declarator) or end of statement
      let nDepth = 0
      for (; nPos < sCode.length; nPos++) {
        const s1 = sCode[nPos]
        if ('([{'.includes(s1)) nDepth++
        else if (')]}'.includes(s1)) { if (--nDepth < 0) return }
        else if (nDepth === 0 && s1 === ',') { nPos++; break }
        else if (nDepth === 0 && s1 === ';') return
        else if (nDepth === 0 && s1 === '\n' && fIsStatementEnd(nPos)) return
      }
      if (nPos >= sCode.length) return
    }
  }

  // ASI heuristic: a newline ends the statement unless an operator joins the lines
  function fIsStatementEnd(nPos) {
    const
      sBefore = sCode.slice(0, nPos).trimEnd(),
      sAfter = sCode.slice(nPos).trimStart(),
      sLast = sBefore[sBefore.length - 1] || '',
      sNext = sAfter[0] || ''
    if (/[,=+\-*/%&|^!?:<>~(\[{.]/.test(sLast)) return false
    if (/^[,=+\-*/%&|^?:.)\]}]/.test(sNext) && !/^(\+\+|--)/.test(sAfter)) return false
    return true
  }

  function fSkipGroup(nPos) {
    let nDepth = 0
    for (; nPos < sCode.length; nPos++) {
      if ('([{'.includes(sCode[nPos])) nDepth++
      else if (')]}'.includes(sCode[nPos]) && --nDepth === 0) return nPos + 1
    }
    return nPos
  }
}

// splits on top-level commas
function fSplitTop(sList) {
  const aPart = []
  let nDepth = 0, sCur = ''
  for (const s1 of sList) {
    if ('([{'.includes(s1)) nDepth++
    else if (')]}'.includes(s1)) nDepth--
    if (s1 === ',' && nDepth === 0) { aPart.push(sCur); sCur = '' }
    else sCur += s1
  }
  aPart.push(sCur)
  return aPart
}
