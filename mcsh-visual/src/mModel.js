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

/**
 * Is `sId` a sect-concept of `sText`: one <section id>, not a page-part, with a name:: para
 * in its own text (before its first child section).
 * @returns {{ sWhy: string, sNameFirst: string }} sWhy '' when it is; sNameFirst the
 *   first name of its name:: without `McshLago.`, '' when none.
 */
function fFindSectConcept(sText, sId) {
  if (!sId) return { sWhy: 'the address bar has no #id', sNameFirst: '' };
  if (['idOverview', 'idMeta', 'idSupport', 'idHeader'].includes(sId)) return { sWhy: '#' + sId + ' is not a sect-concept', sNameFirst: '' };
  const aLine = sText.split('\n');
  const aOpen = [];
  aLine.forEach((sLine, nL) => { if ((sLine.match(/<section\b[^>]*\bid="([^"]+)"/) || [])[1] === sId) aOpen.push(nL); });
  if (aOpen.length === 0) return { sWhy: '#' + sId + ' is not a section: it is not a sect-concept', sNameFirst: '' };
  if (aOpen.length > 1) return { sWhy: '#' + sId + ' occurs ' + aOpen.length + ' times as a section', sNameFirst: '' };
  for (let nL = aOpen[0] + 1; nL < aLine.length; nL++) {
    if (/<section\b|<\/section>/.test(aLine[nL])) break;
    if (!/^ *<p id="[^"]+">name::\s*$/.test(aLine[nL])) continue;
    const aName = (aLine[nL + 1] || '').match(/^\s*<br>\*\s*Mcsh[A-Z][a-z]{3}\.([^\n,]+),/);
    return { sWhy: '', sNameFirst: aName ? aName[1].trim() : '' };
  }
  return { sWhy: '#' + sId + ' has no name:: para: it is not a sect-concept', sNameFirst: '' };
}

/**
 * Informal and main name from a first name-line: `A!⇒B` → informal A, main B;
 * `A!=B` → main A, informal B; a plain name → nothing, the caller asks.
 * @returns {{ sInformal: string, sMain: string }}
 */
function fParseNameFirst(sName) {
  const fPart = (sMark) => {
    const nI = sName.indexOf(sMark);
    return nI < 0 ? '' : sName.slice(nI + sMark.length).split('!')[0].trim();
  };
  const sHead = sName.split('!')[0].trim();
  const sTo = fPart('!⇒');
  if (sTo) return { sInformal: sHead, sMain: sTo };
  const sEq = fPart('!=');
  if (sEq) return { sInformal: sEq, sMain: sHead };
  return { sInformal: '', sMain: '' };
}

/**
 * DOING: the-description:: and name:: paragraphs of the-section above nOffLineIn, to insert
 *   at the-start of that line (edit/insert/para/description-and-name, Ctrl+Alt+P P P).
 *   The-section: the-nearest `<section id="X">` before it; the-ids Xdsn, Xnam.
 *   The-first name, from the-heading of the-section: "x of y" → y'x ("_" for space and
 *   hyphen: "09_grammar of Ogsmlago" → Ogsmlago'09_grammar), else the-heading as is.
 * INPUT: sTextIn: the-file; nOffLineIn: the-offset of a-line start; sDateIn: YYYY-MM-DD.
 * OUTPUT: { nAt, sInsert, nCursor } (nCursor: in sInsert, after "<br>· "), or null (no section above).
 */
function fBuildParaDsnNam(sTextIn, nOffLineIn, sDateIn) {
  // the-ENCLOSING section: a-sub-section closed above the-line does not count
  const rSect = /<section\b[^>]*\bid="([^"]+)"|<\/section>/g;
  const aoOpen = [];
  for (const aM of sTextIn.slice(0, nOffLineIn).matchAll(rSect)) {
    if (aM[1] !== undefined) aoOpen.push(aM); else aoOpen.pop();
  }
  const aSect = aoOpen[aoOpen.length - 1];
  if (!aSect) return null;
  const sId = aSect[1];
  // the-heading: the-first <hN> after the-section tag, its first line
  const aHead = /<h([1-6])\b[^>]*>([^\n]*?)(?:\n|<\/h\1>)/.exec(sTextIn.slice(aSect.index));
  const sHead = aHead ? aHead[2].replace(/<[^>]*>/g, '').trim() : '';
  // a-formal-name has "_" for space and hyphen (MvrwName01_formal), NOT inside {…} (…)
  const fFormal = (sIn) => sIn.trim().split(/(\{[^}]*\}|\([^)]*\))/)
    .map((sPart, nI) => nI % 2 ? sPart : sPart.replace(/&#32;|\s+/g, '_').replace(/-/g, '_')).join('');
  const aOf = sHead.match(/^(.+?) of (\S.*)$/);
  const sName = aOf ? fFormal(aOf[2]) + "'" + fFormal(aOf[1]) : sHead;
  const sDsn = `  <p id="${sId}dsn">description::\n` +
    `    <br>× Mcsh-creation: {${sDateIn}}\n` +
    `    <br>· `;
  const sInsert = sDsn + '\n' +
    `    <a class="clsHide" href="#${sId}dsn"></a></p>\n` +
    `  <p id="${sId}nam">name::\n` +
    `    <br>* McshEngl.${sName},\n` +
    `    <a class="clsHide" href="#${sId}nam"></a></p>\n`;
  return { nAt: nOffLineIn, sInsert, nCursor: sDsn.length };
}

// the-3 tree sections of a-concept X with main-name M (edit/insert/sect/tree-…); as the-worldview's
const ooTreeKind = {
  gs: { sSect: 'gstr', sTitle: 'GENERIC-SPECIFIC-TREE', sName: 'generic_specific_tree', aoPara: [
    { sId: 'gntr', sLabel: 'generic-tree', sFirst: ':generic', aRest: ['* ...entity:generic,'] },
    { sId: 'sptr', sLabel: 'specific-tree', sFirst: '.specific', aRest: [] }] },
  wp: { sSect: 'wptr', sTitle: 'WHOLE-PART-TREE', sName: 'whole_part_tree', aoPara: [
    { sId: 'wltr', sLabel: 'whole-tree', sFirst: '//whole', aRest: ['* ...sympan//whole,'] },
    { sId: 'prtr', sLabel: 'part-tree', sFirst: '/part', aRest: [] }] },
  pc: { sSect: 'pctr', sTitle: 'PARENT-CHILD-TREE', sName: 'parent_child_tree', aoPara: [
    { sId: 'pntr', sLabel: 'parent-tree', sFirst: ';;parent', aRest: [] },
    { sId: 'chtr', sLabel: 'child-tree', sFirst: ';child', aRest: [] }] }
};

/** OUTPUT: the-index of the-</section> that closes the-<section at nOpenIn, or -1. */
function fFindSectClose(sTextIn, nOpenIn) {
  const rTag = /<section\b|<\/section>/g;
  rTag.lastIndex = nOpenIn;
  let nDepth = 0, aM;
  while ((aM = rTag.exec(sTextIn)) !== null) {
    nDepth += aM[0] === '</section>' ? -1 : 1;
    if (nDepth === 0) return aM.index;
  }
  return -1;
}

/**
 * OUTPUT: the-concept section enclosing nOffIn: the-innermost open section with a-name:: para in
 *   its own text (before its first sub-section), NOT a-tree section (…-TREE of): { sId, nOpen, nClose,
 *   nLevel, sOwn }, or null.
 */
function fFindSectConceptAt(sTextIn, nOffIn) {
  const rSect = /<section\b[^>]*\bid="([^"]+)"|<\/section>/g;
  const aoOpen = [];
  for (const aM of sTextIn.slice(0, nOffIn).matchAll(rSect)) {
    if (aM[1] !== undefined) aoOpen.push(aM); else aoOpen.pop();
  }
  for (let nI = aoOpen.length - 1; nI >= 0; nI--) {
    const nOpen = aoOpen[nI].index;
    const nClose = fFindSectClose(sTextIn, nOpen);
    if (nClose < 0) continue;
    const nSub = sTextIn.indexOf('<section', nOpen + 8);
    const sOwn = sTextIn.slice(nOpen, nSub > 0 && nSub < nClose ? nSub : nClose);
    const aHead = sOwn.match(/<h([1-6])\b[^>]*>([^\n]*)/);
    if (!aHead || /-TREE of /.test(aHead[2]) || !/<p\b[^>]*>name::/.test(sOwn)) continue;
    return { sId: aoOpen[nI][1], nOpen, nClose, nLevel: Number(aHead[1]), sOwn };
  }
  return null;
}

/**
 * OUTPUT: the-main-name of a-concept: the-most frequent "!⇒" target of its own name:: that is ALSO
 *   a-name-line of it; and the-set of its English names. { sMain ('' = none), oSetName }.
 */
function fFindMainName(sOwnIn) {
  const aPara = sOwnIn.match(/<p\b[^>]*>name::[\s\S]*?<\/p>/);
  const oSetName = new Set();
  const oCountTarget = new Map();
  for (const aL of (aPara ? aPara[0] : '').matchAll(/<br>\*\s*McshEngl\.([^\n,]+),/g)) {
    oSetName.add(aL[1].split('!')[0].split('~')[0].trim());
    const aT = aL[1].match(/!⇒([^!]+)/);
    if (aT) oCountTarget.set(aT[1].trim(), (oCountTarget.get(aT[1].trim()) || 0) + 1);
  }
  const aTarget = [...oCountTarget.entries()].sort((aA, aB) => aB[1] - aA[1]).map((aE) => aE[0]);
  return { sMain: aTarget.find((sT) => oSetName.has(sT)) || '', oSetName };
}

/**
 * DOING: a-tree section (edit/insert/sect/tree-gen-spe | tree-whole-part | tree-parent-child,
 *   Ctrl+Alt+P T G|W|P) of the-concept at nOffIn.
 *   Its place: bAutoIn false = the-start of the-line of nOffIn (a-source tab, before the-cursor line);
 *   true (the-visual editor) = among the-concept's sub-sections: parent-child, whole-part, gen-spe, in this
 *   order, before the-first specific "N.y" (N a-name of the-concept), else before its </section>.
 * INPUT: sKindIn: 'gs' | 'wp' | 'pc'; sDateIn: YYYY-MM-DD.
 * OUTPUT: { nAt, sInsert, nCursor (in sInsert: the-end of the-first "<br>===" line) }
 *   | { nAtExist: the-offset of the-existing tree section } | { sWhy }.
 */
function fBuildTree(sTextIn, nOffIn, sKindIn, sDateIn, bAutoIn) {
  const oKind = ooTreeKind[sKindIn];
  const oCnpt = fFindSectConceptAt(sTextIn, nOffIn);
  if (!oCnpt) return { sWhy: 'no concept section (with name::) here' };
  const sX = oCnpt.sId;
  const { sMain, oSetName } = fFindMainName(oCnpt.sOwn);
  if (!sMain) return { sWhy: `#${sX} has no main-name (x!⇒Main): add it first` };
  // it exists: by its id, or by its heading (the-file concept's trees are top-level: idEntgstr of idOverview)
  let nExist = sTextIn.indexOf(`<section id="${sX}${oKind.sSect}"`);
  if (nExist < 0) {
    const aH = new RegExp(`<h[1-6]\\b[^>]*>${oKind.sTitle} of ${sMain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n`).exec(sTextIn);
    if (aH) nExist = sTextIn.lastIndexOf('<section', aH.index);
  }
  if (nExist >= 0) return { nAtExist: nExist };
  if (sX === 'idOverview') return { sWhy: 'the trees of the file concept are top-level sections: write them by hand' };

  const fLineStart = (nIn) => sTextIn.lastIndexOf('\n', nIn - 1) + 1;
  let nAt;
  if (!bAutoIn) {
    nAt = fLineStart(nOffIn);
  } else {
    // the-direct sub-sections of the-concept: { sId, sTitle, nStart (line), nEnd (after its </section> line) }
    const aoChild = [];
    const rTag = /<section\b[^>]*\bid="([^"]+)"|<\/section>/g;
    rTag.lastIndex = oCnpt.nOpen + 8;
    let nDepth = 0, aM, oCur = null;
    while ((aM = rTag.exec(sTextIn)) !== null && aM.index < oCnpt.nClose) {
      if (aM[1] !== undefined) {
        if (nDepth === 0) {
          const aHead = sTextIn.slice(aM.index, aM.index + 400).match(/<h[1-6]\b[^>]*>([^\n<]*)/);
          oCur = { sId: aM[1], sTitle: aHead ? aHead[1].trim() : '', nStart: fLineStart(aM.index) };
          aoChild.push(oCur);
        }
        nDepth++;
      } else if (--nDepth === 0 && oCur) {
        oCur.nEnd = sTextIn.indexOf('\n', aM.index) + 1;
      }
    }
    const fChild = (sSuffixIn) => aoChild.find((oC) => oC.sId === sX + sSuffixIn);
    const oSpec = aoChild.find((oC) => {
      const aS = oC.sTitle.match(/^([^\s.]+)\.\S/);
      return aS && !/ of /.test(oC.sTitle) && oSetName.has(aS[1]);
    });
    const oPc = fChild('pctr'), oWp = fChild('wptr'), oGs = fChild('gstr');
    const nBefore = (sKindIn === 'pc' ? (oWp || oGs || oSpec) : sKindIn === 'wp' ? (oGs || oSpec) : oSpec)?.nStart
      ?? fLineStart(oCnpt.nClose);
    // NOT before an-earlier tree: whole-part after parent-child, gen-spe after both
    const aoAfter = sKindIn === 'gs' ? [oPc, oWp] : sKindIn === 'wp' ? [oPc] : [];
    nAt = Math.max(nBefore, ...aoAfter.filter(Boolean).map((oC) => oC.nEnd + (sTextIn[oC.nEnd] === '\n' ? 1 : 0)));
  }

  const nLevel = Math.min(oCnpt.nLevel + 1, 6);
  const sS = sX + oKind.sSect;
  const aLine = [
    `  <section id="${sS}">`,
    `  <h${nLevel} id="${sS}H${nLevel}">${oKind.sTitle} of ${sMain}`,
    `    </h${nLevel}>`,
    `  <p id="${sS}dsn">description::`,
    `    <br>× Mcsh-creation: {${sDateIn}}`,
    `    <a class="clsHide" href="#${sS}dsn"></a></p>`,
    `  <p id="${sS}nam">name::`,
    `    <br>* McshEngl.${sMain}'${oKind.sName},`,
    `    <a class="clsHide" href="#${sS}nam"></a></p>`
  ];
  for (const oPara of oKind.aoPara) {
    aLine.push(`  <p id="${sX}${oPara.sId}">${oPara.sLabel}::`,
      `    <br>* McshEngl.${sMain}${oPara.sFirst},`,
      '    <br>===',
      ...oPara.aRest.map((sR) => `    <br>${sR}`),
      `    <a class="clsHide" href="#${sX}${oPara.sId}"></a></p>`);
  }
  aLine.push('  </section>');
  // a-blank line between sections; a-source insert is preceded by one (as the-keybindings)
  const sBody = aLine.join('\n') + '\n';
  const sBlank = !bAutoIn || sTextIn.slice(fLineStart(nAt - 1), nAt).trim() !== '' ? '\n' : '';
  const sInsert = bAutoIn && nAt !== fLineStart(oCnpt.nClose) ? sBody + '\n' : sBlank + sBody;
  const nEq = sInsert.indexOf('<br>===');
  return { nAt, sInsert, nCursor: nEq + '<br>==='.length };
}

module.exports = {
  fCollectCoresById, fCollectIds, fLocate, fEscapeText,
  fGetLineContext, fBuildLineAfter, fBuildLineDelete, fCoreStart,
  fFlattenCores, fCoreAtOffset, fFindSectConcept, fParseNameFirst,
  fBuildParaDsnNam, fBuildTree,
};
