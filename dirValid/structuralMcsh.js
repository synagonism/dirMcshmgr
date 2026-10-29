/**
 * structural.js
 * Mcsh-concept consistency checks — fast, no AI needed.
 * Runs only on Mcsh-files; generic-Hitp structure (version, links, anchors, ids,
 * tag pairs…) is validated separately by structuralHitp.js (H-codes).
 *
 * Uses the data model from parser.js:
 *   oCnptFile → { sType, sPathFile, sNameFile, oSectOverview, aoCnptSect, aoPara,
 *             oSetId, aLinks, oMapIdLine, oMapLinkLine, nLineTitle }
 *   oSect → { sType, sNameId, sIdWhole_elmt, sNameTitle, nHeadingLevel, nDepth,
 *             aoPara, aoTitlePara, aName, aoName, aLinks }
 *   oPara → { sType, sNameId, sNameTitle, sText, aoName, aName, aLinks }
 *
 * types:
 * ❌ ERROR
 * ⚠️ WARN
 * ℹ️ INFO
 * 
 * Checks (Mcsh-specific; Hitp-covered ones removed):
 *  Mvre01  cnptFile missing idOverview section
 *  Mvre02  Duplicate name-line, in every McsLago (the-whole-line to the-comma) in the-worldview
 * 
 *  Mvrw01  cnptSect missing description::-paragraph
 *  Mvrw02  cnptSect has description:: but it is empty (only placeholder "·")
 *  Mvrw03  cnptSect missing name::-paragraph
 *  Mvrw04  cnptSect name:: has zero valid Mcsh* entries
 *  Mvrw06  dates not in {YYYY-MM-DD} format
 *
 *  MvrlId01  (warning) non-english-letters: id="..." has a letter outside A-Z a-z
 *  MvrlId02  (warning) dong_DOING_suffix: the-id of a "DOING of X" | "X'DOING" cnptSect does not end in "dong"
 *  MvrlId03  (warning) space_in_id: id="..." or href="#..." has a space
 *  MvrlId04  (warning) eval_evaluation_suffix: the-id of an "evaluation of X" | "X'evaluation" cnptSect does not end in "eval"
 *  MvrlId05  (warning) evog_evoluting_suffix: the-id of an "evoluting of X" | "X'evoluting" cnptSect does not end in "evog"
 *  MvrlId06  (warning) irsc_info_resource_suffix: the-id of an "info-resource of X" | "X'info-resource" cnptSect does not end in "irsc"
 *  MvrlId07  (warning) pntr_parent_tree_suffix: the-id of a "parent-tree::" para does not end in "pntr"
 *  MvrlId08  (warning) chtr_child_tree_suffix: the-id of a "child-tree::" para does not end in "chtr"
 *  MvrlId09  (warning) wltr_whole_tree_suffix: the-id of a "whole-tree::" para does not end in "wltr"
 *  MvrlId10  (warning) prtr_part_tree_suffix: the-id of a "part-tree::" para does not end in "prtr"
 *  MvrlId11  (warning) gntr_generic_tree_suffix: the-id of a "generic-tree::" para does not end in "gntr"
 *  MvrlId12  (warning) sptr_specific_tree_suffix: the-id of a "specific-tree::" para does not end in "sptr" (or sptrA, sptr2 of a-list)
 *  MvrlId13  (warning) srtr_structure_suffix: the-id of a "structure of X" | "X'structure" cnptSect does not end in "srtr"
 *
 *  MvrlGstr01 (warning) specific_has_generic: generic X has specific Y (a-linked item of X's "specific-tree::"),
 *             but Y does NOT have X as generic (in its "generic-tree::", by nesting, or through its generic-chain)
 *  MvrlGstr02 (warning) generic_has_specific: specific S has generic G (first item of a-"===" group of its "generic-tree::"),
 *             but G does NOT list S in its "specific-tree::" (link or name), and S is NOT a-part-section of G
 *             In a-"generic-tree::" only plain "===" groups hold generics; the-items of a-"=== label:" group
 *             (sibling-of-X:, att-tree-of-X:, inherited-from-att::) are NOT generics.
 *
 *  MvrlMmn01 (error) no-hyphen: a-main-name (the-text after "!⇒") has a-hyphen "-": use underscores;
 *             createMcsh.mjs --mainname fixes it
 *  MvrlMmn02 (warning) evolg_evoluting_main: the-main-name of an "evoluting of X" | "X'evoluting" cnptSect
 *             does not end in "evolg" or does not start with a-capital letter (Xevolg, a-multiword attribute)
 *  MvrlMmn03 (warning) evaln_evaluation_main | evalg_evaluating_main: the-main-name of an "evaluation of X" | "X'evaluation" cnptSect
 *             is not Xevaln, of an "evaluating of X" | "X'evaluating" cnptSect is not Xevalg (capital first, no apostrophe)
 *  MvrlMmn04 (warning) doing_DOING_main: the-main-name of a "DOING of X" | "X'DOING" cnptSect
 *             does not end in "doing" (no apostrophe before it) or does not start with a-capital letter (Xdoing)
 *  MvrlMmn05 (warning) infrsc_info_resource_main: the-main-name of an "info-resource of X" | "X'info-resource" cnptSect
 *             does not end in "infrsc" (no apostrophe before it) or does not start with a-capital letter (Xinfrsc)
 *  MvrlMmn06 (warning) srtr_structure_main: the-main-name of a "structure of X" | "X'structure" cnptSect
 *             does not end in "srtr" (no apostrophe before it) or does not start with a-capital letter (Xsrtr)
 *  MvrlMmn07 (warning) attrbase_line: the-Attrbase line "McshEngl.B!Attrbase," | "McshEngl.B!Attrbase!⇒M,"
 *             is not the-3rd name-line (after "M!=I") or the-4th (after "M!@McshXxx" of a-file-concept),
 *             or is badly written
 */

import { fStripTags } from './parserMcsh.js';

const
  aVersion = [
    'structuralMcsh.js.0-39-0.2026-10-29: MvrlMmn07 attrbase_line',
    'structuralMcsh.js.0-38-0.2026-10-28: MvrlMmn03 evaluation → Xevaln, evaluating → Xevalg',
    'structuralMcsh.js.0-37-0.2026-10-28: rules MvrlMnnm01..06 renamed MvrlMmn01..06',
    'structuralMcsh.js.0-36-0.2026-10-27: MvrlMmn06 srtr_structure_main',
    'structuralMcsh.js.0-35-0.2026-10-26: MvrlMmn05 infrsc_info_resource_main',
    'structuralMcsh.js.0-34-0.2026-10-26: MvrlMmn04 doing_DOING_main; no apostrophe before the-suffix',
    'structuralMcsh.js.0-33-0.2026-10-26: MvrlMmn03 evalg_evaluating_main, fCheckMainNameSuffix shared',
    'structuralMcsh.js.0-32-0.2026-10-26: MvrlMmn02 main-name starts with a-capital letter',
    'structuralMcsh.js.0-31-0.2026-10-26: MvrlMmn02 evolg_evoluting_main',
    'structuralMcsh.js.0-30-0.2026-10-24: generic-tree:: "=== label:" groups are NOT generics (MvrlGstr01/02)',
    'structuralMcsh.js.0-29-0.2026-10-24: MvrlId13 srtr_structure_suffix',
    'structuralMcsh.js.0-28-0.2026-10-24: MvrlMmn01 no-hyphen, main-names with underscores',
    'structuralMcsh.js.0-27-0.2026-10-22: MvrlGstr02 generic_has_specific, fGstrIndex shared',
    'structuralMcsh.js.0-26-0.2026-10-20: MvrlGstr01 specific_has_generic',
    'structuralMcsh.js.0-25-0.2026-10-19: MvrlId12 sptr_specific_tree_suffix, fCheckIdParaSuffix rEndIn',
    'structuralMcsh.js.0-24-0.2026-10-19: MvrlId11 gntr_generic_tree_suffix',
    'structuralMcsh.js.0-23-0.2026-10-19: MvrlId10 prtr_part_tree_suffix',
    'structuralMcsh.js.0-22-0.2026-10-19: MvrlId09 wltr_whole_tree_suffix',
    'structuralMcsh.js.0-21-0.2026-10-19: MvrlId08 chtr_child_tree_suffix',
    'structuralMcsh.js.0-20-0.2026-10-19: MvrlId07 pntr_parent_tree_suffix, fCheckIdParaSuffix',
    'structuralMcsh.js.0-19-0.2026-10-19: MvrlId06 irsc_info_resource_suffix',
    'structuralMcsh.js.0-18-0.2026-10-19: MvrlId05 evog_evoluting_suffix',
    'structuralMcsh.js.0-17-0.2026-10-19: MvrlId04 eval_evaluation_suffix, fCheckIdSuffix shared with MvrlId02',
    'structuralMcsh.js.0-16-0.2026-10-19: MvrlId03 space_in_id',
    'structuralMcsh.js.0-15-0.2026-10-19: MvrlId02 dong_DOING_suffix',
    'structuralMcsh.js.0-14-0.2026-10-19: MvrlId01 non-english-letters',
    'structuralMcsh.js.0-13-0.2026-10-09: renaming',
    'structuralMcsh.js.0-12-0.2026-10-04: fRunChecksMcsh bQuietIn, for reportMcsh.mjs',
    'structuralMcsh.js.0-11-0.2026-10-04: Mvre01 tells missing from unclosed idOverview',
    'structuralMcsh.js.0-10-0.2026-10-03: fFindIdElmt removed, every cnpt has sNameId',
    'structuralMcsh.js.0-9-0.2026-10-03: Mvre02 checks every McsLago, not only Engl',
    'structuralMcsh.js.0-8-0.2026-10-03: Mvre02 keys the-whole-name-line',
    'structuralMcsh.js.0-7-0.2026-10-02: Mvre02 sees cnptFile-names and duplicates',
    'structuralMcsh.js.0-6-0.2026-10-02: parserMcsh-model (ooIdRelaCnpt, aoTitlePara)',
    'structural.js.0-5-0.2026-10-01: Mvrw06 per-token, set-notation not a date',
    'structural.js.0-4-0.2026-09-05: Mcsh-only (S→M), Hitp checks removed',
    'structural.js.0-3-0.2026-09-04: naming convention',
    'structural.js.0-2-0.2026-05-02: DATE not TeX',
    'structural.js.0-1-0.2026-04-27: creation'
  ]

// ─── helpers ──────────────────────────────────────────────────────────────────

function fIssue(sLevel, sCode, sNameFile, oSectOrNull, sMessage, nLine = null) {
  return {
    sLevel,
    sCode,
    sNameFile,
    sConcept: oSectOrNull?.sNameTitle ?? null,
    sIdConcept: oSectOrNull?.sNameId ?? null,
    nLine,
    sMessage,
  };
}

/**
 * DOING: finds the-concepts of a-file, the-cnptSect and cnptPara of ooIdRelaCnpt.
 * INPUT: one cnptFile-object and the-sType wanted, '' for both.
 * OUTPUT: array of concept-objects, each with its sNameIdRela as sIdCnpt.
 */
function fFindCnpt(oCnptFile, sTypeIn = '') {
  const aoCnpt = [];
  for (const [sIdCnpt, oCnpt] of Object.entries(oCnptFile.ooIdRelaCnpt ?? {})) {
    if (sTypeIn !== '' && oCnpt.sType !== sTypeIn) continue;
    aoCnpt.push({ ...oCnpt, sIdCnpt });
  }
  return aoCnpt;
}

/**
 * DOING: finds the-para of a-concept with the-given title, aoTitlePara is an-ARRAY
 *   of {sNameTitle, sPara}, so a-title can hold more than one para.
 * OUTPUT: array of para-objects [{sNameTitle, sPara}].
 */
function fFindParaAll(oCnptIn, sNameTitleIn) {
  return (oCnptIn.aoTitlePara ?? []).filter(oPara => oPara.sNameTitle === sNameTitleIn);
}

/**
 * OUTPUT: the-plain-text of a-para, the-sPara is raw-HTML.
 */
function fFindParaText(oParaIn) {
  return fStripTags(oParaIn.sPara ?? '');
}

/**
 * OUTPUT: the-count of McsLago-names of a-concept, over all its McsLago.
 *   aoName holds every name-line, so a-name written twice counts twice.
 */
function fCountName(oCnptIn) {
  let nName = 0;
  for (const oLago of Object.values(oCnptIn.ooNameLago ?? {})) {
    nName += (oLago.aoName ?? []).length;
  }
  return nName;
}

/**
 * DOING: the-cnptFile is a-concept too: its names are in the name::-para of
 *   idOverview, NOT in ooIdRelaCnpt, so we build a-concept-object for it.
 * OUTPUT: one concept-like object of the-file itself.
 */
function fFindCnptOfFile(oCnptFile) {
  const oParaName = (oCnptFile.aoTitlePara ?? []).find(oPara => oPara.sNameTitle === 'name');
  return {
    sType: 'cnptFile',
    ooNameLago: oCnptFile.ooNameLago,
    sNameTitle: oCnptFile.sNameTitle,
    sNameId: oParaName?.sNameId ?? 'idOverview'
  };
}

/** Build a map: sName → [{ sNameFile, sNameId, sTitle }] for duplicate detection */
function fBuildMapName(aoCnptFile) {
  const oMap = new Map();
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    // the-names of the-cnptFile, the-cnptSect and the-cnptPara, in EVERY McsLago.
    // aoName keeps the-duplicates of one name::-para, which the-aNoun|aVerb|...
    // arrays deduplicate away.
    for (const oCnpt of [fFindCnptOfFile(oCnptFile), ...fFindCnpt(oCnptFile)]) {
      for (const oLago of Object.values(oCnpt.ooNameLago ?? {})) {
        for (const oName of oLago.aoName ?? []) {
          // the-key is the-WHOLE name-line to the-comma WITH its McsLago:
          // "McshEngl.young!~adjeEngl:animal", so "young" and
          // "young!~adjeEngl:animal" are NOT duplicates, and the-same text in
          // two McsLago (McshElln. and McshElla.) is NOT a-duplicate either.
          const sKey = 'Mcsh' + oName.sLago + '.' + oName.sNameFull;
          if (!oMap.has(sKey)) oMap.set(sKey, []);
          oMap.get(sKey).push({
            sNameFile: oCnptFile.sNameFile, sNameId: oCnpt.sNameId,
            sTitle: oCnpt.sNameTitle
          });
        }
      }
    }
  }
  return oMap;
}

// ─── individual checks ────────────────────────────────────────────────────────

// ❌ Mvre01  cnptFile missing idOverview section
//   two causes, two messages: the-file has NO id="idOverview", or it HAS the-id
//   but the-parser could-not read a-section from IT (an-unclosed <section>).
function fCheckCnptFile(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) {
      // the-file could-not be read: it has no concepts at all, we report it once.
      aoIssue.push(fIssue('ERROR', 'Mvrl00', oCnptFile.sNameFile ?? oCnptFile.sNameIdRela, null,
        `File could not be read: ${oCnptFile.sError}`));
      continue;
    }
    if (!oCnptFile.sOverview) {
      const nLineOverview = oCnptFile.oMapIdLine?.get('idOverview') ?? null;
      if (nLineOverview !== null) {
        // the-id is there, but the-parser could-not read a-section: it is not closed
        aoIssue.push(fIssue('ERROR', 'Mvre01', oCnptFile.sNameFile, null,
          `id="idOverview" is NOT a-closed <section> — the-parser can-not read IT, see Hitp09`,
          nLineOverview));
      } else {
        aoIssue.push(fIssue('ERROR', 'Mvre01', oCnptFile.sNameFile, null,
          `File has no <section id="idOverview"> — cnptFile identity section is missing`));
      }
    }
  }
  return aoIssue;
}

// ⚠️ [Mvrw01] cnptSect  has no description::-paragraph
// ⚠️ [Mvrw02] cnptSect  has an empty/placeholder description:: (only "·" or "×")
function fCheckDescription(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oSect of fFindCnpt(oCnptFile, 'cnptSect')) {
      if ((oSect.sNameTitle ?? '').indexOf('( link )') > 1) continue;
      const aoParaDesc = fFindParaAll(oSect, 'description');
      if (aoParaDesc.length === 0) {
        aoIssue.push(fIssue('WARN', 'Mvrw01', oCnptFile.sNameFile, oSect,
          `cnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) has no description::-paragraph`,
          oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
        continue;
      }
      // Check for empty/placeholder description (just "·" or whitespace)
      for (const oPara of aoParaDesc) {
        const sContent = fFindParaText(oPara)
          .replace(/^description::\s*/i, '')
          .replace(/[·\s×]/g, '')
          .trim();
        if (sContent.length === 0) {
          aoIssue.push(fIssue('WARN', 'Mvrw02', oCnptFile.sNameFile, oSect,
            `cnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) has an empty/placeholder description:: (only "·" or "×")`,
            oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
        }
      }
    }
  }
  return aoIssue;
}

// ⚠️ [Mvrw03] cnptSect  has no name::-paragraph
// ⚠️ [Mvrw04] cnptSect  name::-paragraph has no valid Mcsh* entries
function fCheckName(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oSect of fFindCnpt(oCnptFile, 'cnptSect')) {
      if ((oSect.sNameTitle ?? '').indexOf('( link )') > 1) continue;
      if (fFindParaAll(oSect, 'name').length === 0) {
        // This shouldn't happen (cnptSect requires names), but guard anyway
        aoIssue.push(fIssue('WARN', 'Mvrw03', oCnptFile.sNameFile, oSect,
          `cnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) has no name::-paragraph`,
          oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
      } else if (fCountName(oSect) === 0) {
        aoIssue.push(fIssue('WARN', 'Mvrw04', oCnptFile.sNameFile, oSect,
          `cnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) name::-paragraph has no valid Mcsh* entries`,
          oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
      }
    }
  }
  return aoIssue;
}

// ❌ [Mvre02] Duplicated names:
function fCheckDuplicateName(aoCnptFile) {
  const aoIssue = [];
  const oMapName = fBuildMapName(aoCnptFile);
  const oMapFileByName = new Map(aoCnptFile.map(oCnptFile => [oCnptFile.sNameFile, oCnptFile]));
  for (const [sNameFull, aoOccur] of oMapName) {
    if (aoOccur.length > 1) {
      const aLoc = aoOccur.map(oOccur => `${oOccur.sNameFile}#${oOccur.sNameId}`);
      const oSetLoc = new Set(aLoc);
      // all occurrences in ONE place: the-name-line is written more than once in one para
      const sLoc = oSetLoc.size === 1
        ? `appears ${aoOccur.length} times in ${aLoc[0]}`
        : `appears in: ${aLoc.join(', ')}`;
      // Report once per duplicate group, at the second occurrence's line
      const oOcc = aoOccur[1];
      const nLine = oMapFileByName.get(oOcc.sNameFile)?.oMapIdLine.get(oOcc.sNameId) ?? null;
      aoIssue.push(fIssue('ERROR', 'Mvre02', oOcc.sNameFile, null,
        `Duplicate name-line "${sNameFull}" ${sLoc}`, nLine));
    }
  }
  return aoIssue;
}

/** true when a brace token is *meant* to be a date: hyphen-joined numeric groups whose
 *  first group is a year — 4 digits, or 3+ digits when more groups follow, so the typo
 *  {202-03-28} is still caught.  Set notation and plain numbers — {1, 2}, {2}, {32},
 *  {525}, {-1} — are not dates and are not judged. */
function fIsDateCandidate(sTok) {
  const sIn = sTok.slice(1, -1);              // drop the braces
  if (!/^\d[\d-]*$/.test(sIn)) return false;  // digits+hyphens only, never leading '-'
  const aGroup = sIn.split('-');
  const nDigitYear = aGroup[0].length;
  return nDigitYear === 4 || (nDigitYear >= 3 && aGroup.length > 1);
}

// ⚠️ [Mvrw06] DATE "{2022-4-27}" has NO {YYYY-MM-DD} format, judged per {token}, not per line
function fCheckDate(aoCnptFile) {
  const aoIssue = [];
  const rDateGood = /^\{\d{4}(?:-\d{2}(?:-\d{2})?)?\}$/;
  const rTex      = /\\\([\s\S]*?\\\)/g;   // inline-TeX spans hold math, never dates
  const rBrace    = /\{[^{}]*\}/g;
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oSect of fFindCnpt(oCnptFile, 'cnptSect')) {
      for (const oPara of oSect.aoTitlePara ?? []) {
        for (const sLine of fFindParaText(oPara).split('\n')) {
          const oSetTokBad = new Set();       // one issue per distinct token on the line
          for (const [sTok] of sLine.replace(rTex, ' ').matchAll(rBrace)) {
            if (fIsDateCandidate(sTok) && !rDateGood.test(sTok)) oSetTokBad.add(sTok);
          }
          for (const sTok of oSetTokBad) {
            aoIssue.push(fIssue('WARN', 'Mvrw06', oCnptFile.sNameFile, oSect,
              `DATE "${sTok}" has NO {YYYY-MM-DD} format in line: "${sLine.trim()}" in file: "${oCnptFile.sNameFile}"`,
              oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
          }
        }
      }
    }
  }
  return aoIssue;
}

// ⚠️ [MvrlId01] non-english-letters: an-id has a-letter outside A-Z a-z (Greek Η, é, µ ...)
//   a-Greek Η looks like a-Latin H, but it is another id, so links to IT break silently.
//   only letters are judged, NOT punctuation.
function fCheckIdLetter(aoCnptFile) {
  const aoIssue = [];
  const rLetterNoEngl = /[^\P{L}A-Za-z]/gu;
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const [sId, nLine] of oCnptFile.oMapIdLine ?? []) {
      const aLetter = sId.match(rLetterNoEngl);
      if (!aLetter) continue;
      aoIssue.push(fIssue('WARN', 'MvrlId01', oCnptFile.sNameFile, null,
        `non-english-letters [${[...new Set(aLetter)].join('')}] in id="${sId}"`, nLine));
    }
  }
  return aoIssue;
}

/**
 * DOING: the-id of an-attribute-cnptSect titled "<sTitle> of X" (with or without
 *   "NN_") or "X'<sTitle>" must end in sSuffix.
 *   "<sTitle>.X" (a-specific) and "GENERIC-SPECIFIC-TREE of X'<sTitle>" are NOT judged.
 * OUTPUT: array of WARN-issues with code sCode.
 */
function fCheckIdSuffix(aoCnptFile, sCode, sNameRule, sTitle, sSuffix) {
  const aoIssue = [];
  const rTitle = new RegExp(`^(\\d+_)?${sTitle} of |^[^\\s.']+'${sTitle}$`, 'i');
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oSect of fFindCnpt(oCnptFile, 'cnptSect')) {
      if (!rTitle.test((oSect.sNameTitle ?? '').trim())) continue;
      if (oSect.sNameId.endsWith(sSuffix)) continue;
      aoIssue.push(fIssue('WARN', sCode, oCnptFile.sNameFile, oSect,
        `${sNameRule}: id="${oSect.sNameId}" of "${oSect.sNameTitle}" does not end in "${sSuffix}"`,
        oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
    }
  }
  return aoIssue;
}

// ⚠️ [MvrlId02] dong_DOING_suffix: the-id of a-DOING-concept ends in "dong",
//   NOT dng | dngF | dngFT | doing.
function fCheckIdDong(aoCnptFile) {
  return fCheckIdSuffix(aoCnptFile, 'MvrlId02', 'dong_DOING_suffix', 'DOING', 'dong');
}

// ⚠️ [MvrlId04] eval_evaluation_suffix: the-id of an-evaluation-concept ends in "eval",
//   NOT eln | evln | evaln | evaluation | evalF | evalFT | attNNN.
function fCheckIdEval(aoCnptFile) {
  return fCheckIdSuffix(aoCnptFile, 'MvrlId04', 'eval_evaluation_suffix', 'evaluation', 'eval');
}

// ⚠️ [MvrlId05] evog_evoluting_suffix: the-id of an-evoluting-concept ends in "evog",
//   NOT evg | Evg | evlg | evltg | evoluting | evgF | evgFT | attNNN.
function fCheckIdEvog(aoCnptFile) {
  return fCheckIdSuffix(aoCnptFile, 'MvrlId05', 'evog_evoluting_suffix', 'evoluting', 'evog');
}

// ⚠️ [MvrlId06] irsc_info_resource_suffix: the-id of an-info-resource-concept ends in "irsc",
//   NOT rsc | infrsc | resource | ircs.
function fCheckIdIrsc(aoCnptFile) {
  return fCheckIdSuffix(aoCnptFile, 'MvrlId06', 'irsc_info_resource_suffix', 'info-resource', 'irsc');
}

/**
 * DOING: the-id of a-para-concept "<sTitlePara>::" (of the-cnptFile or of any concept)
 *   must end in sSuffix (or match rEndIn, when given).
 * OUTPUT: array of WARN-issues with code sCode.
 */
function fCheckIdParaSuffix(aoCnptFile, sCode, sNameRule, sTitlePara, sSuffix, rEndIn) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oCnpt of [fFindCnptOfFile(oCnptFile), ...fFindCnpt(oCnptFile)]) {
      const aoPara = oCnpt.sType === 'cnptFile' ? oCnptFile.aoTitlePara : oCnpt.aoTitlePara;
      for (const oPara of aoPara ?? []) {
        if (oPara.sNameTitle !== sTitlePara || !oPara.sNameId) continue;
        if (rEndIn ? rEndIn.test(oPara.sNameId) : oPara.sNameId.endsWith(sSuffix)) continue;
        aoIssue.push(fIssue('WARN', sCode, oCnptFile.sNameFile, oCnpt.sType === 'cnptFile' ? null : oCnpt,
          `${sNameRule}: id="${oPara.sNameId}" of "${sTitlePara}::" does not end in "${sSuffix}"`,
          oCnptFile.oMapIdLine.get(oPara.sNameId) ?? null));
      }
    }
  }
  return aoIssue;
}

// ⚠️ [MvrlId07] pntr_parent_tree_suffix: the-id of a "parent-tree::" para ends in "pntr", NOT rtr.
function fCheckIdPntr(aoCnptFile) {
  return fCheckIdParaSuffix(aoCnptFile, 'MvrlId07', 'pntr_parent_tree_suffix', 'parent-tree', 'pntr');
}

// ⚠️ [MvrlId08] chtr_child_tree_suffix: the-id of a "child-tree::" para ends in "chtr", NOT ctr.
function fCheckIdChtr(aoCnptFile) {
  return fCheckIdParaSuffix(aoCnptFile, 'MvrlId08', 'chtr_child_tree_suffix', 'child-tree', 'chtr');
}

// ⚠️ [MvrlId09] wltr_whole_tree_suffix: the-id of a "whole-tree::" para ends in "wltr",
//   NOT wtr | whlchn | whl | P1.
function fCheckIdWltr(aoCnptFile) {
  return fCheckIdParaSuffix(aoCnptFile, 'MvrlId09', 'wltr_whole_tree_suffix', 'whole-tree', 'wltr');
}

// ⚠️ [MvrlId10] prtr_part_tree_suffix: the-id of a "part-tree::" para ends in "prtr", NOT ptr | rtr | prt.
function fCheckIdPrtr(aoCnptFile) {
  return fCheckIdParaSuffix(aoCnptFile, 'MvrlId10', 'prtr_part_tree_suffix', 'part-tree', 'prtr');
}

// ⚠️ [MvrlId11] gntr_generic_tree_suffix: the-id of a "generic-tree::" para ends in "gntr", NOT gtr.
function fCheckIdGntr(aoCnptFile) {
  return fCheckIdParaSuffix(aoCnptFile, 'MvrlId11', 'gntr_generic_tree_suffix', 'generic-tree', 'gntr');
}

// ⚠️ [MvrlId12] sptr_specific_tree_suffix: the-id of a "specific-tree::" para ends in "sptr", NOT str;
//   a-list of specific-trees may add ONE letter or digit: idLHmnm0011sptrA, idLHmnm0011sptr2.
function fCheckIdSptr(aoCnptFile) {
  return fCheckIdParaSuffix(aoCnptFile, 'MvrlId12', 'sptr_specific_tree_suffix', 'specific-tree', 'sptr',
    /sptr[A-Z0-9]?$/);
}

// ⚠️ [MvrlId13] srtr_structure_suffix: the-id of a-structure-concept ends in "srtr",
//   ("structure of X", "NN_structure of X", "X'structure").
function fCheckIdSrtr(aoCnptFile) {
  return fCheckIdSuffix(aoCnptFile, 'MvrlId13', 'srtr_structure_suffix', 'structure', 'srtr');
}

// ❌ [MvrlMmn01] no-hyphen: a-main-name, the-text after "!⇒" in a-name-line, has NO
//   hyphen "-": rltnAttribute_then_entity, NOT rltnAttribute-then-entity.
//   ONE issue per concept, McsLago and main-name, on the-first name-line that points to it.
//   createMcsh.mjs --mainname changes the-hyphens to underscores.
function fCheckMainNameHyphen(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    const aoCnpt = [
      { ...fFindCnptOfFile(oCnptFile), aoTitlePara: oCnptFile.aoTitlePara },
      ...fFindCnpt(oCnptFile)
    ];
    for (const oCnpt of aoCnpt) {
      // the-name::-para of a-cnptSect or cnptFile; a-cnptPara IS its name-para
      const oParaName = fFindParaAll(oCnpt, 'name')[0];
      const sIdPara = oCnpt.sType === 'cnptPara' ? oCnpt.sNameId : (oParaName?.sNameId ?? oCnpt.sNameId);
      const aLinePara = String(oCnpt.sType === 'cnptPara' ? oCnpt.sPara : oParaName?.sPara ?? '').split('\n');
      const nLinePara = oCnptFile.oMapIdLine.get(sIdPara) ?? null;
      for (const oLago of Object.values(oCnpt.ooNameLago ?? {})) {
        const oSetMain = new Set((oLago.aoName ?? [])
          .map(oName => oName.sNameFormal).filter(sMain => sMain.includes('-')));
        for (const sMain of oSetMain) {
          const sLago = oLago.aoName.find(oName => oName.sNameFormal === sMain).sLago;
          // the-line of the-first "!⇒main-name" inside the-para, when the-para is known
          const nOffset = aLinePara.findIndex(sLine => sLine.includes(`!⇒${sMain}`));
          const nLine = nLinePara != null && nOffset !== -1 ? nLinePara + nOffset : nLinePara;
          aoIssue.push(fIssue('ERROR', 'MvrlMmn01', oCnptFile.sNameFile, oCnpt,
            `no-hyphen: main-name "Mcsh${sLago}.${sMain}" has "-" — use "${sMain.replace(/-/g, '_')}"`,
            nLine));
        }
      }
    }
  }
  return aoIssue;
}

/**
 * DOING: the-main-name of a-cnptSect whose title matches rTitle ends in sSuffix, without an-apostrophe
 *   before it, and starts with a-capital letter (a-multiword attribute): Humanevolg, NOT humanevolg | Human'evolg.
 * OUTPUT: array of WARN-issues with code sCode.
 */
function fCheckMainNameSuffix(aoCnptFile, sCode, sNameRule, rTitle, sSuffix) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oSect of fFindCnpt(oCnptFile, 'cnptSect')) {
      if (!rTitle.test((oSect.sNameTitle ?? '').trim())) continue;
      const sMain = oSect.sNameFormal ?? '';
      const bSuffix = sMain.endsWith(sSuffix) && !sMain.endsWith("'" + sSuffix), bCapital = /^[A-Z]/.test(sMain);
      if (bSuffix && bCapital) continue;
      // the-line of the-main-name inside the-name::-para, when the-para is known
      const oParaName = fFindParaAll(oSect, 'name')[0];
      const nLinePara = oParaName ? oCnptFile.oMapIdLine.get(oParaName.sNameId) ?? null : null;
      const aLinePara = String(oParaName?.sPara ?? '').split('\n');
      const nOffset = aLinePara.findIndex(sLine => sLine.includes(`McshEngl.${sMain}`) || sLine.includes(`!⇒${sMain}`));
      const nLine = nLinePara != null && nOffset !== -1 ? nLinePara + nOffset
        : nLinePara ?? oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null;
      aoIssue.push(fIssue('WARN', sCode, oCnptFile.sNameFile, oSect,
        `${sNameRule}: main-name "McshEngl.${sMain}" of "${oSect.sNameTitle}" ` +
        (bSuffix ? 'does not start with a-capital letter'
          : sMain.endsWith("'" + sSuffix) ? `has an-apostrophe before "${sSuffix}": use X${sSuffix}`
          : `does not end in "${sSuffix}"`),
        nLine));
    }
  }
  return aoIssue;
}

// ⚠️ [MvrlMmn02] evolg_evoluting_main: the-main-name of an-evoluting-concept
//   ("evoluting of X", "NN_evoluting of X", "X'evoluting") is Xevolg, capital first,
//   NOT evoluting-of-X | X'evoluting | Xevlg | Xevg | Xevog | humanevolg.
function fCheckMainNameEvolg(aoCnptFile) {
  return fCheckMainNameSuffix(aoCnptFile, 'MvrlMmn02', 'evolg_evoluting_main',
    /^(\d+_)?evoluting of |^[^\s.']+'evoluting$/i, 'evolg');
}

// ⚠️ [MvrlMmn03] evaln_evaluation_main: the-main-name of an-evaluation-concept
//   ("evaluation of X", "NN_evaluation of X", "X'evaluation") is Xevaln, capital first,
//   NOT X'evaluation | Xeval | Xevalg (evalg until 2026-10-28);
//   the-main-name of an-evaluating-concept, the-process ("evaluating of X", "X'evaluating") is Xevalg,
//   like evoluting → Xevolg.
function fCheckMainNameEvalg(aoCnptFile) {
  return [
    ...fCheckMainNameSuffix(aoCnptFile, 'MvrlMmn03', 'evaln_evaluation_main',
      /^(\d+_)?evaluation of |^[^\s.']+'evaluation$/i, 'evaln'),
    ...fCheckMainNameSuffix(aoCnptFile, 'MvrlMmn03', 'evalg_evaluating_main',
      /^(\d+_)?evaluating of |^[^\s.']+'evaluating$/i, 'evalg')
  ];
}

// ⚠️ [MvrlMmn04] doing_DOING_main: the-main-name of a-DOING-concept
//   ("DOING of X", "NN_DOING of X", "X'DOING") is Xdoing, capital first,
//   NOT X'doing | entity'doing | Xdong | DongX.
function fCheckMainNameDoing(aoCnptFile) {
  return fCheckMainNameSuffix(aoCnptFile, 'MvrlMmn04', 'doing_DOING_main',
    /^(\d+_)?DOING of |^[^\s.']+'DOING$/i, 'doing');
}

// ⚠️ [MvrlMmn05] infrsc_info_resource_main: the-main-name of an-info-resource-concept
//   ("info-resource of X", "NN_info-resource of X", "X'info-resource") is Xinfrsc, capital first,
//   NOT X'info_resource | X'info-resource | info-resource-of-X | Xirsc | Xrsc.
function fCheckMainNameInfrsc(aoCnptFile) {
  return fCheckMainNameSuffix(aoCnptFile, 'MvrlMmn05', 'infrsc_info_resource_main',
    /^(\d+_)?info-resource of |^[^\s.']+'info-resource$/i, 'infrsc');
}

// ⚠️ [MvrlMmn06] srtr_structure_main: the-main-name of a-structure-concept
//   ("structure of X", "NN_structure of X", "X'structure") is Xsrtr, capital first,
//   NOT X'structure | X'attStructure | structure-of-X.
function fCheckMainNameSrtr(aoCnptFile) {
  return fCheckMainNameSuffix(aoCnptFile, 'MvrlMmn06', 'srtr_structure_main',
    /^(\d+_)?structure of |^[^\s.']+'structure$/i, 'srtr');
}

// ⚠️ [MvrlMmn07] attrbase_line: the-main-names of the-attributes of a-concept are-created of
//   a-base plus text, the-Attrbase. It is-denoted in the-name::-para of the-concept with
//   "McshEngl.B!Attrbase," (B = the-main-name) or "McshEngl.B!Attrbase!⇒M," (B another name),
//   on the-3rd name-line, after "M!=I", or on the-4th, after "M!@McshXxx" of a-file-concept.
//   Warns on a-misplaced or badly-written Attrbase line (e.g. "Cmpl!Attrbase⇒Cmpr_lago").
function fCheckMainNameAttrbase(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oCnpt of [fFindCnptOfFile(oCnptFile), ...fFindCnpt(oCnptFile)]) {
      const oParaName = oCnpt.sType === 'cnptFile'
        ? (oCnptFile.aoTitlePara ?? []).find(oPara => oPara.sNameTitle === 'name')
        : fFindParaAll(oCnpt, 'name')[0];
      if (!oParaName || !String(oParaName.sPara ?? '').includes('!Attrbase')) continue;
      const nLinePara = oCnptFile.oMapIdLine.get(oParaName.sNameId) ?? null;
      const aLinePara = String(oParaName.sPara).split('\n');
      // the-name-lines "<br>* McshXxxx.…", with their offset in the-para
      const aoLineName = aLinePara.map((sLine, nOffset) => ({ sLine: sLine.trim(), nOffset }))
        .filter(o => /^<br>\*\s*Mcsh[A-Z][a-z]+\./.test(o.sLine));
      const bFile = aoLineName.some(o => /^<br>\*\s*McshEngl\.[^!,]+!@Mcsh/.test(o.sLine));
      // the-line before it: "M!@McshXxx" of a-file-concept, else "M!=I"
      const rBefore = bFile ? /^<br>\*\s*McshEngl\.[^!,]+!@Mcsh/ : /^<br>\*\s*McshEngl\.[^!,]+![=][^!,]+,/;
      aoLineName.forEach((o, nIndex) => {
        if (!o.sLine.includes('!Attrbase')) return;
        const nLine = nLinePara != null ? nLinePara + o.nOffset : null;
        const aMsg = [];
        if (!/^<br>\*\s*McshEngl\.[^!,\s]+!Attrbase(!⇒[^!,\s]+)?,/.test(o.sLine))
          aMsg.push('is not "McshEngl.B!Attrbase," or "McshEngl.B!Attrbase!⇒M,"');
        if (nIndex === 0 || !rBefore.test(aoLineName[nIndex - 1].sLine))
          aMsg.push(`is not right after "M!${bFile ? '@McshXxx' : '=I'}" (3rd name-line, or 4th of a-file-concept)`);
        if (aMsg.length) aoIssue.push(fIssue('WARN', 'MvrlMmn07', oCnptFile.sNameFile, oCnpt,
          `attrbase_line: "${fStripTags(o.sLine).replace(/^\*\s*/, '')}" ${aMsg.join('; ')}`, nLine));
      });
    }
  }
  return aoIssue;
}

// ⚠️ [MvrlGstr01] specific_has_generic: IF generic X has specific Y (a-linked item of X's "specific-tree::")
//   THEN Y has X as generic: X is in Y's "generic-tree::" (as X_Gntr or a-link to X),
//   or Y is a-part-section of X (without own generic-tree), or Y reaches X through its generic-chain.
//   A-concept is a-key "McshDir000000#id" ("McshDir000000#" the-file-concept);
//   a-GS-TREE means its whole, a-para means its section.
// the-GS index of the-worldview, shared by MvrlGstr01 and MvrlGstr02, built once per aoCnptFile.
const oWeakGstrIndex = new WeakMap();
function fGstrIndex(aoCnptFile) {
  if (oWeakGstrIndex.has(aoCnptFile)) return oWeakGstrIndex.get(aoCnptFile);
  const rGs = /^GENERIC-SPECIFIC-TREE of /;   // NOT "Name'GENERIC-SPECIFIC-TREE" of another concept
  const fHead = sPara => (/<br>\*\s*McshEngl\.(\S+?_Gntr)\b/.exec(sPara ?? '') ?? [])[1] ?? null;
  // index per file: the-cnptSect by id, the-para by id (with its section), the-top GS-TREE
  const ooFile = {};
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    const oF = { oCnptFile, ooSect: {}, ooPara: {}, sIdTopGs: null };
    for (const oCnpt of fFindCnpt(oCnptFile, 'cnptSect')) {
      oF.ooSect[oCnpt.sNameId] = oCnpt;
      for (const oPara of oCnpt.aoTitlePara ?? [])
        if (oPara.sNameId) oF.ooPara[oPara.sNameId] = { ...oPara, sIdSect: oCnpt.sNameId };
      if (!oCnpt.sIdWhole_elmt && rGs.test(oCnpt.sNameTitle ?? '')) oF.sIdTopGs = oCnpt.sNameId;
    }
    for (const oPara of oCnptFile.aoTitlePara ?? [])
      if (oPara.sNameId) oF.ooPara[oPara.sNameId] = { ...oPara, sIdSect: null };
    // a-<div id> para-concept the-overview misses (e.g. a-specific-tree with an-<ol> list): from the-raw sections,
    //   the-innermost section wins (aoRaw_sect has the-whole before its parts)
    const ooDiv = {};
    for (const oRaw of oCnptFile.aoRaw_sect ?? [])
      for (const aD of (oRaw.sRawHtml ?? '').matchAll(/<div id="([^"]+)">\s*<p>([^:<\n]+)::/g))
        if (!oF.ooPara[aD[1]]) {
          const nEnd = oRaw.sRawHtml.indexOf('</div>', aD.index);
          ooDiv[aD[1]] = { sNameId: aD[1], sNameTitle: aD[2].trim(), sPara: oRaw.sRawHtml.slice(aD.index, nEnd < 0 ? undefined : nEnd), sIdSect: oRaw.sNameId };
        }
    Object.assign(oF.ooPara, ooDiv);
    ooFile[oCnptFile.sNameFile.replace(/\.last\.html$/, '')] = oF;
  }
  // the-concept-key a-target (file, id) means
  const fKey = (sFile, sId) => {
    const oF = ooFile[sFile];
    if (!oF) return null;
    if (!sId || sId === 'idOverview') return sFile + '#';
    const sIdSect = oF.ooSect[sId] ? sId : (sId in oF.ooPara ? oF.ooPara[sId].sIdSect : undefined);
    if (sIdSect === undefined) return null;
    if (sIdSect === null) return sFile + '#';
    const oSect = oF.ooSect[sIdSect];
    if (rGs.test(oSect.sNameTitle ?? '')) return sFile + '#' + (oSect.sIdWhole_elmt ?? '');
    return sFile + '#' + sIdSect;
  };
  // the-generic-tree:: of a-concept: {id}gntr; of the-file-concept: the-top GS-TREE's {B}gntr
  const fGntr = sKey => {
    const [sFile, sId] = sKey.split('#');
    const oF = ooFile[sFile];
    const sB = sId || (oF.sIdTopGs ? oF.sIdTopGs.replace(/gstr$/, '') : null);
    const oP = sB ? oF.ooPara[sB + 'gntr'] : null;
    return oP && oP.sNameTitle === 'generic-tree' ? { sFile, oP } : null;
  };
  // the-links of an-item-line: <a href>, name!@McshDir000000#id
  const fRefs = (sFile, sLine) => {
    const aoRef = [];
    for (const aA of sLine.matchAll(/<a\b([^>]*)>([^<]*)<\/a>/g)) {
      if (/clsHide/.test(aA[1])) continue;
      const sHref = (/href="([^"]*)"/.exec(aA[1]) ?? [])[1] ?? '';
      if (sHref.startsWith('#')) { aoRef.push({ sFile, sId: sHref.slice(1), sText: aA[2] }); continue; }
      const aF = /(?:^|\/)(Mcsh[A-Za-z0-9]+)\.last\.html(?:#(.*))?$/.exec(sHref);
      if (aF) aoRef.push({ sFile: aF[1], sId: aF[2] ?? null, sText: aA[2] });
    }
    for (const aR of sLine.matchAll(/([^\s*,]+?)!@(Mcsh[A-Za-z]*\d{6})?(?:#([^\s,<"':]+))?(?=[,\s]|$)/g))
      aoRef.push({ sFile: aR[2] ?? sFile, sId: aR[3] ?? null, sText: aR[1] });
    return aoRef;
  };
  const fItems = sPara => (sPara ?? '').split('\n').map(s => s.trim()).filter(s => /^<br>\*/.test(s));
  // the-item-lines of a-generic-tree:: that are generics: NOT in a-"=== label:" group
  const fGntrItems = sPara => {
    const aOut = [];
    let bLabel = false;
    for (const sLine of (sPara ?? '').split('\n').map(s => s.trim())) {
      if (/^<br>===/.test(sLine)) { bLabel = !/^<br>===\s*$/.test(sLine); continue; }
      if (!bLabel && /^<br>\*/.test(sLine)) aOut.push(sLine);
    }
    return aOut;
  };
  // X_Gntr name → concept-key
  const oNameGntr = {};
  for (const [sFile, oF] of Object.entries(ooFile)) {
    for (const [sId, oP] of Object.entries(oF.ooPara)) {
      if (oP.sNameTitle !== 'generic-tree') continue;
      const sHead = fHead(oP.sPara);
      const sB = sId.replace(/gntr$/, '');
      const sKey = oF.ooSect[sB] ? fKey(sFile, sB) : fKey(sFile, sId);
      if (sHead && sKey) oNameGntr[sHead] = sKey;
    }
  }
  // the-generics of a-concept, from its generic-tree:: (null: no generic-tree)
  const ooGeneric = {};
  const fGenerics = sKey => {
    if (sKey in ooGeneric) return ooGeneric[sKey];
    const oG = fGntr(sKey);
    if (!oG) return (ooGeneric[sKey] = null);
    const oSetKey = new Set();
    for (const sLine of fGntrItems(oG.oP.sPara)) {
      if (/^<br>\*\s*(McshEngl\.|\.\.\.)/.test(sLine)) continue;
      for (const aN of sLine.matchAll(/([^\s*,]+_Gntr)(?=[,\s]|$)/g)) if (oNameGntr[aN[1]]) oSetKey.add(oNameGntr[aN[1]]);
      for (const oR of fRefs(oG.sFile, sLine)) { const sK = fKey(oR.sFile, oR.sId); if (sK) oSetKey.add(sK); }
    }
    return (ooGeneric[sKey] = { oSetKey, oG });
  };
  // Y reaches X through its generic-chain
  const fReaches = (sKeyY, sKeyX) => {
    const oSeen = new Set([sKeyY]);
    let aQueue = [sKeyY];
    for (let n = 0; n < 12 && aQueue.length; n++) {
      const aNext = [];
      for (const sK of aQueue) for (const sG of fGenerics(sK)?.oSetKey ?? []) {
        if (sG === sKeyX) return true;
        if (!oSeen.has(sG)) { oSeen.add(sG); aNext.push(sG); }
      }
      aQueue = aNext;
    }
    return false;
  };
  // Y is a-part-section of X
  const fInside = (sKeyY, sKeyX) => {
    const [sFileY, sIdY] = sKeyY.split('#'), [sFileX, sIdX] = sKeyX.split('#');
    if (sFileY !== sFileX || !sIdY) return false;
    if (!sIdX) return true;
    let oS = ooFile[sFileY].ooSect[sIdY];
    while (oS && oS.sIdWhole_elmt) {
      if (oS.sIdWhole_elmt === sIdX) return true;
      oS = ooFile[sFileY].ooSect[oS.sIdWhole_elmt];
    }
    return false;
  };
  // the-specific-tree:: of a-concept: {id}sptr; of the-file-concept: the-top GS-TREE's {B}sptr
  const fSptr = sKey => {
    const [sFile, sId] = sKey.split('#');
    const oF = ooFile[sFile];
    const sB = sId || (oF.sIdTopGs ? oF.sIdTopGs.replace(/gstr$/, '') : null);
    const oP = sB ? oF.ooPara[sB + 'sptr'] : null;
    return oP && oP.sNameTitle === 'specific-tree' ? { sFile, oP } : null;
  };
  // the-item-lines of a-tree:: after its first "===", without an-addressWpg part
  const fTreeItems = sPara => {
    const aOut = [];
    let bAfter = false, bWeb = false;
    for (const sLine of (sPara ?? '').split('\n').map(s => s.trim())) {
      if (/^<br>===/.test(sLine)) { bAfter = true; bWeb = /address/i.test(sLine); continue; }
      // an-item "<br>* …", or a-list item "<li>…" of a-<div> specific-tree (e.g. the-blocks of Ucbk)
      if (bAfter && !bWeb && /^(<br>\*|<li>)/.test(sLine)) aOut.push(sLine);
    }
    return aOut;
  };
  // the-English names of a-concept (lower case): McshEngl names, !⇒ main-name, X of X_Gntr
  const fNames = sKey => {
    const [sFile, sId] = sKey.split('#');
    const oF = ooFile[sFile];
    const aoPara = sId ? (oF.ooSect[sId]?.aoTitlePara ?? []) : (oF.oCnptFile.aoTitlePara ?? []);
    const oSet = new Set();
    for (const oP of aoPara.filter(o => o.sNameTitle === 'name'))
      for (const aN of (oP.sPara ?? '').matchAll(/<br>\*\s*McshEngl\.([^\s,<]+)/g)) {
        oSet.add(aN[1].split('!')[0].toLowerCase());
        const aM = /!⇒\s*([^,\s]+)/.exec(aN[1]);
        if (aM) oSet.add(aM[1].toLowerCase());
      }
    const oG = fGntr(sKey), sHead = oG && fHead(oG.oP.sPara);
    if (sHead) oSet.add(sHead.replace(/_Gntr$/, '').toLowerCase());
    return oSet;
  };
  const oIndex = { rGs, ooFile, fHead, fKey, fGntr, fSptr, fRefs, fItems, fTreeItems, fNames, oNameGntr, fGenerics, fReaches, fInside };
  oWeakGstrIndex.set(aoCnptFile, oIndex);
  return oIndex;
}

// ⚠️ [MvrlGstr01] specific_has_generic (see above fGstrIndex)
function fCheckGstrSpecificGeneric(aoCnptFile) {
  const aoIssue = [];
  const { ooFile, fHead, fKey, fGntr, fRefs, fGenerics, fReaches, fInside } = fGstrIndex(aoCnptFile);
  for (const [sFile, oF] of Object.entries(ooFile)) {
    for (const [sIdPara, oP] of Object.entries(oF.ooPara)) {
      if (oP.sNameTitle !== 'specific-tree') continue;
      const sB = sIdPara.replace(/sptr[A-Z0-9]?$/, '');
      const sKeyX = oF.ooSect[sB] ? fKey(sFile, sB) : fKey(sFile, sIdPara);
      if (!sKeyX) continue;
      const oGX = fGntr(sKeyX);
      const sNameX = (oGX && fHead(oGX.oP.sPara)) || sKeyX;
      const oSectX = oF.ooSect[sKeyX.split('#')[1]] ?? null;
      let bAfter = false, bWeb = false;
      for (const sLine of (oP.sPara ?? '').split('\n').map(s => s.trim())) {
        if (/^<br>===/.test(sLine)) { bAfter = true; bWeb = /address/i.test(sLine); continue; }
        if (!bAfter || bWeb || !/^<br>\*/.test(sLine)) continue;
        for (const oR of fRefs(sFile, sLine)) {
          const sKeyY = fKey(oR.sFile, oR.sId);
          if (!sKeyY || sKeyY === sKeyX) continue;
          const oGen = fGenerics(sKeyY);
          if (oGen && oGen.oSetKey.has(sKeyX)) continue;
          if (!oGen && fInside(sKeyY, sKeyX)) continue;
          if (oGen && fReaches(sKeyY, sKeyX)) continue;
          const sWhere = oGen ? `${oGen.oG.sFile}:${ooFile[oGen.oG.sFile].oCnptFile.oMapIdLine?.get(oGen.oG.oP.sNameId) ?? '?'}` : '';
          aoIssue.push(fIssue('WARN', 'MvrlGstr01', oF.oCnptFile.sNameFile, oSectX,
            oGen
              ? `specific_has_generic: "${oR.sText}" is a specific of ${sNameX}, but its generic-tree:: (${sWhere}) does not list it`
              : `specific_has_generic: "${oR.sText}" (${sKeyY}) is a specific of ${sNameX}, but has no generic-tree::`,
            oF.oCnptFile.oMapIdLine?.get(sIdPara) ?? null));
        }
      }
    }
  }
  return aoIssue;
}

// ⚠️ [MvrlGstr02] generic_has_specific: IF specific S has generic G (the-FIRST item of a-"===" group of S's
//   "generic-tree::"; the-next items of the-group are its chain) THEN G has S in its "specific-tree::"
//   (a-link to S, or a-text item = a-name of S), or S is a-part-section of G.
//   Skipped: McshEngl head, "...entity_Gntr", a-"=== label:" group (addressWpg, sibling-of-X: ...), entity itself,
//   a-first item that is NOT a-concept.
function fCheckGstrGenericSpecific(aoCnptFile) {
  const aoIssue = [];
  const { ooFile, fHead, fKey, fGntr, fSptr, fRefs, fTreeItems, fNames, oNameGntr, fInside } = fGstrIndex(aoCnptFile);
  const fStripItem = sLine => fStripTags(sLine.replace(/^<br>\*\s*/, '')).replace(/!@\S+/g, '').replace(/,\s*$/, '').trim().toLowerCase();
  for (const [sFile, oF] of Object.entries(ooFile)) {
    for (const [sIdPara, oP] of Object.entries(oF.ooPara)) {
      if (oP.sNameTitle !== 'generic-tree') continue;
      const sB = sIdPara.replace(/gntr$/, '');
      const sKeyS = oF.ooSect[sB] ? fKey(sFile, sB) : fKey(sFile, sIdPara);
      if (!sKeyS) continue;
      const sNameS = fHead(oP.sPara) || sKeyS;
      const oSectS = oF.ooSect[sKeyS.split('#')[1]] ?? null;
      // the-first item of every "===" group
      const aFirst = [];
      let bNew = false, bWeb = false;
      for (const sLine of (oP.sPara ?? '').split('\n').map(s => s.trim())) {
        // a-"=== label:" group (addressWpg, sibling-of-X:, att-tree-of-X: ...) holds NO generics
        if (/^<br>===/.test(sLine)) { bNew = true; bWeb = !/^<br>===\s*$/.test(sLine); continue; }
        if (!bNew || bWeb || !/^<br>\*/.test(sLine) || /^<br>\*\s*(McshEngl\.|\.\.\.)/.test(sLine)) continue;
        aFirst.push(sLine); bNew = false;
      }
      let oNamesS = null;
      for (const sLine of aFirst) {
        const aN = /^<br>\*\s*([^\s*,]+_Gntr)(?=[,\s]|$)/.exec(sLine);
        const oR = aN ? null : fRefs(sFile, sLine)[0];
        const sKeyG = aN ? oNameGntr[aN[1]] : (oR ? fKey(oR.sFile, oR.sId) : null);
        if (!sKeyG || sKeyG === sKeyS || sKeyG === 'McshCor000003#') continue;   // not a-concept, itself, entity
        if (fInside(sKeyS, sKeyG)) continue;
        const sNameG = aN ? aN[1] : (fGntr(sKeyG) && fHead(fGntr(sKeyG).oP.sPara)) || sKeyG;
        const oSp = fSptr(sKeyG);
        if (!oSp) {
          aoIssue.push(fIssue('WARN', 'MvrlGstr02', oF.oCnptFile.sNameFile, oSectS,
            `generic_has_specific: "${sNameS}" has generic ${sNameG}, but ${sNameG} has no specific-tree::`,
            oF.oCnptFile.oMapIdLine?.get(sIdPara) ?? null));
          continue;
        }
        const aItem = fTreeItems(oSp.oP.sPara);
        if (aItem.some(s => fRefs(oSp.sFile, s).some(o => fKey(o.sFile, o.sId) === sKeyS))) continue;
        oNamesS ??= fNames(sKeyS);
        if (aItem.some(s => { const sT = fStripItem(s); return oNamesS.has(sT) || oNamesS.has(sT.replace(/_gntr$/, '')); })) continue;
        const sWhere = `${oSp.sFile}:${ooFile[oSp.sFile].oCnptFile.oMapIdLine?.get(oSp.oP.sNameId) ?? '?'}`;
        aoIssue.push(fIssue('WARN', 'MvrlGstr02', oF.oCnptFile.sNameFile, oSectS,
          `generic_has_specific: "${sNameS}" has generic ${sNameG}, but its specific-tree:: (${sWhere}) does not list it`,
          oF.oCnptFile.oMapIdLine?.get(sIdPara) ?? null));
      }
    }
  }
  return aoIssue;
}

// ⚠️ [MvrlId03] space_in_id: an-id="..." or a-link href="...#..." (NOT http) has a-space
//   (any whitespace), the-browser can-not reach IT.
function fCheckIdSpace(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const [sId, nLine] of oCnptFile.oMapIdLine ?? []) {
      if (/\s/.test(sId)) aoIssue.push(fIssue('WARN', 'MvrlId03', oCnptFile.sNameFile, null,
        `space_in_id: id="${sId}" has a-space`, nLine));
    }
    for (const [sId, nLine] of oCnptFile.oMapLinkLine ?? []) {
      if (/\s/.test(sId)) aoIssue.push(fIssue('WARN', 'MvrlId03', oCnptFile.sNameFile, null,
        `space_in_id: href="#${sId}" has a-space`, nLine));
    }
  }
  return aoIssue;
}

function fRunChecksMcsh(aoCnptFile, sPathDir, bQuietIn = false) {
  const aoAll = [];
  // bQuietIn: no progress-lines, for reportMcsh.mjs which prints its own report
  const fWrite = sIn => { if (!bQuietIn) process.stdout.write(sIn); };
  const fLog   = sIn => { if (!bQuietIn) console.log(sIn); };

  fWrite('   Mvre01    File-Mcsh (idOverview)... ');
  const aoFileMcs = fCheckCnptFile(aoCnptFile);
  aoAll.push(...aoFileMcs);
  fLog(`${aoFileMcs.length} issues`);

  fWrite('   Mvre02    Duplicate names (every McsLago)... ');
  const aoDup = fCheckDuplicateName(aoCnptFile);
  aoAll.push(...aoDup);
  fLog(`${aoDup.length} issues`);

  fWrite('   Mvrw01/Mvrw02 Section descriptions... ');
  const aoDesc = fCheckDescription(aoCnptFile);
  aoAll.push(...aoDesc);
  fLog(`${aoDesc.length} issues`);

  fWrite('   Mvrw03/Mvrw04 Section names... ');
  const aoName = fCheckName(aoCnptFile);
  aoAll.push(...aoName);
  fLog(`${aoName.length} issues`);

  fWrite('   Mvrw06    Dates... ');
  const aoDate = fCheckDate(aoCnptFile);
  aoAll.push(...aoDate);
  fLog(`${aoDate.length} issues`);

  fWrite('   MvrlId01  Ids non-english-letters... ');
  const aoIdLetter = fCheckIdLetter(aoCnptFile);
  aoAll.push(...aoIdLetter);
  fLog(`${aoIdLetter.length} issues`);

  fWrite('   MvrlId02  Ids dong_DOING_suffix... ');
  const aoIdDong = fCheckIdDong(aoCnptFile);
  aoAll.push(...aoIdDong);
  fLog(`${aoIdDong.length} issues`);

  fWrite('   MvrlId03  Ids space_in_id... ');
  const aoIdSpace = fCheckIdSpace(aoCnptFile);
  aoAll.push(...aoIdSpace);
  fLog(`${aoIdSpace.length} issues`);

  fWrite('   MvrlId04  Ids eval_evaluation_suffix... ');
  const aoIdEval = fCheckIdEval(aoCnptFile);
  aoAll.push(...aoIdEval);
  fLog(`${aoIdEval.length} issues`);

  fWrite('   MvrlId05  Ids evog_evoluting_suffix... ');
  const aoIdEvog = fCheckIdEvog(aoCnptFile);
  aoAll.push(...aoIdEvog);
  fLog(`${aoIdEvog.length} issues`);

  fWrite('   MvrlId06  Ids irsc_info_resource_suffix... ');
  const aoIdIrsc = fCheckIdIrsc(aoCnptFile);
  aoAll.push(...aoIdIrsc);
  fLog(`${aoIdIrsc.length} issues`);

  fWrite('   MvrlId07  Ids pntr_parent_tree_suffix... ');
  const aoIdPntr = fCheckIdPntr(aoCnptFile);
  aoAll.push(...aoIdPntr);
  fLog(`${aoIdPntr.length} issues`);

  fWrite('   MvrlId08  Ids chtr_child_tree_suffix... ');
  const aoIdChtr = fCheckIdChtr(aoCnptFile);
  aoAll.push(...aoIdChtr);
  fLog(`${aoIdChtr.length} issues`);

  fWrite('   MvrlId09  Ids wltr_whole_tree_suffix... ');
  const aoIdWltr = fCheckIdWltr(aoCnptFile);
  aoAll.push(...aoIdWltr);
  fLog(`${aoIdWltr.length} issues`);

  fWrite('   MvrlId10  Ids prtr_part_tree_suffix... ');
  const aoIdPrtr = fCheckIdPrtr(aoCnptFile);
  aoAll.push(...aoIdPrtr);
  fLog(`${aoIdPrtr.length} issues`);

  fWrite('   MvrlId11  Ids gntr_generic_tree_suffix... ');
  const aoIdGntr = fCheckIdGntr(aoCnptFile);
  aoAll.push(...aoIdGntr);
  fLog(`${aoIdGntr.length} issues`);

  fWrite('   MvrlId12  Ids sptr_specific_tree_suffix... ');
  const aoIdSptr = fCheckIdSptr(aoCnptFile);
  aoAll.push(...aoIdSptr);
  fLog(`${aoIdSptr.length} issues`);

  fWrite('   MvrlId13  Ids srtr_structure_suffix... ');
  const aoIdSrtr = fCheckIdSrtr(aoCnptFile);
  aoAll.push(...aoIdSrtr);
  fLog(`${aoIdSrtr.length} issues`);

  fWrite('   MvrlGstr01 specific_has_generic... ');
  const aoGstrSpcGnc = fCheckGstrSpecificGeneric(aoCnptFile);
  aoAll.push(...aoGstrSpcGnc);
  fLog(`${aoGstrSpcGnc.length} issues`);

  fWrite('   MvrlGstr02 generic_has_specific... ');
  const aoGstrGncSpc = fCheckGstrGenericSpecific(aoCnptFile);
  aoAll.push(...aoGstrGncSpc);
  fLog(`${aoGstrGncSpc.length} issues`);

  fWrite('   MvrlMmn01 Main-names no-hyphen... ');
  const aoMainHyphen = fCheckMainNameHyphen(aoCnptFile);
  aoAll.push(...aoMainHyphen);
  fLog(`${aoMainHyphen.length} issues`);

  fWrite('   MvrlMmn02 Main-names evolg_evoluting... ');
  const aoMainEvolg = fCheckMainNameEvolg(aoCnptFile);
  aoAll.push(...aoMainEvolg);
  fLog(`${aoMainEvolg.length} issues`);

  fWrite('   MvrlMmn03 Main-names evaln_evaluation, evalg_evaluating... ');
  const aoMainEvalg = fCheckMainNameEvalg(aoCnptFile);
  aoAll.push(...aoMainEvalg);
  fLog(`${aoMainEvalg.length} issues`);

  fWrite('   MvrlMmn04 Main-names doing_DOING... ');
  const aoMainDoing = fCheckMainNameDoing(aoCnptFile);
  aoAll.push(...aoMainDoing);
  fLog(`${aoMainDoing.length} issues`);

  fWrite('   MvrlMmn05 Main-names infrsc_info_resource... ');
  const aoMainInfrsc = fCheckMainNameInfrsc(aoCnptFile);
  aoAll.push(...aoMainInfrsc);
  fLog(`${aoMainInfrsc.length} issues`);

  fWrite('   MvrlMmn06 Main-names srtr_structure... ');
  const aoMainSrtr = fCheckMainNameSrtr(aoCnptFile);
  aoAll.push(...aoMainSrtr);
  fLog(`${aoMainSrtr.length} issues`);

  fWrite('   MvrlMmn07 Main-names attrbase_line... ');
  const aoMainAttrbase = fCheckMainNameAttrbase(aoCnptFile);
  aoAll.push(...aoMainAttrbase);
  fLog(`${aoMainAttrbase.length} issues`);

  return aoAll;
}

export {
  fRunChecksMcsh,
  fBuildMapName   // dupMcsh.mjs reports the-duplicate-names from this map
}
