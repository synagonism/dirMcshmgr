/**
 * parserHitp.js
 * Parses generic Hitp (Html5.Id.Toc.Preview) *.last.html files into structured
 * JavaScript objects. Hitp is the title-content-tree book format that Mcs
 * specialises; a Hitp file has sections/headings/paragraphs carrying unique IDs,
 * a clsHide self-anchor on each heading/paragraph, and clsPreview link-preview
 * cross-references — but none of the Mcs name::/description:: concept layer.
 *
 * Reuses the generic HTML/section helpers from parser.js.
 *
 * Returned per file (oFileHitp):
 * {
 *   sType: 'fileHitp',
 *   sPathFile, sNameFile, sNameDir,
 *   sNameTitle,     // <title> text (name part only)
 *   sVersion,       // e.g. "HitpStnStd000.8-2-3.2024-05-26"
 *   nLineTitle,     // line of the <title>
 *   aoSect,         // [{ sNameId, sNameTitle, nHeadingLevel, nDepth, sIdWhole_elmt, nLine, nLineOpen, nLineClose }]
 *   aoElmt,         // heading+paragraph elements of content sections:
 *                   //   [{ sType:'head'|'para', sNameId, nLevel, sHrefSelf, nLine, nLineOwn, sIdSect }]
 *                   //   nLine: of its id, else of its section's id; nLineOwn: of its own tag
 *   oSetId,         // Set<string> of every id= in the file
 *   aoIdDup,        // [{ sName, nLine }] ids that appear more than once
 *   aLinks,         // content hrefs (clsHide self-anchors removed)
 *   oMapIdLine,     // Map<id, line>
 *   oMapLinkLine,   // Map<href, line>
 *   sError          // set if the file could not be read
 * }
 */

import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import {
  fStripTags,
  fExtractId,
  fBuildMapLine,
  fFindLineAt,
  fMakeLineAt,
  fExtractContentHrefs,
  fSplit_sections,
  fFindSect_overview,
} from './parser.js';

const
  aVersion = [
    'parserHitp.js.0-5-0.2026-11-04: fReadFileHitp/fReadFileHitpIdOnly sRawIn, the-text already read',
    'parserHitp.js.0-4-0.2026-11-04: aoElmt nLineOwn, the-line of the-element itself, also without id',
    'parserHitp.js.0-3-0.2026-11-04: aoSect nLineOpen, the-line of <section, also without id',
    'parserHitp.js.0-2-0.2026-11-04: faster: lines looked up (fMakeLineAt) only for what is reported, script/style blanked once, light reads IdOnly/PathOnly',
    'parserHitp.js.0-1-0.2026-09-04: creation'
  ]

// sections that are infrastructure, not content (skipped for element checks)
const aoIdSectInfra = ['idMeta', 'idComment', 'idSupport'];

/**
 * DOING: scan every id="X" and return the ones appearing more than once.
 * OUTPUT: [{ sName, nLine }] (nLine = 1-based line of the FIRST occurrence).
 */
function fFindIdDuplicate(sHtmlIn, fLineAtIn = null) {
  const rId = /\bid="([^"]+)"/g;
  const oMapCount = new Map();   // id → count
  const oMapFirstIdx = new Map(); // id → offset of its first occurrence
  let aMatch;
  while ((aMatch = rId.exec(sHtmlIn)) !== null) {
    const sName = aMatch[1];
    oMapCount.set(sName, (oMapCount.get(sName) ?? 0) + 1);
    if (!oMapFirstIdx.has(sName)) oMapFirstIdx.set(sName, aMatch.index);
  }
  const aoIdDup = [];
  let fLineAt = fLineAtIn;   // the-lines of the-duplicates only
  for (const [sName, nCount] of oMapCount) {
    if (nCount <= 1) continue;
    fLineAt ??= fMakeLineAt(sHtmlIn);
    aoIdDup.push({ sName, nLine: fLineAt(oMapFirstIdx.get(sName)) });
  }
  return aoIdDup;
}

// void elements never need a closing tag
const oSetTagVoid = new Set(['br', 'img', 'meta', 'link', 'hr', 'input', 'wbr',
  'col', 'source', 'area', 'base', 'embed', 'param', 'track']);
// tags whose end tag is optional in HTML — skip to avoid false "unclosed"
const oSetTagSkip = new Set(['li', 'tr', 'td', 'th']);

/**
 * DOING: blank out <script>/<style>/<!-- --> regions (chars → spaces, newlines
 *   kept), so their contents cannot look like tags and line numbers stay exact.
 * OUTPUT: the same-length string, scannable for real HTML tags.
 */
function fBlankNonHtml(sHtmlIn) {
  const fBlank = sBlock => sBlock.replace(/[^\n]/g, ' ');
  return sHtmlIn
    .replace(/<script[\s\S]*?<\/script>/gi, fBlank)
    .replace(/<style[\s\S]*?<\/style>/gi, fBlank)
    .replace(/<!--[\s\S]*?-->/g, fBlank);
}

/**
 * DOING: blank out <pre>/<code> example blocks (chars → spaces, newlines kept),
 *   so an id="…" shown inside a code sample is not scanned as a real page id.
 *   Length + newlines are preserved, so id line numbers stay exact.
 *   <pre> is blanked first so a <code> nested inside <pre> is covered too.
 * OUTPUT: the same-length string, safe for id extraction.
 */
function fBlankCodePre(sHtmlIn) {
  const fBlank = sBlock => sBlock.replace(/[^\n]/g, ' ');
  return sHtmlIn
    .replace(/<pre\b[\s\S]*?<\/pre>/gi, fBlank)
    .replace(/<code\b[\s\S]*?<\/code>/gi, fBlank);
}

/**
 * DOING: stack-match every container tag and find unclosed opens / stray closes.
 * OUTPUT: [{ sKind:'unclosed'|'stray', sTag, nLine }]
 *   unclosed → line where the tag was OPENED; stray → line of the extra close.
 */
function fScanTagPairs(sScan, fLineAt) {

  const aoBad = [];
  const aoStack = []; // { sTag, nIdx }: the-line is found only for a-bad tag
  const rTag = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let aMatch;
  while ((aMatch = rTag.exec(sScan)) !== null) {
    const bClose = aMatch[1] === '/';
    const sTag = aMatch[2].toLowerCase();
    const sAtts = aMatch[3];
    if (oSetTagVoid.has(sTag) || oSetTagSkip.has(sTag)) continue;
    if (!bClose && /\/\s*$/.test(sAtts)) continue; // self-closing <tag/>

    if (!bClose) {
      aoStack.push({ sTag, nIdx: aMatch.index });
    } else {
      // find nearest matching open from the top of the stack
      let nIdx = -1;
      for (let k = aoStack.length - 1; k >= 0; k--) {
        if (aoStack[k].sTag === sTag) { nIdx = k; break; }
      }
      if (nIdx === -1) {
        aoBad.push({ sKind: 'stray', sTag, nLine: fLineAt(aMatch.index) });
      } else {
        // everything above the match was left unclosed
        for (let k = aoStack.length - 1; k > nIdx; k--) {
          aoBad.push({ sKind: 'unclosed', sTag: aoStack[k].sTag, nLine: fLineAt(aoStack[k].nIdx) });
        }
        aoStack.length = nIdx; // pop through the match
      }
    }
  }
  // anything still open at EOF is unclosed
  for (const oOpen of aoStack) {
    aoBad.push({ sKind: 'unclosed', sTag: oOpen.sTag, nLine: fLineAt(oOpen.nIdx) });
  }
  return aoBad;
}

/**
 * DOING: find every HTML element name that contains an uppercase letter.
 *   HTML element names must be lowercase in Hitp.
 * OUTPUT: [{ sTag, nLine }] — sTag keeps the original (offending) casing.
 */
function fScanTagCase(sScan, fLineAt) {
  const aoCase = [];
  const rTag = /<\/?([a-zA-Z][a-zA-Z0-9]*)/g;
  let aMatch;
  while ((aMatch = rTag.exec(sScan)) !== null) {
    const sTag = aMatch[1];
    if (sTag !== sTag.toLowerCase()) aoCase.push({ sTag, nLine: fLineAt(aMatch.index) });
  }
  return aoCase;
}

/**
 * DOING: find element attributes whose value is NOT double-quoted (single-quoted
 *   or unquoted). Attribute lists are parsed per start-tag with the double-quoted
 *   alternative FIRST, so an "=" inside a "…" value (e.g. the viewport meta's
 *   content="…, initial-scale=1") is consumed whole and never mistaken for an attr.
 * OUTPUT: [{ sAttr, sKind:'single'|'unquoted', sValue, nLine }]
 */
function fScanAttrQuote(sScan, fLineAt) {
  const aoAttrBad = [];
  const rTag = /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g; // start/void tags only
  const rAttr = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+)/g;
  // a-bad value starts, after "=", with a-char that is not '"': without one, all are double-quoted
  const rMaybeBad = /=\s*[^\s"]/;
  let aMatch;
  while ((aMatch = rTag.exec(sScan)) !== null) {
    const sAtts = aMatch[2];
    if (!rMaybeBad.test(sAtts)) continue;
    const nLine = fLineAt(aMatch.index);
    let aAttrMatch;
    rAttr.lastIndex = 0;
    while ((aAttrMatch = rAttr.exec(sAtts)) !== null) {
      const sAttr = aAttrMatch[1];
      const sRaw = aAttrMatch[2];
      const sFirst = sRaw[0];
      if (sFirst === '"') continue; // double-quoted → OK
      if (sFirst === "'") {
        aoAttrBad.push({ sAttr, sKind: 'single', sValue: sRaw.slice(1, -1), nLine });
      } else {
        aoAttrBad.push({ sAttr, sKind: 'unquoted', sValue: sRaw, nLine });
      }
    }
  }
  return aoAttrBad;
}

/**
 * DOING: find char-ranges of a-string that are inside a <div> carrying an id=
 *   (a no-id <div> nested inside a <div id> still counts — an ancestor has the id).
 * OUTPUT: [{ nStart, nEnd }] ranges (in sHtmlIn coordinates).
 */
function fRangesInDivId(sHtmlIn) {
  const aoRange = [];
  const rDiv = /<\/?div\b([^>]*)>/gi;
  const aoStack = []; // { bHasId } per open <div>
  let nDepthId = 0, nStart = -1, aMatch;
  while ((aMatch = rDiv.exec(sHtmlIn)) !== null) {
    const bClose = aMatch[0].startsWith('</');
    if (!bClose) {
      const bHasId = /\bid="[^"]*"/.test(aMatch[1]);
      aoStack.push({ bHasId });
      if (bHasId) { if (nDepthId === 0) nStart = aMatch.index; nDepthId++; }
    } else {
      const oOpen = aoStack.pop();
      if (oOpen && oOpen.bHasId) {
        nDepthId--;
        if (nDepthId === 0) { aoRange.push({ nStart, nEnd: aMatch.index + aMatch[0].length }); nStart = -1; }
      }
    }
  }
  return aoRange;
}

/**
 * DOING: read one heading/paragraph element's HTML.
 * OUTPUT: { sNameId, sHrefSelf }
 *   sNameId   — value of the element's own id= (or null)
 *   sHrefSelf — the "#X" target of its trailing clsHide anchor, X only (or null)
 */
function fReadElmtHitp(sElmtHtml) {
  const aIdMatch = sElmtHtml.match(/^<[a-z0-9]+\b[^>]*\bid="([^"]+)"/i);
  const sNameId = aIdMatch ? aIdMatch[1] : null;
  // The element's OWN self-anchor is the LAST clsHide in it — a paragraph may embed
  // sub-elements (e.g. an equation/figure) each carrying their own clsHide first.
  const aoHide = [...sElmtHtml.matchAll(/<a\s+class="clsHide"\s+href="#([^"]*)"/gi)];
  const sHrefSelf = aoHide.length ? aoHide[aoHide.length - 1][1] : null;
  return { sNameId, sHrefSelf };
}

/**
 * INPUT: one Hitp file given its path.
 * OUTPUT: one oFileHitp object (see header).
 */
// sRawIn: the-text when the-caller has read it already (createMcsh), else it is read here
export function fReadFileHitp(sPathFile, sRawIn = null) {
  let sFileRaw;
  try {
    sFileRaw = sRawIn ?? fs.readFileSync(sPathFile, 'utf8');
  } catch (e) {
    return {
      sType: 'fileHitp',
      sPathFile,
      sNameFile: path.basename(sPathFile),
      sNameDir: path.basename(path.dirname(sPathFile)),
      sError: e.message,
      sNameTitle: '',
      sVersion: null,
      nLineTitle: null,
      aoSect: [],
      aoElmt: [],
      oSetId: new Set(),
      aoIdDup: [],
      aLinks: [],
      oMapIdLine: new Map(),
      oMapLinkLine: new Map(),
      aoTagBad: [],
      aoTagCase: [],
      aoAttrBad: [],
    };
  }

  // ── line maps + id set + duplicate ids + tag pairs ────────────────────────
  // id extraction ignores <code>/<pre> example blocks (an id="…" shown in a
  // code sample is not a real page id); blanking keeps length + newlines so
  // line numbers stay exact.
  const sHtmlId = fBlankCodePre(sFileRaw);
  const oMapIdLine   = fBuildMapLine(sHtmlId, /\bid="([^"]+)"/g);
  const oMapLinkLine = fBuildMapLine(sFileRaw, /<a\b[^>]*?\bhref="([^"]+)"/g);
  // <script>/<style>/<!-- --> blanked ONCE, for the-three tag scanners
  const sScan = fBlankNonHtml(sFileRaw);
  // the-blanking keeps every newline, so ONE line-lookup serves all three strings
  const fLineAt = fMakeLineAt(sFileRaw);
  const aoTagBad = fScanTagPairs(sScan, fLineAt);
  const aoTagCase = fScanTagCase(sScan, fLineAt);
  const aoAttrBad = fScanAttrQuote(sScan, fLineAt);
  const oSetId  = fExtractId(sHtmlId);
  const aoIdDup = fFindIdDuplicate(sHtmlId, fLineAt);

  // ── <title> + version ─────────────────────────────────────────────────────
  const aTitleMatch = sFileRaw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const nLineTitle = aTitleMatch ? fFindLineAt(sFileRaw, aTitleMatch.index) : null;
  const sTitleRaw = aTitleMatch ? fStripTags(aTitleMatch[1]) : '';
  const aVersionMatch = sTitleRaw.match(/\(([^)]+)\)/);
  const sVersion  = aVersionMatch ? aVersionMatch[1].trim() : null; // HitpStnStd000.8-2-3.2024-05-26
  const sNameTitle = sTitleRaw.replace(/\s*\([^)]*\)\s*/g, '').trim();

  // ── all content hrefs in the file ─────────────────────────────────────────
  const aLinks = fExtractContentHrefs(sFileRaw);

  // ── sections → aoSect + aoElmt ────────────────────────────────────────────
  const aoRawSect = fSplit_sections(sFileRaw);
  const aoSect = [];
  const aoElmt = [];

  // Lines of <p> that are unclosed (from the tag-pair scanner). An unclosed <p>
  // makes the element regex swallow the NEXT paragraph, so its sHrefSelf is bogus;
  // mark it so H06 skips it (H09 reports the unclosed tag instead).
  const oSetLineUnclosedP = new Set(
    aoTagBad.filter(oBad => oBad.sTag === 'p' && oBad.sKind === 'unclosed').map(oBad => oBad.nLine)
  );

  for (const oRawSect of aoRawSect) {
    const sOverview = fFindSect_overview(oRawSect.sRawHtml);

    // heading of this section: first <h1..6> in the overview
    const aHeadMatch = sOverview.match(/<h([1-9])\b[^>]*>([\s\S]*?)<\/h\1>/i);
    const nHeadingLevel = aHeadMatch ? parseInt(aHeadMatch[1]) : null;
    const sNameTitleSect = aHeadMatch ? fStripTags(aHeadMatch[2]) : '';

    aoSect.push({
      sNameId: oRawSect.sNameId,
      sNameTitle: sNameTitleSect,
      nHeadingLevel,
      nDepth: oRawSect.nDepth,
      sIdWhole_elmt: oRawSect.sIdWhole_elmt,
      // the-line of <section id>: aoSect is NOT in document order, Hvrw07 sorts by it
      nLine: oMapIdLine.get(oRawSect.sNameId) ?? null,
      // the-line of the-<section tag itself, ALSO for a-section without id (Hvre04)
      nLineOpen: fLineAt(oRawSect.nIdxStart),
      // the-line of its </section>: sRawHtml runs from <section to </section>
      //   its newlines from the-file's newline-offsets, NOT by re-scanning every nested section
      nLineClose: oMapIdLine.has(oRawSect.sNameId)
        ? oMapIdLine.get(oRawSect.sNameId) + fLineAt(oRawSect.nIdxEnd) - fLineAt(oRawSect.nIdxStart) : null,
    });

    // element-level checks skip infrastructure sections (idMeta/idComment/idSupport);
    // header/footer are <header>/<footer>, not <section>, so already excluded.
    if (aoIdSectInfra.includes(oRawSect.sNameId)) continue;

    const sIdSect = oRawSect.sNameId;
    // char-ranges inside a <div id="…"> — <p> there is exempt from H04
    const aoRangeDivId = fRangesInDivId(sOverview);

    // headings (h1..6) directly in this section's overview
    const rHead = /<h([1-6])\b[^>]*>[\s\S]*?<\/h\1>/gi;
    let aMatch;
    // the-line of an-element's OWN tag (Hvre02/Hvre03, an-element without id): the-overview
    //   is pieces of sRawHtml in order, so each element is found from the-previous one on
    const fMakeLineOwn = () => {
      let nCursor = 0;
      return sElmtIn => {
        const nIdx = oRawSect.sRawHtml.indexOf(sElmtIn, nCursor);
        if (nIdx === -1) return null;
        nCursor = nIdx + sElmtIn.length;
        return fLineAt(oRawSect.nIdxStart + nIdx);
      };
    };
    const fLineOwnHead = fMakeLineOwn();
    while ((aMatch = rHead.exec(sOverview)) !== null) {
      const { sNameId, sHrefSelf } = fReadElmtHitp(aMatch[0]);
      aoElmt.push({
        sType: 'head', sSubtype: 'h' + aMatch[1], sNameId, nLevel: parseInt(aMatch[1]),
        sHrefSelf, nLine: oMapIdLine.get(sNameId) ?? oMapIdLine.get(sIdSect) ?? null, sIdSect,
        nLineOwn: fLineOwnHead(aMatch[0]),
      });
    }

    // paragraphs (<p>) directly in this section's overview
    const rP = /<p\b[^>]*>[\s\S]*?<\/p>/gi;
    const fLineOwnPara = fMakeLineOwn();
    while ((aMatch = rP.exec(sOverview)) !== null) {
      const { sNameId, sHrefSelf } = fReadElmtHitp(aMatch[0]);
      const nLine = oMapIdLine.get(sNameId) ?? oMapIdLine.get(sIdSect) ?? null;
      const bInDivId = aoRangeDivId.some(oR => aMatch.index >= oR.nStart && aMatch.index < oR.nEnd);
      aoElmt.push({
        sType: 'para', sSubtype: 'p', sNameId, nLevel: null,
        sHrefSelf, nLine, sIdSect, bUnclosed: oSetLineUnclosedP.has(nLine), bInDivId,
        nLineOwn: fLineOwnPara(aMatch[0]),
      });
    }
  }

  return {
    sType: 'fileHitp',
    sPathFile,
    sNameFile: path.basename(sPathFile),
    sNameDir: path.basename(path.dirname(sPathFile)),
    sNameTitle,
    sVersion,
    nLineTitle,
    aoSect,
    aoElmt,
    oSetId,
    aoIdDup,
    aLinks,
    oMapIdLine,
    oMapLinkLine,
    aoTagBad,
    aoTagCase,
    aoAttrBad,
  };
}

// ─── directory scanner ────────────────────────────────────────────────────────

export function fReadFileAllHitp(sPathDir) {
  return fFindPathAllHitp(sPathDir).map(sPath => fReadFileHitp(sPath));
}

/**
 * OUTPUT: the-paths of the-.last.html files under a-dir (node_modules skipped).
 */
function fFindPathAllHitp(sPathDir) {
  try {
    const sPattern = path.join(sPathDir, '**/*.last.html').replace(/\\/g, '/');
    return globSync(sPattern, { ignore: '**/node_modules/**' });
  } catch {
    return fWalkDir(sPathDir);
  }
}

/**
 * DOING: a-LIGHT read for the-duplicate-id check (Hvre01) alone: only the-ids, as
 *   fReadFileHitp finds them (<code>/<pre> examples blanked), without the-full parse,
 *   which is ~35 ms a-file; the-other fields are empty.
 * OUTPUT: a-file object with sNameFile, sPathFile, oSetId, aoIdDup, oMapIdLine.
 */
export function fReadFileHitpIdOnly(sPathFile, sRawIn = null) {
  const oFile = {
    sType: 'fileHitp', sPathFile, sNameFile: path.basename(sPathFile),
    sNameDir: path.basename(path.dirname(sPathFile)), sError: null,
    sNameTitle: '', sVersion: null, nLineTitle: null, aoSect: [], aoElmt: [],
    oSetId: new Set(), aoIdDup: [], aLinks: [], oMapIdLine: new Map(), oMapLinkLine: new Map(),
    aoTagBad: [], aoTagCase: [], aoAttrBad: [],
  };
  let sFileRaw;
  try { sFileRaw = sRawIn ?? fs.readFileSync(sPathFile, 'utf8'); } catch (e) { oFile.sError = e.message; return oFile; }
  const sHtmlId = fBlankCodePre(sFileRaw);
  oFile.oSetId = fExtractId(sHtmlId);
  oFile.aoIdDup = fFindIdDuplicate(sHtmlId);
  return oFile;
}

export function fReadFileAllHitpIdOnly(sPathDir) {
  return fFindPathAllHitp(sPathDir).map(sPath => fReadFileHitpIdOnly(sPath));
}

/**
 * DOING: NO read, for the-Mcsh rules alone: parserMcsh reads the-Mcsh files itself,
 *   the-validator needs only their paths and names.
 * OUTPUT: a-file object with sPathFile, sNameFile, sNameDir.
 */
export function fReadFileHitpPathOnly(sPathFile) {
  return { sType: 'fileHitp', sPathFile, sNameFile: path.basename(sPathFile),
    sNameDir: path.basename(path.dirname(sPathFile)), sError: null };
}

export function fReadFileAllHitpPathOnly(sPathDir) {
  return fFindPathAllHitp(sPathDir).map(sPath => fReadFileHitpPathOnly(sPath));
}

function fWalkDir(sDir) {
  let aPathFile = [];
  for (const sItem of fs.readdirSync(sDir)) {
    if (sItem === 'node_modules') continue;
    const sPathFull = path.join(sDir, sItem);
    if (fs.statSync(sPathFull).isDirectory()) {
      aPathFile = aPathFile.concat(fWalkDir(sPathFull));
    } else if (sItem.endsWith('.last.html')) {
      aPathFile.push(sPathFull);
    }
  }
  return aPathFile;
}
