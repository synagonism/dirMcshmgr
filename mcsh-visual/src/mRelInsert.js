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

module.exports = { fTrigger, fRefOfLine, fFindRelated, fFormatLines };
