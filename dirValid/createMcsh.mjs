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
 *   --mainname: the-fix of MvrlMmn01: a-main-name (after "!⇒") with "-" gets "_",
 *   in every "!⇒X" and in its main-name-line; the-old form stays as a-synonym X!⇒X'.
 *
 *   --srtr: the-fix of MvrwId13: a-structure-concept's id gets the-suffix srtr
 *   (idXsrtrF → idXsrtr, idXstcr → idXsrtr, idX → idXsrtr), with its own ids that
 *   start with it, and every link to them in every .last.html file (json index files are NOT touched).
 *
 *   --code <rule> --file <file>: the-fix of ONE validator rule in one file, for EVERY
 *   rule (ooFixCode): it changes only the-clear cases and SKIPs the-rest with why; a-rule
 *   that needs you (MvreFile01, MvrwSect02) gets NOFIX with why. A-rule
 *   with its own mode runs it (--code MvreName01 = --dupname).
 *   --code MvrwGstr01: a-specific S WITHOUT generic-tree:: that HAS a-main-name M (one !⇒ target
 *   in its name::) gets the-para {S}gntr "McshEngl.M:generic, === G:generic, ...entity:generic"
 *   right after its name::, in S's file (any file); G = the-generic whose specific-tree lists S.
 *   The-worldview is checked ONCE (S can be in another file). "does not list it": S's generic-tree::
 *   gets G: a-tree with no generic yet ("=== ...entity:generic") gets G before ...entity:generic,
 *   a-tree with generics gets a-new group "=== G:generic, ...entity:generic" at its end.
 *   --code MvrwGstr02: a-generic G (X:generic, the-first item of a-"===" group of S's generic-tree::)
 *   lists S as "G.S!@file#id" (a-dotted S itself, without NNN_): a-new "===" group at the-end of
 *   G's specific-tree::, or a-new {G}sptr para "McshEngl.G.specific, ===" right after G's generic-tree::.
 *
 *   --code MvrwName01: a-formal-name (X'Y, X.Y, X:Y, X;Y, X/Y) of a-name:: or a-formal title with
 *   a-space | hyphen gets "_" in place (X'a-b → X'a_b); an-old spelling "X'a-b!⇒X'a_b" and a-doubled
 *   line are deleted. It SKIPS a-main-name (a "!⇒" target): --mainname renames those.
 *
 *   --name: the-fix of MvrwSect03: a-section without name:: gets a-name::-para with
 *   McshEngl.<its heading>, after its description::. It SKIPS a-heading with "," or "!".
 *
 * INPUT: the-path of a-dirMcsh-worldview.
 * OUTPUT: dry-run by default: what it would do. With --fix it writes the-files,
 *   without backup: the-worldview is in git.
 *   The-report goes to dirValid/createMcsh.txt.
 * RUN:
 *   node dirValid/createMcsh.mjs <sNameDir> [--missing|--overview|--undated|--nameid|--headgap|--nest|--mainname|--srtr] [--fix]
 */

import moFs from 'fs'
import moPath from 'path'
import { fileURLToPath } from 'url'
import { fReadFileHitp, fReadFileAllHitp, fReadFileHitpIdOnly } from './parserHitp.js'
import { fReadFileMcsh, fStripTags, rNameLine } from './parserMcsh.js'
import { fRunChecksMcsh, fFormalMvrwName01 } from './structuralMcsh.js'
import { rHeadArticle, fRunChecksHitp } from './structuralHitp.js'
import { fReadListValidate } from './listValidate.js'

const
  // contains the-versions of createMcsh.mjs
  aVersion = [
    'createMcsh.mjs.0-36-0.2026-11-13: --dupname (MvreName01): of a-name-line written twice, the-line with a-date | info stays, the-line without is deleted',
    'createMcsh.mjs.0-35-0.2026-11-12: --code MvrwName01: a-formal-name | formal title with a-space | hyphen gets "_"',
    'createMcsh.mjs.0-34-0.2026-11-12: --attribute (in --auto) and --code MvrwMain10: the-clear attribute | specific titles and their formal names',
    'createMcsh.mjs.0-33-0.2026-11-10: MvrwId05 knows the-ending "evolg" (idXevolg -> idXevog); the-MvrwGstr01 guard skips the-head line',
    'createMcsh.mjs.0-32-0.2026-11-09: --code MvrwGstr01 skips a-generic-tree:: with an-item Y:generic that is no head (an-old name)',
    'createMcsh.mjs.0-31-0.2026-11-08: --namecomma, the-fix of MvreName02: a-name-line without a-comma gets it at the-end',
    'createMcsh.mjs.0-30-0.2026-11-07: --mainname skips a-main-name without an-English start (όγδοος-η-ο): by hand',
    'createMcsh.mjs.0-29-0.2026-11-07: --code MvrwMain01 a-specific WRest → BRest (SystDynaSelf → DynaSelf)',
    'createMcsh.mjs.0-28-0.2026-11-07: --code MvrwMain01 attrbase_begin: an-attribute main-name W\'rest → B+rest',
    'createMcsh.mjs.0-27-0.2026-11-06: --mainname X_ only a-synonym "X_!⇒X-": swapped to "X-!⇒X_", not skipped',
    'createMcsh.mjs.0-26-0.2026-11-06: MvrwMain02-06 no !Attrbase: the-main-name of the-whole + suffix; genericSpecific stays small',
    'createMcsh.mjs.0-25-0.2026-11-05: --code MvrwGstr01 "does not list it": G goes in the-generic-tree:: of S (its empty group, else a-new === group)',
    'createMcsh.mjs.0-24-0.2026-11-05: --code MvrwGstr02, a-generic lists its specific "G.S!@file#id" (new === group, or a-new specific-tree:: para)',
    'createMcsh.mjs.0-23-0.2026-11-05: --code MvrwGstr01, a-specific without generic-tree:: but with a-main-name gets its generic-tree:: para',
    'createMcsh.mjs.0-22-0.2026-11-05: Hvrw02 title version (N-N-N.YYYY-MM-DD) gets the-file name in front',
    'createMcsh.mjs.0-21-0.2026-11-05: Hvre06 reads the-href of the-new message: ID not found href="X"',
    'createMcsh.mjs.0-20-0.2026-11-05: Hvre05 reads the-href of the-new message: FILE not found href="X"',
    'createMcsh.mjs.0-19-0.2026-11-04: faster: the-Mcsh modes do not parse Hitp and run only their rule; a-file is read once',
    'createMcsh.mjs.0-18-0.2026-11-04: Hvre04, a-<section> without id takes the-id of its heading without HN; Hvre02/03/04 got sNameDir as sKindIn, they fixed nothing',
    'createMcsh.mjs.0-17-0.2026-11-04: --code <rule>, a-fix (or NOFIX with why) for every validator rule',
    'createMcsh.mjs.0-16-0.2026-11-04: --name, the-fix of MvrwSect03: a-name:: from the-heading',
    'createMcsh.mjs.0-15-0.2026-11-03: --file, --dupname, --auto; codes MvrwSect01, MvrwId13',
    'createMcsh.mjs.0-14-0.2026-10-28: MvrlMnnm01 renamed MvrlMmn01',
    'createMcsh.mjs.0-13-0.2026-10-24: --fix writes NO backup (git is the-backup)',
    'createMcsh.mjs.0-12-0.2026-10-24: --srtr no longer touches json index files',
    'createMcsh.mjs.0-11-0.2026-10-24: --srtr, the-fix of MvrlId13 srtr_structure_suffix',
    'createMcsh.mjs.0-10-0.2026-10-24: --mainname, the-fix of MvrlMmn01 no-hyphen',
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
  // the-modes, one per run; --auto runs aModeAuto in this order
  aModeAll = ['missing', 'name', 'overview', 'undated', 'nameid', 'headgap', 'nest', 'mainname', 'srtr', 'dupname', 'namecomma', 'attribute', 'auto'],
  aModeAuto = ['namecomma', 'dupname', 'nest', 'headgap', 'missing', 'mainname', 'srtr', 'attribute'],
  // the-kinds of notes in createMcsh.txt, one === heading each
  ooKindDesc = {
    NODESC:   'idOverview without description::',
    EMPTY:    'a-description:: that was empty (only "·"), now dated: give it a-text',
    SKIP:     'skipped, with why: fix by hand',
    BAD:      'the-file is NOT written: its check failed',
    DELETE:   'a-creation-para deleted, its date put in the-description::',
    CREATE:   'a-new description:: created',
    ATTR:     'MvrwMain10: an-attribute | specific title set to "x of M" | "M.x" and its formal name M\x27x | M.x added',
    FORMAL:   'MvrwName01: a-formal-name | formal title with a-space | hyphen got "_"; an-old spelling or a-doubled line deleted',
    NAME:     'a-new name:: (or name-line) from the-heading (MvrwSect03, MvrwSect04): check the-name',
    NOFIX:    'no automatic fix for this rule: it needs you',
    NOISSUE:  'the-rule has no issue in the-file',
    IDNEW:    'an-id renamed (MvrwId01..13), with its own ids; links re-pointed in every file',
    IDDUP:    'a-duplicated id: the-later element renamed X_2.. (Hvre01), the-first keeps X',
    IDADD:    'an-element without id got one (Hvre02 heading, Hvre03 <p>, Hvre04 <section>)',
    ANCHOR:   'a-clsHide self-anchor added or re-pointed (Hvrw03, Hvrw04)',
    CASE:     'a-tag made lowercase (Hvrw05)',
    QUOTE:    'an-attribute value double-quoted (Hvrw06)',
    CLOSE:    'a-</p> added where the-browser closes the-<p> (Hvre07)',
    TITLE:    'the-<title> got the-version of idMetaVersion (Hvrw01, Hvrw02)',
    MOVE:     'the-Attrbase-line moved after M!@McshXxx | M!=I (MvrwMain07)',
    DATE:     'a-date padded to {YYYY-MM-DD} (MvrwMisc01)',
    LINKFX:   'a-broken link re-pointed to its ONE certain target (Hvre05, Hvre06)',
    GNTRNEW:  'a-specific without generic-tree:: got its {S}gntr para, its generic G first (MvrwGstr01)',
    GNTRADD:  'a-specific\'s generic-tree:: got its generic G: in its empty group, else a-new === group (MvrwGstr01)',
    SPTRADD:  'a-generic\'s specific-tree:: got its specific S "G.S!@file#id" in a-new === group (MvrwGstr02)',
    SPTRNEW:  'a-generic without specific-tree:: got its {G}sptr para after its generic-tree:: (MvrwGstr02)',
    INSERT:   'a-creation-date inserted in a-description::',
    FIXTITLE: 'a-typo description-title fixed',
    RENAME:   'the-name::-para id renamed to idName',
    HEADING:  'a-heading moved up (Hvrw07 gap)',
    NEST:     'a-</section> moved up (Hvrw08 nesting)',
    DUPNAME:  'a-name-line written twice in ONE para: the-line without date | info deleted (MvreName01)',
    NAMECOMMA: 'a-name-line without a-comma: the-comma added at the-end (MvreName02)',
    MAINNAME: 'a-name-line whose main-name changed (MvreMain01 underscores, MvrwMain01 Attrbase, MvrwMain02..06 suffix)',
    ADD:      "the-old main-name kept as a-synonym: X!⇒X'",
    IDSRTR:   'a-structure-concept id renamed to end in srtr (MvrwId13), with its own ids',
    LINK:     'a-line whose ids or links to a-renamed id changed'
  },
  // the-dir of this script: the-report goes next to IT
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
function fFindFileAll(sDirIn, sEndIn = '.last.html') {
  const aPath = [];
  for (const oEnt of moFs.readdirSync(sDirIn, { withFileTypes: true })) {
    const sPath = moPath.join(sDirIn, oEnt.name);
    if (oEnt.isDirectory()) {
      if (['node_modules', '.git'].includes(oEnt.name) || oEnt.name.startsWith('createMcsh-backup')) continue;
      aPath.push(...fFindFileAll(sPath, sEndIn));
    } else if (oEnt.name.endsWith(sEndIn)) {
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
 * DOING: --name mode, the-fix of MvrwSect03: a-section without name:: gets
 *     <p id="<section-id>nam">name::
 *       <br>* McshEngl.<its heading>,
 *   right after its description:: (else after its heading), with the-indentation of
 *   the-section's own lines.
 *   It SKIPS and reports: a-section-id not unique, no heading, a-taken <section-id>nam,
 *   a-heading with "," or "!" (they end a-name-line or mark a-relation).
 * INPUT: aoSectIn: [{sIdSect, sTitle}] the-sections the-validator reports as MvrwSect03.
 * OUTPUT: { aoEdit, aoNote, sRawNew }
 */
// the-name-lines of the-worldview, read once: a-new name must not be one of them (MvreName01)
let oSetNameAllCache = null;
function fFindNameAll(sNameDirIn) {
  if (oSetNameAllCache) return oSetNameAllCache;
  oSetNameAllCache = new Set();
  for (const sPath of fFindFileAll(sNameDirIn)) {
    for (const aM of moFs.readFileSync(sPath, 'utf8').matchAll(/<br>\*\s*(Mcsh[A-Z][a-z]{3}\.[^,\n]+),/g)) {
      oSetNameAllCache.add(aM[1].trim());
    }
  }
  return oSetNameAllCache;
}

/**
 * OUTPUT: why a-heading can NOT be a-name, '' when it can: empty, "," or "!" (they end
 *   a-name-line or mark a-relation), "{" (a-date-token), an-attribute heading (DOING of X,
 *   structure of X: its main-name follows a-rule, MvrwMain02..06), a-name that exists already.
 *   A-name taken here is added to oSetNameAllIn.
 */
function fFindNameBad(sNameIn, oSetNameAllIn) {
  if (!sNameIn || /[,!]/.test(sNameIn)) return 'is empty or has "," or "!"';
  if (sNameIn.includes('{')) return 'has "{"';
  if (/^(\d+_)?(DOING|doing|evoluting|evaluation|evaluating|info-resource|structure) of |'(doing|evoluting|evaluation|evaluating|info-resource|structure)$/i.test(sNameIn)) {
    return 'is an-attribute heading: its main-name follows a-rule (Xdoing, Xevolg, Xsrtr ...)';
  }
  if (oSetNameAllIn.has('McshEngl.' + sNameIn)) return 'is a-name already in the-worldview (MvreName01)';
  oSetNameAllIn.add('McshEngl.' + sNameIn);
  return '';
}

function fPlanName(sRawIn, sNameShortIn, aoSectIn, oSetNameAllIn = new Set()) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];

  for (const { sIdSect, sTitle } of aoSectIn) {
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
    const sName = String(sTitle ?? '').replace(/\s+/g, ' ').trim();
    const sWhyBad = fFindNameBad(sName, oSetNameAllIn);
    if (sWhyBad) {
      aoNote.push(`SKIP   ${sLoc}  #${sIdSect} heading "${sName}" ${sWhyBad}: give the-name by hand`);
      continue;
    }
    const sIdName = sIdSect + 'nam';
    if (sRawIn.includes(`id="${sIdName}"`)) {
      aoNote.push(`SKIP   ${sLoc}  #${sIdSect} has no name:: and id ${sIdName} is taken`);
      continue;
    }
    // after the-description:: if any, else after the-heading
    let nAt = nHeadEnd + 1;
    for (let nD = nHeadEnd + 1; nD < nOwnEnd; nD++) {
      if (!rDescOpen.test(fLineClean(aLine[nD]))) continue;
      let nDescEnd = nD;
      while (nDescEnd < nOwnEnd && !aLine[nDescEnd].includes('</p>')) nDescEnd++;
      nAt = nDescEnd + 1;
      break;
    }
    const sIndent = (aLine[nSect + 1] ?? '').match(/^( *)/)[1];
    aoEdit.push({ nAt, nDel: 0, aIns: [
      `${sIndent}<p id="${sIdName}">name::`,
      `${sIndent}  <br>* McshEngl.${sName},`,
      `${sIndent}  <a class="clsHide" href="#${sIdName}"></a></p>`
    ] });
    aoNote.push(`NAME   ${sLoc}  #${sIdName}  McshEngl.${sName}`);
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
 * DOING: --mainname mode: the-fix of MvrlMmn01 no-hyphen. A-main-name X (the-text
 *   after "!⇒" in a-name-line) with "-" becomes X' with "_", as the-English names
 *   were done (e-mail!⇒e_mail):
 *   - every "!⇒X" of its McsLago, in every file → "!⇒X'",
 *   - the-main-name-line "McshLago.X" of a-para that points to X → "McshLago.X'",
 *     and right after it the-old form is KEPT as a-synonym: "McshLago.X!⇒X'"
 *     (with the-!~PoS of the-main-line, if any).
 *   Names that only CONTAIN X (ρήμα.ἀγανακτέω-ῶ) are other names: not changed.
 *   A-main-name whose X' is a-name already in its McsLago is skipped by fMain.
 * INPUT: oMapMainIn: 'Lago|X' → X' of the-main-names to change.
 *   oSetMainAlwaysIn: 'Lago|X' whose line "McshLago.X" is the-main-name-line also when
 *   nothing points to it (the-ONE name of its para: MvrwMain02..06 from the-whole's main-name).
 * OUTPUT: { aoEdit, aoNote, sRawNew }
 */
function fPlanMainName(sRawIn, sNameShortIn, oMapMainIn, oSetMainAlwaysIn = new Set()) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  const fMainNew = (sLagoIn, sMainIn) => oMapMainIn.get(`${sLagoIn}|${sMainIn.trim()}`);
  // 'Lago|X'' → X: the-old main-name of a-new one
  const oMapOld = new Map([...oMapMainIn].map(([sKey, sNew]) => [`${sKey.split('|')[0]}|${sNew}`, sKey.split('|')[1]]));

  for (let nL = 0; nL < aLine.length; nL++) {
    const aName = aLine[nL].match(rNameLine);
    if (!aName) continue;
    const sLago = aName[1], sRest = aName[2];
    const nStart = aName[0].length - 1 - sRest.length;
    const nEnd = nStart + sRest.length;
    const sName = sRest.split('!')[0].trim();

    // every "!⇒X" → "!⇒X'"
    let sRestNew = sRest.replace(/!⇒([^!]*)/g, (sAll, sMain) => {
      const sMainNew = fMainNew(sLago, sMain);
      return sMainNew ? '!⇒' + sMainNew : sAll;
    });

    // the-main-name-line: a-line of its para points to IT with "!⇒"
    const aIns = [];
    const sNameNew = fMainNew(sLago, sName);
    if (sNameNew && !sRest.includes('!⇒')) {
      let nOpen = nL, nClose = nL;
      while (nOpen > 0 && !/<p\b/.test(aLine[nOpen])) nOpen--;
      while (nClose < aLine.length - 1 && !aLine[nClose].includes('</p>')) nClose++;
      const bPointed = oSetMainAlwaysIn.has(`${sLago}|${sName}`) || aLine.slice(nOpen, nClose + 1).some(sLine => {
        const aOther = sLine.match(rNameLine);
        return aOther && aOther[1] === sLago &&
          [...aOther[2].matchAll(/!⇒([^!]*)/g)].some(aM => aM[1].trim() === sName);
      });
      if (bPointed) {
        sRestNew = sNameNew + sRestNew.slice(sRestNew.indexOf(sName) + sName.length);
        const sPos = (sRest.match(/!~[^!]*/) ?? [''])[0];
        // X' already a-synonym of the-para ("X'!⇒X"): it becomes "X!⇒X'" (below), nothing added
        const bSynNew = aLine.slice(nOpen, nClose + 1).some(sLine => {
          const aOther = sLine.match(rNameLine);
          return aOther && aOther[1] === sLago && aOther[2].split('!')[0].trim() === sNameNew;
        });
        if (!bSynNew) aIns.push(aLine[nL].slice(0, nStart) + sName + sPos + '!⇒' + sNameNew + aLine[nL].slice(nEnd));
      }
    }
    // a-synonym "X'!⇒X" became "X'!⇒X'": it is swapped to "X!⇒X'", the-old form kept
    const sMainOld = oMapOld.get(`${sLago}|${sName}`);
    if (sMainOld && sRestNew.split('!')[0].trim() === sName &&
        [...sRestNew.matchAll(/!⇒([^!]*)/g)].some(aM => aM[1].trim() === sName)) {
      sRestNew = sMainOld + sRestNew.slice(sRestNew.indexOf(sName) + sName.length);
    }
    if (sRestNew === sRest) continue;

    const sLineNew = aLine[nL].slice(0, nStart) + sRestNew + aLine[nL].slice(nEnd);
    aoEdit.push({ nAt: nL, nDel: 1, aIns: [sLineNew, ...aIns] });
    aoNote.push(`MAINNAME ${sNameShortIn}:${nL + 1}  Mcsh${sLago}.${sRest}  ->  ${sRestNew}`);
    for (const sIns of aIns) aoNote.push(`ADD    ${sNameShortIn}:${nL + 1}  ${fLineClean(sIns).trim()}`);
  }
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * OUTPUT: the-new id of a-structure-concept (MvrwId13), ending in "srtr":
 *   idBdyHmnsrtrF → idBdyHmnsrtr, idSys002stcr | strr | sctr | structure → idSys002srtr,
 *   anything else gets srtr appended: idGlndHmnatt006 → idGlndHmnatt006srtr.
 */
function fFindIdSrtr(sIdIn) {
  if (/srtrF$/.test(sIdIn)) return sIdIn.slice(0, -1);
  if (/(strrF|strr|stcr|sctr|[Ss]tructure)$/.test(sIdIn)) {
    return sIdIn.replace(/(strrF|strr|stcr|sctr|[Ss]tructure)$/, 'srtr');
  }
  return sIdIn + 'srtr';
}

/**
 * DOING: --srtr mode, the-fix of MvrwId13: it plans the-renames of ONE file's
 *   structure-concepts. A-section's own ids that START with its id (its heading
 *   ...H1, ...dsn, ...nam, a-child ...gstr) get the-new start too.
 *   It SKIPS a-section whose id is not unique, whose <section> is not found, or
 *   whose new ids are taken.
 * INPUT: aIdSectIn: the-section-ids the-validator reports as MvrwId13.
 * OUTPUT: { oMapId: old → new, aoNote }
 */
function fPlanSrtrMap(sRawIn, sNameShortIn, aIdSectIn) {
  const aLine = sRawIn.split('\n');
  const oSetIdFile = new Set([...sRawIn.matchAll(/\bid="([^"]+)"/g)].map(aM => aM[1]));
  const oMapId = new Map();
  const aoNote = [];
  for (const sIdSect of aIdSectIn) {
    const sIdNew = fFindIdSrtr(sIdSect);
    const nSect = aLine.findIndex(sLine => fLineClean(sLine).match(rSectOpen)?.[1] === sIdSect);
    const sLoc = `${sNameShortIn}:${nSect + 1}`;
    const fSkip = sWhy => aoNote.push(`SKIP   ${sLoc}  #${sIdSect}: ${sWhy}`);
    if (fCount(sRawIn, `id="${sIdSect}"`) !== 1) { fSkip('its id is not unique'); continue; }
    if (nSect === -1) { fSkip('no <section id> with it'); continue; }
    // the-section's lines: to its own </section>
    let nDepth = 0, nEnd = nSect;
    for (let nL = nSect; nL < aLine.length; nL++) {
      nDepth += (aLine[nL].match(/<section\b/g) ?? []).length - (aLine[nL].match(/<\/section>/g) ?? []).length;
      if (nDepth <= 0) { nEnd = nL; break; }
    }
    const aIdOwn = [...new Set(aLine.slice(nSect, nEnd + 1).join('\n').match(/\bid="[^"]+"/g)
      .map(sM => sM.slice(4, -1)).filter(sId => sId.startsWith(sIdSect)))];
    const aoPair = aIdOwn.map(sId => [sId, sIdNew + sId.slice(sIdSect.length)]);
    const oPairTaken = aoPair.find(([, sNew]) => oSetIdFile.has(sNew) || [...oMapId.values()].includes(sNew));
    if (oPairTaken) { fSkip(`the-new id ${oPairTaken[1]} is taken`); continue; }
    if (aoPair.some(([sOld]) => fCount(sRawIn, `id="${sOld}"`) !== 1)) { fSkip('one of its ids is not unique'); continue; }
    for (const [sOld, sNew] of aoPair) oMapId.set(sOld, sNew);
    aoNote.push(`IDSRTR ${sLoc}  #${sIdSect} -> #${sIdNew}` +
      (aoPair.length > 1 ? `  (+${aoPair.length - 1} own ids: ${aoPair.slice(1).map(([sOld]) => sOld.slice(sIdSect.length)).join(' ')})` : ''));
  }
  return { oMapId, aoNote };
}

/**
 * DOING: --srtr mode: it applies the-renames to ONE .last.html file: in the-file
 *   of the-ids their id="..." and href="#...", in every file the-links <file>#id".
 * INPUT: ooMapIdIn: the-file-name (McshHlth000002.last.html) → its Map old → new.
 * OUTPUT: { aoEdit, aoNote, sRawNew }
 */
function fPlanSrtrApply(sRawIn, sNameShortIn, sNameFileIn, ooMapIdIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  const oMapOwn = ooMapIdIn[sNameFileIn];
  for (let nL = 0; nL < aLine.length; nL++) {
    let sLine = aLine[nL];
    if (!sLine.includes('id') && !sLine.includes('#')) continue;
    if (oMapOwn) {
      sLine = sLine.replace(/\b(id|href)="(#?)([^"#]+)"/g, (sAll, sAttr, sHash, sId) =>
        (sAttr === 'id' || sHash) && oMapOwn.has(sId) ? `${sAttr}="${sHash}${oMapOwn.get(sId)}"` : sAll);
    }
    for (const sNameFile of Object.keys(ooMapIdIn)) {
      if (!sLine.includes(sNameFile + '#')) continue;
      const oMap = ooMapIdIn[sNameFile];
      sLine = sLine.split(sNameFile + '#').map((sPart, nI) => {
        if (nI === 0) return sPart;
        const aId = sPart.match(/^([^"#\s]+)"/);
        return aId && oMap.has(aId[1]) ? oMap.get(aId[1]) + sPart.slice(aId[1].length) : sPart;
      }).join(sNameFile + '#');
    }
    if (sLine === aLine[nL]) continue;
    aoEdit.push({ nAt: nL, nDel: 1, aIns: [sLine] });
    aoNote.push(`LINK   ${sNameShortIn}:${nL + 1}`);
  }
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: --dupname mode, the-fix of MvreName01 kind A: a-name-line (the-line to its comma)
 *   that is written again in the-SAME para.
 *   - the-same whole line: the-first stays, the-others are deleted.
 *   - one line with a-date | info after its comma, the-others without: the-lines without
 *     are deleted ("lagoTdoc!⇒CmplTdoc, {2021-01-04}" stays, "lagoTdoc!⇒CmplTdoc," goes).
 *   - 2+ lines with different info: SKIP, by hand.
 * OUTPUT: { aoEdit, aoNote, sRawNew }
 */
function fPlanDupName(sRawIn, sNameShortIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  let oMapSeen = null;   // key (the-line to its comma) -> [{nL, sInfo}] of the-open para, null outside a-para
  const fClose = () => {
    for (const [sKey, aoOcc] of oMapSeen ?? []) {
      if (aoOcc.length < 2) continue;
      const sName = sKey.replace(/^<br>\*\s*/, '');
      const aInfo = [...new Set(aoOcc.map(o => o.sInfo).filter(Boolean))];
      if (aInfo.length > 1) { aoNote.push(`SKIP   ${sNameShortIn}:${aoOcc[0].nL + 1}  ${sName}: ${aInfo.length} lines with different info (${aInfo.join(' | ')}), by hand`); continue; }
      // the-line that stays: the-first with info, else the-first
      const oKeep = aoOcc.find(o => o.sInfo) ?? aoOcc[0];
      for (const oOcc of aoOcc) {
        if (oOcc === oKeep) continue;
        aoEdit.push({ nAt: oOcc.nL, nDel: 1, aIns: [] });
        aoNote.push(`DUPNAME ${sNameShortIn}:${oOcc.nL + 1}  ${sName}${oKeep.sInfo ? '  (stays: ' + oKeep.sInfo + ')' : ''}`);
      }
    }
    oMapSeen = null;
  };
  for (let nL = 0; nL < aLine.length; nL++) {
    const sLine = fLineClean(aLine[nL]);
    if (/<p\b/.test(sLine)) { fClose(); oMapSeen = new Map(); }
    if (oMapSeen && rNameLine.test(sLine)) {
      const sTrim = sLine.trim(), nComma = sTrim.indexOf(',');
      const sKey = nComma < 0 ? sTrim : sTrim.slice(0, nComma), sInfo = nComma < 0 ? '' : sTrim.slice(nComma + 1).trim();
      if (!oMapSeen.has(sKey)) oMapSeen.set(sKey, []);
      oMapSeen.get(sKey).push({ nL, sInfo });
    }
    if (sLine.includes('</p>')) fClose();
  }
  fClose();
  aoEdit.sort((oA, oB) => oA.nAt - oB.nAt);
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: --namecomma mode, the-fix of MvreName02: a-name-line "<br>* McshLago.name" without
 *   a-comma gets it at the-end: "<br>* McshLago.name,". A-comma in the-middle
 *   ("food.060_rice,!⇒foodRice") is reported (SKIP), by hand: after the-comma all is comment.
 * OUTPUT: { aoEdit, aoNote, sRawNew }
 */
const rNameLineNoComma = /^(\s*<br>\*\s*Mcsh[A-Z][a-z]{3}\.[^,]*?)(\s*)$/;
const rNameCommaMid = /^\s*<br>\*\s*Mcsh[A-Z][a-z]{3}\.[^,]*,(?=[!,\-\p{L}\p{N}])/u;
function fPlanNameComma(sRawIn, sNameShortIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  for (let nL = 0; nL < aLine.length; nL++) {
    const sLine = aLine[nL];
    if (!/^\s*<br>\*\s*Mcsh[A-Z][a-z]{3}\./.test(sLine)) continue;
    const aNo = sLine.includes(',') ? null : sLine.match(rNameLineNoComma);
    if (aNo) {
      aoEdit.push({ nAt: nL, nDel: 1, aIns: [aNo[1] + ',' + aNo[2]] });
      aoNote.push(`NAMECOMMA ${sNameShortIn}:${nL + 1}  ${aNo[1].trim()}  ->  ${aNo[1].trim()},`);
    } else if (rNameCommaMid.test(sLine)) {
      aoNote.push(`SKIP   ${sNameShortIn}:${nL + 1}  ${sLine.trim()}: a-comma in the-middle of the-name-line, by hand`);
    }
  }
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: it checks a-planned-file before it is written.
 * OUTPUT: '' when good, else the-problem.
 */
// ═══ --code <rule>: the-fix of ONE validator rule in ONE file (with --file) ═══════════════
// Every rule of structuralMcsh.js and structuralHitp.js is here: a-fix that changes only
// the-clear cases and SKIPs the-rest with why, or NOFIX with why a-fix needs you.

/**
 * OUTPUT: [nFrom, nTo] the-lines of the-element on line nLineIn (0-based): a-<section> to
 *   its </section>, a-<div> to its </div>, else to the-first line with </p> (or nLineIn).
 */
function fFindElmtRange(aLineIn, nLineIn) {
  const sLine = aLineIn[nLineIn];
  for (const sTag of ['section', 'div']) {
    if (!new RegExp(`<${sTag}\\b[^>]*\\bid=`).test(sLine)) continue;
    let nDepth = 0;
    for (let nL = nLineIn; nL < aLineIn.length; nL++) {
      nDepth += fCount(aLineIn[nL], `<${sTag}`) - fCount(aLineIn[nL], `</${sTag}>`);
      if (nDepth <= 0) return [nLineIn, nL];
    }
    return [nLineIn, aLineIn.length - 1];
  }
  for (let nL = nLineIn; nL < aLineIn.length; nL++) {
    if (aLineIn[nL].includes('</p>')) return [nLineIn, nL];
    if (nL > nLineIn && /<(p|section|div|h[1-9])\b/.test(aLineIn[nL])) return [nLineIn, nL - 1];
  }
  return [nLineIn, nLineIn];
}

/**
 * OUTPUT: the-id with the-wanted suffix: a-trailing "F"|"FT" after it goes, a-bad ending
 *   (the-longest first) becomes the-suffix, else the-suffix is appended (idXatt010 → idXatt010irsc).
 */
function fFindIdSuffix(sIdIn, sSuffixIn, aBadIn) {
  if (new RegExp(`${sSuffixIn}FT?$`).test(sIdIn)) return sIdIn.replace(/FT?$/, '');
  for (const sBad of [...aBadIn].sort((sA, sB) => sB.length - sA.length)) {
    if (sIdIn.endsWith(sBad)) return sIdIn.slice(0, -sBad.length) + sSuffixIn;
  }
  return sIdIn + sSuffixIn;
}

// the-look-alike letters of MvrwId01: Greek and Cyrillic → Latin
const oLetterLatin = {
  'ο': 'o', 'α': 'a', 'ε': 'e', 'ι': 'i', 'κ': 'k', 'ν': 'v', 'ρ': 'p', 'τ': 't', 'υ': 'u', 'χ': 'x',
  'Ο': 'O', 'Α': 'A', 'Ε': 'E', 'Ι': 'I', 'Κ': 'K', 'Ν': 'N', 'Ρ': 'P', 'Τ': 'T', 'Χ': 'X', 'Β': 'B', 'Η': 'H', 'Μ': 'M', 'Ζ': 'Z',
  'о': 'o', 'а': 'a', 'е': 'e', 'р': 'p', 'с': 'c', 'х': 'x', 'у': 'y', 'О': 'O', 'А': 'A', 'Е': 'E', 'Р': 'P', 'С': 'C', 'Х': 'X'
};

// the-fix of each rule: sKind idmap (rename ids, re-point links in every file), line
// (edits in the-file), main (rename main-names), none (sWhy: it needs you)
const ooFixCode = {
  MvrwId01: { sKind: 'idmap', fIdNew: sId => { const s = [...sId].map(sC => oLetterLatin[sC] ?? sC).join(''); return /^[A-Za-z0-9_:.-]+$/.test(s) ? s : null; } },
  MvrwId02: { sKind: 'idmap', fIdNew: sId => fFindIdSuffix(sId, 'dong', ['dngFT', 'dngF', 'dng', 'doing']) },
  MvrwId03: { sKind: 'idmap', fIdNew: sId => sId.trim().replace(/\s+/g, '_') },
  MvrwId04: { sKind: 'idmap', fIdNew: sId => fFindIdSuffix(sId, 'eval', ['evaluation', 'evaln', 'evln', 'eln']) },
  MvrwId05: { sKind: 'idmap', fIdNew: sId => fFindIdSuffix(sId, 'evog', ['evoluting', 'evolg', 'evltg', 'evlg', 'evg', 'Evg']) },
  MvrwId06: { sKind: 'idmap', fIdNew: sId => fFindIdSuffix(sId, 'irsc', ['resource', 'infrsc', 'ircs', 'rsc']) },
  MvrwId07: { sKind: 'idmap', fIdNew: sId => fFindIdSuffix(sId, 'pntr', ['rtr']) },
  MvrwId08: { sKind: 'idmap', fIdNew: sId => fFindIdSuffix(sId, 'chtr', ['ctr']) },
  MvrwId09: { sKind: 'idmap', fIdNew: sId => fFindIdSuffix(sId, 'wltr', ['whlchn', 'whl', 'wtr', 'P1']) },
  MvrwId10: { sKind: 'idmap', fIdNew: sId => fFindIdSuffix(sId, 'prtr', ['prt', 'ptr', 'rtr']) },
  MvrwId11: { sKind: 'idmap', fIdNew: sId => fFindIdSuffix(sId, 'gntr', ['gtr']) },
  MvrwId12: { sKind: 'idmap', fIdNew: sId => fFindIdSuffix(sId, 'sptr', ['str']) },
  MvrwId13: { sKind: 'idmap', fIdNew: sId => fFindIdSrtr(sId) },
  Hvre01:   { sKind: 'line', fPlan: (...a) => fPlanIdDup(...a) },
  Hvre02:   { sKind: 'line', fPlan: (sRaw, sName, aoIssue) => fPlanIdAdd(sRaw, sName, aoIssue, 'head') },
  Hvre03:   { sKind: 'line', fPlan: (sRaw, sName, aoIssue) => fPlanIdAdd(sRaw, sName, aoIssue, 'para') },
  Hvre04:   { sKind: 'line', fPlan: (sRaw, sName, aoIssue) => fPlanIdAdd(sRaw, sName, aoIssue, 'section') },
  Hvre05:   { sKind: 'link' },
  Hvre06:   { sKind: 'link' },
  Hvre07:   { sKind: 'line', fPlan: (...a) => fPlanTagPair(...a) },
  Hvrw01:   { sKind: 'line', fPlan: (...a) => fPlanVersion(...a) },
  Hvrw02:   { sKind: 'line', fPlan: (...a) => fPlanVersion(...a) },
  Hvrw03:   { sKind: 'line', fPlan: (...a) => fPlanSelfAnchor(...a) },
  Hvrw04:   { sKind: 'line', fPlan: (...a) => fPlanSelfAnchor(...a) },
  Hvrw05:   { sKind: 'line', fPlan: (...a) => fPlanTagCase(...a) },
  Hvrw06:   { sKind: 'line', fPlan: (...a) => fPlanAttrQuote(...a) },
  MvrwSect04: { sKind: 'line', fPlan: (...a) => fPlanNameEmpty(...a) },
  MvrwMain01: { sKind: 'main' },
  MvrwMain02: { sKind: 'main', sSuffix: 'evolg' },
  MvrwMain03: { sKind: 'main' },
  MvrwMain04: { sKind: 'main', sSuffix: 'doing' },
  MvrwMain05: { sKind: 'main', sSuffix: 'infrsc' },
  MvrwMain06: { sKind: 'main', sSuffix: 'srtr' },
  MvrwMain07: { sKind: 'line', fPlan: (...a) => fPlanAttrbase(...a) },
  MvrwMain10: { sKind: 'line', fPlan: (...a) => fPlanAttribute(...a) },
  MvrwName01: { sKind: 'line', fPlan: (...a) => fPlanFormal(...a) },
  MvrwMisc01: { sKind: 'line', fPlan: (...a) => fPlanDate(...a) },
  MvreFile01: { sKind: 'none', sWhy: 'a-file without <section id="idOverview">: write its overview, description:: and name::, by hand' },
  MvrwSect02: { sKind: 'none', sWhy: 'an-empty description:: needs its text: write it by hand' },
  MvrwGstr01: { sKind: 'gstr01', sWhy: 'which generic-chain the-specific belongs to is a-choice: add it to its generic-tree:: by hand' },
  MvrwGstr02: { sKind: 'gstr02', sWhy: 'its generic is not a-generic-tree:: name (X:generic) or not found: add it by hand' }
};

/**
 * DOING: idmap: the-renames of ONE file from its issues: the-old id from the-message
 *   (id="X", href="#X"), the-new by fIdNewIn; the-element's own ids that START with X
 *   (heading XH2, Xdsn, Xnam, a-child Xgstr) get the-new start too.
 *   It SKIPS an-id that is not unique, a-new id that is taken, an-id without a-new form.
 * OUTPUT: { oMapId: old → new, aoNote }
 */
function fPlanIdMap(sRawIn, sNameShortIn, aoIssueIn, fIdNewIn) {
  const aLine = sRawIn.split('\n');
  const oSetIdFile = new Set([...sRawIn.matchAll(/\bid="([^"]+)"/g)].map(aM => aM[1]));
  const oMapId = new Map();
  const aoNote = [];
  for (const oIssue of aoIssueIn) {
    const sIdOld = (oIssue.sMessage.match(/\bid="([^"]+)"/) ?? oIssue.sMessage.match(/href="#([^"]+)"/))?.[1]
      ?? oIssue.sIdConcept;
    if (!sIdOld || oMapId.has(sIdOld)) continue;
    const sLoc = `${sNameShortIn}:${oIssue.nLine ?? '?'}`;
    const fSkip = sWhy => aoNote.push(`SKIP   ${sLoc}  #${sIdOld}: ${sWhy}`);
    const sIdNew = fIdNewIn(sIdOld);
    if (!sIdNew || sIdNew === sIdOld) { fSkip('no new form of the-id: rename it by hand'); continue; }
    if (fCount(sRawIn, `id="${sIdOld}"`) !== 1) { fSkip(`its id occurs ${fCount(sRawIn, `id="${sIdOld}"`)} times`); continue; }
    const nLine = aLine.findIndex(sLine => sLine.includes(`id="${sIdOld}"`));
    const [nFrom, nTo] = fFindElmtRange(aLine, nLine);
    const aIdOwn = [...new Set(aLine.slice(nFrom, nTo + 1).join('\n').match(/\bid="[^"]+"/g)
      .map(sM => sM.slice(4, -1)).filter(sId => sId.startsWith(sIdOld)))];
    const aoPair = aIdOwn.map(sId => [sId, sIdNew + sId.slice(sIdOld.length)]);
    const oPairTaken = aoPair.find(([, sNew]) => oSetIdFile.has(sNew) || [...oMapId.values()].includes(sNew));
    if (oPairTaken) { fSkip(`the-new id ${oPairTaken[1]} is taken`); continue; }
    if (aoPair.some(([sOld]) => fCount(sRawIn, `id="${sOld}"`) !== 1)) { fSkip('one of its own ids is not unique'); continue; }
    for (const [sOld, sNew] of aoPair) oMapId.set(sOld, sNew);
    aoNote.push(`IDNEW  ${sLoc}  #${sIdOld} -> #${sIdNew}` +
      (aoPair.length > 1 ? `  (+${aoPair.length - 1} own ids)` : ''));
  }
  return { oMapId, aoNote };
}

/**
 * DOING: Hvre01: a-duplicated id keeps its FIRST element, the-links go there; every
 *   later element gets X_2, X_3 ... with its own clsHide self-anchor.
 *   The-number goes BEFORE the-heading-level of a-heading id: idXH3 → idX_2H3, because
 *   "H3" says <h3>. A-duplicated section X takes its own duplicated ids along:
 *   X → X_2, XH3 → X_2H3, Xdsn → X_2dsn (the-ids inside it that start with X).
 */
function fPlanIdDup(sRawIn, sNameShortIn, aoIssueIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  const oSetIdFile = new Set([...sRawIn.matchAll(/\bid="([^"]+)"/g)].map(aM => aM[1]));
  // a-line can hold 2 duplicated ids: its changes add up here, ONE edit per line
  const oMapEdit = new Map();
  // the-new form of X with number nK: idXH3 → idX_2H3, idX → idX_2
  const fIdNumbered = (sIdIn, nKIn) => {
    const aH = sIdIn.match(/^(.+?)(H[1-9])$/);
    return aH ? `${aH[1]}_${nKIn}${aH[2]}` : `${sIdIn}_${nKIn}`;
  };
  // the-duplicated ids, the-SHORTEST first: a-section X goes before its XH3, Xdsn
  const aIdDup = [...new Set(aoIssueIn.map(oIssue => oIssue.sMessage.match(/Duplicate id "([^"]+)"/)?.[1]).filter(Boolean))]
    .sort((sA, sB) => sA.length - sB.length);
  const oSetIdDup = new Set(aIdDup);
  const oSetDone = new Set();    // "id@line": renamed already, with its whole
  for (const sId of aIdDup) {
    const aAt = aLine.map((sLine, nL) => [sLine, nL]).filter(([sLine]) => sLine.includes(`id="${sId}"`)).map(aP => aP[1]);
    for (const nAt of aAt.slice(1)) {
      if (oSetDone.has(`${sId}@${nAt}`)) continue;
      if (fCount(aLine[nAt], `id="${sId}"`) !== 1) {
        aoNote.push(`SKIP   ${sNameShortIn}:${nAt + 1}  #${sId} twice on one line: fix by hand`);
        continue;
      }
      const [, nTo] = fFindElmtRange(aLine, nAt);
      // the-element's own duplicated ids: X itself, and inside it the-ids that start with X
      const aoOwn = [];
      for (let nL = nAt; nL <= nTo; nL++) {
        for (const aM of aLine[nL].matchAll(/\bid="([^"]+)"/g)) {
          const sOwn = aM[1];
          if ((nL === nAt && sOwn === sId) || (sOwn !== sId && sOwn.startsWith(sId) && oSetIdDup.has(sOwn) && !oSetDone.has(`${sOwn}@${nL}`))) {
            aoOwn.push({ sOwn, nL });
          }
        }
      }
      // the-first free number for ALL of them
      let nK = 2;
      const fNewOf = (sOwnIn, nKIn) => sOwnIn === sId ? fIdNumbered(sId, nKIn)
        : fIdNumbered(sId.replace(/H[1-9]$/, ''), nKIn).replace(/H[1-9]$/, '') + sOwnIn.slice(sId.replace(/H[1-9]$/, '').length);
      while (aoOwn.some(oO => oSetIdFile.has(fNewOf(oO.sOwn, nK)))) nK++;
      for (const { sOwn, nL } of aoOwn) {
        const sIdNew = fNewOf(sOwn, nK);
        oSetIdFile.add(sIdNew);
        oSetDone.add(`${sOwn}@${nL}`);
        let sLine = oMapEdit.get(nL) ?? aLine[nL];
        sLine = sLine.replace(`id="${sOwn}"`, `id="${sIdNew}"`);
        oMapEdit.set(nL, sLine);
        // its own self-anchor: the-first clsHide to #sOwn after its id, inside the-element
        for (let nA = nL; nA <= nTo; nA++) {
          const sNow = oMapEdit.get(nA) ?? aLine[nA];
          if (sNow.includes(`class="clsHide" href="#${sOwn}"`)) {
            oMapEdit.set(nA, sNow.replace(`class="clsHide" href="#${sOwn}"`, `class="clsHide" href="#${sIdNew}"`));
            break;
          }
        }
        aoNote.push(`IDDUP  ${sNameShortIn}:${nL + 1}  #${sOwn} -> #${sIdNew} (the-first keeps #${sOwn})`);
      }
    }
  }
  for (const [nL, sLine] of oMapEdit) aoEdit.push({ nAt: nL, nDel: 1, aIns: [sLine] });
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: the-heading of the-<section> without id on line nLIn: the-first tag after IT of
 *   <hN>, <section> or </section>; a-heading counts only if no section starts or ends first.
 * OUTPUT: the-id of that heading, or null (no heading, or a-heading without id).
 */
function fFindIdHeadNext(aLineIn, nLIn, sLineIn) {
  const rTag = /<h[1-9]\b[^>]*>|<\/?section\b[^>]*>/gi;
  const nAfter = sLineIn.search(/<section\b(?![^>]*\bid=)[^>]*>/);
  for (let nL = nLIn, nN = 0; nL < aLineIn.length && nN < 200; nL++, nN++) {
    let sText = nL === nLIn ? sLineIn : aLineIn[nL];
    if (nL === nLIn) sText = sText.slice(sText.indexOf('>', nAfter) + 1);
    rTag.lastIndex = 0;
    const aTag = rTag.exec(sText);
    if (!aTag) continue;
    if (!/^<h/i.test(aTag[0])) return null;
    return aTag[0].match(/\bid="([^"]+)"/)?.[1] ?? null;
  }
  return null;
}

/**
 * DOING: Hvre02 | Hvre03 | Hvre04: an-element without id gets one from its section:
 *   a-heading <hN> → <section-id>HN, a-<p> → <section-id>pN (with its clsHide self-anchor),
 *   a-<section> → the-id of its heading "XH1" without "H1" (X), else <whole-id>sN. The-file is scanned: the-issues name only the-section.
 *   A-<p> inside a-<div id> needs no id (the-div has it), as the-validator.
 */
function fPlanIdAdd(sRawIn, sNameShortIn, aoIssueIn, sKindIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  const oSetIdFile = new Set([...sRawIn.matchAll(/\bid="([^"]+)"/g)].map(aM => aM[1]));
  const fFree = sBase => { let n = 1; while (oSetIdFile.has(sBase + n)) n++; oSetIdFile.add(sBase + n); return sBase + n; };
  const aSect = [];          // the-open section ids
  let nDivId = 0;            // depth inside a-<div id>
  const oSetEdit = new Map(); // nL → new text
  for (let nL = 0; nL < aLine.length; nL++) {
    let sLine = oSetEdit.get(nL) ?? aLine[nL];
    const sSectNow = aSect[aSect.length - 1] ?? 'id';
    if (sKindIn === 'section' && /<section\b(?![^>]*\bid=)[^>]*>/.test(sLine)) {
      // its heading has an-id "XH1": the-section is "X"; else a-new "<whole-id>sN"
      const sIdHead = fFindIdHeadNext(aLine, nL, sLine);
      const sIdFromHead = sIdHead?.match(/^(.+)H[1-9]$/)?.[1] ?? null;
      const bFromHead = sIdFromHead !== null && !oSetIdFile.has(sIdFromHead);
      if (bFromHead) oSetIdFile.add(sIdFromHead);
      else if (sIdFromHead !== null) aoNote.push(`NOTE   ${sNameShortIn}:${nL + 1}  #${sIdFromHead} (from its heading #${sIdHead}) is used, a-new id is made`);
      const sId = bFromHead ? sIdFromHead : fFree(sSectNow + 's');
      sLine = sLine.replace(/<section\b(?![^>]*\bid=)/, `<section id="${sId}"`);
      oSetEdit.set(nL, sLine);
      aoNote.push(`IDADD  ${sNameShortIn}:${nL + 1}  <section> gets #${sId}` +
        (bFromHead ? ` (its heading #${sIdHead})` : ''));
    }
    for (const aM of sLine.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)) aSect.push(aM[1]);
    if (/<div\b[^>]*\bid=/.test(sLine)) nDivId++;
    if (sKindIn === 'head') {
      const aHead = sLine.match(/<h([1-9])\b(?![^>]*\bid=)[^>]*>/);
      if (aHead) {
        const sId = oSetIdFile.has(`${sSectNow}H${aHead[1]}`) ? fFree(`${sSectNow}H${aHead[1]}_`) : `${sSectNow}H${aHead[1]}`;
        oSetIdFile.add(sId);
        sLine = sLine.replace(/<h([1-9])\b(?![^>]*\bid=)/, `<h$1 id="${sId}"`);
        oSetEdit.set(nL, sLine);
        aoNote.push(`IDADD  ${sNameShortIn}:${nL + 1}  <h${aHead[1]}> gets #${sId}`);
      }
    }
    if (sKindIn === 'para' && nDivId === 0 && /<p\b(?![^>]*\bid=)[^>]*>/.test(sLine)) {
      const sId = fFree(sSectNow + 'p');
      sLine = sLine.replace(/<p\b(?![^>]*\bid=)/, `<p id="${sId}"`);
      oSetEdit.set(nL, sLine);
      // its self-anchor before its </p>
      const [, nTo] = fFindElmtRange(aLine, nL);
      const sClose = oSetEdit.get(nTo) ?? aLine[nTo];
      if (sClose.includes('</p>')) {
        const nIdx = sClose.lastIndexOf('</p>');
        oSetEdit.set(nTo, sClose.slice(0, nIdx) + `<a class="clsHide" href="#${sId}"></a>` + sClose.slice(nIdx));
      }
      aoNote.push(`IDADD  ${sNameShortIn}:${nL + 1}  <p> gets #${sId}`);
    }
    nDivId = Math.max(0, nDivId - (nDivId > 0 ? fCount(sLine, '</div>') : 0));
    for (let n = fCount(sLine, '</section>'); n > 0; n--) aSect.pop();
  }
  for (const [nL, sLine] of oSetEdit) aoEdit.push({ nAt: nL, nDel: 1, aIns: [sLine] });
  if (aoIssueIn.length && !aoEdit.length) aoNote.push(`SKIP   ${sNameShortIn}  no element without id found by the-scan`);
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: Hvrw03 | Hvrw04: the-clsHide self-anchor of a-para (or div) with id X:
 *   missing → <a class="clsHide" href="#X"></a> before its </p> (</div>); pointing
 *   elsewhere → it points to #X.
 */
function fPlanSelfAnchor(sRawIn, sNameShortIn, aoIssueIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  const oMapEdit = new Map();
  for (const oIssue of aoIssueIn) {
    const sId = oIssue.sMessage.match(/> "([^"]+)"/)?.[1];
    const sTag = oIssue.sMessage.match(/^<(\w+)>/)?.[1] ?? 'p';
    const nLine = aLine.findIndex(sLine => sLine.includes(`id="${sId}"`));
    if (!sId || nLine === -1) continue;
    const sLoc = `${sNameShortIn}:${nLine + 1}`;
    const [, nTo] = fFindElmtRange(aLine, nLine);
    const sCloseTag = sTag === 'div' ? '</div>' : '</p>';
    const sAnchor = `<a class="clsHide" href="#${sId}"></a>`;
    if (oIssue.sCode === 'Hvrw03') {
      const sClose = oMapEdit.get(nTo) ?? aLine[nTo];
      if (!sClose.includes(sCloseTag)) { aoNote.push(`SKIP   ${sLoc}  #${sId}: its ${sCloseTag} is not found`); continue; }
      const nIdx = sClose.lastIndexOf(sCloseTag);
      oMapEdit.set(nTo, fLineClean(sClose).trim() === sCloseTag
        ? sClose.replace(sCloseTag, `  ${sAnchor}${sCloseTag}`)
        : sClose.slice(0, nIdx) + sAnchor + sClose.slice(nIdx));
      aoNote.push(`ANCHOR ${sLoc}  #${sId} gets its clsHide self-anchor`);
    } else {
      const sHrefOld = oIssue.sMessage.match(/points to #(\S+)/)?.[1];
      let bDone = false;
      for (let nL = nTo; nL >= nLine && !bDone; nL--) {
        const sNow = oMapEdit.get(nL) ?? aLine[nL];
        if (sNow.includes(`class="clsHide" href="#${sHrefOld}"`)) {
          oMapEdit.set(nL, sNow.replace(`class="clsHide" href="#${sHrefOld}"`, `class="clsHide" href="#${sId}"`));
          bDone = true;
        }
      }
      aoNote.push(bDone ? `ANCHOR ${sLoc}  #${sId}: its self-anchor #${sHrefOld} -> #${sId}`
        : `SKIP   ${sLoc}  #${sId}: its self-anchor #${sHrefOld} is not found`);
    }
  }
  for (const [nL, sLine] of oMapEdit) aoEdit.push({ nAt: nL, nDel: 1, aIns: [sLine] });
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: Hvrw05: <P> → <p>, </P> → </p> on the-issue's line.
 */
function fPlanTagCase(sRawIn, sNameShortIn, aoIssueIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  const oMapEdit = new Map();
  for (const oIssue of aoIssueIn) {
    const sTag = oIssue.sMessage.match(/element <([^>\s]+)>/)?.[1];
    const nL = (oIssue.nLine ?? 0) - 1;
    if (!sTag || nL < 0) continue;
    const sNow = oMapEdit.get(nL) ?? aLine[nL];
    const sNew = sNow.replace(new RegExp(`<(/?)${sTag}\\b`, 'g'), (sAll, sSlash) => `<${sSlash}${sTag.toLowerCase()}`);
    if (sNew === sNow) { aoNote.push(`SKIP   ${sNameShortIn}:${nL + 1}  <${sTag}> is not on its line`); continue; }
    oMapEdit.set(nL, sNew);
    aoNote.push(`CASE   ${sNameShortIn}:${nL + 1}  <${sTag}> -> <${sTag.toLowerCase()}>`);
  }
  for (const [nL, sLine] of oMapEdit) aoEdit.push({ nAt: nL, nDel: 1, aIns: [sLine] });
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: Hvrw06: attr='v' | attr=v → attr="v" on the-issue's line; a-value with " is skipped.
 */
function fPlanAttrQuote(sRawIn, sNameShortIn, aoIssueIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  const oMapEdit = new Map();
  for (const oIssue of aoIssueIn) {
    const aM = oIssue.sMessage.match(/^Attribute (\S+?)=('?)(.*?)\2 (?:uses|is unquoted)/);
    const nL = (oIssue.nLine ?? 0) - 1;
    if (!aM || nL < 0) continue;
    const [, sAttr, sQuote, sValue] = aM;
    const sLoc = `${sNameShortIn}:${nL + 1}`;
    if (sValue.includes('"')) { aoNote.push(`SKIP   ${sLoc}  ${sAttr}: its value has "`); continue; }
    const sNow = oMapEdit.get(nL) ?? aLine[nL];
    const sOld = `${sAttr}=${sQuote}${sValue}${sQuote}`;
    if (!sNow.includes(sOld)) { aoNote.push(`SKIP   ${sLoc}  ${sOld} is not on its line`); continue; }
    oMapEdit.set(nL, sNow.replace(sOld, `${sAttr}="${sValue}"`));
    aoNote.push(`QUOTE  ${sLoc}  ${sOld} -> ${sAttr}="${sValue}"`);
  }
  for (const [nL, sLine] of oMapEdit) aoEdit.push({ nAt: nL, nDel: 1, aIns: [sLine] });
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: Hvre07: an-unclosed <p> gets its </p> where the-browser closes it anyway:
 *   at the-end of its last line before the-next <p>, <section>, </section>, <div>, <hN>.
 *   A-stray close tag, or another unclosed tag, needs you: SKIP.
 */
function fPlanTagPair(sRawIn, sNameShortIn, aoIssueIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  // a-heading opened <h4> and closed </h3>: "Unclosed <h4>" + "Stray </h3>" up to 3 lines below it
  const oSetDone = new Set();
  for (const oOpen of aoIssueIn) {
    const aOpen = oOpen.sMessage.match(/^Unclosed <(h[1-9])>/);
    if (!aOpen) continue;
    const oStray = aoIssueIn.find(oIn => !oSetDone.has(oIn) && /^Stray <\/h[1-9]>/.test(oIn.sMessage) &&
      oIn.nLine >= oOpen.nLine && oIn.nLine <= oOpen.nLine + 3);
    if (!oStray) continue;
    const sStray = oStray.sMessage.match(/^Stray <\/(h[1-9])>/)[1];
    const nL = oStray.nLine - 1;
    aoEdit.push({ nAt: nL, nDel: 1, aIns: [aLine[nL].replace(`</${sStray}>`, `</${aOpen[1]}>`)] });
    aoNote.push(`CLOSE  ${sNameShortIn}:${nL + 1}  </${sStray}> -> </${aOpen[1]}> of the-<${aOpen[1]}> of line ${oOpen.nLine}`);
    oSetDone.add(oOpen); oSetDone.add(oStray);
  }
  for (const oIssue of aoIssueIn) {
    if (oSetDone.has(oIssue)) continue;
    const nL = (oIssue.nLine ?? 0) - 1;
    const sLoc = `${sNameShortIn}:${nL + 1}`;
    if (!/^Unclosed <p>/.test(oIssue.sMessage) || nL < 0) {
      aoNote.push(`SKIP   ${sLoc}  ${oIssue.sMessage.split(' —')[0]}: fix by hand`);
      continue;
    }
    let nEnd = nL;
    for (let nN = nL + 1; nN < aLine.length; nN++) {
      if (/^\s*(<p\b|<section\b|<\/section>|<div\b|<h[1-9]\b)/.test(aLine[nN])) break;
      if (aLine[nN].trim() !== '') nEnd = nN;
    }
    const sLast = fLineClean(aLine[nEnd]);
    aoEdit.push({ nAt: nEnd, nDel: 1, aIns: [aLine[nEnd].replace(sLast, sLast + '</p>')] });
    aoNote.push(`CLOSE  ${sNameShortIn}:${nEnd + 1}  </p> of the-<p> of line ${nL + 1}`);
  }
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: Hvrw01 | Hvrw02: a-title version "(N-N-N.YYYY-MM-DD)" gets the-file name in front;
 *   else the-<title> gets the-version of the-file's end,
 *   <p id="idMetaVersion">: its latest "version.N-N-N.YYYY-MM-DD" line, as
 *   "(McshXxx000000.N-N-N.YYYY-MM-DD)". Without such a-line: SKIP.
 */
function fPlanVersion(sRawIn, sNameShortIn, aoIssueIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  if (!aoIssueIn.length) return { aoEdit, aoNote, sRawNew: sRawIn };
  // a-title version "(N-N-N.YYYY-MM-DD)" without the-file name: the-name is added in front
  const nTitleNoName = aLine.findIndex(sLine => /<title\b/i.test(sLine));
  if (nTitleNoName !== -1) {
    let nCloseNoName = nTitleNoName;
    while (nCloseNoName < aLine.length - 1 && !/<\/title>/i.test(aLine[nCloseNoName])) nCloseNoName++;
    const rVerNoName = /\((\d+-\d+-\d+\.\d{4}-\d{2}-\d{2})\)/;
    for (let nL = nTitleNoName; nL <= nCloseNoName; nL++) {
      if (!rVerNoName.test(aLine[nL])) continue;
      const sLineNew = aLine[nL].replace(rVerNoName, `(${sNameShortIn}.$1)`);
      aoEdit.push({ nAt: nL, nDel: 1, aIns: [sLineNew] });
      aoNote.push(`TITLE  ${sNameShortIn}:${nL + 1}  <title> version gets the-file name: ${sLineNew.trim()}`);
      return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
    }
  }
  const sParaVer = sRawIn.match(/<p id="idMetaVersion">[\s\S]*?<\/p>/)?.[0] ?? '';
  const aoVer = [...sParaVer.matchAll(/version\.(\d+-\d+-\d+)\.(\d{4}-\d{2}-\d{2})/g)]
    .map(aM => ({ sVer: aM[1], sDate: aM[2] })).sort((oA, oB) => oB.sDate.localeCompare(oA.sDate));
  const nTitle = aLine.findIndex(sLine => /<title\b/i.test(sLine));
  if (!aoVer.length || nTitle === -1) {
    aoNote.push(`SKIP   ${sNameShortIn}  no <title> or no dated version-line in idMetaVersion: fix by hand`);
    return { aoEdit, aoNote, sRawNew: sRawIn };
  }
  let nClose = nTitle;
  while (nClose < aLine.length - 1 && !/<\/title>/i.test(aLine[nClose])) nClose++;
  const sVersion = `${sNameShortIn}.${aoVer[0].sVer}.${aoVer[0].sDate}`;
  const sTitle = aLine.slice(nTitle, nClose + 1).join('\n');
  // a-malformed "(...)" is replaced, else the-version is added before </title>
  const sTitleNew = /\([^)]*\)/.test(sTitle)
    ? sTitle.replace(/\([^)]*\)/, `(${sVersion})`)
    : sTitle.replace(/\s*<\/title>/i, `\n    (${sVersion})</title>`);
  aoEdit.push({ nAt: nTitle, nDel: nClose - nTitle + 1, aIns: sTitleNew.split('\n') });
  aoNote.push(`TITLE  ${sNameShortIn}:${nTitle + 1}  <title> gets (${sVersion})`);
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: MvrwSect04: a-name::-para without a-valid Mcsh-name gets "<br>* McshEngl.<heading>,"
 *   as its first line. A-heading with "," or "!" is skipped.
 */
function fPlanNameEmpty(sRawIn, sNameShortIn, aoIssueIn, sNameDirIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  const oSetNameAll = fFindNameAll(sNameDirIn);
  for (const oIssue of aoIssueIn) {
    const sIdSect = oIssue.sIdConcept;
    const nSect = aLine.findIndex(sLine => fLineClean(sLine).match(rSectOpen)?.[1] === sIdSect);
    const sLoc = `${sNameShortIn}:${nSect + 1}`;
    const sName = String(oIssue.sConcept ?? '').replace(/\s+/g, ' ').trim();
    if (nSect === -1) { aoNote.push(`SKIP   ${sNameShortIn}  #${sIdSect}: no <section id> with it`); continue; }
    const sWhyBad = fFindNameBad(sName, oSetNameAll);
    if (sWhyBad) { aoNote.push(`SKIP   ${sLoc}  #${sIdSect} heading "${sName}" ${sWhyBad}: give the-name by hand`); continue; }
    const nOwnEnd = fFindSectOwnEnd(aLine, nSect);
    const nName = aLine.findIndex((sLine, nL) => nL > nSect && nL < nOwnEnd && rNameOpen.test(fLineClean(sLine)));
    if (nName === -1) { aoNote.push(`SKIP   ${sLoc}  #${sIdSect}: its name::-para is not a-plain <p id> one`); continue; }
    aoEdit.push({ nAt: nName + 1, nDel: 0, aIns: [fFindIndentNext(aLine, nName, aLine[nName].match(/^( *)/)[1]) + `<br>* McshEngl.${sName},`] });
    aoNote.push(`NAME   ${sLoc}  #${sIdSect}  McshEngl.${sName}`);
  }
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: MvrwMain07: a-misplaced Attrbase-line "McshEngl.B!Attrbase[!⇒M]," moves right after
 *   "M!@McshXxx" (a-file-concept) or "M!=I" of its name::-para. A-badly written line is skipped.
 */
function fPlanAttrbase(sRawIn, sNameShortIn, aoIssueIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  for (const oIssue of aoIssueIn) {
    const nL = (oIssue.nLine ?? 0) - 1;
    const sLoc = `${sNameShortIn}:${nL + 1}`;
    if (nL < 0 || !/^\s*<br>\*\s*McshEngl\.[^!,\s]+!Attrbase(!⇒[^!,\s]+)?,/.test(aLine[nL] ?? '')) {
      aoNote.push(`SKIP   ${sLoc}  the-Attrbase-line is not "McshEngl.B!Attrbase," or "McshEngl.B!Attrbase!⇒M,": fix by hand`);
      continue;
    }
    // its para: up to <p ... name:: above, down to </p>
    let nOpen = nL; while (nOpen > 0 && !/name::/.test(aLine[nOpen])) nOpen--;
    let nClose = nL; while (nClose < aLine.length - 1 && !aLine[nClose].includes('</p>')) nClose++;
    const aIdx = [];
    for (let nN = nOpen + 1; nN < nClose; nN++) if (nN !== nL && /^\s*<br>\*\s*McshEngl\./.test(aLine[nN])) aIdx.push(nN);
    const nAfter = aIdx.find(nN => /^\s*<br>\*\s*McshEngl\.[^!,]+!@Mcsh/.test(aLine[nN]))
      ?? aIdx.find(nN => /^\s*<br>\*\s*McshEngl\.[^!,]+![=][^!,]+,/.test(aLine[nN]));
    if (nAfter === undefined) { aoNote.push(`SKIP   ${sLoc}  its name::-para has no "M!=I" or "M!@McshXxx" line`); continue; }
    if (nAfter === nL - 1) continue;   // in place already
    aoEdit.push({ nAt: nL, nDel: 1, aIns: [] });
    aoEdit.push({ nAt: nAfter + 1, nDel: 0, aIns: [aLine[nL]] });
    aoNote.push(`MOVE   ${sLoc}  the-Attrbase-line goes after line ${nAfter + 1}`);
  }
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: MvrwMain10: the-CLEAR cases of an-attribute | attribute-specific section of a-concept with main-name M:
 *   a) title "X'y" (X any, y without ".")       → "y of M" (an-attribute)
 *   b) title "X.y", X a-name of M ("X!⇒M,")     → "M.y" (a-specific); "X.EVOLUTING" → "evoluting of M"
 *   c) title "x of X", X a-name of M             → "x of M"
 *   then its formal name M'x | M.y goes first in its name:: (a-pointer "!⇒Mmn" when the-section has a-main-name;
 *   a-new name:: right after the-heading when it has none). The-"(…)" "{…}" "<a" tail of a-title is kept.
 *   SKIPPED, a-decision by hand: a-title "of X" with X another concept (the-section may belong elsewhere),
 *   an-attribute name M'x where the-title says specific M.x (or the-reverse), other title forms.
 */
function fPlanAttribute(sRawIn, sNameShortIn, aoIssueIn) {
  const aLine = sRawIn.split('\n');
  const aoNote = [];
  const fEsc = sIn => sIn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fForm = sIn => sIn.replace(/-+/g, '_').replace(/\s+/g, '_');
  // the-English names of section sIdIn: { nName (line of name::), aName, sMain }
  const fNamesOf = sIdIn => {
    const nName = aLine.findIndex(sL => sL.includes(`<p id="${sIdIn}nam">name::`));
    if (nName === -1) return { nName, aName: [], sMain: '' };
    const aName = [], oSetMain = new Set();
    for (let nL = nName + 1; nL < aLine.length && !aLine[nL].includes('</p>'); nL++) {
      const aM = /^\s*<br>\*\s*McshEngl\.([^!,]+)(?:!=[^,!]*)?(?:!⇒([^,!\s]+))?,/.exec(aLine[nL]);
      if (aM) { aName.push(aM[1]); if (aM[2]) oSetMain.add(aM[2]); }
    }
    return { nName, aName, sMain: oSetMain.size === 1 ? [...oSetMain][0] : '' };
  };
  // true: X is a-name of the-concept with main-name M (a-line "McshEngl.X!⇒M," in the-file)
  const fIsNameOf = (sXIn, sMIn) => sXIn === sMIn || aLine.some(sL => new RegExp(`<br>\\*\\s*McshEngl\\.${fEsc(sXIn)}!⇒${fEsc(sMIn)},`).test(sL));
  const aoEdit = [];
  for (const oIssue of aoIssueIn) {
    const aMsg = /attribute: "(.*)" \((id[^)]+)\) of (?:file-concept )?"([^"]+)": (.*)$/.exec(oIssue.sMessage ?? '');
    const sLoc = `${sNameShortIn}:${oIssue.nLine ?? '?'}`;
    if (!aMsg) { aoNote.push(`SKIP   ${sLoc}  MvrwMain10: message not understood`); continue; }
    const [, sTitleNorm, sId, sM] = aMsg;
    const nH = aLine.findIndex(sL => new RegExp(`<h[1-7] id="${fEsc(sId)}H[1-7]">`).test(sL));
    if (nH === -1) { aoNote.push(`SKIP   ${sLoc}  #${sId}: heading not found`); continue; }
    const aH = /^(\s*<h[1-7] id="[^"]+">)(.*?)(\s*(?:\(|\{|<a).*)?(\r?)$/.exec(aLine[nH]);
    const sTitle = aH[2].replace(/\s*,\s*$/, '').trim(), sTail = aH[3] ?? '', sCr = aH[4];
    if (sTitle !== sTitleNorm) { aoNote.push(`SKIP   ${sLoc}  #${sId} "${sTitleNorm}": the-title has "(…)" or "{…}" inside, by hand`); continue; }
    let sTitleNew = null, sNameNew = null, aM;
    if ((aM = /^(\d+_)?(.+?) of (\S+)$/.exec(sTitle))) {                          // c)
      if (!fIsNameOf(aM[3], sM)) { aoNote.push(`SKIP   ${sLoc}  #${sId} "${sTitle}": "${aM[3]}" is not a-name of ${sM}, the-section may belong to ${aM[3]}: by hand`); continue; }
      sTitleNew = `${aM[1] ?? ''}${aM[2]} of ${sM}`; sNameNew = `${sM}'${fForm(aM[2])}`;
    } else if ((aM = /^([^\s'.]+(?:\.[^\s'.]+)*)'([^'.]+)$/.exec(sTitle))) {      // a)
      sTitleNew = `${aM[2]} of ${sM}`; sNameNew = `${sM}'${fForm(aM[2])}`;
    } else if (sTitle.startsWith(sM + '.')) {                                      // b) title in form, name missing
      sTitleNew = sTitle; sNameNew = fForm(sTitle);
    } else if ((aM = /^([^\s'.]+)\.(.+)$/.exec(sTitle)) && fIsNameOf(aM[1], sM)) { // b)
      if (/^EVOLUTING$/i.test(aM[2])) { sTitleNew = `evoluting of ${sM}`; sNameNew = `${sM}'evoluting`; }
      else { sTitleNew = `${sM}.${aM[2]}`; sNameNew = fForm(sTitleNew); }
    } else {
      aoNote.push(`SKIP   ${sLoc}  #${sId} "${sTitle}": not "X'y", "X.y" or "x of X" with X a-name of ${sM}: by hand`); continue;
    }
    const oNames = fNamesOf(sId);
    // the-other form of the-name is there: attribute M'x vs specific M.x — a-decision
    const sOther = sNameNew.startsWith(sM + "'") ? `${sM}.${sNameNew.slice(sM.length + 1)}` : sNameNew.startsWith(sM + '.') ? `${sM}'${sNameNew.slice(sM.length + 1)}` : '';
    if (sOther && oNames.aName.includes(sOther)) { aoNote.push(`SKIP   ${sLoc}  #${sId} "${sTitle}": its name is "${sOther}", the-title says "${sNameNew}": attribute or specific? by hand`); continue; }
    if (sTitleNew !== sTitle) aoEdit.push({ nAt: nH, nDel: 1, aIns: [`${aH[1]}${sTitleNew}${sTail}${sCr}`] });
    if (!oNames.aName.includes(sNameNew)) {
      const sLineName = `    <br>* McshEngl.${sNameNew}${oNames.sMain ? '!⇒' + oNames.sMain : ''},${sCr}`;
      if (oNames.nName !== -1) aoEdit.push({ nAt: oNames.nName + 1, nDel: 0, aIns: [sLineName] });
      else {
        let nE = nH; while (nE < aLine.length && !/<\/h[1-7]>/.test(aLine[nE])) nE++;
        aoEdit.push({ nAt: nE + 1, nDel: 0, aIns: [`  <p id="${sId}nam">name::${sCr}`, sLineName, `    <a class="clsHide" href="#${sId}nam"></a></p>${sCr}`] });
      }
    }
    aoNote.push(`ATTR   ${sLoc}  #${sId}  "${sTitle}"${sTitleNew !== sTitle ? ` → "${sTitleNew}"` : ''}  + McshEngl.${sNameNew}`);
  }
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: MvrwName01: a-formal-name (X'Y, X.Y, X:Y, X;Y, X;;Y, X/Y, X//Y) with a-space | hyphen gets "_"
 *   in their place (fFormalMvrwName01, outside "(…)" "{…}"), in the-file:
 *   a) a-name-line of a-name::-para: the-name is renamed in place, its "!…" notations stay;
 *      an-old spelling "X'a-b!⇒X'a_b," is deleted when its para has a-line of X'a_b;
 *      a-renamed line equal to another line of its para is deleted;
 *   b) a-formal title: renamed in its heading.
 *   SKIPPED: a-name that is a-main-name (a "!⇒" target in the-file): it is the-work of --mainname;
 *   an-old spelling without its "_" line; a-line | heading not found.
 */
function fPlanFormal(sRawIn, sNameShortIn, aoIssueIn) {
  const aLine = sRawIn.split('\n');
  const aoNote = [];
  const fEsc = sIn => sIn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const oSetTarget = new Set([...sRawIn.matchAll(/!⇒([^,!\r\n]+)/g)].map(aM => aM[1].trim()));
  // the-lines of the-<p> of line nIn
  const fFindPara = nIn => {
    let nFrom = nIn, nTo = nIn;
    while (nFrom > 0 && !/<p[\s>]/.test(aLine[nFrom])) nFrom--;
    while (nTo < aLine.length - 1 && !aLine[nTo].includes('</p>')) nTo++;
    return [nFrom, nTo];
  };
  const oMapNew = new Map();   // line index → its new line, null: deleted
  const aoRename = [];         // the-renamed name-lines, for the-duplicates
  for (const oIssue of aoIssueIn) {
    const sLoc = `${sNameShortIn}:${oIssue.nLine ?? '?'}`;
    const sMsg = oIssue.sMessage ?? '';
    let aMsg;
    if ((aMsg = /^formal: title "(.*)" has (?:space|hyphen)/.exec(sMsg))) {
      const sTitle = aMsg[1], sTitleNew = fFormalMvrwName01(sTitle);
      let nH = (oIssue.nLine ?? 0) - 1;
      const nEnd = Math.min(aLine.length, nH + 6);
      while (nH >= 0 && nH < nEnd && !(/<h[1-9] id="[^"]*">/.test(aLine[nH]) && aLine[nH].includes('>' + sTitle))) nH++;
      if (nH < 0 || nH >= nEnd || oMapNew.has(nH)) { aoNote.push(`SKIP   ${sLoc}  title "${sTitle}": heading not found`); continue; }
      oMapNew.set(nH, aLine[nH].replace('>' + sTitle, () => '>' + sTitleNew));
      aoNote.push(`FORMAL ${sNameShortIn}:${nH + 1}  title "${sTitle}" → "${sTitleNew}"`);
    } else if ((aMsg = /^formal: name "(Mcsh[A-Z][a-z]{3})\.(.*)" has (?:space|hyphen)/.exec(sMsg))) {
      const [, sLago, sName] = aMsg, sNameNew = fFormalMvrwName01(sName), nL = (oIssue.nLine ?? 0) - 1;
      const aL = nL >= 0 && nL < aLine.length && !oMapNew.has(nL)
        ? new RegExp(`^(\\s*<br>\\*\\s*${sLago}\\.\\s*)${fEsc(sName)}(\\s*(?:[!,][\\s\\S]*)?)$`).exec(aLine[nL]) : null;
      if (!aL) { aoNote.push(`SKIP   ${sLoc}  name "${sLago}.${sName}": name-line not found`); continue; }
      if (oSetTarget.has(sName)) { aoNote.push(`SKIP   ${sLoc}  name "${sLago}.${sName}": it is a-main-name (a "!⇒" target): use --mainname`); continue; }
      const sTarget = (/^\s*!⇒([^,!\r\n]+)/.exec(aL[2]) ?? [])[1]?.trim();
      if (sTarget === sNameNew) {
        // an-old spelling of the-"_" name
        const [nFrom, nTo] = fFindPara(nL);
        const rNew = new RegExp(`<br>\\*\\s*${sLago}\\.${fEsc(sNameNew)}\\s*[!,]`);
        if (!aLine.slice(nFrom, nTo + 1).some(sL => rNew.test(sL))) { aoNote.push(`SKIP   ${sLoc}  name "${sLago}.${sName}": an-old spelling of "${sNameNew}", which has no line in its para: by hand`); continue; }
        oMapNew.set(nL, null);
        aoNote.push(`FORMAL ${sLoc}  name "${sLago}.${sName}!⇒${sNameNew}" deleted: an-old spelling`);
        continue;
      }
      oMapNew.set(nL, aL[1] + sNameNew + aL[2]);
      aoRename.push({ nL, sLoc, sText: `name "${sLago}.${sName}" → "${sNameNew}"` });
    } else {
      aoNote.push(`SKIP   ${sLoc}  MvrwName01: message not understood`);
    }
  }
  // a-renamed line equal to another line of its para is deleted
  const fNow = nIn => oMapNew.has(nIn) ? oMapNew.get(nIn) : aLine[nIn];
  for (const { nL, sLoc, sText } of aoRename) {
    const [nFrom, nTo] = fFindPara(nL);
    const sNew = fNow(nL).trim();
    let bDup = false;
    for (let nK = nFrom; nK <= nTo && !bDup; nK++) bDup = nK !== nL && fNow(nK) !== null && fNow(nK).trim() === sNew;
    if (bDup) oMapNew.set(nL, null);
    aoNote.push(`FORMAL ${sLoc}  ${sText}${bDup ? ', deleted: its para has this line' : ''}`);
  }
  const aoEdit = [...oMapNew].map(([nAt, sNew]) => ({ nAt, nDel: 1, aIns: sNew === null ? [] : [sNew] }));
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * DOING: MvrwMisc01: a-date {2022-4-7} → {2022-04-07} (one digit month|day padded),
 *   everywhere in the-file; other forms are skipped.
 */
function fPlanDate(sRawIn, sNameShortIn, aoIssueIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  const oMap = new Map();
  for (const oIssue of aoIssueIn) {
    const sTok = oIssue.sMessage.match(/DATE "(\{[^}]*\})"/)?.[1];
    if (!sTok || oMap.has(sTok)) continue;
    const aM = sTok.match(/^\{(\d{4})-(\d{1,2})(?:-(\d{1,2}))?\}$/);
    if (!aM) { aoNote.push(`SKIP   ${sNameShortIn}  ${sTok}: not a-YYYY-M-D date, fix by hand`); continue; }
    oMap.set(sTok, `{${aM[1]}-${aM[2].padStart(2, '0')}${aM[3] ? '-' + aM[3].padStart(2, '0') : ''}}`);
  }
  aLine.forEach((sLine, nL) => {
    let sNew = sLine;
    for (const [sOld, sGood] of oMap) sNew = sNew.split(sOld).join(sGood);
    if (sNew === sLine) return;
    aoEdit.push({ nAt: nL, nDel: 1, aIns: [sNew] });
    aoNote.push(`DATE   ${sNameShortIn}:${nL + 1}  ${[...oMap.keys()].filter(s => sLine.includes(s)).join(' ')}`);
  });
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * OUTPUT: the-new main-name of MvrwMain02..06 or null: capital first, no apostrophe before
 *   the-suffix (Food'evaln → Foodevaln); a-genericSpecific name keeps its small-letter word
 *   (foodLemon'evaln → foodLemonevaln), as the-validator. A-main-name WITHOUT the-suffix
 *   gets sBaseIn + the-suffix; without sBaseIn: null.
 */
function fFindMainNew(sMainIn, sSuffixIn, sBaseIn = '') {
  let sMain = sMainIn;
  if (sMain.endsWith("'" + sSuffixIn)) sMain = sMain.slice(0, -sSuffixIn.length - 1) + sSuffixIn;
  // without the-suffix: the-Attrbase (or main-name) of its whole + the-suffix (Smp → Smpsrtr), as mMcshNew.mjs
  if (!sMain.endsWith(sSuffixIn)) sMain = sBaseIn ? sBaseIn + sSuffixIn : '';
  if (!sMain) return null;
  if (/^[a-z]+[A-Z]/.test(sMain)) return sMain;
  return sMain.charAt(0).toUpperCase() + sMain.slice(1);
}

/**
 * OUTPUT: the-main-name of the-whole of section sIdSectIn (its name::-para's ONE !⇒ target);
 *   '' when the-whole or its main-name is not found.
 */
function fFindMainOfWhole(aLineIn, sIdSectIn) {
  const nSect = aLineIn.findIndex(sLine => fLineClean(sLine).match(rSectOpen)?.[1] === sIdSectIn);
  if (nSect <= 0) return '';
  const nWhole = fFindSectOpen(aLineIn, nSect);
  const sIdWhole = nWhole === -1 ? '' : fLineClean(aLineIn[nWhole]).match(rSectOpen)?.[1] ?? '';
  return sIdWhole ? fFindMainOfSect(aLineIn, sIdWhole)?.sMain ?? '' : '';
}

/**
 * OUTPUT: the-Attrbase B of the-nearest whole of a-section that has one
 *   ("McshEngl.B!Attrbase[!⇒M],"), up to the-file's idName; '' when none.
 */
function fFindAttrbase(aLineIn, sIdSectIn) {
  const fOfPara = (nFromIn, nToIn) => {
    for (let nL = nFromIn; nL < nToIn; nL++) {
      const aM = aLineIn[nL].match(/^\s*<br>\*\s*McshEngl\.([^!,\s]+)!Attrbase\b/);
      if (aM) return aM[1];
    }
    return '';
  };
  let nSect = aLineIn.findIndex(sLine => fLineClean(sLine).match(rSectOpen)?.[1] === sIdSectIn);
  while (nSect > 0) {
    nSect = fFindSectOpen(aLineIn, nSect);       // its whole
    if (nSect === -1) break;
    const sB = fOfPara(nSect, fFindSectOwnEnd(aLineIn, nSect));
    if (sB) return sB;
  }
  const nName = aLineIn.findIndex(sLine => sLine.includes('<p id="idName">name::'));
  if (nName === -1) return '';
  let nEnd = nName; while (nEnd < aLineIn.length - 1 && !aLineIn[nEnd].includes('</p>')) nEnd++;
  return fOfPara(nName, nEnd);
}

/**
 * DOING: Hvre05 | Hvre06: a-broken link is re-pointed ONLY when ONE target is certain:
 *   a-missing file → the-ONE .last.html of the-worldview with its name;
 *   a-missing #id → the-ONE id of the-target file equal to it in any letter case.
 * INPUT: oMapFileIn: name → [relative paths]; ooSetIdIn: relative path → Set of its ids.
 */
function fPlanLink(sRawIn, sNameShortIn, aoIssueIn, sPathFileIn, sNameDirIn, oMapFileIn, ooSetIdIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  const oMapEdit = new Map();
  const sDirFile = moPath.dirname(sPathFileIn);
  for (const oIssue of aoIssueIn) {
    const nL = (oIssue.nLine ?? 0) - 1;
    const sLoc = `${sNameShortIn}:${nL + 1}`;
    const fSkip = sWhy => aoNote.push(`SKIP   ${sLoc}  ${sWhy}`);
    if (nL < 0) { fSkip('no line: ' + oIssue.sMessage.slice(0, 80)); continue; }
    const sNow = oMapEdit.get(nL) ?? aLine[nL];
    if (oIssue.sCode === 'Hvre05') {
      // the-message: Broken link: FILE not found href="X"
      const sHref = oIssue.sMessage.match(/FILE not found href="([^"]+)"/)?.[1];
      if (!sHref || !sNow.includes(`href="${sHref}"`)) { fSkip(`the-link is not on its line: ${oIssue.sMessage.slice(0, 80)}`); continue; }
      const [sPathPart, sAnchor] = sHref.split('#');
      const aCand = oMapFileIn.get(moPath.posix.basename(sPathPart)) ?? [];
      if (aCand.length !== 1) { fSkip(`${sPathPart}: ${aCand.length} files with its name, fix by hand`); continue; }
      let sRel = moPath.relative(sDirFile, moPath.join(sNameDirIn, aCand[0])).split(moPath.sep).join('/');
      if (!sRel.startsWith('.')) sRel = './' + sRel;
      if (sPathPart.startsWith('../') && sRel.startsWith('./')) sRel = sRel.slice(2);
      const sHrefNew = sRel + (sAnchor ? '#' + sAnchor : '');
      oMapEdit.set(nL, sNow.split(`href="${sHref}"`).join(`href="${sHrefNew}"`));
      aoNote.push(`LINKFX ${sLoc}  ${sHref} -> ${sHrefNew}`);
    } else {
      // the-message: Broken anchor: ID not found href="X#Y" (or "#Y"); the-target file is
      //   resolved as the-validator does: worldview-relative, this file for "#Y"
      const sHrefBad = oIssue.sMessage.match(/ID not found href="([^"]*#[^"]*)"/)?.[1];
      if (!sHrefBad) { fSkip(oIssue.sMessage.slice(0, 80)); continue; }
      const [sFilePart, sAnchor] = sHrefBad.split('#');
      const sTarget = moPath.relative(sNameDirIn, sFilePart ? moPath.resolve(sDirFile, sFilePart) : sPathFileIn)
        .split(moPath.sep).join('/');
      const oSetId = ooSetIdIn.get(sTarget) ?? ooSetIdIn.get(moPath.posix.basename(sTarget));
      const aCand = oSetId ? [...oSetId].filter(sId => sId.toLowerCase() === sAnchor.toLowerCase()) : [];
      if (aCand.length !== 1 || !sNow.includes(`#${sAnchor}"`)) {
        fSkip(`#${sAnchor} in ${sTarget}: ${aCand.length} ids differ only in case, fix by hand`);
        continue;
      }
      oMapEdit.set(nL, sNow.split(`#${sAnchor}"`).join(`#${aCand[0]}"`));
      aoNote.push(`LINKFX ${sLoc}  #${sAnchor} -> #${aCand[0]}`);
    }
  }
  for (const [nL, sLine] of oMapEdit) aoEdit.push({ nAt: nL, nDel: 1, aIns: [sLine] });
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * OUTPUT: { nName, nNameEnd, sMain } of the-section sIdSectIn: its name::-para (in its OWN text)
 *   and its main-name = the-ONE !⇒ target of that para; sMain '' when none, null when several.
 *   null when the-section or its name:: is not found.
 */
function fFindMainOfSect(aLineIn, sIdSectIn) {
  const nSect = aLineIn.findIndex(sLine => fLineClean(sLine).match(rSectOpen)?.[1] === sIdSectIn);
  if (nSect === -1) return null;
  const nOwnEnd = fFindSectOwnEnd(aLineIn, nSect);
  const nName = aLineIn.findIndex((sLine, nL) => nL > nSect && nL < nOwnEnd && sLine.includes(`<p id="${sIdSectIn}nam">name::`));
  if (nName === -1) return null;
  let nNameEnd = nName; while (nNameEnd < aLineIn.length - 1 && !aLineIn[nNameEnd].includes('</p>')) nNameEnd++;
  const oSetMain = new Set();
  for (let nL = nName; nL <= nNameEnd; nL++)
    for (const aM of aLineIn[nL].matchAll(/!⇒\s*([^,\s<]+),/g)) oSetMain.add(aM[1]);
  return { nName, nNameEnd, sMain: oSetMain.size === 1 ? [...oSetMain][0] : oSetMain.size === 0 ? '' : null };
}

/**
 * DOING: MvrwGstr01 "does not list it": S's generic-tree:: (oJobIn.sIdGntr) gets its generics G
 *   (user {2026-11-05}): a-tree with NO generic yet ("=== ...entity:generic") gets G in that group,
 *   before "...entity:generic"; a-tree WITH a-generic gets a-new group "=== G:generic, ...entity:generic"
 *   at its end, before a-"=== label:" group (not generics).
 */
function fPlanGntrList(aLineIn, sNameShortIn, oJobIn, sFromIn, aoEditIn, aoNoteIn, oSetHeadIn) {
  const nOpen = aLineIn.findIndex(sLine => sLine.includes(`<p id="${oJobIn.sIdGntr}">generic-tree::`));
  if (nOpen === -1) { aoNoteIn.push(`SKIP   ${sNameShortIn}  #${oJobIn.sIdGntr}: no <p> generic-tree:: with it ${sFromIn}`); return; }
  let nEnd = nOpen; while (nEnd < aLineIn.length - 1 && !aLineIn[nEnd].includes('</p>')) nEnd++;
  const sPara = aLineIn.slice(nOpen, nEnd + 1).join('\n');
  // an-item "Y:generic" that is NO head: an-OLD name of a-renamed head (G may be there already): rename it first
  const aOld = [...sPara.matchAll(/<br>\*\s*([^\s*,.][^\s*,]*:generic)(?=[,\s])/g)].map(aM => aM[1])
    .filter(sY => !sY.startsWith('McshEngl.') && !oSetHeadIn.has(sY));   // the-head line is not an-item
  if (aOld.length) {
    aoNoteIn.push(`SKIP   ${sNameShortIn}:${nOpen + 1}  #${oJobIn.sIdGntr}: ${aOld.join(', ')} is no generic-tree:: head (an-old name?): rename it, G may be there already ${sFromIn}`);
    return;
  }
  const aItemG = oJobIn.aItemG.filter(sG => !new RegExp(`[\\s*>.]${sG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[,\\s]`).test(sPara));
  if (!aItemG.length) return;
  const sIn = fFindIndentNext(aLineIn, nOpen, aLineIn[nOpen].match(/^( *)/)[1]);
  // the-lines after the-head; the-end of the-generic groups: a-"=== label:" line, else the-clsHide line
  let nLast = nEnd;
  for (let nL = nOpen + 2; nL < nEnd; nL++) if (/^\s*<br>===\s*[^=\s]/.test(aLineIn[nL])) { nLast = nL; break; }
  const aBody = aLineIn.slice(nOpen + 2, nLast).map(s => s.trim());
  const bEntityOnly = aBody.every(s => /^<br>(===\s*|\*\s*\.\.\.entity:generic,?)$/.test(s) || s === '');
  const nEntity = aLineIn.findIndex((sLine, nL) => nL > nOpen && nL < nLast && /^\s*<br>\*\s*\.\.\.entity:generic,?\s*$/.test(sLine));
  if (bEntityOnly) {
    // "=== ...entity:generic": G in that group, before ...entity:generic (or at the-group's end)
    const nAt = nEntity === -1 ? nLast : nEntity;
    const aIns = aItemG.flatMap((sG, nG) => [...(nG ? [`${sIn}<br>* ...entity:generic,`, `${sIn}<br>===`] : []), `${sIn}<br>* ${sG},`]);
    if (!aBody.some(s => /^<br>===\s*$/.test(s))) aIns.unshift(`${sIn}<br>===`);
    if (nEntity === -1) aIns.push(`${sIn}<br>* ...entity:generic,`);
    aoEditIn.push({ nAt, nDel: 0, aIns });
    aoNoteIn.push(`GNTRADD ${sNameShortIn}:${nOpen + 1}  #${oJobIn.sIdGntr}  ${aItemG.join(' === ')} in its first group  (from ${oJobIn.aFrom.join(', ')})`);
    return;
  }
  // a-tree with generics: a-new group per G at the-end of the-generic groups
  aoEditIn.push({ nAt: nLast, nDel: 0, aIns: aItemG.flatMap(sG => [`${sIn}<br>===`, `${sIn}<br>* ${sG},`, `${sIn}<br>* ...entity:generic,`]) });
  aoNoteIn.push(`GNTRADD ${sNameShortIn}:${nOpen + 1}  #${oJobIn.sIdGntr}  === ${aItemG.join(' === ')} as a-new group  (from ${oJobIn.aFrom.join(', ')})`);
}

/**
 * DOING: MvrwGstr01: each specific S of ONE file (aoJobIn: { sIdS, aItemG, aFrom }) that has
 *   no generic-tree:: gets "{S}gntr" right after its name::-para:
 *     generic-tree::  McshEngl.M:generic,  ===  G:generic,  [===  G2:generic,]  ...entity:generic,
 *   M = S's main-name (the-ONE !⇒ target). It SKIPS: no name::, no or several main-names,
 *   the-id {S}gntr taken, the-name M:generic taken (oSetHeadIn).
 */
function fPlanGntrNew(sRawIn, sNameShortIn, aoJobIn, oSetHeadIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  const oSetId = new Set([...sRawIn.matchAll(/\bid="([^"]+)"/g)].map(aM => aM[1]));
  for (const oJob of aoJobIn) {
    const sFrom = `(specific of ${oJob.aItemG.join(', ')}, from ${oJob.aFrom.join(', ')})`;
    if (oJob.sIdGntr) { fPlanGntrList(aLine, sNameShortIn, oJob, sFrom, aoEdit, aoNote, oSetHeadIn); continue; }
    const oMain = fFindMainOfSect(aLine, oJob.sIdS);
    if (!oMain) { aoNote.push(`SKIP   ${sNameShortIn}  #${oJob.sIdS}: no section or no name::-para ${sFrom}`); continue; }
    const sLoc = `${sNameShortIn}:${oMain.nName + 1}`;
    if (oMain.sMain === '') { aoNote.push(`SKIP   ${sLoc}  #${oJob.sIdS}: its name:: has no main-name (no !⇒): give it one ${sFrom}`); continue; }
    if (oMain.sMain === null) { aoNote.push(`SKIP   ${sLoc}  #${oJob.sIdS}: its name:: has several !⇒ targets ${sFrom}`); continue; }
    const sIdGntr = oJob.sIdS + 'gntr';
    if (oSetId.has(sIdGntr)) { aoNote.push(`SKIP   ${sLoc}  #${sIdGntr} exists but is not a-generic-tree:: ${sFrom}`); continue; }
    const sHead = oMain.sMain + ':generic';
    if (oSetHeadIn.has(sHead)) { aoNote.push(`SKIP   ${sLoc}  #${oJob.sIdS}: ${sHead} is the-head of another generic-tree:: ${sFrom}`); continue; }
    const sIndent = aLine[oMain.nName].match(/^( *)/)[1];
    const sIn = fFindIndentNext(aLine, oMain.nName, sIndent);
    const aGroup = oJob.aItemG.flatMap((sG, nG) => [...(nG ? [`${sIn}<br>===`] : []), `${sIn}<br>* ${sG},`]);
    aoEdit.push({ nAt: oMain.nNameEnd + 1, nDel: 0, aIns: [
      `${sIndent}<p id="${sIdGntr}">generic-tree::`,
      `${sIn}<br>* McshEngl.${sHead},`,
      `${sIn}<br>===`,
      ...aGroup,
      `${sIn}<br>* ...entity:generic,`,
      `${sIndent}  <a class="clsHide" href="#${sIdGntr}"></a></p>`
    ] });
    oSetHeadIn.add(sHead);
    aoNote.push(`GNTRNEW ${sLoc}  #${sIdGntr}  McshEngl.${sHead} === ${oJob.aItemG.join(' === ')}  (from ${oJob.aFrom.join(', ')})`);
  }
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

/**
 * OUTPUT: the-item of specific S in G's specific-tree:: "G.S!@file#id" (user {2026-11-03}):
 *   a-dotted main-name S (Hmbdnutrient.010_iron_Fe) is written itself, without its NNN_ numbers.
 */
function fFindItemSptr(sMainGIn, sMainSIn, sFileSIn, sIdSIn) {
  const sName = sMainSIn.includes('.') ? sMainSIn.replace(/\.\d+_/g, '.') : `${sMainGIn}.${sMainSIn}`;
  return `${sName}!@${sFileSIn}#${sIdSIn}`;
}

/**
 * DOING: MvrwGstr02: each generic G of ONE file (aoJobIn: { sIdG, sMainG, aItem, aFrom }) lists
 *   its specifics S: a-new "===" group at the-end of G's specific-tree:: (before an-"=== address" part),
 *   or, when G has none, a-new "{G}sptr" para "McshEngl.G.specific, === items" right after G's generic-tree::.
 *   An-item whose link is in the-para already is not added. A-<div> specific-tree is SKIPPED.
 */
function fPlanSptrAdd(sRawIn, sNameShortIn, aoJobIn) {
  const aLine = sRawIn.split('\n');
  const aoEdit = [];
  const aoNote = [];
  for (const oJob of aoJobIn) {
    const sFrom = `(from ${oJob.aFrom.join(', ')})`;
    const sIdSptr = oJob.sIdG + 'sptr';
    const nSptr = aLine.findIndex(sLine => sLine.includes(`<p id="${sIdSptr}">specific-tree::`));
    if (nSptr === -1 && aLine.some(sLine => sLine.includes(`id="${sIdSptr}"`))) {
      aoNote.push(`SKIP   ${sNameShortIn}  #${sIdSptr} is not a-<p> specific-tree:: (a-<div>?): add ${oJob.aItem.join(', ')} by hand ${sFrom}`);
      continue;
    }
    if (nSptr !== -1) {
      let nEnd = nSptr; while (nEnd < aLine.length - 1 && !aLine[nEnd].includes('</p>')) nEnd++;
      const sPara = aLine.slice(nSptr, nEnd + 1).join('\n');
      const aItem = oJob.aItem.filter(sItem => !sPara.includes(sItem.slice(sItem.indexOf('!@'))));
      if (!aItem.length) continue;
      // before an-"=== addressWpg" part, else before the-clsHide line
      let nAt = nEnd;
      for (let nL = nSptr + 1; nL < nEnd; nL++) if (/^\s*<br>===\s*address/i.test(aLine[nL])) { nAt = nL; break; }
      const sIn = fFindIndentNext(aLine, nSptr, aLine[nSptr].match(/^( *)/)[1]);
      aoEdit.push({ nAt, nDel: 0, aIns: [`${sIn}<br>===`, ...aItem.map(sItem => `${sIn}<br>* ${sItem},`)] });
      aoNote.push(`SPTRADD ${sNameShortIn}:${nSptr + 1}  #${sIdSptr}  += ${aItem.join(', ')}  ${sFrom}`);
      continue;
    }
    const nGntr = aLine.findIndex(sLine => sLine.includes(`<p id="${oJob.sIdG}gntr">generic-tree::`));
    if (nGntr === -1) { aoNote.push(`SKIP   ${sNameShortIn}  #${oJob.sIdG}: no generic-tree:: to put its specific-tree:: after ${sFrom}`); continue; }
    let nGntrEnd = nGntr; while (nGntrEnd < aLine.length - 1 && !aLine[nGntrEnd].includes('</p>')) nGntrEnd++;
    const sIndent = aLine[nGntr].match(/^( *)/)[1];
    const sIn = fFindIndentNext(aLine, nGntr, sIndent);
    aoEdit.push({ nAt: nGntrEnd + 1, nDel: 0, aIns: [
      `${sIndent}<p id="${sIdSptr}">specific-tree::`,
      `${sIn}<br>* McshEngl.${oJob.sMainG}.specific,`,
      `${sIn}<br>===`,
      ...oJob.aItem.map(sItem => `${sIn}<br>* ${sItem},`),
      `${sIndent}  <a class="clsHide" href="#${sIdSptr}"></a></p>`
    ] });
    aoNote.push(`SPTRNEW ${sNameShortIn}:${nGntrEnd + 2}  #${sIdSptr}  McshEngl.${oJob.sMainG}.specific === ${oJob.aItem.join(', ')}  ${sFrom}`);
  }
  return { aoEdit, aoNote, sRawNew: fApplyEdit(aLine, aoEdit) };
}

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
  const nIdxFile = aArg.indexOf('--file');
  // --file McshDir000000 (or McshDir000000.last.html): the-fixes START in that file only
  const sNameFileOnly = nIdxFile === -1 ? '' : String(aArg[nIdxFile + 1] ?? '').replace(/\.last\.html$/, '');
  // --code <rule>: the-fix of ONE validator rule (ooFixCode), with --file
  const nIdxCode = aArg.indexOf('--code');
  const sCodeOne = nIdxCode === -1 ? '' : String(aArg[nIdxCode + 1] ?? '');
  // --dir dirCor (relative to the-worldview): the-fixes START in the-files of that dir and its sub-dirs
  const nIdxDir = aArg.indexOf('--dir');
  const sDirOnly = nIdxDir === -1 ? '' : String(aArg[nIdxDir + 1] ?? '').replace(/\\/g, '/').replace(/\/+$/, '');
  // --all: every file of the-worldview (--code needs --file, --dir, --list or --all)
  const bAll = aArg.includes('--all');
  // --list dirManager/validate.txt: the-files and dirs of that list (listValidate.js)
  const nIdxList = aArg.indexOf('--list');
  const sPathList = nIdxList === -1 ? '' : String(aArg[nIdxList + 1] ?? '');
  const sNameDir = aArg.find((sArg, nI) => !sArg.startsWith('--') &&
    (nIdxFile === -1 || nI !== nIdxFile + 1) && (nIdxCode === -1 || nI !== nIdxCode + 1) &&
    (nIdxDir === -1 || nI !== nIdxDir + 1) && (nIdxList === -1 || nI !== nIdxList + 1));
  // the-files of the-list, as lower-case absolute paths
  let oSetPathList = null;
  if (sPathList && sNameDir) {
    const oList = fReadListValidate(sNameDir, moPath.isAbsolute(sPathList) ? sPathList : moPath.join(sNameDir, sPathList));
    oSetPathList = new Set(oList.aPathFile.map(sPath => sPath.toLowerCase()));
    for (const sMissing of oList.aMissing) console.log(`  ⚠️  not found in the-list: ${sMissing}`);
  }
  const bFix = aArg.includes('--fix');
  const aModeGiven = aModeAll.filter(sMode => aArg.includes('--' + sMode));
  // a-rule with its own mode runs that mode: --code MvreName01 = --dupname
  const ooModeOfCode = { MvreName01: 'dupname', MvreName02: 'namecomma', Hvrw08: 'nest', Hvrw07: 'headgap',
    MvrwSect01: 'missing', MvrwSect03: 'name', MvreMain01: 'mainname', MvrwMain10: 'attribute' };
  if (sCodeOne) aModeGiven.push(ooModeOfCode[sCodeOne] ?? 'code');
  if (aModeGiven.length > 1) {
    console.error(`${aModeAll.map(sMode => '--' + sMode).join(', ')}, --code are separate runs: give one of them`);
    process.exit(1);
  }
  if (sCodeOne && (!(sNameFileOnly || sDirOnly || oSetPathList || bAll) || !(ooFixCode[sCodeOne] || ooModeOfCode[sCodeOne]))) {
    console.error(`--code needs --file McshDir000000, --dir dirXxx, --list dirManager/validate.txt or --all, and one of: ${[...Object.keys(ooFixCode), ...Object.keys(ooModeOfCode)].sort().join(' ')}`);
    process.exit(1);
  }
  // no mode: the-creation-paras of evoluting-sections
  const sModeOne = aModeGiven[0] ?? 'evoluting';
  if (sModeOne === 'auto' && !sNameFileOnly) {
    console.error('--auto needs --file McshDir000000');
    process.exit(1);
  }
  const aMode = sModeOne === 'auto' ? aModeAuto : [sModeOne];
  const fShort = sPathIn => moPath.basename(String(sPathIn)).replace(/\.last\.html$/, '');
  const fSkipFile = sPathIn => (sNameFileOnly !== '' && fShort(sPathIn) !== sNameFileOnly) ||
    (sDirOnly !== '' && !(moPath.relative(sNameDir, moPath.dirname(sPathIn)).split(moPath.sep).join('/') + '/').startsWith(sDirOnly + '/')) ||
    (oSetPathList !== null && !oSetPathList.has(moPath.resolve(sPathIn).toLowerCase()));
  // the-files a-step parses: with --file only that one (a-whole-worldview parse takes ~40 s)
  const fReadHitpSome = () => fFindFileAll(sNameDir).filter(sPath => !fSkipFile(sPath)).map(sPath => fReadFileHitp(sPath));
  // the-Mcsh files of the-scope, NOT parsed as Hitp: the-Mcsh modes read them with fReadFileMcsh,
  // they need only the-name and the-path (the-Hitp parse of the-worldview is ~10 s)
  const fListMcshSome = () => fFindFileAll(sNameDir).filter(sPath => !fSkipFile(sPath) &&
    moPath.basename(sPath).startsWith('Mcsh')).map(sPath => ({ sNameFile: moPath.basename(sPath), sPathFile: sPath }));
  if (!sNameDir) {
    console.log('createMcsh.mjs - it puts the-Mcsh-creation-date in the-description:: of sections');
    console.log('  ' + aVersion[0]);
    console.log('');
    console.log('USAGE: node dirValid/createMcsh.mjs <sNameDir> [--missing|--overview|--undated|--nameid|--headgap|--nest|--mainname|--srtr|--dupname|--namecomma|--attribute|--name|--auto] [--file McshDir000000] [--fix]');
    console.log('  sNameDir     the-path of the-dirMcsh-worldview');
    console.log('  (default)    the-creation-para of evoluting-sections -> their description::');
    console.log('  --missing    a-description:: with the-run-date for every MvrwSect01-section');
    console.log('  --code X     with --file or --dir: the-fix of validator rule X (every rule), or NOFIX with why');
    console.log('  --dir D      the-fixes START in the-files of dir D of the-worldview (dirCor), and its sub-dirs');
    console.log('  --all        with --code: every file of the-worldview');
    console.log('  --list L     the-fixes START in the-files and dirs of list L (dirManager/validate.txt)');
    console.log('  --name       MvrwSect03: a-name:: McshEngl.<heading> for every section without name::');
    console.log('  --overview   idOverview description:: without × Mcsh-creation gets the-date');
    console.log('               of version.0-1-0 (else the-earliest version) from the-file\'s end');
    console.log('  --undated    EVERY description:: without × Mcsh-creation gets the-run-date');
    console.log('  --nameid     the-name::-para of idOverview gets the-id idName');
    console.log('  --headgap    the-obvious Hvrw07 heading-gaps (h1 → h3) of Mcsh* and dirStnlaw files;');
    console.log('               law-articles keep their level');
    console.log('  --nest       the-obvious Hvrw08 nesting-errors: a-</section> moved up, same files');
    console.log('  --mainname   MvreMain01: English main-names (after !⇒) with "-" get "_", the-old form kept as synonym; a-non-English one is skipped');
    console.log('  --srtr       MvrwId13: structure-ids get the-suffix srtr, links re-pointed (.last.html only)');
    console.log('  --dupname    MvreName01: a-name-line twice in ONE para, the-line without date | info deleted');
    console.log('  --namecomma  MvreName02: a-name-line without a-comma gets it at the-end; a-comma in the-middle is reported');
    console.log('  --attribute  MvrwMain10: the-clear attribute ("X\x27y" → "y of M") | specific ("X.y" → "M.y") titles + their formal names; "of" another concept is reported');
  console.log('  --auto       with --file: --namecomma, --dupname, --nest, --headgap, --missing, --mainname, --srtr, --attribute in order');
    console.log('  --file       the-fixes START in one file (--mainname, --srtr still re-point other files)');
    console.log('  --fix        it WRITES the-files; without it a-dry-run');
    console.log('  OUTPUT: dirValid/createMcsh.txt');
    process.exit(1);
  }

  const aLineOut = [];
  const oCount = { nBad: 0 };
  const oSetPathWritten = new Set();   // a-file written by 2 steps of --auto counts once

  /**
   * DOING: it counts the-notes of a-file, checks its new text and writes it.
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
    oSetPathWritten.add(sPathFileIn);
    if (bFix) moFs.writeFileSync(sPathFileIn, oPlanIn.sRawNew);
  }

  // one mode, or the-steps of --auto in order: each step reads the-files again,
  // so it sees what the-previous step wrote
  const aStep = [];
  for (const sMode of aMode) {
    let sCount;
    const nNoteBefore = aLineOut.filter(sLine => !/^(SKIP|BAD)/.test(sLine)).length;
    if (sMode === 'srtr') {
      // the-structure-concepts are what the-VALIDATOR says: MvrwId13
      const aoFileHitp = fListMcshSome();
      const aoCnptFile = await Promise.all(aoFileHitp.map(oFile =>
        fReadFileMcsh(sNameDir, moPath.relative(sNameDir, oFile.sPathFile))));
      const ooIdSect = {};
      for (const oIssue of fRunChecksMcsh(aoCnptFile, sNameDir, true, ['MvrwId13'])) {
        if (oIssue.sCode === 'MvrwId13') (ooIdSect[oIssue.sNameFile] ??= []).push(oIssue.sIdConcept);
      }
      // 1. the-renames per file
      const ooMapId = {};
      const oPathFile = Object.fromEntries(aoFileHitp.map(oFile => [oFile.sNameFile, oFile.sPathFile]));
      for (const [sNameFile, aIdSect] of Object.entries(ooIdSect).sort()) {
        const sRaw = moFs.readFileSync(oPathFile[sNameFile], 'utf8');
        const oPlan = fPlanSrtrMap(sRaw, sNameFile.replace(/\.last\.html$/, ''), aIdSect);
        for (const sNote of oPlan.aoNote) {
          aLineOut.push(sNote);
          oCount[sNote.split(' ')[0]] = (oCount[sNote.split(' ')[0]] ?? 0) + 1;
        }
        if (oPlan.oMapId.size > 0) ooMapId[sNameFile] = oPlan.oMapId;
      }
      // 2. the-ids and every link to them, in every .last.html file; the-json index files (dirNamidx, dirNamurl) are NEVER touched: they are generated
      for (const sPath of fFindFileAll(sNameDir)) {
        const sRaw = moFs.readFileSync(sPath, 'utf8');
        const sNameFile = moPath.basename(sPath);
        const sNameShort = sNameFile.endsWith('.last.html')
          ? sNameFile.replace(/\.last\.html$/, '') : moPath.relative(sNameDir, sPath).split(moPath.sep).join('/');
        fWriteFile(sPath, sRaw, sNameShort, fPlanSrtrApply(sRaw, sNameShort, sNameFile, ooMapId));
      }
      sCount = `${oCount.IDSRTR ?? 0} structure-ids renamed · ${oCount.LINK ?? 0} lines changed`;
    } else if (sMode === 'mainname') {
      // all Mcsh-files read once: the-main-names to change, and every name for the-collisions
      const aPath = fFindFileAll(sNameDir).filter(sPath => moPath.basename(sPath).startsWith('Mcsh'));
      const aRaw = aPath.map(sPath => moFs.readFileSync(sPath, 'utf8'));
      const oSetName = new Set();
      // 'Lago|Y' → Set of what its name-lines point to ('' = a-line without "!⇒")
      const oMapNameTarget = new Map();
      const oMapMainFirst = new Map(); // 'Lago|X' → the-first file:line pointing to X
      aRaw.forEach((sRaw, nI) => sRaw.split('\n').forEach((sLine, nL) => {
        const aName = sLine.match(rNameLine);
        if (!aName) return;
        const sKeyName = `${aName[1]}|${aName[2].split('!')[0].trim()}`;
        oSetName.add(sKeyName);
        if (!oMapNameTarget.has(sKeyName)) oMapNameTarget.set(sKeyName, new Set());
        oMapNameTarget.get(sKeyName).add(aName[2].match(/!⇒([^!]*)/)?.[1].trim() ?? '');
        for (const aM of aName[2].matchAll(/!⇒([^!]*)/g)) {
          const sKey = `${aName[1]}|${aM[1].trim()}`;
          if (aM[1].includes('-') && !oMapMainFirst.has(sKey) && !fSkipFile(aPath[nI])) {
            oMapMainFirst.set(sKey, `${moPath.basename(aPath[nI], '.last.html')}:${nL + 1}`);
          }
        }
      }));
      const oMapMain = new Map();
      for (const [sKey, sLoc] of oMapMainFirst) {
        const [sLago, sMain] = sKey.split('|');
        const sMainNew = sMain.replace(/-/g, '_');
        // an-Mmn starts with an-English letter | digit: όγδοος-η-ο is NOT όγδοος_η_ο, by hand
        if (!/^[A-Za-z0-9]/.test(sMainNew)) {
          aLineOut.push(`SKIP   ${sLoc}  Mcsh${sLago}.${sMain}: not an-English main-name, give an-English one or none, by hand`);
          oCount.SKIP = (oCount.SKIP ?? 0) + 1;
          continue;
        }
        // X' only as a-synonym of X ("X'!⇒X"): swapped, not a-collision
        const oSetTarget = oMapNameTarget.get(`${sLago}|${sMainNew}`);
        const bSynOfMain = oSetTarget?.size === 1 && oSetTarget.has(sMain);
        if (oSetName.has(`${sLago}|${sMainNew}`) && !bSynOfMain) {
          aLineOut.push(`SKIP   ${sLoc}  Mcsh${sLago}.${sMain}: Mcsh${sLago}.${sMainNew} is a-name already`);
          oCount.SKIP = (oCount.SKIP ?? 0) + 1;
          continue;
        }
        oMapMain.set(sKey, sMainNew);
      }
      aPath.forEach((sPath, nI) => {
        const sNameShort = moPath.basename(sPath, '.last.html');
        fWriteFile(sPath, aRaw[nI], sNameShort, fPlanMainName(aRaw[nI], sNameShort, oMapMain));
      });
      sCount = `${oMapMain.size} main-names with underscores · ${oCount.MAINNAME ?? 0} lines changed · ` +
        `${oCount.ADD ?? 0} old forms kept as synonyms`;
    } else if (sMode === 'nest') {
      for (const oFile of fReadHitpSome()) {
        const sNameShort = oFile.sNameFile.replace(/\.last\.html$/, '');
        // the-files of --headgap: Mcsh*, and of the-Hitp* files only the-laws of dirStnlaw
        const bLaw = moPath.relative(sNameDir, oFile.sPathFile).split(moPath.sep).includes('dirStnlaw');
        if (!oFile.sNameFile.startsWith('Mcsh') && !bLaw) continue;
        if (fSkipFile(oFile.sPathFile)) continue;
        const sRaw = moFs.readFileSync(oFile.sPathFile, 'utf8');
        fWriteFile(oFile.sPathFile, sRaw, sNameShort, fPlanNest(sRaw, sNameShort, oFile));
      }
      sCount = `${oCount.NEST ?? 0} </section> moved`;
    } else if (sMode === 'headgap') {
      // all files read once: a-move is skipped when ANY file links to the-old heading-id;
      // parsed are only the-files to fix
      const aPathAll = fFindFileAll(sNameDir);
      const aRawAll = aPathAll.map(sPath => moFs.readFileSync(sPath, 'utf8'));
      aPathAll.forEach((sPath, nI) => {
        const sNameFile = moPath.basename(sPath);
        // Mcsh* files, and of the-Hitp* files only the-laws of dirStnlaw
        const bLaw = moPath.relative(sNameDir, sPath).split(moPath.sep).includes('dirStnlaw');
        if (!sNameFile.startsWith('Mcsh') && !bLaw) return;
        if (fSkipFile(sPath)) return;
        fWriteFile(sPath, aRawAll[nI], fShort(sPath),
          fPlanHeadGap(aRawAll[nI], fShort(sPath), sNameFile, fReadFileHitp(sPath), aRawAll));
      });
      sCount = `${oCount.HEADING ?? 0} headings moved up`;
    } else if (sMode === 'nameid') {
      // all files read once: a-rename is skipped when ANY file links to the-old id
      const aPathAll = fFindFileAll(sNameDir);
      const aRawAll = aPathAll.map(sPathFile => moFs.readFileSync(sPathFile, 'utf8'));
      aPathAll.forEach((sPathFile, nI) => {
        const sNameFile = moPath.basename(sPathFile);
        const sNameShort = sNameFile.replace(/\.last\.html$/, '');
        if (fSkipFile(sPathFile)) return;
        fWriteFile(sPathFile, aRawAll[nI], sNameShort, fPlanNameId(aRawAll[nI], sNameShort, sNameFile, aRawAll));
      });
      sCount = `${oCount.RENAME ?? 0} ids renamed to idName`;
    } else if (sMode === 'undated') {
      const sDate = fFindDateLocal();
      for (const sPathFile of fFindFileAll(sNameDir)) {
        if (!moPath.basename(sPathFile).startsWith('Mcsh') || fSkipFile(sPathFile)) continue;
        const sRaw = moFs.readFileSync(sPathFile, 'utf8');
        const sNameShort = moPath.basename(sPathFile).replace(/\.last\.html$/, '');
        fWriteFile(sPathFile, sRaw, sNameShort, fPlanUndated(sRaw, sNameShort, sDate));
      }
      // one INSERT-note per file carries the-count of its descriptions
      const nDesc = aLineOut.reduce((nSum, sLine) =>
        nSum + Number(sLine.match(/^INSERT \S+  (\d+) descriptions$/)?.[1] ?? 0), 0);
      sCount = `${nDesc} descriptions dated · ${oCount.EMPTY ?? 0} of them EMPTY · date {${sDate}}`;
    } else if (sMode === 'overview') {
      for (const sPathFile of fFindFileAll(sNameDir)) {
        if (!moPath.basename(sPathFile).startsWith('Mcsh') || fSkipFile(sPathFile)) continue;
        const sRaw = moFs.readFileSync(sPathFile, 'utf8');
        const sNameShort = moPath.basename(sPathFile).replace(/\.last\.html$/, '');
        fWriteFile(sPathFile, sRaw, sNameShort, fPlanOverview(sRaw, sNameShort));
      }
      sCount = `${oCount.INSERT ?? 0} dates inserted · ${oCount.NODESC ?? 0} idOverview without description::`;
    } else if (sMode === 'evoluting') {
      for (const sPathFile of fFindFileAll(sNameDir)) {
        if (fSkipFile(sPathFile)) continue;
        const sRaw = moFs.readFileSync(sPathFile, 'utf8');
        if (!sRaw.includes('=== McsHitp-creation:') && !sRaw.includes('=== webpage creation:')) continue;
        const sNameShort = moPath.basename(sPathFile).replace(/\.last\.html$/, '');
        fWriteFile(sPathFile, sRaw, sNameShort, fPlanFile(sRaw, sNameShort));
      }
      const nCreate = oCount.CREATE ?? 0, nInsert = oCount.INSERT ?? 0, nDelete = oCount.DELETE ?? 0;
      sCount = `${nCreate + nInsert + nDelete} paras deleted · ${nCreate} descriptions created · ` +
        `${nInsert} lines inserted`;
    } else if (sMode === 'missing') {
      // the-sections without description:: are what the-VALIDATOR says: MvrwSect01
      const sDate = fFindDateLocal();
      const aoFileHitp = fListMcshSome();
      const aoCnptFile = await Promise.all(aoFileHitp.map(oFile =>
        fReadFileMcsh(sNameDir, moPath.relative(sNameDir, oFile.sPathFile))));
      const ooIdSect = {};
      for (const oIssue of fRunChecksMcsh(aoCnptFile, sNameDir, true, ['MvrwSect01'])) {
        if (oIssue.sCode === 'MvrwSect01') (ooIdSect[oIssue.sNameFile] ??= []).push(oIssue.sIdConcept);
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
    } else if (sMode === 'code') {
      // the-issues of ONE rule in each file (--file: one, --dir: every file there), as the-VALIDATOR reports them
      const oFix = ooFixCode[sCodeOne];
      const nNoteFix = aLineOut.length;
      const aPathFile = fFindFileAll(sNameDir).filter(sPath => !fSkipFile(sPath));
      if (!aPathFile.length) throw new Error(`--file ${sNameFileOnly} --dir ${sDirOnly}: no such .last.html file`);
      let aoFileHitpAll = null, aoIssueAll = null;
      if (oFix.sKind === 'link') {
        // a-link's target can be any file: the-whole worldview is parsed ONCE (~40 s)
        aoFileHitpAll = fReadFileAllHitp(sNameDir);
        aoIssueAll = fRunChecksHitp(aoFileHitpAll, sNameDir, true, [sCodeOne]);
      }
      // MvrwGstr01: a-specific S can be in any file: every Mcsh file is parsed ONCE and checked together;
      //   the-jobs are collected per S-file (ooJobGstr) and written after the-files of the-scope
      let ooRawAll = null, oSetHead = null, ooJobGstr = null, oMapHead = null;
      if (['gstr01', 'gstr02'].includes(oFix.sKind)) {
        const aPathMcsh = fFindFileAll(sNameDir).filter(sPath => moPath.basename(sPath).startsWith('Mcsh'));
        ooRawAll = new Map(aPathMcsh.map(sPath => [fShort(sPath), { sPath, sRaw: moFs.readFileSync(sPath, 'utf8') }]));
        const aoCnptFile = await Promise.all([...ooRawAll.values()].map(o =>
          fReadFileMcsh(sNameDir, moPath.relative(sNameDir, o.sPath), o.sRaw)));
        aoIssueAll = fRunChecksMcsh(aoCnptFile, sNameDir, true, [sCodeOne]);
        // the-heads of every generic-tree:: (a-new head must not be one of them)
        oSetHead = new Set();
        // MvrwGstr02: the-head X:generic → { sFile, sIdB } of its "{B}gntr" para
        oMapHead = new Map();
        for (const [sFile, { sRaw }] of ooRawAll)
          for (const aM of sRaw.matchAll(/<p id="([^"]+)gntr">generic-tree::\r?\n\s*<br>\*\s*McshEngl\.(\S+?:generic),/g)) {
            oSetHead.add(aM[2]);
            oMapHead.set(aM[2], oMapHead.has(aM[2]) ? null : { sFile, sIdB: aM[1] });   // null: the-head twice
          }
        ooJobGstr = new Map();
      }
      let nIssue = 0;
      for (const sPathFile of aPathFile) {
      // each file is read when its turn comes: an-earlier file's renames may have re-pointed its links
      const sRaw = moFs.readFileSync(sPathFile, 'utf8');
      const sNameShort = fShort(sPathFile);
      const sNameFile = moPath.basename(sPathFile);
      let aoIssue = [];
      if (aoIssueAll) {
        aoIssue = aoIssueAll;
      } else if (sCodeOne.startsWith('H')) {
        // the-text read above is parsed, not read again; Hvre01 needs only the-ids
        const fReadOne = sCodeOne === 'Hvre01' ? fReadFileHitpIdOnly : fReadFileHitp;
        aoIssue = fRunChecksHitp([fReadOne(sPathFile, sRaw)], sNameDir, true, [sCodeOne]);
      } else if (sNameFile.startsWith('Mcsh')) {
        aoIssue = fRunChecksMcsh([await fReadFileMcsh(sNameDir, moPath.relative(sNameDir, sPathFile), sRaw)], sNameDir, true, [sCodeOne]);
      }
      aoIssue = aoIssue.filter(oIssue => oIssue.sCode === sCodeOne && oIssue.sNameFile === sNameFile);
      nIssue += aoIssue.length;
      // with --dir a-file without issues is not noted: only what was found
      if (aoIssue.length === 0 && aPathFile.length > 1) continue;

      if (aoIssue.length === 0) {
        aLineOut.push(`NOISSUE ${sNameShort}  ${sCodeOne}: nothing to fix`);
      } else if (oFix.sKind === 'none') {
        aLineOut.push(`NOFIX  ${sNameShort}  ${sCodeOne} (${aoIssue.length}): ${oFix.sWhy}`);
      } else if (oFix.sKind === 'line') {
        fWriteFile(sPathFile, sRaw, sNameShort, oFix.fPlan(sRaw, sNameShort, aoIssue, sNameDir));
      } else if (oFix.sKind === 'idmap') {
        const oPlan = fPlanIdMap(sRaw, sNameShort, aoIssue, oFix.fIdNew);
        aLineOut.push(...oPlan.aoNote);
        for (const sNote of oPlan.aoNote) oCount[sNote.split(' ')[0]] = (oCount[sNote.split(' ')[0]] ?? 0) + 1;
        if (oPlan.oMapId.size > 0) {
          const ooMapId = { [sNameFile]: oPlan.oMapId };
          // the-ids and every link to them, in every .last.html file (json index files: NEVER)
          for (const sPath of fFindFileAll(sNameDir)) {
            const sRawOne = sPath === sPathFile ? sRaw : moFs.readFileSync(sPath, 'utf8');
            if (sPath !== sPathFile && !sRawOne.includes(sNameFile + '#')) continue;
            fWriteFile(sPath, sRawOne, fShort(sPath), fPlanSrtrApply(sRawOne, fShort(sPath), moPath.basename(sPath), ooMapId));
          }
        }
      } else if (oFix.sKind === 'main') {
        // the-new main-name of each issue; then every "!⇒X" and main-line of X, in every file
        const oMapMain = new Map();
        const aLineMain = sRaw.split('\n');
        const fSkipMain = (oIssueIn, sWhyIn) => {
          aLineOut.push(`SKIP   ${sNameShort}:${oIssueIn.nLine ?? '?'}  ${sWhyIn}: give the-main-name by hand`);
          oCount.SKIP = (oCount.SKIP ?? 0) + 1;
        };
        // the-main-names from the-whole's main-name: their only line is the-main-name-line
        const oSetMainAlways = new Set();
        // true: "McshEngl.X" | "!⇒X" is ONLY in the-name::-para of section sIdSectIn, in the-whole worldview
        const fIsNameOnlyInPara = (sMainIn, sIdSectIn) => {
          const oName = fFindMainOfSect(aLineMain, sIdSectIn);
          if (!oName) return false;
          const rName = new RegExp(`(McshEngl\\.|!⇒)${sMainIn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[,!]`, 'g');
          const nInPara = (aLineMain.slice(oName.nName, oName.nNameEnd + 1).join('\n').match(rName) ?? []).length;
          let nAll = 0;
          for (const sPath of fFindFileAll(sNameDir)) {
            nAll += ((sPath === sPathFile ? sRaw : moFs.readFileSync(sPath, 'utf8')).match(rName) ?? []).length;
            if (nAll > nInPara) return false;
          }
          return nInPara > 0 && nAll === nInPara;
        };
        // MvrwMain01: every file's text, read once, for "is X' a-name already"
        let oMapRawAll = null;
        const fIsNameFree = (sNameIn, sIdSectIn) => {
          oMapRawAll ??= new Map(fFindFileAll(sNameDir).map(sPath => [sPath, sPath === sPathFile ? sRaw : moFs.readFileSync(sPath, 'utf8')]));
          const rName = new RegExp(`(McshEngl\\.|!⇒)${sNameIn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[,!]`, 'g');
          const oName = fFindMainOfSect(aLineMain, sIdSectIn);
          const nInPara = oName ? (aLineMain.slice(oName.nName, oName.nNameEnd + 1).join('\n').match(rName) ?? []).length : 0;
          let nAll = 0;
          for (const sRawOne of oMapRawAll.values()) nAll += (sRawOne.match(rName) ?? []).length;
          return nAll === nInPara;
        };
        for (const oIssue of aoIssue) {
          // MvrwMain02..06: main-name "McshEngl.X"; MvrwMain01: main-name "X"
          const sMain = oIssue.sMessage.match(/main-name "(?:McshEngl\.)?([^"]+)"/)?.[1];
          if (sCodeOne === 'MvrwMain01') {
            // B + the-rest after the-concept's main-name W: bodyHumn'16_weight (W bodyHumn, B Hmbd) → Hmbdweight
            const [, sBase, sMainCnpt] = oIssue.sMessage.match(/the-Attrbase "([^"]+)" of concept "([^"]*)"/) ?? [];
            if (!sMain || !sBase || oIssue.sMessage.includes('has no alias')) {
              fSkipMain(oIssue, `"${sMain}" keeps its own prefix but needs an-alias beginning with "${sBase}"`);
              continue;
            }
            let sRest = '';
            if (sMainCnpt && sMain.toLowerCase().startsWith(sMainCnpt.toLowerCase())) sRest = sMain.slice(sMainCnpt.length);
            else sRest = ['doing', 'evolg', 'evaln', 'evalg', 'infrsc', 'srtr'].find(sSuf => sMain.endsWith(sSuf)) ?? '';
            // without the-order number: '16_weight → weight, 'att077_odor → odor
            sRest = sRest.replace(/^['_/.]+/, '').replace(/^(att)?\d+_/, '');
            // a-specific keeps its capital: SystDynaSelf (W SystDyna, B Dyna) → DynaSelf; NOT B + SciX | RltnX
            if (!sRest || !/^[A-Za-z][A-Za-z0-9_]*$/.test(sRest) || /^(Sci|Diss|Rltn)[A-Z]/.test(sRest)) {
              fSkipMain(oIssue, `"${sMain}" does not begin with the-concept's main-name "${sMainCnpt}" + a-word`);
              continue;
            }
            const sMainNew = sBase + sRest;
            if (!fIsNameFree(sMainNew, oIssue.sIdConcept)) {
              fSkipMain(oIssue, `"${sMain}" → "${sMainNew}": "${sMainNew}" is a-name already`);
              continue;
            }
            oSetMainAlways.add(`Engl|${sMain}`);
            oMapMain.set(`Engl|${sMain}`, sMainNew);
            continue;
          }
          // MvrwMain05 leaf: the-main-name is removed, not renamed
          if (oIssue.sMessage.startsWith('infrsc_info_resource_leaf')) {
            fSkipMain(oIssue, `"${sMain}" of a-section without subsections is not needed`);
            continue;
          }
          const sSuffix = oIssue.sMessage.split('_')[0];
          let sBase = fFindAttrbase(aLineMain, oIssue.sIdConcept);
          // no !Attrbase: the-main-name of its whole (nerveCranial → nerveCranialinfrsc)
          const bBaseMain = !sBase && !!sMain && !sMain.endsWith(sSuffix) && !sMain.endsWith("'" + sSuffix);
          if (bBaseMain) sBase = fFindMainOfWhole(aLineMain, oIssue.sIdConcept);
          const sMainNew = sMain ? fFindMainNew(sMain, sSuffix, sBase) : null;
          if (!sMainNew) {
            fSkipMain(oIssue, `"${sMain}" does not end in "${sSuffix}" and its whole has no !Attrbase and no main-name`);
          } else if (bBaseMain && !fIsNameOnlyInPara(sMain, oIssue.sIdConcept)) {
            // the-rename runs in EVERY file: a-name like "resource" of other concepts is not touched
            fSkipMain(oIssue, `"${sMain}" → "${sMainNew}": "${sMain}" is a-name outside its name::-para too`);
          } else if (sMainNew !== sMain) {
            if (bBaseMain) oSetMainAlways.add(`Engl|${sMain}`);
            oMapMain.set(`Engl|${sMain}`, sMainNew);
          }
        }
        if (oMapMain.size > 0) {
          for (const sPath of fFindFileAll(sNameDir)) {
            const sRawOne = sPath === sPathFile ? sRaw : moFs.readFileSync(sPath, 'utf8');
            if (![...oMapMain.keys()].some(sKey => sRawOne.includes(sKey.slice(5)))) continue;
            fWriteFile(sPath, sRawOne, fShort(sPath), fPlanMainName(sRawOne, fShort(sPath), oMapMain, oSetMainAlways));
          }
        }
      } else if (oFix.sKind === 'link') {
        const oMapFile = new Map();
        const ooSetId = new Map();
        for (const oFile of aoFileHitpAll) {
          const sRel = moPath.relative(sNameDir, oFile.sPathFile).split(moPath.sep).join('/');
          oMapFile.set(oFile.sNameFile, [...(oMapFile.get(oFile.sNameFile) ?? []), sRel]);
          ooSetId.set(sRel, oFile.oSetId);
        }
        fWriteFile(sPathFile, sRaw, sNameShort, fPlanLink(sRaw, sNameShort, aoIssue, sPathFile, sNameDir, oMapFile, ooSetId));
      } else if (oFix.sKind === 'gstr01') {
        // the-issues are in G's file; the-new generic-tree:: goes in S's file
        const fSkipGstr = (sLocIn, sWhyIn) => { aLineOut.push(`SKIP   ${sLocIn}  ${sWhyIn}`); oCount.SKIP = (oCount.SKIP ?? 0) + 1; };
        for (const oIssue of aoIssue) {
          const sLoc = `${sNameShort}:${oIssue.nLine ?? '?'}`;
          let aM = oIssue.sMessage.match(/"([^"]*)" \((Mcsh[A-Za-z0-9]+)#([^)]*)\) is a specific of (\S+), but has no generic-tree::/);
          // "does not list it": S HAS a-generic-tree:: (file:line): G goes in it (fPlanGntrList)
          let sIdGntr = null;
          const aL = aM ? null : oIssue.sMessage.match(/"([^"]*)" is a specific of (\S+), but its generic-tree:: \((Mcsh[A-Za-z0-9]+):(\d+)\) does not list it/);
          if (aL) {
            sIdGntr = ((ooRawAll.get(aL[3])?.sRaw.split('\n')[+aL[4] - 1] ?? '').match(/<p id="([^"]+)">generic-tree::/) ?? [])[1] ?? null;
            if (!sIdGntr) { fSkipGstr(sLoc, `"${aL[1]}": no <p id> generic-tree:: on ${aL[3]}:${aL[4]}`); continue; }
            aM = [null, aL[1], aL[3], '', aL[2]];
          }
          if (!aM) { fSkipGstr(sLoc, `${oIssue.sMessage.replace(/^gnsp_then_spgn: /, '').slice(0, 160)}: ${oFix.sWhy}`); continue; }
          const [, sTextS, sFileS, sIdS, sNameG] = aM;
          if (!sIdS && !sIdGntr) { fSkipGstr(sLoc, `"${sTextS}" is the-file-concept ${sFileS}: its generic-tree:: goes in its GS-TREE, by hand`); continue; }
          let sItemG = sNameG;
          if (!sNameG.endsWith(':generic')) {
            // G without generic-tree name: a-link with G's main-name
            const [sFileG, sIdG] = sNameG.split('#');
            const oG = ooRawAll.get(sFileG);
            const oMainG = oG && sIdG ? fFindMainOfSect(oG.sRaw.split('\n'), sIdG) : null;
            if (!oMainG?.sMain) { fSkipGstr(sLoc, `"${sTextS}": its generic ${sNameG} has no generic-tree:: name and no main-name`); continue; }
            sItemG = `${oMainG.sMain}!@${sFileG}#${sIdG}`;
          }
          if (!ooJobGstr.has(sFileS)) ooJobGstr.set(sFileS, []);
          const aJob = ooJobGstr.get(sFileS);
          let oJob = aJob.find(o => sIdGntr ? o.sIdGntr === sIdGntr : !o.sIdGntr && o.sIdS === sIdS);
          if (!oJob) aJob.push(oJob = { sIdS, sIdGntr, aItemG: [], aFrom: [] });
          if (!oJob.aItemG.includes(sItemG)) oJob.aItemG.push(sItemG);
          oJob.aFrom.push(sLoc);
        }
      } else if (oFix.sKind === 'gstr02') {
        // the-issues are in S's file (the-line of S's generic-tree::); the-item goes in G's file
        const fSkipGstr = (sLocIn, sWhyIn) => { aLineOut.push(`SKIP   ${sLocIn}  ${sWhyIn}`); oCount.SKIP = (oCount.SKIP ?? 0) + 1; };
        const aLineRaw = sRaw.split('\n');
        for (const oIssue of aoIssue) {
          const sLoc = `${sNameShort}:${oIssue.nLine ?? '?'}`;
          const aM = oIssue.sMessage.match(/"(\S+?):generic" has generic (\S+?:generic), but/);
          const oG = aM ? oMapHead.get(aM[2]) : null;
          if (!oG) { fSkipGstr(sLoc, `${oIssue.sMessage.replace(/^spgn_then_gnsp: /, '').slice(0, 160)}: ${oFix.sWhy}`); continue; }
          // S: the-section of the-generic-tree:: on the-issue's line
          const sIdS = ((aLineRaw[(oIssue.nLine ?? 0) - 1] ?? '').match(/<p id="([^"]+)gntr">generic-tree::/) ?? [])[1];
          if (!sIdS || !aLineRaw.some(sLine => fLineClean(sLine).match(rSectOpen)?.[1] === sIdS)) {
            fSkipGstr(sLoc, `"${aM[1]}:generic": its generic-tree:: is not "{S}gntr" of a-section (a-GS-TREE of the-file?): add it by hand`);
            continue;
          }
          const sMainG = aM[2].replace(/:generic$/, '');
          const sItem = fFindItemSptr(sMainG, aM[1], sNameShort, sIdS);
          if (!ooJobGstr.has(oG.sFile)) ooJobGstr.set(oG.sFile, []);
          const aJob = ooJobGstr.get(oG.sFile);
          let oJob = aJob.find(o => o.sIdG === oG.sIdB);
          if (!oJob) aJob.push(oJob = { sIdG: oG.sIdB, sMainG, aItem: [], aFrom: [] });
          if (!oJob.aItem.includes(sItem)) oJob.aItem.push(sItem);
          oJob.aFrom.push(sLoc);
        }
      }
      }   // the-files
      // MvrwGstr01: each S-file, MvrwGstr02: each G-file, read as it is now (an-earlier write of this run included)
      for (const [sFileOne, aJob] of ooJobGstr ?? []) {
        const oOne = ooRawAll.get(sFileOne);
        if (!oOne) { aLineOut.push(`SKIP   ${sFileOne}  no such Mcsh file`); oCount.SKIP = (oCount.SKIP ?? 0) + 1; continue; }
        const sRawOne = moFs.readFileSync(oOne.sPath, 'utf8');
        fWriteFile(oOne.sPath, sRawOne, sFileOne, oFix.sKind === 'gstr01'
          ? fPlanGntrNew(sRawOne, sFileOne, aJob, oSetHead)
          : fPlanSptrAdd(sRawOne, sFileOne, aJob));
      }
      if (nIssue === 0 && aPathFile.length > 1) aLineOut.push(`NOISSUE ${sDirOnly || (sPathList ? 'list' : 'worldview')}  ${sCodeOne}: nothing to fix in ${aPathFile.length} files`);
      for (const sNote of aLineOut.slice(nNoteFix)) {
        const sKind = sNote.split(' ')[0];
        if (['NOISSUE', 'NOFIX'].includes(sKind)) oCount[sKind] = (oCount[sKind] ?? 0) + 1;
      }
      const nChange = aLineOut.slice(nNoteFix).filter(sLine => !/^(SKIP|BAD|NOISSUE|NOFIX|LINK )/.test(sLine)).length;
      sCount = `${sCodeOne}: ${nIssue} issues · ${nChange} fixed` +
        (oCount.NOFIX ? ' · no automatic fix' : '');
    } else if (sMode === 'name') {
      // the-sections without name:: are what the-VALIDATOR says: MvrwSect03
      const aoFileHitp = fListMcshSome();
      const aoCnptFile = await Promise.all(aoFileHitp.map(oFile =>
        fReadFileMcsh(sNameDir, moPath.relative(sNameDir, oFile.sPathFile))));
      const ooSect = {};
      for (const oIssue of fRunChecksMcsh(aoCnptFile, sNameDir, true, ['MvrwSect03'])) {
        if (oIssue.sCode === 'MvrwSect03') {
          (ooSect[oIssue.sNameFile] ??= []).push({ sIdSect: oIssue.sIdConcept, sTitle: oIssue.sConcept });
        }
      }
      const oPathFile = Object.fromEntries(aoFileHitp.map(oFile => [oFile.sNameFile, oFile.sPathFile]));
      for (const [sNameFile, aoSect] of Object.entries(ooSect).sort()) {
        const sPathFile = oPathFile[sNameFile];
        const sRaw = moFs.readFileSync(sPathFile, 'utf8');
        const sNameShort = sNameFile.replace(/\.last\.html$/, '');
        fWriteFile(sPathFile, sRaw, sNameShort, fPlanName(sRaw, sNameShort, aoSect, fFindNameAll(sNameDir)));
      }
      sCount = `${oCount.NAME ?? 0} names created`;
    } else if (sMode === 'attribute') {
      // the-attribute issues are what the-VALIDATOR says: MvrwMain10, file by file
      for (const oFile of fListMcshSome()) {
        const sRaw = moFs.readFileSync(oFile.sPathFile, 'utf8');
        const aoIssue = fRunChecksMcsh([await fReadFileMcsh(sNameDir, moPath.relative(sNameDir, oFile.sPathFile), sRaw)], sNameDir, true, ['MvrwMain10'])
          .filter(oIssue => oIssue.sCode === 'MvrwMain10' && oIssue.sNameFile === oFile.sNameFile);
        if (aoIssue.length) fWriteFile(oFile.sPathFile, sRaw, fShort(oFile.sPathFile), fPlanAttribute(sRaw, fShort(oFile.sPathFile), aoIssue));
      }
      sCount = `${oCount.ATTR ?? 0} attribute titles|names fixed · ${oCount.SKIP ?? 0} by hand`;
    } else if (sMode === 'dupname') {
      for (const sPathFile of fFindFileAll(sNameDir)) {
        if (!moPath.basename(sPathFile).startsWith('Mcsh') || fSkipFile(sPathFile)) continue;
        const sRaw = moFs.readFileSync(sPathFile, 'utf8');
        fWriteFile(sPathFile, sRaw, fShort(sPathFile), fPlanDupName(sRaw, fShort(sPathFile)));
      }
      sCount = `${oCount.DUPNAME ?? 0} duplicate name-lines deleted`;
    } else if (sMode === 'namecomma') {
      for (const sPathFile of fFindFileAll(sNameDir)) {
        if (fSkipFile(sPathFile)) continue;
        const sRaw = moFs.readFileSync(sPathFile, 'utf8');
        if (!sRaw.includes('<br>* Mcsh') && !/<br>\*\s*Mcsh/.test(sRaw)) continue;
        fWriteFile(sPathFile, sRaw, fShort(sPathFile), fPlanNameComma(sRaw, fShort(sPathFile)));
      }
      sCount = `${oCount.NAMECOMMA ?? 0} name-lines got their comma · ${oCount.SKIP ?? 0} with a-comma in the-middle, by hand`;
    }
    // --auto: per step only its count of changes, the-detail is in createMcsh.txt
    const nNote = aLineOut.filter(sLine => !/^(SKIP|BAD)/.test(sLine)).length - nNoteBefore;
    aStep.push(aMode.length > 1 ? `${sMode} ${nNote}` : sCount);
  }

  const aHead = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `  createMcsh` +
      `${sModeOne === 'evoluting' ? '' : ' --' + sModeOne}${sCodeOne ? ' ' + sCodeOne : ''}${sNameFileOnly ? ' --file ' + sNameFileOnly : ''}${sDirOnly ? ' --dir ' + sDirOnly : ''}${bAll ? ' --all' : ''}${sPathList ? " --list " + sPathList : ""} ` +
      `${bFix ? '--fix' : 'dry-run'}: ${sNameDir}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `  ${oSetPathWritten.size} files ${bFix ? 'written' : 'to write'} · ${aStep.join(' · ')} · ` +
      `${oCount.SKIP ?? 0} skipped` + (oCount.nBad ? ` · ${oCount.nBad} BAD` : ''),
    bFix ? '  written, no backup: see git diff' : '  nothing written: add --fix to write',
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
