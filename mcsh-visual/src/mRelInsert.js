'use strict';
/*
 * mRelInsert.js — finds the-direct-related concepts of a-relation-line of the-source
 * ('* Mcs'attribute,', '* Mcs:generic,', '* Mcs.specific,', '* Mcs//whole,', '* Mcs/part,',
 * '* Mcs;;parent,', '* Mcs;child,') from the-English name-index.
 *
 * Node port of fSptrInsert / fFindNamidxfile / fSearchName of Mcsmgr/mMcsh2.js:
 * same trigger, same filtering, same output-lines, but read with fs and written
 * into the-source (each line with <br> in front) instead of into the-page.
 */

const fs = require('fs');
const path = require('path');

const fEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const aoRel = [
  { sWord: 'specific', sMark: '.' },
  { sWord: 'attribute', sMark: "'", bHoldOpp: true }, // opposites (open/openNo) kept
  { sWord: 'generic', sMark: ':' },
  { sWord: 'whole', sMark: '//' },
  { sWord: 'part', sMark: '/' },
  { sWord: 'parent', sMark: ';;' },
  { sWord: 'child', sMark: ';' }
];

/**
 * DOING: it parses a-source-line as a-trigger-line
 * INPUT: sLineIn: "    <br>* Mcs'attribute,"
 * OUTPUT: { sMmn, sMark, sWord, bHoldOpp } or null
 */
function fTrigger(sLineIn) {
  for (const oRel of aoRel) {
    const aM = sLineIn.match(new RegExp('^\\s*(?:<br>)?\\s*\\*\\s*(?:McshEngl\\.)?(.+?)' + fEsc(oRel.sMark) + oRel.sWord + '(?=[,!\\s]|$)'));
    if (aM) return { sMmn: aM[1], sMark: oRel.sMark, sWord: oRel.sWord, bHoldOpp: !!oRel.bHoldOpp };
  }
  return null;
}

/**
 * DOING: it finds the-target of a-'!@' reference-line
 * INPUT: sLineIn: "    <br>* Mcs'time!@McshCor000002#idMcstime,"
 * OUTPUT: 'McshCor000002#idMcstime' or null
 */
function fRefOfLine(sLineIn) {
  const aM = sLineIn.match(/^\s*(?:<br>)?\s*\*.*?!@((?:Mcsh|Mcs|Hitp)[^\s,#<]*(?:#[^\s,<]+)?)(?=[,\s<]|$)/);
  return aM ? aM[1] : null;
}

/**
 * DOING: it finds the-name on a-generic of a-generic-tree: '* X:generic,' or '* ...X:generic,'.
 *   Only the-head '* McshEngl.X:generic,' lists generics, so it returns null for it.
 * OUTPUT: 'X:generic' or null
 */
function fGenericName(sLineIn) {
  const aM = sLineIn.match(/^\s*(?:<br>)?\s*\*\s*(?:\.\.\.\s*)?(?!McshEngl\.)([^\s,!]+:generic)(?=[,!\s<]|$)/);
  return aM ? aM[1] : null;
}

/**
 * DOING: it finds the-place of an-exact name in the-English name-index
 * OUTPUT: 'McshCor000011#idSysgntr' or ''
 */
function fNameRef(sRootIn, sNameIn) {
  const aNu = fSearchName(sRootIn, fEsc(sNameIn), 'lagEngl').find(a => a[0] === sNameIn);
  return aNu ? aNu[1].slice(aNu[1].lastIndexOf('/') + 1).replace('.last.html', '') : '';
}

/**
 * DOING: it finds the-generics of a-generic-tree paragraph: the-lines after its first '==='.
 *   A-labeled group ('=== label:') is NOT generics, so it stops there.
 * INPUT: sTextIn: file-text, sIdIn: 'idSysgntr'
 * OUTPUT: array of lines without indent and <br>, such as '* whole:generic,'
 */
function fGenericsOfTree(sTextIn, sIdIn) {
  const
    aLine = sTextIn.split(/\r?\n/),
    sMark = 'id="' + sIdIn + '"',
    aOut = [];
  let n = aLine.findIndex(s => s.indexOf(sMark) >= 0);
  if (n < 0) return aOut;
  let bFound = false;
  for (n++; n < aLine.length; n++) {
    const aM = aLine[n].match(/^\s*<br>(.*?)\s*$/);
    if (!aM) break;
    if (!bFound) { bFound = aM[1] === '==='; continue; }
    if (aM[1].startsWith('===') && aM[1] !== '===') break;
    if (aM[1].startsWith('*') || aM[1] === '===') aOut.push(aM[1]); // not notes ('· ...')
  }
  while (aOut.length && aOut[aOut.length - 1] === '===') aOut.pop();
  return aOut;
}

// the-lines of a-paragraph (html between <br>s), trimmed; null if no such id
function fParaLines(sTextIn, sIdIn) {
  const nId = sTextIn.indexOf('id="' + sIdIn + '"');
  if (nId < 0) return null;
  const nGt = sTextIn.indexOf('>', nId), nEnd = sTextIn.indexOf('</p>', nGt);
  return sTextIn.slice(nGt + 1, nEnd < 0 ? undefined : nEnd).split(/<br\s*\/?>/i).map(s => s.trim());
}

// { sStem: path } of the-Mcsh pages under the-root
function fPageMap(sRootIn) {
  const oOut = {};
  (function fWalk(sDir) {
    for (const oE of fs.readdirSync(sDir, { withFileTypes: true })) {
      if (oE.isDirectory()) { if (!/^(\.git|dirNamidx)$|\.files$/.test(oE.name)) fWalk(path.join(sDir, oE.name)); }
      else if (/^Mcsh.*\.last\.html$/.test(oE.name)) oOut[oE.name.replace(/\.last\.html$/, '')] = path.join(sDir, oE.name);
    }
  })(sRootIn);
  return oOut;
}

/**
 * DOING: it computes the-generic-chain of a-'...entity:generic' line up to entity:
 *   Node port of fGntrChainInsert of Mcsmgr/mMcsh2.js, lines to write in the-source.
 * INPUT:
 *  - sRootIn: worldview-root, sStemIn: current page,
 *  - aLineIn: lines of the-current document, nLineIn: 0-based clicked line,
 *  - fTextIn: path -> text of a-page (an-open document may hold unsaved text)
 * OUTPUT: array of lines without indent and <br>; null if the-line is not in a-generic-tree
 */
function fGntrChain(sRootIn, sStemIn, aLineIn, nLineIn, fTextIn) {
  const sEntTop = 'entity:generic (the-most-generic)';
  // the-paragraph and the-'===' above the-clicked line
  let nSep = -1, nP = nLineIn;
  for (; nP >= 0 && !/<p\s[^>]*id="/.test(aLineIn[nP]); nP--) {
    if (nSep < 0 && /^\s*<br>===\s*$/.test(aLineIn[nP])) nSep = nP;
  }
  const aMP = nP >= 0 ? aLineIn[nP].match(/<p\s[^>]*id="([^"]+)"/) : null;
  if (!aMP || !aMP[1].endsWith('gntr')) return null;

  const
    oPage = fPageMap(sRootIn),
    fPageText = sStem => oPage[sStem] ? fTextIn(oPage[sStem]) : null,
    fClean = s => s.replace(/^\*\s*/, '').replace(/,\s*$/, ''),
    fIsEntity = s => /^\*\s*(\.\.\.\s*)?entity(:generic)?\b/.test(s),
    oSeen = new Set([sStemIn + '#' + aMP[1]]),
    aOut = ['* ==='];
  const fAdd = s => aOut.push('* ' + s + ',');

  // the-gntr-paragraph a-page#id points to: #id..gntr, #id..nam -> ..gntr, #section -> section+gntr,
  // #idOverview -> the-root gntr (the-gntr whose concept has no ..nam paragraph)
  function fGntrOfRef(sStem, sId) {
    const sText = fPageText(sStem);
    if (sText === null) return null;
    const fHas = s => sText.indexOf('id="' + s + '"') >= 0;
    let sG = '';
    if (sId.endsWith('gntr') && fHas(sId)) sG = sId;
    else if (sId.endsWith('nam') && fHas(sId.slice(0, -3) + 'gntr')) sG = sId.slice(0, -3) + 'gntr';
    else if (fHas(sId + 'gntr')) sG = sId + 'gntr';
    else if (sId === 'idOverview') {
      for (const aM of sText.matchAll(/<p\s[^>]*id="([^"]+gntr)"/g)) {
        if (!fHas(aM[1].slice(0, -4) + 'nam')) { sG = aM[1]; break; }
      }
    }
    return sG ? { sStem, sId: sG, aLine: fParaLines(sText, sG) } : null;
  }
  // the-gntr-paragraph a-generic-line points to: <a href>, name!@Ref, X:generic, name
  function fGntrOfLine(sLine, sStemBase) {
    const sL = sLine.replace(/^\*\s*/, '');
    let aM = sL.match(/href="([^"]+)"/);
    if (aM) {
      const aU = aM[1].replace(/&amp;/g, '&').split('#'), sFile = aU[0].slice(aU[0].lastIndexOf('/') + 1);
      return fGntrOfRef(sFile ? sFile.replace(/\.last\.html$/, '') : sStemBase, aU[1] || 'idOverview');
    }
    aM = sL.match(/!@(Mcsh\w+)(?:#(\w+))?/);
    if (aM) return fGntrOfRef(aM[1], aM[2] || 'idOverview');
    const sName = sL.replace(/,.*$/, '').trim();
    const sRef = sName ? fNameRef(sRootIn, sName) : '';
    if (!sRef) return null;
    const aR = sRef.split('#');
    return fGntrOfRef(aR[0], aR[1] || 'idOverview');
  }
  // the-first generic line after '===' of a-gntr-paragraph
  function fLevel1(aLine) {
    const n = aLine.indexOf('===');
    return n < 0 ? '' : (aLine.slice(n + 1).find(s => s.startsWith('*')) || '');
  }

  let sLine = '', sStemBase = sStemIn;
  if (nSep >= 0) {
    const aGroup = aLineIn.slice(nSep + 1, nLineIn).map(s => s.replace(/^\s*<br>/, '').trim());
    sLine = aGroup.find(s => s.startsWith('*')) || '===';
  }
  if (sLine.startsWith('*') && !fIsEntity(sLine)) fAdd(fClean(sLine));
  for (let n = 0; n < 30 && sLine.startsWith('*') && !fIsEntity(sLine); n++) {
    if (!fClean(sLine)) { fAdd('?? (empty generic line in ' + sStemBase + ')'); break; }
    const o = fGntrOfLine(sLine, sStemBase);
    if (!o) { fAdd((n > 0 ? fClean(sLine) + ' ' : '') + '?? (no generic-tree found)'); break; }
    if (oSeen.has(o.sStem + '#' + o.sId)) { fAdd('?? cycle at ' + o.sId); break; }
    oSeen.add(o.sStem + '#' + o.sId);
    if (n > 0) {
      // the-name of the-reached gntr: its first line '* McshEngl.X:generic,'
      const mN = (o.aLine.find(s => /McshEngl\.\S+:generic/.test(s)) || '').match(/McshEngl\.(\S+:generic)/);
      fAdd((mN ? mN[1] : o.sId).replace(/,$/, ''));
    }
    sLine = fLevel1(o.aLine);
    sStemBase = o.sStem;
  }
  if (fIsEntity(sLine) || sLine === '===') fAdd(sEntTop);
  return aOut;
}

/**
 * DOING: it finds the-term of a-'search_for:X.' request (after ':', before '.')
 * OUTPUT: 'Mvre' or null
 */
function fSearchFor(sLineIn) {
  const aM = sLineIn.match(/search_for:([^\s.,<]+)/);
  return aM ? aM[1] : null;
}

/**
 * DOING: it searches the-names that begin with sTermIn, like the-browser name-search
 * OUTPUT: array of lines '* name!@stem#id,' (name cut at its first '!')
 */
function fSearchLines(sRootIn, sTermIn) {
  const aOut = fSearchName(sRootIn, fEsc(sTermIn), 'lagEngl').map(function (aNu) {
    const sName = aNu[0].split('!')[0], sUrl = aNu[1];
    return '* ' + sName + '!@' + sUrl.slice(sUrl.lastIndexOf('/') + 1).replace('.last.html', '') + ',';
  });
  return aOut.length ? aOut : ['* ?? (no finding)'];
}

function fReadJson(sPathIn) {
  return JSON.parse(fs.readFileSync(sPathIn, 'utf8'));
}

function fNamidxfileFull(sRootIn, sIdxfileIn) {
  return path.join(sRootIn, 'dirNamidx', 'dirL' + sIdxfileIn.substring(1, 7), 'namidx.' + sIdxfileIn + '.json');
}

/**
 * DOING: it finds the-namidx-json-file to search a-name-link
 * OUTPUT: name of namidx-file, such as 'lagEngl15omikron'
 */
function fFindNamidxfile(sRootIn, sNameIn, sLagIn, aaNamidxIdxIn) {
  const oFile_Idx = {};
  aaNamidxIdxIn.forEach(a => { if (!a[1].startsWith(';')) oFile_Idx[a[0]] = a[1]; });
  const sCharName = sNameIn.substring(0, 1);
  let sNamidxOut, sNamidxRest;

  for (const sNamidx in oFile_Idx) {
    if (sNamidx.startsWith(sLagIn)) {
      const sIndex = oFile_Idx[sNamidx];
      if (sIndex.indexOf('..') < 0) {
        // index is a-set of chars 'B|b|'
        if (sIndex.indexOf(sCharName) >= 0) { sNamidxOut = sNamidx; break; }
      } else {
        // index is a-sequence of chars 'C..D' or "26000..27000" or "αμ..β"
        const [sIdxFrom, sIdxTo] = sIndex.split('..');
        if (sIdxFrom.length > 1 || sIdxTo.length > 1) {
          if (sNameIn >= sIdxFrom && sNameIn < sIdxTo) { sNamidxOut = sNamidx; break; }
        } else {
          const
            nCharName = sNameIn.codePointAt(0),
            nIdxFrom = Number.isInteger(Number(sIdxFrom)) ? Number(sIdxFrom) : sIdxFrom.codePointAt(0),
            nIdxTo = Number.isInteger(Number(sIdxTo)) ? Number(sIdxTo) : sIdxTo.codePointAt(0);
          if (nCharName >= nIdxFrom && nCharName < nIdxTo) { sNamidxOut = sNamidx; break; }
        }
      }
    }
    // in case where rest-file is reference ('_0')
    if (sNamidx.startsWith(sLagIn + '00')) sNamidxRest = sNamidx;
  }
  if (!sNamidxOut) sNamidxOut = sNamidxRest;
  if (!sNamidxOut.endsWith('_0')) return sNamidxOut;
  return fFindNamidxfile(sRootIn, sNameIn, sLagIn, fReadJson(fNamidxfileFull(sRootIn, sNamidxOut)));
}

/**
 * DOING: it searches for the-names that begin with sNameIn (regex), case insensitive
 * OUTPUT: array of name-link-array [[name, link]]
 */
function fSearchName(sRootIn, sNameIn, sLagIn) {
  const
    aaRoot = fReadJson(path.join(sRootIn, 'dirNamidx', 'namidx.lagRoot.json')),
    aJson = fReadJson(fNamidxfileFull(sRootIn, fFindNamidxfile(sRootIn, sNameIn, sLagIn, aaRoot))),
    rName = new RegExp('^' + sNameIn, 'i');
  return aJson.slice(1).filter(a => rName.test(a[0]));
}

/**
 * DOING: it finds the-names '<Mmn><mark><child>' of a-relation, ONE level only
 * INPUT: sRootIn: worldview-root, oTrigIn: output of fTrigger
 * OUTPUT: array of { sInformal, sRef }, alphabetical
 */
function fFindRelated(sRootIn, oTrigIn) {
  const
    sPrefix = oTrigIn.sMmn + oTrigIn.sMark,
    sMarkChar = oTrigIn.sMark[0], // primary char; a-repeat of it is the-nested variant (/ vs //, ; vs ;;)
    // other relation-markers: a-child starting with one belongs to another relation
    rSep = new RegExp('^[' + ".'/:;@".replace(sMarkChar, '') + ']'),
    aoOut = [],
    oSeen = new Set();
  fSearchName(sRootIn, fEsc(oTrigIn.sMmn) + fEsc(oTrigIn.sMark), 'lagEngl').forEach(function (aNu) {
    const sName = aNu[0], sUrl = aNu[1];
    if (!sName.startsWith(sPrefix)) return;
    let sChild = sName.slice(sPrefix.length);
    const nR = sChild.search(/!(⇒|=|~|⇨)/); // cut at main-name/translation/pos/other-main
    if (nR >= 0) sChild = sChild.slice(0, nR);
    sChild = sChild.trim();
    if (!sChild || sChild === oTrigIn.sWord) return;
    if (sChild.indexOf(sMarkChar) >= 0) return; // deeper / nested variant (// or ;;)
    if (rSep.test(sChild)) return;              // starts with another relation-marker
    const
      sHash = sUrl.indexOf('#') >= 0 ? sUrl.slice(sUrl.indexOf('#')) : '',
      sFile = sUrl.split('#')[0],
      sRef = sFile.slice(sFile.lastIndexOf('/') + 1).replace(/\.last\.html$/, '') + sHash,
      // full relation-name (only a-leading NNN_ ordering-number removed)
      sClean = sPrefix + sChild.replace(/^\d+_/, ''),
      // one line per target-concept; opposite-holding relations keep an X/XNo pair
      sKey = oTrigIn.bHoldOpp ? (sRef + (sClean.endsWith('No') ? '#No' : '#')) : sRef;
    if (oSeen.has(sKey)) return;
    oSeen.add(sKey);
    aoOut.push({ sInformal: sClean, sRef });
  });
  return aoOut.sort((oA, oB) => oA.sInformal.localeCompare(oB.sInformal));
}

/**
 * DOING: it creates the-lines to insert under a-trigger-line
 * OUTPUT: array of lines: '---' separator, then the-findings, each with <br> in front
 */
function fFormatLines(aoIn, sIndentIn) {
  const aBody = aoIn.length === 0 ? ['* ?? (no finding)'] : aoIn.map(o => '* ' + o.sInformal + '!@' + o.sRef + ',');
  return ['---'].concat(aBody).map(s => sIndentIn + '<br>' + s);
}

module.exports = { fSearchFor, fSearchLines, fTrigger, fRefOfLine, fGenericName, fNameRef, fGenericsOfTree, fGntrChain, fFindRelated, fFormatLines };
