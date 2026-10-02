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
 *             aoPara, oParaByTitle, aName, aoName, aLinks }
 *   oPara → { sType, sNameId, sNameTitle, sText, aoName, aName, aLinks }
 *
 * Checks (Mcsh-specific; Hitp-covered ones removed):
 *  M01  cnptFile missing idOverview section
 *  M02  cnptSect missing description:: paragraph
 *  M03  cnptSect has description:: but it is empty (only placeholder "·")
 *  M04  cnptSect missing name:: paragraph
 *  M05  cnptSect name:: has zero valid Mcsh* entries
 *  M06  cnptSect has no title
 *  M07  Duplicate McshEngl sName across entire worldview
 *  M08  evoluting:: dates not in YYYY-MM-DD format
 */

const
  aVersion = [
    'structural.js.0-5-0.2026-10-01: M08 per-token, set-notation not a date',
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

/** Build a map: sName → [{ sNameFile, sNameId, sTitle }] for duplicate detection */
function fBuildMapName(aoCnptFile) {
  const oMap = new Map();
  for (const oCnptFile of aoCnptFile) {
    // cnptSect names
    for (const oSect of oCnptFile.aoCnptSect) {
      for (const oName of oSect.aoName) {
        if (oName.sLago !== 'lagEngl') continue; // only check McshEngl for duplicates
        if (!oMap.has(oName.sName)) oMap.set(oName.sName, []);
        oMap.get(oName.sName).push({ sNameFile: oCnptFile.sNameFile, sNameId: oSect.sNameId, sTitle: oSect.sNameTitle });
      }
    }
    // paragraph-Mcsh names
    for (const oPara of oCnptFile.aoPara) {
      if (oPara.sNameTitle !== 'name') {
        for (const oName of oPara.aoName) {
          if (oName.sLago !== 'lagEngl') continue;
          if (!oMap.has(oName.sName)) oMap.set(oName.sName, []);
          oMap.get(oName.sName).push({ sNameFile: oCnptFile.sNameFile, sNameId: oPara.sNameId, sTitle: oPara.sNameTitle });
        }
      }
    }
  }
  return oMap;
}

// ─── individual checks ────────────────────────────────────────────────────────

// ❌ M01  cnptFile missing idOverview section
function fCheckCnptFile(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    if (!oCnptFile.sOverview) {
      aoIssue.push(fIssue('ERROR', 'M01', oCnptFile.sNameFile, null,
        `File has no <section id="idOverview"> — cnptFile identity section is missing`));
    }
  }
  return aoIssue;
}

// ⚠️ [M02] cnptSect  has no description:: paragraph
// ⚠️ [M03] cnptSect  has an empty/placeholder description:: (only "·" or "×")
function fCheckDescription(aoCnptFile) {
  const aoIssue = [];
  const oSect = {}
  for (const oCnptFile of aoCnptFile) {
    for (const [sIdCnpt, oCnpt] of Object.entries(oCnptFile.ooIdRelaCnpt)) {
      if (oCnpt.sType === 'cnptSect') oSect = oCnpt; else continue;
      if (oSect.sNameTitle.indexOf('( link )') > 1) continue;
      const aoParaDesc = oSect.oParaByTitle['description'] ?? [];
      if (aoParaDesc.length === 0) {
        aoIssue.push(fIssue('WARN', 'M02', oCnptFile.sNameFile, oSect,
          `cnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) has no description:: paragraph`,
          oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
        continue;
      }
      // Check for empty/placeholder description (just "·" or whitespace)
      for (const oPara of aoParaDesc) {
        const sContent = oPara.sText
          .replace(/^description::\s*/i, '')
          .replace(/[·\s×]/g, '')
          .trim();
        if (sContent.length === 0) {
          aoIssue.push(fIssue('WARN', 'M03', oCnptFile.sNameFile, oSect,
            `cnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) has an empty/placeholder description:: (only "·" or "×")`,
            oCnptFile.oMapIdLine.get(oPara.sNameId) ?? oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
        }
      }
    }
  }
  return aoIssue;
}

// ⚠️ [M04] cnptSect  has no name:: paragraph
//⚠️  [M05] cnptSect  name:: paragraph has no valid Mcsh* entries
function fCheckName(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    for (const oSect of oCnptFile.aoCnptSect) {
      if (oSect.sNameTitle.indexOf('( link )') > 1) continue;
      if (!oSect.oParaByTitle['name']) {
        // This shouldn't happen (cnptSect requires names), but guard anyway
        aoIssue.push(fIssue('WARN', 'M04', oCnptFile.sNameFile, oSect,
          `cnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) has no name:: paragraph`,
          oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
      } else if (oSect.aName.length === 0) {
        aoIssue.push(fIssue('WARN', 'M05', oCnptFile.sNameFile, oSect,
          `cnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) name:: paragraph has no valid Mcsh* entries`,
          oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
      }
    }
  }
  return aoIssue;
}

// ⚠️  [M06] cnptSect  has no TITLE
function fCheckTitle(aoCnptFile) {
  const aoIssue = [];
  for (const oCnptFile of aoCnptFile) {
    for (const oSect of oCnptFile.aoCnptSect) {
      if (!oSect.sNameTitle || oSect.sNameTitle.trim() === '') {
        aoIssue.push(fIssue('WARN', 'M06', oCnptFile.sNameFile, oSect,
          `cnptSect (${oSect.sNameId}) has no TITLE`,
          oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
      }
    }
  }
  return aoIssue;
}

// ❌ [M07] Duplicate McshEngl-name "exmlMcsh" appears in: McshCorTest.last.html#idName, McshCorTest.last.html#idName
function fCheckDuplicateName(aoCnptFile) {
  const aoIssue = [];
  const oMapName = fBuildMapName(aoCnptFile);
  const oMapFileByName = new Map(aoCnptFile.map(oCnptFile => [oCnptFile.sNameFile, oCnptFile]));
  for (const [sName, aoOccur] of oMapName) {
    if (aoOccur.length > 1) {
      const sLoc = aoOccur.map(oOccur => `${oOccur.sNameFile}#${oOccur.sNameId}`).join(', ');
      // Report once per duplicate group, at the second occurrence's line
      const oOcc = aoOccur[1];
      const nLine = oMapFileByName.get(oOcc.sNameFile)?.oMapIdLine.get(oOcc.sNameId) ?? null;
      aoIssue.push(fIssue('ERROR', 'M07', oOcc.sNameFile, null,
        `Duplicate McshEngl-name "${sName}" appears in: ${sLoc}`, nLine));
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

// ⚠️ [M08] DATE "{2022-4-27}" has NO {YYYY-MM-DD} format, judged per {token}, not per line
function fCheckDate(aoCnptFile) {
  const aoIssue = [];
  const rDateGood = /^\{\d{4}(?:-\d{2}(?:-\d{2})?)?\}$/;
  const rTex      = /\\\([\s\S]*?\\\)/g;   // inline-TeX spans hold math, never dates
  const rBrace    = /\{[^{}]*\}/g;
  for (const oCnptFile of aoCnptFile) {
    for (const oSect of oCnptFile.aoCnptSect) {
      for (const oPara of oSect.aoPara) {
        for (const sLine of oPara.sText.split('\n')) {
          const oSetTokBad = new Set();       // one issue per distinct token on the line
          for (const [sTok] of sLine.replace(rTex, ' ').matchAll(rBrace)) {
            if (fIsDateCandidate(sTok) && !rDateGood.test(sTok)) oSetTokBad.add(sTok);
          }
          for (const sTok of oSetTokBad) {
            aoIssue.push(fIssue('WARN', 'M08', oCnptFile.sNameFile, oSect,
              `DATE "${sTok}" has NO {YYYY-MM-DD} format in line: "${sLine.trim()}" in file: "${oCnptFile.sNameFile}"`,
              oCnptFile.oMapIdLine.get(oPara.sNameId) ?? oCnptFile.oMapIdLine.get(oSect.sNameId) ?? null));
          }
        }
      }
    }
  }
  return aoIssue;
}

function fRunChecksMcsh(aoCnptFile, sPathDir) {
  const aoAll = [];

  process.stdout.write('   M01    File-Mcsh (idOverview)... ');
  const aoFileMcs = fCheckCnptFile(aoCnptFile);
  aoAll.push(...aoFileMcs);
  console.log(`${aoFileMcs.length} issues`);

  process.stdout.write('   M02/M03 Section descriptions... ');
  const aoDesc = fCheckDescription(aoCnptFile);
  aoAll.push(...aoDesc);
  console.log(`${aoDesc.length} issues`);

  process.stdout.write('   M04/M05 Section names... ');
  const aoName = fCheckName(aoCnptFile);
  aoAll.push(...aoName);
  console.log(`${aoName.length} issues`);

  process.stdout.write('   M06    Section title... ');
  const aoTitle = fCheckTitle(aoCnptFile);
  aoAll.push(...aoTitle);
  console.log(`${aoTitle.length} issues`);

  process.stdout.write('   M07    Duplicate McshEngl names... ');
  const aoDup = fCheckDuplicateName(aoCnptFile);
  aoAll.push(...aoDup);
  console.log(`${aoDup.length} issues`);

  process.stdout.write('   M08    Evoluting dates... ');
  const aoDate = fCheckDate(aoCnptFile);
  aoAll.push(...aoDate);
  console.log(`${aoDate.length} issues`);

  return aoAll;
}

export {
  fRunChecksMcsh
}
