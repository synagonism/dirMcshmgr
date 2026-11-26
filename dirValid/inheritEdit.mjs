#!/usr/bin/env node
/*
 * inheritEdit.mjs - the-edits of edit/inheritance (mcsh-visual): renumber, generalize, show-inherited
 * The MIT License (MIT)
 *
 * Copyright (c) 2026 Kaseluris.Nikos.1959 (humnSngu)
 * kaseluris.nikos@gmail.com
 * https://synagonism.net/
 *
 * DOING: it uses the-inheritance model of inheritMcsh.mjs (the-generic chains, the-number space,
 *   the-matching of attributes) and its fixes (titles, followers, order, names, NN_last):
 *   - show: the-numbered attributes a-concept inherits, and which it writes itself;
 *   - renumber: "05_x of M" → 03: x takes 03, the-old 03 04 shift to 04 05 (a-move), the-sections
 *     go in the-new order, the-specifics that inherit these numbers follow;
 *   - generalize: "x of S" is COPIED to a-generic G of S as "NN_x of G" (the-next number of G);
 *     S keeps its section, numbered NN_ (its own refinement); the-own numbers of G's specifics shift.
 *   - number-own | number-generic | last | reorder | delete-empty: the-inheritMcsh fixes of ONE concept
 *     (OWNNONUM+OWNNUM | NONUM+WRONGNUM | LAST | ORDER | EMPTY), the-specifics follow;
 *   - specialize: an-inherited attribute G'NN_x written into the-concept as "NN_x of C";
 *   - rename: an-attribute word, in the-attribute and the-specifics that inherit it;
 *   - go-generic | go-specific: the-targets to go to.
 *   The-plan-… ops write nothing: they say what the-edit will do.
 * INPUT: <sNameDir> --op <op> --file McshDir000000 --id idX (a-section or an-element of it)
 *   [--to NN] [--gen file#id] [--word w]
 * OUTPUT: one JSON line on stdout { bOk, sWhy?, … }; the-edits also in dirValid/inheritEdit.txt.
 */

import moFs from 'fs'
import moPath from 'path'
import { fileURLToPath } from 'url'
import { fFindFile_all, fReadFile, fCheck, fFixableNum, fApplyFix, fApplyOrder, fApplyLast, fDeleteEmpty,
  fCheckTitleName, fApplyTitleName, fFindBlock } from './inheritMcsh.mjs'

const
  aVersion = [
    'inheritEdit.mjs.0-4-0.2026-11-26: specialize-join: every renumbered attribute of a-join it does NOT write, written (specialize), then its Mmn\'NN_last',
    'inheritEdit.mjs.0-3-0.2026-11-26: the-number-space of a-concept (oRes.fFindNumSpace(oNode)): a-join of 2+ generics loses nothing; the-numbers are oSpace.sNum',
    'inheritEdit.mjs.0-2-0.2026-11-25: number-own, number-generic, last, reorder, delete-empty (one concept), specialize, rename, go-generic, go-specific',
    'inheritEdit.mjs.0-1-0.2026-11-25: creation: show, renumber (a-move, specifics follow), generalize (a-copy to the-generic)'
  ],
  sDirScript = moPath.dirname(fileURLToPath(import.meta.url))

const fNum2 = nIn => String(nIn).padStart(2, '0');
// a-formal-name has "_" for space and hyphen (MvrwName01_formal), NOT inside {…} (…)
const fFormal = sIn => String(sIn).trim().split(/(\{[^}]*\}|\([^)]*\))/)
  .map((sPart, nI) => nI % 2 ? sPart : sPart.replace(/&#32;|\s+/g, '_').replace(/-/g, '_')).join('');
const fEsc = sIn => sIn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** OUTPUT: { aoFile, oRes, ooFile } the-whole worldview read and checked. */
function fRead(sRootIn) {
  const aoFile = fFindFile_all(sRootIn).map(fReadFile);
  const oRes = fCheck(aoFile, 3);
  const ooFile = {};
  for (const oFile of aoFile) ooFile[oFile.sNameShort] = oFile;
  return { aoFile, oRes, ooFile };
}

/** OUTPUT: the-node of a-section (or of the-section of an-element) of a-file, or null. */
function fFindNode(ooFileIn, sFileIn, sIdIn) {
  const oFile = ooFileIn[String(sFileIn).replace(/\.last\.html$/, '')];
  if (!oFile) return null;
  const sIdSect = oFile.oNodeById[sIdIn] ? sIdIn : oFile.oSectByElmtId[sIdIn];
  return sIdSect ? oFile.oNodeById[sIdSect] : null;
}

/** OUTPUT: the-attribute section at a-node: itself or its innermost whole that is one (NOT a-tree). */
function fFindAttr(oNodeIn) {
  for (let oN = oNodeIn, nI = 0; oN && nI < 30; oN = oN.oWholeNode, nI++) {
    if (oN.bAttr && !oN.bTree) return oN;
  }
  return null;
}

/** OUTPUT: the-concept at a-node: a-tree → its whole; an-attribute → its whole (the-concept it describes). */
function fFindConcept(oNodeIn) {
  let oN = oNodeIn;
  while (oN && oN.bTree && oN.oWholeNode) oN = oN.oWholeNode;
  if (oN && oN.bAttr && oN.oWholeNode) oN = oN.oWholeNode;
  return oN;
}

const fLabelNode = oN => `${oN.sNameShort}:${oN.nLine} "${oN.sTitle}"`;
const fNumbered = oC => oC.bAttr && oC.sNum && !oC.bTree;

// ── show ─────────────────────────────────────────────────────────────────────
function fShow(oW, oNodeIn) {
  const oC = fFindConcept(oNodeIn);
  const aoChain = oW.oRes.fFindChain(oC);
  const aoSpace = oW.oRes.fFindNumSpace(oC);
  const fPath = oN => oW.ooFile[oN.sNameShort].sPath;
  const oSetOwnMatched = new Set();
  const aoItem = aoSpace.map(({ oGen, oGenAttr, sNum }) => {
    const oOwn = oC.aoChild.find(oA => oA.bAttr && !oA.bTree && oW.oRes.fMatchAttr(oA, [{ oGen, oGenAttr }]));
    if (oOwn) oSetOwnMatched.add(oOwn);
    return { sNum, sWord: oGenAttr.sAttrWord, sGen: oGen.sMain || oGen.sTitle,
      sPathGen: fPath(oGenAttr), sIdGen: oGenAttr.sId,
      sPathOwn: oOwn ? fPath(oOwn) : '', sIdOwn: oOwn ? oOwn.sId : '', sTitleOwn: oOwn ? oOwn.sTitle : '' };
  });
  // the-own attributes of the-concept, NOT inherited
  for (const oA of oC.aoChild) {
    if (!oA.bAttr || oA.bTree || oSetOwnMatched.has(oA)) continue;
    aoItem.push({ sNum: oA.sNum ?? '', sWord: oA.sAttrWord, sGen: '', sPathGen: '', sIdGen: '',
      sPathOwn: fPath(oA), sIdOwn: oA.sId, sTitleOwn: oA.sTitle });
  }
  aoItem.sort((oA, oB) => (oA.sNum || '99') .localeCompare(oB.sNum || '99'));
  return { bOk: true, sConcept: oC.sMain || oC.sTitle, aChain: aoChain.map(oG => oG.sMain || oG.sTitle), aoItem };
}

// ── renumber ─────────────────────────────────────────────────────────────────
/**
 * OUTPUT: { oAttr, oConcept, aoShift [{oAttr, sNumNew}] } | { sWhy }.
 *   ONLY the-own numbers of a-concept move (after its chain's last): an-inherited number is its generic's.
 */
function fPlanRenumber(oW, oNodeIn, sToIn) {
  const oAttr = fFindAttr(oNodeIn);
  if (!oAttr || !oAttr.sNum) return { sWhy: 'no numbered attribute "NN_x of M" here' };
  const oC = oAttr.oWholeNode;
  const aoSpace = oW.oRes.fFindNumSpace(oC);
  const oInh = oW.oRes.fMatchAttr(oAttr, aoSpace);
  if (oInh) return { sWhy: `"${oAttr.sTitle}" is inherited: its number is of ${oInh.oGen.sMain || oInh.oGen.sTitle}'${oInh.oGenAttr.sNum}_${oInh.oGenAttr.sAttrWord} (${oInh.oGenAttr.sNameShort}): renumber it there` };
  const nChainLast = Math.max(0, ...aoSpace.map(oS => Number(oS.sNum)));
  // the-own numbered attributes: NOT the-inherited ones
  const aoNum = oC.aoChild.filter(oA => fNumbered(oA) && !oW.oRes.fMatchAttr(oA, aoSpace));
  const nMax = Math.max(...aoNum.map(oA => Number(oA.sNum)));
  const nFrom = Number(oAttr.sNum), nTo = Number(sToIn);
  if (!(nTo > nChainLast && nTo <= Math.max(nMax, 1))) {
    return { sWhy: `the-number must be ${fNum2(nChainLast + 1)}..${fNum2(nMax)}` + (nChainLast ? ` (01..${fNum2(nChainLast)} are inherited)` : '') };
  }
  if (nTo === nFrom) return { sWhy: `"${oAttr.sTitle}" has ${fNum2(nTo)} already` };
  const aoShift = [{ oAttr, sNumNew: fNum2(nTo) }];
  for (const oA of aoNum) {
    if (oA === oAttr) continue;
    const nN = Number(oA.sNum);
    if (nTo < nFrom && nN >= nTo && nN < nFrom) aoShift.push({ oAttr: oA, sNumNew: fNum2(nN + 1) });
    if (nTo > nFrom && nN > nFrom && nN <= nTo) aoShift.push({ oAttr: oA, sNumNew: fNum2(nN - 1) });
  }
  return { oAttr, oConcept: oC, aoShift };
}

/**
 * DOING: after the-first titles are written (oMovedIn: file#id → old NN), the-followers pass after pass:
 *   an-attribute that had the-old number of a-moved generic-attribute (WRONGNUM), the-own numbers
 *   that collide now (OWNNUM), and with fExtraIn more; then the-order, the-names, NN_last of the-touched.
 * OUTPUT: the-change lines.
 */
function fFollow(sRootIn, oMovedIn, oSetTouchIn, fExtraIn = () => []) {
  const aLine = [];
  let oW = fRead(sRootIn);
  for (let nPass = 0; nPass < 8; nPass++) {
    const aoFollow = oW.oRes.ooIssue['INH-WRONGNUM'].filter(oI => oMovedIn.get(oI.sKeyGen) === oI.oAttr.sNum);
    const aoFollowOwn = [...new Set(oW.oRes.ooIssue['INH-OWNNUM'].filter(oI => oMovedIn.has(oI.sKeyGen)).flatMap(oI => oI.aoShift))];
    const aoFix = fFixableNum([...aoFollow, ...aoFollowOwn, ...fExtraIn(oW)]);
    if (aoFix.length === 0) break;
    for (const oI of aoFix) oMovedIn.set(oI.oAttr.sKey, oI.oAttr.sNum ?? '');
    if (fApplyFix(oW.aoFile, aoFix) === 0) break;
    for (const oI of aoFix.filter(oI2 => oI2.bApplied)) {
      aLine.push(`FOLLOW  ${fLabelNode(oI.oAttr)} → ${oI.sNumNew}_`);
      oSetTouchIn.add(oI.oAttr.sNameShort + '#' + oI.oAttr.sIdWhole);
    }
    oW = fRead(sRootIn);
  }
  // the-order of the-touched concepts
  for (let nPass = 0; nPass < 5; nPass++) {
    const aoDone = fApplyOrder(oW.aoFile, oW.oRes.ooIssue['INH-ORDER'].filter(oI => oSetTouchIn.has(oI.oAttr.sKey)));
    if (aoDone.length === 0) break;
    for (const oI of aoDone) aLine.push(`ORDER   ${fLabelNode(oI.oAttr)}: ${oI.sLabelNew}`);
    oW = fRead(sRootIn);
  }
  // the-names of the-moved attributes: the-title X'NN_y as name, the-old numbers renamed
  const { aoPlan } = fCheckTitleName(oW.aoFile, oN => oMovedIn.has(oN.sKey));
  if (aoPlan.length) {
    fApplyTitleName(aoPlan);
    for (const oP of aoPlan) aLine.push(`NAME    ${fLabelNode(oP.oNode)}: ${oP.aChange.join('; ')}`);
    oW = fRead(sRootIn);
  }
  // NN_last of the-touched concepts
  const aoLast = oW.oRes.ooIssue['INH-LAST'].filter(oI => oSetTouchIn.has(oI.oAttr.sKey));
  if (aoLast.length) {
    fApplyLast(oW.aoFile, aoLast);
    for (const oI of aoLast) aLine.push(`LAST    ${fLabelNode(oI.oAttr)}: ${oI.sLastNew}`);
  }
  return aLine;
}

function fRenumber(sRootIn, oW, oNodeIn, sToIn, bWriteIn) {
  const oPlan = fPlanRenumber(oW, oNodeIn, sToIn);
  if (oPlan.sWhy) return { bOk: false, sWhy: oPlan.sWhy };
  const aChange = oPlan.aoShift.map(oS => `"${oS.oAttr.sTitle}" → ${oS.sNumNew}_`);
  if (!bWriteIn) return { bOk: true, sConcept: oPlan.oConcept.sMain || oPlan.oConcept.sTitle, aChange };
  const oMoved = new Map(oPlan.aoShift.map(oS => [oS.oAttr.sKey, oS.oAttr.sNum]));
  const oSetTouch = new Set([oPlan.oConcept.sKey]);
  fApplyFix(oW.aoFile, oPlan.aoShift);
  const aLine = oPlan.aoShift.map(oS => `NUMBER  ${fLabelNode(oS.oAttr)} → ${oS.sNumNew}_`);
  aLine.push(...fFollow(sRootIn, oMoved, oSetTouch));
  return { bOk: true, aLine };
}

// ── generalize ───────────────────────────────────────────────────────────────
/** OUTPUT: { oAttr, oSpec, oGen, sNum, aoGen } | { sWhy } | { aoGen } (more than one generic: choose). */
function fPlanGeneralize(oW, oNodeIn, sGenIn) {
  const oAttr = fFindAttr(oNodeIn);
  if (!oAttr) return { sWhy: 'no attribute "x of S" here' };
  const oSpec = oAttr.oWholeNode;
  const aoGen = oSpec.aoGeneric.filter(oG => !oG.bTree);
  if (aoGen.length === 0) return { sWhy: `"${oSpec.sMain || oSpec.sTitle}" has no generic` };
  const oSpaceSpec = oW.oRes.fMatchAttr(oAttr, oW.oRes.fFindNumSpace(oSpec));
  if (oSpaceSpec) return { sWhy: `"${oAttr.sTitle}" is inherited already: ${oSpaceSpec.oGen.sMain}'${oSpaceSpec.oGenAttr.sNum}_${oSpaceSpec.oGenAttr.sAttrWord}` };
  const oGen = sGenIn ? aoGen.find(oG => oG.sKey === sGenIn) : aoGen.length === 1 ? aoGen[0] : null;
  if (!oGen) return { aoGen };
  if (!oGen.sMain) return { sWhy: `the generic "${oGen.sTitle}" has no main-name` };
  // the-next number of G: after its own numbers and its chain's
  const nOwn = Math.max(0, ...oGen.aoChild.filter(fNumbered).map(oA => Number(oA.sNum)));
  const nChain = Math.max(0, ...oW.oRes.fFindNumSpace(oGen).map(oS => Number(oS.sNum)));
  return { oAttr, oSpec, oGen, sNum: fNum2(Math.max(nOwn, nChain) + 1) };
}

/**
 * OUTPUT: the-id stem of a-concept's parts: its id, or for the-file concept (idOverview) the-common
 *   start of its sub-section ids (idLOgsmsci, idLOgsmgrmr → idLOgsm).
 */
function fFindStem(oNodeIn) {
  if (oNodeIn.sId !== 'idOverview') return oNodeIn.sId;
  const aId = oNodeIn.aoChild.filter(oC => oC.bAttr && !oC.bTree).map(oC => oC.sId);
  if (aId.length < 2) return 'id';
  let sStem = aId[0];
  for (const sId of aId) while (!sId.startsWith(sStem)) sStem = sStem.slice(0, -1);
  return sStem.length > 2 ? sStem : 'id';
}

/**
 * OUTPUT: the-heading level of a-new attribute of a-concept: the-level of its attribute sections
 *   (the-file concept's are top-level h1), else its own level + 1.
 */
function fFindAttrLevel(sTextIn, oCnptIn) {
  const oChild = oCnptIn.aoChild.find(oA => oA.bAttr && !oA.bTree) ?? oCnptIn.aoChild[0];
  const fLevel = oN => Number((sTextIn.slice(oN.nStart).match(/<h([1-6])\b/) ?? [])[1] ?? 1);
  return oChild ? fLevel(oChild) : Math.min(6, fLevel(oCnptIn) + 1);
}

/** OUTPUT: the-text of the-copy of oAttrIn for G, and its section id. */
function fBuildCopy(oW, oAttrIn, oGenIn, sNumIn) {
  const oFileS = oW.ooFile[oAttrIn.sNameShort], oFileG = oW.ooFile[oGenIn.sNameShort];
  const { nFrom, nTo } = fFindBlock(oFileS.sText, oAttrIn);
  let sBlock = oFileS.sText.slice(nFrom, nTo);
  // the-ids: the-stem of S → the-stem of G (idLOgsmsci → idRlnMpgsci), unique in G's file
  const sIdS = fFindStem(oAttrIn.oWholeNode), sIdG = fFindStem(oGenIn);
  const oMapId = new Map();
  const oSetUsed = new Set(oFileG.oSetId);
  for (const sId of oAttrIn.oSetIdElmt) {
    let sNew = sId.startsWith(sIdS) ? sIdG + sId.slice(sIdS.length) : sIdG + sId.replace(/^id/, '');
    while (oSetUsed.has(sNew)) sNew += 'G';
    oSetUsed.add(sNew);
    oMapId.set(sId, sNew);
  }
  sBlock = sBlock.replace(/\b(id="|href="#)([^"]+)"/g, (sAll, sPre, sId) => oMapId.has(sId) ? `${sPre}${oMapId.get(sId)}"` : sAll);
  // a-link to the-rest of S's file, from G's file
  if (oFileS !== oFileG) {
    const sRel = moPath.relative(moPath.dirname(oFileG.sPath), oFileS.sPath).split(moPath.sep).join('/');
    sBlock = sBlock.replace(/href="#([^"]+)"/g, (sAll, sId) => [...oMapId.values()].includes(sId) ? sAll : `href="${sRel}#${sId}"`);
  }
  // the-heading levels: the-attribute is at the-level of G's attributes
  const nLevelA = Number((sBlock.match(/<h([1-6])\b/) ?? [])[1] ?? 2);
  const nShift = fFindAttrLevel(oFileG.sText, oGenIn) - nLevelA;
  sBlock = sBlock.replace(/<(\/?)h([1-6])\b/g, (sAll, sSlash, sN) => `<${sSlash}h${Math.min(6, Math.max(1, Number(sN) + nShift))}`)
    .replace(/(id="[^"]*H)([1-6])"/g, (sAll, sPre, sN) => `${sPre}${Math.min(6, Math.max(1, Number(sN) + nShift))}"`);
  // the-title "NN_x of G"; its names: G'NN_x, G'x (the-names of S's attribute stay with it)
  const sWord = oAttrIn.sAttrWord.trim();
  sBlock = sBlock.replace(/(<h[1-6]\b[^>]*>)[^\n]*/, `$1${sNumIn}_${sWord} of ${oGenIn.sMain}`);
  const sGm = fFormal(oGenIn.sMain), sWm = fFormal(sWord);
  sBlock = sBlock.replace(/(<p\b[^>]*>name::\n)((?:[ \t]*<br>[^\n]*\n)*)/, (sAll, sHead, sLines) => {
    const sIndent = (sLines.match(/^([ \t]*)<br>/) ?? ['', '    '])[1];
    return `${sHead}${sIndent}<br>* McshEngl.${sGm}'${sNumIn}_${sWm},\n${sIndent}<br>* McshEngl.${sGm}'${sWm},\n`;
  });
  const sIdSect = oMapId.get(oAttrIn.sId);
  return { sBlock, sIdSect };
}

/** OUTPUT: the-offset in G's file where its new attribute goes: after its last numbered attribute. */
function fFindPlaceInGen(oW, oGenIn) {
  const oFileG = oW.ooFile[oGenIn.sNameShort];
  const aoAttr = oGenIn.aoChild.filter(oA => oA.bAttr && !oA.bTree);
  const aoNum = aoAttr.filter(oA => oA.sNum);
  const oAfter = aoNum.length ? aoNum.reduce((oM, oA) => Number(oA.sNum) > Number(oM.sNum) ? oA : oM) : null;
  if (oAfter) return fFindBlock(oFileG.sText, oAfter).nTo;
  // no numbered attribute: before G's first sub-section, else before its </section>
  if (oGenIn.aoChild.length) return fFindBlock(oFileG.sText, oGenIn.aoChild[0]).nFrom;
  const nClose = oGenIn.nEnd - '</section>'.length;
  return oFileG.sText.lastIndexOf('\n', nClose) + 1;
}

function fGeneralize(sRootIn, oW, oNodeIn, sGenIn, bWriteIn) {
  const oPlan = fPlanGeneralize(oW, oNodeIn, sGenIn);
  if (oPlan.sWhy) return { bOk: false, sWhy: oPlan.sWhy };
  if (!oPlan.oGen) {
    return { bOk: true, aoGen: oPlan.aoGen.map(oG => ({ sKey: oG.sKey, sMain: oG.sMain || oG.sTitle, sFile: oG.sNameShort })) };
  }
  const { oAttr, oSpec, oGen, sNum } = oPlan;
  const sMainS = oSpec.sMain || oSpec.sTitle;
  const aChange = [
    `"${oAttr.sTitle}" is copied to ${oGen.sMain} (${oGen.sNameShort}) as "${sNum}_${oAttr.sAttrWord} of ${oGen.sMain}"`,
    `${sMainS} keeps it, numbered ${sNum}_ (and every specific of ${oGen.sMain} with the same attribute)`,
    `the own numbers ${sNum}.. of the specifics of ${oGen.sMain} shift up`];
  if (!bWriteIn) return { bOk: true, sGen: oGen.sMain, sNum, aChange };
  // 1. the-copy into G's file
  const oFileG = oW.ooFile[oGen.sNameShort];
  const { sBlock, sIdSect } = fBuildCopy(oW, oAttr, oGen, sNum);
  const nAt = fFindPlaceInGen(oW, oGen);
  moFs.writeFileSync(oFileG.sPath, oFileG.sText.slice(0, nAt) + sBlock + oFileG.sText.slice(nAt));
  const sKeyNew = oGen.sNameShort + '#' + sIdSect;
  const aLine = [`COPY    ${fLabelNode(oAttr)} → ${oGen.sNameShort} #${sIdSect} "${sNum}_${oAttr.sAttrWord} of ${oGen.sMain}"`];
  // 2. the-specifics: their x gets NN_ (NONUM of the-new attribute), their own numbers shift (OWNNUM)
  const oMoved = new Map([[sKeyNew, '']]);
  // touched: G, S and every concept under G (their NN_last grows with G's)
  const oSetTouch = new Set([oGen.sKey, oSpec.sKey]);
  for (const oFile of oW.aoFile) for (const oN of oFile.aoNode) {
    if (oN.aoGeneric.length && oW.oRes.fFindChain(oN).includes(oGen)) oSetTouch.add(oN.sKey);
  }
  const fExtra = oWNow => oWNow.oRes.ooIssue['INH-NONUM'].filter(oI => oI.sKeyGen === sKeyNew && !oI.bOwn);
  aLine.push(...fFollow(sRootIn, oMoved, oSetTouch, fExtra));
  return { bOk: true, aLine };
}

// ── the-fixes of ONE concept: number-own, number-from-generic, last-update, reorder, delete-empty ──
/** OUTPUT: the-node with key sKeyIn ("file#id") in a-read worldview, or null. */
const fNodeByKey = (oW, sKeyIn) => {
  const [sShort, sId] = sKeyIn.split('#');
  return oW.ooFile[sShort]?.oNodeById[sId] ?? null;
};
// the-issues of a-concept, by kind: its attributes' (NONUM …) or its own (ORDER, LAST)
const fIssueAttr = (oW, sKindIn, sKeyCnptIn) => oW.oRes.ooIssue[sKindIn].filter(oI => oI.oAttr.oWholeNode?.sKey === sKeyCnptIn);
const fIssueSelf = (oW, sKindIn, sKeyCnptIn) => oW.oRes.ooIssue[sKindIn].filter(oI => oI.oAttr.sKey === sKeyCnptIn);
// the-number fixes of a-concept for an-op
const ooNumIssue = {
  'number-own': (oW, sK) => [...fIssueAttr(oW, 'INH-OWNNONUM', sK),
    ...new Set(fIssueAttr(oW, 'INH-OWNNUM', sK).flatMap(oI => oI.aoShift))],
  'number-generic': (oW, sK) => [...fIssueAttr(oW, 'INH-NONUM', sK).filter(oI => !oI.sTaken && !oI.bOwn),
    ...fIssueAttr(oW, 'INH-WRONGNUM', sK)]
};

/**
 * DOING: number-own | number-generic | last | reorder | delete-empty of the-concept at oNodeIn:
 *   the-fixes of inheritMcsh for it alone; with bWriteIn, written, and the-specifics follow a-moved number.
 */
function fFixConcept(sRootIn, oW, oNodeIn, sOpIn, bWriteIn) {
  const oC = fFindConcept(oNodeIn);
  const sK = oC.sKey, sName = oC.sMain || oC.sTitle;
  if (ooNumIssue[sOpIn]) {
    const aoIssue = ooNumIssue[sOpIn](oW, sK);
    if (!aoIssue.length) return { bOk: false, sWhy: `${sName}: nothing to number (${sOpIn})` };
    if (!bWriteIn) return { bOk: true, sConcept: sName, aChange: aoIssue.map(oI => `"${oI.oAttr.sTitle}" → ${oI.sNumNew}_`) };
    const oMoved = new Map(), oSetTouch = new Set([sK]), aLine = [];
    let oWNow = oW;
    for (let nPass = 0; nPass < 8; nPass++) {
      const aoFix = fFixableNum(ooNumIssue[sOpIn](oWNow, sK));
      if (!aoFix.length) break;
      for (const oI of aoFix) oMoved.set(oI.oAttr.sKey, oI.oAttr.sNum ?? '');
      if (fApplyFix(oWNow.aoFile, aoFix) === 0) break;
      for (const oI of aoFix.filter(oI2 => oI2.bApplied)) aLine.push(`NUMBER  ${fLabelNode(oI.oAttr)} → ${oI.sNumNew}_`);
      oWNow = fRead(sRootIn);
    }
    aLine.push(...fFollow(sRootIn, oMoved, oSetTouch));
    return { bOk: true, aLine };
  }
  if (sOpIn === 'last') {
    const aoIssue = fIssueSelf(oW, 'INH-LAST', sK);
    if (!aoIssue.length) return { bOk: false, sWhy: `${sName}: its NN_last is right` };
    if (!bWriteIn) return { bOk: true, sConcept: sName, aChange: aoIssue.map(oI => `${oI.aLastNow.join(', ') || '(none)'} → ${oI.sLastNew || '(removed)'}`) };
    fApplyLast(oW.aoFile, aoIssue);
    return { bOk: true, aLine: aoIssue.map(oI => `LAST    ${fLabelNode(oI.oAttr)}: ${oI.sLastNew}`) };
  }
  if (sOpIn === 'reorder') {
    const aoIssue = fIssueSelf(oW, 'INH-ORDER', sK);
    if (!aoIssue.length) return { bOk: false, sWhy: `${sName}: its attributes are in order` };
    if (!bWriteIn) return { bOk: true, sConcept: sName, aChange: [`the order ${aoIssue[0].sLabel} → by number`] };
    const aLine = [];
    let oWNow = oW;
    for (let nPass = 0; nPass < 5; nPass++) {
      const aoDone = fApplyOrder(oWNow.aoFile, fIssueSelf(oWNow, 'INH-ORDER', sK));
      if (!aoDone.length) break;
      for (const oI of aoDone) aLine.push(`ORDER   ${fLabelNode(oI.oAttr)}: ${oI.sLabelNew}`);
      oWNow = fRead(sRootIn);
    }
    return { bOk: true, aLine };
  }
  if (sOpIn === 'delete-empty') {
    const aoIssue = fIssueAttr(oW, 'INH-EMPTY', sK);
    if (!aoIssue.length) return { bOk: false, sWhy: `${sName}: no empty inherited attribute` };
    if (!bWriteIn) return { bOk: true, sConcept: sName, aChange: aoIssue.map(oI => `delete "${oI.oAttr.sTitle}" (says nothing, inherited from ${oI.sLabel.split('@')[0]})`) };
    const { aoDeleted, aoKept } = fDeleteEmpty(oW.aoFile, aoIssue);
    return { bOk: true, aLine: [...aoDeleted.map(oI => `DELETE  ${fLabelNode(oI.oAttr)}`),
      ...aoKept.map(oI => `KEEP    ${fLabelNode(oI.oAttr)}: ${oI.sKeep}`)] };
  }
  return { bOk: false, sWhy: 'unknown op ' + sOpIn };
}

// ── specialize ───────────────────────────────────────────────────────────────
/**
 * DOING: an-inherited attribute G'NN_x (sKeyGenIn) the-concept does NOT write is written into it:
 *   "NN_x of C" with its names C'NN_x, C'x and a-description:: with the-date, at its number's place.
 */
function fSpecialize(oW, oNodeIn, sKeyGenIn, bWriteIn) {
  const oC = fFindConcept(oNodeIn);
  if (!oC.sMain) return { bOk: false, sWhy: `"${oC.sTitle}" has no main-name` };
  const aoSpace = oW.oRes.fFindNumSpace(oC);
  const oSpace = aoSpace.find(oS => oS.oGenAttr.sKey === sKeyGenIn);
  if (!oSpace) return { bOk: false, sWhy: `${sKeyGenIn} is not an inherited attribute of ${oC.sMain}` };
  const oOwn = oC.aoChild.find(oA => oA.bAttr && !oA.bTree && oW.oRes.fMatchAttr(oA, [oSpace]));
  if (oOwn) return { bOk: false, sWhy: `${oC.sMain} writes it already: "${oOwn.sTitle}"` };
  const { oGen, oGenAttr } = oSpace;
  const sNum = oSpace.sNum, sWord = oGenAttr.sAttrWord.trim();
  const sTitle = `${sNum}_${sWord} of ${oC.sMain}`;
  if (!bWriteIn) return { bOk: true, sConcept: oC.sMain, aChange: [`"${sTitle}" written into ${oC.sMain} (${oC.sNameShort}), from ${oGen.sMain}'${oGenAttr.sNum}_${sWord}`] };
  const oFile = oW.ooFile[oC.sNameShort];
  const sText = oFile.sText;
  // the-id: the-stem of C + the-ending of G's attribute id (idRlnMpgmthd → idLOgsmmthd), unique
  const sStemG = fFindStem(oGen), sStemC = fFindStem(oC);
  let sId = sStemC + (oGenAttr.sId.startsWith(sStemG) ? oGenAttr.sId.slice(sStemG.length) : fFormal(sWord).replace(/\W/g, ''));
  while (oFile.oSetId.has(sId) || oFile.oSetId.has(sId + 'dsn')) sId += 'S';
  const nLevel = fFindAttrLevel(sText, oC);
  const sCm = fFormal(oC.sMain), sWm = fFormal(sWord);
  const sDate = new Date().toISOString().slice(0, 10);
  const sBlock = [
    `  <section id="${sId}">`,
    `  <h${nLevel} id="${sId}H${nLevel}">${sTitle}`,
    `    </h${nLevel}>`,
    `  <p id="${sId}dsn">description::`,
    `    <br>× Mcsh-creation: {${sDate}}`,
    '    <br>· ',
    `    <a class="clsHide" href="#${sId}dsn"></a></p>`,
    `  <p id="${sId}nam">name::`,
    `    <br>* McshEngl.${sCm}'${sNum}_${sWm},`,
    `    <br>* McshEngl.${sCm}'${sWm},`,
    `    <a class="clsHide" href="#${sId}nam"></a></p>`,
    '  </section>', '', ''].join('\n');
  // its place: before the-first numbered attribute with a-bigger number, else after the-last numbered one
  const aoNum = oC.aoChild.filter(fNumbered);
  const oBefore = aoNum.find(oA => Number(oA.sNum) > Number(sNum));
  const oAfter = aoNum.filter(oA => Number(oA.sNum) < Number(sNum)).pop();
  const nAt = oBefore ? fFindBlock(sText, oBefore).nFrom
    : oAfter ? fFindBlock(sText, oAfter).nTo
    : oC.aoChild.length ? fFindBlock(sText, oC.aoChild[0]).nFrom
    : sText.lastIndexOf('\n', oC.nEnd - '</section>'.length) + 1;
  // a-blank line before a-next section; none before the-concept's </section>
  const sBlockAt = /^\s*<section\b/.test(sText.slice(nAt, nAt + 40)) ? sBlock : sBlock.replace(/\n\n$/, '\n');
  moFs.writeFileSync(oFile.sPath, sText.slice(0, nAt) + sBlockAt + sText.slice(nAt));
  return { bOk: true, aLine: [`WRITE   ${oC.sNameShort} #${sId} "${sTitle}" (from ${oGen.sMain}'${oGenAttr.sNum}_${sWord})`], sId, sPath: oFile.sPath };
}

// ── specialize-join ──────────────────────────────────────────────────────────
/**
 * DOING: a-join (a-concept whose generic-tree:: joins 2+ numbered generics) writes every attribute it
 *   inherits with ANOTHER number than its generic's (model'05_mapping_method → 13_mapping_method of modelSyst),
 *   that it does NOT write yet: specialize each; then its Mmn'NN_last.
 */
function fSpecializeJoin(sRootIn, oW, oNodeIn, bWriteIn) {
  const oC = fFindConcept(oNodeIn);
  const sName = oC.sMain || oC.sTitle;
  if (!oC.sMain) return { bOk: false, sWhy: `"${oC.sTitle}" has no main-name` };
  const aoSpace = oW.oRes.fFindNumSpace(oC);
  if (!aoSpace.bJoin) return { bOk: false, sWhy: `${sName} is not a join (its generic-tree:: has fewer than 2 numbered generics)` };
  const fWritten = oE => oC.aoChild.some(oA => oA.bAttr && !oA.bTree && oW.oRes.fMatchAttr(oA, [oE]));
  const aoTodo = aoSpace.filter(oE => oE.sNum !== oE.sNumGen && !fWritten(oE));
  if (!aoTodo.length) return { bOk: false, sWhy: `${sName} writes every renumbered attribute of its join` };
  const aKeyGen = aoTodo.map(oE => oE.oGenAttr.sKey);
  if (!bWriteIn) return { bOk: true, sConcept: sName, aChange: [...aoTodo.map(oE =>
    `"${oE.sNum}_${oE.oGenAttr.sAttrWord.trim()} of ${sName}" from ${oE.oGen.sMain || oE.oGen.sTitle}'${oE.sNumGen}_${oE.oGenAttr.sAttrWord.trim()}`),
    `${sName}'NN_last updated`] };
  const aLine = [];
  let oWNow = oW, sIdFirst = '', sPath = '';
  for (const sKeyGen of aKeyGen) {
    const oNodeNow = fNodeByKey(oWNow, oC.sKey);
    const oOut = fSpecialize(oWNow, oNodeNow, sKeyGen, true);
    if (!oOut.bOk) { aLine.push(`SKIP    ${sKeyGen}: ${oOut.sWhy}`); continue; }
    aLine.push(...oOut.aLine);
    sIdFirst ||= oOut.sId; sPath ||= oOut.sPath;
    oWNow = fRead(sRootIn);
  }
  const oLast = fFixConcept(sRootIn, oWNow, fNodeByKey(oWNow, oC.sKey), 'last', true);
  if (oLast.bOk) aLine.push(...oLast.aLine);
  return { bOk: true, aLine, sId: sIdFirst, sPath };
}

// ── rename ───────────────────────────────────────────────────────────────────
/**
 * DOING: the-word of an-attribute "03_method of G" → "03_way of G", and in every specific that inherits
 *   it with the-same word: the-titles and the-names X'03_method, X'method (formal) of their name::.
 *   An-inherited attribute is renamed at its generic.
 */
function fRename(sRootIn, oW, oNodeIn, sWordIn, bWriteIn) {
  const oAttr = fFindAttr(oNodeIn);
  if (!oAttr) return { bOk: false, sWhy: 'no attribute "x of M" here' };
  const sWordNew = String(sWordIn).trim();
  if (!/^[^\s,!<>'"]+( [^\s,!<>'"]+)*$/.test(sWordNew)) return { bOk: false, sWhy: `"${sWordNew}" is not a name` };
  const oC = oAttr.oWholeNode;
  const oInh = oW.oRes.fMatchAttr(oAttr, oW.oRes.fFindNumSpace(oC));
  if (oInh) return { bOk: false, sWhy: `"${oAttr.sTitle}" is inherited from ${oInh.oGen.sMain}'${oInh.oGenAttr.sNum}_${oInh.oGenAttr.sAttrWord}: rename it there` };
  const sWordOld = oAttr.sAttrWord.trim().replace(/\s+\([^)]*\)$/, '');
  const fNorm = sIn => sIn.toLowerCase().replace(/\s+\([^)]*\)$/, '').trim();
  // the-attribute and its followers: the-same word, in a-concept whose chain has C
  const aoNode = [oAttr];
  for (const oFile of oW.aoFile) for (const oN of oFile.aoNode) {
    if (oN === oAttr || !oN.bAttr || oN.bTree || !oN.oWholeNode || fNorm(oN.sAttrWord) !== fNorm(sWordOld)) continue;
    if (oW.oRes.fFindChain(oN.oWholeNode).includes(oC) && oW.oRes.fMatchAttr(oN, [{ oGen: oC, oGenAttr: oAttr }])) aoNode.push(oN);
  }
  if (!bWriteIn) return { bOk: true, aChange: aoNode.map(oN => `"${oN.sTitle}" → ${oN.sTitle.replace(sWordOld, sWordNew)}`) };
  const sOldF = fEsc(fFormal(sWordOld)), sNewF = fFormal(sWordNew);
  const ooByFile = {};
  for (const oN of aoNode) (ooByFile[oN.sNameShort] ??= []).push(oN);
  const aLine = [];
  for (const [sShort, aoN] of Object.entries(ooByFile)) {
    const oFile = oW.ooFile[sShort];
    let sText = oFile.sText;
    for (const oN of aoN.sort((oA, oB) => oB.nStart - oA.nStart)) {
      let sSect = sText.slice(oN.nStart, oN.nEnd);
      const nSub = sSect.indexOf('<section', 1);
      let sOwn = nSub > 0 ? sSect.slice(0, nSub) : sSect;
      // the-title: the-word after its NN_
      sOwn = sOwn.replace(new RegExp(`(<h[1-6]\\b[^>]*>(?:\\d{2}_)?)${fEsc(sWordOld)}`, 'i'), `$1${sWordNew}`);
      // the-names: X'NN_old, X'old (and as targets !⇒, !=)
      sOwn = sOwn.replace(/<p\b[^>]*>name::[\s\S]*?<\/p>/, sPara =>
        sPara.replace(new RegExp(`'(\\d{2}_)?${sOldF}(?=[,!\\s<])`, 'gi'), `'$1${sNewF}`));
      sSect = sOwn + (nSub > 0 ? sSect.slice(nSub) : '');
      sText = sText.slice(0, oN.nStart) + sSect + sText.slice(oN.nEnd);
      aLine.push(`RENAME  ${fLabelNode(oN)} → ${sWordNew}`);
    }
    moFs.writeFileSync(oFile.sPath, sText);
  }
  return { bOk: true, aLine };
}

// ── go ───────────────────────────────────────────────────────────────────────
/**
 * OUTPUT: { aoTarget [{ sLabel, sDetail, sPath, sId }] }:
 *   go-generic: an-inherited attribute → its generic's; a-concept → its generics;
 *   go-specific: an-attribute → the-same attribute in the-specifics; a-concept → its specifics.
 */
function fGo(oW, oNodeIn, sOpIn) {
  const fT = oN => ({ sLabel: oN.sTitle, sDetail: `${oN.sNameShort}:${oN.nLine}`, sPath: oW.ooFile[oN.sNameShort].sPath, sId: oN.sId });
  const oAttr = fFindAttr(oNodeIn);
  // on the-attribute: the-innermost section is it (a-specific inside it is a-concept)
  const bOnAttr = !!oAttr && oNodeIn === oAttr;
  let aoTarget;
  if (sOpIn === 'go-generic') {
    if (bOnAttr) {
      const oInh = oW.oRes.fMatchAttr(oAttr, oW.oRes.fFindNumSpace(oAttr.oWholeNode));
      if (!oInh) return { bOk: false, sWhy: `"${oAttr.sTitle}" is not inherited` };
      aoTarget = [fT(oInh.oGenAttr)];
    } else {
      const oC = fFindConcept(oNodeIn);
      aoTarget = oC.aoGeneric.filter(oG => !oG.bTree).map(fT);
      if (!aoTarget.length) return { bOk: false, sWhy: `"${oC.sTitle}" has no generic` };
    }
  } else {
    if (bOnAttr) {
      const oC = oAttr.oWholeNode;
      aoTarget = [];
      for (const oFile of oW.aoFile) for (const oN of oFile.aoNode) {
        if (oN === oAttr || !oN.bAttr || oN.bTree || !oN.oWholeNode) continue;
        if (oW.oRes.fFindChain(oN.oWholeNode).includes(oC) && oW.oRes.fMatchAttr(oN, [{ oGen: oC, oGenAttr: oAttr }])) aoTarget.push(fT(oN));
      }
      if (!aoTarget.length) return { bOk: false, sWhy: `no specific writes "${oAttr.sTitle}"` };
    } else {
      const oC = fFindConcept(oNodeIn);
      aoTarget = [];
      for (const oFile of oW.aoFile) for (const oN of oFile.aoNode) if (oN.aoGeneric.includes(oC) && !oN.bTree) aoTarget.push(fT(oN));
      if (!aoTarget.length) return { bOk: false, sWhy: `"${oC.sTitle}" has no specific` };
    }
  }
  return { bOk: true, aoTarget };
}

// ── main ─────────────────────────────────────────────────────────────────────
function fMain() {
  const aArg = process.argv.slice(2);
  const fArg = sName => { const nI = aArg.indexOf(sName); return nI === -1 ? '' : String(aArg[nI + 1] ?? ''); };
  const sRoot = aArg.find((sA, nI) => !sA.startsWith('--') && (nI === 0 || !aArg[nI - 1].startsWith('--')));
  const sOp = fArg('--op');
  if (!sRoot || !sOp) {
    console.log('inheritEdit.mjs - ' + aVersion[0]);
    console.log('USAGE: node dirValid/inheritEdit.mjs <sNameDir> --op show|plan-renumber|renumber|plan-generalize|generalize --file McshDir000000 --id idX [--to NN] [--gen file#id]');
    process.exit(1);
  }
  const oW = fRead(sRoot);
  const oNode = fFindNode(oW.ooFile, fArg('--file'), fArg('--id'));
  let oOut;
  if (!oNode) oOut = { bOk: false, sWhy: `no section #${fArg('--id')} in ${fArg('--file')}` };
  else if (sOp === 'show') oOut = fShow(oW, oNode);
  else if (sOp === 'plan-renumber' || sOp === 'renumber') oOut = fRenumber(sRoot, oW, oNode, fArg('--to'), sOp === 'renumber');
  else if (sOp === 'plan-generalize' || sOp === 'generalize') oOut = fGeneralize(sRoot, oW, oNode, fArg('--gen'), sOp === 'generalize');
  else if (/^(plan-)?(number-own|number-generic|last|reorder|delete-empty)$/.test(sOp)) {
    oOut = fFixConcept(sRoot, oW, oNode, sOp.replace(/^plan-/, ''), !sOp.startsWith('plan-'));
  }
  else if (sOp === 'plan-specialize-join' || sOp === 'specialize-join') oOut = fSpecializeJoin(sRoot, oW, oNode, sOp === 'specialize-join');
  else if (sOp === 'plan-specialize' || sOp === 'specialize') oOut = fSpecialize(oW, oNode, fArg('--gen'), sOp === 'specialize');
  else if (sOp === 'plan-rename' || sOp === 'rename') oOut = fRename(sRoot, oW, oNode, fArg('--word'), sOp === 'rename');
  else if (sOp === 'go-generic' || sOp === 'go-specific') oOut = fGo(oW, oNode, sOp);
  else oOut = { bOk: false, sWhy: 'unknown --op ' + sOp };
  if (oOut.aLine) {
    moFs.writeFileSync(moPath.join(sDirScript, 'inheritEdit.txt'),
      `inheritEdit ${sOp} ${fArg('--file')}#${fArg('--id')}${fArg('--to') ? ' --to ' + fArg('--to') : ''}\n` +
      oOut.aLine.map(sL => '  ' + sL).join('\n') + '\n');
  }
  process.stdout.write(JSON.stringify(oOut) + '\n');
}

try {
  fMain();
} catch (oErr) {
  process.stdout.write(JSON.stringify({ bOk: false, sWhy: String(oErr && oErr.stack || oErr) }) + '\n');
  process.exit(1);
}
