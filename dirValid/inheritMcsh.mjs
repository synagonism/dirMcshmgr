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
 *   node dirValid/inheritMcsh.mjs <sNameDir> [--fix] [--delete-empty] [--fix-order] [--fix-name] [--fix-last] [--fix-num] [--sub Mmn] [--chain Mmn] [--file McshDir000000] [--local 3]
 */

import moFs from 'fs'
import moPath from 'path'
import { fileURLToPath } from 'url'
import { fFormalMvrwName01 } from './structuralMcsh.js'
import { fSplit_sections, fFindSect_overview, fStripTags, fExtractId, fExtractContentHrefs }
  from './parserMcsh.js'

const
  // contains the-versions of inheritMcsh.mjs
  aVersion = [
    'inheritMcsh.mjs.0-24-1.2026-11-25: a-title note "x (4_digits) of M" (a-space, then any (…)) is dropped like a-new name',
    'inheritMcsh.mjs.0-24-0.2026-11-25: INH-OWNNUM: the-own numbers run WITHOUT gaps from the-chain last + 1, in their order (inner gaps and twice-given numbers too)',
    'inheritMcsh.mjs.0-23-4.2026-11-25: MvrwGstr03 reports INH-GENDUP (two attributes with the-same NN_ in a-concept)',
    'inheritMcsh.mjs.0-23-3.2026-11-25: --fix-num: a-concept with ONE colliding new number waits whole (no half-done shift)',
    'inheritMcsh.mjs.0-23-2.2026-11-25: INH-OWNNONUM numbers come after the-own numbers AS SHIFTED (02_x 03_y + z left 03_x 03_y)',
    'inheritMcsh.mjs.0-23-1.2026-11-22: own numbering (NONUM by hand) only when a-number collides with the-chain, NOT for own numbers after it',
    'inheritMcsh.mjs.0-23-0.2026-11-22: --fix-nonum: ONLY INH-NONUM gets the-NN_ of its generic-attribute (NOT OWNNONUM)',
    'inheritMcsh.mjs.0-22-0.2026-11-20: MISC-ATTRIBUTE (or MISC) of X and the-attributes inside it get NO number (like evoluting): no NONUM, OWNNONUM, OWNNUM, no shift',
    'inheritMcsh.mjs.0-21-3.2026-11-20: fFindInheritAttr reads the-WHOLE worldview (the-dir with dirNamidx), also when validate-file gives a-sub-dir',
    'inheritMcsh.mjs.0-21-2.2026-11-19: a-link-stub whose target is NOT read (or broken: Hvre06) is skipped, NOT a-TITLEHAND',
    'inheritMcsh.mjs.0-21-1.2026-11-19: --fix-stub: ONLY the-names at the-link-targets of link-stubs',
    'inheritMcsh.mjs.0-21-0.2026-11-19: --fix-name: a-link-stub "06_input of M (link)" gets its name at the-link target (M\'08_input → M\'06_input, or M\'06_input next to M\'input)',
    'inheritMcsh.mjs.0-20-0.2026-11-19: INH-OWNNUM also a-GAP: the-own numbers start RIGHT after the-chain (last 05, 08_input → 06_input)',
    'inheritMcsh.mjs.0-19-0.2026-11-19: a-title "x (N) of M" (N a-new name) is the-attribute "x of M"',
    'inheritMcsh.mjs.0-18-0.2026-11-19: INH-TITLEHAND: a-link-stub "NN_x of M (link)" without name:: is OK',
    'inheritMcsh.mjs.0-17-0.2026-11-18: the-marker X\'NN_last is NOT an-attr-key (04_argument of bodyNo matched entity\'01_attribute by "last")',
    'inheritMcsh.mjs.0-16-0.2026-11-18: INH-LAST --fix keeps a-right X\'NN_last line (also X\'NN_last!⇒M), deletes the-old ones',
    'inheritMcsh.mjs.0-15-0.2026-11-17: INH-OWNNUM --fix-num shifts ALL own numbers of the-specific (order kept); a-shift follows down',
    'inheritMcsh.mjs.0-14-0.2026-11-17: MvrwGstr03 WRONGNUM, OWNNUM messages give the-fix: --concept Mmn --fix-num --fix-name',
    'inheritMcsh.mjs.0-13-0.2026-11-17: the-attributes inside an-evoluting section are NOT numbered (no NONUM, OWNNONUM, ...)',
    'inheritMcsh.mjs.0-12-0.2026-11-17: --chain Mmn (inheritChain.txt); --fix-num WRONGNUM+OWNNUM; --sub Mmn a-concept-tree only',
    'inheritMcsh.mjs.0-11-0.2026-11-17: INH-TITLENAME: an-old number of another word X\x27KK_y (title NN_) loses it: X\x27y',
    'inheritMcsh.mjs.0-10-0.2026-11-17: INH-LAST: a-generic has the-name Mmn\'NN_last; --fix writes it',
    'inheritMcsh.mjs.0-9-0.2026-11-17: INH-OWNNONUM: an-own attribute without number gets the-next NN after the-chain; --fix writes it',
    'inheritMcsh.mjs.0-8-0.2026-11-16: fFindInheritAttr remembers its result while the-files are unchanged',
    'inheritMcsh.mjs.0-7-0.2026-11-16: INH-OWNNUM; fFindInheritAttr exported for MvrwGstr03 inherited_attr of structuralMcsh.js',
    'inheritMcsh.mjs.0-6-0.2026-11-16: INH-TITLENAME, --fix-name: a-numbered attribute has its title "relation\'02_valence" as name',
    'inheritMcsh.mjs.0-5-0.2026-11-16: a-plain-name generic "* X," resolves as X:generic, else reported in INH-GNTRTEXT',
    'inheritMcsh.mjs.0-4-0.2026-10-31: generic-tree names X:generic (was X_Gntr)',
    'inheritMcsh.mjs.0-3-0.2026-10-19: generic-tree names X_Gntr (was X-Gntr), ":" ends a-text-reference',
    'inheritMcsh.mjs.0-2-0.2026-10-18: --delete-empty, --fix-order, own-numbering, INH-GENDUP',
    'inheritMcsh.mjs.0-1-0.2026-10-17: creation'
  ],
  // the-dir of this script: inheritMcsh.txt is written next to IT
  sDirScript = moPath.dirname(fileURLToPath(import.meta.url)),
  // an-attribute-title: "02_cause of DssInfectious"
  rTitleAttr = /^(?:(\d{2})_)?(.+?) of (\S.*)$/,
  // the-attributes that get NO number: the-end-sections and MISC-ATTRIBUTE
  rAttrNoNum = /^(info[-_ ]?resource|doing|evoluting|misc([-_ ]?attribute)?)$/i,
  // the-sections whose attributes inside get NO number either
  rAttrNoNumInside = /^(evoluting|misc([-_ ]?attribute)?)$/i,
  // a-new name or a-note N in a-title "x (N) of M": the-attribute is "x of M" (a-space before "(";
  //   "03_doctype (1|2_letters)" too; glued "03_doctype_(1|2_letters)" is NOT one)
  rNewNameTitle = /\s+\([^\s()]+\)/g,
  // a-heading of a-section, first in its own html
  rHeading = /<h([1-6])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/,
  // a-paragraph with its id
  rPara = /<p\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g,
  // an-English-name-line
  rNameEngl = /<br>\*\s*McshEngl\.([^\n,]+),/g,
  // a-text-reference: "name!@McshCor000012#idMdl014", "name!@#idMdl014" (same file)
  rRef = /!@(Mcsh[A-Za-z]*\d{6})?#(id[^\s,<"':]+)/g,
  // the-name of a-generic-tree, in its own generic-tree::  "<br>* McshEngl.system:generic,"
  rGntrDef = /<br>\*\s*McshEngl\.([^\s,<!]+:generic)[,!]/g,
  // a-text-entry of a-generic: "<br>* system:generic,"; NOT "McshEngl.…", NOT "...entity:generic"
  rGntrUse = /<br>\*\s*(?!McshEngl\.|\.\.\.)([^\s,<!*]+:generic),/g,
  // a-plain-name entry of a-generic: "<br>* head-of-vertebrate,"; NOT a-link, NOT !@, NOT ⧺cpt..⧺
  rGntrPlain = /<br>\*\s*(?!McshEngl\.|\.\.\.)([^\s,<!*:⧺?]+),/g

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
  return { aName, sMain, bMainTarget: aoTarget.length > 0 };
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

    const aAttr = sTitle.replace(rNewNameTitle, "").match(rTitleAttr);
    const { aName, sMain, bMainTarget } = fReadNameEngl(ooPara.name ?? '');
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
      // the-href of a-link-stub "06_input of M (link)": its names are at that target
      sHrefStub: bLinkStub ? ((sHeadHtml.match(/href="([^"]+)"/) ?? [])[1] ?? null) : null,
      bTree,
      bAttr: !!aAttr && !/^overview$/i.test(aAttr[2]),
      sNum: aAttr ? (aAttr[1] ?? null) : null,
      sAttrWord: aAttr ? aAttr[2] : null,
      bSpecific: !aAttr && /\./.test(sTitle),
      aName,
      sMain,
      bMainTarget,
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
        // the-marker "X'NN_last" is NOT an-attribute-name: every generic has one (key "last")
        if (/'\d{2}_last$/.test(sName)) continue;
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
    if (oWhole && oWhole !== oNode) { oWhole.aoChild.push(oNode); oNode.oWholeNode = oWhole; }
  }
  // the-text-references "name!@McshCor000012#idMdl014" (or "name!@#idMdl014" in the-same file)
  const aoRef = [];
  let aRef;
  rRef.lastIndex = 0;
  while ((aRef = rRef.exec(sText)) !== null) {
    aoRef.push({ sNameShort, sRaw: aRef[0], sFile: aRef[1] ?? sNameShort, sId: aRef[2],
      nLine: fFindLine(aRef.index) });
  }
  return { sNameShort, sText, sPath: sPathIn, aoNode, oNodeById, oSectByElmtId, aoRef,
    oSetId: fExtractId(sText) };
}

/**
 * OUTPUT: the-!@ references of an-html as hrefs ('McshCor000012.last.html#idX' or '#idX'),
 *   so they resolve as the-links do.
 */
function fExtractRefs(sHtmlIn) {
  const aHref = [];
  let aRef;
  rRef.lastIndex = 0;
  while ((aRef = rRef.exec(sHtmlIn)) !== null) {
    aHref.push((aRef[1] ? aRef[1] + '.last.html' : '') + '#' + aRef[2]);
  }
  return aHref;
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

  // the-names of the-generic-trees: "McshEngl.system:generic" in system's generic-tree:: → system.
  //   a-name defined twice is ambiguous: NOT used, reported.
  const ooGntrDef = {};   // sNameLower → [{ oNode, sDef }]
  const oNodeByName = {}; // sName → [oNode], the-English-names of the-concepts
  const oNodeByMain = {}; // sMain → [oNode]
  for (const oNode of aoNodeAll) {
    if (oNode.sGenericTree) {
      const oOwner = fOwner(oNode);
      for (const aDef of oNode.sGenericTree.matchAll(rGntrDef)) {
        const aoDef = (ooGntrDef[aDef[1].toLowerCase()] ??= []);
        if (!aoDef.some(oD => oD.oNode === oOwner)) aoDef.push({ oNode: oOwner, sDef: aDef[1] });
      }
    }
    if (oNode.bTree) continue;
    for (const sName of oNode.aName) (oNodeByName[sName] ??= []).push(oNode);
    if (oNode.sMain) (oNodeByMain[oNode.sMain] ??= []).push(oNode);
  }
  // a-text-entry "X:generic" → { oNode } or { sWhy }: the-definition exact, then any case,
  //   then the-ONE concept named X (main-name first)
  function fResolveGntr(sGntrIn) {
    const aoDef = ooGntrDef[sGntrIn.toLowerCase()] ?? [];
    const aoExact = aoDef.filter(oD => oD.sDef === sGntrIn);
    const aoUse = aoExact.length ? aoExact : aoDef;
    if (aoUse.length === 1) return { oNode: aoUse[0].oNode };
    if (aoUse.length > 1) return { sWhy: 'defined ' + aoUse.length + ' times: ' +
      aoUse.map(oD => `${oD.oNode.sNameShort}:${oD.oNode.nLine}`).join(', ') };
    const sName = sGntrIn.replace(/:generic$/, '');
    for (const aoNode of [oNodeByMain[sName], oNodeByName[sName]]) {
      if (aoNode?.length === 1) return { oNode: aoNode[0] };
      if (aoNode?.length > 1) return { sWhy: `not defined; ${aoNode.length} concepts named ${sName}` };
    }
    return { sWhy: 'not defined, no concept named ' + sName };
  }
  const aoGntrText = [];  // the-unresolved text-entries, for INH-GNTRTEXT

  for (const oNode of aoNodeAll) {
    const oFile = ooFile[oNode.sNameShort];
    const oOwner = fOwner(oNode);
    // structural: a-specific-section's generic is its whole
    if (oNode.bSpecific && oNode.sIdWhole) fAddGeneric(oNode, fOwner(oFile.oNodeById[oNode.sIdWhole]));
    // generic-tree:: links of the-owner, before the-first "===" line that leads siblings
    if (oNode.sGenericTree) {
      const sGtr = oNode.sGenericTree.split(/<br>===\s*(?:sibling|att)/)[0];
      for (const sHref of [...fExtractContentHrefs(sGtr), ...fExtractRefs(sGtr)]) {
        fAddGeneric(oOwner, fResolveHref(sHref, oNode));
      }
      // the-text-entries "* system:generic," — the-standard way to denote the-generic
      for (const aUse of sGtr.matchAll(rGntrUse)) {
        const oResolved = fResolveGntr(aUse[1]);
        if (oResolved.oNode) fAddGeneric(oOwner, oResolved.oNode);
        else aoGntrText.push({ oAttr: oNode, sLabel: `${aUse[1]}: ${oResolved.sWhy}` });
      }
      // a-plain-name "* X," resolves as "X:generic": its generic-tree, else the-ONE concept named X
      for (const aUse of sGtr.matchAll(rGntrPlain)) {
        const oResolved = fResolveGntr(aUse[1] + ':generic');
        if (oResolved.oNode) fAddGeneric(oOwner, oResolved.oNode);
        else aoGntrText.push({ oAttr: oNode, sLabel: `${aUse[1]} (plain name): ${oResolved.sWhy}` });
      }
    }
    // specific-tree:: links: each target has the-owner as generic
    if (oNode.sSpecificTree) {
      for (const sHref of [...fExtractContentHrefs(oNode.sSpecificTree), ...fExtractRefs(oNode.sSpecificTree)]) {
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

  const ooIssue = { 'INH-NONUM': [], 'INH-WRONGNUM': [], 'INH-OWNNUM': [], 'INH-OWNNONUM': [], 'INH-LAST': [], 'INH-ORDER': [], 'INH-EMPTY': [], 'INH-GENDUP': [], 'INH-LOCAL': [], 'INH-REFBROKEN': [],
    'INH-GNTRTEXT': aoGntrText };
  const oCountLocal = {};   // sKeyGen|attr → { oGen, sAttr, aoAttr }
  const oCountRefine = {};  // sKeyGenAttr → { label, nCount }
  let nSpecific = 0, nAttrSpec = 0, nMatch = 0;

  // a-node inside an-"evoluting of X" or "MISC-ATTRIBUTE of X" section (itself included):
  //   its attributes are NOT numbered
  function fInEvoluting(oNodeIn) {
    for (let oN = oNodeIn, nI = 0; oN && nI < 30; oN = oN.oWholeNode, nI++) {
      if (oN.bAttr && rAttrNoNumInside.test(oN.sAttrWord.trim())) return true;
    }
    return false;
  }
  for (const oNode of aoNodeAll) {
    if (oNode.bTree || oNode.aoGeneric.length === 0 || fInEvoluting(oNode)) continue;
    const aoChain = fFindChain(oNode);
    const oGenNum = aoChain.find(fIsNumbered);
    if (!oGenNum) continue;
    const aoSpace = fFindNumSpace(aoChain);
    // the-last number of the-inherited-attr-chain
    const oSpaceLast = aoSpace.reduce((oMax, oS) => !oMax || Number(oS.oGenAttr.sNum) > Number(oMax.oGenAttr.sNum) ? oS : oMax, null);
    const nNumLast = oSpaceLast ? Number(oSpaceLast.oGenAttr.sNum) : 0;
    nSpecific++;
    // the-order key of an-attribute: its OWN NN as the-reader sees it, else its generic's NN
    const aoOrder = [];
    // the-NNs the-specific already uses: a-new NN_ must NOT repeat one
    const oNumTaken = {};
    for (const oC of oNode.aoChild) if (oC.bAttr && oC.sNum) oNumTaken[oC.sNum] = oC;
    // own numbering: a-numbered attribute NOT as the-generic numbers it (ChmcElry 01..12).
    //   then ONLY its own numbers count: its unnumbered attributes (info-resource, DOING,
    //   evoluting at the-end) get NO generic NN and NO order key.
    const bOwnNumbering = oNode.aoChild.some(oC => {
      if (!oC.bAttr || oC.bTree || !oC.sNum) return false;
      const oM = fMatchAttr(oC, aoSpace);
      // an-own attribute numbered AFTER the-chain is the-rule, NOT own numbering
      return oM ? oM.oGenAttr.sNum !== oC.sNum : Number(oC.sNum) <= nNumLast;
    });
    // the-own numbered attributes; those NOT after the-chain's last number (INH-OWNNUM)
    const aoOwnNum = [], aoOwnNoNum = [];
    for (const oAttr of oNode.aoChild) {
      if (!oAttr.bAttr || oAttr.bTree) continue;
      // MISC-ATTRIBUTE: the-place of the-attributes that get NO number, itself too
      if (/^misc([-_ ]?attribute)?$/i.test(oAttr.sAttrWord.trim())) continue;
      nAttrSpec++;
      const oMatch = fMatchAttr(oAttr, aoSpace);
      if (!oMatch) {
        if (oAttr.sNum) {
          // an-own attribute is numbered AFTER the-last number of the-inherited-attr-chain
          aoOwnNum.push(oAttr);
          aoOrder.push({ oAttr, sNum: oAttr.sNum }); continue;   // own number: the-author decided
        }
        // an-own attribute without number gets the-next number AFTER the-chain and the-own numbers;
        //   NOT the-standard end-sections info-resource, DOING, evoluting
        //   its number is given below, AFTER the-own numbers are shifted (INH-OWNNUM)
        if (!rAttrNoNum.test(oAttr.sAttrWord.trim())) aoOwnNoNum.push(oAttr);
        const sKeyLocal = oGenNum.sKey + '|' + fNormAttr(oAttr.sAttrWord);
        (oCountLocal[sKeyLocal] ??= { oGen: oGenNum, sAttr: fNormAttr(oAttr.sAttrWord), aoAttr: [] })
          .aoAttr.push(oAttr);
        continue;
      }
      nMatch++;
      const { oGen, oGenAttr } = oMatch;
      const sLabel = fLabel(oGen, oGenAttr);
      (oCountRefine[oGenAttr.sKey] ??= { sLabel, nCount: 0 }).nCount++;
      const oIssue = { oAttr, sNumNew: oGenAttr.sNum, sLabel, sKeyGen: oGenAttr.sKey };
      if (!oAttr.sNum) {
        // the-NN is taken by another attribute of the-specific: --fix skips it
        const oTaken = oNumTaken[oGenAttr.sNum];
        if (bOwnNumbering) oIssue.bOwn = true;
        else if (oTaken && oTaken !== oAttr) oIssue.sTaken = oTaken.sTitle;
        else oNumTaken[oGenAttr.sNum] = oAttr;
        ooIssue['INH-NONUM'].push(oIssue);
      }
      else if (oAttr.sNum !== oGenAttr.sNum) ooIssue['INH-WRONGNUM'].push(oIssue);
      if (fIsEmpty(oAttr)) ooIssue['INH-EMPTY'].push(oIssue);
      // a-taken NN will NOT be its number: no key, it stays where it is
      if (!oIssue.sTaken && !oIssue.bOwn) aoOrder.push({ oAttr, sNum: oAttr.sNum ?? oGenAttr.sNum });
    }
    // INH-OWNNUM: the-own numbers run WITHOUT gaps right after the-chain's last number, in their
    //   order (number, then place): last 02, 14_x 15_y 04_z 12_w → 03_z 04_w 05_x 06_y. a-number before
    //   the-last, a-gap at the-start or inside, a-twice-given number are-all fixed by the-same renumbering
    if (aoOwnNum.length && oSpaceLast) {
      const aoSorted = aoOwnNum.map((oA, nI) => ({ oA, nI }))
        .sort((o1, o2) => Number(o1.oA.sNum) - Number(o2.oA.sNum) || o1.nI - o2.nI);
      const aoShift = aoSorted.map(({ oA }, nI) => ({ oAttr: oA, sNumNew: String(nNumLast + 1 + nI).padStart(2, '0'),
        sLabel: fLabel(oSpaceLast.oGen, oSpaceLast.oGenAttr), sKeyGen: oSpaceLast.oGenAttr.sKey }));
      const aoMove = aoShift.filter(oS => oS.sNumNew !== oS.oAttr.sNum);
      const sRange = aoShift[0].sNumNew + '..' + aoShift[aoShift.length - 1].sNumNew;
      for (const oS of aoMove) {
        ooIssue['INH-OWNNUM'].push({ oAttr: oS.oAttr, sNumNew: oS.sNumNew, sNumLast: String(nNumLast).padStart(2, '0'),
          sLabel: oS.sLabel, sKeyGen: oS.sKeyGen, bGap: Number(oS.oAttr.sNum) > nNumLast,
          nShift: Number(oS.sNumNew) - Number(oS.oAttr.sNum), aoShift: aoMove, sRange });
      }
    }
    // INH-OWNNONUM: the-next numbers after the-chain and the-own numbers AS THEY WILL BE (renumbered):
    //   numbered before the-shift, 02_x 03_y + unnumbered z gave z 04_ while y shifted to 04_ too,
    //   the-collision skipped y and left 03_x 03_y (model {2026-11-25})
    let nNumOwnNext = Math.max(nNumLast,
      ...(oSpaceLast ? [nNumLast + aoOwnNum.length] : aoOwnNum.map(oA => Number(oA.sNum))),
      ...Object.entries(oNumTaken).filter(([, oA]) => !aoOwnNum.includes(oA)).map(([sN]) => Number(sN)));
    for (const oAttr of aoOwnNoNum) {
      ooIssue['INH-OWNNONUM'].push({ oAttr, sNumNew: String(++nNumOwnNext).padStart(2, '0'), sNumLast: String(nNumLast).padStart(2, '0'),
        sLabel: oSpaceLast ? fLabel(oSpaceLast.oGen, oSpaceLast.oGenAttr) : '' });
    }
    for (let nI = 1; nI < aoOrder.length; nI++) {
      if (aoOrder[nI].sNum < aoOrder[nI - 1].sNum) {
        ooIssue['INH-ORDER'].push({ oAttr: oNode, aoOrder,
          sLabel: aoOrder.map(oO => oO.sNum).join(' ') });
        break;
      }
    }
  }
  // INH-LAST: a-generic has the-name "Mmn'NN_last": NN the-last number of its chain and of its own
  //   attributes, so its specifics number their own attributes from NN+1 (a-search of "Mmn'" shows it)
  const oSetGen = new Set();
  for (const oNode of aoNodeAll) for (const oGen of oNode.aoGeneric) oSetGen.add(oGen);
  for (const oGen of oSetGen) {
    if (oGen.bTree || oGen.bAttr || !oGen.sMain || !oGen.bMainTarget) continue;   // a-real main-name: a-!⇒ target
    const nOwnMax = Math.max(0, ...oGen.aoChild.filter(oC => oC.bAttr && oC.sNum && !oC.bTree).map(oC => Number(oC.sNum)));
    const nChainMax = Math.max(0, ...fFindNumSpace(fFindChain(oGen)).map(oS => Number(oS.oGenAttr.sNum)));
    const nLast = Math.max(nOwnMax, nChainMax);
    const aLastNow = oGen.aName.filter(sName => /'\d{2}_last$/.test(sName));
    const sLastNew = nLast ? `${oGen.sMain}'${String(nLast).padStart(2, '0')}_last` : '';
    if (aLastNow.length === (sLastNew ? 1 : 0) && (!sLastNew || aLastNow[0] === sLastNew)) continue;
    ooIssue['INH-LAST'].push({ oAttr: oGen, sLastNew, aLastNow });
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
  // a-!@ reference is NOT an-href: the-validator does NOT see it, so we check its target
  for (const oFile of aoFileIn) {
    for (const oRef of oFile.aoRef) {
      const oFileTarget = ooFile[oRef.sFile];
      const sWhy = !oFileTarget ? `no file ${oRef.sFile}` :
        !oFileTarget.oSetId.has(oRef.sId) ? `no #${oRef.sId} in ${oRef.sFile}` : '';
      if (sWhy) ooIssue['INH-REFBROKEN'].push({ oAttr: { sNameShort: oRef.sNameShort,
        nLine: oRef.nLine, sTitle: oRef.sRaw }, sLabel: sWhy });
    }
  }
  return { ooIssue, oCountRefine, nSpecific, nAttrSpec, nMatch, nNode: aoNodeAll.length,
    fFindChain, oNodeByMain, oNodeByName };
}

/**
 * DOING: the-inheritance-chain of a-concept, per generic per number, farthest generic first:
 *   "=== bodyNo:" then its numbered attributes as links, down to the-concept itself.
 *   - new: a-number the-chain gives first;
 *   - "~ ... overrides NN": a-number a-farther generic gave, renamed | refined here;
 *   - "?? word → NN_": an-own attribute without number, the-number it gets.
 * INPUT: sChainIn: a-main-name (Hmmdlago), an-English-name, or McshDir000000#idX.
 * OUTPUT: the-lines of the-report.
 */
function fChainReport(aoFileIn, oResultIn, sChainIn, sNameDirIn, sUrlBaseIn) {
  const { fFindChain, oNodeByMain, oNodeByName } = oResultIn;
  const ooFile = {};
  for (const oFile of aoFileIn) ooFile[oFile.sNameShort] = oFile;
  const aLine = [];
  // the-concepts the-input names
  let aoNode;
  const aRef = sChainIn.match(/^(Mcsh[A-Za-z]*\d{6})(?:\.last\.html)?#(id\S+)$/);
  if (aRef) aoNode = ooFile[aRef[1]]?.oNodeById[aRef[2]] ? [ooFile[aRef[1]].oNodeById[aRef[2]]] : [];
  else aoNode = oNodeByMain[sChainIn] ?? oNodeByName[sChainIn] ?? [];
  aoNode = aoNode.filter(oN => !oN.bTree && !oN.bAttr);
  if (aoNode.length === 0) return [`inheritance-chain: NO concept named "${sChainIn}"`];
  const fUrl = oN => sUrlBaseIn + moPath.relative(sNameDirIn, ooFile[oN.sNameShort].sPath).replace(/\\/g, '/') + '#' + oN.sId;
  // the-title-name X'NN_word of an-attribute "NN_word of X"
  const fTitleName = oA => {
    const aT = oA.sTitle.replace(rNewNameTitle, "").match(rTitleAttr);
    return `${fFormalMvrwName01(aT[3].trim())}'${oA.sNum ? oA.sNum + '_' : ''}${fFormalMvrwName01(aT[2].trim())}`;
  };
  const fName = oN => oN.sMain || oN.sTitle;

  for (const oNode of aoNode) {
    // farthest first; the-concept last
    const aoLevel = [...fFindChain(oNode).reverse(), oNode];
    const nFirst = aoLevel.findIndex(oL => oL.aoChild.some(oC => oC.bAttr && oC.sNum && !oC.bTree));
    aLine.push(`inheritance-chain of ${fName(oNode)} (${oNode.sNameShort}:${oNode.nLine} #${oNode.sId})`);
    aLine.push(`  [${fName(oNode)}](${fUrl(oNode)})`);
    aLine.push(`  chain: ${aoLevel.map(fName).join(' → ')}`);
    if (nFirst === -1) { aLine.push('  NO numbered attributes in the-chain', ''); continue; }
    if (nFirst > 0) aLine.push(`  without numbers: ${aoLevel.slice(0, nFirst).map(fName).join(', ')}`);
    // the-numbers and attr-keys given so far → their title-name
    const oNumBy = {};
    const oKeyBy = {};
    // the-attribute of the-NEAREST level with a-key of oA, as fMatchAttr
    const fKeyNear = oA => [...oA.oSetAttrKey].map(sK => oKeyBy[sK]).filter(Boolean)
      .sort((oX, oY) => oY.nLevel - oX.nLevel)[0]?.sName;
    for (const [nLevel, oLevel] of aoLevel.slice(nFirst).entries()) {
      aLine.push(`=== ${fName(oLevel)}:`);
      const aoAttr = oLevel.aoChild.filter(oC => oC.bAttr && !oC.bTree);
      const aoNum = aoAttr.filter(oA => oA.sNum).sort((oA, oB) => oA.sNum.localeCompare(oB.sNum));
      const aOut = [];
      const aoAdd = [];
      for (const oA of aoNum) {
        const sOver = oNumBy[oA.sNum] ?? fKeyNear(oA);
        // a-chain attribute can change its name, NOT its number
        const sNumOver = (sOver ?? '').match(/'(\d{2})_/)?.[1];
        aOut.push(`  ${sOver ? '~ ' : ''}[${fTitleName(oA)}](${fUrl(oA)})${sOver ? `  overrides ${sOver}` : ''}` +
          (sNumOver && sNumOver !== oA.sNum ? `  ✗ number must be ${sNumOver}_` : ''));
        aoAdd.push(oA);
      }
      // one level at once: its numbers do NOT override each other
      for (const oA of aoAdd) {
        oNumBy[oA.sNum] = fTitleName(oA);
        for (const sK of oA.oSetAttrKey) oKeyBy[sK] = { sName: fTitleName(oA), nLevel };
      }
      // own attributes without number: the-next numbers after the-chain and this level
      let nNext = Math.max(0, ...Object.keys(oNumBy).map(Number));
      for (const oA of aoAttr.filter(oA => !oA.sNum)) {
        const sOver = fKeyNear(oA);
        if (sOver) aOut.push(`  ?? [${fTitleName(oA)}](${fUrl(oA)})  inherits ${sOver}: its number`);
        else if (rAttrNoNum.test(oA.sAttrWord.trim()))
          aOut.push(`  .. [${fTitleName(oA)}](${fUrl(oA)})`);
        else aOut.push(`  ?? [${fTitleName(oA)}](${fUrl(oA)})  → ${String(++nNext).padStart(2, '0')}_`);
      }
      aLine.push(...(aOut.length ? aOut : ['  (empty)']));
    }
    aLine.push(`  last: ${Math.max(0, ...Object.keys(oNumBy).map(Number)).toString().padStart(2, '0')}_`, '');
  }
  return aLine;
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
      const { nFrom, nTo } = fFindBlock(sText, oIssue.oAttr);
      sText = sText.slice(0, nFrom) + sText.slice(nTo);
      aoDeleted.push(oIssue);
    }
    moFs.writeFileSync(oFile.sPath, sText);
  }
  return { aoDeleted, aoKept };
}

/**
 * OUTPUT: the-whole lines of a-section: from the-line-start of <section to the-newline
 *   after </section>, and ONE blank line after, so no double blank lines remain.
 */
function fFindBlock(sTextIn, oNodeIn) {
  const nFrom = sTextIn.lastIndexOf('\n', oNodeIn.nStart - 1) + 1;
  let nTo = sTextIn.indexOf('\n', oNodeIn.nEnd);
  nTo = nTo === -1 ? sTextIn.length : nTo + 1;
  const aBlank = sTextIn.slice(nTo).match(/^[ \t]*\r?\n/);
  if (aBlank) nTo += aBlank[0].length;
  return { nFrom, nTo };
}

/**
 * DOING: it puts the-attribute-sections of each INH-ORDER specific in NN order:
 *   the-slots they take stay, the-sections are refilled into them sorted (stable);
 *   everything else of the-specific stays where it is.
 *   A-specific whose range overlaps one already done waits for the-next pass.
 * OUTPUT: the-issues done, with sLabelNew the-new order.
 */
function fApplyOrder(aoFileIn, aoIssueIn) {
  const ooIssueFile = {};
  for (const oIssue of aoIssueIn) (ooIssueFile[oIssue.oAttr.sNameShort] ??= []).push(oIssue);
  const aoDone = [];
  for (const oFile of aoFileIn) {
    const aoIssueFile = ooIssueFile[oFile.sNameShort];
    if (!aoIssueFile) continue;
    const sText = oFile.sText;
    // the-slots of each issue, and its range; no two chosen ranges overlap
    const aoJob = [];
    for (const oIssue of aoIssueFile) {
      const aoSlot = oIssue.aoOrder.map(oO => ({ ...fFindBlock(sText, oO.oAttr), sNum: oO.sNum }))
        .sort((oA, oB) => oA.nFrom - oB.nFrom);
      const nMin = aoSlot[0].nFrom, nMax = aoSlot[aoSlot.length - 1].nTo;
      if (aoJob.some(oJ => nMin < oJ.nMax && oJ.nMin < nMax)) continue;
      aoJob.push({ oIssue, aoSlot, nMin, nMax });
    }
    // from the-end, so the-positions before stay valid
    let sTextNew = sText;
    for (const oJob of aoJob.sort((oA, oB) => oB.nMin - oA.nMin)) {
      const aoSorted = oJob.aoSlot.slice().sort((oA, oB) => oA.sNum.localeCompare(oB.sNum));
      for (let nI = oJob.aoSlot.length - 1; nI >= 0; nI--) {
        const oSlot = oJob.aoSlot[nI];
        const oFill = aoSorted[nI];
        sTextNew = sTextNew.slice(0, oSlot.nFrom) + sText.slice(oFill.nFrom, oFill.nTo) +
          sTextNew.slice(oSlot.nTo);
      }
      oJob.oIssue.sLabelNew = aoSorted.map(oS => oS.sNum).join(' ');
      aoDone.push(oJob.oIssue);
    }
    if (sTextNew !== sText) moFs.writeFileSync(oFile.sPath, sTextNew);
  }
  return aoDone;
}

/**
 * DOING: the-number-fixes of one pass that do NOT collide: a-new NN that another attribute of
 *   the-same concept keeps (it does NOT move in this pass), or that two fixes give, waits.
 * OUTPUT: the-issues to apply.
 */
function fFixableNum(aoIssueIn) {
  const ooByWhole = new Map();
  for (const oIssue of aoIssueIn) {
    const sKey = oIssue.oAttr.sNameShort + '#' + oIssue.oAttr.sIdWhole;
    if (!ooByWhole.has(sKey)) ooByWhole.set(sKey, []);
    ooByWhole.get(sKey).push(oIssue);
  }
  const aoOut = [];
  for (const aoIssue of ooByWhole.values()) {
    const oSetMove = new Set(aoIssue.map(oI => oI.oAttr));
    const aoSib = aoIssue[0].oAttr.oWholeNode?.aoChild ?? [];
    const oSetKeep = new Set(aoSib.filter(oC => oC.bAttr && oC.sNum && !oSetMove.has(oC)).map(oC => oC.sNum));
    const oSetNew = new Set();
    // ONE collision and the-concept waits WHOLE: a-half-done shift left two equal numbers (model 03_ 03_)
    let bCollide = false;
    for (const oIssue of aoIssue) {
      if (oSetKeep.has(oIssue.sNumNew) || oSetNew.has(oIssue.sNumNew)) { bCollide = true; break; }
      oSetNew.add(oIssue.sNumNew);
    }
    if (!bCollide) aoOut.push(...aoIssue);
  }
  return aoOut;
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

/**
 * DOING: it checks that a-numbered attribute "02_valence of relation" has its title as name:
 *   - with a-main-name (a-target of !⇒):
 *       * McshEngl.relation'02_valence!⇒Rltnvalence,
 *       * McshEngl.Rltnvalence!=relation'02_valence,
 *       * McshEngl.relation'valence!⇒Rltnvalence,
 *   - without:
 *       * McshEngl.relation'02_valence,
 *       * McshEngl.relation'valence,
 *   a-name "relation'06_valence" of an-old number is renamed; "relation'04_other" (another word) loses it: relation'other; an-old "Main!=desc" keeps desc as "desc!⇒Main".
 * OUTPUT: { aoPlan: [{ oFile, oNode, nPos, sParaOld, sParaNew, aChange }], aoHand: [{ oNode, sWhy }] }
 */
function fCheckTitleName(aoFileIn, fInFileIn) {
  // the-English-names of the-worldview (without !… and ~plural) → count, to avoid a-new duplicate
  const oCountName = new Map();
  for (const oFile of aoFileIn) for (const oNode of oFile.aoNode) for (const sName of oNode.aName) {
    const sBase = sName.split('~')[0];
    oCountName.set(sBase, (oCountName.get(sBase) ?? 0) + 1);
  }
  const rNamePara = /<p\b[^>]*\bid="[^"]+"[^>]*>\s*name::[\s\S]*?<\/p>/;
  const rLine = /<br>\*\s*McshEngl\.([^\n,]+),/g;
  const fEsc = sIn => sIn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const aoPlan = [], aoHand = [];
  // the-name:: plan at the-target of a-link-stub: null (nothing to do), { sWhy } (by hand), or a-plan
  const fStubName = (oNodeIn, sTnIn, sOfIn, sWordIn, sPlainIn) => {
    const aHref = (oNodeIn.sHrefStub ?? '').match(/^(?:.*?\/)?(?:([^/#]+)\.last\.html)?#([^#]+)$/);
    // a-target NOT read here (another file set, a-broken link: Hvre06 reports it) is skipped, NOT an-issue
    if (!aHref) return null;
    const sStem = aHref[1] ?? oNodeIn.sNameShort, sIdTarget = aHref[2];
    const oFileT = aoFileIn.find(oF => oF.sNameShort === sStem);
    const oNodeT = oFileT?.aoNode.find(oN => oN.sId === sIdTarget);
    if (!oNodeT) return null;
    const sSectT = oFileT.sText.slice(oNodeT.nStart, oNodeT.nEnd);
    const nSubT = sSectT.indexOf('<section', 1);
    const aParaT = (nSubT > 0 ? sSectT.slice(0, nSubT) : sSectT).match(rNamePara);
    if (!aParaT) return { sWhy: `link-stub: its target ${sStem}#${sIdTarget} has no name::` };
    let sPara = aParaT[0];
    const aChange = [];
    const fLinesT = () => [...sPara.matchAll(rLine)].map(aL =>
      ({ sRaw: aL[0], sBody: aL[1], sBase: aL[1].split('!')[0].split('~')[0].trim() }));
    if (!fLinesT().some(oL => oL.sBase === sTnIn)) {
      // an-old number of the-same word is renamed: M'08_input → M'06_input
      const rOld = new RegExp(`^${fEsc(sOfIn)}'\\d{2}_${fEsc(sWordIn)}$`);
      const oOld = fLinesT().find(oL => rOld.test(fFormalMvrwName01(oL.sBase)));
      if (oOld) {
        sPara = sPara.replace(oOld.sRaw, oOld.sRaw.replace(`McshEngl.${oOld.sBase}`, `McshEngl.${sTnIn}`));
        aChange.push(`renamed ${oOld.sBase} → ${sTnIn} (link target)`);
      } else {
        // M'input!⇒Target gets M'06_input!⇒Target before it
        const oPlain = fLinesT().find(oL => oL.sBase === sPlainIn);
        if (!oPlain) return null; // the-target does NOT name it M'input: nothing to number
        if (oCountName.has(sTnIn)) return { sWhy: `${sTnIn} is a-name of another concept` };
        const sIndent = (sPara.slice(0, sPara.indexOf(oPlain.sRaw)).match(/\n([ \t]*)$/) ?? ['', '    '])[1];
        sPara = sPara.replace(oPlain.sRaw, oPlain.sRaw.replace(`McshEngl.${sPlainIn}`, `McshEngl.${sTnIn}`) + '\n' + sIndent + oPlain.sRaw);
        aChange.push(`added ${sTnIn} (link target)`);
      }
    }
    if (!aChange.length) return null;
    return { oFile: oFileT, oNode: oNodeIn, nPos: oNodeT.nStart + sSectT.indexOf(aParaT[0]), sParaOld: aParaT[0], sParaNew: sPara, aChange };
  };
  for (const oFile of aoFileIn) {
    for (const oNode of oFile.aoNode) {
      if (!oNode.bAttr || !oNode.sNum || !fInFileIn(oNode)) continue;
      const aTitle = oNode.sTitle.replace(rNewNameTitle, "").match(rTitleAttr);
      const sOf = aTitle[3].trim(), sWord = aTitle[2].trim();
      if (!/^[^\s,!<>~()'"]+$/.test(sWord) || !/^[^\s,!<>~()'"]+$/.test(sOf)) {
        aoHand.push({ oNode, sWhy: 'the-title is NOT a-name' }); continue;
      }
      // a-formal-name has "_" for space and hyphen (MvrwName01_formal)
      const fFormal = fFormalMvrwName01;
      const sOfF = fFormal(sOf), sWordF = fFormal(sWord);
      const sTn = `${sOfF}'${oNode.sNum}_${sWordF}`, sPlain = `${sOfF}'${sWordF}`;
      // the-name:: paragraph of the-section itself, before its first sub-section
      const sSect = oFile.sText.slice(oNode.nStart, oNode.nEnd);
      const nSub = sSect.indexOf('<section', 1);
      const aPara = (nSub > 0 ? sSect.slice(0, nSub) : sSect).match(rNamePara);
      // a-link-stub "06_input of M (link)": its names are at the-link's target, NOT here:
      //   there M'08_input → M'06_input, or M'06_input!⇒Target is added next to M'input!⇒Target
      if (!aPara && oNode.bLinkStub) {
        const oPlanStub = fStubName(oNode, sTn, sOfF, sWordF, sPlain);
        if (oPlanStub?.sWhy) aoHand.push({ oNode, sWhy: oPlanStub.sWhy });
        else if (oPlanStub) aoPlan.push(oPlanStub);
        continue;
      }
      if (!aPara) { aoHand.push({ oNode, sWhy: 'no name:: paragraph' }); continue; }
      const sParaOld = aPara[0];
      let sPara = sParaOld;
      const aChange = [];
      // the-lines: { sRaw, sBody (between McshEngl. and ,), sBase }
      const fLines = () => [...sPara.matchAll(rLine)].map(aL =>
        ({ sRaw: aL[0], sBody: aL[1], sBase: aL[1].split('!')[0].split('~')[0].trim() }));
      // 1. an-old number or spelling: relation'06_valence → relation'02_valence;
      //    when relation'02_valence is already a-line, the-old line is deleted
      const rOld = new RegExp(`^${fEsc(sOfF)}'(\\d{2})_${fEsc(sWordF)}$`);
      for (const oL of fLines()) {
        if (oL.sBase === sTn || !rOld.test(fFormal(oL.sBase))) continue;
        const bHave = fLines().some(oL2 => oL2.sBase === sTn);
        if (bHave) {
          const nAt = sPara.indexOf(oL.sRaw);
          const nLineStart = sPara.lastIndexOf('\n', nAt);
          sPara = sPara.slice(0, nLineStart) + sPara.slice(nAt + oL.sRaw.length);
          aChange.push(`deleted ${oL.sBase}`);
        } else {
          sPara = sPara.split(`McshEngl.${oL.sBase}!`).join(`McshEngl.${sTn}!`)
            .split(`McshEngl.${oL.sBase},`).join(`McshEngl.${sTn},`);
          aChange.push(`renamed ${oL.sBase} → ${sTn}`);
        }
        sPara = sPara.split(`!=${oL.sBase},`).join(`!=${sTn},`).split(`!⇒${oL.sBase},`).join(`!⇒${sTn},`);
      }
      // 1b. an-old number of ANOTHER word: Ogsmlago'04_grammarOrgm (title 09_grammar) → Ogsmlago'grammarOrgm;
      //     when Ogsmlago'grammarOrgm is already a-line, the-old line is deleted
      const rOldOther = new RegExp(`^${fEsc(sOfF)}'(\\d{2})_(.+)$`);
      let bHandOld = false;
      for (const oL of fLines()) {
        const aOld = oL.sBase.match(rOldOther);
        // NOT a-double number: title "01_05_skill of recipe" has the-names recipe'05_skill, foodCooked'01_00_recipe
        if (!aOld || aOld[1] === oNode.sNum || oL.sBase === sTn || oL.sBase === sPlain || /^\d{2}_/.test(aOld[2])) continue;
        const sNoNum = `${sOfF}'${aOld[2]}`;
        if (fLines().some(oL2 => oL2.sBase === sNoNum)) {
          const nAt = sPara.indexOf(oL.sRaw);
          const nLineStart = sPara.lastIndexOf('\n', nAt);
          sPara = sPara.slice(0, nLineStart) + sPara.slice(nAt + oL.sRaw.length);
          aChange.push(`deleted ${oL.sBase} (old number)`);
        } else if (oCountName.has(sNoNum)) {
          aoHand.push({ oNode, sWhy: `the-old number ${oL.sBase}: ${sNoNum} is a-name of another concept` });
          bHandOld = true; break;
        } else {
          sPara = sPara.split(`McshEngl.${oL.sBase}!`).join(`McshEngl.${sNoNum}!`)
            .split(`McshEngl.${oL.sBase},`).join(`McshEngl.${sNoNum},`);
          aChange.push(`renamed ${oL.sBase} → ${sNoNum} (old number)`);
        }
        sPara = sPara.split(`!=${oL.sBase},`).join(`!=${sNoNum},`).split(`!⇒${oL.sBase},`).join(`!⇒${sNoNum},`);
      }
      if (bHandOld) continue;
      // the-main-name: the-most frequent target of !⇒
      const oCountTarget = new Map();
      for (const oL of fLines()) {
        const aT = oL.sBody.match(/!⇒([^!]+)/);
        if (aT) oCountTarget.set(aT[1].trim(), (oCountTarget.get(aT[1].trim()) ?? 0) + 1);
      }
      const sMain = [...oCountTarget.entries()].sort((aA, aB) => aB[1] - aA[1])[0]?.[0] ?? '';
      const aoL = fLines();
      const nFirst = sPara.indexOf(aoL[0]?.sRaw ?? '\u0000');
      // it inserts a-line before the-first English name, or after a-given line
      const fInsert = (sLineNew, sAfterIn) => {
        const sNew = `<br>* McshEngl.${sLineNew},`;
        if (sAfterIn) {
          const nAt = sPara.indexOf(sAfterIn) + sAfterIn.length;
          const sIndent = (sPara.slice(0, sPara.indexOf(sAfterIn)).match(/\n([ \t]*)$/) ?? ['', '    '])[1];
          sPara = sPara.slice(0, nAt) + '\n' + sIndent + sNew + sPara.slice(nAt);
        } else {
          const sIndent = (sPara.slice(0, nFirst).match(/\n([ \t]*)$/) ?? ['', '    '])[1];
          sPara = sPara.slice(0, nFirst) + sNew + '\n' + sIndent + sPara.slice(nFirst);
        }
        aChange.push(`added ${sLineNew}`);
      };
      const fFind = sBaseIn => fLines().find(oL => oL.sBase === sBaseIn);
      // a-new name must NOT be a-name of another concept
      const fFree = sBaseIn => !oCountName.has(sBaseIn);
      if (nFirst < 0) { aoHand.push({ oNode, sWhy: 'no McshEngl name' }); continue; }

      if (sMain && sMain !== sTn) {
        const oMain = fFind(sMain);
        if (!oMain) { aoHand.push({ oNode, sWhy: `the-main-name ${sMain} is NOT in this name::` }); continue; }
        if (/!⇒/.test(oMain.sBody) || (oMain.sBody.match(/!=/g) ?? []).length > 1) {
          aoHand.push({ oNode, sWhy: `the-main-name line "${oMain.sBody}" is NOT simple` }); continue;
        }
        // the-title-name points to the-main
        const oTn = fFind(sTn);
        if (!oTn) {
          if (!fFree(sTn)) { aoHand.push({ oNode, sWhy: `${sTn} is a-name of another concept` }); continue; }
          fInsert(`${sTn}!⇒${sMain}`);
        } else if (!/!⇒/.test(oTn.sBody) && !/!=/.test(oTn.sBody)) {
          sPara = sPara.replace(oTn.sRaw, oTn.sRaw.replace(/,$/, `!⇒${sMain},`));
          aChange.push(`${sTn} → !⇒${sMain}`);
        } else if (!new RegExp(`!⇒${fEsc(sMain)}(!|$)`).test(oTn.sBody)) {
          aoHand.push({ oNode, sWhy: `${sTn} is "${oTn.sBody}", NOT !⇒${sMain}` }); continue;
        }
        // the-main is described by the-title-name
        const oMainNow = fFind(sMain);
        const aDesc = oMainNow.sBody.match(/!=([^!]+)$/);
        const sDescOld = aDesc ? aDesc[1].trim() : '';
        if (sDescOld !== sTn) {
          const sRawNew = aDesc
            ? oMainNow.sRaw.replace(`!=${aDesc[1]},`, `!=${sTn},`)
            : oMainNow.sRaw.replace(/,$/, `!=${sTn},`);
          sPara = sPara.replace(oMainNow.sRaw, sRawNew);
          aChange.push(`${sMain} !=${sTn}` + (sDescOld ? ` (was !=${sDescOld})` : ''));
          // the-old description stays a-name
          // a-formal old description (X'y, X.y …) as a-name gets "_" for hyphen (MvrwName01_formal)
          const sDescName = /['.:;\/]/.test(sDescOld.replace(/\{[^}]*\}|\([^)]*\)/g, ''))
            ? fFormal(sDescOld) : sDescOld;
          if (sDescName && !fFind(sDescName) && sDescName !== sTn) fInsert(`${sDescName}!⇒${sMain}`, sRawNew);
        }
        // the-plain attr-name
        if (!fFind(sPlain) && fFree(sPlain)) fInsert(`${sPlain}!⇒${sMain}`, fFind(sTn).sRaw);
        // MvrwMain11_line: "X'NN_y!⇒Main" first, "Main!=X'NN_y" second
        const aoNow = fLines();
        const oTnL = fFind(sTn), oMainL = fFind(sMain);
        if (aoNow[0] !== undefined && (aoNow[0].sRaw !== oTnL.sRaw || aoNow[1]?.sRaw !== oMainL.sRaw)) {
          for (const oL of [oTnL, oMainL]) sPara = sPara.replace(new RegExp(`\\n[ \\t]*${fEsc(oL.sRaw)}`), '');
          const sFirstRaw = fLines()[0].sRaw, nAt = sPara.indexOf(sFirstRaw);
          const sIndent = (sPara.slice(0, nAt).match(/\n([ \t]*)$/) ?? ['', '    '])[1];
          sPara = sPara.slice(0, nAt) + oTnL.sRaw + '\n' + sIndent + oMainL.sRaw + '\n' + sIndent + sPara.slice(nAt);
          aChange.push(`${sTn}, ${sMain} moved first`);
        }
      } else {
        if (!fFind(sTn)) {
          if (!fFree(sTn)) { aoHand.push({ oNode, sWhy: `${sTn} is a-name of another concept` }); continue; }
          fInsert(sTn);
        }
        if (!fFind(sPlain) && fFree(sPlain)) fInsert(sPlain, fFind(sTn).sRaw);
      }
      if (sPara !== sParaOld) {
        aoPlan.push({ oFile, oNode, nPos: oNode.nStart + sSect.indexOf(sParaOld), sParaOld, sParaNew: sPara, aChange });
      }
    }
  }
  return { aoPlan, aoHand };
}

/**
 * DOING: it writes the-name:: paragraphs of fCheckTitleName, from the-end of each file.
 * OUTPUT: the-number of paragraphs changed.
 */
function fApplyTitleName(aoPlanIn) {
  const ooPlanFile = new Map();
  for (const oPlan of aoPlanIn) {
    if (!ooPlanFile.has(oPlan.oFile)) ooPlanFile.set(oPlan.oFile, []);
    ooPlanFile.get(oPlan.oFile).push(oPlan);
  }
  let nChanged = 0;
  for (const [oFile, aoPlanFile] of ooPlanFile) {
    let sText = oFile.sText;
    for (const oPlan of aoPlanFile.sort((oA, oB) => oB.nPos - oA.nPos)) {
      if (sText.slice(oPlan.nPos, oPlan.nPos + oPlan.sParaOld.length) !== oPlan.sParaOld) continue;
      sText = sText.slice(0, oPlan.nPos) + oPlan.sParaNew + sText.slice(oPlan.nPos + oPlan.sParaOld.length);
      nChanged++;
    }
    moFs.writeFileSync(oFile.sPath, sText);
  }
  return nChanged;
}

/**
 * DOING: INH-LAST: it writes the-name "Mmn'NN_last," as the-last English name of a-generic's name::
 *   (an-old "X'NN_last" line is deleted). A-generic without name:: is skipped.
 * OUTPUT: the-number of paragraphs changed.
 */
function fApplyLast(aoFileIn, aoIssueIn) {
  const ooIssueFile = new Map();
  for (const oIssue of aoIssueIn) {
    const oFile = aoFileIn.find(oF => oF.sNameShort === oIssue.oAttr.sNameShort);
    if (!ooIssueFile.has(oFile)) ooIssueFile.set(oFile, []);
    ooIssueFile.get(oFile).push(oIssue);
  }
  let nChanged = 0;
  for (const [oFile, aoIssueFile] of ooIssueFile) {
    let sText = oFile.sText;
    // from the-end of the-file, the-positions before stay right
    for (const oIssue of aoIssueFile.sort((oA, oB) => oB.oAttr.nStart - oA.oAttr.nStart)) {
      const oNode = oIssue.oAttr;
      const sSect = sText.slice(oNode.nStart, oNode.nEnd);
      const nSub = sSect.indexOf('<section', 1);
      const aPara = (nSub > 0 ? sSect.slice(0, nSub) : sSect).match(/<p\b[^>]*\bid="[^"]+"[^>]*>\s*name::[\s\S]*?<\/p>/);
      if (!aPara) { oIssue.sSkip = 'no name:: paragraph'; continue; }
      // an-old "X'NN_last" line goes (with any !⇒.. suffix); the-right one stays where the-author put it
      let bKeep = false;
      let sPara = aPara[0].replace(/\r?\n[ \t]*<br>\*\s*McshEngl\.([^\n,!]*'\d{2}_last)[,!][^\n]*/g, (sLine, sName) => {
        if (sName === oIssue.sLastNew && !bKeep) { bKeep = true; return sLine; }
        return '';
      });
      if (oIssue.sLastNew && !bKeep) {
        // the-last English name of the-first block, before the-first "====== lagoX:" line
        const nBlock = sPara.search(/<br>======/);
        const aoLine = [...(nBlock > 0 ? sPara.slice(0, nBlock) : sPara).matchAll(/(\r?\n)([ \t]*)<br>\*\s*McshEngl\.[^\n]*/g)];
        if (!aoLine.length) { oIssue.sSkip = 'no McshEngl name'; continue; }
        const aL = aoLine[aoLine.length - 1];
        const nAt = aL.index + aL[0].length;
        sPara = sPara.slice(0, nAt) + `${aL[1]}${aL[2]}<br>* McshEngl.${oIssue.sLastNew},` + sPara.slice(nAt);
      }
      const nPos = oNode.nStart + sSect.indexOf(aPara[0]);
      sText = sText.slice(0, nPos) + sPara + sText.slice(nPos + aPara[0].length);
      oIssue.bApplied = true;
      nChanged++;
    }
    if (sText !== oFile.sText) moFs.writeFileSync(oFile.sPath, sText);
  }
  return nChanged;
}

function fMain() {
  const aArg = process.argv.slice(2);
  const aArgPath = aArg.filter((sArg, nI) =>
    !sArg.startsWith('--') && !['--file', '--local', '--chain', '--url', '--sub', '--concept'].includes(aArg[nI - 1]));
  const sNameDir = aArgPath[0];
  if (!sNameDir) {
    console.log('inheritMcsh.mjs - it checks the-inheritance of attributes from generic to specific concepts');
    console.log('  ' + aVersion[0]);
    console.log('');
    console.log('USAGE: node dirValid/inheritMcsh.mjs <sNameDir> [--fix] [--delete-empty] [--fix-order] [--fix-name] [--fix-last] [--fix-num] [--sub Mmn] [--chain Mmn] [--file McshDir000000] [--local 3]');
    console.log('  sNameDir     the-path of the-dirMcsh-worldview');
    console.log('  --fix        writes the-NN_ of INH-NONUM into the-h-titles, when the-NN is free');
    console.log('  --delete-empty  deletes the-INH-EMPTY sections: NOT linked, English names only');
    console.log('  --fix-order  puts the-attribute-sections of INH-ORDER specifics in NN order');
    console.log("  --fix-name   writes the-title X'NN_attr of a-numbered attribute as its name (INH-TITLENAME)");
    console.log("  --fix-last   writes only the-name Mmn'NN_last of every generic (INH-LAST); --fix writes it too");
    console.log('  --fix-nonum  numbers ONLY INH-NONUM: an-inherited attribute gets the-NN_ of its generic');
    console.log('  --fix-num    renumbers INH-WRONGNUM (the-number of the-chain) and INH-OWNNUM (after the-chain)');
    console.log('  --sub Mmn    report and fix ONLY concept Mmn, its specifics down the-tree and their attributes');
    console.log('  --concept Mmn  report and fix ONLY concept Mmn and its attributes; with --fix-num an-attribute');
    console.log('               that had the-old number of a-renumbered one follows it (anywhere)');
    console.log('  --file       report (and fix) one file only, given as McshDir000000');
    console.log('  --local      the-min count of specifics for INH-LOCAL (default 3)');
    console.log('  --chain Mmn  ONLY the-inheritance-chain of a-concept, per generic per number (Hmmdlago,');
    console.log('               RltnMapping or McshCor000005#idX), into dirValid/inheritChain.txt; NO fix');
    console.log('  --url        the-base of its links (default http://localhost/dirMcsh/)');
    console.log('  OUTPUT: dirValid/inheritMcsh.txt, overwritten on every run');
    process.exit(1);
  }
  const bFix = aArg.includes('--fix');
  const bDelete = aArg.includes('--delete-empty');
  const bFixOrder = aArg.includes('--fix-order');
  const bFixName = aArg.includes('--fix-name');
  const bFixLast = aArg.includes('--fix-last');
  const nIdxFile = aArg.indexOf('--file');
  const sNameFileOnly = nIdxFile !== -1 ? fFindNameShort(aArg[nIdxFile + 1] ?? '') : '';
  const nIdxLocal = aArg.indexOf('--local');
  const nLocalMin = nIdxLocal !== -1 ? Number(aArg[nIdxLocal + 1]) || 3 : 3;

  const bFixNum = aArg.includes('--fix-num');
  // --fix-nonum: ONLY INH-NONUM (an-inherited attribute gets the-NN_ of its generic), NOT the-own OWNNONUM
  const bFixNonum = aArg.includes('--fix-nonum');
  const nIdxSub = aArg.indexOf('--sub');
  const aSub = nIdxSub !== -1 ? String(aArg[nIdxSub + 1] ?? '').split(',').map(sS => sS.trim()).filter(Boolean) : [];
  // --concept Mmn: as --sub, WITHOUT its specifics
  const nIdxConcept = aArg.indexOf('--concept');
  if (nIdxConcept !== -1) aSub.push(...String(aArg[nIdxConcept + 1] ?? '').split(',').map(sS => sS.trim()).filter(Boolean));
  const bSubTree = nIdxSub !== -1;
  // --fix-num: the-attributes renumbered in this run, file#id → old NN; their followers too
  const oMoved = new Map();

  // ── read ALL files: a-generic may live in another file than its specific ─
  // --sub: ONLY the-concepts named and their specifics, down the-whole tree, with their attributes
  let oSetSub = null;
  // an-attribute renumbered in this run is in, wherever it is (its name:: follows)
  const fInFile = oNode => oMoved.has(oNode.sKey) || ((!sNameFileOnly || oNode.sNameShort === sNameFileOnly) &&
    (!oSetSub || oSetSub.has(oNode) || (oNode.bAttr && oSetSub.has(oNode.oWholeNode))));
  function fReadCheck() {
    const aoFileRead = fFindFile_all(sNameDir).map(fReadFile);
    const oResult = fCheck(aoFileRead, nLocalMin);
    if (aSub.length) {
      const aoNodeAll = aoFileRead.flatMap(oFile => oFile.aoNode);
      const ooSpec = new Map();
      for (const oNode of aoNodeAll) {
        for (const oGen of oNode.aoGeneric) { if (!ooSpec.has(oGen)) ooSpec.set(oGen, []); ooSpec.get(oGen).push(oNode); }
      }
      oSetSub = new Set();
      const aoTodo = aSub.flatMap(sS => oResult.oNodeByMain[sS] ?? oResult.oNodeByName[sS] ?? []);
      if (aoTodo.length === 0) throw new Error(`--sub: NO concept named ${aSub.join(',')}`);
      while (aoTodo.length) {
        const oN = aoTodo.pop();
        if (oSetSub.has(oN)) continue;
        oSetSub.add(oN);
        if (bSubTree) aoTodo.push(...(ooSpec.get(oN) ?? []));
      }
    }
    // a-follower: an-attribute that had the-old number of a-renumbered generic-attribute (it was right)
    oResult.aoFollow = oResult.ooIssue['INH-WRONGNUM'].filter(oI => oMoved.get(oI.sKeyGen) === oI.oAttr.sNum);
    // an-own number of a-specific that collides now, because its chain's last attribute moved up
    oResult.aoFollowOwn = oResult.ooIssue['INH-OWNNUM'].filter(oI => oMoved.has(oI.sKeyGen));
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
  // --chain: the-inheritance-chain of concepts, nothing else
  const nIdxChain = aArg.indexOf('--chain');
  if (nIdxChain !== -1) {
    const nIdxUrl = aArg.indexOf('--url');
    const sUrlBase = nIdxUrl !== -1 ? aArg[nIdxUrl + 1] : 'http://localhost/dirMcsh/';
    const aLineChain = String(aArg[nIdxChain + 1] ?? '').split(',').filter(Boolean)
      .flatMap(sChain => fChainReport(aoFile, oResult, sChain.trim(), sNameDir, sUrlBase));
    const sPathChain = moPath.join(sDirScript, 'inheritChain.txt');
    moFs.writeFileSync(sPathChain, aLineChain.join('\n') + '\n');
    console.log(aLineChain.join('\n'));
    console.log(`📄 report written: ${sPathChain}`);
    return;
  }
  for (let nPass = 0; (bFix || bFixNum || bFixNonum) && nPass < 8; nPass++) {
    const aoFixable = fFixableNum([
      ...(bFix || bFixNonum ? oResult.ooIssue['INH-NONUM'].filter(oIssue => !oIssue.sTaken && !oIssue.bOwn) : []),
      ...(bFix ? oResult.ooIssue['INH-OWNNONUM'] : []),
      ...(bFixNum ? [...oResult.ooIssue['INH-WRONGNUM'],
        ...oResult.aoFollow.filter(oI => !oResult.ooIssue['INH-WRONGNUM'].includes(oI)),
        ...[...new Set([...oResult.ooIssue['INH-OWNNUM'], ...oResult.aoFollowOwn].flatMap(oI => oI.aoShift))]] : [])]);
    const nPassChanged = fApplyFix(aoFile, aoFixable);
    for (const oIssue of aoFixable) if (oIssue.bApplied && oIssue.oAttr.sNum) oMoved.set(oIssue.oAttr.sKey, oIssue.oAttr.sNum);
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
  // --fix-order: pass after pass, because a-nested specific waits for its outer one
  const aoOrdered = [];
  for (let nPass = 0; bFixOrder && nPass < 5; nPass++) {
    const aoDone = fApplyOrder(aoFile, oResult.ooIssue['INH-ORDER']);
    if (aoDone.length === 0) break;
    aoOrdered.push(...aoDone);
    ({ aoFileRead: aoFile, oResult } = fReadCheck());
  }
  // --fix: the-name Mmn'NN_last of every generic, after the-numbers are final
  let nLastChanged = 0;
  if ((bFix || bFixLast || bFixNum) &&oResult.ooIssue['INH-LAST'].length) {
    nLastChanged = fApplyLast(aoFile, oResult.ooIssue['INH-LAST']);
    if (nLastChanged) ({ aoFileRead: aoFile, oResult } = fReadCheck());
  }
  // --fix-name: the-title of a-numbered attribute as its name
  let { aoPlan: aoTitleName, aoHand: aoTitleHand } = fCheckTitleName(aoFile, fInFile);
  let nTitleName = 0;
  // --fix-stub: ONLY the-names at the-targets of link-stubs (written into the-report below)
  const aStubLine = [];
  if (aArg.includes('--fix-stub')) {
    const aoStub = aoTitleName.filter(oPlan => oPlan.aChange.every(sC => sC.endsWith('(link target)')));
    aStubLine.push(`  link-stub target names changed: ${fApplyTitleName(aoStub)}`);
    for (const oPlan of aoStub) aStubLine.push(`    ${oPlan.oNode.sNameShort}:${oPlan.oNode.nLine}  ${oPlan.aChange.join('; ')}`);
    ({ aoFileRead: aoFile, oResult } = fReadCheck());
    ({ aoPlan: aoTitleName, aoHand: aoTitleHand } = fCheckTitleName(aoFile, fInFile));
  }
  if (bFixName && aoTitleName.length) {
    nTitleName = fApplyTitleName(aoTitleName);
    ({ aoFileRead: aoFile, oResult } = fReadCheck());
  }
  const { ooIssue, oCountRefine, nSpecific, nAttrSpec, nMatch, nNode } = oResult;
  ooIssue['INH-TITLENAME'] = bFixName ? [] : aoTitleName.map(oPlan => ({ oAttr: oPlan.oNode, oPlan }));
  ooIssue['INH-TITLEHAND'] = aoTitleHand.map(oHand => ({ oAttr: oHand.oNode, sLabel: oHand.sWhy }));

  // ── the-report ────────────────────────────────────────────────────────────
  const aLineOut = [];
  const fOut = sIn => aLineOut.push(sIn);
  // per file, the-biggest line first, files by name
  const fSortIssue = aoIn => aoIn.slice().sort((oA, oB) =>
    oA.oAttr.sNameShort.localeCompare(oB.oAttr.sNameShort) || oB.oAttr.nLine - oA.oAttr.nLine);

  fOut('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  fOut(`  INHERITANCE SYNC${bFix || bDelete || bFixOrder || bFixName || bFixLast || bFixNum || bFixNonum ? ' — APPLIED' : ' — dry run'}: ${sNameDir}` +
    (sNameFileOnly ? ` (file ${sNameFileOnly})` : '') + (aSub.length ? ` (sub ${aSub.join(',')}: ${oSetSub.size} concepts)` : ''));
  fOut('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  fOut(`  ${aoFile.length} files · ${nNode} sections · ${nSpecific} specifics under a-numbered generic · ` +
    `${nAttrSpec} of their attributes · ${nMatch} match a-numbered generic-attribute`);
  if (bFix || bFixNum || bFixNonum) fOut(`  titles changed: ${nChanged}`);
  if (bFixName) fOut(`  name:: paragraphs changed: ${nTitleName}`);
  if (bFix || bFixLast) fOut(`  NN_last names changed: ${nLastChanged}`);
  aStubLine.forEach(fOut);
  fOut('  Rule: a-specific-attribute takes the-NN_ of the-generic-attribute it refines;');
  fOut('        a-specific WITHOUT an-attribute inherits it, it is NOT an-issue.');
  fOut('');
  fOut('SUMMARY');
  const ooDesc = {
    'INH-NONUM': 'matches a-numbered generic-attribute, has no NN_ (--fix adds it, if NN free)',
    'INH-WRONGNUM': 'its NN_ differs from the-generic-attribute (own numbering? by hand)',
    'INH-OWNNUM': 'an-own numbered attribute NOT right after the-last number of the-inherited-attr-chain',
    'INH-OWNNONUM': 'an-own attribute without number: it gets the-next NN after the-chain (--fix writes it)',
    'INH-LAST': "a-generic without (or with an-old) name Mmn'NN_last: NN the-last number its specifics continue from (--fix writes it)",
    'INH-ORDER': 'the-attributes of a-specific are not in the-NN order of its generic',
    'INH-EMPTY': 'an-inherited attribute that says nothing new (no info, no link): delete?',
    'INH-GENDUP': 'a-numbered generic gives the-same NN_ to two attributes: renumber',
    'INH-REFBROKEN': 'a-text-reference name!@File#id whose file or id does NOT exist',
    'INH-GNTRTEXT': 'a-generic "X:generic" in generic-tree:: that does NOT resolve to one concept',
    'INH-TITLENAME': "a-numbered attribute without its title X'NN_attr as name (--fix-name writes it)",
    'INH-TITLEHAND': 'a-numbered attribute whose title-name needs a-hand',
    'INH-LOCAL': `an-attribute in ${nLocalMin}+ specifics, not in the-generic: lift it up?`
  };
  for (const sCode of Object.keys(ooIssue)) {
    fOut(`  ${sCode.padEnd(13)} ${String(ooIssue[sCode].length).padStart(5)}  ${ooDesc[sCode]}`);
  }
  fOut('');

  if (bFixOrder) {
    fOut(`=== ORDER-FIXED (${aoOrdered.length}) — attribute-sections moved into NN order`);
    for (const oIssue of fSortIssue(aoOrdered)) {
      fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  "${oIssue.oAttr.sTitle}"` +
        `  ${oIssue.sLabel} → ${oIssue.sLabelNew}`);
    }
    fOut('');
  }
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
        `  → ${oIssue.sNumNew}_` + (oIssue.sTaken ? ` ✗ NN taken by "${oIssue.sTaken}"` :
          oIssue.bOwn ? ' ✗ own numbering of the-specific: by hand' : '');
      fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  "${oIssue.oAttr.sTitle}"${sNew}  ← ${oIssue.sLabel}`);
    }
    fOut('');
  }
  fOut(`=== INH-OWNNUM (${ooIssue['INH-OWNNUM'].length}) — ${ooDesc['INH-OWNNUM']}`);
  for (const oIssue of fSortIssue(ooIssue['INH-OWNNUM'])) {
    fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  "${oIssue.oAttr.sTitle}"  last ${oIssue.sNumLast}_ ← ${oIssue.sLabel}`);
  }
  fOut('');
  fOut(`=== INH-LAST (${ooIssue['INH-LAST'].length}) — ${ooDesc['INH-LAST']}`);
  for (const oIssue of fSortIssue(ooIssue['INH-LAST'])) {
    fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  "${oIssue.oAttr.sTitle}"  ` +
      `${oIssue.aLastNow.join(' ') || '(none)'} → ${oIssue.sLastNew || '(delete)'}`);
  }
  fOut('');
  fOut(`=== INH-OWNNONUM (${ooIssue['INH-OWNNONUM'].length}) — ${ooDesc['INH-OWNNONUM']}`);
  for (const oIssue of fSortIssue(ooIssue['INH-OWNNONUM'])) {
    fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  "${oIssue.oAttr.sTitle}"  → ${oIssue.sNumNew}_  (last ${oIssue.sNumLast}_ ← ${oIssue.sLabel})`);
  }
  fOut('');
  fOut(`=== INH-ORDER (${ooIssue['INH-ORDER'].length}) — ${ooDesc['INH-ORDER']}`);
  for (const oIssue of fSortIssue(ooIssue['INH-ORDER'])) {
    fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  "${oIssue.oAttr.sTitle}"  order: ${oIssue.sLabel}`);
  }
  fOut('');
  fOut(`=== INH-GNTRTEXT (${ooIssue['INH-GNTRTEXT'].length}) — ${ooDesc['INH-GNTRTEXT']}`);
  for (const oIssue of fSortIssue(ooIssue['INH-GNTRTEXT'])) {
    fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  #${oIssue.oAttr.sId}  ${oIssue.sLabel}`);
  }
  fOut('');
  // --fix-name: the-changes written; else the-changes it would write
  const aoTitleShow = bFixName ? aoTitleName.map(oPlan => ({ oAttr: oPlan.oNode, oPlan })) : ooIssue['INH-TITLENAME'];
  fOut(`=== ${bFixName ? 'TITLENAME-APPLIED' : 'INH-TITLENAME'} (${aoTitleShow.length}) — ${ooDesc['INH-TITLENAME']}`);
  for (const oIssue of fSortIssue(aoTitleShow)) {
    fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  "${oIssue.oAttr.sTitle}"  ${oIssue.oPlan.aChange.join('; ')}`);
  }
  fOut('');
  fOut(`=== INH-TITLEHAND (${ooIssue['INH-TITLEHAND'].length}) — ${ooDesc['INH-TITLEHAND']}`);
  for (const oIssue of fSortIssue(ooIssue['INH-TITLEHAND'])) {
    fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  "${oIssue.oAttr.sTitle}"  ${oIssue.sLabel}`);
  }
  fOut('');
  fOut(`=== INH-REFBROKEN (${ooIssue['INH-REFBROKEN'].length}) — ${ooDesc['INH-REFBROKEN']}`);
  for (const oIssue of fSortIssue(ooIssue['INH-REFBROKEN'])) {
    fOut(`  ${oIssue.oAttr.sNameShort}:${oIssue.oAttr.nLine}  "${oIssue.oAttr.sTitle}"  ${oIssue.sLabel}`);
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
  for (const sLine of aLineOut.slice(0, 22)) console.log(sLine);
  console.log(`📄 report written: ${sPathOut} (${aLineOut.length} lines)`);
}

/**
 * DOING: MvrwGstr03_inherited_attr inherited_attr of structuralMcsh.js: the-issues of the-inheritance-rules
 *   (INH-NONUM, INH-WRONGNUM, INH-OWNNUM, INH-TITLENAME, INH-TITLEHAND) of a-worldview.
 * OUTPUT: [{ sNameShort, nLine, sTitle, sMessage }]
 */
// the-last result of fFindInheritAttr: { sKey, aoOut }; createMcsh calls it once per file
let oMemoInherit = null;
function fFindInheritAttr(sNameDirIn) {
  // the-WHOLE worldview, also when the-validator is given a-sub-dir (validate-file gives dirLag):
  //   a-generic may be in another dir (RltnMapping of Ogsmlago is in dirCor). the-root has dirNamidx.
  let sRoot = moPath.resolve(sNameDirIn);
  for (let sDir = sRoot, nI = 0; nI < 6; nI++) {
    if (moFs.existsSync(moPath.join(sDir, 'dirNamidx'))) { sRoot = sDir; break; }
    const sUp = moPath.dirname(sDir);
    if (sUp === sDir) break;
    sDir = sUp;
  }
  // the-key: the-paths, sizes and times of the-files; a-written file makes a-new key
  const aPath = fFindFile_all(sRoot);
  const sKey = aPath.map(sPath => { const oS = moFs.statSync(sPath); return `${sPath}|${oS.size}|${oS.mtimeMs}`; }).join('\n');
  if (oMemoInherit?.sKey === sKey) return oMemoInherit.aoOut;
  const aoOut = fFindInheritAttrRead(aPath);
  oMemoInherit = { sKey, aoOut };
  return aoOut;
}
function fFindInheritAttrRead(aPathIn) {
  const aoFile = aPathIn.map(fReadFile);
  const { ooIssue } = fCheck(aoFile, 3);
  const { aoPlan, aoHand } = fCheckTitleName(aoFile, () => true);
  const aoOut = [];
  // the-command that renumbers it, and its specifics with the-old number
  const fFixNum = oI => ` (inheritMcsh --concept ${oI.oAttr.oWholeNode?.sMain || '?'} --fix-num --fix-name)`;
  const fPush = (oAttr, sMessage) => aoOut.push({ sNameShort: oAttr.sNameShort, nLine: oAttr.nLine, sTitle: oAttr.sTitle, sMessage });
  for (const oI of ooIssue['INH-NONUM']) fPush(oI.oAttr,
    `inherited_attr: "${oI.oAttr.sTitle}" is an-inherited attribute of ${oI.sLabel}: number it ${oI.sNumNew}_`);
  for (const oI of ooIssue['INH-WRONGNUM']) fPush(oI.oAttr,
    `inherited_attr: "${oI.oAttr.sTitle}" inherits ${oI.sLabel}: its name can change, NOT its number ${oI.sNumNew}_` + fFixNum(oI));
  for (const oI of ooIssue['INH-OWNNUM']) fPush(oI.oAttr,
    `inherited_attr: own attribute "${oI.oAttr.sTitle}" must be numbered RIGHT AFTER (no gaps) the-last number ${oI.sNumLast}_ of its inherited-attr-chain (${oI.sLabel}): it gets ${oI.sNumNew}_, the-own numbers become ${oI.sRange}` + fFixNum(oI));
  // two attributes with the-same NN_ in one concept: by hand (the-fix waits)
  for (const oI of ooIssue['INH-GENDUP']) fPush(oI.oAttr,
    `inherited_attr: "${oI.oAttr.sTitle}" has the-same number as another attribute: ${oI.sLabel}; renumber by hand`);
  for (const oI of ooIssue['INH-LAST']) fPush(oI.oAttr,
    `inherited_attr: generic "${oI.oAttr.sTitle}" ` + (oI.sLastNew
      ? `has NOT the-name "${oI.sLastNew}" (its specifics number their own attributes after it)`
      : `has an-old name "${oI.aLastNow.join(', ')}": no numbers`) + ' (inheritMcsh --fix)');
  for (const oI of ooIssue['INH-OWNNONUM']) fPush(oI.oAttr,
    `inherited_attr: own attribute "${oI.oAttr.sTitle}" has no number: it gets ${oI.sNumNew}_, AFTER the-last number ${oI.sNumLast}_ of its inherited-attr-chain` +
    (oI.sLabel ? ` (${oI.sLabel})` : '') + ' (inheritMcsh --fix)');
  for (const oP of aoPlan) fPush(oP.oNode,
    `inherited_attr: the-title of "${oP.oNode.sTitle}" is NOT its descriptive-name (inheritMcsh --fix-name: ${oP.aChange.join('; ')})`);
  for (const oH of aoHand) fPush(oH.oNode,
    `inherited_attr: the-title of "${oH.oNode.sTitle}" is NOT its descriptive-name: ${oH.sWhy}`);
  return aoOut;
}

export { fFindInheritAttr };

// run as a-program only, NOT when imported by structuralMcsh.js
if (process.argv[1] && moPath.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    fMain();
  } catch (oErr) {
    console.error('\n❌ Fatal error:', oErr.stack);
    process.exit(1);
  }
}
