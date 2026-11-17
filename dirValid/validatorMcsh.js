#!/usr/bin/env node
/**
 * Mcsh/Hitp Consistency Checker
 * Checks dirMcsh-worldview for structural and content issues.
 *
 * Every file is validated as generic Hitp (H01–H11).
 * Files whose name starts with "Mcsh" additionally get the Mcsh concept checks (M01–M12) and,
 * with --ai, the DeepSeek semantic checks (M01–M04).
 *
 * Usage:
 *   node validator.js <dirMcsh-path>          # fast structural checks only
 *   node validator.js <dirMcsh-path> --file McsXxx000001.last.html  # single file
 *   node validator.js <dirMcsh-path> --ai     # + DeepSeek AI semantic checks (Mcsh)
 *   node validator.js <dirMcsh-path> --file McsXxx000001.last.html --code MvreName01_duplicate_line[,Hvrw07]
 *                                             # the-report keeps ONLY these rules
 *   node validator.js <dirMcsh-path> --file McsXxx000001.last.html --id idX
 *                                             # ONLY concept idX: its section | paragraph (conceptRange.js)
 */

import { fReadFileHitp, fReadFileAllHitp, fReadFileHitpIdOnly, fReadFileAllHitpIdOnly,
  fReadFileHitpPathOnly, fReadFileAllHitpPathOnly } from './parserHitp.js';
import { fRunChecksHitp } from './structuralHitp.js';
import { fReadFileMcsh } from './parserMcsh.js';
import { fRunChecksMcsh, fCodeFull } from './structuralMcsh.js';
import { fRunChecksAi } from './ai-checks.js';
import { fReporter } from './reporter.js';
import { fReadListValidate } from './listValidate.js';
import { fFindConceptRange } from './conceptRange.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const sDirScript = path.dirname(fileURLToPath(import.meta.url));

const
  aVersion = [
    'validatorMcsh.js.0-12-0.2026-11-17: --id: the-log counts (terminal and report) only the-concept\'s issues',
    'validatorMcsh.js.0-11-0.2026-11-17: --id idX with --file: only the-issues of concept idX (its section | paragraph, conceptRange.js)',
    'validatorMcsh.js.0-10-0.2026-11-16: --code MvrwId13 = MvrwId13_suffix_srtr (fCodeFull); the-log reads the-codes with their name',
    'validatorMcsh.js.0-9-0.2026-11-04: --code with Mcsh rules alone does NOT parse the-files as Hitp (fReadFileHitpPathOnly)',
    'validatorMcsh.js.0-8-0.2026-11-04: --code Hvre01 alone reads only the-ids (fReadFileHitpIdOnly), ~5 s for the-worldview, not ~24 s',
    'validatorMcsh.js.0-7-0.2026-11-04: --code runs ONLY the-checks of its rules; a-Hitp rule does not read the-Mcsh files',
    'validatorMcsh.js.0-6-0.2026-11-04: --code, the-report keeps only the-given rules',
    'validatorMcsh.js.0-5-0.2026-11-01: the-report shows the-rules used, as the-terminal',
    'validator.js.0-4-0.2026-09-05: merge Hitp+Mcsh',
    'validator.js.0-3-0.2026-09-04: naming convention',
    'validator.js.0-2-0.2026-04-27: working structural',
    'validator.js.0-1-0.2026-04-24: creation'
  ],
  aArg = process.argv.slice(2);

if (aArg.length === 0) {
  console.error('Usage: node validator <sNameDir> <sNameIdRela> [--ai] [--code MvreName01_duplicate_line[,Hvrw07]] [--list dirManager/validate.txt] [--id idX]');
  process.exit(1);
}

const bUseAi       = aArg.includes('--ai');
const nIdxCode     = aArg.indexOf('--code');
// the-rules to report; empty: all
const aCode        = nIdxCode === -1 ? []
  : String(aArg[nIdxCode + 1] ?? '').split(',').map(sCode => sCode.trim()).filter(Boolean).map(fCodeFull);
// --list dirManager/validate.txt: the-files and dirs of that list only (listValidate.js)
const nIdxList     = aArg.indexOf('--list');
const sPathList    = nIdxList === -1 ? '' : String(aArg[nIdxList + 1] ?? '');
// --id idX (with a-file): only the-issues of concept idX, its section | paragraph (conceptRange.js)
const nIdxId       = aArg.indexOf('--id');
const sIdConcept   = nIdxId === -1 ? '' : String(aArg[nIdxId + 1] ?? '').replace(/^#/, '');
const aArgPath     = aArg.filter((sArg, nI) => !sArg.startsWith('--') &&
  (nIdxCode === -1 || nI !== nIdxCode + 1) && (nIdxList === -1 || nI !== nIdxList + 1) &&
  (nIdxId === -1 || nI !== nIdxId + 1));
const sNameDir     = aArgPath[0];
const sNameIdRela  = aArgPath[1] ? aArgPath[1] : null;

if (!fs.existsSync(sNameDir)) {
  console.error(`Directory not found: ${sNameDir}`);
  process.exit(1);
}

const oReporter = fReporter();

// with --id: the-lines and ids of the-concept, null = the-whole file (no --id, idOverview, an-unknown id)
let oRangeConcept = null;
const fInConcept = oIssue => oRangeConcept === null ||
  (oIssue.nLine != null ? oIssue.nLine >= oRangeConcept.nLineFrom && oIssue.nLine <= oRangeConcept.nLineTo
    : oRangeConcept.oSetId.has(oIssue.sIdConcept));

// with --code: only the-issues of these rules; with --id: only those of the-concept;
//   the-kept ones counted per rule for the-log
const oCountCode = {};
const fKeepCode = aoIssueIn => {
  const aoKeep = aoIssueIn.filter(fInConcept)
    .filter(oIssue => aCode.length === 0 || aCode.includes(oIssue.sCode));
  for (const oIssue of aoKeep) oCountCode[oIssue.sCode] = (oCountCode[oIssue.sCode] ?? 0) + 1;
  return aoKeep;
};

/**
 * DOING: with --code, the-log of the-report keeps only the-lines of these rules;
 *   with --id (a-concept, not the-whole file), every line keeps, counting only the-concept's issues.
 *   A-checker line "   Hvre06/Hvre05 Links & anchors... 3 issues" counts 2 rules:
 *   it becomes "   Hvre05 Links & anchors... 1 issues", with the-count of Hvre05 only.
 *   A-"🔍 Running .. checks" line stays only above a-kept line.
 */
function fLogOfCode(sLogIn) {
  if (aCode.length === 0 && oRangeConcept === null) return sLogIn;
  const aOut = [];
  let sHead = null;
  for (const sLine of sLogIn.split('\n')) {
    if (/^\s*🔍 Running/.test(sLine)) { sHead = sLine; continue; }
    // a-code is "MvrwId13_suffix_srtr" (Mcsh, with its name) or "Hvre06" (Hitp)
    const aRule = sLine.match(/^(\s+)((?:Mvr|Hvr)[A-Za-z]*\d+(?:_\w+)?(?:\/(?:Mvr|Hvr)[A-Za-z]*\d+(?:_\w+)?)*)(\s+.*?)\d+ issues\s*$/);
    if (!aRule) { if (!/^\s+(Mvr|Hvr)/.test(sLine)) aOut.push(sLine); continue; }
    const aCodeLine = aRule[2].split('/').filter(sCode => aCode.length === 0 || aCode.includes(sCode));
    if (aCodeLine.length === 0) continue;
    if (sHead !== null) { aOut.push(sHead); sHead = null; }
    const nCount = aCodeLine.reduce((nSum, sCode) => nSum + (oCountCode[sCode] ?? 0), 0);
    aOut.push(`${aRule[1]}${aCodeLine.join('/')}${aRule[3]}${nCount} issues`);
  }
  return aOut.join('\n').replace(/\n{3,}/g, '\n\n');
}

async function fMain() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Mcsh/Hitp Consistency Checker');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── what the-run prints, also goes to the-HTML report: the-rules used ─────
  let sLog = '';
  // with --id: the-checks' lines are held and printed at the-end with the-concept's counts
  let bEcho = true;
  let nLogHeld = 0;
  const fWriteOut = process.stdout.write;
  process.stdout.write = function (sChunk, ...aRest) {
    sLog += String(sChunk);
    return bEcho ? fWriteOut.call(process.stdout, sChunk, ...aRest) : true;
  };

  // with --code ONLY the-checks of these rules run: Hvr.. are Hitp-checks, Mvr.. Mcsh-checks
  const bCheckHitp = aCode.length === 0 || aCode.some(sCode => sCode.startsWith('H'));
  const bCheckMcsh = aCode.length === 0 || aCode.some(sCode => sCode.startsWith('M')) || bUseAi;

  // ── parse every file as generic Hitp ──────────────────────────────────────
  // the-read is as light as the-rules allow:
  //   Mcsh rules alone: NO Hitp read, parserMcsh reads the-Mcsh files (the-paths only)
  //   Hvre01 alone: only the-ids of the-files
  //   else: the-full Hitp parse
  const bPathOnly = !bCheckHitp;
  const bIdOnly = aCode.length > 0 && aCode.every(sCode => sCode === 'Hvre01') && !bUseAi;
  const fReadOne = bPathOnly ? fReadFileHitpPathOnly : bIdOnly ? fReadFileHitpIdOnly : fReadFileHitp;
  const fReadAll = bPathOnly ? fReadFileAllHitpPathOnly : bIdOnly ? fReadFileAllHitpIdOnly : fReadFileAllHitp;
  let aoFileHitp;
  if (sPathList) {
    const sPathListAbs = path.isAbsolute(sPathList) ? sPathList : path.join(sNameDir, sPathList);
    const { aPathFile, aEntry, aMissing } = fReadListValidate(sNameDir, sPathListAbs);
    console.log(`📋 List: ${sPathList} (${aEntry.length} entries)`);
    if (aCode.length) console.log(`🔎 Rule: ${aCode.join(', ')}`);
    for (const sMissing of aMissing) console.log(`   ⚠️  not found: ${sMissing}`);
    aoFileHitp = aPathFile.map(sPath => fReadOne(sPath));
    console.log(`   Found ${aoFileHitp.length} .last.html files\n`);
  } else if (sNameIdRela) {
    const sPathFile = path.isAbsolute(sNameIdRela) ? sNameIdRela : path.join(sNameDir, sNameIdRela);
    console.log(`📄 Single-file mode: ${sNameIdRela}`);
    if (aCode.length) console.log(`🔎 Rule: ${aCode.join(', ')}`);
    if (sIdConcept) {
      oRangeConcept = fFindConceptRange(fs.readFileSync(sPathFile, 'utf8'), sIdConcept);
      console.log(oRangeConcept
        ? `🎯 Concept: #${sIdConcept} (lines ${oRangeConcept.nLineFrom}-${oRangeConcept.nLineTo})`
        : `🎯 Concept: #${sIdConcept} = the whole file`);
      if (oRangeConcept !== null) { bEcho = false; nLogHeld = sLog.length; }
    }
    aoFileHitp = [fReadOne(sPathFile)];
  } else {
    console.log(`📂 Scanning: ${sNameDir}`);
    if (aCode.length) console.log(`🔎 Rule: ${aCode.join(', ')}`);
    aoFileHitp = fReadAll(sNameDir);
    console.log(`   Found ${aoFileHitp.length} .last.html files\n`);
  }

  // ── 1. Hitp checks (every file) ────────────────────────────────────────────
  if (bCheckHitp) {
    console.log('🔍 Running Hitp checks...');
    oReporter.fAddAll(fKeepCode(fRunChecksHitp(aoFileHitp, sNameDir, false, aCode)));
  }

  // ── 2. Mcsh checks (files named Mcsh* only) ─────────────────────────────────
  // fReadFileMcsh(sNameDir, sNameIdRela) is async: await them all, and give it
  // the-worldview-relative-id, NOT the-full-path. A-Hitp rule alone does not read them (the-slow part).
  const aoFileMcsh = !bCheckMcsh ? [] : await Promise.all(
    aoFileHitp
      .filter(oFile => oFile.sNameFile.startsWith('Mcsh'))
      .map(oFile => fReadFileMcsh(sNameDir, path.relative(sNameDir, oFile.sPathFile))));
  if (bCheckMcsh) {
    console.log(`\n🔍 Running Mcsh checks (${aoFileMcsh.length} Mcsh files)...`);
    oReporter.fAddAll(fKeepCode(fRunChecksMcsh(aoFileMcsh, sNameDir, false, aCode)));
  }

  // ── 3. AI semantic checks (Mcsh files, requires DeepSeek API key) ──────────
  if (bUseAi) {
    console.log('\n🤖 Running AI semantic checks via DeepSeek...');
    oReporter.fAddAll(fKeepCode(await fRunChecksAi(aoFileMcsh)));
  }

  process.stdout.write = fWriteOut;   // the-results are in the-report's table
  if (!bEcho) process.stdout.write(fLogOfCode(sLog.slice(nLogHeld)) + '\n');
  oReporter.fPrint();

  // ── save the HTML report next to this script (dirMcshmgr/dirValid), ────────
  //    independent of the caller's cwd. Opening it in VS Code's integrated
  //    Simple Browser is handled by the mcs-open-local-server extension
  //    (command "mcs.validateAndReport"), which runs this validator and then
  //    serves + shows the report when errors/warnings are found.
  const sPathReport = path.join(sDirScript, 'validator-report.html');
  oReporter.fSaveHtml(sPathReport, fLogOfCode(sLog));
}

fMain().catch(oErr => {
  console.error('\n❌ Fatal error:', oErr.message);
  process.exit(1);
});
