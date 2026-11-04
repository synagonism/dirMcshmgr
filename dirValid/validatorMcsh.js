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
 *   node validator.js <dirMcsh-path> --file McsXxx000001.last.html --code MvreName01[,Hvrw07]
 *                                             # the-report keeps ONLY these rules
 */

import { fReadFileHitp, fReadFileAllHitp } from './parserHitp.js';
import { fRunChecksHitp } from './structuralHitp.js';
import { fReadFileMcsh } from './parserMcsh.js';
import { fRunChecksMcsh } from './structuralMcsh.js';
import { fRunChecksAi } from './ai-checks.js';
import { fReporter } from './reporter.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const sDirScript = path.dirname(fileURLToPath(import.meta.url));

const
  aVersion = [
    'validatorMcsh.js.0-6-0.2026-11-04: --code, the-report keeps only the-given rules',
    'validatorMcsh.js.0-5-0.2026-11-01: the-report shows the-rules used, as the-terminal',
    'validator.js.0-4-0.2026-09-05: merge Hitp+Mcsh',
    'validator.js.0-3-0.2026-09-04: naming convention',
    'validator.js.0-2-0.2026-04-27: working structural',
    'validator.js.0-1-0.2026-04-24: creation'
  ],
  aArg = process.argv.slice(2);

if (aArg.length === 0) {
  console.error('Usage: node validator <sNameDir> <sNameIdRela> [--ai] [--code MvreName01[,Hvrw07]]');
  process.exit(1);
}

const bUseAi       = aArg.includes('--ai');
const nIdxCode     = aArg.indexOf('--code');
// the-rules to report; empty: all
const aCode        = nIdxCode === -1 ? []
  : String(aArg[nIdxCode + 1] ?? '').split(',').map(sCode => sCode.trim()).filter(Boolean);
const aArgPath     = aArg.filter((sArg, nI) => !sArg.startsWith('--') && (nIdxCode === -1 || nI !== nIdxCode + 1));
const sNameDir     = aArgPath[0];
const sNameIdRela  = aArgPath[1] ? aArgPath[1] : null;

if (!fs.existsSync(sNameDir)) {
  console.error(`Directory not found: ${sNameDir}`);
  process.exit(1);
}

const oReporter = fReporter();

// with --code: only the-issues of these rules, counted per rule for the-log
const oCountCode = {};
const fKeepCode = aoIssueIn => {
  if (aCode.length === 0) return aoIssueIn;
  const aoKeep = aoIssueIn.filter(oIssue => aCode.includes(oIssue.sCode));
  for (const oIssue of aoKeep) oCountCode[oIssue.sCode] = (oCountCode[oIssue.sCode] ?? 0) + 1;
  return aoKeep;
};

/**
 * DOING: with --code, the-log of the-report keeps only the-lines of these rules.
 *   A-checker line "   Hvre06/Hvre05 Links & anchors... 3 issues" counts 2 rules:
 *   it becomes "   Hvre05 Links & anchors... 1 issues", with the-count of Hvre05 only.
 *   A-"🔍 Running .. checks" line stays only above a-kept line.
 */
function fLogOfCode(sLogIn) {
  if (aCode.length === 0) return sLogIn;
  const aOut = [];
  let sHead = null;
  for (const sLine of sLogIn.split('\n')) {
    if (/^\s*🔍 Running/.test(sLine)) { sHead = sLine; continue; }
    const aRule = sLine.match(/^(\s+)((?:Mvr|Hvr)[A-Za-z]*\d+(?:\/(?:Mvr|Hvr)[A-Za-z]*\d+)*)(\s+.*?)\d+ issues\s*$/);
    if (!aRule) { if (!/^\s+(Mvr|Hvr)/.test(sLine)) aOut.push(sLine); continue; }
    const aCodeLine = aRule[2].split('/').filter(sCode => aCode.includes(sCode));
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
  const fWriteOut = process.stdout.write;
  process.stdout.write = function (sChunk, ...aRest) {
    sLog += String(sChunk);
    return fWriteOut.call(process.stdout, sChunk, ...aRest);
  };

  // ── parse every file as generic Hitp ──────────────────────────────────────
  let aoFileHitp;
  if (sNameIdRela) {
    const sPathFile = path.isAbsolute(sNameIdRela) ? sNameIdRela : path.join(sNameDir, sNameIdRela);
    console.log(`📄 Single-file mode: ${sNameIdRela}`);
    if (aCode.length) console.log(`🔎 Rule: ${aCode.join(', ')}`);
    aoFileHitp = [fReadFileHitp(sPathFile)];
  } else {
    console.log(`📂 Scanning: ${sNameDir}`);
    aoFileHitp = fReadFileAllHitp(sNameDir);
    console.log(`   Found ${aoFileHitp.length} .last.html files\n`);
  }

  // ── 1. Hitp checks (every file) ────────────────────────────────────────────
  console.log('🔍 Running Hitp checks...');
  oReporter.fAddAll(fKeepCode(fRunChecksHitp(aoFileHitp, sNameDir)));

  // ── 2. Mcsh checks (files named Mcsh* only) ─────────────────────────────────
  // fReadFileMcsh(sNameDir, sNameIdRela) is async: await them all, and give it
  // the-worldview-relative-id, NOT the-full-path.
  const aoFileMcsh = await Promise.all(
    aoFileHitp
      .filter(oFile => oFile.sNameFile.startsWith('Mcsh'))
      .map(oFile => fReadFileMcsh(sNameDir, path.relative(sNameDir, oFile.sPathFile))));
  console.log(`\n🔍 Running Mcsh checks (${aoFileMcsh.length} Mcsh files)...`);
  oReporter.fAddAll(fKeepCode(fRunChecksMcsh(aoFileMcsh, sNameDir)));

  // ── 3. AI semantic checks (Mcsh files, requires DeepSeek API key) ──────────
  if (bUseAi) {
    console.log('\n🤖 Running AI semantic checks via DeepSeek...');
    oReporter.fAddAll(fKeepCode(await fRunChecksAi(aoFileMcsh)));
  }

  process.stdout.write = fWriteOut;   // the-results are in the-report's table
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
