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
  // BEFORE 'attribute': '<Mmn>'attributeChain' lists own + inherited attributes
  { sWord: 'attributeChain', sMark: "'" },
  { sWord: 'specific', sMark: '.' },
  { sWord: 'attribute', sMark: "'", bHoldOpp: true }, // opposites (open/openNo) kept
  { sWord: 'generic', sMark: ':' },
  { sWord: 'whole', sMark: '//' },
  { sWord: 'part', sMark: '/' },
  { sWord: 'parent', sMark: ';;' },
  { sWord: 'child', sMark: ';' }
];

/**
 * DOING: it parses a-source-line as a-trigger-line, as fSptrInsert of mMcsh2.js:
 *   "X'NN_last" (name::) gives X'attribute; the-head "McshEngl.X:generic" of a-generic-tree::
 *   (sParaIdIn ends with 'gntr') gives X'attributeChain.
 * INPUT: sLineIn: "    <br>* Mcs'attribute,", sParaIdIn: the-id of its paragraph ('' unknown)
 * OUTPUT: { sMmn, sMark, sWord, bHoldOpp } or null
 */
function fTrigger(sLineIn, sParaIdIn = '') {
  const aLast = sLineIn.match(/^\s*(?:<br>)?\s*\*\s*(?:McshEngl\.)?(.+?)'\d{2}_last(?=[,\s]|$)/);
  if (aLast) return { sMmn: aLast[1], sMark: "'", sWord: 'attribute', bHoldOpp: true };
  for (const oRel of aoRel) {
    const aM = sLineIn.match(new RegExp('^\\s*(?:<br>)?\\s*\\*\\s*(?:McshEngl\\.)?(.+?)' + fEsc(oRel.sMark) + oRel.sWord + '(?=[,!\\s]|$)'));
    if (!aM) continue;
    const bHead = oRel.sWord === 'generic' && /^\s*(?:<br>)?\s*\*\s*McshEngl\./.test(sLineIn) && sParaIdIn.endsWith('gntr');
    if (bHead) return { sMmn: aM[1], sMark: "'", sWord: 'attributeChain', bHoldOpp: false };
    return { sMmn: aM[1], sMark: oRel.sMark, sWord: oRel.sWord, bHoldOpp: !!oRel.bHoldOpp };
  }
  return null;
}

/** OUTPUT: the-id of the-<p id> paragraph that holds line nLineIn (0-based) of aLineIn, or ''. */
function fParaIdAt(aLineIn, nLineIn) {
  for (let nL = nLineIn; nL >= 0; nL--) {
    const aM = aLineIn[nL].match(/<p\s[^>]*id="([^"]+)"/);
    if (aM) return aM[1];
    if (nL < nLineIn && /<\/p>|<\/?section\b/.test(aLineIn[nL])) return '';
  }
  return '';
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
 * OUTPUT: the-id of the-gntr-paragraph of the-TOP-level section whose <h1> is
 *   "GENERIC-SPECIFIC-TREE of M" (the-file-concept's generic-tree), or ''.
 */
function fGntrOfTopGstr(sTextIn) {
  const aLine = sTextIn.split(/\r?\n/);
  let nDepth = 0, nSectTop = -1;
  for (let nL = 0; nL < aLine.length; nL++) {
    const sLine = aLine[nL];
    const nOpen = (sLine.match(/<section\b/g) || []).length;
    if (nOpen) { if (nDepth === 0) nSectTop = nL; nDepth += nOpen; }
    // its own gntr: inside the-top section, NOT in a-nested one
    if (nDepth === 1 && nSectTop >= 0 && /<h1\b[^>]*>\s*GENERIC-SPECIFIC-TREE\b/.test(sLine)) {
      for (let nP = nL + 1; nP < aLine.length && !/<\/?section\b/.test(aLine[nP]); nP++) {
        const aM = aLine[nP].match(/<p\s[^>]*id="([^"]+gntr)"/);
        if (aM) return aM[1];
      }
    }
    nDepth -= (sLine.match(/<\/section>/g) || []).length;
  }
  return '';
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
/**
 * DOING: the-generic-tree lookups of a-worldview (fGntrOfUrl / fGntrOfLine of mMcsh2.js).
 * INPUT: sRootIn: worldview-root, fTextIn: path -> text of a-page
 * OUTPUT: { fPageText, fGntrOfRef(sStem, sId), fGntrOfLine(sLine, sStemBase) };
 *   a-gntr is { sStem, sId, aLine } or null
 */
function fGntrFinder(sRootIn, fTextIn) {
  const
    oPage = fPageMap(sRootIn),
    fPageText = sStem => oPage[sStem] ? fTextIn(oPage[sStem]) : null;

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
      // the-file-concept's generic-tree is in the-TOP "GENERIC-SPECIFIC-TREE of M" section (h1),
      //   NOT the-first gntr of the-file (McshLag000007: input1 of Hnmdlago comes first),
      //   as mMcsh2.js.27-19-0 fGntrOfUrl
      sG = fGntrOfTopGstr(sText);
      if (!sG) {
        for (const aM of sText.matchAll(/<p\s[^>]*id="([^"]+gntr)"/g)) {
          if (!fHas(aM[1].slice(0, -4) + 'nam')) { sG = aM[1]; break; }
        }
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
  return { fPageText, fGntrOfRef, fGntrOfLine };
}

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
    { fGntrOfLine } = fGntrFinder(sRootIn, fTextIn),
    fClean = s => s.replace(/^\*\s*/, '').replace(/,\s*$/, ''),
    fIsEntity = s => /^\*\s*(\.\.\.\s*)?entity(:generic)?\b/.test(s),
    oSeen = new Set([sStemIn + '#' + aMP[1]]),
    aOut = ['* ==='];
  const fAdd = s => aOut.push('* ' + s + ',');

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
 * DOING: the-lines of "<Mmn>'attributeChain" (bFlatIn false) or of "<Mmn>'attribute" (bFlatIn true):
 *   Node port of fAttrChain of mMcsh2.js. Per generic up ALL its generic-chains (every '==='
 *   group, breadth-first, entity last), the-NUMBERED direct attributes it ADDS:
 *   - the-own attributes are-not shown, but they override;
 *   - the-key of an-attribute is its NUMBER (NN_), NOT its name; nearer wins: an-overridden one
 *     is shown as '* G'NN_x!@ref → S'NN_y,' when the-name differs;
 *   - X'y.z (a-specific of an-attribute), unnumbered attributes and X'NN_last are-not listed.
 *   bFlatIn: ONE list of the-numbered attributes, own and inherited, 01, 02, .. (nearer wins),
 *   then the-other own attributes, alphabetical.
 * INPUT: sRootIn: worldview-root, sMmnIn: 'Mindview', fTextIn: path -> text of a-page
 * OUTPUT: array of lines without indent and <br> (under a-'---' the-caller writes)
 */
function fAttrChain(sRootIn, sMmnIn, bFlatIn, fTextIn) {
  const
    { fPageText, fGntrOfRef, fGntrOfLine } = fGntrFinder(sRootIn, fTextIn),
    aoLevel = [],          // { sHead, aoAttr: [{ sInformal, sRef, sChild, nNum, oBy }] }
    oMapNum = new Map(),   // nNum -> the-attribute of the-concept or a-nearer generic that gives it
    aTail = [];            // '??' lines
  // the-numbered direct attributes of a-name, sorted by number
  function fAttrOf(sNameIn) {
    const sPrefix = sNameIn + "'";
    return fFindRelated(sRootIn, { sMmn: sNameIn, sMark: "'", sWord: 'attribute', bHoldOpp: true }, true)
      .map(function (oA) {
        // the-number NN_; NOT attNNN_ (entity'att001_id): that mirrors the-id, it is-not an-order
        const sChild = oA.sInformal.slice(sPrefix.length), aN = sChild.match(/^(\d+)_/);
        return { sInformal: oA.sInformal, sRef: oA.sRef, sChild, nNum: aN ? Number(aN[1]) : NaN };
      })
      .filter(oA => oA.sChild.indexOf('.') < 0 && !isNaN(oA.nNum) && !/^\d+_last$/.test(oA.sChild))
      .sort((oA, oB) => oA.nNum - oB.nNum || oA.sInformal.localeCompare(oB.sInformal));
  }
  // a-level shows the-numbers it adds, and its attributes a-nearer level overrides (oBy)
  function fAddLevel(sHeadIn, aoAttrIn) {
    const aoKeep = [], aoAdd = [];
    aoAttrIn.forEach(function (oA) {
      const oBy = oMapNum.get(oA.nNum);
      if (!oBy) { aoAdd.push(oA); aoKeep.push(oA); return; }
      // the-same concept under another name is-not an-override
      if (oBy.sRef !== oA.sRef) aoKeep.push(Object.assign({}, oA, { oBy }));
    });
    aoAdd.forEach(oA => { if (!oMapNum.has(oA.nNum)) oMapNum.set(oA.nNum, oA); });
    if (sHeadIn) aoLevel.push({ sHead: sHeadIn, aoAttr: aoKeep });
  }
  // the-concept of a-gntr, as a-'!@' ref: the-gntr id minus 'gntr', or idOverview (a-file-concept)
  function fRefOfGntr(oGIn) {
    const sId = oGIn.sId.replace(/gntr$/, ''), sText = fPageText(oGIn.sStem) || '';
    return oGIn.sStem + (sId && sText.indexOf('id="' + sId + '"') >= 0 ? '#' + sId : '#idOverview');
  }
  // the-first generic line of EVERY '===' group; a-labeled '=== sibling..:' group ends them
  function fGroups(aLineGntrIn) {
    const aOut = [];
    let bInGroup = false;
    for (const sL of aLineGntrIn.map(s => s.replace(/<a class="clsHide"[\s\S]*$/, '').trim())) {
      if (sL.startsWith('===')) { if (sL !== '===') break; bInGroup = true; continue; }
      if (bInGroup && sL.startsWith('*')) { aOut.push(sL); bInGroup = false; }
    }
    return aOut;
  }
  // 'entity' ALONE ('entity,', 'entity!@..', '...entity:generic'), NOT 'entity.bodyNo!@..'
  const fIsEnt = sL => /^\*\s*(\.\.\.\s*)?entity(:generic)?(?=[,!\s]|$)/.test(sL);
  // the-level of a-reached generic-tree: its name is its first line '* McshEngl.X:generic,'
  function fAddGntr(oGIn) {
    const aN = ((oGIn.aLine || []).find(s => /McshEngl\.\S+:generic/.test(s)) || '').match(/McshEngl\.(\S+):generic/);
    if (aN) fAddLevel('=== inherited from ' + aN[1] + ':generic!@' + fRefOfGntr(oGIn), fAttrOf(aN[1]));
  }
  const fGntrOfName = (sNameIn) => {
    const sRef = fNameRef(sRootIn, sNameIn);
    if (!sRef) return null;
    const aR = sRef.split('#');
    return fGntrOfRef(aR[0], aR[1] || 'idOverview');
  };

  // the-own numbers override, NOT shown
  fAddLevel('', fAttrOf(sMmnIn));
  const oStart = fGntrOfName(sMmnIn + ':generic');
  if (!oStart) aTail.push('* ?? (no generic-tree for ' + sMmnIn + ')');
  else {
    // breadth-first over ALL the-generics, so nearer levels come first and win the-numbers;
    //   a-generic reached twice is shown once; entity is shown LAST
    const oSetSeen = new Set([oStart.sStem + '#' + oStart.sId]);
    let aoCurrent = fGroups(oStart.aLine || []).map(sL => ({ sLine: sL, sStemBase: oStart.sStem })), bEntity = false;
    for (let n = 0; n < 30 && aoCurrent.length; n++) {
      const aoNext = [];
      for (const oItem of aoCurrent) {
        if (fIsEnt(oItem.sLine)) { bEntity = true; continue; }
        const oG = fGntrOfLine(oItem.sLine, oItem.sStemBase);
        if (!oG) { aTail.push('* ?? (no generic-tree for ' + oItem.sLine.replace(/^\*\s*/, '').replace(/,\s*$/, '') + ')'); continue; }
        const sKey = oG.sStem + '#' + oG.sId;
        if (oSetSeen.has(sKey)) continue;
        oSetSeen.add(sKey);
        fAddGntr(oG);
        fGroups(oG.aLine || []).forEach(sL => aoNext.push({ sLine: sL, sStemBase: oG.sStem }));
      }
      aoCurrent = aoNext;
    }
    if (bEntity) {
      const oEnt = fGntrOfName('entity:generic');
      if (oEnt && !oSetSeen.has(oEnt.sStem + '#' + oEnt.sId)) fAddGntr(oEnt);
    }
  }

  const fLine = oA => '* ' + oA.sInformal + '!@' + oA.sRef + ',';
  if (bFlatIn) {
    const
      aoNum = [...oMapNum.values()].sort((oA, oB) => oA.nNum - oB.nNum),
      oSetRefNum = new Set(aoNum.map(oA => oA.sRef)),
      aoOther = fFindRelated(sRootIn, { sMmn: sMmnIn, sMark: "'", sWord: 'attribute', bHoldOpp: true })
        .filter(oA => !oSetRefNum.has(oA.sRef) && !/'(attributeChain|last)$/.test(oA.sInformal));
    return aoNum.map(fLine).concat(aTail, aoOther.map(fLine));
  }
  // ordered 01, 02, ..: the-generics from the-farthest (entity) to the-nearest; a-closing '==='
  const aOut = [];
  aoLevel.slice().reverse().forEach(function (oL) {
    aOut.push(oL.sHead);
    if (oL.aoAttr.length === 0) aOut.push('* (nothing added)');
    oL.aoAttr.forEach(function (oA) {
      // the-arrow only when the-nearer one renames it (NOT for the-same NN_name)
      const bRename = oA.oBy && oA.oBy.sChild !== oA.sChild;
      aOut.push('* ' + oA.sInformal + '!@' + oA.sRef + (bRename ? ' → ' + oA.oBy.sInformal : '') + ',');
    });
  });
  return aOut.concat(aTail, ['===']);
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
 * INPUT: sRootIn: worldview-root, oTrigIn: output of fTrigger,
 *   bKeepNumIn: keep the-leading NN_ of the-child (attributeChain shows the-numbers)
 * OUTPUT: array of { sInformal, sRef }, alphabetical
 */
function fFindRelated(sRootIn, oTrigIn, bKeepNumIn = false) {
  const
    sPrefix = oTrigIn.sMmn + oTrigIn.sMark,
    sMarkChar = oTrigIn.sMark[0], // primary char; a-repeat of it is the-nested variant (/ vs //, ; vs ;;)
    // other relation-markers: a-child starting with one belongs to another relation
    rSep = new RegExp('^[' + ".'/:;@".replace(sMarkChar, '') + ']'),
    oByKey = new Map(); // sKey -> { sInformal, sRef, bOpp }: one entry per target-concept
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
      sClean = sPrefix + (bKeepNumIn ? sChild : sChild.replace(/^\d+_/, '')),
      // a-parenthetical in the-child names the-opposite, such as 'conceptNo' with opposite
      // 'logo' written 'conceptNo' then '(logo)'; keep that opposite visible in the-list
      bOpp = /\([^)]+\)/.test(sChild),
      // one line per target-concept; opposite-holding relations keep an X/XNo pair. among
      // same-concept aliases prefer the-canonical opposite-bearing name over an-ordered/plain one
      sKey = oTrigIn.bHoldOpp ? (sRef + (sClean.endsWith('No') ? '#No' : '#')) : sRef;
    const oPrev = oByKey.get(sKey);
    // with bKeepNumIn, among same-concept aliases the-numbered one (X'03_y) beats the-plain one (X'y)
    const bNumBetter = bKeepNumIn && oPrev && bOpp === oPrev.bOpp &&
      /^\d+_/.test(sChild) && !/^\d+_/.test(oPrev.sInformal.slice(sPrefix.length));
    if (!oPrev || (bOpp && !oPrev.bOpp) || bNumBetter) oByKey.set(sKey, { sInformal: sClean, sRef, bOpp });
  });
  return [...oByKey.values()]
    .map(oV => ({ sInformal: oV.sInformal, sRef: oV.sRef }))
    .sort((oA, oB) => oA.sInformal.localeCompare(oB.sInformal));
}

/**
 * DOING: it creates the-lines to insert under a-trigger-line
 * OUTPUT: array of lines: '---' separator, then the-findings, each with <br> in front
 */
function fFormatLines(aoIn, sIndentIn) {
  const aBody = aoIn.length === 0 ? ['* ?? (no finding)'] : aoIn.map(o => '* ' + o.sInformal + '!@' + o.sRef + ',');
  return ['---'].concat(aBody).map(s => sIndentIn + '<br>' + s);
}

module.exports = { fSearchFor, fSearchLines, fTrigger, fParaIdAt, fRefOfLine, fGenericName, fNameRef, fGenericsOfTree, fGntrChain, fAttrChain, fFindRelated, fFormatLines };
