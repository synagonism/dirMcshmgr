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
 * 🔴 ERROR
 * 🔶 WARN
 * 🔵 INFO
 * 
 * Checks (Mcsh-specific; Hitp-covered ones removed):
 * 
 *  MvreFile01  CnptFile missing idOverview section
 * 
 *  MvrwSect01  CnptSect missing description::-paragraph (MvrwSect01..04: not a <section class="clsText"> or inside one)
 *  MvrwSect02  CnptSect has description:: but it is empty (only placeholder "·")
 *  MvrwSect03  CnptSect missing name::-paragraph
 *  MvrwSect04  CnptSect name:: has zero valid Mcsh* entries
 * 
 *  MvreName01  Duplicate name-line, in every McsLago (the-whole-line to the-comma) in the-worldview
 *  MvreName02  name_comma: a-name-line ends its name with a-comma (ERROR without one, createMcsh adds it;
 *              WARN with a-comma in the-middle: after the-comma all is a-comment)
 *
 *  MvrwId01 non-english-letters: id="..." has a letter outside A-Z a-z
 *  MvrwId02 dong_DOING_suffix: the-id of a "DOING of X" | "X'DOING" CnptSect does not end in "dong"
 *  MvrwId03 space_in_id: id="..." or href="#..." has a space
 *  MvrwId04 eval_evaluation_suffix: the-id of an "evaluation of X" | "X'evaluation" CnptSect does not end in "eval"
 *  MvrwId05 evog_evoluting_suffix: the-id of an "evoluting of X" | "X'evoluting" CnptSect does not end in "evog"
 *  MvrwId06 irsc_info_resource_suffix: the-id of an "info-resource of X" | "X'info-resource" CnptSect does not end in "irsc"
 *  MvrwId07 pntr_parent_tree_suffix: the-id of a "parent-tree::" para does not end in "pntr"
 *  MvrwId08 chtr_child_tree_suffix: the-id of a "child-tree::" para does not end in "chtr"
 *  MvrwId09 wltr_whole_tree_suffix: the-id of a "whole-tree::" para does not end in "wltr"
 *  MvrwId10 prtr_part_tree_suffix: the-id of a "part-tree::" para does not end in "prtr"
 *  MvrwId11 gntr_generic_tree_suffix: the-id of a "generic-tree::" para does not end in "gntr"
 *  MvrwId12 sptr_specific_tree_suffix: the-id of a "specific-tree::" para does not end in "sptr" (or sptrA, sptr2 of a-list)
 *  MvrwId13 srtr_structure_suffix: the-id of a "structure of X" | "X'structure" CnptSect does not end in "srtr"
 *
 *  MvreMain01 Mmn_form: an-Mmn (main-mind-name) has ONLY English letters, digits, _ and . (no - space, no other-language letters)
 *  MvrwMain01 Attrbase: the-main-names of the-attributes of a-concept with Attrbase B begin with B
 *             (Attrbase "McshEngl.B!Attrbase,"; attributes: its direct parts with a-main-name, "Y of X" and "X.Y");
 *             exempt: an-alias that begins with B ("McshEngl.Systsector!⇒sector_vs_system,") keeps its own
 *             main-name; SciX | DissX | RltnX need such an-alias; createMcsh fixes the-rest
 *  MvrwMain02 evolg_evoluting_main: the-main-name of an "evoluting of X" | "X'evoluting" CnptSect
 *             does not end in "evolg" or does not start with a-capital letter (Xevolg, a-multiword attribute)
 *  MvrwMain03 evaln_evaluation_main | evalg_evaluating_main: the-main-name of an "evaluation of X" | "X'evaluation" CnptSect
 *             is not Xevaln, of an "evaluating of X" | "X'evaluating" CnptSect is not Xevalg (capital first, no apostrophe;
 *             a-genericSpecific X starts with its small-letter word: foodGingerevaln)
 *  MvrwMain04 doing_DOING_main: the-main-name of a "DOING of X" | "X'DOING" CnptSect
 *             does not end in "doing" (no apostrophe before it) or does not start with a-capital letter (Xdoing)
 *  MvrwMain05 infrsc_info_resource_main: the-main-name of an "info-resource of X" | "X'info-resource" CnptSect
 *             does not end in "infrsc" (no apostrophe before it) or does not start with a-capital letter (Xinfrsc);
 *             infrsc_info_resource_leaf: a-section without subsections has a-main-name (only X'info_resource is needed)
 *  MvrwMain06 srtr_structure_main: the-main-name of a "structure of X" | "X'structure" CnptSect
 *             does not end in "srtr" (no apostrophe before it) or does not start with a-capital letter (Xsrtr)
 *  MvrwMain07 attrbase_line: the-Attrbase line "McshEngl.B!Attrbase," | "McshEngl.B!Attrbase!⇒M,"
 *             is not the-3rd name-line (after "M!=I") or the-4th (after "M!@McshXxx" of a-file-concept),
 *             or is badly written
 *  MvrwMain08 mmn_attr: a-concept with attribute-sections has no Mmn (main-mind-name)
 *             (attribute-sections: its direct parts "Y of X" | "X'Y", not trees, links, clsText;
 *             Mmn: "descriptive!⇒Mmn" "Mmn!=descriptive")
 *  MvrwMain09 human_main: the-formal-main-name of a-human (a-concept named "human.Surname.Given[.YYYY]" |
 *             "Surname.Given.human" | "human.Name" with a-Humn/hmn main-name) is not "Humn" + birth-year + name
 *             (Humn1959Sinagu) | "HumnB" + year for BCE (HumnB0384Arst), or is missing
 *  MvrwMain10 attribute: a-direct part-section of a-concept with main-name M is not
 *             "x of M" + name "M'x" (attribute, x small first unless short: BMI) or "M.x" + name "M.x" (specific)
 *
 *  MvrwName01 formal: a-formal-name (X'Y, X.Y, X:Y, X;Y, X;;Y, X/Y, X//Y) of a-name::-para or a-formal title
 *             has no space and no hyphen; fix: "_" in their place (X'a-b → X'a_b); dirUcd is not checked
 *
 *  MvrwGstr01 gnsp_then_spgn: generic G has specific S (a-linked item of G's "specific-tree::"),
 *             but S does NOT have G as generic (in its "generic-tree::", by nesting, or through its generic-chain)
 *  MvrwGstr02 spgn_then_gnsp: specific S has generic G (first item of a-"===" group of its "generic-tree::"),
 *             but G does NOT list S in its "specific-tree::" (link or name), and S is NOT a-part-section of G
 *             In "generic-tree::" only plain "===" groups hold generics; the-items of a-"=== label:" group
 *             (sibling-of-X:, att-tree-of-X:, inherited-from-att::) are NOT generics.
 * 
 *  MvrwMisc01  dates not in {YYYY-MM-DD} format
 */

import { fStripTags } from './parserMcsh.js';
import moFs from 'fs';

const
  aVersion = [
    'structuralMcsh.js.0-69-0.2026-11-13: MvrwMain05 infrsc_info_resource_leaf: a-main-name ONLY in a-section with subsections',
    'structuralMcsh.js.0-68-0.2026-11-12: MvrwName01 skips dirUcd; fFormalMvrwName01 exported for createMcsh',
    'structuralMcsh.js.0-67-0.2026-11-12: MvrwName01 formal: a-formal-name of name:: | a-formal title has no space, no hyphen',
    'structuralMcsh.js.0-66-0.2026-11-12: MvrwMain10 no longer checks a-small first letter of x (an-open issue); lexicon removed',
    'structuralMcsh.js.0-65-0.2026-11-12: MvrwMain10 keep-list: Html, Url keep their capital',
    'structuralMcsh.js.0-64-0.2026-11-12: MvrwMain10 flags a-capital x only when it is an-English word of lexiconEngl.txt (lexiconMcsh.mjs)',
    'structuralMcsh.js.0-63-0.2026-11-12: MvrwMain10 a-short name of up to 4 characters keeps its capital (Dapp)',
    'structuralMcsh.js.0-62-0.2026-11-11: MvrwMain10 skips the-Unicode char sections "char.…"',
    'structuralMcsh.js.0-61-0.2026-11-11: MvrwMain10 checks the-file-concept too (top sections, not idOverview|idMeta|idSupport)',
    'structuralMcsh.js.0-60-0.2026-11-11: MvrwMain10 attribute: "x of M" + M\'x | "M.x" + M.x',
    'structuralMcsh.js.0-59-0.2026-11-11: MvrwMain09 human_main: Humn + birth-year + name, HumnB + year for BCE',
    'structuralMcsh.js.0-58-0.2026-11-09: fFindAttrDirect: a-level-1 section is NOT an-id-attribute of a-level-1 concept (siblings: idRfrtgPrvgDrct, idRfrtgPrvgDrctN)',
    'structuralMcsh.js.0-57-0.2026-11-08: MvreMain01 Mmn_form: ONLY English letters, digits, _ .',
    'structuralMcsh.js.0-56-0.2026-11-08: MvreName02 name_comma; sNameFormal → sNameMainFrml (parser 0-6-1)',
    'structuralMcsh.js.0-55-0.2026-11-07: MvreMain01 Mmn_form: the-Mmn, English letters digits _ . with an-English start, an-other-language tail, no hyphen',
    'structuralMcsh.js.0-54-0.2026-11-07: fFindAttrDirect: the-direct attributes by title ("Y of N" | "N\'Y" | "N.Y", N a-name of the-concept) or id (idBasename), in the-whole file; MvrwMain01, MvrwMain08 use it',
    'structuralMcsh.js.0-53-0.2026-11-07: MvrwMain08 mmn_attr: a-concept with attribute-sections has an-Mmn',
    'structuralMcsh.js.0-52-0.2026-11-07: main-name is the-Mmn (main-mind-name) of the-parser, any McsLago; MvrwMain02-06 skip a-concept without Mmn',
    'structuralMcsh.js.0-51-0.2026-11-07: MvrwMain01 attributes: every direct part with a-main-name, specifics "X.Y" too; an-alias B… exempts',
    'structuralMcsh.js.0-50-0.2026-11-07: MvrwMain01 Attrbase',
    'structuralMcsh.js.0-49-0.2026-11-07: MvrwSect01..04 skip also the-clsText section itself, not only its parts',
    'structuralMcsh.js.0-48-0.2026-11-07: MvrwSect01..04 a-link section is also "X ( link!=Y )"',
    'structuralMcsh.js.0-47-0.2026-11-06: MvrwSect01..04 skip the-sections inside a <section class="clsText"> (a-displayed text)',
    'structuralMcsh.js.0-46-0.2026-11-06: MvrwMain02-06 a-genericSpecific main-name starts small: foodGingerevaln',
    'structuralMcsh.js.0-45-0.2026-11-05: MvrwGstr01 gnsp_then_spgn (G, S), MvrwGstr02 spgn_then_gnsp',
    'structuralMcsh.js.0-44-0.2026-11-04: faster: fFindCnpt once per file, MvrwMisc01 skips a-para without {',
    'structuralMcsh.js.0-43-0.2026-11-04: fRunChecksMcsh aCodeIn: only the-checks of these rules',
    'structuralMcsh.js.0-42-0.2026-11-04: MvrwSect01..04 check also the-sections without valid names',
    'structuralMcsh.js.0-41-0.2026-11-01: code change to Mvrw or Mvre',
    'structuralMcsh.js.0-40-0.2026-10-31: generic-tree names X:generic (was X_Gntr)',
    'structuralMcsh.js.0-39-0.2026-10-29: MvrwMain07 attrbase_line',
    'structuralMcsh.js.0-38-0.2026-10-28: MvrwMain03 evaluation → Xevaln, evaluating → Xevalg',
    'structuralMcsh.js.0-37-0.2026-10-28: rules MvrlMnnm01..06 renamed MvreMain01..06',
    'structuralMcsh.js.0-36-0.2026-10-27: MvrwMain06 srtr_structure_main',
    'structuralMcsh.js.0-35-0.2026-10-26: MvrwMain05 infrsc_info_resource_main',
    'structuralMcsh.js.0-34-0.2026-10-26: MvrwMain04 doing_DOING_main; no apostrophe before the-suffix',
    'structuralMcsh.js.0-33-0.2026-10-26: MvrwMain03 evalg_evaluating_main, fCheckMainNameSuffix shared',
    'structuralMcsh.js.0-32-0.2026-10-26: MvrwMain02 main-name starts with a-capital letter',
    'structuralMcsh.js.0-31-0.2026-10-26: MvrwMain02 evolg_evoluting_main',
    'structuralMcsh.js.0-30-0.2026-10-24: generic-tree:: "=== label:" groups are NOT generics (MvrwGstr01/02)',
    'structuralMcsh.js.0-29-0.2026-10-24: MvrwId13 srtr_structure_suffix',
    'structuralMcsh.js.0-28-0.2026-10-24: MvreMain01 no-hyphen, main-names with underscores',
    'structuralMcsh.js.0-27-0.2026-10-22: MvrwGstr02 generic_has_specific, fGstrIndex shared',
    'structuralMcsh.js.0-26-0.2026-10-20: MvrwGstr01 specific_has_generic',
    'structuralMcsh.js.0-25-0.2026-10-19: MvrwId12 sptr_specific_tree_suffix, fCheckIdParaSuffix rEndIn',
    'structuralMcsh.js.0-24-0.2026-10-19: MvrwId11 gntr_generic_tree_suffix',
    'structuralMcsh.js.0-23-0.2026-10-19: MvrwId10 prtr_part_tree_suffix',
    'structuralMcsh.js.0-22-0.2026-10-19: MvrwId09 wltr_whole_tree_suffix',
    'structuralMcsh.js.0-21-0.2026-10-19: MvrwId08 chtr_child_tree_suffix',
    'structuralMcsh.js.0-20-0.2026-10-19: MvrwId07 pntr_parent_tree_suffix, fCheckIdParaSuffix',
    'structuralMcsh.js.0-19-0.2026-10-19: MvrwId06 irsc_info_resource_suffix',
    'structuralMcsh.js.0-18-0.2026-10-19: MvrwId05 evog_evoluting_suffix',
    'structuralMcsh.js.0-17-0.2026-10-19: MvrwId04 eval_evaluation_suffix, fCheckIdSuffix shared with MvrwId02',
    'structuralMcsh.js.0-16-0.2026-10-19: MvrwId03 space_in_id',
    'structuralMcsh.js.0-15-0.2026-10-19: MvrwId02 dong_DOING_suffix',
    'structuralMcsh.js.0-14-0.2026-10-19: MvrwId01 non-english-letters',
    'structuralMcsh.js.0-13-0.2026-10-09: renaming',
    'structuralMcsh.js.0-12-0.2026-10-04: fRunChecksMcsh bQuietIn, for reportMcsh.mjs',
    'structuralMcsh.js.0-11-0.2026-10-04: MvreFile01 tells missing from unclosed idOverview',
    'structuralMcsh.js.0-10-0.2026-10-03: fFindIdElmt removed, every cnpt has sNameId',
    'structuralMcsh.js.0-9-0.2026-10-03: MvreName01 checks every McsLago, not only Engl',
    'structuralMcsh.js.0-8-0.2026-10-03: MvreName01 keys the-whole-name-line',
    'structuralMcsh.js.0-7-0.2026-10-02: MvreName01 sees CnptFile-names and duplicates',
    'structuralMcsh.js.0-6-0.2026-10-02: parserMcsh-model (ooIdRelaCnpt, aoTitlePara)',
    'structural.js.0-5-0.2026-10-01: MvrwMisc01 per-token, set-notation not a date',
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
 * DOING: finds the-concepts of a-file, the-CnptSect and CnptPara of ooIdRelaCnpt.
 * INPUT: one CnptFile-object and the-sType wanted, '' for both.
 * OUTPUT: array of concept-objects, each with its sNameIdRela as sIdCnpt.
 *   Made ONCE per file and type (oMapCnptOfFile), the-checks only read them; frozen,
 *   so no check can change what the-next check sees.
 */
const oMapCnptOfFile = new WeakMap();   // oCnptFile → { sTypeIn: aoCnpt }
function fFindCnpt(oCnptFile, sTypeIn = '') {
  let ooByType = oMapCnptOfFile.get(oCnptFile);
  if (!ooByType) { ooByType = {}; oMapCnptOfFile.set(oCnptFile, ooByType); }
  if (ooByType[sTypeIn]) return ooByType[sTypeIn];
  const aoCnpt = [];
  for (const [sIdCnpt, oCnpt] of Object.entries(oCnptFile.ooIdRelaCnpt ?? {})) {
    if (sTypeIn !== '' && oCnpt.sType !== sTypeIn) continue;
    aoCnpt.push(Object.freeze({ ...oCnpt, sIdCnpt }));
  }
  ooByType[sTypeIn] = Object.freeze(aoCnpt);
  return ooByType[sTypeIn];
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
 * DOING: the-CnptFile is a-concept too: its names are in the name::-para of
 *   idOverview, NOT in ooIdRelaCnpt, so we build a-concept-object for it.
 * OUTPUT: one concept-like object of the-file itself.
 */
function fFindCnptOfFile(oCnptFile) {
  const oParaName = (oCnptFile.aoTitlePara ?? []).find(oPara => oPara.sNameTitle === 'name');
  return {
    sType: 'CnptFile',
    ooNameLago: oCnptFile.ooNameLago,
    sNameMainFrml: oCnptFile.sNameMainFrml,
    sNameTitle: oCnptFile.sNameTitle,
    sNameId: oParaName?.sNameId ?? 'idOverview'
  };
}

/** Build a map: sName → [{ sNameFile, sNameId, sTitle }] for duplicate detection */
function fBuildMapName(aoCnptFile) {
  const oMap = new Map();
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    // the-names of the-CnptFile, the-CnptSect and the-CnptPara, in EVERY McsLago.
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

// 🔴 MvreFile01  CnptFile missing idOverview section
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
        aoIssue.push(fIssue('ERROR', 'MvreFile01', oCnptFile.sNameFile, null,
          `id="idOverview" is NOT a-closed <section> — the-parser can-not read IT, see Hitp09`,
          nLineOverview));
      } else {
        aoIssue.push(fIssue('ERROR', 'MvreFile01', oCnptFile.sNameFile, null,
          `File has no <section id="idOverview"> — CnptFile identity section is missing`));
      }
    }
  }
  return aoIssue;
}

// a-link section, a-concept described in another place: its heading ends in "(link)",
//   "( link!=animal )", "( Link )", or ends in the-word link: "X link", "X link,", "X link )"
//   (MvrwSect01..04 skip it)
const rSectLink = /\(\s*link\b[^)]*\)|\blink[\s,)]*$/i;

/**
 * OUTPUT: the-sections the-MvrwSect rules check: the-CnptSect AND the-sections without
 *   valid names (parserMcsh aoSectNoName), else a-section without name:: is never seen.
 *   A-section without names counts only INSIDE a-named whole: its whole is the-file or
 *   a-CnptSect, or a-sibling is a-CnptSect. So the-parts of a-quoted document (law
 *   Articles in an-unnamed Chapter, white-paper sections) are not reported.
 *   A-displayed text (<section class="clsText">: law, white-paper, charter, quoted article)
 *   is not checked, the-clsText section itself AND every section inside it: the-text is
 *   shown as it is.
 */
function fFindSectAll(oCnptFile) {
  const aoCnptSect = fFindCnpt(oCnptFile, 'CnptSect');
  const oSetIdNamed = new Set(aoCnptSect.map(oSect => oSect.sNameId));
  const oSetIdWholeOfNamed = new Set(aoCnptSect.map(oSect => oSect.sIdWhole_elmt ?? null));
  const aoSectNoName = (oCnptFile.aoSectNoName ?? []).filter(oSect => {
    const sIdWhole = oSect.sIdWhole_elmt ?? null;
    return sIdWhole === null || oSetIdNamed.has(sIdWhole) || oSetIdWholeOfNamed.has(sIdWhole);
  });
  const aoSect = [...aoCnptSect, ...aoSectNoName];
  if (!(oCnptFile.aoRaw_sect ?? []).some(oRaw => /^<section\b[^>]*\bclsText\b/.test(oRaw.sRawHtml ?? ''))) return aoSect;
  // id → its whole id, and the-ids of the-clsText sections
  const oMapIdWhole = new Map();
  const oSetIdText = new Set();
  for (const oRaw of oCnptFile.aoRaw_sect) {
    if (!oRaw.sNameId) continue;
    oMapIdWhole.set(oRaw.sNameId, oRaw.sIdWhole_elmt ?? null);
    if (/^<section\b[^>]*\bclass="[^"]*\bclsText\b/.test(oRaw.sRawHtml ?? '')) oSetIdText.add(oRaw.sNameId);
  }
  // the-section itself or one of its wholes is clsText
  const fInText = sIdIn => {
    for (let sId = sIdIn, nGuard = 0; sId && nGuard < 64; sId = oMapIdWhole.get(sId), nGuard++) {
      if (oSetIdText.has(sId)) return true;
    }
    return false;
  };
  return aoSect.filter(oSect => !fInText(oSect.sNameId));
}

// 🔶 [MvrwSect01] CnptSect  has no description::-paragraph
// 🔶 [MvrwSect02] CnptSect  has an empty/placeholder description:: (only "·" or "×")
function fCheckDescription(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oSect of fFindSectAll(oCnptFile)) {
      if (rSectLink.test(oSect.sNameTitle ?? '')) continue;   // a-link section: "X (link)", "X ( link!=Y )"
      const aoParaDesc = fFindParaAll(oSect, 'description');
      if (aoParaDesc.length === 0) {
        aoIssue.push(fIssue('WARN', 'MvrwSect01', oCnptFile.sNameFile, oSect,
          `CnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) has no description::-paragraph`,
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
          aoIssue.push(fIssue('WARN', 'MvrwSect02', oCnptFile.sNameFile, oSect,
            `CnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) has an empty/placeholder description:: (only "·" or "×")`,
            oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
        }
      }
    }
  }
  return aoIssue;
}

// 🔶 [MvrwSect03] CnptSect  has no name::-paragraph
// 🔶 [MvrwSect04] CnptSect  name::-paragraph has no valid Mcsh* entries
function fCheckName(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oSect of fFindSectAll(oCnptFile)) {
      if (rSectLink.test(oSect.sNameTitle ?? '')) continue;   // a-link section: "X (link)", "X ( link!=Y )"
      if (fFindParaAll(oSect, 'name').length === 0) {
        // a-section without name:: (aoSectNoName): a-CnptSect always has names
        aoIssue.push(fIssue('WARN', 'MvrwSect03', oCnptFile.sNameFile, oSect,
          `CnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) has no name::-paragraph`,
          oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
      } else if (fCountName(oSect) === 0) {
        aoIssue.push(fIssue('WARN', 'MvrwSect04', oCnptFile.sNameFile, oSect,
          `CnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) name::-paragraph has no valid Mcsh* entries`,
          oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
      }
    }
  }
  return aoIssue;
}

// 🔴 [MvreName01] Duplicated names:
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
      aoIssue.push(fIssue('ERROR', 'MvreName01', oOcc.sNameFile, null,
        `Duplicate name-line "${sNameFull}" ${sLoc}`, nLine));
    }
  }
  return aoIssue;
}

// 🔴 [MvreName02] name_comma: a-name-line "<br>* McshLago.name!notations," ENDS its name with a-comma;
//   a-name has no comma in it; after the-comma, everything in the-line is a-comment.
//   ERROR: a-name-line without a-comma: createMcsh --namecomma adds it at the-end.
//   WARN:  a-comma in the-middle: after the-first comma comes a-notation, a-letter, a-digit, a-"-"
//   or another comma ("food.060_rice,!⇒foodRice"): the-rest is read as a-comment, by hand.
const rNameLineStart = /^\s*<br>\*\s*Mcsh[A-Z][a-z]{3}\./;
const rNameCommaMid = /^\s*<br>\*\s*Mcsh[A-Z][a-z]{3}\.[^,]*,(?=[!,\-\p{L}\p{N}])/u;
function fCheckNameComma(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError || !oCnptFile.sNameIdAbso) continue;
    let sRaw;
    try { sRaw = moFs.readFileSync(oCnptFile.sNameIdAbso, 'utf8'); } catch { continue; }
    sRaw.split('\n').forEach((sLine, nL) => {
      if (!rNameLineStart.test(sLine)) return;
      if (!sLine.includes(',')) {
        aoIssue.push(fIssue('ERROR', 'MvreName02', oCnptFile.sNameFile, null,
          `name_comma: name-line "${sLine.trim().replace(/^<br>\*\s*/, '')}" has no comma at its end`, nL + 1));
      } else if (rNameCommaMid.test(sLine)) {
        aoIssue.push(fIssue('WARN', 'MvreName02', oCnptFile.sNameFile, null,
          `name_comma: name-line "${sLine.trim().replace(/^<br>\*\s*/, '')}" has a-comma in the-middle: after it all is a-comment`, nL + 1));
      }
    });
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

// 🔶 [MvrwMisc01] DATE "{2022-4-27}" has NO {YYYY-MM-DD} format, judged per {token}, not per line
function fCheckDate(aoCnptFile) {
  const aoIssue = [];
  const rDateGood = /^\{\d{4}(?:-\d{2}(?:-\d{2})?)?\}$/;
  const rTex      = /\\\([\s\S]*?\\\)/g;   // inline-TeX spans hold math, never dates
  const rBrace    = /\{[^{}]*\}/g;
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oSect of fFindCnpt(oCnptFile, 'CnptSect')) {
      for (const oPara of oSect.aoTitlePara ?? []) {
        // a-date is "{..}": a-para without "{" has none, no need to strip its tags
        if ((oPara.sPara ?? '').indexOf('{') === -1) continue;
        for (const sLine of fFindParaText(oPara).split('\n')) {
          const oSetTokBad = new Set();       // one issue per distinct token on the line
          for (const [sTok] of sLine.replace(rTex, ' ').matchAll(rBrace)) {
            if (fIsDateCandidate(sTok) && !rDateGood.test(sTok)) oSetTokBad.add(sTok);
          }
          for (const sTok of oSetTokBad) {
            aoIssue.push(fIssue('WARN', 'MvrwMisc01', oCnptFile.sNameFile, oSect,
              `DATE "${sTok}" has NO {YYYY-MM-DD} format in line: "${sLine.trim()}" in file: "${oCnptFile.sNameFile}"`,
              oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
          }
        }
      }
    }
  }
  return aoIssue;
}

// 🔶 [MvrwId01] non-english-letters: an-id has a-letter outside A-Z a-z (Greek Η, é, µ ...)
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
      aoIssue.push(fIssue('WARN', 'MvrwId01', oCnptFile.sNameFile, null,
        `non-english-letters [${[...new Set(aLetter)].join('')}] in id="${sId}"`, nLine));
    }
  }
  return aoIssue;
}

/**
 * DOING: the-id of an-attribute-CnptSect titled "<sTitle> of X" (with or without
 *   "NN_") or "X'<sTitle>" must end in sSuffix.
 *   "<sTitle>.X" (a-specific) and "GENERIC-SPECIFIC-TREE of X'<sTitle>" are NOT judged.
 * OUTPUT: array of WARN-issues with code sCode.
 */
function fCheckIdSuffix(aoCnptFile, sCode, sNameRule, sTitle, sSuffix) {
  const aoIssue = [];
  const rTitle = new RegExp(`^(\\d+_)?${sTitle} of |^[^\\s.']+'${sTitle}$`, 'i');
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oSect of fFindCnpt(oCnptFile, 'CnptSect')) {
      if (!rTitle.test((oSect.sNameTitle ?? '').trim())) continue;
      if (oSect.sNameId.endsWith(sSuffix)) continue;
      aoIssue.push(fIssue('WARN', sCode, oCnptFile.sNameFile, oSect,
        `${sNameRule}: id="${oSect.sNameId}" of "${oSect.sNameTitle}" does not end in "${sSuffix}"`,
        oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
    }
  }
  return aoIssue;
}

// 🔶 [MvrwId02] dong_DOING_suffix: the-id of a-DOING-concept ends in "dong",
//   NOT dng | dngF | dngFT | doing.
function fCheckIdDong(aoCnptFile) {
  return fCheckIdSuffix(aoCnptFile, 'MvrwId02', 'dong_DOING_suffix', 'DOING', 'dong');
}

// 🔶 [MvrwId04] eval_evaluation_suffix: the-id of an-evaluation-concept ends in "eval",
//   NOT eln | evln | evaln | evaluation | evalF | evalFT | attNNN.
function fCheckIdEval(aoCnptFile) {
  return fCheckIdSuffix(aoCnptFile, 'MvrwId04', 'eval_evaluation_suffix', 'evaluation', 'eval');
}

// 🔶 [MvrwId05] evog_evoluting_suffix: the-id of an-evoluting-concept ends in "evog",
//   NOT evg | Evg | evlg | evltg | evoluting | evgF | evgFT | attNNN.
function fCheckIdEvog(aoCnptFile) {
  return fCheckIdSuffix(aoCnptFile, 'MvrwId05', 'evog_evoluting_suffix', 'evoluting', 'evog');
}

// 🔶 [MvrwId06] irsc_info_resource_suffix: the-id of an-info-resource-concept ends in "irsc",
//   NOT rsc | infrsc | resource | ircs.
function fCheckIdIrsc(aoCnptFile) {
  return fCheckIdSuffix(aoCnptFile, 'MvrwId06', 'irsc_info_resource_suffix', 'info-resource', 'irsc');
}

/**
 * DOING: the-id of a-para-concept "<sTitlePara>::" (of the-CnptFile or of any concept)
 *   must end in sSuffix (or match rEndIn, when given).
 * OUTPUT: array of WARN-issues with code sCode.
 */
function fCheckIdParaSuffix(aoCnptFile, sCode, sNameRule, sTitlePara, sSuffix, rEndIn) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oCnpt of [fFindCnptOfFile(oCnptFile), ...fFindCnpt(oCnptFile)]) {
      const aoPara = oCnpt.sType === 'CnptFile' ? oCnptFile.aoTitlePara : oCnpt.aoTitlePara;
      for (const oPara of aoPara ?? []) {
        if (oPara.sNameTitle !== sTitlePara || !oPara.sNameId) continue;
        if (rEndIn ? rEndIn.test(oPara.sNameId) : oPara.sNameId.endsWith(sSuffix)) continue;
        aoIssue.push(fIssue('WARN', sCode, oCnptFile.sNameFile, oCnpt.sType === 'CnptFile' ? null : oCnpt,
          `${sNameRule}: id="${oPara.sNameId}" of "${sTitlePara}::" does not end in "${sSuffix}"`,
          oCnptFile.oMapIdLine.get(oPara.sNameId) ?? null));
      }
    }
  }
  return aoIssue;
}

// 🔶 [MvrwId07] pntr_parent_tree_suffix: the-id of a "parent-tree::" para ends in "pntr", NOT rtr.
function fCheckIdPntr(aoCnptFile) {
  return fCheckIdParaSuffix(aoCnptFile, 'MvrwId07', 'pntr_parent_tree_suffix', 'parent-tree', 'pntr');
}

// 🔶 [MvrwId08] chtr_child_tree_suffix: the-id of a "child-tree::" para ends in "chtr", NOT ctr.
function fCheckIdChtr(aoCnptFile) {
  return fCheckIdParaSuffix(aoCnptFile, 'MvrwId08', 'chtr_child_tree_suffix', 'child-tree', 'chtr');
}

// 🔶 [MvrwId09] wltr_whole_tree_suffix: the-id of a "whole-tree::" para ends in "wltr",
//   NOT wtr | whlchn | whl | P1.
function fCheckIdWltr(aoCnptFile) {
  return fCheckIdParaSuffix(aoCnptFile, 'MvrwId09', 'wltr_whole_tree_suffix', 'whole-tree', 'wltr');
}

// 🔶 [MvrwId10] prtr_part_tree_suffix: the-id of a "part-tree::" para ends in "prtr", NOT ptr | rtr | prt.
function fCheckIdPrtr(aoCnptFile) {
  return fCheckIdParaSuffix(aoCnptFile, 'MvrwId10', 'prtr_part_tree_suffix', 'part-tree', 'prtr');
}

// 🔶 [MvrwId11] gntr_generic_tree_suffix: the-id of a "generic-tree::" para ends in "gntr", NOT gtr.
function fCheckIdGntr(aoCnptFile) {
  return fCheckIdParaSuffix(aoCnptFile, 'MvrwId11', 'gntr_generic_tree_suffix', 'generic-tree', 'gntr');
}

// 🔶 [MvrwId12] sptr_specific_tree_suffix: the-id of a "specific-tree::" para ends in "sptr", NOT str;
//   a-list of specific-trees may add ONE letter or digit: idLHmnm0011sptrA, idLHmnm0011sptr2.
function fCheckIdSptr(aoCnptFile) {
  return fCheckIdParaSuffix(aoCnptFile, 'MvrwId12', 'sptr_specific_tree_suffix', 'specific-tree', 'sptr',
    /sptr[A-Z0-9]?$/);
}

// 🔶 [MvrwId13] srtr_structure_suffix: the-id of a-structure-concept ends in "srtr",
//   ("structure of X", "NN_structure of X", "X'structure").
function fCheckIdSrtr(aoCnptFile) {
  return fCheckIdSuffix(aoCnptFile, 'MvrwId13', 'srtr_structure_suffix', 'structure', 'srtr');
}

// 🔴 [MvreMain01] Mmn_form: an-Mmn (main-mind-name) has ONLY English letters, digits, _ and .
//   (no - space, no other-language letters): rltnAttributeThenEntity.
//   ONE issue per concept, on the-line of its Mmn.
const rMmnForm = /^[A-Za-z0-9_.]+$/;
/** OUTPUT: '' when sMmnIn is a-valid Mmn, else the-reason. */
function fFindMmnFormError(sMmnIn) {
  if (rMmnForm.test(sMmnIn)) return '';
  const aBad = [...new Set(sMmnIn.replace(/[A-Za-z0-9_.]/g, ''))].map(sC => sC === ' ' ? 'space' : sC);
  return `has ${aBad.map(sC => '"' + sC + '"').join(' ')}: only English letters, digits, _ .`;
}
function fCheckMainNameHyphen(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    const aoCnpt = [
      { ...fFindCnptOfFile(oCnptFile), aoTitlePara: oCnptFile.aoTitlePara },
      ...fFindCnpt(oCnptFile)
    ];
    for (const oCnpt of aoCnpt) {
      const sMmn = oCnpt.sNameMainFrml ?? '';
      if (!sMmn) continue;
      const sError = fFindMmnFormError(sMmn);
      if (!sError) continue;
      const sLago = Object.values(oCnpt.ooNameLago ?? {}).find(oLago => oLago.sNameMainFrml === sMmn)?.aoName?.[0]?.sLago ?? 'Engl';
      // the-name::-para of a-CnptSect or CnptFile; a-CnptPara IS its name-para
      const oParaName = fFindParaAll(oCnpt, 'name')[0];
      const sIdPara = oCnpt.sType === 'CnptPara' ? oCnpt.sNameId : (oParaName?.sNameId ?? oCnpt.sNameId);
      const aLinePara = String(oCnpt.sType === 'CnptPara' ? oCnpt.sPara : oParaName?.sPara ?? '').split('\n');
      const nLinePara = oCnptFile.oMapIdLine.get(sIdPara) ?? null;
      // the-line of the-Mmn "McshLago.Mmn," | "McshLago.Mmn!=…"
      const nOffset = aLinePara.findIndex(sLine => new RegExp(`Mcsh${sLago}\\.${sMmn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[,!]`).test(sLine));
      const nLine = nLinePara != null && nOffset !== -1 ? nLinePara + nOffset : nLinePara;
      aoIssue.push(fIssue('ERROR', 'MvreMain01', oCnptFile.sNameFile, oCnpt,
        `Mmn_form: Mmn "Mcsh${sLago}.${sMmn}" ${sError}`, nLine));
    }
  }
  return aoIssue;
}

/**
 * DOING: the-main-name of a-CnptSect whose title matches rTitle ends in sSuffix, without an-apostrophe
 *   before it, and starts with a-capital letter (a-multiword attribute): Humanevolg, NOT humanevolg | Human'evolg;
 *   a-genericSpecific name starts with its small-letter word: foodGingerevaln (word "food" + "Ginger").
 * OUTPUT: array of WARN-issues with code sCode.
 */
function fCheckMainNameSuffix(aoCnptFile, sCode, sNameRule, rTitle, sSuffix, bLeafNoMain = false) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    // bLeafNoMain: the-ids of the-sections with subsections
    const oSetIdWhole = bLeafNoMain
      ? new Set(fFindSectAll(oCnptFile).map(oSectOne => oSectOne.sIdWhole_elmt ?? null)) : null;
    for (const oSect of fFindCnpt(oCnptFile, 'CnptSect')) {
      if (!rTitle.test((oSect.sNameTitle ?? '').trim())) continue;
      const sMain = oSect.sNameMainFrml ?? '';
      // no Mmn (main-mind-name): nothing to judge; an-Mmn is needed only by a-concept with attributes
      if (!sMain) continue;
      // bLeafNoMain: a-section without subsections has NO main-name, only its formal-name X'info_resource
      if (bLeafNoMain && !oSetIdWhole.has(oSect.sNameId)) {
        const oParaLeaf = fFindParaAll(oSect, 'name')[0];
        const nLineLeaf = oParaLeaf ? oCnptFile.oMapIdLine.get(oParaLeaf.sNameId) ?? null : null;
        const nOffsetLeaf = String(oParaLeaf?.sPara ?? '').split('\n')
          .findIndex(sLine => sLine.includes(`McshEngl.${sMain}`) || sLine.includes(`!⇒${sMain}`));
        aoIssue.push(fIssue('WARN', sCode, oCnptFile.sNameFile, oSect,
          `${sNameRule.replace(/_main$/, '_leaf')}: main-name "McshEngl.${sMain}" of "${oSect.sNameTitle}" ` +
          'is not needed: the-section has no subsections',
          nLineLeaf != null && nOffsetLeaf !== -1 ? nLineLeaf + nOffsetLeaf
            : nLineLeaf ?? oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
        continue;
      }
      // capital first, unless it starts with a-word of a-genericSpecific name: foodGingerevaln
      const bSuffix = sMain.endsWith(sSuffix) && !sMain.endsWith("'" + sSuffix),
        bCapital = /^[A-Z]/.test(sMain) || /^[a-z]+[A-Z]/.test(sMain);
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

// 🔶 [MvrwMain02] evolg_evoluting_main: the-main-name of an-evoluting-concept
//   ("evoluting of X", "NN_evoluting of X", "X'evoluting") is Xevolg, capital first,
//   NOT evoluting-of-X | X'evoluting | Xevlg | Xevg | Xevog | humanevolg.
function fCheckMainNameEvolg(aoCnptFile) {
  return fCheckMainNameSuffix(aoCnptFile, 'MvrwMain02', 'evolg_evoluting_main',
    /^(\d+_)?evoluting of |^[^\s.']+'evoluting$/i, 'evolg');
}

// 🔶 [MvrwMain03] evaln_evaluation_main: the-main-name of an-evaluation-concept
//   ("evaluation of X", "NN_evaluation of X", "X'evaluation") is Xevaln, capital first,
//   NOT X'evaluation | Xeval | Xevalg (evalg until 2026-10-28);
//   the-main-name of an-evaluating-concept, the-process ("evaluating of X", "X'evaluating") is Xevalg,
//   like evoluting → Xevolg.
function fCheckMainNameEvalg(aoCnptFile) {
  return [
    ...fCheckMainNameSuffix(aoCnptFile, 'MvrwMain03', 'evaln_evaluation_main',
      /^(\d+_)?evaluation of |^[^\s.']+'evaluation$/i, 'evaln'),
    ...fCheckMainNameSuffix(aoCnptFile, 'MvrwMain03', 'evalg_evaluating_main',
      /^(\d+_)?evaluating of |^[^\s.']+'evaluating$/i, 'evalg')
  ];
}

// 🔶 [MvrwMain04] doing_DOING_main: the-main-name of a-DOING-concept
//   ("DOING of X", "NN_DOING of X", "X'DOING") is Xdoing, capital first,
//   NOT X'doing | entity'doing | Xdong | DongX.
function fCheckMainNameDoing(aoCnptFile) {
  return fCheckMainNameSuffix(aoCnptFile, 'MvrwMain04', 'doing_DOING_main',
    /^(\d+_)?DOING of |^[^\s.']+'DOING$/i, 'doing');
}

// 🔶 [MvrwMain05] infrsc_info_resource_main: the-main-name of an-info-resource-concept
//   ("info-resource of X", "NN_info-resource of X", "X'info-resource") is Xinfrsc, capital first,
//   NOT X'info_resource | X'info-resource | info-resource-of-X | Xirsc | Xrsc.
//   ONLY a-section with subsections has a-main-name: a-section without subsections
//   has only "McshEngl.X'info_resource," (infrsc_info_resource_leaf).
function fCheckMainNameInfrsc(aoCnptFile) {
  return fCheckMainNameSuffix(aoCnptFile, 'MvrwMain05', 'infrsc_info_resource_main',
    /^(\d+_)?info-resource of |^[^\s.']+'info-resource$/i, 'infrsc', true);
}

// 🔶 [MvrwMain06] srtr_structure_main: the-main-name of a-structure-concept
//   ("structure of X", "NN_structure of X", "X'structure") is Xsrtr, capital first,
//   NOT X'structure | X'attStructure | structure-of-X.
function fCheckMainNameSrtr(aoCnptFile) {
  return fCheckMainNameSuffix(aoCnptFile, 'MvrwMain06', 'srtr_structure_main',
    /^(\d+_)?structure of |^[^\s.']+'structure$/i, 'srtr');
}

/**
 * DOING: the-direct attributes of a-concept. Usually they are its direct parts, but an-important
 *   attribute of a-deeper level can-be a-top section, so they are-searched in the-whole file:
 *   a) title: "Y of N" | "N'Y" (= "Y of N") | "N.Y" (a-specific), N a-name of the-concept (its Mmn too);
 *   b) id: the-id of the-concept + a-name, "idBasename" | "idBaseName" (idBdyHmn295 → idBdyHmn295dong),
 *      the-shortest one: idBdyHmn295dongX is an-attribute of idBdyHmn295dong, not of idBdyHmn295.
 *   NOT tree-views (…TREE…), NOT link sections, NOT clsText sections (fFindSectAll), NOT idOverview.
 * fBuildAttrIndex: once per file. fFindAttrDirect: per concept.
 */
const rTitleTree = /TREE\b/;
const fNormName = sIn => String(sIn ?? '').toLowerCase().replace(/[-_\s]+/g, '-').trim();
function fBuildAttrIndex(aoSectIn) {
  const aoSect = aoSectIn.filter(oSect => oSect.sNameId !== 'idOverview')
    .filter(oSect => { const sTitle = (oSect.sNameTitle ?? '').trim(); return sTitle && !rTitleTree.test(sTitle) && !rSectLink.test(sTitle); });
  const oMapKey = new Map();   // normalized N → [oSect]
  const fAdd = (sKey, oSect) => { const sNorm = fNormName(sKey); if (!sNorm) return; if (!oMapKey.has(sNorm)) oMapKey.set(sNorm, []); oMapKey.get(sNorm).push(oSect); };
  for (const oSect of aoSect) {
    const sTitle = oSect.sNameTitle.trim();
    const aOf = sTitle.match(/^\S.*? of (\S+)/);
    if (aOf) { fAdd(aOf[1].split('!')[0], oSect); continue; }
    // "N'Y" | "N.Y": every prefix of the-first word before a ' or a .
    const sWord = sTitle.split(/\s/)[0];
    for (let nI = 1; nI < sWord.length; nI++) if (sWord[nI] === "'" || sWord[nI] === '.') fAdd(sWord.slice(0, nI), oSect);
  }
  const aoSectById = [...aoSect].sort((oA, oB) => oA.sNameId < oB.sNameId ? -1 : oA.sNameId > oB.sNameId ? 1 : 0);
  // id → the-id of its whole section, null at level 1
  const oMapIdWhole = new Map(aoSectIn.map(oSect => [oSect.sNameId, oSect.sIdWhole_elmt ?? null]));
  return { oMapKey, aoSectById, oMapIdWhole };
}
// a-section sIdIn is inside the-section sIdWholeIn, at any depth
function fIsInside(oMapIdWholeIn, sIdIn, sIdWholeIn) {
  for (let sId = oMapIdWholeIn.get(sIdIn), nGuard = 0; sId && nGuard < 100; sId = oMapIdWholeIn.get(sId), nGuard++)
    if (sId === sIdWholeIn) return true;
  return false;
}
function fFindAttrDirect(oIndexIn, oCnptIn) {
  const oSetAttr = new Set();
  // a) title
  const oSetName = new Set(Object.values(oCnptIn.ooNameLago ?? {}).flatMap(oLago => (oLago.aoName ?? []).map(o => fNormName(o.sName))));
  if (oCnptIn.sNameMainFrml) oSetName.add(fNormName(oCnptIn.sNameMainFrml));
  // NOT the-complement "N.NO" | "NNo" of the-concept N: it is a-sibling specific, not an-attribute
  //   (Agntasset.TRADABLE, Agntasset.TRADABLE.NO; Agntskhd.authority, Agntskhd.authorityNo)
  const fIsComplement = (oSect, sName) => {
    if (oSect.sType !== 'CnptSect' || oCnptIn.sType === 'CnptFile' || fIsInside(oIndexIn.oMapIdWhole, oSect.sNameId, oCnptIn.sNameId)) return false;
    const sWord = fNormName((oSect.sNameTitle ?? '').trim().split(/\s/)[0]);
    return sWord === fNormName(sName + '.NO') || sWord === fNormName(sName + 'No');
  };
  for (const sName of oSetName) for (const oSect of oIndexIn.oMapKey.get(sName) ?? []) if (!fIsComplement(oSect, sName)) oSetAttr.add(oSect);
  // b) id: idBase + a-letter, the-shortest ones
  const sIdBase = oCnptIn.sType === 'CnptFile' ? '' : (oCnptIn.sNameId ?? '');
  if (sIdBase) {
    const aoSect = oIndexIn.aoSectById;
    let nLow = 0, nHigh = aoSect.length;
    while (nLow < nHigh) { const nMid = (nLow + nHigh) >> 1; if (aoSect[nMid].sNameId < sIdBase) nLow = nMid + 1; else nHigh = nMid; }
    const aIdFound = [];
    for (let nI = nLow; nI < aoSect.length && aoSect[nI].sNameId.startsWith(sIdBase); nI++) {
      const sId = aoSect[nI].sNameId;
      if (!/[A-Za-z]/.test(sId[sIdBase.length] ?? '')) continue;
      // sorted: a-shorter attribute id comes before the-ids that extend it
      if (aIdFound.some(sIdShort => sId.startsWith(sIdShort))) continue;
      // inside the-concept, or a-level-1 section of a-deeper concept: a-sibling can-have an-id that extends it
      // (src-number.SIGNED idSrcnmbSgn, src-number.UNSIGNED idSrcnmbSgnNo;
      //  level-1 DongProving.direct idRfrtgPrvgDrct, DongProving.directNo idRfrtgPrvgDrctN)
      if (!fIsInside(oIndexIn.oMapIdWhole, sId, sIdBase)) {
        const sIdWholeSect = aoSect[nI].sIdWhole_elmt ?? null;
        if (sIdWholeSect !== null || (oIndexIn.oMapIdWhole.get(sIdBase) ?? null) === null) continue;
      }
      aIdFound.push(sId); oSetAttr.add(aoSect[nI]);
    }
  }
  oSetAttr.delete(oCnptIn);
  for (const oSect of oSetAttr) if (oSect.sNameId === oCnptIn.sNameId) oSetAttr.delete(oSect);
  return [...oSetAttr];
}

// 🔶 [MvrwMain01] Attrbase: IF a-concept has Attrbase B ("McshEngl.B!Attrbase[!⇒M],"),
//   THEN the-main-names of its attributes begin with B: system (B Syst) → Systnode, Systsrtr,
//   NOT Systemdoing | sector_vs_system.
//   Its attributes: fFindAttrDirect, with an-Mmn (main-mind-name).
//   EXEMPT: a-section with an-alias that begins with B keeps its own main-name:
//   "McshEngl.Systsector!⇒sector_vs_system,". SciX | DissX | RltnX… always need such an-alias
//   (a-prefix from the-concept's own main-name is not "own": SciLago'organization → Lagosci…).
const rMainPrefixOwn = /^(Sci|Diss|Rltn)[A-Z]/;
function fCheckMainNameAttrbaseBegin(aoCnptFile) {
  const aoIssue = [];
  // the-Attrbase B of a-concept, from its English names: "B!Attrbase" | "B!Attrbase!⇒M"
  const fFindBase = oCnptIn => {
    const oName = (oCnptIn.ooNameLago?.oLagoEngl?.aoName ?? []).find(o => /!Attrbase\b/.test(o.sNameFull ?? ''));
    return oName ? oName.sNameFull.split('!')[0].trim() : '';
  };
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    const aoSect = fFindSectAll(oCnptFile).filter(oSect => oSect.sType === 'CnptSect');
    const aoCnptBase = [fFindCnptOfFile(oCnptFile), ...fFindCnpt(oCnptFile, 'CnptSect')]
      .map(oCnpt => ({ oCnpt, sBase: fFindBase(oCnpt) })).filter(o => o.sBase);
    const oIndex = aoCnptBase.length ? fBuildAttrIndex(aoSect) : null;
    for (const { oCnpt, sBase } of aoCnptBase) {
      // the-main-name of the-concept: SciLago'organization takes "Sci" from it, it is NOT its own prefix
      const sMainCnpt = oCnpt.sNameMainFrml ?? '';
      for (const oSect of fFindAttrDirect(oIndex, oCnpt)) {
        // only a-section WITH an-Mmn (main-mind-name): a-tree-view has names but no Mmn
        const sMain = oSect.sNameMainFrml ?? '';
        if (!sMain || sMain.startsWith(sBase)) continue;
        // an-alias that begins with B ("Systsector!⇒sector_vs_system"): it keeps its own main-name
        if ((oSect.ooNameLago?.oLagoEngl?.aoName ?? []).some(o => (o.sName ?? '').startsWith(sBase))) continue;
        const bOwn = rMainPrefixOwn.test(sMain) && !(sMainCnpt && sMain.startsWith(sMainCnpt));
        // the-line of the-main-name inside the-name::-para
        const oParaName = fFindParaAll(oSect, 'name')[0];
        const nLinePara = oParaName ? oCnptFile.oMapIdLine.get(oParaName.sNameId) ?? null : null;
        const nOffset = String(oParaName?.sPara ?? '').split('\n').findIndex(sLine => sLine.includes(`!⇒${sMain},`));
        const nLine = nLinePara != null && nOffset !== -1 ? nLinePara + nOffset
          : nLinePara ?? oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null;
        aoIssue.push(fIssue('WARN', 'MvrwMain01', oCnptFile.sNameFile, oSect,
          `Attrbase: main-name "${sMain}" of "${oSect.sNameId}" ` +
          (bOwn ? `has no alias beginning with the-Attrbase "${sBase}"`
            : `does not begin with the-Attrbase "${sBase}"`) + ` of concept "${sMainCnpt}"`,
          nLine));
      }
    }
  }
  return aoIssue;
}

// 🔶 [MvrwMain08] mmn_attr: a-concept WITH attribute-sections has an-Mmn (main-mind-name),
//   the-base of the-main-names of its attributes. An-Mmn is-written:
//   "descriptive!⇒Mmn" "Mmn!=descriptive".
//   Many concepts have no Mmn: only one with attributes needs it.
//   Its attribute-sections: fFindAttrDirect (title "Y of N" | "N'Y" | "N.Y", id "idBasename").
//   A-tree-view | grouping (MISC-ATTRIBUTE of X) concept is not checked.
function fCheckMmnAttr(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    const aoSect = fFindSectAll(oCnptFile).filter(oSect => oSect.sType === 'CnptSect');
    const oIndex = fBuildAttrIndex(aoSect);
    const aoCnpt = [fFindCnptOfFile(oCnptFile), ...aoSect.filter(oSect => oSect.sNameId !== 'idOverview')];
    for (const oCnpt of aoCnpt) {
      if (oCnpt.sNameMainFrml) continue;
      const bFile = oCnpt.sType === 'CnptFile';
      // a-tree-view | a-grouping (MISC-ATTRIBUTE of X): it holds the-attributes of another concept
      if (!bFile && (rTitleTree.test((oCnpt.sNameTitle ?? '').trim()) || /^[^a-z]*ATTRIBUTE\b/.test((oCnpt.sNameTitle ?? '').trim()))) continue;
      const aTitleAttr = fFindAttrDirect(oIndex, oCnpt).map(oSect => oSect.sNameTitle.trim());
      if (!aTitleAttr.length) continue;
      const oParaName = bFile ? null : fFindParaAll(oCnpt, 'name')[0];
      const nLine = bFile
        ? oCnptFile.oMapIdLine.get(oCnpt.sNameId) ?? null
        : (oParaName ? oCnptFile.oMapIdLine.get(oParaName.sNameId) ?? null : null) ?? oCnptFile.oMapIdLine.get(oCnpt.sNameId) ?? null;
      const sTitle = bFile ? (oCnptFile.sNameTitle ?? oCnptFile.sNameFile) : (oCnpt.sNameTitle ?? oCnpt.sNameId);
      aoIssue.push(fIssue('WARN', 'MvrwMain08', oCnptFile.sNameFile, oCnpt,
        `mmn_attr: concept "${String(sTitle).trim()}" has ${aTitleAttr.length} attribute-section(s) ` +
        `("${aTitleAttr.slice(0, 3).join('", "')}"${aTitleAttr.length > 3 ? ', …' : ''}) but no Mmn: ` +
        `write "descriptive!⇒Mmn" "Mmn!=descriptive"`,
        nLine));
    }
  }
  return aoIssue;
}

// 🔶 [MvrwMain09] human_main: the-formal-main-name of a-human (an-individual person) is
//   "Humn" + birth-year (4 digits) + name, capital first: Humn1959Sinagu;
//   for a-human born BCE "HumnB" + year: HumnB0384Arst.
//   A-human is a-concept with an-English name "human.Surname.Given[.YYYY]" | "human.YYYY.Surname…" |
//   "Surname.Given.human" | "human.Name" when its main-name already starts with Humn | hmn
//   (human.Aristotle!⇒hmnB0384Arst). NOT human.DEVELOPER | human.Reddit (groups).
//   A-human without main-name is-reported too.
const rMainHuman = /^HumnB?\d{4}[A-Z][A-Za-z0-9]*$/;
const rYear = /^\{?B?\d{4}\}?$/, rWordCap = /^[A-Z][a-z]+$/;
/** OUTPUT: true when an-English name sNameIn denotes an-individual human; sMainIn its concept's main-name. */
function fIsNameHuman(sNameIn, sMainIn) {
  const aPart = sNameIn.split('.');
  let aWord;
  if (aPart[0] === 'human') aWord = aPart.slice(1);
  else if (aPart[aPart.length - 1] === 'human') aWord = aPart.slice(0, -1);
  else return false;
  if (!aWord.length || !aWord.every(sW => rWordCap.test(sW) || rYear.test(sW))) return false;
  const nCap = aWord.filter(sW => rWordCap.test(sW)).length, bYear = aWord.some(sW => rYear.test(sW));
  if (!nCap) return false;
  return nCap >= 2 || bYear || /^(Humn|hmn)/.test(sMainIn);
}
function fCheckMainNameHuman(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oCnpt of [fFindCnptOfFile(oCnptFile), ...fFindCnpt(oCnptFile)]) {
      const sMain = oCnpt.sNameMainFrml ?? '';
      const aName = (oCnpt.ooNameLago?.oLagoEngl?.aoName ?? []).map(oName => String(oName.sName ?? '').trim());
      const sNameHuman = aName.find(sName => fIsNameHuman(sName, sMain));
      if (!sNameHuman || rMainHuman.test(sMain)) continue;
      const bFile = oCnpt.sType === 'CnptFile';
      const oParaName = bFile ? null : fFindParaAll(oCnpt, 'name')[0];
      const sIdPara = bFile ? oCnpt.sNameId : (oCnpt.sType === 'CnptPara' ? oCnpt.sNameId : oParaName?.sNameId ?? oCnpt.sNameId);
      const nLinePara = oCnptFile.oMapIdLine.get(sIdPara) ?? null;
      const aLinePara = String(bFile ? '' : oCnpt.sType === 'CnptPara' ? oCnpt.sPara : oParaName?.sPara ?? '').split('\n');
      const nOffset = sMain ? aLinePara.findIndex(sLine => sLine.includes(`McshEngl.${sMain},`) || sLine.includes(`McshEngl.${sMain}!=`) || sLine.includes(`!⇒${sMain},`)) : -1;
      const nLine = nLinePara != null && nOffset !== -1 ? nLinePara + nOffset : nLinePara;
      aoIssue.push(fIssue('WARN', 'MvrwMain09', oCnptFile.sNameFile, oCnpt,
        `human_main: human "${sNameHuman}" ` + (sMain ? `has main-name "McshEngl.${sMain}"` : 'has no main-name') +
        ': use Humn + birth-year + name (Humn1959Sinagu), HumnB + year for BCE (HumnB0384Arst)',
        nLine));
    }
  }
  return aoIssue;
}

// 🔶 [MvrwMain10] attribute: a-direct part-section of a-concept with main-name M is
//   a) an-attribute: title "x of M" (NN_x of M), name "McshEngl.M'x," (- → _), both formal-names;
//      (whether x starts with a-small letter is NOT checked: an-open issue, {2026-11-12});
//   b) an-attribute-specific: title "M.x", name "McshEngl.M.x,".
//   Title and name are compared without "NN_", "(…)" and "{…}". NOT trees (…TREE…), links, clsText,
//   UPPERCASE grouping titles (MISC-ATTRIBUTE of M). Example: "protocol of AgntRppl" + AgntRppl'protocol.
//   The-file-concept is checked too: its direct parts are the-top sections, not idOverview, idMeta, idSupport;
//   its issues say "of file-concept".
const fNormMvrwMain10 = sIn => String(sIn ?? '').replace(/\{[^}]*\}|\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
const fFormalMvrwMain10 = sIn => sIn.replace(/-+/g, '_').replace(/\s+/g, '_');
function fCheckAttribute(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    const aoSect = fFindSectAll(oCnptFile);
    // the-file-concept: its direct parts are the-top sections (NOT idOverview, idMeta, idSupport)
    const sIdFile = '\u0000file';
    const oMapChild = new Map();
    for (const oSect of aoSect) {
      let sW = oSect.sIdWhole_elmt ?? null;
      if (!sW) { if (['idOverview', 'idMeta', 'idSupport'].includes(oSect.sNameId)) continue; sW = sIdFile; }
      if (!oMapChild.has(sW)) oMapChild.set(sW, []); oMapChild.get(sW).push(oSect);
    }
    const aoWhole = aoSect.filter(oSect => oSect.sType === 'CnptSect' && oSect.sNameMainFrml && oSect.sNameId !== 'idOverview');
    if (oCnptFile.sNameMainFrml) aoWhole.push({ sNameId: sIdFile, sNameMainFrml: oCnptFile.sNameMainFrml, bFile: true });
    for (const oCnpt of aoWhole) {
      const sM = oCnpt.sNameMainFrml;
      for (const oChild of oMapChild.get(oCnpt.sNameId) ?? []) {
        const sTitle = fNormMvrwMain10(oChild.sNameTitle);
        if (!sTitle || rTitleTree.test(sTitle) || rSectLink.test(oChild.sNameTitle ?? '') || /^[^a-z]*ATTRIBUTE\b/.test(sTitle)) continue;
        if (/^char\./.test(sTitle)) continue;   // a-Unicode char section "char.&#xA48C; 42124 U+A48C …" (dirUcd)
        const aName = (oChild.ooNameLago?.oLagoEngl?.aoName ?? []).map(oName => String(oName.sName ?? '').trim());
        const aProblem = [];
        let mT;
        if ((mT = /^(?:\d+_)?(.+?) of (\S+)$/.exec(sTitle))) {
          const [, sX, sOf] = mT, sForm = fFormalMvrwMain10(sX);
          if (sOf !== sM) aProblem.push(`title ends "of ${sOf}", not "of ${sM}"`);
          const rName = new RegExp(`^${sM.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'(\\d+_)?${sForm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
          if (!aName.some(sN => rName.test(sN))) aProblem.push(`no name "McshEngl.${sM}'${sForm}"`);
        } else if (sTitle.startsWith(sM + '.')) {
          const sForm = fFormalMvrwMain10(sTitle);
          if (!aName.some(sN => sN === sForm || sN.replace(/\.\d+_/g, '.') === sForm.replace(/\.\d+_/g, '.'))) aProblem.push(`no name "McshEngl.${sForm}"`);
        } else {
          aProblem.push(`title is not "x of ${sM}" (attribute) or "${sM}.x" (specific)`);
        }
        if (!aProblem.length) continue;
        aoIssue.push(fIssue('WARN', 'MvrwMain10', oCnptFile.sNameFile, oChild,
          `attribute: "${sTitle}" (${oChild.sNameId}) of ${oCnpt.bFile ? 'file-concept ' : ''}"${sM}": ${aProblem.join('; ')}`,
          oCnptFile.oMapIdLine.get(oChild.sNameId) ?? null));
      }
    }
  }
  return aoIssue;
}

// 🔶 [MvrwName01] formal: a-formal-name has NO space and NO hyphen; fix: "_" in their place
//   (X'a-b → X'a_b, "--" → "__"). A-formal-name has a-separator:
//   a) X'Y (attribute), b) X.Y (specific) | X:Y (generic), c) X;Y (child) | X;;Y (parent),
//   d) X/Y (part) | X//Y (whole).
//   Location: the-names of the-name::-paras (CnptFile, CnptSect) and the-titles that are formal
//   (one word, after "(…)" "{…}" are removed). A-separator inside "(…)" | "{…}" does not count
//   (attribute(')--Mcs-name-notation, {human'Bce0551..Bce0479}-Confucius); "'s" "'t" are English
//   (entity's-attribute, don't); "&#32;" is a-space, the-";" of an-entity "&#44;" is not a-separator;
//   a-link title "X ( link )" is not checked.
//   NOT: the-files of dirUcd; Unicode char | block names "char.…" "Ucbk.…" (they keep their spaces),
//   file names (…​.html …), urls.
/** OUTPUT: the-fixed formal-name: space, "&#32;", hyphen → "_", outside "(…)" and "{…}" (createMcsh uses it). */
const fFormalMvrwName01 = sIn => String(sIn ?? '').trim().split(/(\{[^}]*\}|\([^)]*\))/)
  .map((sPart, nI) => nI % 2 ? sPart : sPart.replace(/&#32;|\s+/g, '_').replace(/-/g, '_')).join('');
const fNormMvrwName01 = sIn => String(sIn ?? '').replace(/&#32;/g, ' ').replace(/&#?\w+;/g, 'x')
  .replace(/\{[^}]*\}|\([^)]*\)/g, '').replace(/[A-Za-z]'[st](?=[-_\s]|$)/g, 'x').trim();
const rSepMvrwName01 = /['.:;\/]/;
const fSkipMvrwName01 = sIn => /^(char|Ucbk)\./.test(sIn) || /\.(html|txt|json|js|mjs|md|css)$/.test(sIn) || /^(https?:|www\.)/.test(sIn);
/** OUTPUT: '' when sIn is not a-formal-name or has no space | hyphen, else the-reason. */
function fFindFormalError(sIn) {
  if (fSkipMvrwName01(sIn)) return '';
  const sNorm = fNormMvrwName01(sIn);
  if (!rSepMvrwName01.test(sNorm)) return '';
  const aBad = [/\s/.test(sNorm) && 'space', /-/.test(sNorm) && 'hyphen'].filter(Boolean);
  return aBad.length ? `has ${aBad.join(' and ')}: use "_" (${fFormalMvrwName01(sIn)})` : '';
}
function fCheckFormal(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    // NOT dirUcd: the-Unicode names keep their spaces and hyphens
    if (/(^|\/)dirUcd\//.test(String(oCnptFile.sNameIdRela ?? '').replace(/\\/g, '/'))) continue;
    // a) the-names of the-name::-paras
    const aoParaName = [
      { oCnpt: null, oPara: (oCnptFile.aoTitlePara ?? []).find(oPara => oPara.sNameTitle === 'name') },
      ...fFindCnpt(oCnptFile, 'CnptSect').map(oCnpt => ({ oCnpt, oPara: fFindParaAll(oCnpt, 'name')[0] }))
    ];
    for (const { oCnpt, oPara } of aoParaName) {
      if (!oPara?.sPara) continue;
      const nLinePara = oCnptFile.oMapIdLine.get(oPara.sNameId) ?? null;
      String(oPara.sPara).split('\n').forEach((sLine, nOffset) => {
        const aM = /<br>\*\s*(Mcsh[A-Z][a-z]{3})\.([^!,]*)/.exec(sLine);
        if (!aM) return;
        const sName = aM[2].trim(), sError = sName && fFindFormalError(sName);
        if (!sError) return;
        aoIssue.push(fIssue('WARN', 'MvrwName01', oCnptFile.sNameFile, oCnpt,
          `formal: name "${aM[1]}.${sName}" ${sError}`, nLinePara != null ? nLinePara + nOffset : null));
      });
    }
    // b) the-titles that are formal
    for (const oSect of fFindSectAll(oCnptFile)) {
      const sTitle = String(oSect.sNameTitle ?? '').trim();
      if (!sTitle || rSectLink.test(sTitle) || /\s/.test(fNormMvrwName01(sTitle))) continue;
      const sError = fFindFormalError(sTitle);
      if (!sError) continue;
      aoIssue.push(fIssue('WARN', 'MvrwName01', oCnptFile.sNameFile, oSect,
        `formal: title "${sTitle}" ${sError}`, oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
    }
  }
  return aoIssue;
}

// 🔶 [MvrwMain07] attrbase_line: the-main-names of the-attributes of a-concept are-created of
//   a-base plus text, the-Attrbase. It is-denoted in the-name::-para of the-concept with
//   "McshEngl.B!Attrbase," (B = the-main-name) or "McshEngl.B!Attrbase!⇒M," (B another name),
//   on the-3rd name-line, after "M!=I", or on the-4th, after "M!@McshXxx" of a-file-concept.
//   Warns on a-misplaced or badly-written Attrbase line (e.g. "Cmpl!Attrbase⇒Cmpr_lago").
function fCheckMainNameAttrbase(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oCnpt of [fFindCnptOfFile(oCnptFile), ...fFindCnpt(oCnptFile)]) {
      const oParaName = oCnpt.sType === 'CnptFile'
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
        if (aMsg.length) aoIssue.push(fIssue('WARN', 'MvrwMain07', oCnptFile.sNameFile, oCnpt,
          `attrbase_line: "${fStripTags(o.sLine).replace(/^\*\s*/, '')}" ${aMsg.join('; ')}`, nLine));
      });
    }
  }
  return aoIssue;
}

// 🔶 [MvrwGstr01] gnsp_then_spgn: IF generic G has specific S (a-linked item of G's "specific-tree::")
//   THEN S has G as generic: G is in S's "generic-tree::" (as G:generic or a-link to G),
//   or S is a-part-section of G (without own generic-tree), or S reaches G through its generic-chain.
//   A-concept is a-key "McshDir000000#id" ("McshDir000000#" the-file-concept);
//   a-GS-TREE means its whole, a-para means its section.
// the-GS index of the-worldview, shared by MvrwGstr01 and MvrwGstr02, built once per aoCnptFile.
const oWeakGstrIndex = new WeakMap();
function fGstrIndex(aoCnptFile) {
  if (oWeakGstrIndex.has(aoCnptFile)) return oWeakGstrIndex.get(aoCnptFile);
  const rGs = /^GENERIC-SPECIFIC-TREE of /;   // NOT "Name'GENERIC-SPECIFIC-TREE" of another concept
  const fHead = sPara => (/<br>\*\s*McshEngl\.(\S+?:generic)\b/.exec(sPara ?? '') ?? [])[1] ?? null;
  // index per file: the-CnptSect by id, the-para by id (with its section), the-top GS-TREE
  const ooFile = {};
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    const oF = { oCnptFile, ooSect: {}, ooPara: {}, sIdTopGs: null };
    for (const oCnpt of fFindCnpt(oCnptFile, 'CnptSect')) {
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
  // X:generic name → concept-key
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
      for (const aN of sLine.matchAll(/([^\s*,]+:generic)(?=[,\s]|$)/g)) if (oNameGntr[aN[1]]) oSetKey.add(oNameGntr[aN[1]]);
      for (const oR of fRefs(oG.sFile, sLine)) { const sK = fKey(oR.sFile, oR.sId); if (sK) oSetKey.add(sK); }
    }
    return (ooGeneric[sKey] = { oSetKey, oG });
  };
  // S reaches G through its generic-chain
  const fReaches = (sKeyS, sKeyG) => {
    const oSeen = new Set([sKeyS]);
    let aQueue = [sKeyS];
    for (let n = 0; n < 12 && aQueue.length; n++) {
      const aNext = [];
      for (const sK of aQueue) for (const sG of fGenerics(sK)?.oSetKey ?? []) {
        if (sG === sKeyG) return true;
        if (!oSeen.has(sG)) { oSeen.add(sG); aNext.push(sG); }
      }
      aQueue = aNext;
    }
    return false;
  };
  // S is a-part-section of G
  const fInside = (sKeyS, sKeyG) => {
    const [sFileS, sIdS] = sKeyS.split('#'), [sFileG, sIdG] = sKeyG.split('#');
    if (sFileS !== sFileG || !sIdS) return false;
    if (!sIdG) return true;
    let oS = ooFile[sFileS].ooSect[sIdS];
    while (oS && oS.sIdWhole_elmt) {
      if (oS.sIdWhole_elmt === sIdG) return true;
      oS = ooFile[sFileS].ooSect[oS.sIdWhole_elmt];
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
  // the-English names of a-concept (lower case): McshEngl names, !⇒ main-name, X of X:generic
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
    if (sHead) oSet.add(sHead.replace(/:generic$/, '').toLowerCase());
    return oSet;
  };
  const oIndex = { rGs, ooFile, fHead, fKey, fGntr, fSptr, fRefs, fItems, fTreeItems, fNames, oNameGntr, fGenerics, fReaches, fInside };
  oWeakGstrIndex.set(aoCnptFile, oIndex);
  return oIndex;
}

// 🔶 [MvrwGstr01] gnsp_then_spgn (see above fGstrIndex)
function fCheckGstrSpecificGeneric(aoCnptFile) {
  const aoIssue = [];
  const { ooFile, fHead, fKey, fGntr, fRefs, fGenerics, fReaches, fInside } = fGstrIndex(aoCnptFile);
  for (const [sFile, oF] of Object.entries(ooFile)) {
    for (const [sIdPara, oP] of Object.entries(oF.ooPara)) {
      if (oP.sNameTitle !== 'specific-tree') continue;
      const sB = sIdPara.replace(/sptr[A-Z0-9]?$/, '');
      const sKeyG = oF.ooSect[sB] ? fKey(sFile, sB) : fKey(sFile, sIdPara);
      if (!sKeyG) continue;
      const oGntrG = fGntr(sKeyG);
      const sNameG = (oGntrG && fHead(oGntrG.oP.sPara)) || sKeyG;
      const oSectG = oF.ooSect[sKeyG.split('#')[1]] ?? null;
      let bAfter = false, bWeb = false;
      for (const sLine of (oP.sPara ?? '').split('\n').map(s => s.trim())) {
        if (/^<br>===/.test(sLine)) { bAfter = true; bWeb = /address/i.test(sLine); continue; }
        if (!bAfter || bWeb || !/^<br>\*/.test(sLine)) continue;
        for (const oR of fRefs(sFile, sLine)) {
          const sKeyS = fKey(oR.sFile, oR.sId);
          if (!sKeyS || sKeyS === sKeyG) continue;
          const oGen = fGenerics(sKeyS);
          if (oGen && oGen.oSetKey.has(sKeyG)) continue;
          if (!oGen && fInside(sKeyS, sKeyG)) continue;
          if (oGen && fReaches(sKeyS, sKeyG)) continue;
          const sWhere = oGen ? `${oGen.oG.sFile}:${ooFile[oGen.oG.sFile].oCnptFile.oMapIdLine?.get(oGen.oG.oP.sNameId) ?? '?'}` : '';
          aoIssue.push(fIssue('WARN', 'MvrwGstr01', oF.oCnptFile.sNameFile, oSectG,
            oGen
              ? `gnsp_then_spgn: "${oR.sText}" is a specific of ${sNameG}, but its generic-tree:: (${sWhere}) does not list it`
              : `gnsp_then_spgn: "${oR.sText}" (${sKeyS}) is a specific of ${sNameG}, but has no generic-tree::`,
            oF.oCnptFile.oMapIdLine?.get(sIdPara) ?? null));
        }
      }
    }
  }
  return aoIssue;
}

// 🔶 [MvrwGstr02] spgn_then_gnsp: IF specific S has generic G (the-FIRST item of a-"===" group of S's
//   "generic-tree::"; the-next items of the-group are its chain) THEN G has S in its "specific-tree::"
//   (a-link to S, or a-text item = a-name of S), or S is a-part-section of G.
//   Skipped: McshEngl head, "...entity:generic", a-"=== label:" group (addressWpg, sibling-of-X: ...), entity itself,
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
        const aN = /^<br>\*\s*([^\s*,]+:generic)(?=[,\s]|$)/.exec(sLine);
        const oR = aN ? null : fRefs(sFile, sLine)[0];
        const sKeyG = aN ? oNameGntr[aN[1]] : (oR ? fKey(oR.sFile, oR.sId) : null);
        if (!sKeyG || sKeyG === sKeyS || sKeyG === 'McshCor000003#') continue;   // not a-concept, itself, entity
        if (fInside(sKeyS, sKeyG)) continue;
        const sNameG = aN ? aN[1] : (fGntr(sKeyG) && fHead(fGntr(sKeyG).oP.sPara)) || sKeyG;
        const oSp = fSptr(sKeyG);
        if (!oSp) {
          aoIssue.push(fIssue('WARN', 'MvrwGstr02', oF.oCnptFile.sNameFile, oSectS,
            `spgn_then_gnsp: "${sNameS}" has generic ${sNameG}, but ${sNameG} has no specific-tree::`,
            oF.oCnptFile.oMapIdLine?.get(sIdPara) ?? null));
          continue;
        }
        const aItem = fTreeItems(oSp.oP.sPara);
        if (aItem.some(s => fRefs(oSp.sFile, s).some(o => fKey(o.sFile, o.sId) === sKeyS))) continue;
        oNamesS ??= fNames(sKeyS);
        if (aItem.some(s => { const sT = fStripItem(s); return oNamesS.has(sT) || oNamesS.has(sT.replace(/:generic$/, '')); })) continue;
        const sWhere = `${oSp.sFile}:${ooFile[oSp.sFile].oCnptFile.oMapIdLine?.get(oSp.oP.sNameId) ?? '?'}`;
        aoIssue.push(fIssue('WARN', 'MvrwGstr02', oF.oCnptFile.sNameFile, oSectS,
          `spgn_then_gnsp: "${sNameS}" has generic ${sNameG}, but its specific-tree:: (${sWhere}) does not list it`,
          oF.oCnptFile.oMapIdLine?.get(sIdPara) ?? null));
      }
    }
  }
  return aoIssue;
}

// 🔶 [MvrwId03] space_in_id: an-id="..." or a-link href="...#..." (NOT http) has a-space
//   (any whitespace), the-browser can-not reach IT.
function fCheckIdSpace(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const [sId, nLine] of oCnptFile.oMapIdLine ?? []) {
      if (/\s/.test(sId)) aoIssue.push(fIssue('WARN', 'MvrwId03', oCnptFile.sNameFile, null,
        `space_in_id: id="${sId}" has a-space`, nLine));
    }
    for (const [sId, nLine] of oCnptFile.oMapLinkLine ?? []) {
      if (/\s/.test(sId)) aoIssue.push(fIssue('WARN', 'MvrwId03', oCnptFile.sNameFile, null,
        `space_in_id: href="#${sId}" has a-space`, nLine));
    }
  }
  return aoIssue;
}

function fRunChecksMcsh(aoCnptFile, sPathDir, bQuietIn = false, aCodeIn = []) {
  const aoAll = [];
  // bQuietIn: no progress-lines, for reportMcsh.mjs which prints its own report
  const fWrite = sIn => { if (!bQuietIn) process.stdout.write(sIn); };
  const fLog   = sIn => { if (!bQuietIn) console.log(sIn); };
  // aCodeIn: run ONLY the-checks of these rules (validatorMcsh --code); empty: all
  const aoCheck = [
    { aCode: ['MvreFile01'], sLabel: '   MvreFile01    File-Mcsh (idOverview)... ', fCheck: () => fCheckCnptFile(aoCnptFile) },
    { aCode: ['MvreName01'], sLabel: '   MvreName01    Duplicate names (every McsLago)... ', fCheck: () => fCheckDuplicateName(aoCnptFile) },
    { aCode: ['MvreName02'], sLabel: '   MvreName02    Name-line comma... ', fCheck: () => fCheckNameComma(aoCnptFile) },
    { aCode: ['MvreMain01'], sLabel: '   MvreMain01 Main-names Mmn_form... ', fCheck: () => fCheckMainNameHyphen(aoCnptFile) },
    { aCode: ['MvrwSect01', 'MvrwSect02'], sLabel: '   MvrwSect01/MvrwSect02 Section descriptions... ', fCheck: () => fCheckDescription(aoCnptFile) },
    { aCode: ['MvrwSect03', 'MvrwSect04'], sLabel: '   MvrwSect03/MvrwSect04 Section names... ', fCheck: () => fCheckName(aoCnptFile) },
    { aCode: ['MvrwMisc01'], sLabel: '   MvrwMisc01    Dates... ', fCheck: () => fCheckDate(aoCnptFile) },
    { aCode: ['MvrwId01'], sLabel: '   MvrwId01  Ids non-english-letters... ', fCheck: () => fCheckIdLetter(aoCnptFile) },
    { aCode: ['MvrwId02'], sLabel: '   MvrwId02  Ids dong_DOING_suffix... ', fCheck: () => fCheckIdDong(aoCnptFile) },
    { aCode: ['MvrwId03'], sLabel: '   MvrwId03  Ids space_in_id... ', fCheck: () => fCheckIdSpace(aoCnptFile) },
    { aCode: ['MvrwId04'], sLabel: '   MvrwId04  Ids eval_evaluation_suffix... ', fCheck: () => fCheckIdEval(aoCnptFile) },
    { aCode: ['MvrwId05'], sLabel: '   MvrwId05  Ids evog_evoluting_suffix... ', fCheck: () => fCheckIdEvog(aoCnptFile) },
    { aCode: ['MvrwId06'], sLabel: '   MvrwId06  Ids irsc_info_resource_suffix... ', fCheck: () => fCheckIdIrsc(aoCnptFile) },
    { aCode: ['MvrwId07'], sLabel: '   MvrwId07  Ids pntr_parent_tree_suffix... ', fCheck: () => fCheckIdPntr(aoCnptFile) },
    { aCode: ['MvrwId08'], sLabel: '   MvrwId08  Ids chtr_child_tree_suffix... ', fCheck: () => fCheckIdChtr(aoCnptFile) },
    { aCode: ['MvrwId09'], sLabel: '   MvrwId09  Ids wltr_whole_tree_suffix... ', fCheck: () => fCheckIdWltr(aoCnptFile) },
    { aCode: ['MvrwId10'], sLabel: '   MvrwId10  Ids prtr_part_tree_suffix... ', fCheck: () => fCheckIdPrtr(aoCnptFile) },
    { aCode: ['MvrwId11'], sLabel: '   MvrwId11  Ids gntr_generic_tree_suffix... ', fCheck: () => fCheckIdGntr(aoCnptFile) },
    { aCode: ['MvrwId12'], sLabel: '   MvrwId12  Ids sptr_specific_tree_suffix... ', fCheck: () => fCheckIdSptr(aoCnptFile) },
    { aCode: ['MvrwId13'], sLabel: '   MvrwId13  Ids srtr_structure_suffix... ', fCheck: () => fCheckIdSrtr(aoCnptFile) },
    { aCode: ['MvrwGstr01'], sLabel: '   MvrwGstr01 gnsp_then_spgn... ', fCheck: () => fCheckGstrSpecificGeneric(aoCnptFile) },
    { aCode: ['MvrwGstr02'], sLabel: '   MvrwGstr02 spgn_then_gnsp... ', fCheck: () => fCheckGstrGenericSpecific(aoCnptFile) },
    { aCode: ['MvrwMain01'], sLabel: '   MvrwMain01 Main-names Attrbase... ', fCheck: () => fCheckMainNameAttrbaseBegin(aoCnptFile) },
    { aCode: ['MvrwMain02'], sLabel: '   MvrwMain02 Main-names evolg_evoluting... ', fCheck: () => fCheckMainNameEvolg(aoCnptFile) },
    { aCode: ['MvrwMain03'], sLabel: '   MvrwMain03 Main-names evaln_evaluation, evalg_evaluating... ', fCheck: () => fCheckMainNameEvalg(aoCnptFile) },
    { aCode: ['MvrwMain04'], sLabel: '   MvrwMain04 Main-names doing_DOING... ', fCheck: () => fCheckMainNameDoing(aoCnptFile) },
    { aCode: ['MvrwMain05'], sLabel: '   MvrwMain05 Main-names infrsc_info_resource... ', fCheck: () => fCheckMainNameInfrsc(aoCnptFile) },
    { aCode: ['MvrwMain06'], sLabel: '   MvrwMain06 Main-names srtr_structure... ', fCheck: () => fCheckMainNameSrtr(aoCnptFile) },
    { aCode: ['MvrwMain07'], sLabel: '   MvrwMain07 Main-names attrbase_line... ', fCheck: () => fCheckMainNameAttrbase(aoCnptFile) },
    { aCode: ['MvrwMain08'], sLabel: '   MvrwMain08 Main-names mmn_attr... ', fCheck: () => fCheckMmnAttr(aoCnptFile) },
    { aCode: ['MvrwMain09'], sLabel: '   MvrwMain09 Main-names human_main... ', fCheck: () => fCheckMainNameHuman(aoCnptFile) },
    { aCode: ['MvrwMain10'], sLabel: '   MvrwMain10 Main-names attribute... ', fCheck: () => fCheckAttribute(aoCnptFile) },
    { aCode: ['MvrwName01'], sLabel: '   MvrwName01 Names formal... ', fCheck: () => fCheckFormal(aoCnptFile) },
  ];
  for (const oCheck of aoCheck) {
    if (aCodeIn.length && !oCheck.aCode.some(sCode => aCodeIn.includes(sCode))) continue;
    fWrite(oCheck.sLabel);
    const aoIssue = oCheck.fCheck();
    aoAll.push(...aoIssue);
    fLog(`${aoIssue.length} issues`);
  }
  return aoAll;
}

export {
  fRunChecksMcsh,
  fFormalMvrwName01,   // createMcsh.mjs fixes MvrwName01 with it
  fBuildMapName   // dupMcsh.mjs reports the-duplicate-names from this map
}
