'use strict';
/*
 * test-format.js — prove the canonical re-indenter is safe.
 *
 *   node src/test-format.js            → summary across all dirCor/*.last.html
 *   node src/test-format.js --diff     → also print each changed line (before→after)
 *
 * Safety properties checked:
 *   1. Idempotent: fFormat(fFormat(x)) === fFormat(x).
 *   2. Content-preserving: stripping leading indentation from every line yields
 *      the SAME sequence for input and output (we only ever change indentation).
 */

const fs = require('fs');
const path = require('path');
const { fFormat } = require('./mFormat');

const bShowDiff = process.argv.includes('--diff');
const sDirCor = path.resolve(__dirname, '../../../dirMcsh/dirCor');

const aFiles = fs.readdirSync(sDirCor).filter((f) => f.endsWith('.last.html'));
let nTotalChanged = 0;
let nFailures = 0;

const fStripLead = (s) => s.split(/\r?\n/).map((l) => l.replace(/^[ \t]+/, ''));

for (const f of aFiles) {
  const p = path.join(sDirCor, f);
  const sSrc = fs.readFileSync(p, 'utf8');
  const sOut = fFormat(sSrc);

  // 1. idempotent
  const sTwice = fFormat(sOut);
  const bIdem = sTwice === sOut;

  // 2. content-preserving (same lines ignoring leading indent)
  const a = fStripLead(sSrc);
  const b = fStripLead(sOut);
  const bContentSame = a.length === b.length && a.every((l, i) => l === b[i]);

  // 3. pre-preserving: <pre> elements (and their opener line) carry SEMANTIC
  //    leading whitespace, so they must come through byte-for-byte. This is the
  //    one place where re-indenting would actually change meaning.
  let bPreOk = true;
  {
    const aSl = sSrc.split(/\r?\n/), aOl = sOut.split(/\r?\n/);
    let bHead = true, bInPre = false;
    for (let i = 0; i < aSl.length; i++) {
      const sLower = aSl[i].replace(/^[ \t]+/, '').toLowerCase();
      if (bHead) { if (sLower.startsWith('<body')) bHead = false; continue; }
      if (bInPre) {
        if (aSl[i] !== aOl[i]) { bPreOk = false; break; }
        if (sLower.includes('</pre>')) bInPre = false;
        continue;
      }
      if (sLower.startsWith('<pre')) {
        if (aSl[i] !== aOl[i]) { bPreOk = false; break; }
        if (!sLower.includes('</pre>')) bInPre = true;
      }
    }
  }

  // 4. tree-preserving: <ul class="clsTreeUl"> trees are verbatim (semantic indent).
  let bTreeOk = true;
  {
    const aSl = sSrc.split(/\r?\n/), aOl = sOut.split(/\r?\n/);
    let bHead = true, nDepth = 0;
    for (let i = 0; i < aSl.length; i++) {
      const sLower = aSl[i].replace(/^[ \t]+/, '').toLowerCase();
      if (bHead) { if (sLower.startsWith('<body')) bHead = false; continue; }
      const d = (sLower.match(/<ul[\s>]/g) || []).length - (sLower.match(/<\/ul\s*>/g) || []).length;
      if (nDepth > 0) {
        if (aSl[i] !== aOl[i]) { bTreeOk = false; break; }
        nDepth += d; continue;
      }
      if (sLower.startsWith('<ul') && sLower.includes('clstreeul')) {
        if (aSl[i] !== aOl[i]) { bTreeOk = false; break; }
        nDepth = d;
      }
    }
  }

  // count re-indented lines
  const aSrcLines = sSrc.split(/\r?\n/);
  const aOutLines = sOut.split(/\r?\n/);
  let nChanged = 0;
  const aDiffs = [];
  for (let i = 0; i < Math.max(aSrcLines.length, aOutLines.length); i++) {
    if (aSrcLines[i] !== aOutLines[i]) {
      nChanged++;
      if (bShowDiff) aDiffs.push(`  L${i + 1}\n    - ${JSON.stringify(aSrcLines[i])}\n    + ${JSON.stringify(aOutLines[i])}`);
    }
  }
  nTotalChanged += nChanged;

  const bOk = bIdem && bContentSame && bPreOk && bTreeOk;
  if (!bOk) nFailures++;
  const sFlag = bOk ? (nChanged ? '~' : '=') : '✗';
  console.log(`${sFlag} ${f}  (reindented ${nChanged} line${nChanged === 1 ? '' : 's'}${bIdem ? '' : ', NOT idempotent'}${bContentSame ? '' : ', CONTENT CHANGED!'}${bPreOk ? '' : ', PRE BROKEN!'}${bTreeOk ? '' : ', TREE BROKEN!'})`);
  if (bShowDiff && aDiffs.length) console.log(aDiffs.join('\n'));
}

console.log(`\n${aFiles.length} files · ${nTotalChanged} lines re-indented · ${nFailures} unsafe`);
process.exit(nFailures ? 1 : 0);
