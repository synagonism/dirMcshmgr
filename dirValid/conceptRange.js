/**
 * conceptRange.js — the-lines of ONE concept of a-Mcsh file, for validate-concept:
 *   validatorMcsh.js --id and createMcsh.mjs --id keep only what is inside them.
 *
 * fFindConceptRange(sRawIn, sIdIn) → { nLineFrom, nLineTo, oSetId } (1-based, inclusive;
 *   oSetId: every id inside), or null = the-whole file:
 *   - null: sIdIn '' | 'idOverview' (the-file-concept), or no element with that id;
 *   - <section id=X>: that section, to its matching </section>;
 *   - a-heading <hN id=XHN> (or any other element): its enclosing section;
 *   - a-<p> | <div> para-concept (a-title "Y::" that is NOT a-section's own: name, description,
 *     X-tree, addressWpg, attribute, example ...; and McsLago names "<br>* McshXxxx."):
 *     that paragraph; any other para: its enclosing section.
 */

const aVersion = [
  'conceptRange.js.0-1-0.2026-11-17: creation, fFindConceptRange'
];

const rName = /<br>\*\s*Mcsh[A-Z][a-z]{3}\./;
// the-paragraphs OF a-section (its attributes), never a-para-concept
const rTitleOfSect = /^(\[?name|description.*|.*-tree|addressWpg|attribute|webpage-versions|footer|SEARCH|example|definition)$/;

/** OUTPUT: the-0-based index of the-line that closes the-element sTagIn opened at nOpenIn (nesting counted), or -1. */
function fFindClose(aLineIn, nOpenIn, sTagIn) {
  const rOpen = new RegExp(`<${sTagIn}\\b`, 'g');
  const rClose = new RegExp(`</${sTagIn}>`, 'g');
  let nDepth = 0;
  for (let nL = nOpenIn; nL < aLineIn.length; nL++) {
    // the-open line: only from the-element itself on
    const sLine = nL === nOpenIn ? aLineIn[nL].slice(aLineIn[nL].search(new RegExp(`<${sTagIn}\\b`))) : aLineIn[nL];
    nDepth += (sLine.match(rOpen) ?? []).length;
    nDepth -= (sLine.match(rClose) ?? []).length;
    if (nDepth <= 0) return nL;
  }
  return -1;
}

/** OUTPUT: the-0-based line of the-<section> that encloses line nLineIn, or -1. */
function fFindSectionOpen(aLineIn, nLineIn) {
  let nDepth = 0;
  for (let nL = nLineIn; nL >= 0; nL--) {
    const sLine = aLineIn[nL];
    nDepth += (sLine.match(/<\/section>/g) ?? []).length;
    const nOpen = (sLine.match(/<section\b/g) ?? []).length;
    if (nOpen > nDepth) return nL;
    nDepth -= nOpen;
  }
  return -1;
}

function fFindConceptRange(sRawIn, sIdIn) {
  const sId = String(sIdIn ?? '').trim();
  if (!sId || sId === 'idOverview') return null;
  const aLine = String(sRawIn ?? '').split('\n');
  const sIdEsc = sId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rId = new RegExp(`<(\\w+)\\b[^>]*\\bid="${sIdEsc}"`);
  let nAt = -1, sTag = '';
  for (let nL = 0; nL < aLine.length; nL++) {
    const aM = aLine[nL].match(rId);
    if (aM) { nAt = nL; sTag = aM[1].toLowerCase(); break; }
  }
  if (nAt === -1) return null;

  let nFrom = -1, nTo = -1;
  if (sTag === 'p' || sTag === 'div') {
    const nClose = fFindClose(aLine, nAt, sTag);
    const sPara = nClose === -1 ? '' : aLine.slice(nAt, nClose + 1).join('\n');
    const aTitle = sPara.match(new RegExp(`<${sTag}\\b[^>]*\\bid="${sIdEsc}"[^>]*>([^:\\n<]+)::`));
    const bCnptPara = !!aTitle && !rTitleOfSect.test(aTitle[1].trim()) && rName.test(sPara);
    if (bCnptPara) { nFrom = nAt; nTo = nClose; }
  }
  if (nFrom === -1) {
    const nOpen = sTag === 'section' ? nAt : fFindSectionOpen(aLine, nAt);
    if (nOpen === -1) return null;
    const nClose = fFindClose(aLine, nOpen, 'section');
    if (nClose === -1) return null;
    // the-file-concept's own section
    if (/\bid="idOverview"/.test(aLine[nOpen])) return null;
    nFrom = nOpen; nTo = nClose;
  }
  const oSetId = new Set();
  for (let nL = nFrom; nL <= nTo; nL++) for (const aM of aLine[nL].matchAll(/\bid="([^"]+)"/g)) oSetId.add(aM[1]);
  return { nLineFrom: nFrom + 1, nLineTo: nTo + 1, oSetId };
}

export { fFindConceptRange, aVersion as aVersionConceptRange };
