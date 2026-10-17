#!/usr/bin/env node
/*
 * createMcsh.mjs - it puts the-Mcsh-creation-date in the-description:: of sections
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
 *   --missing: every section the-validator reports as Mvrw01 (no description::)
 *   gets a-description:: with the-date of the-run, right after its heading.
 *   A-description with a-typo-title (Descripton::, descption::) gets its title
 *   fixed instead. It SKIPS and reports: a-section-id that occurs 2+ times,
 *   a-taken <section-id>dsn, an-other description-title (descriptionLong::).
 *
 *   --overview: the-description:: of idOverview without × Mcsh-creation gets the-date
 *   of the-file's end, <p id="idMetaVersion">webpage-versions::, from the-line
 *     <br>• version.0-1-0.2019-09-06 draft creation,
 *   else from the-earliest dated version-line when that is 0-x-x or 1-0-0.
 *   It SKIPS a-file without such a-date, and reports as NODESC an-idOverview
 *   without description::.
 *
 *   --undated: EVERY description:: without × Mcsh-creation gets the-run-date as
 *   its first line (plain and div form). A-description the-validator's Mvrw02
 *   calls empty is reported EMPTY, since afterwards Mvrw02 no longer sees it.
 *   It SKIPS a-title-line with text after description::.
 *
 *   --nameid: the-name::-para of idOverview gets the-id idName (its <p id> and its
 *   own clsHide-anchor). It SKIPS when idName is used, the-old id is not unique,
 *   or any file links to the-old id.
 *
 *   --headgap: the-obvious Hvrw07 heading-gaps (h1 → h3) of Mcsh* files and the-law
 *   Hitp* files of dirStnlaw: a-part deeper than its whole's level + 1 moves up,
 *   with its parts. A-law-article (Article, Άρθρο) keeps its level: in a-law all
 *   articles have the-same level. Other Hitp* files are not touched.
 *
 *   --nest: the-obvious Hvrw08 nesting-errors, same files as --headgap: a-whole
 *   whose parts from X on have its OWN level gets its </section> moved before X.
 *
 * INPUT: the-path of a-dirMcsh-worldview.
 * OUTPUT: dry-run by default: what it would do. With --fix it writes the-files,
 *   after it copies each one into dirValid/createMcsh-backup/<time>/.
 *   The-report goes to dirValid/createMcsh.txt.
 * RUN:
 *   node dirValid/createMcsh.mjs <sNameDir> [--missing|--overview|--undated|--nameid|--headgap|--nest] [--fix]
 */

import moFs from 'fs'
import moPath from 'path'
import { fileURLToPath } from 'url'
import { fReadFileAllHitp } from './parserHitp.js'
import { fReadFileMcsh, fStripTags } from './parserMcsh.js'
import { fRunChecksMcsh } from './structuralMcsh.js'
import { rHeadArticle } from './structuralHitp.js'

const
  // contains the-versions of createMcsh.mjs
  aVersion = [
    'createMcsh.mjs.0-9-0.2026-10-16: createMcsh.txt per kind, notes indented for folding',
    'createMcsh.mjs.0-8-0.2026-10-15: --nest, the-obvious Hvrw08 nesting errors',
    'createMcsh.mjs.0-7-0.2026-10-15: --headgap exempts law articles, law files included',
    'createMcsh.mjs.0-6-0.2026-10-15: --headgap, the-obvious Hvrw07 heading gaps',
    'createMcsh.mjs.0-5-0.2026-10-04: --nameid, idOverview name::-para id = idName',
    'createMcsh.mjs.0-4-0.2026-10-04: --undated, every description gets a-creation-date',
    'createMcsh.mjs.0-3-0.2026-10-04: --overview; renamed from creaMcsh.mjs',
    'creaMcsh.mjs.0-2-0.2026-10-04: --missing, a-description for every Mcsh02-section',
    'creaMcsh.mjs.0-1-0.2026-10-04: creation'
  ],
  // the-kinds of notes in createMcsh.txt, one === heading each
  ooKindDesc = {
    NODESC:   'idOverview without description::',
    EMPTY:    'a-description:: that was empty (only "·"), now dated: give it a-text',
    SKIP:     'skipped, with why: fix by hand',
    BAD:      'the-file is NOT written: its check failed',
    DELETE:   'a-creation-para deleted, its date put in the-description::',
    CREATE:   'a-new description:: created',
    INSERT:   'a-creation-date inserted in a-description::',
    FIXTITLE: 'a-typo description-title fixed',
    RENAME:   'the-name::-para id renamed to idName',
    HEADING:  'a-heading moved up (Hvrw07 gap)',
    NEST:     'a-</section> moved up (Hvrw08 nesting)'
  },
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
  rCreaDesc  = /× Mcsh-creation:\s*\{([0-9-]+)\}/,
  // a-dated version-line in webpage-versions: <br>• version.0-1-0.2019-09-06 draft creation,
  rVersion   = /<br>• version\.(\d+-\d+-\d+)\.(\d{4}-\d{2}-\d{2})/g,
  // a-div-description: <div id="..."> and on the-next line <p>description::
  rDescDiv   = /^( *)<p>description::\s*$/,
  rDivOpen   = /<div\b[^>]*\bid="([^"]+)"/,
  // a-title-line with text after description:: on the-same line
  rDescSame  = /^ *<p id="([^"]+)">description::\s*\S/

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
      if (['node_modules', '.git'].includes(oEnt.name) || oEnt.name.startsWith('createMcsh-backup')) continue;
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
 * INPUT: the-ids of the-sections, as the-validator reports them (Mvrw01).
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
 * DOING: --overview mode: when the-description:: of idOverview has no
 *   × Mcsh-creation, it takes the-date from the-end of the-file, the-para
 *   <p id="idMetaVersion">webpage-versions:: — the-line version.0-1-0.<date>,
 *   else the-earliest dated version-line — and inserts it as the-first line.
 *   An-idOverview with NO description:: is reported as NODESC.
 * OUTPUT: { aoEdit, aoNote, sRawNew }
 */
function fPlanOverview(sRawIn, sNameShortIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  const fDone = () => ({ aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) });

  const nSect = aLine.findIndex(sLine => fLineClean(sLine).match(rSectOpen)?.[1] === 'idOverview');
  if (nSect === -1) {
    aoNote.push(`NODESC ${sNameShortIn}  has no <section id="idOverview">`);
    return fDone();
  }
  const sLoc = `${sNameShortIn}:${nSect + 1}`;
  const nOwnEnd = fFindSectOwnEnd(aLine, nSect);
  let nDesc = -1;
  for (let nD = nSect + 1; nD < nOwnEnd; nD++) {
    if (rDescOpen.test(fLineClean(aLine[nD]))) { nDesc = nD; break; }
  }
  if (nDesc === -1) {
    // what the-idOverview holds instead, so you see what to add
    const aTitle = aLine.slice(nSect + 1, nOwnEnd)
      .map(sLine => (fLineClean(sLine).match(/^ *<p id="[^"]+">([^:<\n]+)::/) ?? [])[1])
      .filter(Boolean);
    aoNote.push(`NODESC ${sLoc}  idOverview has no description::, it holds: ` +
      (aTitle.length ? aTitle.join(', ') + '::' : 'no titled para'));
    return fDone();
  }

  let nDescEnd = nDesc;
  while (nDescEnd < nOwnEnd && !aLine[nDescEnd].includes('</p>')) nDescEnd++;
  if (rCreaDesc.test(aLine.slice(nDesc, nDescEnd + 1).join('\n'))) return fDone();

  // ── the-date from the-end of the-file ───────────────────────────────────────
  const sParaVer = sRawIn.match(/<p id="idMetaVersion">[\s\S]*?<\/p>/)?.[0] ?? '';
  const aoVer = [...sParaVer.matchAll(rVersion)].map(aM => ({ sVer: aM[1], sDate: aM[2] }));
  const oVer010 = aoVer.find(oVer => oVer.sVer === '0-1-0');
  const oVer = oVer010 ?? aoVer.slice().sort((oA, oB) => oA.sDate.localeCompare(oB.sDate))[0];
  const aDescOpen = fLineClean(aLine[nDesc]).match(rDescOpen);
  if (!oVer) {
    aoNote.push(`SKIP   ${sLoc}  #${aDescOpen[2]} has no × Mcsh-creation and the-file's end has no dated version-line`);
    return fDone();
  }
  // the-earliest RECORDED version is the-creation only when it is 0-x-x or 1-0-0:
  // a-first record version.17-0-0 means the-earlier versions are not recorded.
  if (!oVer010 && !/^(0-\d+-\d+|1-0-0)$/.test(oVer.sVer)) {
    aoNote.push(`SKIP   ${sLoc}  #${aDescOpen[2]} has no × Mcsh-creation and the-earliest recorded ` +
      `version is version.${oVer.sVer}.${oVer.sDate}: not the-creation`);
    return fDone();
  }
  aoEdit.push({ nAt: nDesc + 1, nDel: 0,
    aIns: [fFindIndentNext(aLine, nDesc, aDescOpen[1]) + `<br>× Mcsh-creation: {${oVer.sDate}}`] });
  aoNote.push(`INSERT ${sLoc}  {${oVer.sDate}} into #${aDescOpen[2]}, from version.${oVer.sVer}` +
    (oVer010 ? '' : ' (the-earliest)'));
  return fDone();
}

/**
 * DOING: --undated mode: EVERY description:: of a-file without × Mcsh-creation
 *   gets "<br>× Mcsh-creation: {date}" as its first line: the-plain form
 *   <p id="..">description:: and the-div form <div id=".."> + <p>description::.
 *   A-description that the-validator's Mvrw02 calls empty is noted EMPTY first,
 *   because after the-insertion Mvrw02 no longer sees it as empty.
 * OUTPUT: { aoEdit, aoNote, sRawNew }, one INSERT-note per file with the-count.
 */
function fPlanUndated(sRawIn, sNameShortIn, sDateIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  let nInsert = 0;

  for (let nL = 0; nL < aLine.length; nL++) {
    const sLine = fLineClean(aLine[nL]);
    let sIdDesc = null, sIndentOpen = '', sCloser = '</p>';
    const aPlain = sLine.match(rDescOpen);
    const aDiv = sLine.match(rDescDiv);
    if (aPlain) {
      [, sIndentOpen, sIdDesc] = aPlain;
    } else if (aDiv && rDivOpen.test(aLine[nL - 1] ?? '')) {
      sIndentOpen = aDiv[1];
      sIdDesc = aLine[nL - 1].match(rDivOpen)[1];
      sCloser = '</div>';
    } else if (rDescSame.test(sLine)) {
      aoNote.push(`SKIP   ${sNameShortIn}:${nL + 1}  #${sLine.match(rDescSame)[1]} has text on its description::-line`);
      continue;
    } else {
      continue;
    }

    // its text, to its </p> or </div>
    let nEnd = nL;
    while (nEnd < aLine.length - 1 && !aLine[nEnd].includes(sCloser)) nEnd++;
    const sText = aLine.slice(nL, nEnd + 1).join('\n');
    if (rCreaDesc.test(sText)) continue;

    // the-Mvrw02-test of structuralMcsh.js: empty = nothing but "·", "×", spaces
    const sContent = fStripTags(sText).replace(/^description::\s*/i, '').replace(/[·\s×]/g, '').trim();
    if (sContent.length === 0) {
      aoNote.push(`EMPTY  ${sNameShortIn}:${nL + 1}  #${sIdDesc} description:: has no content`);
    }
    aoEdit.push({ nAt: nL + 1, nDel: 0,
      aIns: [fFindIndentNext(aLine, nL, sIndentOpen) + `<br>× Mcsh-creation: {${sDateIn}}`] });
    nInsert++;
  }
  if (nInsert > 0) aoNote.push(`INSERT ${sNameShortIn}  ${nInsert} descriptions`);
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: --nameid mode: the-name::-para of idOverview gets the-id idName, as
 *   in most files. It renames 2 lines: <p id="X">name:: and its own
 *   <a class="clsHide" href="#X"></a></p>.
 *   It SKIPS, so a-rename never breaks anything: idName used already in the-file,
 *   X used twice, or ANY link to X: in the-file beyond its own anchor, or
 *   <file>#X from an-other file.
 * INPUT: sNameFileIn: McshCor000017.last.html, aRawAllIn: the-texts of all files.
 * OUTPUT: { aoEdit, aoNote, sRawNew }
 */
function fPlanNameId(sRawIn, sNameShortIn, sNameFileIn, aRawAllIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  const fDone = () => ({ aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) });

  const nSect = aLine.findIndex(sLine => fLineClean(sLine).match(rSectOpen)?.[1] === 'idOverview');
  if (nSect === -1) return fDone();
  const nOwnEnd = fFindSectOwnEnd(aLine, nSect);
  let nName = -1, sId = null;
  for (let nN = nSect + 1; nN < nOwnEnd; nN++) {
    const aName = fLineClean(aLine[nN]).match(/^ *<p id="([^"]+)">name::/);
    if (aName) { nName = nN; sId = aName[1]; break; }
  }
  if (nName === -1 || sId === 'idName') return fDone();
  const sLoc = `${sNameShortIn}:${nName + 1}`;

  // ── the-guards ──────────────────────────────────────────────────────────────
  const sAnchor = `<a class="clsHide" href="#${sId}"></a></p>`;
  if (sRawIn.includes('id="idName"')) {
    aoNote.push(`SKIP   ${sLoc}  #${sId}: idName is used already in the-file`);
    return fDone();
  }
  if (fCount(sRawIn, `id="${sId}"`) !== 1) {
    aoNote.push(`SKIP   ${sLoc}  #${sId} occurs ${fCount(sRawIn, `id="${sId}"`)} times as an-id`);
    return fDone();
  }
  const nLinkIn = fCount(sRawIn, `href="#${sId}"`) - fCount(sRawIn, `class="clsHide" href="#${sId}"`);
  const nLinkOut = aRawAllIn.reduce((nSum, sRaw) => nSum + fCount(sRaw, `${sNameFileIn}#${sId}"`), 0);
  if (nLinkIn > 0 || nLinkOut > 0) {
    aoNote.push(`SKIP   ${sLoc}  #${sId} has links: ${nLinkIn} in the-file, ${nLinkOut} from other files`);
    return fDone();
  }
  // its own anchor, on the-para's closing line
  let nEnd = nName;
  while (nEnd < nOwnEnd && !aLine[nEnd].includes('</p>')) nEnd++;
  if (!aLine[nEnd].includes(sAnchor)) {
    aoNote.push(`SKIP   ${sLoc}  #${sId}: its closing line is not ${sAnchor}`);
    return fDone();
  }

  const fRenameOpen = sLine => sLine.replace(`<p id="${sId}">`, '<p id="idName">');
  const fRenameAnchor = sLine => sLine.replace(sAnchor, '<a class="clsHide" href="#idName"></a></p>');
  if (nEnd === nName) {
    // a-one-line para: ONE edit, two edits on one line would undo each other
    aoEdit.push({ nAt: nName, nDel: 1, aIns: [fRenameAnchor(fRenameOpen(aLine[nName]))] });
  } else {
    aoEdit.push({ nAt: nName, nDel: 1, aIns: [fRenameOpen(aLine[nName])] });
    aoEdit.push({ nAt: nEnd, nDel: 1, aIns: [fRenameAnchor(aLine[nEnd])] });
  }
  aoNote.push(`RENAME ${sLoc}  #${sId} -> #idName`);
  return fDone();
}

/**
 * DOING: --headgap mode: the-obvious Hvrw07 heading-gaps. It trusts the-<section>
 *   nesting and walks it top-down: a-top-level section is h1, a-part is its
 *   whole's level + 1. A-part DEEPER than that (h1 → h3) moves up, and its parts
 *   move with it. A-part at its whole's level or above (h2 in h2, h1 in h2), or
 *   a-top-level not h1, means a-wrong nesting: its subtree is left untouched.
 *   A-law-article (rHeadArticle) never moves: its parts are walked from ITS level.
 *   A-move edits the-heading-lines only: <h3 id="xH3"> → <h2 id="xH2">, its
 *   clsHide-anchor #xH3 → #xH2, </h3> → </h2>.
 *   It SKIPS, with its subtree: a-section-id not unique, a-heading not found,
 *   a-new id taken, ANY link to the-old heading-id (in the-file beyond its own
 *   anchor, or <file>#id from an-other file).
 * INPUT: oFileHitpIn: the-file from fReadFileAllHitp (its aoSect gives the-tree),
 *   aRawAllIn: the-texts of all files.
 * OUTPUT: { aoEdit, aoNote, sRawNew }
 */
function fPlanHeadGap(sRawIn, sNameShortIn, sNameFileIn, oFileHitpIn, aRawAllIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];

  // the-tree: the-parts of each whole, in document order
  const aoSect = oFileHitpIn.aoSect.filter(oSect =>
    oSect.sNameId && oSect.nLine != null && oSect.nHeadingLevel != null);
  const oSetIdSect = new Set(aoSect.map(oSect => oSect.sNameId));
  const oMapPart = new Map();
  for (const oSect of aoSect) {
    const sIdWhole = oSect.sIdWhole_elmt ?? null;
    if (!oMapPart.has(sIdWhole)) oMapPart.set(sIdWhole, []);
    oMapPart.get(sIdWhole).push(oSect);
  }
  for (const aoPart of oMapPart.values()) aoPart.sort((oA, oB) => oA.nLine - oB.nLine);

  /**
   * DOING: it plans the-move of one heading from level nLevelIn to nLevelNewIn.
   * OUTPUT: true when planned, false when skipped (a-note says why).
   */
  function fMove(oSectIn, nLevelIn, nLevelNewIn) {
    const sLoc = `${sNameShortIn}:${oSectIn.nLine}`;
    const fSkip = sWhy => { aoNote.push(`SKIP   ${sLoc}  #${oSectIn.sNameId}: ${sWhy}`); return false; };
    if (fCount(sRawIn, `id="${oSectIn.sNameId}"`) !== 1) return fSkip('the-section-id is not unique');
    const nSect = oSectIn.nLine - 1;
    if (fLineClean(aLine[nSect]).match(rSectOpen)?.[1] !== oSectIn.sNameId) return fSkip('its <section> is not on its line');
    const nOwnEnd = fFindSectOwnEnd(aLine, nSect);
    let nHead = -1, sId = null;
    for (let nH = nSect + 1; nH < nOwnEnd; nH++) {
      const aHead = aLine[nH].match(/<h([1-9]) id="([^"]+)"/);
      if (aHead) { if (Number(aHead[1]) === nLevelIn) { nHead = nH; sId = aHead[2]; } break; }
    }
    if (nHead === -1) return fSkip(`no <h${nLevelIn} id> heading`);
    let nClose = nHead;
    while (nClose < nOwnEnd && !aLine[nClose].includes(`</h${nLevelIn}>`)) nClose++;
    if (nClose === nOwnEnd) return fSkip(`no </h${nLevelIn}>`);

    // the-id carries its level: idXH3 → idXH2; other ids stay
    const sIdNew = sId.endsWith(`H${nLevelIn}`) ? sId.slice(0, -1) + nLevelNewIn : sId;
    if (sIdNew !== sId) {
      if (sRawIn.includes(`id="${sIdNew}"`)) return fSkip(`the-new id ${sIdNew} is taken`);
      const nLinkIn = fCount(sRawIn, `href="#${sId}"`) - fCount(sRawIn, `class="clsHide" href="#${sId}"`);
      const nLinkOut = aRawAllIn.reduce((nSum, sRaw) => nSum + fCount(sRaw, `${sNameFileIn}#${sId}"`), 0);
      if (nLinkIn > 0 || nLinkOut > 0) {
        return fSkip(`#${sId} has links: ${nLinkIn} in the-file, ${nLinkOut} from other files`);
      }
    }

    // one edit per changed line, so 2 changes on one line never undo each other
    for (let nL = nHead; nL <= nClose; nL++) {
      let sLine = aLine[nL];
      if (nL === nHead) sLine = sLine.replace(`<h${nLevelIn} id="${sId}"`, `<h${nLevelNewIn} id="${sIdNew}"`);
      sLine = sLine.replace(`class="clsHide" href="#${sId}"`, `class="clsHide" href="#${sIdNew}"`);
      if (nL === nClose) sLine = sLine.replace(`</h${nLevelIn}>`, `</h${nLevelNewIn}>`);
      if (sLine !== aLine[nL]) aoEdit.push({ nAt: nL, nDel: 1, aIns: [sLine] });
    }
    aoNote.push(`HEADING ${sLoc}  #${sId} h${nLevelIn} -> h${nLevelNewIn}`);
    return true;
  }

  function fWalk(oSectIn, nLevelExpectIn) {
    let nLevelNew;
    if (rHeadArticle.test(oSectIn.sNameTitle)) {
      nLevelNew = oSectIn.nHeadingLevel; // in a-law all articles have the-same level
    } else if (oSectIn.nHeadingLevel === nLevelExpectIn) {
      nLevelNew = nLevelExpectIn;
    } else if (oSectIn.nHeadingLevel > nLevelExpectIn && nLevelExpectIn > 1) {
      if (!fMove(oSectIn, oSectIn.nHeadingLevel, nLevelExpectIn)) return;
      nLevelNew = nLevelExpectIn;
    } else {
      return; // a-wrong nesting, not obvious
    }
    for (const oPart of oMapPart.get(oSectIn.sNameId) ?? []) fWalk(oPart, nLevelNew + 1);
  }

  // the-roots: top-level (h1), or a-whole without heading (its own level)
  for (const oSect of aoSect) {
    if (oSect.sIdWhole_elmt == null) fWalk(oSect, 1);
    else if (!oSetIdSect.has(oSect.sIdWhole_elmt)) fWalk(oSect, oSect.nHeadingLevel);
  }
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: --nest mode: the-obvious Hvrw08 nesting-errors. A-whole Y contains, from
 *   a-part X on, parts at Y's OWN level (h2 in h2): the-</section> of Y belongs
 *   before X. It MOVES that line: the-</section> of Y goes right before X (before
 *   the-blank line above X), and the-old one is deleted. X and the-parts after it
 *   become siblings of Y.
 *   Obvious only when, else SKIP with a-note:
 *   - the-file has no unclosed or stray <section> (Hvre07), no duplicated id of Y or its parts,
 *   - Y is no law-article, and EVERY part of Y from X on has Y's level
 *     (a-part above it, h1 in h2, may be a-wrong heading, not a-wrong nesting),
 *   - between X and the-old </section>, Y has no own text: only its parts and blank lines,
 *   - the-old line is only </section>, X's line is only its <section id>.
 * INPUT: oFileHitpIn: the-file from fReadFileAllHitp.
 * OUTPUT: { aoEdit, aoNote, sRawNew }
 */
function fPlanNest(sRawIn, sNameShortIn, oFileHitpIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  const fDone = () => ({ aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) });

  const aoSect = oFileHitpIn.aoSect.filter(oSect =>
    oSect.sNameId && oSect.nLine != null && oSect.nHeadingLevel != null);
  const oMapSect = new Map(aoSect.map(oSect => [oSect.sNameId, oSect]));
  const oMapPart = new Map();
  for (const oSect of aoSect) {
    if (!oSect.sIdWhole_elmt) continue;
    if (!oMapPart.has(oSect.sIdWhole_elmt)) oMapPart.set(oSect.sIdWhole_elmt, []);
    oMapPart.get(oSect.sIdWhole_elmt).push(oSect);
  }
  const oSetIdDup = new Set(oFileHitpIn.aoIdDup.map(oDup => oDup.sName));
  const bTagBad = oFileHitpIn.aoTagBad.some(oBad => oBad.sTag === 'section');
  const oSetLineUsed = new Set();

  for (const [sIdWhole, aoPart] of oMapPart) {
    const oWhole = oMapSect.get(sIdWhole);
    if (!oWhole || rHeadArticle.test(oWhole.sNameTitle)) continue;
    aoPart.sort((oA, oB) => oA.nLine - oB.nLine);
    const nFirst = aoPart.findIndex(oPart =>
      oPart.nHeadingLevel <= oWhole.nHeadingLevel && !rHeadArticle.test(oPart.sNameTitle));
    if (nFirst === -1) continue;
    const oFirst = aoPart[nFirst];
    const sLoc = `${sNameShortIn}:${oFirst.nLine}`;
    const fSkip = sWhy => aoNote.push(`SKIP   ${sLoc}  #${sIdWhole} > #${oFirst.sNameId}: ${sWhy}`);

    if (bTagBad) { fSkip('the-file has an-unclosed or stray <section> (Hvre07)'); continue; }
    const aoMove = aoPart.slice(nFirst);
    if ([oWhole, ...aoPart].some(oSect => oSetIdDup.has(oSect.sNameId))) { fSkip('a-duplicated id'); continue; }
    const oOther = aoMove.find(oPart => oPart.nHeadingLevel !== oWhole.nHeadingLevel);
    if (oOther) {
      fSkip(`#${oOther.sNameId} (line ${oOther.nLine}) is <h${oOther.nHeadingLevel}>, not <h${oWhole.nHeadingLevel}> as #${sIdWhole}`);
      continue;
    }
    // Y's own text between X and its </section>: only its parts and blank lines
    const nClose = oWhole.nLineClose - 1;
    const nOpen = oFirst.nLine - 1;
    let nOwn = -1;
    for (let nL = nOpen; nL < nClose && nOwn === -1; nL++) {
      const bInPart = aoMove.some(oPart => nL >= oPart.nLine - 1 && nL <= oPart.nLineClose - 1);
      if (!bInPart && fLineClean(aLine[nL]).trim() !== '') nOwn = nL;
    }
    if (nOwn !== -1) { fSkip(`#${sIdWhole} has own text at line ${nOwn + 1}, after #${oFirst.sNameId}`); continue; }
    if (fLineClean(aLine[nClose]).trim() !== '</section>') { fSkip(`line ${nClose + 1} is not only </section>`); continue; }
    if (fLineClean(aLine[nOpen]).trim() !== `<section id="${oFirst.sNameId}">`) { fSkip(`line ${nOpen + 1} is not only its <section id>`); continue; }

    // the-new </section>: before the-blank lines above X
    let nIns = nOpen;
    while (nIns > 0 && fLineClean(aLine[nIns - 1]).trim() === '') nIns--;
    if ([nIns, nClose].some(nL => oSetLineUsed.has(nL))) { fSkip('an-other move uses its lines'); continue; }
    oSetLineUsed.add(nIns); oSetLineUsed.add(nClose);
    // the-same line moves: its indentation and line-end stay
    aoEdit.push({ nAt: nClose, nDel: 1, aIns: [] });
    aoEdit.push({ nAt: nIns, nDel: 0, aIns: [aLine[nClose]] });
    aoNote.push(`NEST   ${sLoc}  </section> of #${sIdWhole} moved from line ${nClose + 1} to before #${oFirst.sNameId}` +
      ` (${aoMove.length} section${aoMove.length > 1 ? 's' : ''} become its siblings)`);
  }
  return fDone();
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
  const bOverview = aArg.includes('--overview');
  const bUndated = aArg.includes('--undated');
  const bNameId = aArg.includes('--nameid');
  const bHeadGap = aArg.includes('--headgap');
  const bNest = aArg.includes('--nest');
  if ([bMissing, bOverview, bUndated, bNameId, bHeadGap, bNest].filter(Boolean).length > 1) {
    console.error('--missing, --overview, --undated, --nameid, --headgap and --nest are separate runs: give one of them');
    process.exit(1);
  }
  if (!sNameDir) {
    console.log('createMcsh.mjs - it puts the-Mcsh-creation-date in the-description:: of sections');
    console.log('  ' + aVersion[0]);
    console.log('');
    console.log('USAGE: node dirValid/createMcsh.mjs <sNameDir> [--missing|--overview|--undated|--nameid|--headgap|--nest] [--fix]');
    console.log('  sNameDir     the-path of the-dirMcsh-worldview');
    console.log('  (default)    the-creation-para of evoluting-sections -> their description::');
    console.log('  --missing    a-description:: with the-run-date for every Mvrw01-section');
    console.log('  --overview   idOverview description:: without × Mcsh-creation gets the-date');
    console.log('               of version.0-1-0 (else the-earliest version) from the-file\'s end');
    console.log('  --undated    EVERY description:: without × Mcsh-creation gets the-run-date');
    console.log('  --nameid     the-name::-para of idOverview gets the-id idName');
    console.log('  --headgap    the-obvious Hvrw07 heading-gaps (h1 → h3) of Mcsh* and dirStnlaw files;');
    console.log('               law-articles keep their level');
    console.log('  --nest       the-obvious Hvrw08 nesting-errors: a-</section> moved up, same files');
    console.log('  --fix        it WRITES the-files; without it a-dry-run');
    console.log('  OUTPUT: dirValid/createMcsh.txt; with --fix also dirValid/createMcsh-backup/<time>/');
    process.exit(1);
  }

  // a-NEW backup-folder per run: a-second run must never overwrite the-originals of a-first
  const sTime = fFindDateLocal(true);
  let sDirBackup = moPath.join(sDirScript, 'createMcsh-backup', sTime);
  for (let nN = 2; moFs.existsSync(sDirBackup); nN++) {
    sDirBackup = moPath.join(sDirScript, 'createMcsh-backup', `${sTime}-${nN}`);
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
  if (bNest) {
    for (const oFile of fReadFileAllHitp(sNameDir)) {
      const sNameShort = oFile.sNameFile.replace(/\.last\.html$/, '');
      // the-files of --headgap: Mcsh*, and of the-Hitp* files only the-laws of dirStnlaw
      const bLaw = moPath.relative(sNameDir, oFile.sPathFile).split(moPath.sep).includes('dirStnlaw');
      if (!oFile.sNameFile.startsWith('Mcsh') && !bLaw) continue;
      const sRaw = moFs.readFileSync(oFile.sPathFile, 'utf8');
      fWriteFile(oFile.sPathFile, sRaw, sNameShort, fPlanNest(sRaw, sNameShort, oFile));
    }
    sCount = `${oCount.NEST ?? 0} </section> moved`;
  } else if (bHeadGap) {
    // all files read once: a-move is skipped when ANY file links to the-old heading-id
    const aoFileHitp = fReadFileAllHitp(sNameDir);
    const aRawAll = aoFileHitp.map(oFile => moFs.readFileSync(oFile.sPathFile, 'utf8'));
    aoFileHitp.forEach((oFile, nI) => {
      const sNameShort = oFile.sNameFile.replace(/\.last\.html$/, '');
      // Mcsh* files, and of the-Hitp* files only the-laws of dirStnlaw
      const bLaw = moPath.relative(sNameDir, oFile.sPathFile).split(moPath.sep).includes('dirStnlaw');
      if (!oFile.sNameFile.startsWith('Mcsh') && !bLaw) return;
      fWriteFile(oFile.sPathFile, aRawAll[nI], sNameShort,
        fPlanHeadGap(aRawAll[nI], sNameShort, oFile.sNameFile, oFile, aRawAll));
    });
    sCount = `${oCount.HEADING ?? 0} headings moved up`;
  } else if (bNameId) {
    // all files read once: a-rename is skipped when ANY file links to the-old id
    const aPathAll = fFindFileAll(sNameDir);
    const aRawAll = aPathAll.map(sPathFile => moFs.readFileSync(sPathFile, 'utf8'));
    aPathAll.forEach((sPathFile, nI) => {
      const sNameFile = moPath.basename(sPathFile);
      const sNameShort = sNameFile.replace(/\.last\.html$/, '');
      fWriteFile(sPathFile, aRawAll[nI], sNameShort, fPlanNameId(aRawAll[nI], sNameShort, sNameFile, aRawAll));
    });
    sCount = `${oCount.RENAME ?? 0} ids renamed to idName`;
  } else if (bUndated) {
    const sDate = fFindDateLocal();
    for (const sPathFile of fFindFileAll(sNameDir)) {
      if (!moPath.basename(sPathFile).startsWith('Mcsh')) continue;
      const sRaw = moFs.readFileSync(sPathFile, 'utf8');
      const sNameShort = moPath.basename(sPathFile).replace(/\.last\.html$/, '');
      fWriteFile(sPathFile, sRaw, sNameShort, fPlanUndated(sRaw, sNameShort, sDate));
    }
    // one INSERT-note per file carries the-count of its descriptions
    const nDesc = aLineOut.reduce((nSum, sLine) =>
      nSum + Number(sLine.match(/^INSERT \S+  (\d+) descriptions$/)?.[1] ?? 0), 0);
    sCount = `${nDesc} descriptions dated · ${oCount.EMPTY ?? 0} of them EMPTY · date {${sDate}}`;
  } else if (bOverview) {
    for (const sPathFile of fFindFileAll(sNameDir)) {
      if (!moPath.basename(sPathFile).startsWith('Mcsh')) continue;
      const sRaw = moFs.readFileSync(sPathFile, 'utf8');
      const sNameShort = moPath.basename(sPathFile).replace(/\.last\.html$/, '');
      fWriteFile(sPathFile, sRaw, sNameShort, fPlanOverview(sRaw, sNameShort));
    }
    sCount = `${oCount.INSERT ?? 0} dates inserted · ${oCount.NODESC ?? 0} idOverview without description::`;
  } else if (!bMissing) {
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
    // the-sections without description:: are what the-VALIDATOR says: Mvrw01
    const sDate = fFindDateLocal();
    const aoFileHitp = fReadFileAllHitp(sNameDir).filter(oFile => oFile.sNameFile.startsWith('Mcsh'));
    const aoCnptFile = await Promise.all(aoFileHitp.map(oFile =>
      fReadFileMcsh(sNameDir, moPath.relative(sNameDir, oFile.sPathFile))));
    const ooIdSect = {};
    for (const oIssue of fRunChecksMcsh(aoCnptFile, sNameDir, true)) {
      if (oIssue.sCode === 'Mvrw01') (ooIdSect[oIssue.sNameFile] ??= []).push(oIssue.sIdConcept);
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
    `  createMcsh${bMissing ? ' --missing' : ''}${bOverview ? ' --overview' : ''}` +
      `${bUndated ? ' --undated' : ''}${bNameId ? ' --nameid' : ''}${bHeadGap ? ' --headgap' : ''}${bNest ? ' --nest' : ''} ` +
      `${bFix ? '--fix' : 'dry-run'}: ${sNameDir}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `  ${oCount.nFile} files ${bFix ? 'written' : 'to write'} · ${sCount} · ` +
      `${oCount.SKIP ?? 0} skipped` + (oCount.nBad ? ` · ${oCount.nBad} BAD` : ''),
    bFix ? `  backup: ${sDirBackup}` : '  nothing written: add --fix to write',
    ''
  ];
  // in the-report: one "=== KIND (count) — description" heading per kind, its notes
  // indented 2 spaces (VS Code folds them); what needs you first — NODESC, EMPTY,
  // SKIP, BAD — then the-rest in the-order they came
  const aKindFirst = ['NODESC', 'EMPTY', 'SKIP', 'BAD'];
  const aKind = [...new Set([...aKindFirst, ...aLineOut.map(sLine => sLine.split(' ')[0])])];
  const aLineReport = [];
  for (const sKind of aKind) {
    const aNote = aLineOut.filter(sLine => sLine.split(' ')[0] === sKind);
    if (aNote.length === 0) continue;
    aLineReport.push(`=== ${sKind} (${aNote.length}) — ${ooKindDesc[sKind] ?? ''}`);
    aLineReport.push(...aNote.map(sLine => '  ' + sLine.slice(sKind.length).trimStart()));
    aLineReport.push('');
  }
  const sPathOut = moPath.join(sDirScript, 'createMcsh.txt');
  moFs.writeFileSync(sPathOut, [...aHead, ...aLineReport].join('\n'));
  for (const sLine of aHead.slice(0, 5)) console.log(sLine);
  for (const sLine of aLineOut.filter(sLine => aKindFirst.includes(sLine.split(' ')[0]))) console.log('  ' + sLine);
  console.log(`📄 report written: ${sPathOut}`);
}

fMain().catch(oErr => {
  console.error('\n❌ Fatal error:', oErr.message);
  process.exit(1);
});
