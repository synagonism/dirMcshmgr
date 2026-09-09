'use strict';
/*
 * mFormat.js — canonical serializer ("full" reformat) for Mcs|Hitp*.last.html docs.
 *
 * Re-indents the body to two levels (leading whitespace only — never content):
 *   • col 0     — document skeleton: <!doctype> <html> <head> <body> + closes
 *   • 2 spaces  — block elements: every <section> <header> <footer> <h1..9> <p>
 *                 <div>, block comments <!-- -->, and body-level <script> tags
 *                 (a <p> nested inside an open <div> indents to 4 instead)
 *   • 4 spaces  — EVERYTHING ELSE (<br> segments, clsHide tails, standalone
 *                 </p></hN></div></span>, table rows, wrapped inline links, ...)
 *   • <script> body — shifted so its outermost JS line sits at 4 spaces, with the
 *                 relative nesting preserved
 *   • <pre> elements and <ul class="clsTreeUl"> trees — kept BYTE-FOR-BYTE verbatim
 *                 (leading whitespace is semantic / shows the tree structure)
 *   • the <head>/prologue (before <body>) and blank lines — left as authored
 *
 * Because it only ever rewrites leading whitespace it is idempotent and, outside
 * <pre>, render-safe (HTML collapses inter-tag whitespace; the corpus has no
 * multi-line JS template literals, so shifting script indentation is safe too).
 */

/** Detect the dominant line ending so we round-trip CRLF files unchanged. */
function fDetect_Eol(text) {
  const nCrlf = (text.match(/\r\n/g) || []).length;
  const nLf = (text.match(/(^|[^\r])\n/g) || []).length;
  return nCrlf > nLf ? '\r\n' : '\n';
}

/**
 * Canonical indent for a normal body line — NOT `<script>`/`<pre>` (those, and
 * in-script/in-pre lines, are handled by the state machine in fFormat()).
 * @param {string} lower lower-cased, left-trimmed line
 * @returns {0|2|4}
 */
function fClassify(lower) {
  // 2-space block elements — checked first because '<head' is a prefix of '<header'.
  if (lower.startsWith('<section') || lower.startsWith('</section')) return 2;
  if (lower.startsWith('<header') || lower.startsWith('</header')) return 2;
  if (lower.startsWith('<footer') || lower.startsWith('</footer')) return 2;

  // Document skeleton — column 0.
  if (
    lower.startsWith('<!doctype') || lower.startsWith('<html') || lower.startsWith('</html') ||
    lower.startsWith('<head') || lower.startsWith('</head') ||
    lower.startsWith('<body') || lower.startsWith('</body')
  ) return 0;

  // Block openers: <h1..9> <p> <div> (real tag, not just a prefix) + block comment.
  if (/^<(h[1-9]|p|div)[\s>]/.test(lower) || /^<(h[1-9]|p|div)$/.test(lower)) return 2;
  if (lower.startsWith('<!--')) return 2;

  // Everything else → 4 spaces.
  return 4;
}

const fLeadLen = (s) => (s.match(/^[ \t]*/) || [''])[0].length;
/** Net <ul> nesting change on a line: opens − closes (for clsTreeUl trees). */
const fUlDelta = (lower) => (lower.match(/<ul[\s>]/g) || []).length - (lower.match(/<\/ul\s*>/g) || []).length;
/** Net <div> nesting change on a line: opens − closes (a <p> inside a div → 4). */
const fDivDelta = (lower) => (lower.match(/<div[\s>]/g) || []).length - (lower.match(/<\/div\s*>/g) || []).length;

/**
 * Re-indent one Mcsh|Hitp document to canonical form.
 * @param {string} source raw file contents
 * @returns {string}
 */
function fFormat(source) {
  const sEol = fDetect_Eol(source);
  const bHadTrailingNl = /\n$/.test(source);
  const aLines = source.split(/\r?\n/);
  if (bHadTrailingNl && aLines.length && aLines[aLines.length - 1] === '') aLines.pop();

  let bInHead = true;     // up to and including the <body ...> line: verbatim
  let bInPre = false;     // inside a <pre>…</pre>: verbatim
  let nTreeDepth = 0;     // >0 while inside a <ul class="clsTreeUl"> tree: verbatim
  let nDivDepth = 0;      // >0 while inside an open <div>: a <p> opener there → 4
  let aScriptBuf = null;  // collecting a <script> body (array of raw lines) or null

  const aOut = [];

  // Emit a collected <script> body shifted so its shallowest line sits at 4 spaces,
  // preserving relative nesting; blank lines stay blank.
  const fFlushScript = () => {
    let nMin = Infinity;
    for (const l of aScriptBuf) { if (l.trim() !== '') nMin = Math.min(nMin, fLeadLen(l)); }
    if (nMin === Infinity) nMin = 0;
    const nDelta = 4 - nMin;
    for (const l of aScriptBuf) {
      if (l.trim() === '') { aOut.push(''); continue; }
      const nLead = fLeadLen(l);
      aOut.push(' '.repeat(Math.max(0, nLead + nDelta)) + l.slice(nLead));
    }
    aScriptBuf = null;
  };

  for (const sLine of aLines) {
    const sStripped = sLine.replace(/^[ \t]+/, '');
    const sLower = sStripped.toLowerCase();

    if (bInHead) {
      aOut.push(sLine);
      if (sLower.startsWith('<body')) bInHead = false;
      continue;
    }

    if (bInPre) {                                  // verbatim until </pre>
      aOut.push(sLine);
      if (sLower.includes('</pre>')) bInPre = false;
      continue;
    }

    if (nTreeDepth > 0) {                          // preserve clsTreeUl tree verbatim
      aOut.push(sLine);
      nTreeDepth += fUlDelta(sLower);
      continue;
    }

    if (aScriptBuf) {                              // collecting a <script> body
      if (sLower.startsWith('</script')) { fFlushScript(); aOut.push('  ' + sStripped); }
      else aScriptBuf.push(sLine);
      continue;
    }

    if (sStripped === '') { aOut.push(''); continue; }

    if (sLower.startsWith('<pre')) {               // <pre> element: verbatim
      aOut.push(sLine);
      if (!sLower.includes('</pre>')) bInPre = true;
      continue;
    }

    if (sLower.startsWith('<ul') && sLower.includes('clstreeul')) {  // tree → verbatim
      aOut.push(sLine);
      nTreeDepth = fUlDelta(sLower);
      continue;
    }

    if (sLower.startsWith('<script')) {
      // A <script> sitting in inline content (e.g. the counter inside a <p>, at
      // source-indent ≥4) stays at 4; a body-level <script> tag → 2 and its body
      // is collected. Source indent distinguishes them and stays idempotent.
      if (fLeadLen(sLine) >= 4) {
        aOut.push('    ' + sStripped);
      } else {
        aOut.push('  ' + sStripped);
        if (!sLower.includes('</script>')) aScriptBuf = [];
      }
      continue;
    }

    const nInd0 = fClassify(sLower);
    // A <p> opener inside an open <div> nests one level deeper: 4 instead of 2.
    const bPara = /^<p[\s>]/.test(sLower) || sLower === '<p';
    const nInd = (nInd0 === 2 && bPara && nDivDepth > 0) ? 4 : nInd0;
    aOut.push((nInd ? ' '.repeat(nInd) : '') + sStripped);
    nDivDepth += fDivDelta(sLower);          // after classifying: the <div> opener itself stays 2
    if (nDivDepth < 0) nDivDepth = 0;
  }

  if (aScriptBuf) fFlushScript();                  // unterminated <script> (defensive)

  let sResult = aOut.join(sEol);
  if (bHadTrailingNl) sResult += sEol;
  return sResult;
}

module.exports = { fFormat, fDetect_Eol, fClassify };
