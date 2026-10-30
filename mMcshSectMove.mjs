/*
 * mMcshSectMove.mjs - it moves a-sect-concept into a-new McshFile-concept
 * The MIT License (MIT)
 *
 * Copyright (c) 2026 Kaseluris.Nikos.1959 (hmnSngu)
 * kaseluris.nikos@gmail.com
 * https://synagonism.net/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * DOING: it plans the-move of a-sect-concept X into a-new file, it writes nothing:
 *   - description:: -> idDescription, name:: -> idName, other own paras -> idOverview,
 *   - child-sections -> after idOverview, promoted so the-top ones are h1,
 *   - the-new idDescription has the-current date, then the-old: {2026-10-30} {2026-10-04},
 *   - the-old section keeps ONLY its heading, with a-link to the-new file: (link),
 *   - links to the-moved ids are rewritten in ALL .last.html files (json files NOT).
 * A-failed check throws an-Error, BEFORE any file is written.
 */

import moFs from 'fs'
import moPath from 'path'

const
  rSectOpen = /<section\b[^>]*\bid="([^"]+)"/,
  rCreation = /× Mcsh-creation:\s*\{([0-9-]+)\}/,
  rCreationAll = /× Mcsh-creation:\s*((?:\{[0-9-]+\}\s*)+)/,
  rIdAttr   = /\bid="([^"]+)"/g,
  // a-link with a-fragment: <a href="../dirCor/McshCor000012.last.html#idX">, <a href="#idX">
  rHref     = /href="([^"#]*)#([^"]+)"/g

/**
 * OUTPUT: the-line without a-trailing \r.
 */
function fLineClean(sLineIn) {
  return sLineIn.replace(/\r$/, '')
}

/**
 * DOING: it finds the-lines of a-section.
 * OUTPUT: {nOpen, nHeadEnd, nOwnEnd, nClose}
 */
function fFindSect(aLineIn, sIdIn) {
  const aOpen = []
  aLineIn.forEach((sLine, nL) => {
    if (sLine.match(rSectOpen)?.[1] === sIdIn) aOpen.push(nL)
  })
  if (aOpen.length !== 1) throw new Error(`#${sIdIn} occurs ${aOpen.length} times as <section id>`)
  const nOpen = aOpen[0]

  let nDepth = 0, nClose = -1, nOwnEnd = -1
  for (let nL = nOpen; nL < aLineIn.length; nL++) {
    const nOpenHere = (aLineIn[nL].match(/<section\b/g) ?? []).length
    const nCloseHere = (aLineIn[nL].match(/<\/section>/g) ?? []).length
    if (nL > nOpen && nOwnEnd === -1 && (nOpenHere > 0 || nCloseHere > 0)) nOwnEnd = nL
    nDepth += nOpenHere - nCloseHere
    if (nDepth === 0) { nClose = nL; break }
  }
  if (nClose === -1) throw new Error(`#${sIdIn} has no </section>`)

  let nHeadEnd = -1
  for (let nL = nOpen + 1; nL < nOwnEnd; nL++) {
    if (/<\/h[1-9]>/.test(aLineIn[nL])) { nHeadEnd = nL; break }
  }
  if (nHeadEnd === -1) throw new Error(`#${sIdIn} has no heading`)
  return { nOpen, nHeadEnd, nOwnEnd, nClose }
}

/**
 * DOING: it splits the-own text of a-section in description, name and other paras.
 * OUTPUT: {oDesc, oName, aOther}. oDesc,oName: {sId, aInner, sIndent}.
 */
function fSplitOwn(aLineIn, nFromIn, nToIn, sIdIn) {
  let oDesc = null, oName = null
  const aOther = []
  for (let nL = nFromIn; nL < nToIn; nL++) {
    const sLine = fLineClean(aLineIn[nL])
    if (sLine.trim() === '') continue
    const aPara = sLine.match(/^( *)<p id="([^"]+)">(description|name)::\s*$/)
    if (!aPara) {
      if (/description::|name::/.test(sLine) && !/^\s*<br>/.test(sLine)) {
        throw new Error(`#${sIdIn} has a-description:: or name:: of an-other form, line ${nL + 1}: move it by hand`)
      }
      aOther.push(sLine)
      continue
    }
    const [, sIndent, sIdPara, sKind] = aPara
    let nEnd = nL
    while (nEnd < nToIn && !aLineIn[nEnd].includes('</p>')) nEnd++
    const sLast = nEnd < nToIn ? fLineClean(aLineIn[nEnd]).trim() : ''
    if (sLast !== `<a class="clsHide" href="#${sIdPara}"></a></p>`) {
      throw new Error(`#${sIdPara}: its closing line is not its clsHide-anchor, line ${nEnd + 1}`)
    }
    const oPara = { sId: sIdPara, sIndent, aInner: aLineIn.slice(nL + 1, nEnd).map(fLineClean) }
    if (sKind === 'description') {
      if (oDesc) throw new Error(`#${sIdIn} has 2 description::`)
      oDesc = oPara
    } else {
      if (oName) throw new Error(`#${sIdIn} has 2 name::`)
      oName = oPara
    }
    nL = nEnd
  }
  if (!oName) throw new Error(`#${sIdIn} has no name::, it is not a-sect-concept`)
  return { oDesc, oName, aOther }
}

/**
 * OUTPUT: [{sId, nFrom, nTo}] the-sections of a-file as mMcshNew makes it, without nesting.
 */
function fFindSectFlat(aLineIn) {
  const aoSect = []
  let oSect = null
  aLineIn.forEach((sLine, nL) => {
    const sId = sLine.match(rSectOpen)?.[1]
    if (sId) oSect = { sId, nFrom: nL, nTo: nL }
    if (oSect && sLine.includes('</section>')) {
      oSect.nTo = nL
      aoSect.push(oSect)
      oSect = null
    }
  })
  return aoSect
}

/**
 * OUTPUT: [{sId, aLine}] the-child-sections of a-section, each with its parts.
 *   A-non-blank line between them stays with the-section before it.
 */
function fSplitBlock(aLineIn) {
  const aoBlock = []
  let nDepth = 0
  for (const sLine of aLineIn) {
    const sId = sLine.match(rSectOpen)?.[1]
    if (sId && nDepth === 0) aoBlock.push({ sId, aLine: [] })
    if (aoBlock.length && (nDepth > 0 || sLine.trim() !== '')) aoBlock[aoBlock.length - 1].aLine.push(sLine)
    nDepth += (sLine.match(/<section\b/g) ?? []).length - (sLine.match(/<\/section>/g) ?? []).length
  }
  return aoBlock
}

/**
 * OUTPUT: the-text with its links through fHrefIn(sPath, sFragment), which returns
 *   the-new href or null to keep it, and with the-"name!@McshCor000012#idX" of sFileNakedIn.
 */
function fRewriteLink(sTextIn, fHrefIn, sFileNakedIn, fIdNewIn, sFileNakedNewIn) {
  let sText = sTextIn.replace(rHref, (sAll, sPath, sFragment) => {
    const sHrefNew = fHrefIn(sPath, sFragment)
    return sHrefNew === null ? sAll : `href="${sHrefNew}"`
  })
  if (sText.includes(`!@${sFileNakedIn}#`)) {
    sText = sText.replace(new RegExp(`!@${sFileNakedIn}#([^\\s,<"':]+)`, 'g'), (sAll, sId) => {
      const sIdNew = fIdNewIn(sId)
      return sIdNew ? `!@${sFileNakedNewIn}#${sIdNew}` : sAll
    })
  }
  return sText
}

/**
 * DOING: it plans the-move, it writes nothing.
 * INPUT: oIn: {
 *   sRawOld: the-text of the-old file,
 *   sRawNew: the-text of the-new file, as mMcshNew made it,
 *   sIdSect: the-id of the-section,
 *   sIdNew: the-stem of the-ids of the-new file, sIdSect or an-other,
 *   sFileOld: dirCor/McshCor000012.last.html,
 *   sFileNew: dirCor/McshCor000031.last.html,
 *   sNameMain: the-main-name of the-new file,
 *   oRawOther: {sPath: sRaw} the-other .last.html files of the-worldview }
 * OUTPUT: {sRawOld, sRawNew, oRawOther} with only the-changed other files.
 */
function fPlanSectMove(oIn) {
  const { sIdSect, sIdNew, sFileOld, sFileNew, sNameMain } = oIn
  if (['idOverview', 'idMeta', 'idSupport', 'idHeader'].includes(sIdSect)) {
    throw new Error(`#${sIdSect} is not a-sect-concept`)
  }
  const
    aLine = oIn.sRawOld.split('\n'),
    { nOpen, nHeadEnd, nOwnEnd, nClose } = fFindSect(aLine, sIdSect),
    { oDesc, oName, aOther } = fSplitOwn(aLine, nHeadEnd + 1, nOwnEnd, sIdSect),
    aChild = aLine.slice(nOwnEnd, nClose).map(fLineClean),
    sBaseOld = moPath.posix.basename(sFileOld),
    sBaseNew = moPath.posix.basename(sFileNew),
    sDir = moPath.posix.dirname(sFileOld),
    sHrefDirNew = `../${sDir}/${sBaseNew}`,
    sHrefDirOld = `../${sDir}/${sBaseOld}`,
    sNakedOld = sBaseOld.replace(/\.last\.html$/, ''),
    sNakedNew = sBaseNew.replace(/\.last\.html$/, '')

  // ── the-map of the-moved ids: old -> new ─────────────────────────────────────
  const oMapId = new Map([[sIdSect, 'idOverview']])
  for (const sLine of aLine.slice(nOpen + 1, nHeadEnd + 1)) {
    const sIdHead = sLine.match(/<h[1-9] id="([^"]+)"/)?.[1]
    if (sIdHead) oMapId.set(sIdHead, 'idOverviewH1')
  }
  if (oDesc) oMapId.set(oDesc.sId, 'idDescription')
  oMapId.set(oName.sId, 'idName')

  // the-child-headings move up, the-id carries its level: idXH3 -> idXH1
  let nLevelTop = 99
  for (const sLine of aChild) {
    const aHead = sLine.match(/<h([1-9])\b/)
    if (aHead) nLevelTop = Math.min(nLevelTop, Number(aHead[1]))
  }
  const nDelta = nLevelTop === 99 ? 0 : nLevelTop - 1

  const fIdPrefix = sIdIn =>
    sIdNew !== sIdSect && sIdIn.startsWith(sIdSect) ? sIdNew + sIdIn.slice(sIdSect.length) : sIdIn

  for (const sLine of [...aOther, ...aChild]) {
    for (const aId of sLine.matchAll(rIdAttr)) {
      const sId = aId[1]
      const aHeadId = sLine.match(/<h([1-9]) id="([^"]+)"/)
      const sIdLevel = aHeadId && aHeadId[2] === sId && sId.endsWith(`H${aHeadId[1]}`)
        ? sId.slice(0, -1) + (Number(aHeadId[1]) - nDelta)
        : sId
      oMapId.set(sId, fIdPrefix(sIdLevel))
    }
  }

  // ── the-checks ───────────────────────────────────────────────────────────────
  const sTextOldRest = oIn.sRawOld
  for (const sId of oMapId.keys()) {
    const nCount = sTextOldRest.split(`id="${sId}"`).length - 1
    if (nCount !== 1) throw new Error(`#${sId} occurs ${nCount} times as an-id in ${sBaseOld}`)
  }
  // a-moved section with the-id of a-section of the-new file (irsc, dong, evog, gstr..)
  // takes its place: the-empty section of the-new file is dropped, with its ids.
  const aNew = oIn.sRawNew.split('\n')
  const oSetIdSectMoved = new Set(aChild.flatMap(sLine => {
    const sId = sLine.match(rSectOpen)?.[1]
    return sId ? [oMapId.get(sId)] : []
  }))
  const aoSectDrop = fFindSectFlat(aNew).filter(oSect => oSetIdSectMoved.has(oSect.sId))
  const oSetIdTaken = new Set(aNew
    .filter((sLine, nL) => !aoSectDrop.some(oSect => nL >= oSect.nFrom && nL <= oSect.nTo))
    .flatMap(sLine => [...sLine.matchAll(rIdAttr)].map(aM => aM[1])))
  const aValue = [...oMapId.entries()].filter(([sOld]) =>
    sOld !== sIdSect && sOld !== oDesc?.sId && sOld !== oName.sId && oMapId.get(sOld) !== 'idOverviewH1')
    .map(aE => aE[1])
  for (const sId of aValue) {
    if (oSetIdTaken.has(sId)) throw new Error(`the-id ${sId} is taken in the-new file: give an-other id`)
  }
  if (new Set(aValue).size !== aValue.length) throw new Error('2 moved ids get the-same new id')

  const fIdNewOf = sIdIn => oMapId.get(sIdIn) ?? null

  // ── the-moved text ───────────────────────────────────────────────────────────
  const fHrefMoved = (sPath, sFragment) => {
    const bHere = sPath === '' || moPath.posix.basename(sPath) === sBaseOld
    if (!bHere) return null
    const sIdTo = fIdNewOf(sFragment)
    return sIdTo ? `#${sIdTo}` : `${sHrefDirOld}#${sFragment}`
  }
  const fMoved = sLineIn => fRewriteLink(
    sLineIn
      .replace(rIdAttr, (sAll, sId) => `id="${fIdNewOf(sId) ?? sId}"`)
      .replace(/<(\/?)h([1-9])\b/g, (sAll, sSlash, sLevel) => `<${sSlash}h${Number(sLevel) - nDelta}`),
    fHrefMoved, sNakedOld, fIdNewOf, sNakedNew)

  const aDescIn = (oDesc?.aInner ?? []).map(fMoved)
  // the-old dates, as they are: {2026-10-04} or {2026-10-04} {2020-01-16}
  const sDateOld = aDescIn.join('\n').match(rCreationAll)?.[1].trim() ?? null
  const aDescText = aDescIn.filter(sLine => !rCreation.test(sLine))
  const aNameIn = oName.aInner.map(fMoved)
  const aOtherIn = aOther.map(fMoved)
  const aoBlock = fSplitBlock(aChild.map(fMoved))

  // ── the-new file ─────────────────────────────────────────────────────────────
  const nDescNew = aNew.findIndex(sLine => sLine.includes('<p id="idDescription">description::'))
  const nNameNew = aNew.findIndex(sLine => sLine.includes('<p id="idName">name::'))
  const nNameEnd = aNew.findIndex(sLine => sLine.includes('<a class="clsHide" href="#idName"></a></p>'))
  const nOverEnd = aNew.findIndex((sLine, nL) => nL > nNameEnd && sLine.includes('</section>'))
  if ([nDescNew, nNameNew, nNameEnd, nOverEnd].includes(-1)) throw new Error('the-new file is not as mMcshNew makes it')

  const oSetNameNew = new Set(aNew.slice(nNameNew + 1, nNameEnd).map(sLine => sLine.trim()))
  // a-plain "McshEngl.main," is a-name the-new file has already, on its "main!=informal"
  const aNameAdd = aNameIn.filter(sLine =>
    !oSetNameNew.has(sLine.trim()) && sLine.trim() !== `<br>* McshEngl.${sNameMain},`)
  // bottom-up, so the-indexes above stay right
  for (const oSect of aoSectDrop.slice().sort((oA, oB) => oB.nFrom - oA.nFrom)) {
    const oBlock = aoBlock.find(oB => oB.sId === oSect.sId)
    const aIns = oBlock ? oBlock.aLine : []
    if (oBlock) oBlock.bPlaced = true
    aNew.splice(oSect.nFrom, oSect.nTo - oSect.nFrom + 1, ...aIns)
  }
  const aChildRest = aoBlock.filter(oB => !oB.bPlaced).flatMap(oB => ['', ...oB.aLine])
  if (aChildRest.length) aNew.splice(nOverEnd + 1, 0, ...aChildRest)
  if (aOtherIn.length) aNew.splice(nNameEnd + 1, 0, ...aOtherIn)
  aNew.splice(nNameEnd, 0, ...aNameAdd)
  // the-current date first, then the-old ones
  if (sDateOld) {
    aNew[nDescNew + 1] = aNew[nDescNew + 1].replace(rCreation, (sAll, sDateNow) =>
      sDateOld.startsWith(`{${sDateNow}}`) ? `× Mcsh-creation: ${sDateOld}` : `× Mcsh-creation: {${sDateNow}} ${sDateOld}`)
  }
  if (aDescText.length) aNew.splice(nDescNew + 2, 1, ...aDescText)

  // ── the-old file ─────────────────────────────────────────────────────────────
  // the-old section keeps ONLY its heading, with a-link to the-new file
  const sLink = ` (<a class="clsPreview" href="${sHrefDirNew}#idOverview">link</a>)`
  const aHead = aLine.slice(nOpen + 1, nHeadEnd + 1)
  const nTitle = aHead.findIndex(sLine => /<h[1-9] id="/.test(sLine))
  if (nTitle === -1) throw new Error(`#${sIdSect} has no <h id> heading`)
  aHead[nTitle] = /<\/h[1-9]>/.test(aHead[nTitle])
    ? aHead[nTitle].replace(/\s*(<\/h[1-9]>)/, `${sLink}$1`)
    : aHead[nTitle].replace(/[ \t]*(\r?)$/, `${sLink}$1`)

  const fHrefOldFile = (sPath, sFragment) => {
    const bHere = sPath === '' || moPath.posix.basename(sPath) === sBaseOld
    if (!bHere) return null
    const sIdTo = fIdNewOf(sFragment)
    return sIdTo ? `${sHrefDirNew}#${sIdTo}` : null
  }
  const fRest = aIn => aIn.map(sLine => fRewriteLink(sLine, fHrefOldFile, sNakedOld, fIdNewOf, sNakedNew))
  const aOldNew = [
    ...fRest(aLine.slice(0, nOpen)),
    aLine[nOpen],
    ...aHead,
    ...aLine.slice(nClose),
  ]
  const nAfter = nOpen + 1 + aHead.length + 1
  aOldNew.splice(nAfter, aOldNew.length - nAfter, ...fRest(aOldNew.slice(nAfter)))

  // ── the-other files ──────────────────────────────────────────────────────────
  const fHrefOther = (sPath, sFragment) => {
    if (moPath.posix.basename(sPath) !== sBaseOld) return null
    const sIdTo = fIdNewOf(sFragment)
    return sIdTo ? `${sPath.slice(0, -sBaseOld.length)}${sBaseNew}#${sIdTo}` : null
  }
  const oRawOther = {}
  for (const [sPath, sRaw] of Object.entries(oIn.oRawOther ?? {})) {
    if (!sRaw.includes(sNakedOld)) continue
    const sRawNew = fRewriteLink(sRaw, fHrefOther, sNakedOld, fIdNewOf, sNakedNew)
    if (sRawNew !== sRaw) oRawOther[sPath] = sRawNew
  }

  return { sRawOld: aOldNew.join('\n'), sRawNew: aNew.join('\n'), oRawOther }
}

/**
 * OUTPUT: the-texts {sPath: sRaw} of the-.last.html files under a-dir, without sExceptIn.
 */
function fReadRawOther(sDirIn, sExceptIn) {
  const oRaw = {}
  const fWalk = sDir => {
    for (const oEnt of moFs.readdirSync(sDir, { withFileTypes: true })) {
      const sPath = sDir === '.' ? oEnt.name : `${sDir}/${oEnt.name}`
      if (oEnt.isDirectory()) {
        if (!['node_modules', '.git'].includes(oEnt.name) && !/\.files$/i.test(oEnt.name)) fWalk(sPath)
      } else if (oEnt.name.endsWith('.last.html') && sPath !== sExceptIn) {
        oRaw[sPath] = moFs.readFileSync(sPath, 'utf8')
      }
    }
  }
  fWalk(sDirIn)
  return oRaw
}

export { fPlanSectMove, fReadRawOther }
