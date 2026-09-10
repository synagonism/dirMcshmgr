/**
 * structural.js
 * Mcs-concept consistency checks — fast, no AI needed.
 * Runs only on Mcs files; generic-Hitp structure (version, links, anchors, ids,
 * tag pairs…) is validated separately by structuralHitp.js (H-codes).
 *
 * Uses the data model from parser.js:
 *   oFile → { sType, sPathFile, sNameFile, oSectOverview, aoCnptSect, aoPara,
 *             oSetId, aLinks, oMapIdLine, oMapLinkLine, nLineTitle }
 *   oSect → { sType, sNameId, sIdWhole_elmt, sNameTitle, nHeadingLevel, nDepth,
 *             aoPara, oParaByTitle, aName, aoName, aLinks }
 *   oPara → { sType, sNameId, sNameTitle, sText, aoName, aName, aLinks }
 *
 * Checks (Mcs-specific; Hitp-covered ones removed):
 *  M01  cnptFile missing idOverview section
 *  M02  cnptSect missing description:: paragraph
 *  M03  cnptSect has description:: but it is empty (only placeholder "·")
 *  M04  cnptSect missing name:: paragraph
 *  M05  cnptSect name:: has zero valid Mcs* entries
 *  M06  Duplicate McsEngl sName across entire knowledge base
 *  M10  evoluting:: dates not in YYYY-MM-DD format
 *  M12  cnptSect has no heading
 * (former S07 file-link → Hitp H08, S08 anchor → Hitp H07, S09 version → Hitp H01)
 */

const
  aVersion = [
    'structural.js.0-4-0.2026-09-05: Mcs-only (S→M), Hitp checks removed',
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
function fBuildMapName(aoFile) {
  const oMap = new Map();
  for (const oFile of aoFile) {
    // cnptSect names
    for (const oSect of oFile.aoCnptSect) {
      for (const oName of oSect.aoName) {
        if (oName.sLago !== 'lagEngl') continue; // only check McsEngl for duplicates
        if (!oMap.has(oName.sName)) oMap.set(oName.sName, []);
        oMap.get(oName.sName).push({ sNameFile: oFile.sNameFile, sNameId: oSect.sNameId, sTitle: oSect.sNameTitle });
      }
    }
    // paragraph-Mcs names
    for (const oPara of oFile.aoPara) {
      if (oPara.sNameTitle !== 'name') {
        for (const oName of oPara.aoName) {
          if (oName.sLago !== 'lagEngl') continue;
          if (!oMap.has(oName.sName)) oMap.set(oName.sName, []);
          oMap.get(oName.sName).push({ sNameFile: oFile.sNameFile, sNameId: oPara.sNameId, sTitle: oPara.sNameTitle });
        }
      }
    }
  }
  return oMap;
}

// ─── individual checks ────────────────────────────────────────────────────────

// ❌ M01  cnptFile missing idOverview section
function fCheckCnptFile(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    if (!oFile.oSectOverview) {
      aoIssue.push(fIssue('ERROR', 'M01', oFile.sNameFile, null,
        `File has no <section id="idOverview"> — cnptFile identity section is missing`));
    }
  }
  return aoIssue;
}

// ⚠️ [M02] cnptSect  has no description:: paragraph
// ⚠️ [M03] cnptSect  has an empty/placeholder description:: (only "·" or "×")
function fCheckDescription(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    for (const oSect of oFile.aoCnptSect) {
      if (oSect.sNameTitle.indexOf('( link )') > 1) continue;
      const aoParaDesc = oSect.oParaByTitle['description'] ?? [];
      if (aoParaDesc.length === 0) {
        aoIssue.push(fIssue('WARN', 'M02', oFile.sNameFile, oSect,
          `cnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) has no description:: paragraph`,
          oFile.oMapIdLine.get(oSect.sNameId) ?? null));
        continue;
      }
      // Check for empty/placeholder description (just "·" or whitespace)
      for (const oPara of aoParaDesc) {
        const sContent = oPara.sText
          .replace(/^description::\s*/i, '')
          .replace(/[·\s×]/g, '')
          .trim();
        if (sContent.length === 0) {
          aoIssue.push(fIssue('WARN', 'M03', oFile.sNameFile, oSect,
            `cnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) has an empty/placeholder description:: (only "·" or "×")`,
            oFile.oMapIdLine.get(oPara.sNameId) ?? oFile.oMapIdLine.get(oSect.sNameId) ?? null));
        }
      }
    }
  }
  return aoIssue;
}

// ⚠️ [M04] cnptSect  has no name:: paragraph
//⚠️  [M05] cnptSect  name:: paragraph has no valid Mcs* entries
function fCheckName(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    for (const oSect of oFile.aoCnptSect) {
      if (oSect.sNameTitle.indexOf('( link )') > 1) continue;
      if (!oSect.oParaByTitle['name']) {
        // This shouldn't happen (cnptSect requires names), but guard anyway
        aoIssue.push(fIssue('WARN', 'M04', oFile.sNameFile, oSect,
          `cnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) has no name:: paragraph`,
          oFile.oMapIdLine.get(oSect.sNameId) ?? null));
      } else if (oSect.aName.length === 0) {
        aoIssue.push(fIssue('WARN', 'M05', oFile.sNameFile, oSect,
          `cnptSect "${oSect.sNameTitle}" (${oSect.sNameId}) name:: paragraph has no valid Mcs* entries`,
          oFile.oMapIdLine.get(oSect.sNameId) ?? null));
      }
    }
  }
  return aoIssue;
}

// ⚠️  [M12] cnptSect  has no TITLE
function fCheckTitle(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    for (const oSect of oFile.aoCnptSect) {
      if (!oSect.sNameTitle || oSect.sNameTitle.trim() === '') {
        aoIssue.push(fIssue('WARN', 'M12', oFile.sNameFile, oSect,
          `cnptSect (${oSect.sNameId}) has no TITLE`,
          oFile.oMapIdLine.get(oSect.sNameId) ?? null));
      }
    }
  }
  return aoIssue;
}

// ❌ [M06] Duplicate McsEngl-name "exmlMcsh" appears in: McshCorTest.last.html#idName, McshCorTest.last.html#idName
function fCheckDuplicateName(aoFile) {
  const aoIssue = [];
  const oMapName = fBuildMapName(aoFile);
  const oMapFileByName = new Map(aoFile.map(oFile => [oFile.sNameFile, oFile]));
  for (const [sName, aoOccur] of oMapName) {
    if (aoOccur.length > 1) {
      const sLoc = aoOccur.map(oOccur => `${oOccur.sNameFile}#${oOccur.sNameId}`).join(', ');
      // Report once per duplicate group, at the second occurrence's line
      const oOcc = aoOccur[1];
      const nLine = oMapFileByName.get(oOcc.sNameFile)?.oMapIdLine.get(oOcc.sNameId) ?? null;
      aoIssue.push(fIssue('ERROR', 'M06', oOcc.sNameFile, null,
        `Duplicate McsEngl-name "${sName}" appears in: ${sLoc}`, nLine));
    }
  }
  return aoIssue;
}

// ⚠️ [M10] DATE has NO {YYYY-MM-DD} format in line: "· {2022-4-27} evoluting ..."
// in file: "McshCorTest.last.html"
function fCheckDate(aoFile) {
  const aoIssue = [];
  const rDate1 = /\{\d{4}-\d{2}-\d{2}\}/;
  const rDate2 = /\{\d{4}-\d{2}\}/;
  const rDate3 = /\{\d{4}\}/;
  for (const oFile of aoFile) {
    for (const oSect of oFile.aoCnptSect) {
      for (const oPara of oSect.aoPara) {
        for (const sLine of oPara.sText.split('\n')) {
          // contains {d-} not Tex not goodDates
          if (/\{[\d-]+\}/.test(sLine) && !/\\\(\s*(.*?)\s*\\\)/.test(sLine) &&
             !rDate1.test(sLine) && !rDate2.test(sLine) && !rDate3.test(sLine)) {
            aoIssue.push(fIssue('WARN', 'M10', oFile.sNameFile, oSect,
              `DATE has NO {YYYY-MM-DD} format in line: "${sLine.trim()}" in file: "${oFile.sNameFile}"`,
              oFile.oMapIdLine.get(oPara.sNameId) ?? oFile.oMapIdLine.get(oSect.sNameId) ?? null));
          }
        }
      }
    }
  }
  return aoIssue;
}

// ─── main export ──────────────────────────────────────────────────────────────

export function fRunChecksStructural(aoFile, sPathDir) {
  const aoAll = [];

  process.stdout.write('   M01    File-Mcs (idOverview)... ');
  const aoFileMcs = fCheckCnptFile(aoFile);
  aoAll.push(...aoFileMcs);
  console.log(`${aoFileMcs.length} issues`);

  process.stdout.write('   M02/M03 Section descriptions... ');
  const aoDesc = fCheckDescription(aoFile);
  aoAll.push(...aoDesc);
  console.log(`${aoDesc.length} issues`);

  process.stdout.write('   M04/M05 Section names... ');
  const aoName = fCheckName(aoFile);
  aoAll.push(...aoName);
  console.log(`${aoName.length} issues`);

  process.stdout.write('   M12    Section headings... ');
  const aoTitle = fCheckTitle(aoFile);
  aoAll.push(...aoTitle);
  console.log(`${aoTitle.length} issues`);

  process.stdout.write('   M06    Duplicate McsEngl names... ');
  const aoDup = fCheckDuplicateName(aoFile);
  aoAll.push(...aoDup);
  console.log(`${aoDup.length} issues`);

  process.stdout.write('   M10    Evoluting dates... ');
  const aoDate = fCheckDate(aoFile);
  aoAll.push(...aoDate);
  console.log(`${aoDate.length} issues`);

  return aoAll;
}
