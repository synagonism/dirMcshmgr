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
    'validator.js.0-4-0.2026-09-05: merge Hitp+Mcsh',
    'validator.js.0-3-0.2026-09-04: naming convention',
    'validator.js.0-2-0.2026-04-27: working structural',
    'validator.js.0-1-0.2026-04-24: creation'
  ],
  aArg = process.argv.slice(2);

if (aArg.length === 0) {
  console.error('Usage: node validator <sNameDir> <sNameIdRela> [--ai]');
  process.exit(1);
}

const bUseAi       = aArg.includes('--ai');
const aArgPath     = aArg.filter(sArg => !sArg.startsWith('--'));
const sNameDir     = aArgPath[0];
const sNameIdRela  = aArgPath[1] ? aArgPath[1] : null;

if (!fs.existsSync(sNameDir)) {
  console.error(`Directory not found: ${sNameDir}`);
  process.exit(1);
}

const oReporter = fReporter();

async function fMain() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Mcsh/Hitp Consistency Checker');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── parse every file as generic Hitp ──────────────────────────────────────
  let aoFileHitp;
  if (sNameIdRela) {
    const sPathFile = path.isAbsolute(sNameIdRela) ? sNameIdRela : path.join(sNameDir, sNameIdRela);
    console.log(`📄 Single-file mode: ${sNameIdRela}`);
    aoFileHitp = [fReadFileHitp(sPathFile)];
  } else {
    console.log(`📂 Scanning: ${sNameDir}`);
    aoFileHitp = fReadFileAllHitp(sNameDir);
    console.log(`   Found ${aoFileHitp.length} .last.html files\n`);
  }

  // ── 1. Hitp checks (every file) ────────────────────────────────────────────
  console.log('🔍 Running Hitp checks...');
  oReporter.fAddAll(fRunChecksHitp(aoFileHitp, sNameDir));

  // ── 2. Mcsh checks (files named Mcsh* only) ─────────────────────────────────
  // fReadFileMcsh(sNameDir, sNameIdRela) is async: await them all, and give it
  // the-worldview-relative-id, NOT the-full-path.
  const aoFileMcsh = await Promise.all(
    aoFileHitp
      .filter(oFile => oFile.sNameFile.startsWith('Mcsh'))
      .map(oFile => fReadFileMcsh(sNameDir, path.relative(sNameDir, oFile.sPathFile))));
  console.log(`\n🔍 Running Mcsh checks (${aoFileMcsh.length} Mcsh files)...`);
  oReporter.fAddAll(fRunChecksMcsh(aoFileMcsh, sNameDir));

  // ── 3. AI semantic checks (Mcsh files, requires DeepSeek API key) ──────────
  if (bUseAi) {
    console.log('\n🤖 Running AI semantic checks via DeepSeek...');
    oReporter.fAddAll(await fRunChecksAi(aoFileMcsh));
  }

  oReporter.fPrint();

  // ── save the HTML report next to this script (dirMcshmgr/dirValid), ────────
  //    independent of the caller's cwd. Opening it in VS Code's integrated
  //    Simple Browser is handled by the mcs-open-local-server extension
  //    (command "mcs.validateAndReport"), which runs this validator and then
  //    serves + shows the report when errors/warnings are found.
  const sPathReport = path.join(sDirScript, 'validator-report.html');
  oReporter.fSaveHtml(sPathReport);
}

fMain().catch(oErr => {
  console.error('\n❌ Fatal error:', oErr.message);
  process.exit(1);
});
