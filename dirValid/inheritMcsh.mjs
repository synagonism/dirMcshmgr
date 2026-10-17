#!/usr/bin/env node
/*
 * inheritMcsh.mjs - it checks the-inheritance of attributes from generic to specific concepts
 * The MIT License (MIT)
 *
 * Copyright (c) 2026 Kaseluris.Nikos.1959 (humnSngu)
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
 * DOING: it checks that the-attributes of a-specific line up with the-numbered
 *   attributes of its generic, as "02_cause of disease" → "02_cause of DssInfectious".
 *   - a-concept is a-section; its attributes are its part-sections "[NN_]attr of M",
 *     its specifics are its part-sections "M.specific" and the-sections
 *     its specific-tree:: links to; a-generic is also found from generic-tree:: links.
 *   - a-specific-attribute matches a-generic-attribute by its attr-word or by
 *     the-attr-words of its names (McshEngl.S'attr ~ McshEngl.G'attr), up the-whole generic-chain.
 *   - the-key of a-generic-attribute is its section-id (stable), NOT its number.
 *   Inheritance is implicit: a-specific WITHOUT an-attribute is NOT an-issue.
 * INPUT: the-path of a-dirMcsh-worldview.
 * OUTPUT: the-report in dirValid/inheritMcsh.txt, overwritten on every run;
 *   with --fix it writes the-NN_ of INH-NONUM into the-h-titles, when the-NN is free.
 * RUN:
 *   node dirValid/inheritMcsh.mjs <sNameDir> [--fix] [--delete-empty] [--file McshDir000000] [--local 3]
 */

import moFs from 'fs'
import moPath from 'path'
import { fileURLToPath } from 'url'
import { fSplit_sections, fFindSect_overview, fStripTags, fExtractId, fExtractContentHrefs }
  from './parserMcsh.js'

const
  // contains the-versions of inheritMcsh.mjs
  aVersion = [
    'inheritMcsh.mjs.0-1-0.2026-10-17: creation'
  ],
  // the-dir of this script: inheritMcsh.txt is written next to IT
  sDirScript = moPath.dirname(fileURLToPath(import.meta.url)),
  // an-attribute-title: "02_cause of DssInfectious"
  rTitleAttr = /^(?:(\d{2})_)?(.+?) of (\S.*)$/,
  // a-heading of a-section, first in its own html
  rHeading = /<h([1-6])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/,
  // a-paragraph with its id
  rPara = /<p\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g,
  // an-English-name-line
  rNameEngl = /<br>\*\s*McshEngl\.([^\n,]+),/g

/**
 * OUTPUT: the-file-name without its '.last.html', as McshDir000000.
 */
function fFindNameShort(sNameFileIn) {
  return String(sNameFileIn ?? '').replace(/\.last\.html$/, '');
}

/**
 * OUTPUT: the-paths of the-Mcsh*.last.html files of a-worldview, NOT in dirUcd.
 */
function fFindFile_all(sNameDirIn) {
  const aPath = [];
  function fWalk(sDir) {
    for (const oEnt of moFs.readdirSync(sDir, { withFileTypes: true })) {
      const sPath = moPath.join(sDir, oEnt.name);
      if (oEnt.isDirectory()) {
        if (!['node_modules', 'dirUcd', 'dirNamidx', 'dirWrdidx'].includes(oEnt.name)) fWalk(sPath);
      } else if (/^Mcsh.*\.last\.html$/.test(oEnt.name)) aPath.push(sPath);
    }
  }
  fWalk(sNameDirIn);
  return aPath.sort();
}

/**
 * OUTPUT: the-normalized attr-word: lowercase, no NN_, no att003-, no -003.
 */
function fNormAttr(sAttrIn) {
  return sAttrIn.toLowerCase().trim()
    .replace(/^\d{2}_/, '')
    .replace(/^att\d+-?/, '')
    .replace(/-\d+$/, '')
    .replace(/,$/, '');
}

/**
 * OUTPUT: the-English-names of a-name::-paragraph, without their !⇒ !=... suffix,
 *   and the-main-name: the-most frequent target of !⇒, else the-first name.
 */
function fReadNameEngl(sNamParaIn) {
  const aName = [];
  const oCountTarget = {};
  let aMatch;
  rNameEngl.lastIndex = 0;
  while ((aMatch = rNameEngl.exec(sNamParaIn)) !== null) {
    const sFull = aMatch[1].trim();
    aName.push(sFull.split('!')[0].trim());
    const aTarget = sFull.match(/!⇒([^!]+)/);
    if (aTarget) oCountTarget[aTarget[1].trim()] = (oCountTarget[aTarget[1].trim()] ?? 0) + 1;
  }
  const aoTarget = Object.entries(oCountTarget).sort((aA, aB) => aB[1] - aA[1]);
  const sMain = aoTarget.length ? aoTarget[0][0] : (aName[0] ?? '');
  return { aName, sMain };
}

/**
 * DOING: it reads one file into concept-nodes, one per section.
 * OUTPUT: { sNameShort, sText, aoNode, oNodeById, oSectByElmtId }
 */
function fReadFile(sPathIn) {
  const sText = moFs.readFileSync(sPathIn, 'utf8');
  const sNameShort = fFindNameShort(moPath.basename(sPathIn));
  const aNlIdx = [];
  for (let nI = 0; nI < sText.length; nI++) if (sText[nI] === '\n') aNlIdx.push(nI);
  // the-line (1-based) of a-position: binary search on the-newlines
  function fFindLine(nPos) {
    let nLo = 0, nHi = aNlIdx.length;
    while (nLo < nHi) { const nM = (nLo + nHi) >> 1; if (aNlIdx[nM] < nPos) nLo = nM + 1; else nHi = nM; }
    return nLo + 1;
  }

  const aoNode = [];
  const oNodeById = {};
  const oSectByElmtId = {};   // every element-id → the-id of its innermost section
  for (const oRaw of fSplit_sections(sText)) {
    if (!oRaw.sNameId) continue;
    const sOwn = fFindSect_overview(oRaw.sRawHtml);
    for (const sIdElmt of fExtractId(sOwn)) oSectByElmtId[sIdElmt] = oRaw.sNameId;
    const aHead = sOwn.match(rHeading);
    const sHeadHtml = aHead ? aHead[3] : '';
    const bLinkStub = /<a\b/.test(sHeadHtml);
    const sTitle = fStripTags(sHeadHtml.replace(/\(\s*<a\b[\s\S]*?<\/a>\s*\)/g, ''))
      .replace(/\s+/g, ' ').replace(/,$/, '').trim();
    const nLine = fFindLine(oRaw.nStart + (aHead ? sOwn.indexOf(aHead[0]) : 0));

    // the-paragraphs of the-section itself
    const ooPara = {};   // sKind → html
    const aoParaOther = [];
    let aPara;
    rPara.lastIndex = 0;
    while ((aPara = rPara.exec(sOwn)) !== null) {
      const sBody = aPara[2];
      const sKind = (sBody.match(/^\s*([A-Za-z-]+)::/) ?? [])[1] ?? '';
      if (['name', 'description', 'generic-tree', 'specific-tree'].includes(sKind)) {
        ooPara[sKind] = (ooPara[sKind] ?? '') + sBody;
      } else aoParaOther.push(sBody);
    }

    const aAttr = sTitle.match(rTitleAttr);
    const { aName, sMain } = fReadNameEngl(ooPara.name ?? '');
    const bTree = /^[A-Z-]*TREE\b/.test(sTitle);
    const oNode = {
      sNameShort,
      sId: oRaw.sNameId,
      sKey: sNameShort + '#' + oRaw.sNameId,
      sIdWhole: oRaw.sIdWhole_elmt ?? (oRaw.sNameId === 'idOverview' ? null : 'idOverview'),
      sIdHead: aHead ? aHead[2] : null,
      sTitle,
      nLine,
      bLinkStub,
      bTree,
      bAttr: !!aAttr && !/^overview$/i.test(aAttr[2]),
      sNum: aAttr ? (aAttr[1] ?? null) : null,
      sAttrWord: aAttr ? aAttr[2] : null,
      bSpecific: !aAttr && /\./.test(sTitle),
      aName,
      sMain,
      sGenericTree: ooPara['generic-tree'] ?? '',
      sSpecificTree: ooPara['specific-tree'] ?? '',
      sDescription: ooPara.description ?? '',
      nParaOther: aoParaOther.length,
      bHasChildSect: /<section\b/.test(oRaw.sRawHtml.slice(1)),
      // a-name in another McsLago is info for the-name-index
      bNameOther: /<br>\*\s*Mcsh(?!Engl)[A-Z][a-z]{3}\./.test(ooPara.name ?? ''),
      nStart: oRaw.nStart,
      nEnd: oRaw.nStart + oRaw.sRawHtml.length,
      oSetIdElmt: fExtractId(oRaw.sRawHtml),
      aoChild: [],
      aoGeneric: []
    };
    // the-attr-keys: the-attr-word and the-attr-words of the-names "X'attr"
    oNode.oSetAttrKey = new Set();
    if (oNode.bAttr) {
      oNode.oSetAttrKey.add(fNormAttr(oNode.sAttrWord));
      for (const sName of aName) {
        const nQ = sName.lastIndexOf("'");
        if (nQ > 0) oNode.oSetAttrKey.add(fNormAttr(sName.slice(nQ + 1)));
      }
      // 'att012' alone is a-number, NOT an-attr-word
      oNode.oSetAttrKey.delete('');
    }
    aoNode.push(oNode);
    oNodeById[oNode.sId] = oNode;
  }
  for (const oNode of aoNode) {
    const oWhole = oNode.sIdWhole ? oNodeById[oNode.sIdWhole] : null;
    if (oWhole && oWhole !== oNode) oWhole.aoChild.push(oNode);
  }
  return { sNameShort, sText, sPath: sPathIn, aoNode, oNodeById, oSectByElmtId };
}

/**
 * DOING: it builds the-generic-links of every node and checks the-attributes.
 */
function fCheck(aoFileIn, nLocalMinIn) {
  const ooFile = {};
  for (const oFile of aoFileIn) ooFile[oFile.sNameShort] = oFile;

  // the-concept a-tree-section talks about is its whole
  function fOwner(oNodeIn) {
    let oNode = oNodeIn;
    const oFile = ooFile[oNode.sNameShort];
    while (oNode && (oNode.bTree) && oNode.sIdWhole) oNode = oFile.oNodeById[oNode.sIdWhole];
    return oNode;
  }
  // a-href → the-concept-node it names, or null
  function fResolveHref(sHrefIn, oFromIn) {
    const aMatch = sHrefIn.match(/^(?:(?:[^#]*\/)?(Mcsh[^/#]*?)\.last\.html)?#(.+)$/);
    if (!aMatch) return null;
    const oFile = aMatch[1] ? ooFile[aMatch[1]] : ooFile[oFromIn.sNameShort];
    if (!oFile) return null;
    const sIdSect = oFile.oNodeById[aMatch[2]] ? aMatch[2] : oFile.oSectByElmtId[aMatch[2]];
    return sIdSect ? fOwner(oFile.oNodeById[sIdSect]) : null;
  }
  function fAddGeneric(oSpec, oGen) {
    if (!oSpec || !oGen || oSpec === oGen || oSpec.aoGeneric.includes(oGen)) return;
    oSpec.aoGeneric.push(oGen);
  }

  const aoNodeAll = aoFileIn.flatMap(oFile => oFile.aoNode);
  for (const oNode of aoNodeAll) {
    const oFile = ooFile[oNode.sNameShort];
    const oOwner = fOwner(oNode);
    // structural: a-specific-section's generic is its whole
    if (oNode.bSpecific && oNode.sIdWhole) fAddGeneric(oNode, fOwner(oFile.oNodeById[oNode.sIdWhole]));
    // generic-tree:: links of the-owner, before the-first "===" line that leads siblings
    if (oNode.sGenericTree) {
      const sGtr = oNode.sGenericTree.split(/<br>===\s*(?:sibling|att)/)[0];
      for (const sHref of fExtractContentHrefs(sGtr)) fAddGeneric(oOwner, fResolveHref(sHref, oNode));
    }
    // specific-tree:: links: each target has the-owner as generic
    if (oNode.sSpecificTree) {
      for (const sHref of fExtractContentHrefs(oNode.sSpecificTree)) {
        const oSpec = fResolveHref(sHref, oNode);
        // an-attribute "X of M" is a-part, NOT a-specific of M
        if (oSpec && !oSpec.bAttr) fAddGeneric(oSpec, oOwner);
      }
    }
  }

  // the-generic-chain of a-node, nearest first, without cycles
  function fFindChain(oNodeIn) {
    const aoChain = [];
    const oSetSeen = new Set([oNodeIn]);
    let aoLevel = oNodeIn.aoGeneric.slice();
    while (aoLevel.length) {
      const aoNext = [];
      for (const oGen of aoLevel) {
        if (oSetSeen.has(oGen)) continue;
        oSetSeen.add(oGen);
        aoChain.push(oGen);
        aoNext.push(...oGen.aoGeneric);
      }
      aoLevel = aoNext;
    }
    return aoChain;
  }
  function fIsNumbered(oGenIn) {
    return oGenIn.aoChild.some(oC => oC.bAttr && oC.sNum);
  }
  // the-number-space of a-specific: the-numbered attributes of its generic-chain, as
  //   inheritance: a-nearer generic wins; a-farther attribute enters ONLY if its NN and
  //   its attr-words are still free (disorderBio'08_resource vs disease'08_patient: out).
  function fFindNumSpace(aoChainIn) {
    const aoSpace = [];
    const oSetNum = new Set();
    const oSetKey = new Set();
    for (const oGen of aoChainIn) {
      const aoAdd = [];
      for (const oGenAttr of oGen.aoChild) {
        if (!oGenAttr.bAttr || !oGenAttr.sNum || oGenAttr.bTree) continue;
        if (oSetNum.has(oGenAttr.sNum)) continue;
        if ([...oGenAttr.oSetAttrKey].some(sKey => oSetKey.has(sKey))) continue;
        aoAdd.push({ oGen, oGenAttr });
      }
      // one level at once: a-generic's own NN-duplicates are INH-GENDUP, not shadowing
      for (const oAdd of aoAdd) {
        oSetNum.add(oAdd.oGenAttr.sNum);
        for (const sKey of oAdd.oGenAttr.oSetAttrKey) oSetKey.add(sKey);
        aoSpace.push(oAdd);
      }
    }
    return aoSpace;
  }
  // the-numbered generic-attribute of the-number-space that matches an-attribute-node
  function fMatchAttr(oAttrIn, aoSpaceIn) {
    for (const oSpace of aoSpaceIn) {
      if (oSpace.oGenAttr === oAttrIn) continue;
      for (const sKey of oAttrIn.oSetAttrKey) {
        if (oSpace.oGenAttr.oSetAttrKey.has(sKey)) return oSpace;
      }
    }
    return null;
  }
  function fLabel(oGen, oGenAttr) {
    return `${oGen.sMain || oGen.sTitle}'${oGenAttr.sNum}_${oGenAttr.sAttrWord}` +
      `@${oGenAttr.sNameShort}#${oGenAttr.sId}`;
  }
  // an-attribute that says nothing: no link, no part, no other para, description:: only a-date
  function fIsEmpty(oAttrIn) {
    if (oAttrIn.bLinkStub || oAttrIn.bHasChildSect || oAttrIn.nParaOther > 0) return false;
    const sDsn = fStripTags(oAttrIn.sDescription).replace(/^description::/, '')
      .split('\n').filter(sL => sL.trim() && !/^×/.test(sL.trim())).join('');
    return sDsn.trim() === '';
  }

  const ooIssue = { 'INH-NONUM': [], 'INH-WRONGNUM': [], 'INH-ORDER': [], 'INH-EMPTY': [], 'INH-GENDUP': [], 'INH-LOCAL': [] };
  const oCountLocal = {};   // sKeyGen|attr → { oGen, sAttr, aoAttr }
  const oCountRefine = {};  // sKeyGenAttr → { label, nCount }
  let nSpecific = 0, nAttrSpec = 0, nMatch = 0;

  for (const oNode of aoNodeAll) {
    if (oNode.bTree || oNode.aoGeneric.length === 0) continue;
    const aoChain = fFindChain(oNode);
    const oGenNum = aoChain.find(fIsNumbered);
    if (!oGenNum) continue;
    const aoSpace = fFindNumSpace(aoChain);
    nSpecific++;
    const aNumOrder = [];
    // the-NNs the-specific already uses: a-new NN_ must NOT repeat one
    const oNumTaken = {};
    for (const oC of oNode.aoChild) if (oC.bAttr && oC.sNum) oNumTaken[oC.sNum] = oC;
    for (const oAttr of oNode.aoChild) {
      if (!oAttr.bAttr || oAttr.bTree) continue;
      nAttrSpec++;
      const oMatch = fMatchAttr(oAttr, aoSpace);
      if (!oMatch) {
        if (oAttr.sNum) continue;   // own number: the-author decided
        const sKeyLocal = oGenNum.sKey + '|' + fNormAttr(oAttr.sAttrWord);
        (oCountLocal[sKeyLocal] ??= { oGen: oGenNum, sAttr: fNormAttr(oAttr.sAttrWord), aoAttr: [] })
          .aoAttr.push(oAttr);
        continue;
      }
      nMatch++;
      const { oGen, oGenAttr } = oMatch;
      const sLabel = fLabel(oGen, oGenAttr);
      (oCountRefine[oGenAttr.sKey] ??= { sLabel, nCount: 0 }).nCount++;
      aNumOrder.push(oGenAttr.sNum);
      const oIssue = { oAttr, sNumNew: oGenAttr.sNum, sLabel };
      if (!oAttr.sNum) {
        // the-NN is taken by another attribute of the-specific: --fix skips it
        const oTaken = oNumTaken[oGenAttr.sNum];
        if (oTaken && oTaken !== oAttr) oIssue.sTaken = oTaken.sTitle;
        else oNumTaken[oGenAttr.sNum] = oAttr;
        ooIssue['INH-NONUM'].push(oIssue);
      }
      else if (oAttr.sNum !== oGenAttr.sNum) ooIssue['INH-WRONGNUM'].push(oIssue);
      if (fIsEmpty(oAttr)) ooIssue['INH-EMPTY'].push(oIssue);
    }
    for (let nI = 1; nI < aNumOrder.length; nI++) {
      if (aNumOrder[nI] < aNumOrder[nI - 1]) {
        ooIssue['INH-ORDER'].push({ oAttr: oNode, sLabel: aNumOrder.join(' ') });
        break;
      }
    }
  }
  // a-generic that gives numbers must give each NN once
  const oSetGenNum = new Set();
  for (const oNode of aoNodeAll) {
    if (oNode.bTree || oNode.aoGeneric.length === 0) continue;
    const oGenNum = fFindChain(oNode).find(fIsNumbered);
    if (!oGenNum || oSetGenNum.has(oGenNum)) continue;
    oSetGenNum.add(oGenNum);
    const ooAttrByNum = {};
    for (const oC of oGenNum.aoChild) if (oC.bAttr && oC.sNum) (ooAttrByNum[oC.sNum] ??= []).push(oC);
    for (const [sNum, aoAttr] of Object.entries(ooAttrByNum)) {
      if (aoAttr.length > 1) ooIssue['INH-GENDUP'].push({ oAttr: aoAttr[1],
        sLabel: `${sNum}_ also "${aoAttr[0].sTitle}" :${aoAttr[0].nLine}` });
    }
  }
  for (const oLocal of Object.values(oCountLocal)) {
    if (oLocal.aoAttr.length >= nLocalMinIn) ooIssue['INH-LOCAL'].push(oLocal);
  }
  ooIssue['INH-LOCAL'].sort((oA, oB) => oB.aoAttr.length - oA.aoAttr.length);
  return { ooIssue, oCountRefine, nSpecific, nAttrSpec, nMatch, nNode: aoNodeAll.length };
}

/**
 * DOING: it deletes the-INH-EMPTY sections nothing links to and with English names only.
 * OUTPUT: { aoDeleted, aoKept } issues, aoKept with its sKeep reason.
 */
function fDeleteEmpty(aoFileIn, aoIssueIn) {
  // every link of the-worldview as file#id, NOT the-clsHide self-links
  const oSetHref = new Set();
  for (const oFile of aoFileIn) {
    for (const sHref of fExtractContentHrefs(oFile.sText)) {
      const aMatch = sHref.match(/^(?:(?:[^#]*\/)?(Mcsh[^/#]*?)\.last\.html)?#(.+)$/);
      if (aMatch) oSetHref.add((aMatch[1] ?? oFile.sNameShort) + '#' + aMatch[2]);
    }
  }
  const aoDeleted = [], aoKept = [];
  const ooDelFile = {};
  for (const oIssue of aoIssueIn) {
    const oAttr = oIssue.oAttr;
    const sIdLinked = [...oAttr.oSetIdElmt].find(sId => oSetHref.has(oAttr.sNameShort + '#' + sId));
    if (sIdLinked) { oIssue.sKeep = `linked: #${sIdLinked}`; aoKept.push(oIssue); continue; }
    if (oAttr.bNameOther) { oIssue.sKeep = 'has names of another McsLago'; aoKept.push(oIssue); continue; }
    (ooDelFile[oAttr.sNameShort] ??= []).push(oIssue);
  }
  for (const oFile of aoFileIn) {
    const aoDel = ooDelFile[oFile.sNameShort];
    if (!aoDel) continue;
    let sText = oFile.sText;
    // from the-end, so the-positions before stay valid
    for (const oIssue of aoDel.slice().sort((oA, oB) => oB.oAttr.nStart - oA.oAttr.nStart)) {
      const { nStart, nEnd } = oIssue.oAttr;
      // the-whole lines: from the-line-start of <section to the-newline after </section>,
      //   and ONE blank line after, so no double blank lines remain
      const nFrom = sText.lastIndexOf('\n', nStart - 1) + 1;
      let nTo = sText.indexOf('\n', nEnd);
      nTo = nTo === -1 ? sText.length : nTo + 1;
      const aBlank = sText.slice(nTo).match(/^[ \t]*\r?\n/);
      if (aBlank) nTo += aBlank[0].length;
      sText = sText.slice(0, nFrom) + sText.slice(nTo);
      aoDeleted.push(oIssue);
    }
    moFs.writeFileSync(oFile.sPath, sText);
  }
  return { aoDeleted, aoKept };
}

/**
 * DOING: it writes the-NN_ of INH-NONUM into the-h-titles, when the-NN is free.
 * OUTPUT: the-number of titles changed.
 */
function fApplyFix(aoFileIn, aoIssueIn) {
  const ooIssueFile = {};
  for (const oIssue of aoIssueIn) (ooIssueFile[oIssue.oAttr.sNameShort] ??= []).push(oIssue);
  let nChanged = 0;
  for (const oFile of aoFileIn) {
    const aoIssueFile = ooIssueFile[oFile.sNameShort];
    if (!aoIssueFile) continue;
    let sText = oFile.sText;
    for (const oIssue of aoIssueFile) {
      const sIdHead = oIssue.oAttr.sIdHead.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rHead = new RegExp(`(<h[1-6]\\b[^>]*\\bid="${sIdHead}"[^>]*>)(\\d{2}_)?`);
      const sTextNew = sText.replace(rHead, `$1${oIssue.sNumNew}_`);
      if (sTextNew !== sText) { sText = sTextNew; nChanged++; oIssue.bApplied = true; }
    }
    if (sText !== oFile.sText) moFs.writeFileSync(oFile.sPath, sText);
  }
  return nChanged;
}

function fMain() {
  const aArg = process.argv.slice(2);
  const aArgPath = aArg.filter((sArg, nI) =>
    !sArg.startsWith('--') && !['--file', '--local'].includes(aArg[nI - 1]));
  const sNameDir = aArgPath[0];
  if (!sNameDir) {
    console.log('inheritMcsh.mjs - it checks the-inheritance of attributes from generic to specific concepts');
    console.log('  ' + aVersion[0]);
    console.log('');
    console.log('USAGE: node dirValid/inheritMcsh.mjs <sNameDir> [--fix] [--delete-empty] [--file McshDir000000] [--local 3]');
    console.log('  sNameDir     the-path of the-dirMcsh-worldview');
    console.log('  --fix        writes the-NN_ of INH-NONUM into the-h-titles, when the-NN is free');
    console.log('  --delete-empty  deletes the-INH-EMPTY sections: NOT linked, English names only');
    console.log('  --file       report (and fix) one file only, given as McshDir000000');
    console.log('  --local      the-min count of specifics for INH-LOCAL (default 3)');
    console.log('  OUTPUT: dirValid/inheritMcsh.txt, overwritten on every run');
    process.exit(1);
  }
  const bFix = aArg.includes('--fix');
  const bDelete = aArg.includes('--delete-empty');
  const nIdxFile = aArg.indexOf('--file');
  const sNameFileOnly = nIdxFile !== -1 ? fFindNameShort(aArg[nIdxFile + 1] ?? '') : '';
  const nIdxLocal = aArg.indexOf('--local');
  const nLocalMin = nIdxLocal !== -1 ? Number(aArg[nIdxLocal + 1]) || 3 : 3;

  // ── read ALL files: a-generic may live in another file than its specific ─
  const fInFile = oNode => !sNameFileOnly || oNode.sNameShort === sNameFileOnly;
  function fReadCheck() {
    const aoFileRead = fFindFile_all(sNameDir).map(fReadFile);
    const oResult = fCheck(aoFileRead, nLocalMin);
    for (const sCode of Object.keys(oResult.ooIssue)) {
      oResult.ooIssue[sCode] = oResult.ooIssue[sCode].filter(oIssue =>
        oIssue.aoAttr ? oIssue.aoAttr.some(fInFile) : fInFile(oIssue.oAttr));
    }
    return { aoFileRead, oResult };
  }

  // --fix: pass after pass, because a-specific that gets its NN_ numbers its own specifics
  let nChanged = 0;
  const aoApplied = [];
  let { aoFileRead: aoFile, oResult } = fReadCheck();
  for (let nPass = 0; bFix && nPass < 5; nPass++) {
    const aoFixable = oResult.ooIssue['INH-NONUM'].filter(oIssue => !oIssue.sTaken);
    const nPassChanged = fApplyFix(aoFile, aoFixable);
    if (nPassChanged === 0) break;
    nChanged += nPassChanged;
    aoApplied.push(...aoFixable.filter(oIssue => oIssue.bApplied));
    ({ aoFileRead: aoFile, oResult } = fReadCheck());
  }
  // --delete-empty: before the-final read, so the-SUMMARY is the-state after
  let oDelete = null;
  if (bDelete) {
    oDelete = fDeleteEmpty(aoFile, oResult.ooIssue['INH-EMPTY']);
    if (oDelete.aoDeleted.length) ({ aoFileRead: aoFile, oResult } = fReadCheck());
  }
  const { ooIssue, oCountRefine, nSpecific, nAttrSpec, nMatch, nNode } = oResult;

  // ── the-report ────────────────────────────────────────────────────────────
  const aLineOut = [];
  const fOut = sIn => aLineOut.push(sIn);
  // per file, the-biggest line first, files by name
  const fSortIssue = aoIn => aoIn.slice().sort((oA, oB) =>
    oA.oAttr.sNameShort.localeCompare(oB.oAttr.sNameShort) || oB.oAttr.nLine - oA.oAttr.nLine);

  fOut('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  fOut(`  INHERITANCE SYNC${bFix || bDelete ? ' — APPLIED' : ' — dry run'}: ${sNameDir}` +
    (sNameFileOnly ? ` (file ${sNameFileOnly})` : ''));
  fOut('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  fOut(`  ${aoFile.length} files · ${nNode} sections · ${nSpecific} specifics under a-numbered generic · ` +
    `${nAttrSpec} of their attributes · ${nMatch} match a-numbered generic-attribute`);
  if (bFix) fOut(`  titles changed: ${nChanged}`);
  fOut('  Rule: a-specific-attribute takes the-NN_ of the-generic-attribute it refines;');
  fOut('        a-specific WITHOUT an-attribute inherits it, it is NOT an-issue.');
  fOut('');
  fOut('SUMMARY');
  const ooDesc = {
    'INH-NONUM': 'matches a-numbered generic-attribute, has no NN_ (--fix adds it, if NN free)',
    'INH-WRONGNUM': 'its NN_ differs from the-generic-attribute (own numbering? by hand)',
    'INH-ORDER': 'the-attributes of a-specific are not in the-NN order of its generic',
    'INH-EMPTY': 'an-inherited attribute that says nothing new (no info, no link): delete?',
    'INH-GENDUP': 'a-numbered generic gives the-same NN_ to two attributes: renumber',
    'INH-LOCAL': `an-attribute in ${nLocalMin}+ specifics, not in the-generic: lift it up?`
  };
  for (const sCode of Object.keys(ooIssue)) {
    fOut(`  ${sCode.padEnd(13)} ${String(ooIssue[sCode].length).padStart(5)}  ${ooDesc[sCode]}`);
  }
  fOut('');

  if (oDelete) {
    fOut(`=== DELETED (${oDelete.aoDeleted.length}) — empty inherited attribute-sections`);
    for (const oIssue of fSortIssue(oDelete.aoDeleted)) {
      fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  #${oIssue.oAttr.sId}  "${oIssue.oAttr.sTitle}"  ← ${oIssue.sLabel}`);
    }
    fOut('');
    fOut(`=== EMPTY-KEPT (${oDelete.aoKept.length}) — empty, but NOT deleted`);
    for (const oIssue of fSortIssue(oDelete.aoKept)) {
      fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  "${oIssue.oAttr.sTitle}"  ${oIssue.sKeep}`);
    }
    fOut('');
  }
  if (bFix) {
    // the-titles as they were: the-SUMMARY above is the-state AFTER the-fix
    fOut(`=== APPLIED (${aoApplied.length}) — NN_ written into the-h-title`);
    for (const oIssue of fSortIssue(aoApplied)) {
      fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  "${oIssue.oAttr.sTitle}"` +
        `  → ${oIssue.sNumNew}_  ← ${oIssue.sLabel}`);
    }
    fOut('');
  }
  for (const sCode of ['INH-NONUM', 'INH-WRONGNUM', 'INH-EMPTY']) {
    fOut(`=== ${sCode} (${ooIssue[sCode].length}) — ${ooDesc[sCode]}`);
    for (const oIssue of fSortIssue(ooIssue[sCode])) {
      const sNew = sCode === 'INH-EMPTY' ? '' :
        `  → ${oIssue.sNumNew}_` + (oIssue.sTaken ? ` ✗ NN taken by "${oIssue.sTaken}"` : '');
      fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  "${oIssue.oAttr.sTitle}"${sNew}  ← ${oIssue.sLabel}`);
    }
    fOut('');
  }
  fOut(`=== INH-ORDER (${ooIssue['INH-ORDER'].length}) — ${ooDesc['INH-ORDER']}`);
  for (const oIssue of fSortIssue(ooIssue['INH-ORDER'])) {
    fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  "${oIssue.oAttr.sTitle}"  order: ${oIssue.sLabel}`);
  }
  fOut('');
  fOut(`=== INH-GENDUP (${ooIssue['INH-GENDUP'].length}) — ${ooDesc['INH-GENDUP']}`);
  for (const oIssue of fSortIssue(ooIssue['INH-GENDUP'])) {
    fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  "${oIssue.oAttr.sTitle}"  ${oIssue.sLabel}`);
  }
  fOut('');
  fOut(`=== INH-LOCAL (${ooIssue['INH-LOCAL'].length}) — ${ooDesc['INH-LOCAL']}`);
  for (const oLocal of ooIssue['INH-LOCAL']) {
    const aWhere = oLocal.aoAttr.slice(0, 8).map(oA => `${oA.sNameShort}:${oA.nLine}`);
    fOut(`  ${oLocal.sAttr} of ${oLocal.oGen.sMain || oLocal.oGen.sTitle}@${oLocal.oGen.sNameShort}` +
      `  ×${oLocal.aoAttr.length}  ${aWhere.join(' ')}${oLocal.aoAttr.length > 8 ? ' …' : ''}`);
  }
  fOut('');
  const aoRefine = Object.values(oCountRefine).sort((oA, oB) => oB.nCount - oA.nCount);
  fOut(`=== INFO (${aoRefine.length}) — how many specifics refine each numbered generic-attribute`);
  for (const oRefine of aoRefine) fOut(`  ${String(oRefine.nCount).padStart(5)}  ${oRefine.sLabel}`);

  const sPathOut = moPath.join(sDirScript, 'inheritMcsh.txt');
  moFs.writeFileSync(sPathOut, aLineOut.join('\n') + '\n');
  for (const sLine of aLineOut.slice(0, 14)) console.log(sLine);
  console.log(`📄 report written: ${sPathOut} (${aLineOut.length} lines)`);
}

try {
  fMain();
} catch (oErr) {
  console.error('\n❌ Fatal error:', oErr.stack);
  process.exit(1);
}
