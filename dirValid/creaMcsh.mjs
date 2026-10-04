#!/usr/bin/env node
/*
 * creaMcsh.mjs - it puts the-Mcsh-creation-date in the-description:: of sections
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
 * DOING: two modes, both put "<br>× Mcsh-creation: {date}" in a-description::.
 *
 *   DEFAULT: an-evoluting-section records the-creation of its concept as a-dated-para:
 *     <p id="idXevg20200116">{2020-01-16}::
 *       <br>=== McsHitp-creation:          (or: <br>=== webpage creation:)
 *       <br>· creation of current <a ...>concept</a>.     (optional)
 *       <a class="clsHide" href="#idXevg20200116"></a></p>
 *   It DELETES that para and puts its date in the-description:: of the-SAME section:
 *   as the-first line of the-description, or, without a-description, it CREATES
 *     <p id="<section-id>dsn">description:: ... right after the-heading.
 *   It SKIPS and reports: a-para with more than the-creation-line, a-description
 *   with an-other creation-date, a-taken id, a-para outside a-section.
 *
 *   --missing: every section the-validator reports as Mcsh02 (no description::)
 *   gets a-description:: with the-date of the-run, right after its heading.
 *   A-description with a-typo-title (Descripton::, descption::) gets its title
 *   fixed instead. It SKIPS and reports: a-section-id that occurs 2+ times,
 *   a-taken <section-id>dsn, an-other description-title (descriptionLong::).
 *
 * INPUT: the-path of a-dirMcsh-worldview.
 * OUTPUT: dry-run by default: what it would do. With --fix it writes the-files,
 *   after it copies each one into dirValid/creaMcsh-backup/<time>/.
 *   The-report goes to dirValid/creaMcsh.txt.
 * RUN:
 *   node dirValid/creaMcsh.mjs <sNameDir> [--missing] [--fix]
 */

import moFs from 'fs'
import moPath from 'path'
import { fileURLToPath } from 'url'
import { fReadFileAllHitp } from './parserHitp.js'
import { fReadFileMcsh } from './parserMcsh.js'
import { fRunChecksMcsh } from './structuralMcsh.js'

const
  // contains the-versions of creaMcsh.mjs
  aVersion = [
    'creaMcsh.mjs.0-2-0.2026-10-04: --missing, a-description for every Mcsh02-section',
    'creaMcsh.mjs.0-1-0.2026-10-04: creation'
  ],
  // the-dir of this script: the-report and the-backup go next to IT
  sDirScript = moPath.dirname(fileURLToPath(import.meta.url)),
  // the-lines of a-creation-para
  rParaOpen  = /^( *)<p id="([^"]+)">\{([0-9-]+)\}::\s*$/,
  rParaKind  = /^\s*<br>=== (McsHitp-creation|webpage creation):\s*$/,
  rParaCrea  = /^\s*<br>· creation of current <a class="clsPreview" href="[^"]*">(webpage-)?concept<\/a>\.\s*$/,
  // the-lines of a-section
  rSectOpen  = /<section\b[^>]*\bid="([^"]+)"/,
  rDescOpen  = /^( *)<p id="([^"]+)">description::\s*$/,
  // a-description with a-typo in its title, as found in the-worldview
  rDescTypo  = /^( *)<p id="([^"]+)">(Descripton|descripton|Descption|descption)::\s*$/,
  // an-other title that starts like description: descriptionLong::, Description::
  rDescLike  = /^\s*(?:<p\b[^>]*>|<div\b[^>]*>\s*<p>|<p>)\s*[Dd]escr\w*::/,
  rNameOpen  = /^( *)<p id="[^"]+">name::/,
  rCreaDesc  = /× Mcsh-creation:\s*\{([0-9-]+)\}/

/**
 * OUTPUT: a-line without a-trailing \r, for matching only.
 */
function fLineClean(sLineIn) {
  return String(sLineIn ?? '').replace(/\r$/, '');
}

/**
 * OUTPUT: how many times sNeedleIn is in sTextIn.
 */
function fCount(sTextIn, sNeedleIn) {
  return sTextIn.split(sNeedleIn).length - 1;
}

/**
 * OUTPUT: the-local date: 2026-10-04, and with bTimeIn the-time too: 2026-10-04T11-15-07.
 */
function fFindDateLocal(bTimeIn = false) {
  const oNow = new Date();
  const fPad = nIn => String(nIn).padStart(2, '0');
  const sDate = `${oNow.getFullYear()}-${fPad(oNow.getMonth() + 1)}-${fPad(oNow.getDate())}`;
  return bTimeIn
    ? `${sDate}T${fPad(oNow.getHours())}-${fPad(oNow.getMinutes())}-${fPad(oNow.getSeconds())}`
    : sDate;
}

/**
 * DOING: it finds the-files *.last.html under a-dir, not in node_modules|.git|backups.
 * OUTPUT: [sPathFile]
 */
function fFindFileAll(sDirIn) {
  const aPath = [];
  for (const oEnt of moFs.readdirSync(sDirIn, { withFileTypes: true })) {
    const sPath = moPath.join(sDirIn, oEnt.name);
    if (oEnt.isDirectory()) {
      if (['node_modules', '.git'].includes(oEnt.name) || oEnt.name.startsWith('creaMcsh-backup')) continue;
      aPath.push(...fFindFileAll(sPath));
    } else if (oEnt.name.endsWith('.last.html')) {
      aPath.push(sPath);
    }
  }
  return aPath;
}

/**
 * DOING: it finds the-section that encloses line nLineIn: backwards, skipping
 *   the-sections that close before it.
 * OUTPUT: the-index of its <section>-line, or -1.
 */
function fFindSectOpen(aLineIn, nLineIn) {
  let nDepth = 0;
  for (let nL = nLineIn - 1; nL >= 0; nL--) {
    const sLine = aLineIn[nL];
    nDepth += fCount(sLine, '</section>');
    if (/<section\b/.test(sLine)) {
      if (nDepth === 0) return nL;
      nDepth -= fCount(sLine, '<section');
    }
  }
  return -1;
}

/**
 * DOING: it finds the-end of the-OWN text of a-section: its first child <section>
 *   or its </section>.
 * OUTPUT: the-index of that line.
 */
function fFindSectOwnEnd(aLineIn, nSectIn) {
  for (let nL = nSectIn + 1; nL < aLineIn.length; nL++) {
    if (/<section\b/.test(aLineIn[nL]) || aLineIn[nL].includes('</section>')) return nL;
  }
  return aLineIn.length;
}

/**
 * OUTPUT: the-index of the-line that ends the-heading of a-section, or -1.
 */
function fFindHeadEnd(aLineIn, nSectIn, nOwnEndIn) {
  for (let nH = nSectIn + 1; nH < nOwnEndIn; nH++) {
    if (/<\/h[1-9]>/.test(aLineIn[nH])) return nH;
  }
  return -1;
}

/**
 * DOING: it builds a-NEW description-para, to go right after the-heading,
 *   with the-indentation of the-section's name::-para. BOTH modes use it.
 * OUTPUT: an-edit {nAt, nDel, aIns}.
 */
function fMakeDescNew(aLineIn, nSectIn, nHeadEndIn, nOwnEndIn, sIdDescIn, sDateIn) {
  let sIndent = null;
  for (let nN = nHeadEndIn + 1; nN < nOwnEndIn; nN++) {
    const aName = fLineClean(aLineIn[nN]).match(rNameOpen);
    if (aName) { sIndent = aName[1]; break; }
  }
  sIndent ??= (aLineIn[nSectIn + 1] ?? '').match(/^( *)/)[1];
  return { nAt: nHeadEndIn + 1, nDel: 0, aIns: [
    `${sIndent}<p id="${sIdDescIn}">description::`,
    `${sIndent}  <br>× Mcsh-creation: {${sDateIn}}`,
    `${sIndent}  <a class="clsHide" href="#${sIdDescIn}"></a></p>`
  ] };
}

/**
 * OUTPUT: the-indentation of the-line after a-para-opening, for a-line inserted there.
 */
function fFindIndentNext(aLineIn, nOpenIn, sIndentOpenIn) {
  return (aLineIn[nOpenIn + 1] ?? '').match(/^( *)/)[1] || sIndentOpenIn + '  ';
}

/**
 * DOING: it applies edits bottom-up: an-edit shifts only the-lines below it.
 * OUTPUT: the-new text.
 */
function fApplyEdit(aLineIn, aoEditIn) {
  const aLineNew = aLineIn.slice();
  for (const oEdit of aoEditIn.slice().sort((oA, oB) => oB.nAt - oA.nAt)) {
    aLineNew.splice(oEdit.nAt, oEdit.nDel, ...oEdit.aIns);
  }
  return aLineNew.join('\n');
}

/**
 * DOING: DEFAULT mode: it reads one file and plans its edits, it changes nothing.
 * OUTPUT: { aoEdit, aoNote, sRawNew } — aoNote: what it does or skips, per para.
 */
function fPlanFile(sRawIn, sNameShortIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];   // {nAt, nDel, aIns}: at index nAt delete nDel lines and insert aIns
  const aoNote = [];

  for (let nL = 0; nL < aLine.length; nL++) {
    const aOpen = fLineClean(aLine[nL]).match(rParaOpen);
    if (!aOpen) continue;
    const aKind = fLineClean(aLine[nL + 1]).match(rParaKind);
    if (!aKind) continue;
    const [, , sIdPara, sDate] = aOpen;
    const sLoc = `${sNameShortIn}:${nL + 1}`;

    // ── the-para must be ONLY the-creation: optional creation-line, then its clsHide ──
    let nEnd = nL + 2;
    if (rParaCrea.test(fLineClean(aLine[nEnd]))) nEnd++;
    const sAnchor = `<a class="clsHide" href="#${sIdPara}"></a></p>`;
    if (fLineClean(aLine[nEnd]).trim() !== sAnchor) {
      aoNote.push(`SKIP   ${sLoc}  the-para holds more than the-creation-line`);
      continue;
    }

    // ── its section ───────────────────────────────────────────────────────────
    const nSect = fFindSectOpen(aLine, nL);
    if (nSect === -1) { aoNote.push(`SKIP   ${sLoc}  the-para is not inside a-section`); continue; }
    const sIdSect = aLine[nSect].match(rSectOpen)?.[1];
    const nOwnEnd = fFindSectOwnEnd(aLine, nSect);
    const nHeadEnd = fFindHeadEnd(aLine, nSect, nOwnEnd);
    if (!sIdSect || nHeadEnd === -1) {
      aoNote.push(`SKIP   ${sLoc}  its section has no id or no heading`);
      continue;
    }

    // ── its description:: ─────────────────────────────────────────────────────
    let nDesc = -1, bDescOther = false;
    for (let nD = nHeadEnd + 1; nD < nOwnEnd; nD++) {
      if (rDescOpen.test(fLineClean(aLine[nD]))) { nDesc = nD; break; }
      if (aLine[nD].includes('description::')) bDescOther = true;
    }
    if (nDesc === -1 && bDescOther) {
      aoNote.push(`SKIP   ${sLoc}  #${sIdSect} has a-description:: of an-other form`);
      continue;
    }
    const sLineCrea = `<br>× Mcsh-creation: {${sDate}}`;
    const oEditDel = { nAt: nL, nDel: nEnd - nL + 1, aIns: [] };

    if (nDesc !== -1) {
      // the-description-para, to its </p>
      let nDescEnd = nDesc;
      while (nDescEnd < nOwnEnd && !aLine[nDescEnd].includes('</p>')) nDescEnd++;
      const sDescText = aLine.slice(nDesc, nDescEnd + 1).join('\n');
      const aDescOpen = fLineClean(aLine[nDesc]).match(rDescOpen);
      const sIdDesc = aDescOpen[2];
      const aCrea = sDescText.match(rCreaDesc);
      if (aCrea && aCrea[1] !== sDate) {
        aoNote.push(`SKIP   ${sLoc}  #${sIdDesc} says {${aCrea[1]}}, the-para {${sDate}}: an-other creation-date`);
        continue;
      }
      aoEdit.push(oEditDel);
      if (aCrea) {
        aoNote.push(`DELETE ${sLoc}  {${sDate}}, #${sIdDesc} has the-date already`);
      } else {
        // the-line goes first, with the-indentation of the-line after description::
        aoEdit.push({ nAt: nDesc + 1, nDel: 0,
          aIns: [fFindIndentNext(aLine, nDesc, aDescOpen[1]) + sLineCrea] });
        aoNote.push(`INSERT ${sLoc}  {${sDate}} into #${sIdDesc}, para deleted`);
      }
    } else {
      // no description: we create it right after the-heading
      const sIdDesc = sIdSect + 'dsn';
      if (sRawIn.includes(`id="${sIdDesc}"`)) {
        aoNote.push(`SKIP   ${sLoc}  #${sIdSect} has no description:: and id ${sIdDesc} is taken`);
        continue;
      }
      aoEdit.push(oEditDel);
      aoEdit.push(fMakeDescNew(aLine, nSect, nHeadEnd, nOwnEnd, sIdDesc, sDate));
      aoNote.push(`CREATE ${sLoc}  {${sDate}} as #${sIdDesc}, para deleted`);
    }
  }
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: --missing mode: for the-sections of one file without description::,
 *   it plans a-new description (or a-fixed typo-title), it changes nothing.
 * INPUT: the-ids of the-sections, as the-validator reports them (Mcsh02).
 * OUTPUT: { aoEdit, aoNote, sRawNew }
 */
function fPlanMissing(sRawIn, sNameShortIn, aIdSectIn, sDateIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  const sLineCrea = `<br>× Mcsh-creation: {${sDateIn}}`;

  for (const sIdSect of [...new Set(aIdSectIn)]) {
    // the-section by its <section id> tag, NOT by the-first id="..": a-<p> may share it
    const aIdx = [];
    aLine.forEach((sLine, nL) => {
      if (fLineClean(sLine).match(rSectOpen)?.[1] === sIdSect) aIdx.push(nL);
    });
    if (aIdx.length !== 1) {
      aoNote.push(`SKIP   ${sNameShortIn}  #${sIdSect} occurs ${aIdx.length} times as <section id>`);
      continue;
    }
    const nSect = aIdx[0];
    const sLoc = `${sNameShortIn}:${nSect + 1}`;
    const nOwnEnd = fFindSectOwnEnd(aLine, nSect);
    const nHeadEnd = fFindHeadEnd(aLine, nSect, nOwnEnd);
    if (nHeadEnd === -1) { aoNote.push(`SKIP   ${sLoc}  #${sIdSect} has no heading`); continue; }

    // ── a-description with a-typo-title: we fix the-title ─────────────────────
    let nTypo = -1, aTypo = null, nLike = -1;
    for (let nD = nHeadEnd + 1; nD < nOwnEnd; nD++) {
      const sLine = fLineClean(aLine[nD]);
      aTypo = sLine.match(rDescTypo);
      if (aTypo) { nTypo = nD; break; }
      if (nLike === -1 && rDescLike.test(sLine)) nLike = nD;
    }
    if (nTypo !== -1) {
      const [, sIndentOpen, sIdDesc, sTitleTypo] = aTypo;
      aoEdit.push({ nAt: nTypo, nDel: 1,
        aIns: [aLine[nTypo].replace(`>${sTitleTypo}::`, '>description::')] });
      let nDescEnd = nTypo;
      while (nDescEnd < nOwnEnd && !aLine[nDescEnd].includes('</p>')) nDescEnd++;
      const bCrea = rCreaDesc.test(aLine.slice(nTypo, nDescEnd + 1).join('\n'));
      if (!bCrea) {
        aoEdit.push({ nAt: nTypo + 1, nDel: 0,
          aIns: [fFindIndentNext(aLine, nTypo, sIndentOpen) + sLineCrea] });
      }
      aoNote.push(`FIXTITLE ${sLoc}  #${sIdDesc} ${sTitleTypo}:: -> description::` +
        (bCrea ? '' : `, {${sDateIn}} inserted`));
      continue;
    }
    if (nLike !== -1) {
      aoNote.push(`SKIP   ${sNameShortIn}:${nLike + 1}  #${sIdSect} has an-other description-title: ` +
        fLineClean(aLine[nLike]).trim().slice(0, 60));
      continue;
    }

    // ── no description: we create it right after the-heading ─────────────────
    const sIdDesc = sIdSect + 'dsn';
    if (sRawIn.includes(`id="${sIdDesc}"`)) {
      aoNote.push(`SKIP   ${sLoc}  #${sIdSect} has no description:: and id ${sIdDesc} is taken`);
      continue;
    }
    aoEdit.push(fMakeDescNew(aLine, nSect, nHeadEnd, nOwnEnd, sIdDesc, sDateIn));
    aoNote.push(`CREATE ${sLoc}  {${sDateIn}} as #${sIdDesc}`);
  }
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: it checks a-planned-file before it is written.
 * OUTPUT: '' when good, else the-problem.
 */
function fCheckFile(sRawOldIn, sRawNewIn) {
  for (const sTag of ['<section', '</section>']) {
    if (fCount(sRawOldIn, sTag) !== fCount(sRawNewIn, sTag)) return `${sTag} count changed`;
  }
  const aId = [...sRawNewIn.matchAll(/\bid="([^"]+)"/g)].map(aM => aM[1]);
  const aIdOld = new Set([...sRawOldIn.matchAll(/\bid="([^"]+)"/g)].map(aM => aM[1]));
  const oSeen = new Set();
  for (const sId of aId) {
    if (oSeen.has(sId) && !aIdOld.has(sId)) return `id ${sId} is duplicated`;
    oSeen.add(sId);
  }
  return '';
}

async function fMain() {
  const aArg = process.argv.slice(2);
  const sNameDir = aArg.find(sArg => !sArg.startsWith('--'));
  const bFix = aArg.includes('--fix');
  const bMissing = aArg.includes('--missing');
  if (!sNameDir) {
    console.log('creaMcsh.mjs - it puts the-Mcsh-creation-date in the-description:: of sections');
    console.log('  ' + aVersion[0]);
    console.log('');
    console.log('USAGE: node dirValid/creaMcsh.mjs <sNameDir> [--missing] [--fix]');
    console.log('  sNameDir     the-path of the-dirMcsh-worldview');
    console.log('  (default)    the-creation-para of evoluting-sections -> their description::');
    console.log('  --missing    a-description:: with the-run-date for every Mcsh02-section');
    console.log('  --fix        it WRITES the-files; without it a-dry-run');
    console.log('  OUTPUT: dirValid/creaMcsh.txt; with --fix also dirValid/creaMcsh-backup/<time>/');
    process.exit(1);
  }

  // a-NEW backup-folder per run: a-second run must never overwrite the-originals of a-first
  const sTime = fFindDateLocal(true);
  let sDirBackup = moPath.join(sDirScript, 'creaMcsh-backup', sTime);
  for (let nN = 2; moFs.existsSync(sDirBackup); nN++) {
    sDirBackup = moPath.join(sDirScript, 'creaMcsh-backup', `${sTime}-${nN}`);
  }
  const aLineOut = [];
  const oCount = { nFile: 0, nBad: 0 };

  /**
   * DOING: it counts the-notes of a-file, checks its new text, backs it up and writes it.
   */
  function fWriteFile(sPathFileIn, sRawIn, sNameShortIn, oPlanIn) {
    aLineOut.push(...oPlanIn.aoNote);
    for (const sNote of oPlanIn.aoNote) {
      const sKind = sNote.split(' ')[0];
      oCount[sKind] = (oCount[sKind] ?? 0) + 1;
    }
    if (oPlanIn.aoEdit.length === 0) return;
    const sProblem = fCheckFile(sRawIn, oPlanIn.sRawNew);
    if (sProblem) {
      aLineOut.push(`BAD    ${sNameShortIn}  ${sProblem} — the-file is NOT written`);
      oCount.nBad++;
      return;
    }
    oCount.nFile++;
    if (bFix) {
      // the-backup first, then the-file
      const sPathBackup = moPath.join(sDirBackup, moPath.relative(sNameDir, sPathFileIn));
      moFs.mkdirSync(moPath.dirname(sPathBackup), { recursive: true });
      // COPYFILE_EXCL: it fails rather than overwrite a-backup
      moFs.copyFileSync(sPathFileIn, sPathBackup, moFs.constants.COPYFILE_EXCL);
      moFs.writeFileSync(sPathFileIn, oPlanIn.sRawNew);
    }
  }

  let sCount;
  if (!bMissing) {
    for (const sPathFile of fFindFileAll(sNameDir)) {
      const sRaw = moFs.readFileSync(sPathFile, 'utf8');
      if (!sRaw.includes('=== McsHitp-creation:') && !sRaw.includes('=== webpage creation:')) continue;
      const sNameShort = moPath.basename(sPathFile).replace(/\.last\.html$/, '');
      fWriteFile(sPathFile, sRaw, sNameShort, fPlanFile(sRaw, sNameShort));
    }
    const nCreate = oCount.CREATE ?? 0, nInsert = oCount.INSERT ?? 0, nDelete = oCount.DELETE ?? 0;
    sCount = `${nCreate + nInsert + nDelete} paras deleted · ${nCreate} descriptions created · ` +
      `${nInsert} lines inserted`;
  } else {
    // the-sections without description:: are what the-VALIDATOR says: Mcsh02
    const sDate = fFindDateLocal();
    const aoFileHitp = fReadFileAllHitp(sNameDir).filter(oFile => oFile.sNameFile.startsWith('Mcsh'));
    const aoCnptFile = await Promise.all(aoFileHitp.map(oFile =>
      fReadFileMcsh(sNameDir, moPath.relative(sNameDir, oFile.sPathFile))));
    const ooIdSect = {};
    for (const oIssue of fRunChecksMcsh(aoCnptFile, sNameDir, true)) {
      if (oIssue.sCode === 'Mcsh02') (ooIdSect[oIssue.sNameFile] ??= []).push(oIssue.sIdConcept);
    }
    const oPathFile = Object.fromEntries(aoFileHitp.map(oFile => [oFile.sNameFile, oFile.sPathFile]));
    for (const [sNameFile, aIdSect] of Object.entries(ooIdSect).sort()) {
      const sPathFile = oPathFile[sNameFile];
      const sRaw = moFs.readFileSync(sPathFile, 'utf8');
      const sNameShort = sNameFile.replace(/\.last\.html$/, '');
      fWriteFile(sPathFile, sRaw, sNameShort, fPlanMissing(sRaw, sNameShort, aIdSect, sDate));
    }
    sCount = `${oCount.CREATE ?? 0} descriptions created · ${oCount.FIXTITLE ?? 0} titles fixed · ` +
      `date {${sDate}}`;
  }

  const aHead = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `  creaMcsh${bMissing ? ' --missing' : ''} ${bFix ? '--fix' : 'dry-run'}: ${sNameDir}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `  ${oCount.nFile} files ${bFix ? 'written' : 'to write'} · ${sCount} · ` +
      `${oCount.SKIP ?? 0} skipped` + (oCount.nBad ? ` · ${oCount.nBad} BAD` : ''),
    bFix ? `  backup: ${sDirBackup}` : '  nothing written: add --fix to write',
    ''
  ];
  // in the-report: skips and bad first, they need you
  const aLineSort = [
    ...aLineOut.filter(sLine => /^(SKIP|BAD)/.test(sLine)),
    ...aLineOut.filter(sLine => !/^(SKIP|BAD)/.test(sLine))
  ];
  const sPathOut = moPath.join(sDirScript, 'creaMcsh.txt');
  moFs.writeFileSync(sPathOut, [...aHead, ...aLineSort].join('\n') + '\n');
  for (const sLine of aHead.slice(0, 5)) console.log(sLine);
  for (const sLine of aLineSort.filter(sLine => /^(SKIP|BAD)/.test(sLine))) console.log('  ' + sLine);
  console.log(`📄 report written: ${sPathOut}`);
}

fMain().catch(oErr => {
  console.error('\n❌ Fatal error:', oErr.message);
  process.exit(1);
});
