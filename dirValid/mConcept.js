/*
 * mConcept.js - module functions on concepts-of-Mcsh_lago (Mcsh)
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
 */

import * as omMcsh from '../mMcsh2.js'

const
  // contains the-versions of mConcept.js 
  aVersion = [
    'mConcept.js.0-3-0.2026-08-23: Claude review',
    'mConcept.js.0-3-0.2026-08-14: fReadMcsLago_names',
    'mConcept.js.0-2-0.2026-06-25: fReadFileCnpt',
    'mConcept.js.0-1-0.2026-06-22: creation'
  ],
  // the-PoS-keys of a-lagoName-object,
  aPosKey = ['aNoun', 'aCase', 'aAdje', 'aAdve', 'aVerb', 'aConj'],
  ooFile_cnpt = omMcsh.ooFile_cnpt, // {sNameIdRela: oFile_cnpt}
  sProjectPath = omMcsh.sPathSite + "dirMcsh/", // http://localhost/dirMcsh/
  sFileNameRela = window.location.pathname.split("dirMcsh/")[1] // dirCor/McsCor000....last.html
const oPath = {
  join: (...parts) => parts.filter(Boolean).join('/'),
  resolve: (...parts) => '/' + parts.filter(Boolean).join('/'),
  basename: (str) => str.split('/').pop(),
  dirname: (str) => str.split('/').slice(0, -1).join('/'),
  extname: (str) => {
    const i = str.lastIndexOf('.');
    return i > 0 ? str.slice(i) : '';
  }
};

let oFileIdRelaCnpt = {}; //{'dirTchInf/McshTchInf000010.last.html#idLjstol': {}}


/**
 * DOING: parses a-file-concept and returns a-JS-object of it.
 * INPUT: one file-concept given its relative-path (dirCor/McshCor000015.last.html).
 * OUTPUT: one file-concept-object:
 * {
 *   sType,          // 'cnptFile',
 *   sNameFile,      // McshCor000015.last.html
 *   sNameDir,       // dirCor
 *   sNameIdAbso,    // http://localhost/dirMcsh/dirCor/McshCor000015.last.html
 *   sNameIdRela,    // dirCor/McshCor000015.last.html
 *   sNameTitle,     // text from <title> (name part only)
 *   sNameFormal,    // the English formal-name
 *   sVersion,       // e.g. "McsCor000015.1-4-0.2026-03-30"
 *   sCreation,      // {2026-08-17}
 *   aoRaw_sect,     // raw-section objects.
 *   aoTitlePara,    // [{sNameTitle, sPara}]
 *   oNameLago,      // {oNameEngl, oNameZhon}
 *   sAttrGeneric,   // generic-concept of concept
 *   sAttrWhole,     // whole-concept of concept
 *   sAttrParent,    // whole-concept of concept
 *   aAttr,          // attributes of concept
 *   oFileIdRelaCnpt,// {'sNameIdRela': oCnpt} the-part concepts
 * }
 */
async function fReadMcshFile(sNameIdRela) {
  // FIRST: check if this file-cnpt is known
  // LAST: add this file-cnpt on ooFile_cnpt 
  const sNameIdAbso = sProjectPath + sNameIdRela;
  let aoTitlePara = [];
  let sOverview = '';
  let sFileRaw = '';
  let oNameLago = {};
  oFileIdRelaCnpt = {};

  try {
    const oResponse = await fetch(sNameIdAbso);
    if (!oResponse.ok) throw new Error(`HTTP ${oResponse.status} ${oResponse.statusText}`);
    sFileRaw = await oResponse.text();
  } catch (e) {
    return {
      sType: 'cnptFile',
      sNameIdAbso, // http://localhost/dirMcsh/dirCor/McshCor000015.last.html
      sError: e.message,
    };
  }

  // ── <title> ──────────────────────────────────────────────────────────────
  const aTitleMatch = sFileRaw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const sTitleRaw = aTitleMatch ? fStripTags(aTitleMatch[1]) : '';
  const aVersionMatch = sTitleRaw.match(/\(([^)]+)\)/);
  const sVersion  = aVersionMatch ? aVersionMatch[1].trim() : null; //McsCor000015.1-7-0.2026-06-22
  const sNameTitle = sTitleRaw.replace(/\s*\([^)]*\)\s*/g, '').trim(); //Mcs.McshExml!=example-McsHitp
  // console.log(sNameTitle)

  // ── split into sections ───────────────────────────────────────────────────
  const aoRaw_sect = fSplit_sections(sFileRaw);
  /*
  idOverview: null: 0
  idMcshExmlatt001: null: 0
  idMcshExmlatt002: idMcshExmlatt001: 1
  idMcshExmlatt003: idMcshExmlatt002: 2
  idMcshExmlatt004: idMcshExmlatt003: 3
  idMcshExmlatt005: idMcshExmlatt004: 4
  idMcshExmlatt005b: idMcshExmlatt004: 4
  idMcshExmlatt006: idMcshExmlatt005: 5
  idMcshExmlenvt: null: 0
  idMcshExmlmisc: null: 0
  idMcshExmlirsc: null: 0
  idMcshExmlrsceval: idMcshExmlirsc: 1
  idMcshExmlrscsci: idMcshExmlirsc: 1
  idMcshExmlsrtr: null: 0
  idMcshExmldng: null: 0
  idMcshExmlevg: null: 0
  idMcshExmlpct: null: 0
  idMcshExmlwpt: null: 0
  idMcshExmlgst: null: 0
  idMcshExmlgtr: idMcshExmlgst: 1
  idMcshExmlstr: idMcshExmlgst: 1
  idMcshExmlsdvBdr: idMcshExmlgst: 1
  idMeta: null: 0
  idSupport: null: 0
  for (let i = 0; i < aoRaw_sect.length; i++) {
    console.log(aoRaw_sect[i].sNameId+": "+aoRaw_sect[i].sIdWhole_elmt+": "+aoRaw_sect[i].nDepth);
  }
  // raw-section in all its text
  console.log(aoRaw_sect.find(oObj => oObj.sNameId === "idMcshExmlatt005").sRawHtml);
  */
  // overview-section is the-text of heading and Mcsh-paragraphs only.
  // console.log( fFindSect_overview(aoRaw_sect.find(oObj => oObj.sNameId === "idOverview").sRawHtml));

  // iterate over raw-section-objects
  for (const oRaw_sect of aoRaw_sect) {
    // Skip infrastructure sections
    if (oRaw_sect.sNameId === 'idMeta' || oRaw_sect.sNameId === 'idHeader'
       || oRaw_sect.sNameId === 'idSupport' || oRaw_sect.sNameId === 'idComment') continue;

    if (oRaw_sect.sNameId === 'idOverview') {
      // find its names, para-data, para-cnpt

      // Collect para-cnpt from this section's overview
      sOverview = fFindSect_overview(oRaw_sect.sRawHtml);
      aoTitlePara = fParseOverview(sOverview, 'idOverview');

      // find name-para
      const sParaName = fFindPara_from_title(aoTitlePara, 'name');
      if (sParaName !== null) {
        // Name entries — from the name:: para only
        oNameLago = fReadMcsLago_names(sParaName);
        const sNameFormal = oNameLago?.oLagoEngl?.sNameFormal ?? '';
      } else console.log("error: no name-para");

      continue;
    }

    // Parse sect-cnpt candidate
    const oSect = fReadMcshRaw_sect(oRaw_sect)
    if ( oSect.sType === 'cnptSect') {
      oFileIdRelaCnpt[oSect.sNameIdRela] = oSect;
    }
  }

  return {
    sType: 'cnptFile',
    sNameIdAbso,
    sNameIdRela,
    sNameFile: oPath.basename(sNameIdRela),
    sNameDir: oPath.basename(oPath.dirname(sNameIdRela)),
    sNameTitle,
    sVersion,
    sError: null,
    oNameLago,
    sOverview,
    aoRaw_sect,
    oFileIdRelaCnpt
  };
}

/**
 * DOING: 
 * INPUT:
 * OUTPUT:
 */
function fIsDoing(sLinkIn) {
}

/**
 * DOING: 
 * INPUT:
 * OUTPUT:
 */
function fIsRelation(sLinkIn) {
}


// ============================================================
/** 
 * DOING: strip all HTML-tags, decode basic entities, collapse whitespace.
 *   <br>-tags are converted to \n FIRST so that name-entry lines stay separate.
 */
function fStripTags(sHtmlIn) {
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
function fExtractId(sHtmlIn) {
  const rId = /\bid="([^"]+)"/g;
  const oSetIds = new Set();
  let aIdMatch;
  while ((aIdMatch = rId.exec(sHtmlIn)) !== null) oSetIds.add(aIdMatch[1]);
  return oSetIds;
}

/**
 * INPUT: a block of HTML content.
 * OUTPUT: array of all unique href=values, no clsHide links.
 */
function fExtractContentHrefs(sHtmlIn) {
  // Remove clsHide anchors entirely first
  const sCleaned = sHtmlIn.replace(/<a\s+class="clsHide"[^>]*>[\s\S]*?<\/a>/g, '');
  const rHref = /href="([^"]+)"/g;
  const aLinks = [];
  let aHrefMatch;
  while ((aHrefMatch = rHref.exec(sCleaned)) !== null) aLinks.push(aHrefMatch[1]);
  return [...new Set(aLinks)]; // array unique hrefs only
}

/**
 * INPUT: raw HTML and extract every <section> block with its nesting info.
 * OUTPUT: array of raw-sect { sNameId, sRawHtml, nDepth, sIdWhole_elmt } in document order,
 * ordered from outermost to innermost (i.e. whole appears before its parts).
 */
function fSplit_sections(sHtmlIn) {
  const aoRaw_sect = [];
  const aoStart_sect = []; // { sNameId, start, nDepth }
  const rTagSect = /<\/?section\b([^>]*)>/gi;
  let aTagSectMatch;

  while ((aTagSectMatch = rTagSect.exec(sHtmlIn)) !== null) {
    const sTagSect = aTagSectMatch[0];
    const sTagSectAtts = aTagSectMatch[1] ?? '';
    const bTagSecClose = sTagSect.startsWith('</');

    if (!bTagSecClose) {
      const aIdMatch = sTagSectAtts.match(/\bid="([^"]+)"/);

      aoStart_sect.push({
        sNameId: aIdMatch ? aIdMatch[1] : null,
        nStart: aTagSectMatch.index,
        nDepth: aoStart_sect.length
      });
    } else {
      const oSectStartLast = aoStart_sect.pop();
      if (!oSectStartLast) continue;

      const sIdWhole_elmt =
        aoStart_sect.length > 0
          ? aoStart_sect[aoStart_sect.length - 1].sNameId
          : null;

      aoRaw_sect.push({
        sNameId: oSectStartLast.sNameId,
        sRawHtml: sHtmlIn.slice(oSectStartLast.nStart, aTagSectMatch.index + sTagSect.length),
        nDepth: oSectStartLast.nDepth,
        sIdWhole_elmt,
        nStart: oSectStartLast.nStart
      });
    }
  }

  return fReverseOnlyNestedSections(aoRaw_sect);
}

function fReverseOnlyNestedSections(aoRaw_sect) {
  const aOut = [];
  let aGroup = [];

  function fFlushGroup() {
    if (aGroup.length === 0) return;

    const bHasNested = aGroup.some(o => o.nDepth > 0);

    if (bHasNested) {
      aGroup.sort((a, b) => {
        return a.nDepth - b.nDepth || a.nStart - b.nStart;
      });
    }

    aOut.push(...aGroup);
    aGroup = [];
  }

  for (const oSection of aoRaw_sect) {
    aGroup.push(oSection);

    // In your current closing-order output, a top-level section closes last.
    // So nDepth 0 means the current nested group is complete.
    if (oSection.nDepth === 0) {
      fFlushGroup();
    }
  }

  fFlushGroup();

  return aOut;
}


/**
 * DOING: finds only the-overview-HTML of a-section — i.e. with all DIRECT part <section>...</section> blocks
 *   replaced by empty strings.
 *   This is done iteratively (not with a greedy regex) to handle nesting correctly.
 * INPUT: the-sRawHtml of a-section.
 * OUTPUT: a-string of overview heading and para-data only.
 */
function fFindSect_overview(sRawSect) {
  // We strip sections that are direct parts only.
  // Strategy: track nDepth manually and blank out nested sections.
  const aResult = [];
  let nDepth = 0;
  let bIn_own_sect = false; // have we passed the opening tag of rawHtml itself?
  const sTagSect = /<\/?section\b[^>]*>/gi;
  let nLast = 0;
  let aSectTagMatch;

  // The rawHtml starts with the opening <section> of the section itself.
  // nDepth 0 = inside this section's own content
  // nDepth 1 = inside a direct child <section>
  // We want to include text at nDepth 0, exclude nDepth >= 1.

  sTagSect.lastIndex = 0;
  while ((aSectTagMatch = sTagSect.exec(sRawSect)) !== null) {
    const sSectTag = aSectTagMatch[0];
    const bIs_close = sSectTag.startsWith('</');

    if (!bIn_own_sect) {
      // First tag is the opening of the section itself — skip it
      bIn_own_sect = true;
      nLast = aSectTagMatch.index + sSectTag.length;
      continue;
    }

    if (!bIs_close) {
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
        nLast = aSectTagMatch.index + sSectTag.length;
      } else if (nDepth < 0) {
        // Closing our own section
        aResult.push(sRawSect.slice(nLast, aSectTagMatch.index));
        nLast = aSectTagMatch.index + sSectTag.length;
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


/**
 * DOING: find the-McsLago-names: " <br>* McsEngl.McshExml'att001-attribute, {2026-04-23}"
 * INPUT: the-text of a-Mcsh_para, one name per line.
 * OUTPUT: an object of lagoName-objects
 *   { oLagoEngl: {sNameFormal, sNameInformal, aNoun, aCase, aAdje, aAdve, aVerb, aConj} }
 */
function fReadMcsLago_names(sTextIn) {
  // ── 1. read the-name-lines ────────────────────────────────────────────────
  const aoName = []; // { sLago, sName, sNameFormal, sNameTransl, sPos } in document order
  for (const sLine of String(sTextIn ?? '').split('\n')) {
    // a-name-line: " <br>* McsEngl.name!-inflection!~PoS!=translation, {2026-04-23}"
    const aNameMatch = sLine.match(/^\s*<br>\*\s*Mcs([A-Z][a-z]{3})\.([^\n,]+),/);
    if (!aNameMatch) continue;

    const sLago = aNameMatch[1];                      // Engl, Elln, Zhon, ...
    const sRest = aNameMatch[2].trim();               // name + its !-notations
    const sName = sRest.split('!')[0].trim();         // the-name itself
    if (sName === '' || fIsName_id(sName)) continue;

    // !-notations: "!⇒main-name", "!=translation", "!~PoS", "!-inflection|!extra-info"
    let sNameFormal = '', sNameTransl = '', sPos = '';
    const rNotation = /!(⇒|=|~)?([^!]*)/g;
    let aNotationMatch;
    while ((aNotationMatch = rNotation.exec(sRest)) !== null) {
      const sMark  = aNotationMatch[1] ?? '';
      const sValue = aNotationMatch[2].trim();
      if      (sMark === '⇒' && !sNameFormal) sNameFormal   = sValue;
      else if (sMark === '=' && !sNameTransl)  sNameTransl  = sValue;
      else if (sMark === '~' && !sPos)         sPos         = sValue;
    }
    aoName.push({ sLago, sName, sNameFormal, sNameTransl, sPos });
  }

  // ── 2. group the-names per McsLago and per PoS ────────────────────────────
  const oLagoname = {};
  for (const oName of aoName) {
    const sLagokey = 'oLago' + oName.sLago;
    if (!oLagoname[sLagokey]) oLagoname[sLagokey] = fNewLago_name();
    const aPos = oLagoname[sLagokey][fFindPos_key(oName.sPos)];
    if (!aPos.includes(oName.sName)) aPos.push(oName.sName);
  }

  // ── 3. find the-formal and informal main-name of each McsLago ─────────────
  for (const sLagokey of Object.keys(oLagoname)) {
    const oLago = oLagoname[sLagokey];
    const aoLago_name = aoName.filter(o => 'oLago' + o.sLago === sLagokey);

    // formal-name: the-text after '!⇒', the-most-used one when they differ
    oLago.sNameFormal = fFindName_frequent(aoLago_name.filter(o => o.sNameFormal).map(o => o.sNameFormal));
    if (!oLago.sNameFormal) {
      // no synonym points to a-main-name: the-name of a "name!=translation"-line
      const oFormal = aoLago_name.find(o => o.sNameTransl && !o.sPos);
      oLago.sNameFormal = oFormal ? oFormal.sName : aoLago_name[0].sName;
    }

    // informal-name: the-text after '!=' of the-formal-name
    const oInformal = aoLago_name.find(o =>
      o.sName === oLago.sNameFormal && o.sNameTransl && !o.sPos && !fIsName_id(o.sNameTransl));
    oLago.sNameInformal = oInformal ? oInformal.sNameTransl : '';
  }

  return oLagoname;
}

/**
 * OUTPUT: an-empty lagoName-object.
 */
function fNewLago_name() {
  return {
    sNameFormal: '',
    sNameInformal: '',
    aNoun: [], aCase: [], aAdje: [], aAdve: [], aVerb: [], aConj: []
  };
}

/**
 * DOING: maps the-text after '!~' (adjeElln, verbEnglC, conjZhon, ...) to a-lagoName-key.
 * OUTPUT: 'aNoun' | 'aCase' | 'aAdje' | 'aAdve' | 'aVerb' | 'aConj'.
 *   names WITHOUT '!~case|adje|adve|verb|conj' are nouns.
 */
function fFindPos_key(sPosIn) {
  switch (sPosIn.slice(0, 4).toLowerCase()) {
    case 'case': return 'aCase';
    case 'adje': return 'aAdje';
    case 'adve': return 'aAdve';
    case 'verb': return 'aVerb';
    case 'conj': return 'aConj';
    default:     return 'aNoun';
  }
}

/**
 * DOING: an-id-name (dirCor/McshCor000015.last.html, McsCor000015) is-NOT a-McsLago-name.
 */
function fIsName_id(sNameIn) {
  return /\.last\.html/.test(sNameIn) || /^Mcs[A-Z][A-Za-z]*\d{6}$/.test(sNameIn);
}

/**
 * OUTPUT: the-most-frequent string of an-array, the-first one on ties, '' on empty.
 */
function fFindName_frequent(aNameIn) {
  const oCount = {};
  let sNameTop = '', nCountTop = 0;
  for (const sName of aNameIn) {
    oCount[sName] = (oCount[sName] ?? 0) + 1;
    if (oCount[sName] > nCountTop) { nCountTop = oCount[sName]; sNameTop = sName; }
  }
  return sNameTop;
}

/**
 * INPUT: one Raw-sect-object.
 * OUTPUT: one sect-cnpt or 'sect'-object.
 * We only parse Mcsh-para that are DIRECTLY part in this section, not inside
 * nested part <section> elements, to avoid double-counting.
 * {
 *   sType,          // 'cnptSect',
 *   sNameIdAbso,    // http://localhost/dirMcsh/dirCor/McshCor000015.last.html#idSection
 *   sNameIdRela,    // dirCor/McshCor000015.last.html#idSection
 *   sNameTitle,     // text from <h?>title::
 *   sNameFormal,    // the English formal-name
 *   oNameLago,      // {oNameEngl, oNameZhon, ...}
 *   sCreation,      // from × Mcsh-creation:
 *   sOverview,      // h, p, div direct children
 *   aoTitlePara,    // [{sNameTitle, sPara}]
 *   sIdWhole_elmt,  // the id of whole_element
 *   sAttrGeneric,   // generic-concept of concept
 *   sAttrWhole,     // whole-concept of concept
 *   sAttrParent,    // whole-concept of concept
 *   aAttr,          // attributes of concept
 * }
 */
function fReadMcshRaw_sect({ sNameId, sRawHtml, nDepth, sIdWhole_elmt }) {
  //console.log(`   Parsing section: id=${sNameId} nDepth=${nDepth} sIdWhole_elmt=${sIdWhole_elmt}`);
  const sOverview = fFindSect_overview(sRawHtml);  // "<h? id=... <p ...</a></p>"

  // Heading: first <h1|h2|h3|..|h9> in overview
  const aHeadMatch = sOverview.match(/<h([1-9])\b[^>]*>([\s\S]*?)<\/h\1>/i);
  const sNameTitle  = aHeadMatch ? fStripTags(aHeadMatch[2]) : '';
  const nHeadingLevel = aHeadMatch ? parseInt(aHeadMatch[1]) : 1;
  const sNameIdAbso = sProjectPath + sFileNameRela + '#' + sNameId;
  const sNameIdRela = sFileNameRela + '#' + sNameId;
  console.log(sNameIdRela)
  let oNameLago = {};

  // All direct-child Mcsh-para
  const aoTitlePara = fParseOverview(sOverview, sNameId);

  // find name-para
  const sParaName = fFindPara_from_title(aoTitlePara, 'name');
  if (sParaName !== null) {
    // Name entries — from the name:: para only
    oNameLago = fReadMcsLago_names(sParaName);
    const sNameFormal = oNameLago?.oLagoEngl?.sNameFormal ?? '';
  } else console.log("error: no name-para");

  // if aNames.length > 0, this is a sect-cnpt
  if ((oNameLago != null && Object.keys(oNameLago).length > 0) &&
      sNameId !== 'idOverview') {
    return {
      sType: 'cnptSect',
      sNameIdAbso,
      sNameIdRela,
      sNameTitle,
      oNameLago,
      nHeadingLevel,
      nDepth,
      sIdWhole_elmt,
      aoTitlePara,
    }
  } else {
    return {
      sType: 'sect',
      sNameId,
      sRawHtml,
      nDepth,
      sIdWhole_elmt
    }
  }
}

/**
 * DOING: finds from an-array of objects [{sNameTitle, sPara}], the-para with given title.
 * OUTPUT: the-para-string.
 */
function fFindPara_from_title(aoTitleParaIn, sNameIn) {
  let sPara = null;
  for (const oP of aoTitleParaIn) {
    if (oP.sNameTitle === sNameIn) {
      if (sPara !== null) console.log("error: more than one para with title: " + oP.sNameTitle);
      sPara = oP.sPara;
    }
  }
  return sPara;
}

/**
 * DOING: parse overview of section.
 * OUTPUT: returns array of objects title-para [{sNameTitle, sPara}]
 *    also if para is concept, add it to oFileIdRelaCnpt.
 */
function fParseOverview(sOverviewIn, sNameId) {
  const aoTitlePara = [];
  const rP = /<p\b[^>]*>[\s\S]*?<\/p>/gi;
  // Mcsh-para could-be and div with p|table|ol|ul members
  const rDiv = /<div\b[^>]*>[\s\S]*?<\/div>/gi;
  let aParaMatch;
  while ((aParaMatch = rP.exec(sOverviewIn)) !== null) {
    const oP = fReadParaP(aParaMatch[0], sNameId);
    aoTitlePara.push({sNameTitle: oP.sNameTitle, sPara: oP.sPara});
    // if oP is concept add oFileIdRelaCnpt
    if (oP.sType === 'cnptPara') {
      oFileIdRelaCnpt[oP.sNameIdRela] = oP;
    }
  }
  while ((aParaMatch = rDiv.exec(sOverviewIn)) !== null) {
    const oP = fReadParaDiv(aParaMatch[0], sNameId);
    aoTitlePara.push({sNameTitle: oP.sNameTitle, sPara: oP.sPara});
    if (oP.sType === 'cnptPara') {
      oFileIdRelaCnpt[oP.sNameIdRela] = oP;
    }
  }

  return aoTitlePara;
}

/**
 * DOING: Parse a single <p ...>...</p> HTML string.
 * OUTPUT: one object para:
 * {
 *   sType,          // 'cnptPara',
 *   sSubtype,          // 'p',
 *   sNameIdAbso,    // http://localhost/dirMcsh/dirCor/McshCor000015.last.html#idPara
 *   sNameIdRela,    // dirCor/McshCor000015.last.html#idPara
 *   sNameTitle,     // text from <p>title::
 *   sNameFormal,    // the English formal-name
 *   oNameLago,     // contains oNameEngl, oNameZhon, ...
 *   sCreation,      // from × Mcsh-creation:
 *   sPara,          // p element 
 *   sIdWhole_elmt,  // IdRela of whole-section
 *   sAttrWhole,     // whole-concept of concept
 *   sAttrGeneric,   // generic-concept of concept
 *   sAttrParent,    // whole-concept of concept
 *   aAttr,          // attributes of concept
 * }
 */
function fReadParaP(sPHtmlIn, sIdWhole_elmtIn) {
  const aIdTitleMatch = sPHtmlIn.match(/<p\b[^>]*\bid="([^"]+)"[^>]*>([^:\n]+)::/);
  const sNameId = aIdTitleMatch ? aIdTitleMatch[1] : null;
  // console.log(`Parsing paragraph id=${sNameId}`);
  const sNameIdAbso = sProjectPath + sFileNameRela + '#' + sNameId;
  const sNameIdRela = sFileNameRela + '#' + sNameId;
  const sNameTitle = aIdTitleMatch ? aIdTitleMatch[2].trim() : null;
  const sPara = sPHtmlIn;
  // console.log(sNameIdAbso)
  // console.log(sNameTitle)

  // Name entries — parse regardless of sNameTitle, so para-concepts can be detected
  const oNameLago = fReadMcsLago_names(sPHtmlIn);
  const sNameFormal = oNameLago?.oLagoEngl?.sNameFormal ?? '';

  // A para-concept: has an id AND has McsLago-names AND is NOT a name::-para
  // (name::-para belong to the sect-cnpt, not a separate concept)
  const bIsCnptPara =
    sNameId !== null &&
    (oNameLago != null && Object.keys(oNameLago).length > 0) &&
    sNameTitle !== 'name';

  if (bIsCnptPara) {
    return {
      sType: 'cnptPara',
      sSubtype: 'p',
      sNameIdAbso,
      sNameIdRela,
      sNameTitle,
      sNameFormal,
      oNameLago,
      sPara,
      sIdWhole_elmt: sIdWhole_elmtIn
    };
  } else {
    return {
      sType: 'paraP',
      sNameTitle,
      sPara
    };
  }
}

/**
 * DOING: Parse a single <div ...>...</div> HTML string.
 * OUTPUT: Returns one object paragraph:
 * {
 *   sType,          // 'cnptPara',
 *   sSubtype,       // 'div',
 *   sNameId,        // value of id= attribute, or null
 *   sNameIdAbso,    // http://localhost/dirMcsh/dirCor/McshCor000015.last.html#idPara
 *   sNameIdRela,    // dirCor/McshCor000015.last.html#idPara
 *   sNameTitle,     // text from <p>title::
 *   sNameFormal,    // the English formal-name
 *   sCreation,      // from × Mcsh-creation:
 *   sPara_overview, // div element
 *   oNameLago,     // contains oNameEngl, oNameZhon, ...
 *   sAttrWhole,     // whole-concept of concept
 *   sAttrGeneric,   // generic-concept of concept
 *   sAttrParent,    // whole-concept of concept
 *   aAttr,          // attributes of concept
 * }
 */
function fReadParaDiv(sDivHtmlIn, sIdWhole_elmtIn) {
  const aIdTitleMatch = sDivHtmlIn.match(/<div\b[^>]*\bid="([^"]+)"[^>]*>\n    <p>([^:\n]+)::/);
  const sNameId = aIdTitleMatch ? aIdTitleMatch[1] : null;
  // console.log(`Parsing paragraph id=${sNameId}`);
  const sNameIdAbso = sProjectPath + sFileNameRela + '#' + sNameId;
  const sNameIdRela = sFileNameRela + '#' + sNameId;
  const sNameTitle = aIdTitleMatch ? aIdTitleMatch[2].trim() : null;
  const sPara = sDivHtmlIn;
  console.log(sNameIdRela)
  console.log(sNameTitle)

  // Name entries — parse regardless of sNameTitle, so para-concepts can be detected
  const oNameLago = fReadMcsLago_names(sDivHtmlIn);
  const sNameFormal = oNameLago?.oLagoEngl?.sNameFormal ?? '';

  // A para-concept: has an id AND has McsLago-names AND is NOT a name::-para
  // (name::-para belong to the sect-cnpt, not a separate concept)
  const bIsCnptPara =
    sNameId !== null &&
    (oNameLago != null && Object.keys(oNameLago).length > 0) &&
    sNameTitle !== 'name';

  if (bIsCnptPara) {
    return {
      sType: 'cnptPara',
      sSubtype: 'div',
      sNameIdAbso,
      sNameIdRela,
      sNameTitle,
      sNameFormal,
      oNameLago,
      sPara,
      sIdWhole_elmt: sIdWhole_elmtIn
    };
  } else {
    return {
      sType: 'paraDiv',
      sNameTitle,
      sPara
    };
  }
}

// =========================================================== test:
// we import mConcept.js in McsCor15
// we see on console its output
console.log(sFileNameRela) // dirCor/McshCor000015.last.html
//const oCor15  = fReadMcshFile(sFileNameRela)
//fReadParaP('<p id="idPara">name::</p>')
//fReadParaDiv('<div id="idParaDiv">\n    <p>description::</p>')
//fReadMcshRaw_sect({ sNameId:'idSect',
                // sRawHtml: '<section id="idSection">\n  <h1 id="idSectionH1>sect-title\n    <a class="clsHide"></a>',
                // nDepth: 0,
                // sIdWhole_elmt: 'sIdWhole_elmt' })
const oName = fReadMcsLago_names(" <br>* McsEngl.of!~conjEngl!⇒rltnAttribute_then_entity, ")
console.log(oName.oLagoEngl.aConj[0])


export {
  fIsDoing,
  fIsRelation,
  fReadMcshFile,
  fReadMcsLago_names,
}
