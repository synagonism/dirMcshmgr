#!/usr/bin/env node
/**
 * Mcs/Hitp Consistency Checker
 * Checks dirMcsh-worldview for structural and content issues.
 *
 * Every file is validated as generic Hitp (H01–H11).
 * Files whose name starts with "Mcs" additionally get the Mcs concept checks (M01–M12) and,
 * with --ai, the DeepSeek semantic checks (M01–M04).
 *
 * Usage:
 *   node validator.js <dirMcsh-path>          # fast structural checks only
 *   node validator.js <dirMcsh-path> --file McsXxx000001.last.html  # single file
 *   node validator.js <dirMcsh-path> --ai     # + DeepSeek AI semantic checks (Mcs)
 */

import { fParseFileHitp, fParseFileAllHitp } from './parserHitp.js';
import { fRunChecksHitp } from './structuralHitp.js';
import { fParseFile } from './parser.js';
import { fRunChecksStructural } from './structural.js';
import { fRunChecksAi } from './ai-checks.js';
import { fReporter } from './reporter.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const sDirScript = path.dirname(fileURLToPath(import.meta.url));

const
  aVersion = [
    'validator.js.0-4-0.2026-09-05: merge Hitp+Mcs',
    'validator.js.0-3-0.2026-09-04: naming convention',
    'validator.js.0-2-0.2026-04-27: working structural',
    'validator.js.0-1-0.2026-04-24: creation'
  ],
  aArg = process.argv.slice(2);

if (aArg.length === 0) {
  console.error('Usage dirMcsmgr: node dirValid/validator <dirMcsh-path> [--ai] [--file <filename>]');
  process.exit(1);
}

const sPathDir     = aArg[0];
const bUseAi       = aArg.includes('--ai');
const nIndexFile   = aArg.indexOf('--file');
const sFileSingle  = nIndexFile !== -1 ? aArg[nIndexFile + 1] : null;

if (!fs.existsSync(sPathDir)) {
  console.error(`Directory not found: ${sPathDir}`);
  process.exit(1);
}

const oReporter = fReporter();

async function fMain() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Mcs/Hitp Consistency Checker');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── parse every file as generic Hitp ──────────────────────────────────────
  let aoFileHitp;
  if (sFileSingle) {
    const sPathFile = path.isAbsolute(sFileSingle) ? sFileSingle : path.join(sPathDir, sFileSingle);
    console.log(`📄 Single-file mode: ${sFileSingle}`);
    aoFileHitp = [fParseFileHitp(sPathFile)];
  } else {
    console.log(`📂 Scanning: ${sPathDir}`);
    aoFileHitp = fParseFileAllHitp(sPathDir);
    console.log(`   Found ${aoFileHitp.length} .last.html files\n`);
  }

  // ── 1. Hitp checks (every file) ────────────────────────────────────────────
  console.log('🔍 Running Hitp checks...');
  oReporter.fAddAll(fRunChecksHitp(aoFileHitp, sPathDir));

  // ── 2. Mcs checks (files named Mcs* only) ─────────────────────────────────
  const aoFileMcs = aoFileHitp
    .filter(oFile => oFile.sNameFile.startsWith('Mcs'))
    .map(oFile => fParseFile(oFile.sPathFile));
  console.log(`\n🔍 Running Mcs checks (${aoFileMcs.length} Mcs files)...`);
  oReporter.fAddAll(fRunChecksStructural(aoFileMcs, sPathDir));

  // ── 3. AI semantic checks (Mcs files, requires DeepSeek API key) ──────────
  if (bUseAi) {
    console.log('\n🤖 Running AI semantic checks via DeepSeek...');
    oReporter.fAddAll(await fRunChecksAi(aoFileMcs));
  }

  oReporter.fPrint();

  // ── save the HTML report next to this script (dirMcsmgr/dirValid), ────────
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
