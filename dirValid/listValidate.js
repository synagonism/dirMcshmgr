/**
 * listValidate.js — the-files of a-validate-list, for validatorMcsh.js and createMcsh.mjs --list.
 *
 * The-list (dirWorldview/dirManager/validate.txt) has one entry per line, relative to the-worldview:
 *   dirCor/McshCor000003.last.html     a-file
 *   dirHmn/                            a-dir: its .last.html files and those of its sub-dirs
 *   # a-comment, and blank lines, are skipped
 * A-line without "/" at its end is a-dir too, when it is a-dir on disk.
 */

import fs from 'fs';
import path from 'path';

/**
 * OUTPUT: the-.last.html files under a-dir, recursive, without .git, node_modules, *.files dirs.
 */
function fFindFileUnder(sDirIn) {
  const aPath = [];
  for (const oEnt of fs.readdirSync(sDirIn, { withFileTypes: true })) {
    const sPath = path.join(sDirIn, oEnt.name);
    if (oEnt.isDirectory()) {
      if (!['.git', 'node_modules'].includes(oEnt.name) && !/\.files$/i.test(oEnt.name)) aPath.push(...fFindFileUnder(sPath));
    } else if (oEnt.name.endsWith('.last.html')) {
      aPath.push(sPath);
    }
  }
  return aPath;
}

/**
 * INPUT: sRootIn: the-worldview, sPathListIn: the-list file.
 * OUTPUT: { aPathFile: the-absolute paths of its files (no doubles, in list order),
 *   aEntry: its entries, aMissing: the-entries that are no file or dir }
 */
export function fReadListValidate(sRootIn, sPathListIn) {
  const aEntry = fs.readFileSync(sPathListIn, 'utf8').split(/\r?\n/)
    .map(sLine => sLine.trim().replace(/\\/g, '/').replace(/^\.\//, ''))
    .filter(sLine => sLine && !sLine.startsWith('#'));
  const aPathFile = [];
  const oSetSeen = new Set();
  const aMissing = [];
  const fAdd = sPath => { const sKey = path.resolve(sPath).toLowerCase(); if (!oSetSeen.has(sKey)) { oSetSeen.add(sKey); aPathFile.push(path.resolve(sPath)); } };
  for (const sEntry of aEntry) {
    const sPath = path.join(sRootIn, sEntry);
    let oStat = null;
    try { oStat = fs.statSync(sPath); } catch (oErr) { /* missing */ }
    if (oStat?.isDirectory()) fFindFileUnder(sPath).forEach(fAdd);
    else if (oStat?.isFile() && sPath.endsWith('.last.html')) fAdd(sPath);
    else aMissing.push(sEntry);
  }
  return { aPathFile, aEntry, aMissing };
}
