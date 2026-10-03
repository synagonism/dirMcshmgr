#!/usr/bin/env node
/*
 * dupMcsh.mjs - it reports the-duplicate-name-lines, of every McsLago, of a-dirMcsh-worldview
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
 * DOING: it reports the-duplicate-name-lines, of every McsLago, per file, as
 *   McshTchInf000012:3408;2345;1922
 *   one number per duplicate: the-file-line of its LAST occurrence, the-biggest
 *   first, so you delete them top-down and the-other-numbers stay valid.
 *   A-name is the-WHOLE-line to the-comma WITH its McsLago:
 *   "McshEngl.young!~adjeEngl:animal," gives "McshEngl.young!~adjeEngl:animal",
 *   so name-notations do-not collide, and the-same text in two McsLago
 *   (McshElln. and McshElla.) is NOT a-duplicate.
 *   ISSUE: a-name-line written 3+ times gives ONE number, so such a-file needs
 *   an-other run after you delete it.
 *   The-duplicates are of three kinds, each one needs an-other fix:
 *   A: the-same name-line twice in ONE name::-para — an-editing-slip, delete one,
 *   B: the-same name-line in 2+ para of ONE file — two concepts claim one name,
 *   C: the-same name-line in 2+ files — a-cross-file-collision, it needs a-decision.
 * INPUT: the-path of a-dirMcsh-worldview.
 * OUTPUT: the-report on stdout, it is long: redirect it.
 * RUN:
 *   node dirValid/dupMcsh.mjs <sNameDir> [--summary] [--section a|b|c]
 *                             [--file McshDir000000] [--line] [--fix]
 */

import moFs from 'fs'
import moPath from 'path'
import { fReadFileAllHitp } from './parserHitp.js'
import { fReadFileMcsh, rNameLine } from './parserMcsh.js'
import { fBuildMapName } from './structuralMcsh.js'

const
  // contains the-versions of dupMcsh.mjs
  aVersion = [
    'dupMcsh.mjs.0-6-0.2026-10-03: --line shows the-lines and the-name-lines',
    'dupMcsh.mjs.0-5-0.2026-10-03: every McsLago, not only Engl',
    'dupMcsh.mjs.0-4-0.2026-10-03: --fix deletes the-kind-A-duplicates',
    'dupMcsh.mjs.0-3-0.2026-10-03: the-report gives the-line of the-last occurrence',
    'dupMcsh.mjs.0-2-0.2026-10-03: the-name is the-whole-line to the-comma',
    'dupMcsh.mjs.0-1-0.2026-10-02: creation'
  ],
  // the-three kinds of duplicate, with their heading
  oKindTitle = {
    A: 'the-same name-line in ONE name::-para — an-editing-slip',
    B: 'the-same name-line in 2+ para of ONE file — two concepts claim one name',
    C: 'the-same name-line in 2+ FILES — a-cross-file-collision'
  }

/**
 * DOING: it tells the-kind of a-duplicate-group.
 * INPUT: the-occurrences of one name [{sNameFile, sNameId, sTitle}].
 * OUTPUT: 'A' | 'B' | 'C'.
 */
function fFindKind(aoOccurIn) {
  const oSetLoc  = new Set(aoOccurIn.map(oOccur => oOccur.sNameFile + '#' + oOccur.sNameId));
  const oSetFile = new Set(aoOccurIn.map(oOccur => oOccur.sNameFile));
  if (oSetLoc.size === 1)  return 'A';
  if (oSetFile.size === 1) return 'B';
  return 'C';
}

/**
 * OUTPUT: the-file-name without its '.last.html', as McshDir000000.
 */
/**
 * DOING: it builds the-key of a-name-line from a-match of rNameLine: the-line as
 *   written, WITH its McsLago, "McshZhon.diànyóu-电邮!=e-mail".
 *   It is the-same key fBuildMapName of structuralMcsh.js builds, so the-two agree.
 */
function fFindKeyName(aNameMatchIn) {
  return 'Mcsh' + aNameMatchIn[1] + '.' + aNameMatchIn[2].trim();
}

/**
 * DOING: it finds the-file-lines of every name-line, in every McsLago, of a-file.
 *   fBuildMapName gives us WHICH name-lines are duplicated, not WHERE they are:
 *   its occurrences hold the-element-id only. So we scan the-raw-file with the
 *   rNameLine of the-parser, and we key on the-same whole-name to the-comma.
 * INPUT: the-path of one file.
 * OUTPUT: Map(sKey -> [nLine, ...]) in document-order, the-lines are 1-based,
 *   sKey as fFindKeyName builds it.
 */
function fFindMapLineName(sPathFileIn) {
  const oMapLineName = new Map();
  let aLine;
  try {
    aLine = moFs.readFileSync(sPathFileIn, 'utf8').split('\n');
  } catch {
    return oMapLineName;
  }
  for (let nL = 0; nL < aLine.length; nL++) {
    const aNameMatch = aLine[nL].match(rNameLine);
    if (!aNameMatch) continue;
    const sKey = fFindKeyName(aNameMatch);
    if (!oMapLineName.has(sKey)) oMapLineName.set(sKey, []);
    oMapLineName.get(sKey).push(nL + 1);
  }
  return oMapLineName;
}

/**
 * OUTPUT: the-file-lines of the-LAST occurrence of each duplicate of one file,
 *   the-biggest-line first: you delete them top-down and the-rest stay valid.
 *   a-'?' marks a-duplicate whose line we did-not find.
 */
function fFindLineLast(aoGroupIn, oMapLineNameIn) {
  return aoGroupIn
    .map(oGroup => {
      const aLine = oMapLineNameIn?.get(oGroup.sName) ?? [];
      return aLine.length > 0 ? aLine[aLine.length - 1] : '?';
    })
    .sort((xA, xB) => (xA === '?') - (xB === '?') || xB - xA);
}

/**
 * DOING: it DELETES the-duplicate-name-lines of kind A, all but the-FIRST of each.
 *   kind A is the-same name-line twice in ONE name::-para, so the-others are
 *   copies with no information: it is safe to remove them.
 *   We delete bottom-up per file, because a-deletion shifts ONLY the-lines
 *   BELOW it, so the-other-line-numbers stay valid while we work.
 *   We check the-content of every line before we delete IT: if the-file changed
 *   since we read IT, we skip the-line and we say so.
 * INPUT: the-kind-A-groups, the-line-maps, the-paths per file, one file or ''.
 * OUTPUT: {nFile, nLine, nSkip}, and it WRITES the-files.
 */
function fFixDuplicate(aoGroupIn, ooMapLineNameIn, ooPathFileIn, sNameFileOnlyIn) {
  const ooFile = fGroupPerFile(aoGroupIn);
  let nFile = 0, nLine = 0, nSkip = 0;

  for (const sNameFile of Object.keys(ooFile).sort()) {
    if (sNameFileOnlyIn && fFindNameShort(sNameFile) !== sNameFileOnlyIn) continue;

    // the-lines to delete: every occurrence of a-kind-A-name-line but its FIRST
    const aoLineDel = [];
    for (const oGroup of ooFile[sNameFile]) {
      const aLine = ooMapLineNameIn[sNameFile]?.get(oGroup.sName) ?? [];
      for (let nN = 1; nN < aLine.length; nN++) {
        aoLineDel.push({ nLine: aLine[nN], sName: oGroup.sName });
      }
    }
    if (aoLineDel.length === 0) continue;

    const sPathFile = ooPathFileIn[sNameFile];
    const aLineFile = moFs.readFileSync(sPathFile, 'utf8').split('\n');
    let nLineFile = 0;
    for (const oDel of aoLineDel.sort((oA, oB) => oB.nLine - oA.nLine)) {
      const aNameMatch = String(aLineFile[oDel.nLine - 1] ?? '').match(rNameLine);
      if (!aNameMatch || fFindKeyName(aNameMatch) !== oDel.sName) {
        console.log(`  ! ${fFindNameShort(sNameFile)}:${oDel.nLine} is NOT "${oDel.sName}" any more, skipped`);
        nSkip++;
        continue;
      }
      aLineFile.splice(oDel.nLine - 1, 1);
      nLineFile++;
    }
    if (nLineFile === 0) continue;
    moFs.writeFileSync(sPathFile, aLineFile.join('\n'));
    console.log(`  ${fFindNameShort(sNameFile)}: ${nLineFile} name-lines deleted`);
    nFile++;
    nLine += nLineFile;
  }
  return { nFile, nLine, nSkip };
}

/**
 * DOING: it finds ALL the-occurrences of a-duplicate, over all its files.
 * OUTPUT: [{sNameFile, nLine}] per file in the-order of the-group, per file in
 *   document-order.
 */
function fFindLineAll(oGroupIn, ooMapLineNameIn) {
  const aoLine = [];
  for (const sNameFile of new Set(oGroupIn.aoOccur.map(oOccur => oOccur.sNameFile))) {
    for (const nLine of ooMapLineNameIn[sNameFile]?.get(oGroupIn.sName) ?? []) {
      aoLine.push({ sNameFile, nLine });
    }
  }
  return aoLine;
}

/**
 * DOING: it prints the-duplicates of one file as lines, for --line:
 *     7079  McshTurk.tıraş-etmek!=to-shave   also 6826
 *   the-first number is the-LAST occurrence in this file, the-same number the
 *   summary prints, and the-rows have the-order of the-summary. 'also' gives the
 *   other occurrences: a-line in this file, McshDir000000:line in an-other file.
 *   You open the-line and you see if IT is still the-name: a-stale-number shows.
 */
function fPrintLine(aoGroupIn, sNameFileIn, ooMapLineNameIn) {
  const aoRow = aoGroupIn.map(oGroup => {
    const aoLine = fFindLineAll(oGroup, ooMapLineNameIn);
    const aoLineFile = aoLine.filter(oLine => oLine.sNameFile === sNameFileIn);
    const oLineLast = aoLineFile[aoLineFile.length - 1];
    const aAlso = aoLine
      .filter(oLine => oLine !== oLineLast)
      .map(oLine => oLine.sNameFile === sNameFileIn
        ? String(oLine.nLine)
        : fFindNameShort(oLine.sNameFile) + ':' + oLine.nLine);
    return { nLine: oLineLast?.nLine ?? '?', sName: oGroup.sName, aAlso };
  })
  // the-order of the-summary: the-biggest line first, a-'?' last
  .sort((oA, oB) => (oA.nLine === '?') - (oB.nLine === '?') || oB.nLine - oA.nLine);

  const nWidthLine = Math.max(...aoRow.map(oRow => String(oRow.nLine).length));
  const nWidthName = Math.min(64, Math.max(...aoRow.map(oRow => oRow.sName.length)));
  for (const oRow of aoRow) {
    console.log(`    ${String(oRow.nLine).padStart(nWidthLine)}  ${oRow.sName.padEnd(nWidthName)}` +
      (oRow.aAlso.length > 0 ? `   also ${oRow.aAlso.join(', ')}` : ''));
  }
}

function fFindNameShort(sNameFileIn) {
  return String(sNameFileIn ?? '').replace(/\.last\.html$/, '');
}

/**
 * DOING: it groups the-duplicate-groups of one kind per file.
 *   a-kind-C-group belongs to EVERY file it spans, so one group is counted
 *   on each of them: the-counts of kind C do NOT sum to the-group-count.
 * INPUT: the-duplicate-groups [{sName, aoOccur, sKind}] of one kind.
 * OUTPUT: {sNameFile: [{sName, aoOccur}]}
 */
function fGroupPerFile(aoGroupIn) {
  const ooFile = {};
  for (const oGroup of aoGroupIn) {
    for (const sNameFile of new Set(oGroup.aoOccur.map(oOccur => oOccur.sNameFile))) {
      if (!ooFile[sNameFile]) ooFile[sNameFile] = [];
      ooFile[sNameFile].push(oGroup);
    }
  }
  return ooFile;
}

/**
 * DOING: it prints the-locations of a-duplicate-group, the-file-name is dropped
 *   when the-group stays inside the-file we report.
 */
function fFindLoc(oGroupIn, sNameFileIn) {
  const aoOccur = oGroupIn.aoOccur;
  const oSetLoc = new Set(aoOccur.map(oOccur => oOccur.sNameFile + '#' + oOccur.sNameId));
  if (oSetLoc.size === 1) return `${aoOccur.length} times in #${aoOccur[0].sNameId}`;
  // inside one file: the-ids only. over files: file#id
  const bInFile = new Set(aoOccur.map(oOccur => oOccur.sNameFile)).size === 1;
  const aLoc = [...new Set(aoOccur.map(oOccur =>
    bInFile ? '#' + oOccur.sNameId : fFindNameShort(oOccur.sNameFile) + '#' + oOccur.sNameId))];
  return `${aoOccur.length} times in ${aLoc.join(', ')}`;
}

/**
 * DOING: it prints one kind-section: the-ranked McshDir000000:number-counts,
 *   then the-duplicate-names per file.
 */
function fPrintSection(sKindIn, aoGroupIn, bSummaryIn, sNameFileOnlyIn, ooMapLineNameIn, bLineIn) {
  const ooFile = fGroupPerFile(aoGroupIn);
  const aoCount = Object.entries(ooFile)
    .map(([sNameFile, aoGroup]) => [sNameFile, aoGroup.length])
    .sort((aA, aB) => aB[1] - aA[1] || aA[0].localeCompare(aB[0]));

  console.log('');
  console.log(`─── ${sKindIn}. ${oKindTitle[sKindIn]} ───`);
  console.log(`    ${aoGroupIn.length} duplicate-groups over ${aoCount.length} files` +
    (sKindIn === 'C'
      ? ', one group is counted on EVERY file it spans,\n    so these counts do NOT sum to the-group-count'
      : ''));
  if (aoGroupIn.length === 0) return;

  // ── the-lines: McshDir000000:line;line;... ────────────────────────────────
  //    one line per duplicate, the-line of its LAST occurrence, biggest first.
  console.log('');
  for (const [sNameFile] of aoCount) {
    if (sNameFileOnlyIn && fFindNameShort(sNameFile) !== sNameFileOnlyIn) continue;
    const aLineLast = fFindLineLast(ooFile[sNameFile], ooMapLineNameIn[sNameFile]);
    console.log(`${fFindNameShort(sNameFile)}:${aLineLast.join(';')}`);
  }
  if (bSummaryIn) return;

  // ── the-names per file ────────────────────────────────────────────────────
  for (const [sNameFile] of aoCount) {
    if (sNameFileOnlyIn && fFindNameShort(sNameFile) !== sNameFileOnlyIn) continue;
    console.log('');
    console.log(`  ${sNameFile}`);
    if (bLineIn) {
      fPrintLine(ooFile[sNameFile], sNameFile, ooMapLineNameIn);
      continue;
    }
    const aoGroup = ooFile[sNameFile].slice()
      .sort((oA, oB) => oA.sName.localeCompare(oB.sName));
    const nWidth = Math.min(64, Math.max(...aoGroup.map(oGroup => oGroup.sName.length)) + 2);
    for (const oGroup of aoGroup) {
      console.log(`    ${('"' + oGroup.sName + '"').padEnd(nWidth)} ${fFindLoc(oGroup, sNameFile)}`);
    }
  }
}

async function fMain() {
  const aArg = process.argv.slice(2);
  const aArgPath = aArg.filter(sArg => !sArg.startsWith('--'));
  const sNameDir = aArgPath[0];

  if (!sNameDir) {
    console.log('dupMcsh.mjs - it reports the-duplicate-name-lines, of every McsLago, of a-dirMcsh-worldview');
    console.log('  ' + aVersion[0]);
    console.log('');
    console.log('USAGE: node dirValid/dupMcsh.mjs <sNameDir> [--summary] [--section a|b|c] [--file McshDir000000]');
    console.log('  sNameDir     the-path of the-dirMcsh-worldview');
    console.log('  --summary    the-McshDir000000:number-counts only, no names');
    console.log('  --section    one kind only: a, b or c');
    console.log('  --file       one file only, given as McshDir000000');
    console.log('  --line       the-detail gives per duplicate its lines and its name-line,');
    console.log('               so you see if a-number is stale after you edit the-file');
    console.log('  --fix        it DELETES the-kind-A-duplicates: the-same name-line');
    console.log('               twice in ONE name::-para, all but the-first of each.');
    console.log('               kind B and C are NOT touched: they need a-decision.');
    process.exit(1);
  }

  const bSummary = aArg.includes('--summary');
  const bFix     = aArg.includes('--fix');
  const bLine    = aArg.includes('--line');
  const nIdxSect = aArg.indexOf('--section');
  const sKindOnly = nIdxSect !== -1 ? (aArg[nIdxSect + 1] ?? '').toUpperCase() : '';
  const nIdxFile = aArg.indexOf('--file');
  const sNameFileOnly = nIdxFile !== -1 ? fFindNameShort(aArg[nIdxFile + 1] ?? '') : '';

  // --fix deletes, so it is kind A only: on B the two concepts need a-decision,
  // on C the-collision is over files and NO occurrence is a-plain copy.
  if (bFix && sKindOnly !== '' && sKindOnly !== 'A') {
    console.error('--fix works on kind A only: drop "--section ' + sKindOnly.toLowerCase() + '"');
    process.exit(1);
  }

  // ── read the-Mcsh-files ───────────────────────────────────────────────────
  const aoFileHitp = fReadFileAllHitp(sNameDir).filter(oFile => oFile.sNameFile.startsWith('Mcsh'));
  const aoCnptFile = await Promise.all(aoFileHitp.map(oFile =>
    fReadFileMcsh(sNameDir, moPath.relative(sNameDir, oFile.sPathFile))));
  const aoError = aoCnptFile.filter(oCnptFile => oCnptFile.sError);
  // the-file-lines of the-name-lines, per file: {sNameFile: Map(sNameFull -> [nLine])}
  const ooMapLineName = {};
  const ooPathFile = {};
  for (const oFile of aoFileHitp) {
    ooMapLineName[oFile.sNameFile] = fFindMapLineName(oFile.sPathFile);
    ooPathFile[oFile.sNameFile] = oFile.sPathFile;
  }

  // ── the-duplicate-groups, from the-name-map of structuralMcsh.js ──────────
  const oMapName = fBuildMapName(aoCnptFile);
  const aoGroup = [];
  for (const [sName, aoOccur] of oMapName) {
    if (aoOccur.length < 2) continue;
    aoGroup.push({ sName, aoOccur, sKind: fFindKind(aoOccur) });
  }
  const oSetFileDup = new Set(aoGroup.flatMap(oGroup => oGroup.aoOccur.map(oOccur => oOccur.sNameFile)));

  // ── the-report ────────────────────────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Mcsh duplicate-names: ${sNameDir}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ${aoCnptFile.length} Mcsh-files · ${oSetFileDup.size} with duplicates · ` +
    `${aoGroup.length} duplicate-groups`);
  if (aoError.length > 0) console.log(`  ${aoError.length} files could NOT be read`);

  for (const sKind of ['A', 'B', 'C']) {
    if (sKindOnly !== '' && sKindOnly !== sKind) continue;
    fPrintSection(sKind, aoGroup.filter(oGroup => oGroup.sKind === sKind), bSummary,
      sNameFileOnly, ooMapLineName, bLine);
  }

  // ── --fix: delete the-kind-A-duplicates ───────────────────────────────────
  if (!bFix) return;
  const aoGroupA = aoGroup.filter(oGroup => oGroup.sKind === 'A');
  console.log('');
  console.log(`─── --fix: deleting the-kind-A-duplicates (${aoGroupA.length} groups) ───`);
  console.log('');
  const oFix = fFixDuplicate(aoGroupA, ooMapLineName, ooPathFile, sNameFileOnly);
  console.log('');
  console.log(`  ${oFix.nLine} name-lines deleted in ${oFix.nFile} files` +
    (oFix.nSkip > 0 ? `, ${oFix.nSkip} skipped (the-file changed)` : ''));
  console.log('  RUN the-report again to see what is left.');
}

fMain().catch(oErr => {
  console.error('\n❌ Fatal error:', oErr.message);
  process.exit(1);
});
