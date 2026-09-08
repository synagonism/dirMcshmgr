/**
 * reporter.js
 * Collects issues and prints a summary report.
 * Can also write JSON and HTML reports.
 *
 * Issue object shape (from structural.js / ai-checks.js):
 *   { sLevel, sCode, sNameFile, sConcept, sIdConcept, nLine, sMessage }
 */

import fs from 'fs';
import path from 'path';

const oLevelIcon  = { ERROR: '❌', WARN: '⚠️ ', INFO: 'ℹ️ ' };
const oLevelOrder = { ERROR: 0, WARN: 1, INFO: 2 };

/** Normalize an issue's concept to a title string.
 *  structural.js stores it as a string; ai-checks may store the section object. */
function fTitleConcept(oConcept) {
  if (oConcept == null) return null;
  return typeof oConcept === 'string' ? oConcept : (oConcept.sNameTitle ?? null);
}

export function fReporter() {
  const aoIssue = [];

  function fAdd(oIssue) {
    if (oIssue) aoIssue.push(oIssue);
  }

  function fAddAll(aoIn) {
    for (const oIssue of aoIn) fAdd(oIssue);
  }

  const fError = () => aoIssue.filter(oIssue => oIssue.sLevel === 'ERROR');
  const fWarn  = () => aoIssue.filter(oIssue => oIssue.sLevel === 'WARN');
  const fInfo  = () => aoIssue.filter(oIssue => oIssue.sLevel === 'INFO');

  function fPrint() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Results');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (aoIssue.length === 0) {
      console.log('✅  No issues found!\n');
      return;
    }

    // Group by file
    const oMapByFile = new Map();
    for (const oIssue of aoIssue) {
      const sKey = oIssue.sNameFile ?? '(global)';
      if (!oMapByFile.has(sKey)) oMapByFile.set(sKey, []);
      oMapByFile.get(sKey).push(oIssue);
    }

    // Print sorted: errors first, then warnings, then info
    const aFileSorted = [...oMapByFile.keys()].sort();
    for (const sFile of aFileSorted) {
      const aoIssueFile = oMapByFile.get(sFile).sort(
        (oA, oB) => oLevelOrder[oA.sLevel] - oLevelOrder[oB.sLevel]
      );
      console.log(`📄 ${sFile}`);
      for (const oIssue of aoIssueFile) {
        const sLoc = oIssue.nLine ? `:${oIssue.nLine}` : '';
        const sIcon = oLevelIcon[oIssue.sLevel];
        const sCode = `[${oIssue.sCode}]`.padEnd(6);
        console.log(`   ${sIcon} ${sCode}  ${oIssue.sMessage}${sLoc ? `  (line ${oIssue.nLine})` : ''}`);
      }
      console.log();
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  SUMMARY: ${fError().length} errors  |  ${fWarn().length} warnings  |  ${fInfo().length} info`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Hint about report files
    console.log('💡 HTML report written to dirMcshmgr/dirValid/validator-report.html\n');
  }

  function fSaveHtml(sPathOut) {
    const sRows = aoIssue.map(oIssue => {
      const sLevel = oIssue.sLevel;
      const sClassRow = sLevel === 'ERROR' ? 'err' : sLevel === 'WARN' ? 'wrn' : 'inf';
      return `<tr class="${sClassRow}">
        <td>${sLevel}</td>
        <td>${oIssue.sCode}</td>
        <td>${fEsc(oIssue.sNameFile ?? '')}</td>
        <td>${fEsc(fTitleConcept(oIssue.sConcept) ?? '')}</td>
        <td>${oIssue.nLine ?? ''}</td>
        <td>${fEsc(oIssue.sMessage)}</td>
      </tr>`;
    }).join('\n');

    const sHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MCS Consistency Report</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; color: #222; }
  h1 { font-size: 1.4rem; }
  .summary { display: flex; gap: 2rem; margin: 1rem 0; font-size: 1.1rem; }
  .summary span { font-weight: bold; }
  table { border-collapse: collapse; width: 100%; font-size: 0.85rem; }
  th { background: #f0f0f0; text-align: left; padding: 6px 10px; }
  td { padding: 5px 10px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  tr.err td:first-child { color: #c00; font-weight: bold; }
  tr.wrn td:first-child { color: #c60; font-weight: bold; }
  tr.inf td:first-child { color: #069; }
  td:last-child { max-width: 500px; }
  input { padding: 6px; width: 300px; margin-bottom: 1rem; }
</style>
</head>
<body>
<h1>MCS Consistency Report</h1>
<p>Generated: ${new Date().toLocaleString()}</p>
<div class="summary">
  <span style="color:#c00">❌ ${fError().length} errors</span>
  <span style="color:#c60">⚠️ ${fWarn().length} warnings</span>
  <span style="color:#069">ℹ️ ${fInfo().length} info</span>
</div>
<input type="text" id="filter" placeholder="Filter by file or message..." oninput="filterRows(this.value)">
<table>
  <thead>
    <tr><th>Level</th><th>Code</th><th>File</th><th>Concept</th><th>Line</th><th>Message</th></tr>
  </thead>
  <tbody id="tbody">
    ${sRows}
  </tbody>
</table>
<script>
function filterRows(q) {
  q = q.toLowerCase();
  document.querySelectorAll('#tbody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
</script>
</body>
</html>`;
    fs.writeFileSync(sPathOut, sHtml, 'utf8');
    console.log(`🌐 HTML report saved: ${sPathOut}`);
  }

  return { fAdd, fAddAll, fPrint, fSaveHtml };
}

function fEsc(sIn) {
  return String(sIn).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
