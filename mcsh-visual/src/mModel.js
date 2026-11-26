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
    const nDist = Math.min(Math.abs(offset - c.s), Math.abs(offset - c.e));
    if (nDist < nBestDist) { nBestDist = nDist; oBest = c; }
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

/** OUTPUT: the-id of the-innermost section open at nOffIn, or ''. */
function fFindSectIdAt(sTextIn, nOffIn) {
  const aoOpen = [];
  for (const aM of sTextIn.slice(0, nOffIn).matchAll(/<section\b[^>]*\bid="([^"]+)"|<\/section>/g)) {
    if (aM[1] !== undefined) aoOpen.push(aM[1]); else aoOpen.pop();
  }
  return aoOpen[aoOpen.length - 1] || '';
}

// the-paragraphs OF a-section (its attributes), never a-para-concept (as dirValid/conceptRange.js)
const rTitleOfSect = /^(\[?name|description.*|.*-tree|addressWpg|attribute|webpage-versions|footer|SEARCH|example|definition)$/;

/** OUTPUT: the-index just after the-element `<p|div` opened at nOpenIn closes (nesting counted for div), or -1. */
function fFindParaEnd(sTextIn, nOpenIn, sTagIn) {
  const rTag = new RegExp(`<${sTagIn}\\b|</${sTagIn}>`, 'g');
  rTag.lastIndex = nOpenIn;
  let nDepth = 0, aM;
  while ((aM = rTag.exec(sTextIn)) !== null) {
    nDepth += aM[0][1] === '/' ? -1 : 1;
    if (nDepth === 0) return aM.index + aM[0].length;
  }
  return -1;
}

/**
 * OUTPUT: the-para-concept that holds nOffIn (a-<p|div id> titled "Y::", NOT a-section's own para,
 *   with McsLago names "<br>* McshXxxx."): { sId, nOpen, nEnd }, or null (a-section's own para, or none).
 */
function fFindParaConceptAt(sTextIn, nOffIn) {
  const sBefore = sTextIn.slice(0, nOffIn);
  const nSect = Math.max(sBefore.lastIndexOf('<section'), sBefore.lastIndexOf('</section>'));
  const aoOpen = [...sBefore.slice(nSect < 0 ? 0 : nSect).matchAll(/<(p|div)\b[^>]*\bid="([^"]+)"[^>]*>/g)];
  for (let nI = aoOpen.length - 1; nI >= 0; nI--) {
    const aM = aoOpen[nI];
    const nOpen = (nSect < 0 ? 0 : nSect) + aM.index;
    const nEnd = fFindParaEnd(sTextIn, nOpen, aM[1]);
    if (nEnd < nOffIn) continue;                                   // closed above the-cursor
    const sPara = sTextIn.slice(nOpen, nEnd);
    const aTitle = sPara.slice(aM[0].length).match(/^([^:\n<]+)::/);
    if (aTitle && !rTitleOfSect.test(aTitle[1].trim()) && /<br>\*\s*Mcsh[A-Z][a-z]{3}\./.test(sPara)) {
      return { sId: aM[2], nOpen, nEnd };
    }
    if (aM[1] === 'p') return null;                                // inside a-section's own para
  }
  return null;
}

/**
 * OUTPUT: the-name of the-concept sIdIn of sTextIn, to name it as a-generic: its main-name, else its
 *   first English name; { sName, sWhy } (sWhy '' when found).
 */
function fFindNameOfConcept(sTextIn, sIdIn) {
  const aEl = new RegExp(`<(section|p|div)\\b[^>]*\\bid="${sIdIn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).exec(sTextIn);
  if (!aEl) return { sName: '', sWhy: `no #${sIdIn} in the generic's file` };
  let sOwn;
  if (aEl[1] === 'section') {
    const nClose = fFindSectClose(sTextIn, aEl.index);
    const nSub = sTextIn.indexOf('<section', aEl.index + 8);
    sOwn = sTextIn.slice(aEl.index, nSub > 0 && (nClose < 0 || nSub < nClose) ? nSub : nClose);
    const aPara = sOwn.match(/<p\b[^>]*>name::[\s\S]*?<\/p>/);
    if (!aPara) return { sName: '', sWhy: `#${sIdIn} has no name:: para` };
    sOwn = aPara[0];
  } else {
    sOwn = sTextIn.slice(aEl.index, fFindParaEnd(sTextIn, aEl.index, aEl[1]));
  }
  const aFirst = sOwn.match(/<br>\*\s*McshEngl\.([^\n,]+),/);
  if (!aFirst) return { sName: '', sWhy: `#${sIdIn} has no English name` };
  const { sMain } = fFindMainName(/<p\b[^>]*>name::/.test(sOwn) ? sOwn : '<p>name::' + sOwn + '</p>');
  const sName = sMain || aFirst[1].split('!')[0].split('~')[0].trim();
  // the-descriptive-main-name: the-first "Main!=Descr" LONGER than the-main-name (entity!=Entt is an-abbreviation:
  //   the-main-name "entity" is descriptive itself); no "Main!=": the-first "Descr!⇒Main" longer, not a-file path;
  //   none: the-name
  let sDescr = '';
  if (sMain) {
    const sMainEsc = sMain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const aEq = [...sOwn.matchAll(new RegExp(`<br>\\*\\s*McshEngl\\.${sMainEsc}!=([^\\n,!{]+)`, 'g'))].map((aM) => aM[1].trim());
    const aTo = [...sOwn.matchAll(new RegExp(`<br>\\*\\s*McshEngl\\.([^\\n,!]+)!⇒${sMainEsc}\\s*[,{]`, 'g'))].map((aM) => aM[1].trim());
    const fLonger = (sD) => sD.length > sMain.length && !/\.last\.html|\/\/dir|^dir/.test(sD);
    sDescr = (aEq.length ? aEq : aTo).find(fLonger) || '';
  }
  return { sName, sDescr: sDescr || sName, sWhy: '' };
}

// the-relations of edit/insert/concept/…: the-word, its tree para, the-tree section (ooTreeKind), the-place in the-para
//   (bLast: at its end, else first after "<br>==="), the-paras a-new para goes after (besides name::)
const ooGenSpeKind = {
  gen: { sWord: 'generic', sTree: 'gntr', sKindTree: 'gs', bLast: false, aAfter: [] },
  spe: { sWord: 'specific', sTree: 'sptr', sKindTree: 'gs', bLast: true, aAfter: [['gntr', 'generic-tree']] },
  whl: { sWord: 'whole', sTree: 'wltr', sKindTree: 'wp', bLast: false, aAfter: [] },
  prt: { sWord: 'part', sTree: 'prtr', sKindTree: 'wp', bLast: true, aAfter: [['wltr', 'whole-tree']] },
  prn: { sWord: 'parent', sTree: 'pntr', sKindTree: 'pc', bLast: false, aAfter: [] },
  chd: { sWord: 'child', sTree: 'chtr', sKindTree: 'pc', bLast: true, aAfter: [['pntr', 'parent-tree']] }
};

/**
 * DOING: edit/insert/concept/generic | specific | whole | part | parent | child (Ctrl+Alt+P C G | S | W | P | N | C):
 *   a-generic | specific | whole | part | parent | child of the-concept at nOffIn (whole | part: in the-WHOLE-PART-TREE,
 *   parent | child: in the-PARENT-CHILD-TREE, as generic | specific).
 *   - a-para-concept: after its "<br>× Mcsh-creation:" line and the "<br>× " lines that follow it (else its
 *     title line): "<br>× generic: DESCR" | "<br>× specific: DESCR" (descriptive-main-name, plain text);
 *   - a-sect-concept: "<br>* DESCR!@CODE#ID," in its generic-tree:: (after its "<br>===") | specific-tree::
 *     (at its end); none: with a-main-name, a-new GENERIC-SPECIFIC-TREE section (fBuildTree, its automatic
 *     place) with it; without, a-new generic-tree:: | specific-tree:: para after its name:: (| generic-tree::) para.
 * INPUT: oGenIn: { sName, sDescr (descriptive-main-name), sCode (McshTchInf000009), sId, sHref (relative, with #id) };
 *   sKindIn: 'gen' | 'spe' | 'whl' | 'prt' | 'prn' | 'chd' (ooGenSpeKind).
 * OUTPUT: { nAt, sInsert, nCursor (in sInsert), sHow } | { sWhy }.
 */
function fBuildGenSpe(sTextIn, nOffIn, oGenIn, sDateIn, sKindIn) {
  const oKind = ooGenSpeKind[sKindIn] || ooGenSpeKind.gen;
  const sWord = oKind.sWord, sTree = oKind.sTree;
  const sTitleTree = ooTreeKind[oKind.sKindTree].sTitle;
  const fEsc = (sIn) => sIn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fLineEnd = (nIn) => { const nE = sTextIn.indexOf('\n', nIn); return nE < 0 ? sTextIn.length : nE + 1; };
  const sDescr = oGenIn.sDescr || oGenIn.sName;
  const sRefAt = `!@${oGenIn.sCode}#${oGenIn.sId}`;
  const oPara = fFindParaConceptAt(sTextIn, nOffIn);
  if (oPara) {
    const sPara = sTextIn.slice(oPara.nOpen, oPara.nEnd);
    if (sPara.includes(`href="${oGenIn.sHref}"`) || sPara.includes(sRefAt) ||
      new RegExp(`<br>× ${sWord}: ${fEsc(sDescr)}\\s*(\\n|$)`).test(sPara)) {
      return { sWhy: `#${oPara.sId} has this ${sWord} already` };
    }
    // after the-date line and the-"<br>× " lines that follow it
    const aDate = /<br>× Mcsh-creation:[^\n]*\n(?:[ \t]*<br>× [^\n]*\n)*/.exec(sPara);
    const nAt = aDate ? oPara.nOpen + aDate.index + aDate[0].length : fLineEnd(oPara.nOpen);
    const sLine = `    <br>× ${sWord}: ${sDescr}`;
    return { nAt, sInsert: sLine + '\n', nCursor: sLine.length, sHow: `#${oPara.sId}: × ${sWord}` };
  }

  const sLine = `    <br>* ${sDescr}${sRefAt},`;
  // the-line into an-existing X-tree:: para at nTreeIn of the-concept sXIn
  const fIntoPara = (nTreeIn, sXIn) => {
    const sPara = sTextIn.slice(nTreeIn, fFindParaEnd(sTextIn, nTreeIn, 'p'));
    if (sPara.includes(sRefAt)) return { sWhy: `#${sXIn} has this ${sWord} already` };
    const aEq = /<br>===[^\n]*/.exec(sPara);
    // a-generic | whole | parent: first after "<br>==="; a-specific | part | child: last, before the-clsHide
    //   line, and before a-trailing "<br>* ..." (more-to-come) line
    const aHide = /\n[ \t]*<br>\*\s*\.\.\.,?[ \t]*\n[ \t]*<a class="clsHide"/.exec(sPara) || /\n[ \t]*<a class="clsHide"/.exec(sPara);
    const nAt = !oKind.bLast && aEq ? fLineEnd(nTreeIn + aEq.index) : aHide ? nTreeIn + aHide.index + 1 : fLineEnd(nTreeIn);
    return { nAt, sInsert: sLine + '\n', nCursor: sLine.length, sHow: `#${sXIn}: ${sWord}-tree` };
  };

  const oCnpt = fFindSectConceptAt(sTextIn, nOffIn);
  if (!oCnpt) {
    // the-file concept: its trees are top-level sections "X-TREE of Main" (Main of idOverview's name::);
    //   the-cursor in such a-tree section, or in idOverview
    const sSect = fFindSectIdAt(sTextIn, nOffIn);
    const nSect = sSect ? sTextIn.indexOf(`<section id="${sSect}"`) : -1;
    let nTreeSect = -1;
    if (nSect >= 0 && new RegExp(`^<section[^>]*>\\s*<h[1-6]\\b[^>]*>${sTitleTree} of `).test(sTextIn.slice(nSect, nSect + 300))) nTreeSect = nSect;
    if (nTreeSect < 0) {
      const nOv = sTextIn.indexOf('<section id="idOverview"');
      const nOvSub = nOv < 0 ? -1 : sTextIn.indexOf('<section', nOv + 8);
      const sMainOv = nOv < 0 ? '' : fFindMainName(sTextIn.slice(nOv, nOvSub < 0 ? undefined : nOvSub)).sMain;
      const bFileCnpt = !sSect || sSect === 'idOverview' ||
        (nSect >= 0 && /^<section[^>]*>\s*<h[1-6]\b[^>]*>[A-Z-]+-TREE of /.test(sTextIn.slice(nSect, nSect + 300)));
      const aH = sMainOv && bFileCnpt &&
        new RegExp(`<h[1-6]\\b[^>]*>${sTitleTree} of ${fEsc(sMainOv)}\\s*\\n`).exec(sTextIn);
      if (aH) nTreeSect = sTextIn.lastIndexOf('<section', aH.index);
    }
    if (nTreeSect < 0) return { sWhy: 'no concept here (a section with name::, or a para-concept)' };
    const aG = new RegExp(`<p\\b[^>]*>${sWord}-tree::`).exec(sTextIn.slice(nTreeSect, fFindSectClose(sTextIn, nTreeSect)));
    if (!aG) return { sWhy: `the file concept's ${sTitleTree} has no ${sWord}-tree:: para` };
    return fIntoPara(nTreeSect + aG.index, 'idOverview');
  }
  const sX = oCnpt.sId;
  const { sMain } = fFindMainName(oCnpt.sOwn);
  // its X-tree:: para: XNNtr; else one in its own text; else in its tree section (by heading)
  const fFindTreePara = (sTreeIn, sLabelIn) => {
    let nAt = sTextIn.indexOf(`<p id="${sX}${sTreeIn}">`);
    if (nAt < 0) {
      const aOwn = new RegExp(`<p\\b[^>]*>${sLabelIn}::`).exec(oCnpt.sOwn);
      if (aOwn) nAt = oCnpt.nOpen + aOwn.index;
    }
    if (nAt < 0 && sMain) {
      const aH = new RegExp(`<h[1-6]\\b[^>]*>${sTitleTree} of ${fEsc(sMain)}\\s*\\n`).exec(sTextIn);
      if (aH) {
        const nGs = sTextIn.lastIndexOf('<section', aH.index);
        const aG = new RegExp(`<p\\b[^>]*>${sLabelIn}::`).exec(sTextIn.slice(nGs, fFindSectClose(sTextIn, nGs)));
        if (aG) nAt = nGs + aG.index;
      }
    }
    return nAt;
  };
  const nTree = fFindTreePara(sTree, sWord + '-tree');
  if (nTree >= 0) return fIntoPara(nTree, sX);
  if (sMain) {
    const oTree = fBuildTree(sTextIn, nOffIn, oKind.sKindTree, sDateIn, true);
    if (oTree.sWhy) return oTree;
    if (oTree.nAtExist != null) return { sWhy: `#${sX}: its ${sTitleTree} has no ${sWord}-tree:: para` };
    // the-end of the-"<br>===" line of the-generic-tree:: | specific-tree:: para of the-new section
    const nEq = oTree.sInsert.indexOf('<br>===', oTree.sInsert.indexOf(`>${sWord}-tree::`)) + '<br>==='.length;
    const sInsert = oTree.sInsert.slice(0, nEq) + '\n' + sLine + oTree.sInsert.slice(nEq);
    return { nAt: oTree.nAt, sInsert, nCursor: nEq + 1 + sLine.length, sHow: `#${sX}: new ${sTitleTree}` };
  }
  // no main-name: a-new X-tree:: para after its name:: para (a-specific-tree:: after its generic-tree:: too)
  const aNam = /<p\b[^>]*>name::[\s\S]*?<\/p>[^\n]*\n?/.exec(oCnpt.sOwn);
  let nAt = oCnpt.nOpen + aNam.index + aNam[0].length;
  for (const [sTreeAfter, sLabelAfter] of oKind.aAfter) {
    const nAfter = fFindTreePara(sTreeAfter, sLabelAfter);
    if (nAfter >= 0 && nAfter < oCnpt.nOpen + oCnpt.sOwn.length) nAt = fLineEnd(fFindParaEnd(sTextIn, nAfter, 'p') - 1);
  }
  const sInsert = `  <p id="${sX}${sTree}">${sWord}-tree::\n${sLine}\n    <a class="clsHide" href="#${sX}${sTree}"></a></p>\n`;
  return { nAt, sInsert, nCursor: sInsert.indexOf(sLine) + sLine.length, sHow: `#${sX}: new ${sWord}-tree:: para` };
}

/**
 * DOING: edit/insert/concept/attribute (Ctrl+Alt+P C A): a-new attribute section of the-concept at nOffIn
 *   (a-MISC-ATTRIBUTE section counts as its concept; the-file concept idOverview: its top-level sections):
 *   - 'num' own-numbered "NN_word of Main": NN = its Main'NN_last (or its biggest own number) + 1, after its
 *     last numbered attribute (none: before its first sub-section), its Main'NN_last updated;
 *   - 'misc' unnumbered "word of Main": at the-end of its MISC-ATTRIBUTE section (none: created where a-numbered
 *     would go);
 *   - 'spe' specific "Main.word": at the-end of the-concept, written in its specific-tree:: too.
 *   Ids: an-attribute Xatt + the-next number of the-file (X the-concept id, idOverview: the-file's prefix);
 *   a-specific B + the-next number of the-file (B the-concept id without its digits: idMdl034 → idMdl035).
 * INPUT: sKindIn: 'num' | 'misc' | 'spe'; sWordIn: the-name ("mapping relation"); sCodeIn: McshCor000012.
 * OUTPUT: { aoEdit: [{ nStart, nEnd, sText }] (offsets of sTextIn, no overlap, in order), sIdNew, sHow } | { sWhy }.
 */
function fBuildAttr(sTextIn, nOffIn, sKindIn, sWordIn, sDateIn, sCodeIn) {
  const fEsc = (sIn) => sIn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fLineStart = (nIn) => sTextIn.lastIndexOf('\n', nIn - 1) + 1;
  const fLineEnd = (nIn) => { const nE = sTextIn.indexOf('\n', nIn); return nE < 0 ? sTextIn.length : nE + 1; };
  const sWord = (sWordIn || '').trim();
  if (!sWord) return { sWhy: 'no name' };
  if (/[<>,!@#:'"]/.test(sWord)) return { sWhy: `"${sWord}": a name without < > , ! @ # : ' "` };
  const sFormal = sWord.replace(/[\s-]+/g, '_');
  const sHyph = sWord.replace(/[\s_]+/g, '-');

  // the-concept: a-MISC-ATTRIBUTE section, an-attribute without main-name ("04_part of modelSyst"), is NOT:
  //   its enclosing one is
  let oCnpt = fFindSectConceptAt(sTextIn, nOffIn);
  const sIdFirst = oCnpt ? oCnpt.sId : '';
  while (oCnpt && (/^MISC-ATTRIBUTE of /.test((oCnpt.sOwn.match(/<h[1-6]\b[^>]*>([^\n]*)/) || [])[1] || '') ||
    !fFindMainName(oCnpt.sOwn).sMain)) {
    oCnpt = fFindSectConceptAt(sTextIn, oCnpt.nOpen);
  }
  if (!oCnpt) return { sWhy: sIdFirst ? `#${sIdFirst} and its enclosing concepts have no main-name (x!⇒Main): add it first` : 'no concept section (with name::) here' };
  const { sMain } = fFindMainName(oCnpt.sOwn);
  const bFile = oCnpt.sId === 'idOverview';

  // the-sub-sections of the-concept (the-file concept: the-top-level sections after idOverview, before idMeta)
  const nFrom = bFile ? oCnpt.nClose : oCnpt.nOpen + 8;
  const nMeta = sTextIn.search(/<section id="(idMeta|idSupport)"/);
  const nTo = bFile ? (nMeta < 0 ? sTextIn.length : nMeta) : oCnpt.nClose;
  const aoChild = [];
  const rTag = /<section\b[^>]*\bid="([^"]+)"|<\/section>/g;
  rTag.lastIndex = nFrom;
  let nDepth = 0, aM, oCur = null;
  while ((aM = rTag.exec(sTextIn)) !== null && aM.index < nTo) {
    if (aM[1] !== undefined) {
      if (nDepth === 0) {
        const aHead = sTextIn.slice(aM.index, aM.index + 400).match(/<h([1-6])\b[^>]*>([^\n<]*)/);
        oCur = { sId: aM[1], sTitle: aHead ? aHead[2].trim() : '', nLevel: aHead ? Number(aHead[1]) : 0, nStart: fLineStart(aM.index), nCloseAt: -1 };
        aoChild.push(oCur);
      }
      nDepth++;
    } else if (nDepth === 0) {
      if (!bFile) break;                                      // the-concept's own </section>
    } else if (--nDepth === 0 && oCur) {
      oCur.nCloseAt = fLineStart(aM.index);
      oCur.nEnd = fLineEnd(aM.index);
    }
  }
  const nLevelSub = bFile ? 1 : Math.min(oCnpt.nLevel + 1, 6);
  const nEndScope = bFile ? (nMeta < 0 ? sTextIn.length : fLineStart(nMeta)) : fLineStart(oCnpt.nClose);
  const aoNum = aoChild.filter((oC) => /^\d{2,}_\S.* of /.test(oC.sTitle));
  const oMisc = aoChild.find((oC) => /^MISC-ATTRIBUTE of /.test(oC.sTitle));

  // the-id prefix of the-concept: X; the-file concept: the-prefix of its GENERIC-SPECIFIC-TREE | its specifics
  let sBase = oCnpt.sId;
  if (bFile) {
    const aGs = new RegExp(`<section id="(\\w+)gstr">\\s*<h1\\b[^>]*>GENERIC-SPECIFIC-TREE of ${fEsc(sMain)}\\s*\\n`).exec(sTextIn);
    const oCount = new Map();
    for (const oC of aoChild) {
      const aB = oC.sId.match(/^(id[A-Za-z]+?)\d+$/);
      if (aB) oCount.set(aB[1], (oCount.get(aB[1]) || 0) + 1);
    }
    sBase = aGs ? aGs[1] : ([...oCount.entries()].sort((aA, aB) => aB[1] - aA[1])[0] || [])[0];
    if (!sBase) return { sWhy: 'the file concept: no id prefix found (no GENERIC-SPECIFIC-TREE, no specifics): write it by hand' };
  }
  // the-next 3-digit number of the-file after sPrefixIn: "idMdl" → idMdl035 (NOT after idMdl021008, a-specific of idMdl021)
  const fNextId = (sPrefixIn) => {
    let nMax = 0;
    for (const aI of sTextIn.matchAll(new RegExp(`\\bid="${fEsc(sPrefixIn)}(\\d{3})"`, 'g'))) nMax = Math.max(nMax, Number(aI[1]));
    const sNum = String(nMax + 1).padStart(3, '0');
    return { sId: sPrefixIn + sNum, sNum };
  };

  // a-position nAtIn: a-blank line between sections
  const fPlace = (nAtIn, sBodyIn) => {
    const bPrevBlank = nAtIn === 0 || sTextIn.slice(fLineStart(nAtIn - 1), nAtIn).trim() === '';
    const bNextSect = /^[ \t]*<section\b/.test(sTextIn.slice(nAtIn, fLineEnd(nAtIn)));
    return (bPrevBlank ? '' : '\n') + sBodyIn + (bNextSect ? '\n' : '');
  };
  const fSection = (sIdIn, nLevelIn, sHeadIn, aNameIn, bDsnIn) => [
    `  <section id="${sIdIn}">`,
    `  <h${nLevelIn} id="${sIdIn}H${nLevelIn}">${sHeadIn}`,
    `    </h${nLevelIn}>`,
    `  <p id="${sIdIn}dsn">description::`,
    `    <br>× Mcsh-creation: {${sDateIn}}`,
    ...(bDsnIn ? ['    <br>· '] : []),
    `    <a class="clsHide" href="#${sIdIn}dsn"></a></p>`,
    `  <p id="${sIdIn}nam">name::`,
    ...aNameIn.map((sN) => `    <br>* McshEngl.${sN},`),
    `    <a class="clsHide" href="#${sIdIn}nam"></a></p>`
  ];
  // where a-numbered attribute goes: after the-last numbered; none: before the-first sub-section; none: the-end
  const nAtNum = aoNum.length ? aoNum[aoNum.length - 1].nEnd : aoChild.length ? aoChild[0].nStart : nEndScope;
  const aoEdit = [];
  let sIdNew, sHow;

  if (sKindIn === 'num') {
    const aNam = /<p\b[^>]*>name::[\s\S]*?<\/p>/.exec(oCnpt.sOwn);
    const nNam = oCnpt.nOpen + aNam.index;
    const aLast = new RegExp(`<br>\\*\\s*McshEngl\\.${fEsc(sMain)}'(\\d+)_last,`).exec(aNam[0]);
    const nNum = Math.max(aLast ? Number(aLast[1]) : 0, ...aoNum.map((oC) => Number(oC.sTitle.match(/^\d+/)[0]))) + 1;
    const sNum = String(nNum).padStart(2, '0');
    if (aoNum.some((oC) => new RegExp(`^\\d+_${fEsc(sFormal)} of `).test(oC.sTitle))) return { sWhy: `${sMain} has a numbered "${sFormal}" already` };
    sIdNew = fNextId(sBase + 'att').sId;
    if (aLast) {
      const nS = nNam + aLast.index;
      aoEdit.push({ nStart: nS, nEnd: nS + aLast[0].length, sText: `<br>* McshEngl.${sMain}'${sNum}_last,` });
    } else {
      const nHide = nNam + aNam[0].lastIndexOf('<a class="clsHide"');
      const nS = fLineStart(nHide);
      aoEdit.push({ nStart: nS, nEnd: nS, sText: `    <br>* McshEngl.${sMain}'${sNum}_last,\n` });
    }
    const sNumAtt = sIdNew.slice((sBase + 'att').length);
    const aLine = fSection(sIdNew, nLevelSub, `${sNum}_${sFormal} of ${sMain}`,
      [`${sMain}'${sNum}_${sFormal}`, `${sMain}'${sFormal}`, `${sMain}'att${sNumAtt}_${sFormal}`], true);
    aoEdit.push({ nStart: nAtNum, nEnd: nAtNum, sText: fPlace(nAtNum, aLine.concat('  </section>').join('\n') + '\n') });
    sHow = `#${sIdNew}: ${sNum}_${sFormal} of ${sMain} (${sMain}'${sNum}_last)`;
  } else if (sKindIn === 'misc') {
    sIdNew = fNextId(sBase + 'att').sId;
    const sNumAtt = sIdNew.slice((sBase + 'att').length);
    const aName = [`${sMain}'${sFormal}`, `${sHyph}--of-${sMain}`, `${sMain}'att${sNumAtt}_${sFormal}`];
    if (oMisc) {
      const sMiscText = sTextIn.slice(oMisc.nStart, oMisc.nEnd);
      if (new RegExp(`<h[1-6]\\b[^>]*>${fEsc(sHyph)} of ${fEsc(sMain)}\\s*\\n`).test(sMiscText)) return { sWhy: `${sMain} has "${sHyph}" in its MISC-ATTRIBUTE already` };
      const aLine = fSection(sIdNew, Math.min(oMisc.nLevel + 1, 6), `${sHyph} of ${sMain}`, aName, true);
      aoEdit.push({ nStart: oMisc.nCloseAt, nEnd: oMisc.nCloseAt, sText: fPlace(oMisc.nCloseAt, aLine.concat('  </section>').join('\n') + '\n') });
      sHow = `#${sIdNew}: ${sHyph} of ${sMain} (in #${oMisc.sId})`;
    } else {
      const sIdMisc = sBase + 'misc';
      if (sTextIn.includes(`id="${sIdMisc}"`)) return { sWhy: `#${sIdMisc} exists, but not as the MISC-ATTRIBUTE of ${sMain}` };
      const aMisc = fSection(sIdMisc, nLevelSub, `MISC-ATTRIBUTE of ${sMain}`, [`${sMain}'misc_attribute`], false);
      const aLine = fSection(sIdNew, Math.min(nLevelSub + 1, 6), `${sHyph} of ${sMain}`, aName, true);
      const sBody = aMisc.join('\n') + '\n\n' + aLine.concat('  </section>', '  </section>').join('\n') + '\n';
      aoEdit.push({ nStart: nAtNum, nEnd: nAtNum, sText: fPlace(nAtNum, sBody) });
      sHow = `#${sIdNew}: ${sHyph} of ${sMain} (new #${sIdMisc})`;
    }
  } else if (sKindIn === 'spe') {
    const sBaseSpe = bFile ? sBase : sBase.replace(/\d+$/, '');
    const { sId, sNum } = fNextId(sBaseSpe);
    sIdNew = sId;
    const sSpe = `${sMain}.${sFormal}`;
    if (aoChild.some((oC) => oC.sTitle === sSpe)) return { sWhy: `${sMain} has the specific ${sSpe} already` };
    const aLine = fSection(sIdNew, nLevelSub, sSpe, [sSpe, `${sMain}.${sNum}_${sFormal}!⇒${sSpe}`], true);
    // its specific-tree:: (or a-new GENERIC-SPECIFIC-TREE): BEFORE the-specific when at the-same place
    const oSptr = fBuildGenSpe(sTextIn, sTextIn.indexOf('>', oCnpt.nOpen) + 1, { sName: sSpe, sDescr: sSpe, sCode: sCodeIn, sId: sIdNew, sHref: '#' + sIdNew }, sDateIn, 'spe');
    const sSpeBody = fPlace(nEndScope, aLine.concat('  </section>').join('\n') + '\n');
    if (!oSptr.sWhy && oSptr.nAt === nEndScope) {
      aoEdit.push({ nStart: nEndScope, nEnd: nEndScope, sText: oSptr.sInsert + sSpeBody.replace(/^\n/, '') });
    } else {
      if (!oSptr.sWhy) aoEdit.push({ nStart: oSptr.nAt, nEnd: oSptr.nAt, sText: oSptr.sInsert });
      aoEdit.push({ nStart: nEndScope, nEnd: nEndScope, sText: sSpeBody });
    }
    sHow = `#${sIdNew}: ${sSpe}` + (oSptr.sWhy ? ` (specific-tree: ${oSptr.sWhy})` : ` (${oSptr.sHow})`);
  } else {
    return { sWhy: `unknown kind "${sKindIn}"` };
  }
  if (sTextIn.includes(`id="${sIdNew}"`)) return { sWhy: `#${sIdNew} exists` };
  aoEdit.sort((oA, oB) => oA.nStart - oB.nStart);
  return { aoEdit, sIdNew, sHow };
}

module.exports = {
  fCollectCoresById, fCollectIds, fLocate, fEscapeText,
  fGetLineContext, fBuildLineAfter, fBuildLineDelete, fCoreStart,
  fFlattenCores, fCoreAtOffset, fFindSectConcept, fParseNameFirst,
  fBuildParaDsnNam, fBuildTree, fFindSectIdAt,
  fFindParaConceptAt, fFindNameOfConcept, fBuildGenSpe, fBuildAttr,
};
