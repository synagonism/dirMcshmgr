// mcsh-visual/src/mMcshVisual.js — edit-bridge for the Mcsh-Visual VS Code extension.
//
// Runs INSIDE the normal, server-rendered page (so it looks exactly like the
// live site). Served over http and loaded by mMcsh2.js ONLY when the URL carries
// `?mcshv=1`, i.e. when the page is embedded in the Mcsh-Visual editor's iframe. On
// the public site it never loads and has zero effect.
//
// Unlike mMcshEdit.js (the surgical WYSIWYG bridge), this one is paired with an
// extension that keeps every change in an UNSAVED document and re-serialises the
// WHOLE file to canonical form only on Save. So instead of reloading the frame
// after each format command, it updates the DOM optimistically and re-annotates
// locally, keeping the (id, ordinal) map in sync with the unsaved document with
// no server round-trip. Format commands arrive from the browser chrome's "..."
// menu (Bold / Color / Url) rather than a floating toolbar.

// ES module — NOT self-executing. Importing this file has no side effects; the
// mMcsh2.js loader calls initMcshvBridge() once the module has loaded (see the
// ?mcshv=1 guard there). Modules are implicitly strict, so no 'use strict' needed.
let bStarted = false;
export function fInitMcshv_bridge() {
  if (bStarted) return;               // idempotent within a module instance
  bStarted = true;

  var oParent = (window.parent && window.parent !== window) ? window.parent : null;
  var sNbsp = String.fromCharCode(0xa0);

  // Mark this iframe's browsing context as "editor mode" so mMcsh2's guarded loader
  // re-loads this bridge on any same-origin navigation (in-page search, ToC, home,
  // preview…) even when the URL lost ?mcshv=1. sessionStorage is per-context → never
  // leaks to the public site or other tabs.
  try { sessionStorage.setItem('mcshvEdit', '1'); } catch (e) {}
  var oSetValidIds = null;   // Set of ids present in the source file (host-supplied)
  var oLastSpan = null;

  // mMcsh2.fWidthPginf() sizes the ToC/content split from window.outerWidth,
  // which inside the iframe is the whole VS Code window — making the ToC huge.
  // Point outerWidth/Height at the frame's real size.
  try {
    Object.defineProperty(window, 'outerWidth', { configurable: true, get: function () { return document.documentElement.clientWidth || window.innerWidth; } });
    Object.defineProperty(window, 'outerHeight', { configurable: true, get: function () { return document.documentElement.clientHeight || window.innerHeight; } });
  } catch (e) {}

  function fTrimPlain(s) { return String(s).replace(/^[\n\r\t ]+/, '').replace(/[\n\r\t ]+$/, ''); }
  function fEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').split(sNbsp).join('&nbsp;'); }
  function fEscAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
  function fNearestId(node) {
    var oEl = node.parentElement;
    while (oEl) { if (oEl.id && /^id/.test(oEl.id)) return oEl.id; oEl = oEl.parentElement; }
    return null;
  }
  function fPost(msg) { if (!oParent) return; msg.source = 'mcshv'; oParent.postMessage(msg, '*'); }
  function fNotify(m) { fPost({ type: 'status', message: m }); }

  // --- annotate every editable text core, ordinals per-id in document order ---
  // Ordinals match the extension's collectCoresById(). Only ids present in the
  // source file are editable (mMcsh2's generated chrome is left alone).
  function fAnnotate() {
    var oCounters = {};
    var oWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var aTargets = [], n;
    while ((n = oWalker.nextNode())) {
      if (!fTrimPlain(n.nodeValue || '')) continue;
      if (n.parentElement.closest('script,style,noscript,title,textarea')) continue;
      if (n.parentElement.closest('.clsMcshvT')) continue;
      var sId = fNearestId(n);
      if (!sId) continue;
      var nOrd = (oCounters[sId] = (oCounters[sId] == null ? 0 : oCounters[sId] + 1));
      if (oSetValidIds && !oSetValidIds.has(sId)) continue;
      aTargets.push({ node: n, id: sId, ord: nOrd });
    }
    for (var i = 0; i < aTargets.length; i++) {
      var t = aTargets[i], sRaw = t.node.nodeValue;
      var sLead = (sRaw.match(/^[\n\r\t ]*/) || [''])[0];
      var sTrail = (sRaw.match(/[\n\r\t ]*$/) || [''])[0];
      var sCore = sRaw.slice(sLead.length, sRaw.length - sTrail.length);
      var oSpan = document.createElement('span');
      oSpan.className = 'clsMcshvT';
      oSpan.setAttribute('contenteditable', 'true');
      oSpan.setAttribute('spellcheck', 'false');
      oSpan.dataset.id = t.id; oSpan.dataset.ord = t.ord;
      oSpan.textContent = sCore;
      var oFrag = document.createDocumentFragment();
      if (sLead) oFrag.appendChild(document.createTextNode(sLead));
      oFrag.appendChild(oSpan);
      if (sTrail) oFrag.appendChild(document.createTextNode(sTrail));
      if (t.node.parentNode) t.node.parentNode.replaceChild(oFrag, t.node);
    }
    fWireSpans();
  }

  // Unwrap all .clsMcshvT spans back to plain text nodes, then re-annotate. Used
  // after a format command changes a core's inner structure, so ordinals re-sync
  // with the (matching) unsaved document — no server reload needed.
  var bReannotating = false;
  function fReannotate() {
    bReannotating = true;
    try {
      var oSpans = document.querySelectorAll('.clsMcshvT');
      for (var i = 0; i < oSpans.length; i++) {
        var s = oSpans[i], oParentNode = s.parentNode;
        if (!oParentNode) continue;
        while (s.firstChild) oParentNode.insertBefore(s.firstChild, s);
        oParentNode.removeChild(s);
      }
      // Merge adjacent text nodes so cores rejoin as in the source.
      document.body.normalize();
      fAnnotate();
    } finally { bReannotating = false; }
  }

  // --- text editing: commit each span on blur --------------------------------
  function fCommit(span) {
    // Ignore the blur that fires when reannotate() unwraps a focused span: the
    // span is being torn down (detached / emptied), so its textContent is bogus
    // and posting it would wipe that core (e.g. delete the clicked line on Save).
    if (bReannotating || !span.isConnected) return;
    var sNow = span.textContent;
    if (span.dataset.orig != null && sNow === span.dataset.orig) return;
    fPost({ type: 'edit', id: span.dataset.id, ord: +span.dataset.ord, oldDec: span.dataset.orig, text: sNow });
    span.dataset.orig = sNow;
  }
  function fWireSpans() {
    var oSpans = document.querySelectorAll('.clsMcshvT');
    for (var i = 0; i < oSpans.length; i++) {
      var oSpan = oSpans[i];
      if (oSpan.__wired) continue;
      oSpan.__wired = true;
      oSpan.addEventListener('focus', function () {
        oLastSpan = this; this.dataset.orig = this.textContent;
        if (!bReannotating) fPost({ type: 'sync', id: this.dataset.id, ord: +this.dataset.ord }); // visual -> source caret
      });
      oSpan.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); this.blur(); }
        else if (e.key === 'Escape') { this.textContent = this.dataset.orig || ''; this.blur(); }
      });
      oSpan.addEventListener('blur', function () { fCommit(this); });
      oSpan.addEventListener('click', function (e) { e.stopPropagation(); }, true);
    }
  }

  // --- selection within a single editable span -------------------------------
  function fSelectionInSpan() {
    var oSel = window.getSelection();
    if (!oSel || oSel.rangeCount === 0) return null;
    var oRange = oSel.getRangeAt(0);
    if (oRange.collapsed) return null;
    var oContainer = oRange.commonAncestorContainer;
    var oHost = (oContainer.nodeType === 3 ? oContainer.parentElement : oContainer);
    oHost = oHost && oHost.closest ? oHost.closest('.clsMcshvT') : null;
    if (!oHost) return null;
    var oPre = document.createRange();
    oPre.selectNodeContents(oHost);
    oPre.setEnd(oRange.startContainer, oRange.startOffset);
    var nStart = oPre.toString().length;
    var nEnd = nStart + oRange.toString().length;
    var sFull = oHost.textContent;
    return { host: oHost, start: nStart, end: nEnd, before: sFull.slice(0, nStart), sel: sFull.slice(nStart, nEnd), after: sFull.slice(nEnd) };
  }

  // Apply new inner markup to the focused core: update the DOM optimistically,
  // tell the extension to mirror it into the unsaved document, then re-annotate
  // so ordinals stay correct for the next edit.
  function fReplaceCore(host, before, mid, after) {
    var sOldDec = host.dataset.orig != null ? host.dataset.orig : host.textContent;
    var sMarkup = fEsc(before) + mid + fEsc(after);
    host.innerHTML = sMarkup;
    fPost({ type: 'replace', id: host.dataset.id, ord: +host.dataset.ord, oldDec: sOldDec, text: sMarkup });
    fReannotate();
  }

  // Clicking the chrome's "..." menu lives in the parent webview, which blurs the
  // iframe and can collapse the selection. Remember the last non-empty in-span
  // selection so Format commands still have something to act on.
  var oStashedSel = null;
  var oPendingUrlSel = null;   // selection captured for cmdUrl while the host shows its input box
  document.addEventListener('selectionchange', function () { var s = fSelectionInSpan(); if (s) oStashedSel = s; });
  function fGetSel() {
    var s = fSelectionInSpan();
    if (s) { oStashedSel = s; return s; }
    if (oStashedSel && document.body.contains(oStashedSel.host)) return oStashedSel;
    return null;
  }

  function fInsertChar(sText) {          // insert a verbatim string at the caret (menu Character items)
    var c = fCaretInSpan();
    if (!c) return fNotify('click a line first');
    fReplaceCore(c.host, c.before, sText, c.after);
  }

  var oCommands = {
    cmdBold: function () { var s = fGetSel(); if (!s) return fNotify('select some text first'); fReplaceCore(s.host, s.before, '<strong>' + fEsc(s.sel) + '</strong>', s.after); },
    cmdRed: function () { var s = fGetSel(); if (!s) return fNotify('select some text first'); fReplaceCore(s.host, s.before, '<span class="clsColorRed">' + fEsc(s.sel) + '</span>', s.after); },
    cmdGreen: function () { var s = fGetSel(); if (!s) return fNotify('select some text first'); fReplaceCore(s.host, s.before, '<span class="clsColorGreen">' + fEsc(s.sel) + '</span>', s.after); },
    cmdUrl: function () {
      var s = fGetSel(); if (!s) return fNotify('select the link text first');
      oPendingUrlSel = s;                                   // window.prompt is blocked in a cross-origin iframe,
      fPost({ type: 'promptUrl', value: '../' });    // so ask the host (VS Code showInputBox) for the href
    },
    // Add / remove a <br> marker-line. These shift ordinals, so the extension
    // applies the edit and saves; the frame reloads canonically. Stash the caret
    // line + scroll first so we land back where we were.
    cmdAddLine: function () { if (!oLastSpan) return fNotify('click a line first'); fSaveState(oLastSpan); fPost({ type: 'structure', op: 'lineAfter', id: oLastSpan.dataset.id, ord: +oLastSpan.dataset.ord }); },
    cmdRemoveLine: function () { if (!oLastSpan) return fNotify('click a line first'); fSaveState(oLastSpan); fPost({ type: 'structure', op: 'lineDelete', id: oLastSpan.dataset.id, ord: +oLastSpan.dataset.ord }); },
    // Character inserts (also on chords ctrl+alt+c …) — insert verbatim at the caret.
    cmdCharArrow1: function () { fInsertChar('⭢'); },
    cmdCharArrow2: function () { fInsertChar('⇒'); },
    cmdCharHtmlGt: function () { fInsertChar('&gt;'); },
    cmdCharHtmlLt: function () { fInsertChar('&lt;'); },
    cmdCharHtmlNbsp: function () { fInsertChar('&nbsp;'); },
    cmdCharHitpMain: function () { fInsertChar('!⇒'); },
  };

  // --- keyboard shortcuts inside the viewer ----------------------------------
  // The iframe swallows VS Code keybindings, so the wrap/insert subset of the
  // user's chords is reproduced here. The extension parses keybindings.json and
  // pushes the chord map ({type:'shortcuts'}); a built-in default applies until
  // then. Each acts on the focused core via fReplaceCore (same path as the ...
  // menu): a wrap escapes the live selection into the snippet template; an insert
  // drops a verbatim string at the caret (so '&gt;' lands as an entity).

  // Caret split inside the focused core: { host, before, sel:'', after }.
  // Falls back to the end of the last-focused core when there is no in-core caret.
  function fCaretInSpan() {
    var oSel = window.getSelection();
    if (oSel && oSel.rangeCount) {
      var oRange = oSel.getRangeAt(0);
      var oNode = oRange.startContainer;
      var oHost = (oNode.nodeType === 3 ? oNode.parentElement : oNode);
      oHost = oHost && oHost.closest ? oHost.closest('.clsMcshvT') : null;
      if (oHost) {
        var oPre = document.createRange();
        oPre.selectNodeContents(oHost);
        oPre.setEnd(oRange.startContainer, oRange.startOffset);
        var nAt = oPre.toString().length;
        var sFull = oHost.textContent;
        return { host: oHost, before: sFull.slice(0, nAt), sel: '', after: sFull.slice(nAt) };
      }
    }
    if (oLastSpan && document.body.contains(oLastSpan)) {
      var sText = oLastSpan.textContent;
      return { host: oLastSpan, before: sText, sel: '', after: '' };
    }
    return null;
  }

  // Expand VS Code snippet date variables at press time; leftover placeholders /
  // tabstops we don't support are stripped.
  function fExpandDates(sIn) {
    if (sIn.indexOf('${CURRENT_') < 0) return sIn;
    var d = new Date(), f2 = function (n) { return (n < 10 ? '0' : '') + n; };
    return sIn
      .split('${CURRENT_YEAR}').join(String(d.getFullYear()))
      .split('${CURRENT_MONTH}').join(f2(d.getMonth() + 1))
      .split('${CURRENT_DATE}').join(f2(d.getDate()))
      .split('${CURRENT_HOUR}').join(f2(d.getHours()))
      .split('${CURRENT_MINUTE}').join(f2(d.getMinutes()))
      .split('${CURRENT_SECOND}').join(f2(d.getSeconds()));
  }
  function fExpandTpl(sTpl, sSel) {                         // snippet wrap: selection -> escaped
    return fExpandDates(sTpl).split('${TM_SELECTED_TEXT}').join(fEsc(sSel)).replace(/\$\{[^}]*\}/g, '').replace(/\$\d+/g, '');
  }
  function fExpandInsert(sText) {                           // verbatim insert (entities kept)
    return fExpandDates(sText).replace(/\$\{[^}]*\}/g, '').replace(/\$\d+/g, '');
  }

  // Build the chord -> action map from a data list. A `wrap` entry needs a
  // selection and substitutes it into the snippet template; an `insert` entry
  // drops its (date-expanded) text verbatim at the caret. `oChordCmds` is
  // reassigned wholesale whenever the extension pushes a fresh parsed list.
  var oChordCmds = {};
  // Chords that relay a command to the host (extension) instead of editing text.
  // The iframe swallows VS Code keybindings, so these are reproduced here and
  // posted up; not derivable from keybindings.json (non-type/insertSnippet cmds).
  var oHostChords = { 'ctrl+alt+p o': 'open', 'ctrl+alt+p x u': 'indexUpload', 'ctrl+alt+p x o': 'indexOnly', 'ctrl+alt+p k m': 'newFile' };   // relayed to the host
  function fSetChords(aList) {
    var o = {};
    (aList || []).forEach(function (oE) {
      if (!oE || !oE.chord) return;
      if (oE.kind === 'wrap') {
        o[oE.chord] = (function (sTpl) { return function () {
          var s = fGetSel();
          if (!s || s.sel === '') return fNotify('select some text first');
          fReplaceCore(s.host, s.before, fExpandTpl(sTpl, s.sel), s.after);
        }; })(oE.tpl);
      } else if (oE.kind === 'insert') {
        o[oE.chord] = (function (sText) { return function () {
          var c = fCaretInSpan();
          if (!c) return fNotify('click a line first');
          fReplaceCore(c.host, c.before, fExpandInsert(sText), c.after);
        }; })(oE.text);
      }
    });
    oChordCmds = o;
  }

  // Built-in fallback — used until (and if) the extension pushes the map it
  // parsed from keybindings.json (see the `shortcuts` message below).
  fSetChords([
    { chord: 'ctrl+alt+h b', kind: 'wrap', tpl: '<strong>${TM_SELECTED_TEXT}</strong>' },
    { chord: 'ctrl+alt+h c d', kind: 'wrap', tpl: '<code>${TM_SELECTED_TEXT}</code>' },
    { chord: 'ctrl+alt+p c b', kind: 'wrap', tpl: '<span class="clsColorBlue">${TM_SELECTED_TEXT}</span>' },
    { chord: 'ctrl+alt+p c g', kind: 'wrap', tpl: '<span class="clsColorGreen">${TM_SELECTED_TEXT}</span>' },
    { chord: 'ctrl+alt+p c r', kind: 'wrap', tpl: '<span class="clsColorRed">${TM_SELECTED_TEXT}</span>' },
    { chord: 'ctrl+alt+p f u', kind: 'wrap', tpl: '<span class="clsU">${TM_SELECTED_TEXT}</span>' },
    { chord: 'ctrl+alt+c l', kind: 'wrap', tpl: '⟨${TM_SELECTED_TEXT}⟩' },
    { chord: 'ctrl+alt+p s a', kind: 'wrap', tpl: '_sntxArgt:[${TM_SELECTED_TEXT}]' },
    { chord: 'ctrl+alt+p s c', kind: 'wrap', tpl: '_sntxCause:[${TM_SELECTED_TEXT}]' },
    { chord: 'ctrl+alt+p s d', kind: 'wrap', tpl: '_sntxDirection:[${TM_SELECTED_TEXT}]' },
    { chord: 'ctrl+alt+p s e', kind: 'wrap', tpl: '_sntxEffect:[${TM_SELECTED_TEXT}]' },
    { chord: 'ctrl+alt+p s f', kind: 'wrap', tpl: '_sntxFreq:[${TM_SELECTED_TEXT}]' },
    { chord: 'ctrl+alt+p s g', kind: 'wrap', tpl: '_sntxGoal:[${TM_SELECTED_TEXT}]' },
    { chord: 'ctrl+alt+p s m', kind: 'wrap', tpl: '_sntxManner:[${TM_SELECTED_TEXT}]' },
    { chord: 'ctrl+alt+p s s', kind: 'wrap', tpl: '_sntxSubj:[${TM_SELECTED_TEXT}]' },
    { chord: 'ctrl+alt+p s k', kind: 'wrap', tpl: '_sntxSbjc:[${TM_SELECTED_TEXT}]' },
    { chord: 'ctrl+alt+p s t', kind: 'wrap', tpl: '_sntxTime:[${TM_SELECTED_TEXT}]' },
    { chord: 'ctrl+alt+p s o', kind: 'wrap', tpl: '_sntxObj1:[${TM_SELECTED_TEXT}]' },
    { chord: 'ctrl+alt+p s u', kind: 'wrap', tpl: '_sntxOutput:[${TM_SELECTED_TEXT}]' },
    { chord: 'ctrl+alt+p s p', kind: 'wrap', tpl: '_sntxSpace:[${TM_SELECTED_TEXT}]' },
    { chord: 'ctrl+alt+p s q', kind: 'wrap', tpl: '_sntxQuant:[${TM_SELECTED_TEXT}]' },
    { chord: 'ctrl+alt+p s v', kind: 'wrap', tpl: '_sntxVerb:{${TM_SELECTED_TEXT}}' },
    { chord: 'ctrl+alt+p l s', kind: 'wrap', tpl: '<a class="clsPreview" href="#${TM_SELECTED_TEXT}">${TM_SELECTED_TEXT}</a>' },
    { chord: 'ctrl+alt+c a 1', kind: 'insert', text: '⭢' },
    { chord: 'ctrl+alt+c a 2', kind: 'insert', text: '⇒' },
    { chord: 'ctrl+alt+c h g', kind: 'insert', text: '&gt;' },
    { chord: 'ctrl+alt+c h l', kind: 'insert', text: '&lt;' },
    { chord: 'ctrl+alt+c h s', kind: 'insert', text: '&nbsp;' },
    { chord: 'ctrl+alt+c p e', kind: 'insert', text: '!=' },
    { chord: 'ctrl+alt+c p m', kind: 'insert', text: '!⇒' },
    { chord: 'ctrl+alt+p d', kind: 'insert', text: '{${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}} ' },
  ]);

  // Chord matcher: `ctrl+alt+<k>` then plain follow-up keys, VS-Code style.
  var sChordBuf = '', nChordTimer = null;
  function fChordReset() { sChordBuf = ''; if (nChordTimer) { clearTimeout(nChordTimer); nChordTimer = null; } }
  function fChordArm() { if (nChordTimer) clearTimeout(nChordTimer); nChordTimer = setTimeout(fChordReset, 1500); }
  function fChordIsPrefix(sBuf) {
    for (var k in oChordCmds) { if (k.indexOf(sBuf + ' ') === 0) return true; }
    for (var h in oHostChords) { if (h.indexOf(sBuf + ' ') === 0) return true; }
    return false;
  }
  document.addEventListener('keydown', function (e) {
    var sKey = (e.key || '').toLowerCase();
    if (sKey === 'control' || sKey === 'alt' || sKey === 'shift' || sKey === 'meta') return;
    if (sKey === 'escape') { if (sChordBuf) fChordReset(); return; }

    var sTok;
    if (sChordBuf) {
      sTok = sChordBuf + ' ' + sKey;                        // continuation (plain key)
    } else {
      if (!(e.ctrlKey && e.altKey && !e.shiftKey && !e.metaKey)) return; // must start ctrl+alt
      sTok = 'ctrl+alt+' + sKey;
    }

    var bHost = Object.prototype.hasOwnProperty.call(oHostChords, sTok);
    var bExact = bHost || Object.prototype.hasOwnProperty.call(oChordCmds, sTok);
    var bPrefix = fChordIsPrefix(sTok);
    if (!bExact && !bPrefix) { if (sChordBuf) { e.preventDefault(); fChordReset(); } return; }

    e.preventDefault(); e.stopPropagation();
    if (bExact) {
      fChordReset();
      if (bHost) { fPost({ type: oHostChords[sTok] }); return; }   // relay to the host (extension)
      var fCmd = oChordCmds[sTok];
      try { fCmd(); } catch (err) { fPost({ type: 'bridgeError', message: String(err && err.message || err) }); }
    } else {
      sChordBuf = sTok; fChordArm();
    }
  }, true);

  // --- caret/scroll survive the reload that follows a structural op ----------
  function fSaveState(host) {
    try {
      sessionStorage.setItem('mcshvScroll', String(window.scrollY || window.pageYOffset || 0));
      if (host) sessionStorage.setItem('mcshvAnchor', host.dataset.id + '|' + host.dataset.ord + '|' + Date.now());
    } catch (e) {}
  }
  function fPlaceCaretEnd(el) {
    try { var r = document.createRange(); r.selectNodeContents(el); r.collapse(false); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
  }
  // Scroll the current URL #hash target (id) into view.
  function fScrollHash() {
    if (!location.hash) return;
    var sId = location.hash.slice(1);
    try { sId = decodeURIComponent(sId); } catch (e) {}
    var oEl = document.getElementById(sId);
    if (oEl) oEl.scrollIntoView(true);
  }
  // Decide ONCE per load where to land, then re-apply it a few times because the
  // font-scale (0/250/800ms) and split-fix reflow the page after the first pass:
  //  - 'anchor' : structural/Save reload → the edited line (fSaveState wrote it). Wins over #hash.
  //  - 'hash'   : fresh nav or ⟳ reload to file#name (no edit anchor) → honor the URL hash.
  //  - 'scroll' : hashless nav/reload → restore the saved scroll position.
  var oLanding = null;
  function fDecideLanding() {
    var a = sessionStorage.getItem('mcshvAnchor'), sSc = sessionStorage.getItem('mcshvScroll');
    if (a) {
      sessionStorage.removeItem('mcshvAnchor');
      var p = a.split('|');
      if (Date.now() - (+p[2]) < 15000) return { kind: 'anchor', id: p[0], ord: p[1] };
    }
    if (location.hash) return { kind: 'hash' };
    if (sSc != null) return { kind: 'scroll', y: parseInt(sSc, 10) || 0 };
    return null;
  }
  function fApplyLanding() {
    try {
      if (!oLanding) return;
      if (oLanding.kind === 'anchor') {
        var oEl = document.querySelector('.clsMcshvT[data-id="' + oLanding.id + '"][data-ord="' + oLanding.ord + '"]');
        if (oEl) { oEl.scrollIntoView({ block: 'center' }); fPlaceCaretEnd(oEl); oEl.focus({ preventScroll: true }); }
      } else if (oLanding.kind === 'hash') { fScrollHash(); }
      else if (oLanding.kind === 'scroll') { window.scrollTo(0, oLanding.y); }
    } catch (e) {}
  }
  function fRestoreState() { oLanding = fDecideLanding(); fApplyLanding(); }
  var nScrollT;
  window.addEventListener('scroll', function () {
    if (nScrollT) return;
    nScrollT = setTimeout(function () { nScrollT = null; try { sessionStorage.setItem('mcshvScroll', String(window.scrollY || 0)); } catch (e) {} }, 150);
  }, { passive: true });

  // --- keep ToC/content split correct for the frame width (from mMcshEdit) ----
  var oMcshMod = null;
  import('../../mMcsh2.js').then(function (m) { oMcshMod = m; fFixSplit(); }).catch(function () {});
  function fFixSplit() {
    var oMain = document.getElementById('idCnrMainDiv');
    var oInfo = document.getElementById('idCnrMainInfoDiv');
    var oContent = document.getElementById('idCnrMainContentDiv');
    if (!oMain || !oInfo || !oContent) return;
    var nFrame = oMain.clientWidth; if (!nFrame) return;
    var nPct;
    if (oMcshMod && typeof oMcshMod.nCfgPageinfoWidth === 'number') nPct = oMcshMod.nCfgPageinfoWidth;
    else { var nOw = window.outerWidth; if (!nOw || nOw <= 0) return; var nCur = parseFloat(oInfo.style.width); if (isNaN(nCur)) nCur = oInfo.offsetWidth; nPct = nCur / nOw * 100; }
    if (nPct < 0) nPct = 0; else if (nPct > 100) nPct = 100;
    var nIw = Math.round(nFrame * nPct / 100), sIwS = nIw + 'px', sCwS = (nFrame - nIw) + 'px';
    if (oInfo.style.width !== sIwS) oInfo.style.width = sIwS;
    if (oContent.style.width !== sCwS) oContent.style.width = sCwS;
    if (oContent.style.left !== sIwS) oContent.style.left = sIwS;
  }
  function fWatchSplit() {
    var oInfo = document.getElementById('idCnrMainInfoDiv');
    var oContent = document.getElementById('idCnrMainContentDiv');
    if (!oInfo || !oContent || fWatchSplit.done) return;
    fWatchSplit.done = true;
    var oMo = new MutationObserver(function () { fFixSplit(); });
    oMo.observe(oInfo, { attributes: true, attributeFilter: ['style'] });
    oMo.observe(oContent, { attributes: true, attributeFilter: ['style'] });
    window.addEventListener('resize', function () { setTimeout(fFixSplit, 0); });
  }

  // Ctrl+K Ctrl+M chord → maximize/restore the editor group. VS Code can't see keys
  // typed into a focused webview, so reproduce the chord here and relay it to the host.
  var bCtrlK = false, nCtrlKT = null;
  document.addEventListener('keydown', function (e) {
    var sK = (e.key || '').toLowerCase();
    if (sK === 'control' || sK === 'meta' || sK === 'shift' || sK === 'alt') return;
    if (bCtrlK) {
      bCtrlK = false; if (nCtrlKT) { clearTimeout(nCtrlKT); nCtrlKT = null; }
      if ((e.ctrlKey || e.metaKey) && (sK === 'm' || e.code === 'KeyM')) {
        e.preventDefault(); e.stopPropagation(); fPost({ type: 'maximizeGroup' });
      }
      return;                               // Ctrl+K + anything else: chord aborted
    }
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (sK === 'k' || e.code === 'KeyK')) {
      e.preventDefault(); e.stopPropagation();
      bCtrlK = true; nCtrlKT = setTimeout(function () { bCtrlK = false; }, 1500);
    }
  }, true);

  // Ctrl+S / Cmd+S saves via the host (not the browser's "save page"). Commit the
  // focused core first (commit is on blur), then ask the extension to save.
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      var oAe = document.activeElement;
      if (oAe && oAe.classList && oAe.classList.contains('clsMcshvT')) {
        oAe.blur();
        setTimeout(function () { fPost({ type: 'save' }); }, 80);   // let the edit apply first
      } else {
        fPost({ type: 'save' });
      }
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();                 // Ctrl+Shift+P → VS Code Command Palette (iframe swallows it otherwise)
      fPost({ type: 'cmdPalette' });
    }
  }, true);

  // Clicking anywhere in the page (this iframe) should dismiss the chrome's ...
  // menu. A parent-window `blur` doesn't fire when focus moves into a child
  // iframe, so the chrome can't detect it — tell it from here.
  document.addEventListener('mousedown', function (e) {
    fPost({ type: 'closeMenu' });
    // Dismiss the preview popup on an outside click (but not when clicking a preview
    // link or inside the popup — nested preview links keep working).
    var t = e.target, oPv = oMcshMod && oMcshMod.oEltCnrPreviewDiv;
    var bInLink = t && t.closest && t.closest('a.clsPreview');
    var bInPv = oPv && t && oPv.contains && oPv.contains(t);
    if (!bInLink && !bInPv && oPv && oPv.style.display !== 'none') {
      oPv.style.display = 'none';
      if (oPrevA) { oPrevA.__mcshvPrev = false; oPrevA = null; }
    }
  }, true);

  // Navigation: let link-icons take you to other local pages (carrying ?mcshv=1
  // so the bridge follows), while leaving in-page #hash links to mMcsh2. External
  // links load view-only.
  function fWithMcshvFlag(absHref) {
    var sHash = '', h = absHref.indexOf('#');
    if (h >= 0) { sHash = absHref.slice(h); absHref = absHref.slice(0, h); }
    if (!/[?&]mcshv=/.test(absHref)) absHref += (absHref.indexOf('?') < 0 ? '?' : '&') + 'mcshv=1';
    return absHref + sHash;
  }
  // --- cyan preview-links: behave like the public site (mMcsh2 fEvtPreview) ----
  // tap/click → preview (1st = popup, 2nd on the same link = navigate); Alt+click
  // or long-press → edit the link text inline. Applies in content AND in search
  // results (both are <a class="clsPreview">).
  var oPrevA = null;
  function fHidePreview() { try { if (oMcshMod && oMcshMod.oEltCnrPreviewDiv) oMcshMod.oEltCnrPreviewDiv.style.display = 'none'; } catch (e) {} }
  function fNavigateLink(a) {
    var sHref = a.getAttribute('href') || '';
    if (a.origin && a.origin !== location.origin) { location.assign(a.href); return; }               // external
    if (/^#/.test(sHref) || a.href.split('#')[0] === location.href.split('#')[0]) { location.hash = a.href.split('#')[1] || ''; return; } // same page
    location.assign(fWithMcshvFlag(a.href));                                                           // other local page, keep editing
  }
  function fPreviewLink(a, nPageX) {
    if (oPrevA && oPrevA !== a) oPrevA.__mcshvPrev = false;
    if (a.__mcshvPrev) { a.__mcshvPrev = false; oPrevA = null; fHidePreview(); fNavigateLink(a); return; } // 2nd click → navigate
    if (!(oMcshMod && oMcshMod.fEvtPreview)) { fNavigateLink(a); return; }                              // module not ready → navigate
    oPrevA = a; a.__mcshvPrev = true;
    var sMode = a.closest('#idCnrMainContentDiv') ? 'sContent' : '';                                    // popup sizing like the site
    oMcshMod.fEvtPreview({ target: a, pageX: nPageX || 0, preventDefault: function () {}, stopPropagation: function () {} }, sMode);
  }

  // Long-press (touch or mouse) marks the upcoming click as an edit, not a preview.
  var bLongPress = false, nLpTimer = null;
  document.addEventListener('pointerdown', function (e) {
    bLongPress = false; if (nLpTimer) { clearTimeout(nLpTimer); nLpTimer = null; }
    var a = e.target && e.target.closest ? e.target.closest('a.clsPreview') : null;
    if (!a) return;
    nLpTimer = setTimeout(function () {
      bLongPress = true;                                    // next click edits instead of previewing
      var oSpan = e.target.closest && e.target.closest('.clsMcshvT');
      if (oSpan) { try { oSpan.focus(); } catch (x) {} }
    }, 500);
  }, true);
  var fLpCancel = function () { if (nLpTimer) { clearTimeout(nLpTimer); nLpTimer = null; } };
  document.addEventListener('pointerup', fLpCancel, true);
  document.addEventListener('pointermove', fLpCancel, true);
  document.addEventListener('pointercancel', fLpCancel, true);

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    // Cyan preview-links: preview (or edit on Alt+click / long-press).
    if (a.classList && a.classList.contains('clsPreview')) {
      if (e.altKey || bLongPress) { bLongPress = false; e.preventDefault(); return; } // edit: keep caret, block nav
      e.preventDefault(); e.stopPropagation();
      fPreviewLink(a, e.pageX);
      return;
    }
    var sHref = a.getAttribute('href');
    if (!sHref) { e.preventDefault(); return; }             // js/empty anchors: no-op
    var sAbs = a.href;                                       // resolved absolute URL
    // Same page, only a #hash differs → let mMcsh2 handle the in-page jump.
    if (/^#/.test(sHref) || sAbs.split('#')[0] === location.href.split('#')[0]) return;
    if (a.origin && a.origin !== location.origin) return;   // external → default (view-only)
    e.preventDefault();
    location.assign(fWithMcshvFlag(sAbs));                   // go to the local page, keep editing on
  }, true);

  // Report our current address to the host (URL bar + retarget the edit file),
  // on the initial load and after every navigation (each nav reloads the page).
  function fCleanHref() {
    var sUrl = location.href, sHash = '', h = sUrl.indexOf('#');
    if (h >= 0) { sHash = sUrl.slice(h); sUrl = sUrl.slice(0, h); }
    sUrl = sUrl.replace(/[?&]mcshv=1\b/g, '').replace(/[?&]_r=\d+/g, '').replace(/[?&]+$/, '');
    return sUrl + sHash;
  }
  // Add a fresh cache-buster: strip ALL existing _r first (global) and insert
  // before the #hash, so reloads never accumulate ...&_r=..&_r=..
  function fBust(url) {
    var sHash = '', h = url.indexOf('#');
    if (h >= 0) { sHash = url.slice(h); url = url.slice(0, h); }
    url = url.replace(/[?&]_r=\d+/g, '');
    url += (url.indexOf('?') < 0 ? '?' : '&') + '_r=' + Date.now();
    return url + sHash;
  }
  // Clicking a permalink link-icon jumps to #id (a hash change, not a reload), so
  // report it so the address bar reflects the location — without retargeting.
  window.addEventListener('hashchange', function () { fPost({ type: 'url', href: fCleanHref() }); });

  // Highlight editable cores.
  var oCss = document.createElement('style');
  oCss.textContent = '.clsMcshvT:hover{outline:1px dashed #4aa3ff;outline-offset:1px;cursor:text}.clsMcshvT:focus{outline:2px solid #4aa3ff;outline-offset:1px;background:rgba(74,163,255,.12)}'
    + '.clsMcshvSync{background:rgba(74,163,255,.30);border-radius:2px;box-shadow:0 0 0 2px rgba(74,163,255,.30)}';
  document.head.appendChild(oCss);

  // Scale the document text to 90% (editor-only; no change to the site CSS). The
  // site sets font-sizes in px, so a % rule can't cascade — instead read each
  // element's computed size once and pin it to 0.9×. Read ALL sizes before
  // writing so scaling a parent never compounds into its children.
  var nFontScale = 0.9;
  function fScaleFonts() {
    if (fScaleFonts.done) return;
    var aEls = [];
    var aRoots = ['idCnrMainContentDiv', 'idCnrMainInfoDiv'];
    for (var r = 0; r < aRoots.length; r++) {
      var oRoot = document.getElementById(aRoots[r]);
      if (!oRoot) continue;
      aEls.push(oRoot);
      var d = oRoot.querySelectorAll('*');
      for (var i = 0; i < d.length; i++) aEls.push(d[i]);
    }
    if (!aEls.length) return;                                // page not built yet; retry later
    var aSizes = aEls.map(function (el) { return parseFloat(getComputedStyle(el).fontSize) || 0; });
    for (var j = 0; j < aEls.length; j++) if (aSizes[j]) aEls[j].style.fontSize = (aSizes[j] * nFontScale) + 'px';
    fScaleFonts.done = true;
  }

  // --- messages from the extension (relayed via the chrome) ------------------
  var bAnnotated = false;
  function fDoAnnotate(ids) {
    oSetValidIds = ids;
    if (!bAnnotated) { bAnnotated = true; fAnnotate(); fFixSplit(); fWatchSplit(); setTimeout(fFixSplit, 120); setTimeout(fFixSplit, 400); }
    else { /* ids refreshed after external change / reload */ fReannotate(); }
    fNotify(document.querySelectorAll('.clsMcshvT').length + ' editable');
    fRestoreState();                  // decide the landing (edit line / #hash / scroll) and apply it
    setTimeout(fApplyLanding, 60);    // beat mMcsh2's own location.hash scroll
    setTimeout(fApplyLanding, 900);   // re-apply after the 800ms font-scale + split reflow settles
  }
  window.addEventListener('message', function (e) {
    var d = e.data; if (!d || d.source !== 'mcshv-host') return;
    if (d.type === 'ids') fDoAnnotate(new Set(d.ids || []));
    else if (d.type === 'shortcuts') { if (Array.isArray(d.list) && d.list.length) fSetChords(d.list); } // auto-synced from keybindings.json
    else if (d.type === 'cmd') { if (oCommands[d.cmd]) oCommands[d.cmd](); }
    // Host returned the href from its input box (cmdUrl) → wrap the stashed selection.
    else if (d.type === 'applyUrl') {
      var oSel = oPendingUrlSel; oPendingUrlSel = null;
      if (oSel && d.href) fReplaceCore(oSel.host, oSel.before, '<a class="clsPreview" href="' + fEscAttr(d.href) + '">' + fEsc(oSel.sel) + '</a>', oSel.after);
    }
    // Back/Forward are driven here (same-origin) because the parent can't touch
    // our cross-origin history.
    else if (d.type === 'histBack') { try { history.back(); } catch (e2) {} }
    else if (d.type === 'histFwd') { try { history.forward(); } catch (e2) {} }
    // Reload that REPLACES the current history entry (no pollution for Back) and
    // cache-busts so freshly-saved bytes show up.
    else if (d.type === 'reloadPage') {
      // Save/structural reload (keepPlace !== false): remember the edit line so we land
      // back on it. The ⟳ button sends keepPlace:false → no anchor, so the URL #hash wins
      // and the reload lands on #name (like a browser reload).
      if (d.keepPlace !== false) fSaveState(document.querySelector('.clsMcshvT:focus') || oLastSpan);
      try { location.replace(fBust(location.href)); } catch (e2) { location.reload(); }
    }
    // source -> visual: scroll the matching core into view and flash it.
    else if (d.type === 'syncTo') {
      var oEl = document.querySelector('.clsMcshvT[data-id="' + d.id + '"][data-ord="' + d.ord + '"]');
      if (oEl) {
        oEl.scrollIntoView({ block: 'center' });
        oEl.classList.add('clsMcshvSync');
        clearTimeout(oEl.__syncT);
        oEl.__syncT = setTimeout(function () { oEl.classList.remove('clsMcshvSync'); }, 800);
      }
    }
  });

  // --- go --------------------------------------------------------------------
  function fStart() {
    try {
      fPost({ type: 'ready' });
      fPost({ type: 'nav', href: fCleanHref() });   // URL bar + retarget edit file
      setTimeout(fScaleFonts, 0); setTimeout(fScaleFonts, 250); setTimeout(fScaleFonts, 800); // shrink text to 90%
      if (!oParent) setTimeout(function () { if (!bAnnotated) { bAnnotated = true; fAnnotate(); } }, 50);
      else setTimeout(function () { if (!bAnnotated) { bAnnotated = true; fAnnotate(); } }, 2500); // fallback
    } catch (err) { fPost({ type: 'bridgeError', message: String(err && err.message || err) }); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(fStart, 0); });
  else setTimeout(fStart, 0);
}
