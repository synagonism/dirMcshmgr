#!/usr/bin/env node
/*
 * reportMcsh.mjs - it reports the-issues of one validator-code (Mcsh or Hitp), per file
 * The MIT License (MIT)
 *
 * Copyright (c) 2026 Kaseluris.Nikos.1959 (humnSngu)
 * kaseluris.nikos@gmail.com
 * https://synagonism.net/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * DOING: it reports the-issues of one or more validator-codes per file, as
 *   McshTchInf000015:12034;11980;2310
 *   one number per issue: the-line of the-issue, the-biggest first, so you edit
 *   them top-down and the-other-numbers stay valid. Files with more issues first.
 *   It takes the-issues the-validator itself makes, so the-rules live in ONE place:
 *   Mvr.. codes from fRunChecksMcsh (structuralMcsh.js, Mcsh* files only),
 *   Hvr.. codes from fRunChecksHitp (structuralHitp.js, every .last.html file).
 *   Only the-checker of a-requested code runs.
 * INPUT: the-path of a-dirMcsh-worldview and the-codes.
 * OUTPUT: the-report in dirValid/reportMcsh.txt, overwritten on every run;
 *   the-console shows its header and the-path.
 * RUN:
 *   node dirValid/reportMcsh.mjs <sNameDir> --code Mvrw01[,Hvrw07]
 *                                [--line] [--file McshDir000000]
 */

import moFs from 'fs'
import moPath from 'path'
import { fileURLToPath } from 'url'
import { fReadFileAllHitp } from './parserHitp.js'
import { fReadFileMcsh } from './parserMcsh.js'
import { fRunChecksMcsh } from './structuralMcsh.js'
import { fRunChecksHitp } from './structuralHitp.js'

const
  // contains the-versions of reportMcsh.mjs
  aVersion = [
    'reportMcsh.mjs.0-3-0.2026-10-09: and Hitp-rules (Hvr.. codes)',
    'reportMcsh.mjs.0-2-0.2026-10-04: the-report goes to reportMcsh.txt',
    'reportMcsh.mjs.0-1-0.2026-10-04: creation'
  ],
  // the-dir of this script: reportMcsh.txt is written next to IT
  sDirScript = moPath.dirname(fileURLToPath(import.meta.url))

/**
 * OUTPUT: the-file-name without its '.last.html', as McshDir000000.
 */
function fFindNameShort(sNameFileIn) {
  return String(sNameFileIn ?? '').replace(/\.last\.html$/, '');
}

/**
 * DOING: it sorts issues by their line, the-biggest first, a-missing line last.
 */
function fSortLine(aoIssueIn) {
  return aoIssueIn.slice().sort((oA, oB) =>
    (oA.nLine == null) - (oB.nLine == null) || (oB.nLine ?? 0) - (oA.nLine ?? 0));
}

async function fMain() {
  const aArg = process.argv.slice(2);
  const aArgPath = aArg.filter((sArg, nI) =>
    !sArg.startsWith('--') && !['--code', '--file'].includes(aArg[nI - 1]));
  const sNameDir = aArgPath[0];
  const nIdxCode = aArg.indexOf('--code');
  const aCode = nIdxCode !== -1
    ? (aArg[nIdxCode + 1] ?? '').split(',').map(sCode => sCode.trim()).filter(Boolean)
    : [];

  if (!sNameDir || aCode.length === 0) {
    console.log('reportMcsh.mjs - it reports the-issues of one validator-code (Mcsh or Hitp), per file');
    console.log('  ' + aVersion[0]);
    console.log('');
    console.log('USAGE: node dirValid/reportMcsh.mjs <sNameDir> --code Mvrw01[,Hvrw07] [--line] [--file McshDir000000]');
    console.log('  sNameDir     the-path of the-dirMcsh-worldview');
    console.log('  --code       one or more codes, comma-separated:');
    console.log('                 Mcsh: Mvre01 Mvre02 Mvrw01 Mvrw02 Mvrw03 Mvrw04 Mvrw06');
    console.log('                 Hitp: Hvre01 ... Hvre07  Hvrw01 ... Hvrw07');
    console.log('  --line       per file, every issue: its line and its message');
    console.log('  --file       one file only, given as McshDir000000');
    console.log('  OUTPUT: dirValid/reportMcsh.txt, overwritten on every run');
    process.exit(1);
  }

  const bLine = aArg.includes('--line');
  const nIdxFile = aArg.indexOf('--file');
  const sNameFileOnly = nIdxFile !== -1 ? fFindNameShort(aArg[nIdxFile + 1] ?? '') : '';

  // ── read the-files, run the-checks of the-validator, quietly ──────────────
  // Hitp-rules on every .last.html file, as validatorMcsh.js; Mcsh-rules on Mcsh* only
  const bCodeHitp = aCode.some(sCode => sCode.startsWith('H'));
  const bCodeMcsh = aCode.some(sCode => !sCode.startsWith('H'));
  const aoFileHitp = fReadFileAllHitp(sNameDir);
  const aoFileHitpMcsh = aoFileHitp.filter(oFile => oFile.sNameFile.startsWith('Mcsh'));
  const aoIssueAll = [];
  if (bCodeHitp) aoIssueAll.push(...fRunChecksHitp(aoFileHitp, sNameDir, true));
  if (bCodeMcsh) {
    const aoCnptFile = await Promise.all(aoFileHitpMcsh.map(oFile =>
      fReadFileMcsh(sNameDir, moPath.relative(sNameDir, oFile.sPathFile))));
    aoIssueAll.push(...fRunChecksMcsh(aoCnptFile, sNameDir, true));
  }
  const aoIssue = aoIssueAll.filter(oIssue => aCode.includes(oIssue.sCode));

  // ── group per file ────────────────────────────────────────────────────────
  const ooIssueFile = {};
  for (const oIssue of aoIssue) {
    (ooIssueFile[oIssue.sNameFile] ??= []).push(oIssue);
  }
  const aoCount = Object.entries(ooIssueFile)
    .map(([sNameFile, aoIssueFile]) => [sNameFile, aoIssueFile.length])
    .sort((aA, aB) => aB[1] - aA[1] || aA[0].localeCompare(aB[0]));

  // ── the-report, as lines, written to reportMcsh.txt ───────────────────────
  const aLineOut = [];
  const fOut = sIn => aLineOut.push(sIn);

  function fReport() {
    fOut('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    fOut(`  ${aCode.join(',')}: ${sNameDir}`);
    fOut('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    fOut(`  ${bCodeHitp ? aoFileHitp.length + ' files' : aoFileHitpMcsh.length + ' Mcsh-files'} · ` +
      `${aoCount.length} files with issues · ` +
      `${aoIssue.length} issues`);
    if (aoIssue.length === 0) {
      // an-unknown-code finds nothing: we say which codes DO occur
      const aCodeFound = [...new Set(aoIssueAll.map(oIssue => oIssue.sCode))].sort();
      fOut(`  codes with issues now: ${aCodeFound.join(', ') || 'none'}`);
      return;
    }

    fOut('');
    for (const [sNameFile] of aoCount) {
      if (sNameFileOnly && fFindNameShort(sNameFile) !== sNameFileOnly) continue;
      const aLine = fSortLine(ooIssueFile[sNameFile]).map(oIssue => oIssue.nLine ?? '?');
      fOut(`${fFindNameShort(sNameFile)}:${aLine.join(';')}`);
    }
    if (!bLine) return;

    // ── --line: every issue, its line and its message ───────────────────────
    for (const [sNameFile] of aoCount) {
      if (sNameFileOnly && fFindNameShort(sNameFile) !== sNameFileOnly) continue;
      const aoIssueFile = fSortLine(ooIssueFile[sNameFile]);
      const nWidth = Math.max(...aoIssueFile.map(oIssue => String(oIssue.nLine ?? '?').length));
      fOut('');
      fOut(`  ${sNameFile}`);
      for (const oIssue of aoIssueFile) {
        fOut(`    ${String(oIssue.nLine ?? '?').padStart(nWidth)}  ` +
          (aCode.length > 1 ? `[${oIssue.sCode}] ` : '') + oIssue.sMessage);
      }
    }
  }
  fReport();

  // the-file next to this script, independent of the-caller's cwd
  const sPathOut = moPath.join(sDirScript, 'reportMcsh.txt');
  moFs.writeFileSync(sPathOut, aLineOut.join('\n') + '\n');
  // on the-console: the-header only, the-rest is in the-file
  for (const sLine of aLineOut.slice(0, 5)) console.log(sLine);
  console.log(`📄 report written: ${sPathOut} (${aLineOut.length} lines)`);
}

fMain().catch(oErr => {
  console.error('\n❌ Fatal error:', oErr.message);
  process.exit(1);
});
