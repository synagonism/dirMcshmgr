/**
 * parser.js
 * Parses Mcs*.last.html files into structured JavaScript objects.
 *
 * The three Mcs types in the whole-part structure:
 *
 *  1) cnptFile
 *     The file itself is a concept. Its identity is in <section id="idOverview">.
 *     - <title> holds the canonical name + version string
 *     - <section id="idOverview"> contains the file's description:: and name:: paragraphs
 *
 *  2) cnptSect   (the main type)
 *     Every <section id="idXxx"> that contains a <p> whose text starts with "name::"
 *     and has at least one Mcs* entry is a cnptSect. Structure:
 *     - sNameId             the section's id= attribute
 *     - sNameTitle          text of the first <h1|h2|h3|h4> in the section
 *     - nHeadingLevel       1–9
 *     - nDepth              nesting nDepth (0 = top-level <section>)
 *     - sIdWhole_elmt       id of the enclosing <section>, or null
 *     - aoPara              all <p> elements directly in this section
 *     - oParaByTitle        paragraphs indexed by their keyword (e.g. "description", "name")
 *     - aName               parsed Mcs* entries from the name:: paragraph
 *     - aLinks              all hrefs found in this section
 *
 *  3) cnptPara
 *     A <p id="idXxx"> that does NOT have a known section-keyword (description::, name::…)
 *     but contains at least one "* McsEngl." or "* McsElln." name entry.
 *     These are inline concept-anchors embedded inside a section's content.
 *     - sNameId, sNameTitle, sText, aoName, aName, aLinks
 *
 * Returned per file:
 * {
 *   sType: 'cnptFile',
 *   sPathFile, sNameFile, sNameDir,
 *   sNameTitle,     // text from <title> (name part only)
 *   sVersion,       // e.g. "McsCor000015.1-4-0.2026-03-30"
 *   oSectOverview,  // the idOverview cnptSect (= the file's own concept)
 *   aoCnptSect,     // all cnptSect objects
 *   aoPara,         // all paragraph objects
 *   oSetId,         // Set<string> of every id= in the file (for link checking)
 *   aLinks,         // all unique hrefs in the file (content links only)
 *   oMapIdLine,     // Map<id, line> for report line numbers
 *   oMapLinkLine,   // Map<href, line> for report line numbers
 *   nLineTitle,     // line of the <title>
 *   sError          // set if the file could not be read
 * }
 */

import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

const
  aVersion = [
    'parser.js.0-4-0.2026-09-04: naming convention',
    'parser.js.0-3-0.2026-06-25: name changes',
    'parser.js.0-2-0.2026-05-0: div-paragraph',
    'parser.js.0-1-0.2026-04-24: creation'
  ]

// ─── HTML utilities ───────────────────────────────────────────────────────────

/** Strip all HTML tags, decode basic entities, collapse whitespace.
 *  <br> tags are converted to \n FIRST so that name-entry lines stay separate.
 */
export function fStripTags(sHtmlIn) {
  return sHtmlIn
    .replace(/<br\s*\/?>/gi, '\n')   // <br> → newline BEFORE stripping other tags
    .replace(/<[^>]+>/g, ' ')        // remove all other tags, replace with space to avoid word-joining
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')      // collapse only horizontal whitespace, keep \n
    .replace(/\n[ \t]+/g, '\n')      // trim leading spaces on each line
    .trim();
}

/**
 * DOING: Extract all id= values from a block of HTML
 * OUTPUT: Set<string> of all id= values found, for link-checking against hrefs later.
*/
export function fExtractId(sHtmlIn) {
  const rId = /\bid="([^"]+)"/g;
  const oSetId = new Set();
  let aMatch;
  while ((aMatch = rId.exec(sHtmlIn)) !== null) oSetId.add(aMatch[1]);
  return oSetId;
}

/**
 * DOING: map each first-group capture of rPattern to its 1-based line number.
 *   Single O(n) pass — the regex must be global and its matches monotonic.
 *   Keeps the FIRST line an equal key appears on.
 * OUTPUT: Map<string, number>.
 */
export function fBuildMapLine(sHtmlIn, rPattern) {
  const oMap = new Map();
  let aMatch, nLine = 1, nPos = 0;
  rPattern.lastIndex = 0;
  while ((aMatch = rPattern.exec(sHtmlIn)) !== null) {
    while (nPos < aMatch.index) { if (sHtmlIn.charCodeAt(nPos) === 10) nLine++; nPos++; }
    if (!oMap.has(aMatch[1])) oMap.set(aMatch[1], nLine);
  }
  return oMap;
}

/** 1-based line number of character offset nIdx in sHtmlIn (null if nIdx < 0). */
export function fFindLineAt(sHtmlIn, nIdx) {
  if (nIdx == null || nIdx < 0) return null;
  let nLine = 1;
  for (let i = 0; i < nIdx && i < sHtmlIn.length; i++) if (sHtmlIn.charCodeAt(i) === 10) nLine++;
  return nLine;
}


/**
 * INPUT: a block of HTML content.
 * OUTPUT: array of all unique href=values, no clsHide links.
 */
export function fExtractContentHrefs(sHtmlIn) {
  // Drop <code> examples (escaped or real anchors there are not live links), then
  // the clsHide self-anchors. Extract hrefs only from LITERAL <a …> tags, so an
  // escaped example (&lt;a href="…"&gt;) is never mistaken for a real link.
  const sCleaned = sHtmlIn
    .replace(/<code\b[\s\S]*?<\/code>/gi, '')
    .replace(/<a\s+class="clsHide"[^>]*>[\s\S]*?<\/a>/g, '');
  const rHref = /<a\b[^>]*?\bhref="([^"]+)"/gi;
  const aLinks = [];
  let aMatch;
  while ((aMatch = rHref.exec(sCleaned)) !== null) aLinks.push(aMatch[1]);
  return [...new Set(aLinks)]; // array unique hrefs only
}

// ─── Mcs name-entry parser ────────────────────────────────────────────────────

/**
 * DOING: find the-names of text of paragraph with lines: "* McsEngl.McshExml'att001-attribute, {2026-04-23}"
 * OUTPUT: array of name objects.
 *   { sNameRaw, sName, sLago }
 */
function fReadNameEntries(sTextIn) {
  const aoName = [];
  for (const sLine of sTextIn.split('\n')) {
    // A name entry line: "* McsEngl.McshExml'att001-attribute, {2026-04-23}"
    const aNameMatch = sLine.match(/\* (Mcs[A-Z][^\n,]+),/);
    if (!aNameMatch) continue;
    const sNameRaw = aNameMatch[1]; // "McsEngl.McshExml'att001 attribute"

    const sLago = 'lag' + sNameRaw.substring(3, 7);

    // sName: everything before the operator (or full string if none)
    const sName = sNameRaw.split('!⇒')[0].substr(8).trim(); // remove McsEngl.

    aoName.push({ sNameRaw, sName, sLago });
  }
  return aoName;
}

// ─── paragraph parser ─────────────────────────────────────────────────────────

/**
 * DOING: Parse a single block element (<p ...>...</p> or <div ...>...</div>).
 * INPUT: sBlockHtml — the block's raw HTML; sTag — 'p' or 'div'.
 * OUTPUT: one object paragraph:
 * {
 *   sType,         // 'paraP'/'paraDiv' or 'cnptPara'
 *   sSubtype,      // 'p' or 'div'
 *   sNameId,       // value of id= attribute, or null
 *   sNameTitle,    // keyword before "::" in the first text line, or null
 *   sText,         // full plain text content
 *   aoName,        // parsed Mcs* name objects
 *   aName,         // array of object-names
 *   aLinks,        // content hrefs
 * }
 */
function fReadBlockMcshPara(sBlockHtml, sTag) {
  const rId    = new RegExp(`<${sTag}\\b[^>]*\\bid="([^"]+)"`);
  const rOpen  = new RegExp(`^<${sTag}[^>]*>`);
  const rClose = new RegExp(`</${sTag}>\\s*$`);

  const aIdMatch = sBlockHtml.match(rId);
  const sNameId = aIdMatch ? aIdMatch[1] : null;

  // Remove the clsHide self-anchor at the end (always the last <a> in the block)
  const sInner = sBlockHtml
    .replace(rOpen, '')
    .replace(rClose, '')
    .replace(/<a\s+class="clsHide"[^>]*>[\s\S]*?<\/a>/g, '');

  const sText = fStripTags(sInner);

  // sNameTitle: first "text::" pattern
  const aTitleMatch = sText.match(/^([^:\n]+)::/);
  const sNameTitle = aTitleMatch ? aTitleMatch[1].trim() : null;

  // hrefs (content only)
  const aLinks = fExtractContentHrefs(sInner);

  // Name entries — parse regardless of sNameTitle, so paragraph-concepts can be detected
  const aoName = fReadNameEntries(sText);
  const aName = aoName.map(oName => oName.sName);

  // A paragraph-concept: has an id AND has Mcs* names AND is NOT a name:: paragraph
  // (name::-paragraphs belong to the cnptSect, not a separate concept)
  const bIsCnptPara =
    sNameId !== null &&
    aoName.length > 0 &&
    sNameTitle !== 'name';

  const sTypePara = bIsCnptPara ? 'cnptPara' : (sTag === 'p' ? 'paraP' : 'paraDiv');
  return {
    sType: sTypePara, sSubtype: sTag,
    sNameId, sNameTitle, sText, aoName, aName, aLinks,
  };
}


// ─── section splitter ─────────────────────────────────────────────────────────

/**
 * INPUT: raw HTML and extract every <section> block with its nesting info.
 * OUTPUT: array of { sNameId, sRawHtml, nDepth, sIdWhole_elmt } in document order,
 * ordered from outermost to innermost (i.e. whole appears before its parts).
 */
export function fSplit_sections(sHtmlIn) {
  const aoSect = [];
  const aoSectStart = []; // { sNameId, nStart, nDepth }
  const rTagSectAtts = /<\/?section\b([^>]*)>/gi;
  let aMatch;

  while ((aMatch = rTagSectAtts.exec(sHtmlIn)) !== null) {
    const sTagSect = aMatch[0];
    const sTagSectAtts = aMatch[1] ?? '';
    const bTagSecClose = sTagSect.startsWith('</');

    if (!bTagSecClose) {
      const aIdMatch = sTagSectAtts.match(/\bid="([^"]+)"/);
      aoSectStart.push({ sNameId: aIdMatch ? aIdMatch[1] : null, nStart: aMatch.index, nDepth: aoSectStart.length });
    } else {
      const oSectStartLast = aoSectStart.pop();
      if (!oSectStartLast) continue;
      const sIdWhole_elmt = aoSectStart.length > 0 ? aoSectStart[aoSectStart.length - 1].sNameId : null;
      aoSect.push({
        sNameId: oSectStartLast.sNameId,
        sRawHtml: sHtmlIn.slice(oSectStartLast.nStart, aMatch.index + sTagSect.length),
        nDepth: oSectStartLast.nDepth,
        sIdWhole_elmt,
      });
    }
  }
  return fReverseOnlyNestedSections(aoSect);
}

function fReverseOnlyNestedSections(aoSect) {
  const aoOut = [];
  let aoGroup = [];

  function fFlushGroup() {
    if (aoGroup.length === 0) return;

    const bHasNested = aoGroup.some(oSect => oSect.nDepth > 0);

    if (bHasNested) {
      aoGroup.sort((oA, oB) => {
        return oA.nDepth - oB.nDepth || oA.nStart - oB.nStart;
      });
    }

    aoOut.push(...aoGroup);
    aoGroup = [];
  }

  for (const oSect of aoSect) {
    aoGroup.push(oSect);

    // In your current closing-order output, a top-level section closes last.
    // So nDepth 0 means the current nested group is complete.
    if (oSect.nDepth === 0) {
      fFlushGroup();
    }
  }

  fFlushGroup();

  return aoOut;
}

/**
 * DOING: finds only the "overview" HTML — i.e. with all DIRECT part <section>...</section> blocks
 *   replaced by empty strings.
 *   This is done iteratively (not with a greedy regex) to handle nesting correctly.
 * INPUT: the sRawHtml of a section.
 * OUTPUT: a-string of overview heading and paragraphs only.
 */
export function fFindSect_overview(sRawSect) {
  // We strip sections that are direct parts only.
  // Strategy: track nDepth manually and blank out nested sections.
  const aResult = [];
  let nDepth = 0;
  let bInOwnSect = false; // have we passed the opening tag of rawHtml itself?
  const rTagSect = /<\/?section\b[^>]*>/gi;
  let nLast = 0;
  let aSectTagMatch;

  // The rawHtml starts with the opening <section> of the section itself.
  // nDepth 0 = inside this section's own content
  // nDepth 1 = inside a direct child <section>
  // We want to include text at nDepth 0, exclude nDepth >= 1.

  rTagSect.lastIndex = 0;
  while ((aSectTagMatch = rTagSect.exec(sRawSect)) !== null) {
    const sTagSect = aSectTagMatch[0];
    const bIsClose = sTagSect.startsWith('</');

    if (!bInOwnSect) {
      // First tag is the opening of the section itself — skip it
      bInOwnSect = true;
      nLast = aSectTagMatch.index + sTagSect.length;
      continue;
    }

    if (!bIsClose) {
      if (nDepth === 0) {
        // About to enter a child section: include text before it
        aResult.push(sRawSect.slice(nLast, aSectTagMatch.index));
        nLast = aSectTagMatch.index;
      }
      nDepth++;
    } else {
      nDepth--;
      if (nDepth === 0) {
        // Just closed a child section: skip its content
        nLast = aSectTagMatch.index + sTagSect.length;
      } else if (nDepth < 0) {
        // Closing our own section
        aResult.push(sRawSect.slice(nLast, aSectTagMatch.index));
        nLast = aSectTagMatch.index + sTagSect.length;
        break;
      }
    }
  }

  // Anything remaining at nDepth 0
  if (nLast < sRawSect.length && nDepth === 0) {
    aResult.push(sRawSect.slice(nLast));
  }

  // returns a-string of overview heading and paragraphs only, with all nested sections removed
  return aResult.join('');
}

// ─── section parser ───────────────────────────────────────────────────────────

/**
 * INPUT: one raw-sect object.
 * OUTPUT: one cnptSect or 'sect' object.
 * We only parse McshParagraphs that are DIRECTLY in this section, not inside
 * nested part <section> elements, to avoid double-counting.
 */
function fReadRaw_sect({ sNameId, sRawHtml, nDepth, sIdWhole_elmt }) {
  //console.log(`   Parsing section: sNameId=${sNameId} nDepth=${nDepth} sIdWhole_elmt=${sIdWhole_elmt}`);
  // "Overview HTML": the section's own content with nested <section>...</section>
  // blocks removed, so paragraph parsing only hits direct-child <p> elements.
  const sOverview = fFindSect_overview(sRawHtml);  // "<h? id=... <p ...</a></p>"
  // console.log(`     Overview: ${sOverview}`);

  // Heading: first <h1|h2|h3|..|h9> in overview
  const aHeadMatch = sOverview.match(/<h([1-9])\b[^>]*>([\s\S]*?)<\/h\1>/i);
  const sNameTitle  = aHeadMatch ? fStripTags(aHeadMatch[2]) : '';
  const nHeadingLevel = aHeadMatch ? parseInt(aHeadMatch[1]) : 1;

  // All direct-child McshParagraphs
  const aoPara = [];
  const rP = /<p\b[^>]*>[\s\S]*?<\/p>/gi;
  // McshParagraphs could-be and div with p|table|ol|ul members
  const rDiv = /<div\b[^>]*>[\s\S]*?<\/div>/gi;
  let aParaMatch;
  while ((aParaMatch = rP.exec(sOverview)) !== null) {
    aoPara.push(fReadBlockMcshPara(aParaMatch[0], 'p'));
  }
  while ((aParaMatch = rDiv.exec(sOverview)) !== null) {
    aoPara.push(fReadBlockMcshPara(aParaMatch[0], 'div'));
  }

  // Index paragraphs by title for quick lookup
  const oParaByTitle = {};
  for (const oPara of aoPara) {
    if (oPara.sNameTitle) {
      if (!oParaByTitle[oPara.sNameTitle]) oParaByTitle[oPara.sNameTitle] = [];
      oParaByTitle[oPara.sNameTitle].push(oPara);
    }
  }

  // Name entries — from the name:: paragraph(s) only
  const aName = (oParaByTitle['name'] ?? []).flatMap(oPara => oPara.aName);
  const aoName = (oParaByTitle['name'] ?? []).flatMap(oPara => oPara.aoName);

  // All content hrefs across the entire section (including nested children)
  const aLinks = fExtractContentHrefs(sRawHtml);

  // A cnptSect is a section that carries a name:: paragraph with at least one
  // valid Mcs* entry. Structural sections (TOC, headers, plain prose) have no
  // name:: and are labelled 'sect' so they are not treated as concepts.
  const bIsCnptSect = (oParaByTitle['name'] ?? []).length > 0 && aName.length > 0;

  return {
    sType: bIsCnptSect ? 'cnptSect' : 'sect',
    sNameId,
    sNameTitle,
    nHeadingLevel,
    nDepth,
    sIdWhole_elmt,
    aoPara,
    oParaByTitle,
    aoName,
    aName,
    aLinks,
  };
}

// ─── public file parser ───────────────────────────────────────────────────────
/**
 * INPUT: one McsFile given its path.
 * OUTPUT: one cnptFile object (see header of this file).
 */
export function fParseFile(sPathFile) {
  // sPathFile: C:\xampp\htdocs\dirMcsh\dirCor\McshCor000015.last.html
  let sFileRaw;
  try {
    sFileRaw = fs.readFileSync(sPathFile, 'utf8');
  } catch (e) {
    return {
      sType: 'cnptFile',
      sPathFile,
      sNameFile: path.basename(sPathFile), // McshCor000015.last.html
      sNameDir: path.basename(path.dirname(sPathFile)), // dirCor
      sError: e.message,
      oSectOverview: null,
      aoCnptSect: [],
      aoPara: [],
      oSetId: new Set(),
      aLinks: [],
      oMapIdLine: new Map(),
      oMapLinkLine: new Map(),
      nLineTitle: null,
    };
  }

  // ── line maps (id= and href= → 1-based line) for report line numbers ──────
  const oMapIdLine   = fBuildMapLine(sFileRaw, /\bid="([^"]+)"/g);
  const oMapLinkLine = fBuildMapLine(sFileRaw, /href="([^"]+)"/g);

  // ── <title> ──────────────────────────────────────────────────────────────
  const aTitleMatch = sFileRaw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const nLineTitle = aTitleMatch ? fFindLineAt(sFileRaw, aTitleMatch.index) : null;
  const sTitleRaw = aTitleMatch ? fStripTags(aTitleMatch[1]) : '';
  const aVersionMatch = sTitleRaw.match(/\(([^)]+)\)/);
  const sVersion  = aVersionMatch ? aVersionMatch[1].trim() : null; //McsCor000015.1-7-0.2026-06-22
  const sNameTitle = sTitleRaw.replace(/\s*\([^)]*\)\s*/g, '').trim(); //Mcs.McshExml!=example-McsHitp

  // ── all id= values (for broken-anchor checking) ───────────────────────────
  const oSetId = fExtractId(sFileRaw);

  // ── all content hrefs in the file ────────────────────────────────────────
  const aLinks = fExtractContentHrefs(sFileRaw);

  // ── split into sections ───────────────────────────────────────────────────
  const aoRawSect = fSplit_sections(sFileRaw);

  const aoCnptSect = [];
  const aoPara  = [];
  // file-Mcs = the idOverview section (always the file's own concept)
  let oSectOverview = null;

  for (const oRawSect of aoRawSect) {
    // Skip infrastructure sections
    if (oRawSect.sNameId === 'idMeta' || oRawSect.sNameId === 'idHeader'
       || oRawSect.sNameId === 'idSupport' || oRawSect.sNameId === 'idComment') continue;

    // Parse as a cnptSect candidate
    const oSect = fReadRaw_sect(oRawSect);
    // console.log(`Parsed section id=${oSect.sNameId} title="${oSect.sNameTitle}" with ${oSect.aName.length} names and ${oSect.aoPara.length} paragraphs.`);
    if (oSect.sType === 'cnptSect') aoCnptSect.push(oSect);
    if (oSect.sNameId === 'idOverview') oSectOverview = oSect;

    // Collect this section's direct paragraphs — already parsed by fReadRaw_sect
    // (same fFindSect_overview + <p>/<div> logic), so reuse instead of re-parsing.
    aoPara.push(...oSect.aoPara);
  }

  return {
    sType: 'cnptFile',
    sPathFile,
    sNameFile: path.basename(sPathFile),
    sNameDir: path.basename(path.dirname(sPathFile)),
    sNameTitle,
    sVersion,
    oSectOverview,
    aoCnptSect,
    aoPara,
    oSetId,
    aLinks,
    oMapIdLine,
    oMapLinkLine,
    nLineTitle,
  };
}

// ─── directory scanner ────────────────────────────────────────────────────────

export function fParseFileAll(sPathDir) {
  let aPathFile;
  try {
    const sPattern = path.join(sPathDir, '**/*.last.html').replace(/\\/g, '/');
    aPathFile = globSync(sPattern, { ignore: '**/node_modules/**' });
  } catch {
    aPathFile = fWalkDir(sPathDir);
  }
  // returns array of cnptFile objects
  return aPathFile.map(sPath => fParseFile(sPath));
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
