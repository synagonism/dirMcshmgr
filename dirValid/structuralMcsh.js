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
 */

import { fStripTags } from './parserMcsh.js';

const
  aVersion = [
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
 *   must end in sSuffix.
 * OUTPUT: array of WARN-issues with code sCode.
 */
function fCheckIdParaSuffix(aoCnptFile, sCode, sNameRule, sTitlePara, sSuffix) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oCnpt of [fFindCnptOfFile(oCnptFile), ...fFindCnpt(oCnptFile)]) {
      const aoPara = oCnpt.sType === 'cnptFile' ? oCnptFile.aoTitlePara : oCnpt.aoTitlePara;
      for (const oPara of aoPara ?? []) {
        if (oPara.sNameTitle !== sTitlePara || !oPara.sNameId) continue;
        if (oPara.sNameId.endsWith(sSuffix)) continue;
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

  return aoAll;
}

export {
  fRunChecksMcsh,
  fBuildMapName   // dupMcsh.mjs reports the-duplicate-names from this map
}
