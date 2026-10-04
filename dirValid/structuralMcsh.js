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
 * Checks (Mcsh-specific; Hitp-covered ones removed):
 *  Mcsh01  cnptFile missing idOverview section
 *  Mcsh02  cnptSect missing description::-paragraph
 *  Mcsh03  cnptSect has description:: but it is empty (only placeholder "·")
 *  Mcsh04  cnptSect missing name::-paragraph
 *  Mcsh05  cnptSect name:: has zero valid Mcsh* entries
 *  Mcsh06  cnptSect has no title
 *  Mcsh07  Duplicate name-line, in every McsLago (the-whole-line to the-comma) in the-worldview
 *  Mcsh08  evoluting:: dates not in YYYY-MM-DD format
 */

import { fStripTags } from './parserMcsh.js';

const
  aVersion = [
    'structuralMcsh.js.0-10-0.2026-10-03: fFindIdElmt removed, every cnpt has sNameId',
    'structuralMcsh.js.0-9-0.2026-10-03: Mcsh07 checks every McsLago, not only Engl',
    'structuralMcsh.js.0-8-0.2026-10-03: Mcsh07 keys the-whole-name-line',
    'structuralMcsh.js.0-7-0.2026-10-02: Mcsh07 sees cnptFile-names and duplicates',
    'structuralMcsh.js.0-6-0.2026-10-02: parserMcsh-model (ooIdRelaCnpt, aoTitlePara)',
    'structural.js.0-5-0.2026-10-01: Mcsh08 per-token, set-notation not a date',
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

// ❌ Mcsh01  cnptFile missing idOverview section
function fCheckCnptFile(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) {
      // the-file could-not be read: it has no concepts at all, we report it once.
      aoIssue.push(fIssue('ERROR', 'Mcsh00', oCnptFile.sNameFile ?? oCnptFile.sNameIdRela, null,
        `File could not be read: ${oCnptFile.sError}`));
      continue;
    }
    if (!oCnptFile.sOverview) {
      aoIssue.push(fIssue('ERROR', 'Mcsh01', oCnptFile.sNameFile, null,
        `File has no <section id="idOverview"> — cnptFile identity section is missing`));
    }
  }
  return aoIssue;
}

// ⚠️ [Mcsh02] cnptSect  has no description::-paragraph
// ⚠️ [Mcsh03] cnptSect  has an empty/placeholder description:: (only "·" or "×")
function fCheckDescription(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oSect of fFindCnpt(oCnptFile, 'cnptSect')) {
      if ((oSect.sNameTitle ?? '').indexOf('( link )') > 1) continue;
      const aoParaDesc = fFindParaAll(oSect, 'description');
      if (aoParaDesc.length === 0) {
        aoIssue.push(fIssue('WARN', 'Mcsh02', oCnptFile.sNameFile, oSect,
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
          aoIssue.push(fIssue('WARN', 'Mcsh03', oCnptFile.sNameFile, oSect,
            `cnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) has an empty/placeholder description:: (only "·" or "×")`,
            oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
        }
      }
    }
  }
  return aoIssue;
}

// ⚠️ [Mcsh04] cnptSect  has no name::-paragraph
//⚠️  [Mcsh05] cnptSect  name::-paragraph has no valid Mcsh* entries
function fCheckName(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oSect of fFindCnpt(oCnptFile, 'cnptSect')) {
      if ((oSect.sNameTitle ?? '').indexOf('( link )') > 1) continue;
      if (fFindParaAll(oSect, 'name').length === 0) {
        // This shouldn't happen (cnptSect requires names), but guard anyway
        aoIssue.push(fIssue('WARN', 'Mcsh04', oCnptFile.sNameFile, oSect,
          `cnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) has no name::-paragraph`,
          oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
      } else if (fCountName(oSect) === 0) {
        aoIssue.push(fIssue('WARN', 'Mcsh05', oCnptFile.sNameFile, oSect,
          `cnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) name::-paragraph has no valid Mcsh* entries`,
          oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
      }
    }
  }
  return aoIssue;
}

// ⚠️  [Mcsh06] cnptSect  has no TITLE
function fCheckTitle(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (oCnptFile.sError) continue;
    for (const oSect of fFindCnpt(oCnptFile, 'cnptSect')) {
      if (!oSect.sNameTitle || oSect.sNameTitle.trim() === '') {
        aoIssue.push(fIssue('WARN', 'Mcsh06', oCnptFile.sNameFile, oSect,
          `cnptSect (${oSect.sNameId}) has no TITLE`,
          oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
      }
    }
  }
  return aoIssue;
}

// ❌ [Mcsh07] Duplicated names:
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
      aoIssue.push(fIssue('ERROR', 'Mcsh07', oOcc.sNameFile, null,
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

// ⚠️ [Mcsh08] DATE "{2022-4-27}" has NO {YYYY-MM-DD} format, judged per {token}, not per line
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
            aoIssue.push(fIssue('WARN', 'Mcsh08', oCnptFile.sNameFile, oSect,
              `DATE "${sTok}" has NO {YYYY-MM-DD} format in line: "${sLine.trim()}" in file: "${oCnptFile.sNameFile}"`,
              oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
          }
        }
      }
    }
  }
  return aoIssue;
}

function fRunChecksMcsh(aoCnptFile, sPathDir) {
  const aoAll = [];

  process.stdout.write('   Mcsh01    File-Mcsh (idOverview)... ');
  const aoFileMcs = fCheckCnptFile(aoCnptFile);
  aoAll.push(...aoFileMcs);
  console.log(`${aoFileMcs.length} issues`);

  process.stdout.write('   Mcsh02/Mcsh03 Section descriptions... ');
  const aoDesc = fCheckDescription(aoCnptFile);
  aoAll.push(...aoDesc);
  console.log(`${aoDesc.length} issues`);

  process.stdout.write('   Mcsh04/Mcsh05 Section names... ');
  const aoName = fCheckName(aoCnptFile);
  aoAll.push(...aoName);
  console.log(`${aoName.length} issues`);

  process.stdout.write('   Mcsh06    Section title... ');
  const aoTitle = fCheckTitle(aoCnptFile);
  aoAll.push(...aoTitle);
  console.log(`${aoTitle.length} issues`);

  process.stdout.write('   Mcsh07    Duplicate names (every McsLago)... ');
  const aoDup = fCheckDuplicateName(aoCnptFile);
  aoAll.push(...aoDup);
  console.log(`${aoDup.length} issues`);

  process.stdout.write('   Mcsh08    Dates... ');
  const aoDate = fCheckDate(aoCnptFile);
  aoAll.push(...aoDate);
  console.log(`${aoDate.length} issues`);

  return aoAll;
}

export {
  fRunChecksMcsh,
  fBuildMapName   // dupMcsh.mjs reports the-duplicate-names from this map
}
