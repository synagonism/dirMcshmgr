/**
 * structuralHitp.js
 * Rule-based consistency checks for generic Hitp files — fast, no AI needed.
 *
 * Uses the data model from parserHitp.js:
 *   oFile → { sType, sPathFile, sNameFile, sNameTitle, sVersion, nLineTitle,
 *             aoSect, aoElmt, oSetId, aoIdDup, aLinks, oMapIdLine, oMapLinkLine }
 *   oSect → { sNameId, sNameTitle, nHeadingLevel, nDepth, sIdWhole_elmt }
 *   oElmt → { sType:'head'|'para', sSubtype, sNameId, nLevel, sHrefSelf, nLine, sIdSect }
 *
 * Checks:
 *  H01  File <title> missing / malformed version string
 *  H02  Duplicate id within a file (IDs must be unique)
 *  H03  Heading without id (cannot be a link/preview target)
 *  H04  Paragraph without id
 *  H05  Section without id
 *  H06  clsHide self-anchor missing or not matching the element's own id
 *  H07  Broken internal anchor: #id (or file#id) target not found
 *  H08  Broken file link: target .last.html does not exist
 *  H09  Missing HTML tag pair: unclosed open, or stray close
 *  H10  HTML element name is not lowercase
 *  H11  Attribute value not double-quoted (single-quoted or unquoted)
 */

import path from 'path';
import fs from 'fs';

const
  aVersion = [
    'structuralHitp.js.0-1-0.2026-09-04: creation'
  ]

// ─── helpers ──────────────────────────────────────────────────────────────────

function fIssue(sLevel, sCode, sNameFile, oSectOrNull, sMessage, nLine = null) {
  return {
    sLevel,
    sCode,
    sNameFile,
    sConcept: oSectOrNull?.sNameTitle ?? null,
    sIdConcept: oSectOrNull?.sNameId ?? null,
    nLine,
    sMessage,
  };
}

/** Build a map: relativeFilePath → Set<id>, for cross-file anchor validation */
function fBuildMapAnchor(aoFile, sPathDir) {
  const oMap = new Map();
  for (const oFile of aoFile) {
    const sRel = path.relative(sPathDir, oFile.sPathFile).replace(/\\/g, '/');
    oMap.set(sRel, oFile.oSetId);
    oMap.set(oFile.sNameFile, oFile.oSetId); // also index by bare filename
  }
  return oMap;
}

/** Resolve an href to { bExternal, sRelFile, sAnchor, sPathAbs } (copied from structural.js) */
function fResolveHref(sHref, sDirFile, sPathDir) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(sHref)) return { bExternal: true };
  if (sHref.startsWith('/')) return { bExternal: true };
  if (sHref.startsWith('#')) return { bExternal: false, sRelFile: null, sAnchor: sHref.slice(1) };

  const [sFilePart, sAnchor] = sHref.split('#');
  const sPathAbs = path.resolve(sDirFile, sFilePart);
  const sRel = path.relative(sPathDir, sPathAbs).replace(/\\/g, '/');
  return { bExternal: false, sRelFile: sRel, sAnchor: sAnchor ?? null, sPathAbs };
}

/** Pseudo-section object so element issues carry their section in the Concept column */
function fSectOf(oElmt) {
  return { sNameTitle: oElmt.sIdSect, sNameId: oElmt.sIdSect };
}

// ─── individual checks ────────────────────────────────────────────────────────

// ⚠️/ℹ️ H01  <title> version string
function fCheckVersion(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    if (!oFile.sVersion) {
      aoIssue.push(fIssue('WARN', 'H01', oFile.sNameFile, null,
        `File "${oFile.sNameFile}" has no version string in <title> (expected e.g. HitpXxx.1-2-3.2026-01-01)`,
        oFile.nLineTitle ?? null));
    } else if (!oFile.sVersion.match(/\w+\.\d+-\d+-\d+\.\d{4}-\d{2}-\d{2}/)) {
      aoIssue.push(fIssue('INFO', 'H01', oFile.sNameFile, null,
        `File "${oFile.sNameFile}" version "${oFile.sVersion}" does not match pattern Xxx.N-N-N.YYYY-MM-DD`,
        oFile.nLineTitle ?? null));
    }
  }
  return aoIssue;
}

// ❌ H02  duplicate id in a file
function fCheckIdDuplicate(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    for (const oDup of oFile.aoIdDup) {
      aoIssue.push(fIssue('ERROR', 'H02', oFile.sNameFile, null,
        `Duplicate id "${oDup.sName}" — IDs must be unique in a Hitp file`, oDup.nLine));
    }
  }
  return aoIssue;
}

// ❌ H03 heading without id  |  ℹ️ H04 paragraph without id  |  ❌ H05 section without id
function fCheckIdMissing(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    // H05: sections without id
    for (const oSect of oFile.aoSect) {
      if (!oSect.sNameId) {
        aoIssue.push(fIssue('ERROR', 'H05', oFile.sNameFile, null,
          `<section> without id (heading "${oSect.sNameTitle}") — cannot be referenced`,
          null));
      }
    }
    // H03/H04: heading / paragraph without id
    for (const oElmt of oFile.aoElmt) {
      if (oElmt.sNameId) continue;
      if (oElmt.sType === 'head') {
        aoIssue.push(fIssue('ERROR', 'H03', oFile.sNameFile, fSectOf(oElmt),
          `<${oElmt.sSubtype}> heading without id in section "${oElmt.sIdSect}" — cannot be a link/preview target`,
          oFile.oMapIdLine.get(oElmt.sIdSect) ?? null));
      } else if (!oElmt.bInDivId) { // <p> inside a <div id="…"> is exempt — the div carries the id
        aoIssue.push(fIssue('ERROR', 'H04', oFile.sNameFile, fSectOf(oElmt),
          `<p> without id in section "${oElmt.sIdSect}"`,
          oFile.oMapIdLine.get(oElmt.sIdSect) ?? null));
      }
    }
  }
  return aoIssue;
}

// ⚠️ H06  clsHide self-anchor missing or mismatched (paragraphs only)
// Headings are exempt: they are reachable via the auto-generated TOC, so they do
// not need a clsHide self-anchor.
function fCheckSelfAnchor(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    for (const oElmt of oFile.aoElmt) {
      if (oElmt.sType === 'head') continue; // headings need no self-anchor (TOC)
      if (!oElmt.sNameId) continue; // no id → already H03/H04
      if (oElmt.bUnclosed) continue; // unclosed <p> → reported by H09, not a mismatch
      if (oElmt.sHrefSelf === null) {
        aoIssue.push(fIssue('WARN', 'H06', oFile.sNameFile, fSectOf(oElmt),
          `<${oElmt.sSubtype}> "${oElmt.sNameId}" has no clsHide self-anchor`,
          oElmt.nLine));
      } else if (oElmt.sHrefSelf !== oElmt.sNameId) {
        aoIssue.push(fIssue('WARN', 'H06', oFile.sNameFile, fSectOf(oElmt),
          `<${oElmt.sSubtype}> "${oElmt.sNameId}" clsHide self-anchor points to #${oElmt.sHrefSelf} (should be #${oElmt.sNameId})`,
          oElmt.nLine));
      }
    }
  }
  return aoIssue;
}

// ❌ H08 broken file link  |  ⚠️ H07 broken internal anchor
function fCheckLink(aoFile, sPathDir) {
  const aoIssue = [];
  const oMapAnchor = fBuildMapAnchor(aoFile, sPathDir);
  const oSetRel = new Set(
    aoFile.map(oFile => path.relative(sPathDir, oFile.sPathFile).replace(/\\/g, '/'))
  );

  for (const oFile of aoFile) {
    const sDirFile = path.dirname(oFile.sPathFile);
    for (const sHref of oFile.aLinks) {
      if (!sHref || sHref === '#') continue;
      const oResolved = fResolveHref(sHref, sDirFile, sPathDir);
      if (oResolved.bExternal) continue;
      const nLine = oFile.oMapLinkLine.get(sHref) ?? null;

      if (oResolved.sRelFile) {
        // cross-file link → H08 file existence, then H07 anchor
        const bExists = oSetRel.has(oResolved.sRelFile) || fs.existsSync(oResolved.sPathAbs);
        if (!bExists) {
          aoIssue.push(fIssue('ERROR', 'H08', oFile.sNameFile, null,
            `Broken link: FILE not found "${oResolved.sRelFile}" (from "${oFile.sNameFile}/${sHref}")`, nLine));
          continue;
        }
        if (oResolved.sAnchor) {
          const oSetIdTarget = oMapAnchor.get(oResolved.sRelFile)
            ?? oMapAnchor.get(path.basename(oResolved.sRelFile));
          if (oSetIdTarget && !oSetIdTarget.has(oResolved.sAnchor)) {
            aoIssue.push(fIssue('WARN', 'H07', oFile.sNameFile, null,
              `Broken anchor: #${oResolved.sAnchor} not found in "${oResolved.sRelFile}"`, nLine));
          }
        }
      } else if (oResolved.sAnchor) {
        // same-file anchor → H07
        if (!oFile.oSetId.has(oResolved.sAnchor)) {
          aoIssue.push(fIssue('WARN', 'H07', oFile.sNameFile, null,
            `Broken anchor: #${oResolved.sAnchor} not found in "${oFile.sNameFile}"`, nLine));
        }
      }
    }
  }
  return aoIssue;
}

// ❌ H09  missing HTML tag pair (unclosed open or stray close)
function fCheckTagPair(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    for (const oBad of oFile.aoTagBad) {
      const sMessage = oBad.sKind === 'stray'
        ? `Stray </${oBad.sTag}> — no matching <${oBad.sTag}> open`
        : `Unclosed <${oBad.sTag}> — no matching </${oBad.sTag}> (opened here)`;
      aoIssue.push(fIssue('ERROR', 'H09', oFile.sNameFile, null, sMessage, oBad.nLine));
    }
  }
  return aoIssue;
}

// ⚠️ H10  HTML element name is not lowercase
function fCheckTagCase(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    for (const oCase of oFile.aoTagCase) {
      aoIssue.push(fIssue('WARN', 'H10', oFile.sNameFile, null,
        `HTML element <${oCase.sTag}> is not lowercase — use <${oCase.sTag.toLowerCase()}>`,
        oCase.nLine));
    }
  }
  return aoIssue;
}

// ⚠️ H11  attribute value not double-quoted (single-quoted or unquoted)
function fCheckAttrQuote(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    for (const oAttr of oFile.aoAttrBad) {
      const sMessage = oAttr.sKind === 'single'
        ? `Attribute ${oAttr.sAttr}='${oAttr.sValue}' uses single quotes — use ${oAttr.sAttr}="${oAttr.sValue}"`
        : `Attribute ${oAttr.sAttr}=${oAttr.sValue} is unquoted — use ${oAttr.sAttr}="${oAttr.sValue}"`;
      aoIssue.push(fIssue('WARN', 'H11', oFile.sNameFile, null, sMessage, oAttr.nLine));
    }
  }
  return aoIssue;
}

// ─── main export ──────────────────────────────────────────────────────────────

export function fRunChecksHitp(aoFile, sPathDir) {
  const aoAll = [];

  process.stdout.write('   H01    Version strings... ');
  const aoVersion = fCheckVersion(aoFile);
  aoAll.push(...aoVersion);
  console.log(`${aoVersion.length} issues`);

  process.stdout.write('   H02    Duplicate ids... ');
  const aoDup = fCheckIdDuplicate(aoFile);
  aoAll.push(...aoDup);
  console.log(`${aoDup.length} issues`);

  process.stdout.write('   H03/H04/H05 Missing ids... ');
  const aoIdMissing = fCheckIdMissing(aoFile);
  aoAll.push(...aoIdMissing);
  console.log(`${aoIdMissing.length} issues`);

  process.stdout.write('   H06    clsHide self-anchors... ');
  const aoSelf = fCheckSelfAnchor(aoFile);
  aoAll.push(...aoSelf);
  console.log(`${aoSelf.length} issues`);

  process.stdout.write('   H07/H08 Links & anchors... ');
  const aoLink = fCheckLink(aoFile, sPathDir);
  aoAll.push(...aoLink);
  console.log(`${aoLink.length} issues`);

  process.stdout.write('   H09    Tag pairs... ');
  const aoTag = fCheckTagPair(aoFile);
  aoAll.push(...aoTag);
  console.log(`${aoTag.length} issues`);

  process.stdout.write('   H10    Tag lowercase... ');
  const aoTagCase = fCheckTagCase(aoFile);
  aoAll.push(...aoTagCase);
  console.log(`${aoTagCase.length} issues`);

  process.stdout.write('   H11    Attr double-quote... ');
  const aoAttr = fCheckAttrQuote(aoFile);
  aoAll.push(...aoAttr);
  console.log(`${aoAttr.length} issues`);

  return aoAll;
}
