'use strict';
/*
 * mModel.js — maps a WYSIWYG edit reported by the browser bridge back to an exact
 * byte range in the source file.
 *
 * The rendered page keeps the source `id`s and the source text-node order, so the
 * bridge can address each editable text run as (id, ordinal): the ordinal is the
 * index of that text run among all editable runs sharing the same nearest
 * id-bearing ancestor. We reproduce the SAME walk here (parse5, same whitespace
 * rule) so ordinal N here is the exact byte range the bridge's ordinal N means.
 *
 * The write itself is a plain byte-range replacement; canonical re-indentation of
 * the whole document happens separately, on Save, in mFormat.js.
 */

const parse5 = require('parse5');

const oSetRawTextParents = new Set(['script', 'style', 'noscript', 'title', 'textarea']);
const rWsPlainLead = /^[\n\r\t ]*/;
const rWsPlainTrail = /[\n\r\t ]*$/;

/**
 * Editable text cores grouped by nearest id-ancestor, in document order.
 * @param {string} text
 * @returns {{ [id:string]: Array<{s:number,e:number,dec:string}> }}
 */
function fCollectCoresById(text) {
  const oDoc = parse5.parse(text, { sourceCodeLocationInfo: true });
  /** @type {{ [id:string]: Array<{s:number,e:number,dec:string}> }} */
  const oById = {};

  (function fWalk(node, parentName, ancId) {
    const oIdAttr = (node.attrs || []).find((a) => a.name === 'id');
    const sCurId = oIdAttr ? oIdAttr.value : ancId;
    if (node.nodeName === '#text') {
      if (oSetRawTextParents.has(parentName) || !ancId) return;
      const oLoc = node.sourceCodeLocation;
      if (!oLoc) return;
      const sRaw = text.slice(oLoc.startOffset, oLoc.endOffset);
      const nLead = (sRaw.match(rWsPlainLead) || [''])[0].length;
      const nTrail = (sRaw.match(rWsPlainTrail) || [''])[0].length;
      const s = oLoc.startOffset + nLead;
      const e = oLoc.endOffset - nTrail;
      if (e <= s) return;
      const sDec = String(node.value).replace(rWsPlainLead, '').replace(rWsPlainTrail, '');
      (oById[ancId] = oById[ancId] || []).push({ s, e, dec: sDec });
      return;
    }
    const sName = node.tagName || node.nodeName;
    for (const k of node.childNodes || []) fWalk(k, sName, sCurId);
  })(oDoc, '#document', null);

  return oById;
}

/** Set of ids present in the source (so the bridge only trusts real ids). */
function fCollectIds(text) {
  return Object.keys(fCollectCoresById(text));
}

/** Flatten cores to a document-order list of {id, ord, s, e}. */
function fFlattenCores(text) {
  const oById = fCollectCoresById(text);
  const aList = [];
  for (const sId of Object.keys(oById)) oById[sId].forEach((c, ord) => aList.push({ id: sId, ord, s: c.s, e: c.e }));
  aList.sort((a, b) => a.s - b.s);
  return aList;
}

/**
 * Which editable core a source byte `offset` falls in (or nearest), for cursor
 * sync. Pass a pre-flattened `list` (from fFlattenCores) to avoid re-parsing.
 * @returns {{id:string, ord:number} | null}
 */
function fCoreAtOffset(list, offset) {
  if (!list || !list.length) return null;
  let oBest = null, nBestDist = Infinity;
  for (const c of list) {
    if (offset >= c.s && offset <= c.e) return { id: c.id, ord: c.ord };
    const d = Math.min(Math.abs(offset - c.s), Math.abs(offset - c.e));
    if (d < nBestDist) { nBestDist = d; oBest = c; }
  }
  return oBest ? { id: oBest.id, ord: oBest.ord } : null;
}

/**
 * Locate the byte range for an edit message {id, ord, oldDec?}. Returns null if
 * the pairing can't be verified (so the caller can refuse and reload).
 * @param {string} text
 * @param {{id:string, ord:number, oldDec?:string}} msg
 */
function fLocate(text, msg) {
  const aArr = fCollectCoresById(text)[msg.id];
  const oEntry = aArr && aArr[msg.ord | 0];
  if (!oEntry) return null;
  if (msg.oldDec != null && oEntry.dec !== msg.oldDec) return null;
  return oEntry;
}

/**
 * Escape a plain-text value for writing back as an HTML text node. Only
 * HTML-significant characters are touched; ordinary spaces stay literal (so we
 * don't churn bytes or break line wrapping). A real non-breaking space (U+00A0),
 * which the browser hands back from `&nbsp;`, is re-encoded to the entity to
 * match the rest of the file's style.
 */
function fEscapeText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split(String.fromCharCode(160)).join('&nbsp;');   // only a real NBSP (U+00A0) → entity; ordinary spaces stay literal
}

// ---------------------------------------------------------------------------
// Structure editing: add / delete a `<br>` marker-line inside a block element.
// Pure functions returning surgical {insertAt} / {removeS,removeE} edits. The
// whole file is canonicalised on Save anyway, so these only need to be correct,
// not perfectly indented.
// ---------------------------------------------------------------------------

const oMarkerRe = /^([×·*•∇⇔])[ \t]?/;

/** Line context around `offset`: the text node, its block, and neighbouring <br>. */
function fGetLineContext(text, offset) {
  const oDoc = parse5.parse(text, { sourceCodeLocationInfo: true });
  let oFound = null;
  (function fWalk(node, parent) {
    if (oFound) return;
    if (node.nodeName === '#text') {
      const oLoc = node.sourceCodeLocation;
      if (oLoc && offset >= oLoc.startOffset && offset <= oLoc.endOffset && parent) oFound = { node, parent };
      return;
    }
    for (const k of node.childNodes || []) fWalk(k, node);
  })(oDoc, null);
  if (!oFound) return null;

  const { node: oNode, parent: oParent } = oFound;
  const oLoc = oNode.sourceCodeLocation;
  const sRaw = text.slice(oLoc.startOffset, oLoc.endOffset);
  const nLead = (sRaw.match(rWsPlainLead) || [''])[0].length;
  const nTrail = (sRaw.match(rWsPlainTrail) || [''])[0].length;
  const nCoreS = oLoc.startOffset + nLead;
  const nCoreE = oLoc.endOffset - nTrail;
  const sSep = text.slice(nCoreE, oLoc.endOffset); // trailing "\n    " separator
  const aMk = text.slice(nCoreS, oLoc.endOffset).match(oMarkerRe);

  const aKids = oParent.childNodes || [];
  const nIdx = aKids.indexOf(oNode);
  const fBrLoc = (n) => (n && n.tagName === 'br' && n.sourceCodeLocation)
    ? { s: n.sourceCodeLocation.startOffset, e: n.sourceCodeLocation.endOffset } : null;
  const oPrevBr = fBrLoc(aKids[nIdx - 1]);

  let oNextBr = null, nNextBoundary = null;
  for (let i = nIdx + 1; i < aKids.length; i++) {
    if (aKids[i].tagName === 'br') { oNextBr = fBrLoc(aKids[i]); nNextBoundary = oNextBr.s; break; }
  }
  if (nNextBoundary == null) {
    const oEt = oParent.sourceCodeLocation && oParent.sourceCodeLocation.endTag;
    let b = oEt ? oEt.startOffset : oLoc.endOffset;
    for (let i = nIdx + 1; i < aKids.length; i++) {
      if (aKids[i].sourceCodeLocation) { b = aKids[i].sourceCodeLocation.startOffset; break; }
    }
    nNextBoundary = b;
  }

  return { block: oParent, node: { s: oLoc.startOffset, e: oLoc.endOffset }, coreS: nCoreS, coreE: nCoreE, sep: sSep, marker: aMk ? aMk[1] : null, prevBr: oPrevBr, nextBr: oNextBr, nextBoundary: nNextBoundary };
}

/** Separator (`\n` + indentation) for a block, inferred from an existing line. */
function fInferSeparator(text, ctx) {
  if (/\n[ \t]*$/.test(ctx.sep)) return ctx.sep;
  const m = text.slice(ctx.block.sourceCodeLocation.startOffset, ctx.node.e).match(/\n([ \t]*)<br/i);
  return m ? '\n' + m[1] : '\n    ';
}

/** Insert a new `<br>` marker-line after the line at `offset`. */
function fBuildLineAfter(text, offset, placeholder) {
  const oCtx = fGetLineContext(text, offset);
  if (!oCtx) return null;
  const sSep = fInferSeparator(text, oCtx);
  const sMarker = oCtx.marker || '·';
  const sBody = placeholder == null ? 'new-line' : placeholder;
  return { insertAt: oCtx.coreE, text: `${sSep}<br>${sMarker} ${sBody}` };
}

/** Delete the `<br>` marker-line at `offset` (never the first/header line). */
function fBuildLineDelete(text, offset) {
  const oCtx = fGetLineContext(text, offset);
  if (!oCtx || !oCtx.prevBr) return null;
  return { removeS: oCtx.prevBr.s, removeE: oCtx.nextBoundary };
}

/** Byte offset of the START of the (id, ord) core, for structural ops. */
function fCoreStart(text, msg) {
  const oLoc = fLocate(text, msg);
  return oLoc ? oLoc.s : null;
}

module.exports = {
  fCollectCoresById, fCollectIds, fLocate, fEscapeText,
  fGetLineContext, fBuildLineAfter, fBuildLineDelete, fCoreStart,
  fFlattenCores, fCoreAtOffset,
};
