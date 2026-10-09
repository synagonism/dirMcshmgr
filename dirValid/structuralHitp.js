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
 * types:
 * ❌ ERROR
 * ⚠️ WARN
 * ℹ️ INFO
 * 
 * Checks:
 *  Hvre01  Duplicate id within a file (IDs must be unique)
 *  Hvre02  Heading without id (cannot be a link/preview target)
 *  Hvre03  Paragraph without id
 *  Hvre04  Section without id
 *  Hvre05  Broken file link: target .last.html does not exist
 *  Hvre06  Broken internal anchor: #id (or file#id) target not found
 *  Hvre07  Missing HTML tag pair: unclosed open, or stray close
 * 
 *  Hvrw01  File <title> missing 
 *  Hvrw02  File version string malformed
 *  Hvrw03  clsHide self-anchor missing
 *  Hvrw04  clsHide self-anchor not matching the element's own id
 *  Hvrw05  Html-element name is not lowercase
 *  Hvrw06  Html-attribute value not double-quoted (single-quoted or unquoted)
 *  Hvrw07  Html-heading gaps
 */

import path from 'path';
import fs from 'fs';

const
  aVersion = [
    'structuralHitp.js.0-4-0.2026-10-09: fRunChecksHitp bQuietIn, for reportMcsh.mjs',
    'structuralHitp.js.0-3-0.2026-10-09: Hvrw07 Html-heading gaps',
    'structuralHitp.js.0-2-0.2026-10-09: renaming',
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

// ⚠️ Hvrw01  file <title> version string
// ⚠️ Hvrw02  file version string malformed
function fCheckVersion(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    if (!oFile.sVersion) {
      aoIssue.push(fIssue('WARN', 'Hvrw01', oFile.sNameFile, null,
        `File "${oFile.sNameFile}" has no version string in <title> (expected e.g. HitpXxx.1-2-3.2026-01-01)`,
        oFile.nLineTitle ?? null));
    } else if (!oFile.sVersion.match(/\w+\.\d+-\d+-\d+\.\d{4}-\d{2}-\d{2}/)) {
      aoIssue.push(fIssue('WARN', 'Hvrw02', oFile.sNameFile, null,
        `File "${oFile.sNameFile}" version "${oFile.sVersion}" does not match pattern Xxx.N-N-N.YYYY-MM-DD`,
        oFile.nLineTitle ?? null));
    }
  }
  return aoIssue;
}

// ❌ Hvre01  duplicate id in a file
function fCheckIdDuplicate(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    for (const oDup of oFile.aoIdDup) {
      aoIssue.push(fIssue('ERROR', 'Hvre01', oFile.sNameFile, null,
        `Duplicate id "${oDup.sName}" — IDs must be unique in a-Hitp-file`, oDup.nLine));
    }
  }
  return aoIssue;
}

// ❌ Hvre02 heading without id  | ❌  Hvre03 paragraph without id  |  ❌ Hvre04 section without id
function fCheckIdMissing(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    // Hvre04: sections without id
    for (const oSect of oFile.aoSect) {
      if (!oSect.sNameId) {
        aoIssue.push(fIssue('ERROR', 'Hvre04', oFile.sNameFile, null,
          `<section> without id (heading "${oSect.sNameTitle}") — cannot be referenced`,
          null));
      }
    }
    // Hvre02/Hvre03: heading / paragraph without id
    for (const oElmt of oFile.aoElmt) {
      if (oElmt.sNameId) continue;
      if (oElmt.sType === 'head') {
        aoIssue.push(fIssue('ERROR', 'Hvre02', oFile.sNameFile, fSectOf(oElmt),
          `<${oElmt.sSubtype}> heading without id in section "${oElmt.sIdSect}" — cannot be a link/preview target`,
          oFile.oMapIdLine.get(oElmt.sIdSect) ?? null));
      } else if (!oElmt.bInDivId) { // <p> inside a <div id="…"> is exempt — the div carries the id
        aoIssue.push(fIssue('ERROR', 'Hvre03', oFile.sNameFile, fSectOf(oElmt),
          `<p> without id in section "${oElmt.sIdSect}"`,
          oFile.oMapIdLine.get(oElmt.sIdSect) ?? null));
      }
    }
  }
  return aoIssue;
}

// ⚠️ Hvrw03  clsHide self-anchor
// ⚠️ Hvrw04  clsHide self-anchor mismatched (paragraphs only)
// Headings are exempt: they are reachable via the auto-generated TOC, so they do
// not need a clsHide self-anchor.
function fCheckSelfAnchor(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    for (const oElmt of oFile.aoElmt) {
      if (oElmt.sType === 'head') continue; // headings need no self-anchor (TOC)
      if (!oElmt.sNameId) continue; // no id → already Hvre02/Hvre03
      if (oElmt.bUnclosed) continue; // unclosed <p> → reported by Hvre07, not a mismatch
      if (oElmt.sHrefSelf === null) {
        aoIssue.push(fIssue('WARN', 'Hvrw03', oFile.sNameFile, fSectOf(oElmt),
          `<${oElmt.sSubtype}> "${oElmt.sNameId}" has no clsHide self-anchor`,
          oElmt.nLine));
      } else if (oElmt.sHrefSelf !== oElmt.sNameId) {
        aoIssue.push(fIssue('WARN', 'Hvrw04', oFile.sNameFile, fSectOf(oElmt),
          `<${oElmt.sSubtype}> "${oElmt.sNameId}" clsHide self-anchor points to #${oElmt.sHrefSelf} (should be #${oElmt.sNameId})`,
          oElmt.nLine));
      }
    }
  }
  return aoIssue;
}

// ❌ Hvre05 broken file link  |  ⚠️ Hvre06 broken internal anchor
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
        // cross-file link → Hvre05 file existence, then Hvre06 anchor
        const bExists = oSetRel.has(oResolved.sRelFile) || fs.existsSync(oResolved.sPathAbs);
        if (!bExists) {
          aoIssue.push(fIssue('ERROR', 'Hvre05', oFile.sNameFile, null,
            `Broken link: FILE not found "${oResolved.sRelFile}" (from "${oFile.sNameFile}/${sHref}")`, nLine));
          continue;
        }
        if (oResolved.sAnchor) {
          const oSetIdTarget = oMapAnchor.get(oResolved.sRelFile)
            ?? oMapAnchor.get(path.basename(oResolved.sRelFile));
          if (oSetIdTarget && !oSetIdTarget.has(oResolved.sAnchor)) {
            aoIssue.push(fIssue('WARN', 'Hvre06', oFile.sNameFile, null,
              `Broken anchor: #${oResolved.sAnchor} not found in "${oResolved.sRelFile}"`, nLine));
          }
        }
      } else if (oResolved.sAnchor) {
        // same-file anchor → Hvre06
        if (!oFile.oSetId.has(oResolved.sAnchor)) {
          aoIssue.push(fIssue('WARN', 'Hvre06', oFile.sNameFile, null,
            `Broken anchor: #${oResolved.sAnchor} not found in "${oFile.sNameFile}"`, nLine));
        }
      }
    }
  }
  return aoIssue;
}

// ❌ Hvre07  missing HTML tag pair (unclosed open or stray close)
function fCheckTagPair(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    for (const oBad of oFile.aoTagBad) {
      const sMessage = oBad.sKind === 'stray'
        ? `Stray </${oBad.sTag}> — no matching <${oBad.sTag}> open`
        : `Unclosed <${oBad.sTag}> — no matching </${oBad.sTag}> (opened here)`;
      aoIssue.push(fIssue('ERROR', 'Hvre07', oFile.sNameFile, null, sMessage, oBad.nLine));
    }
  }
  return aoIssue;
}

// ⚠️ Hvrw05  HTML element name is not lowercase
function fCheckTagCase(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    for (const oCase of oFile.aoTagCase) {
      aoIssue.push(fIssue('WARN', 'Hvrw05', oFile.sNameFile, null,
        `HTML element <${oCase.sTag}> is not lowercase — use <${oCase.sTag.toLowerCase()}>`,
        oCase.nLine));
    }
  }
  return aoIssue;
}

// ⚠️ Hvrw06  attribute value not double-quoted (single-quoted or unquoted)
function fCheckAttrQuote(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    for (const oAttr of oFile.aoAttrBad) {
      const sMessage = oAttr.sKind === 'single'
        ? `Attribute ${oAttr.sAttr}='${oAttr.sValue}' uses single quotes — use ${oAttr.sAttr}="${oAttr.sValue}"`
        : `Attribute ${oAttr.sAttr}=${oAttr.sValue} is unquoted — use ${oAttr.sAttr}="${oAttr.sValue}"`;
      aoIssue.push(fIssue('WARN', 'Hvrw06', oFile.sNameFile, null, sMessage, oAttr.nLine));
    }
  }
  return aoIssue;
}

// ⚠️ Hvrw07  Html-heading gaps
// A-part's heading is ONE level below its whole's (h1 → h2), and a-section's next
// sibling has the-same level (h2 → h2). Sections without id, line or heading are
// skipped (a-missing id is Hvre04).
function fCheckHeadingGap(aoFile) {
  const aoIssue = [];
  for (const oFile of aoFile) {
    const aoSect = oFile.aoSect.filter(oSect =>
      oSect.sNameId && oSect.nLine != null && oSect.nHeadingLevel != null);
    const oMapSect = new Map(aoSect.map(oSect => [oSect.sNameId, oSect]));
    // the-parts of each whole (null = top level), in document order
    const oMapGroup = new Map();
    for (const oSect of aoSect) {
      const sIdWhole = oSect.sIdWhole_elmt ?? null;
      if (!oMapGroup.has(sIdWhole)) oMapGroup.set(sIdWhole, []);
      oMapGroup.get(sIdWhole).push(oSect);
    }

    for (const [sIdWhole, aoSectGroup] of oMapGroup) {
      aoSectGroup.sort((oA, oB) => oA.nLine - oB.nLine);

      // part: one level below its whole
      const oWhole = sIdWhole ? oMapSect.get(sIdWhole) : null;
      if (oWhole) {
        const nLevelExpect = oWhole.nHeadingLevel + 1;
        for (const oSect of aoSectGroup) {
          if (oSect.nHeadingLevel === nLevelExpect) continue;
          aoIssue.push(fIssue('WARN', 'Hvrw07', oFile.sNameFile, oSect,
            `<h${oSect.nHeadingLevel}> section "${oSect.sNameId}" is a part of ` +
            `<h${oWhole.nHeadingLevel}> section "${oWhole.sNameId}" — expected <h${nLevelExpect}>`,
            oSect.nLine));
        }
      }

      // sibling: the-same level as the-previous one, reported on the-next one
      for (let nI = 1; nI < aoSectGroup.length; nI++) {
        const oPrev = aoSectGroup[nI - 1], oNext = aoSectGroup[nI];
        if (oNext.nHeadingLevel === oPrev.nHeadingLevel) continue;
        aoIssue.push(fIssue('WARN', 'Hvrw07', oFile.sNameFile, oNext,
          `<h${oPrev.nHeadingLevel}> section "${oPrev.sNameId}" has next sibling ` +
          `<h${oNext.nHeadingLevel}> "${oNext.sNameId}" — expected <h${oPrev.nHeadingLevel}>`,
          oNext.nLine));
      }
    }
  }
  return aoIssue;
}

// ─── main export ──────────────────────────────────────────────────────────────

export function fRunChecksHitp(aoFile, sPathDir, bQuietIn = false) {
  const aoAll = [];
  // bQuietIn: no progress-lines, for reportMcsh.mjs which prints its own report
  const fWrite = sIn => { if (!bQuietIn) process.stdout.write(sIn); };
  const fLog   = sIn => { if (!bQuietIn) console.log(sIn); };

  fWrite('   Hvre01    Duplicate ids... ');
  const aoDup = fCheckIdDuplicate(aoFile);
  aoAll.push(...aoDup);
  fLog(`${aoDup.length} issues`);

  fWrite('   Hvre02/Hvre03/Hvre04 Missing ids... ');
  const aoIdMissing = fCheckIdMissing(aoFile);
  aoAll.push(...aoIdMissing);
  fLog(`${aoIdMissing.length} issues`);

  fWrite('   Hvre06/Hvre05 Links & anchors... ');
  const aoLink = fCheckLink(aoFile, sPathDir);
  aoAll.push(...aoLink);
  fLog(`${aoLink.length} issues`);

  fWrite('   Hvre07    Tag pairs... ');
  const aoTag = fCheckTagPair(aoFile);
  aoAll.push(...aoTag);
  fLog(`${aoTag.length} issues`);


  fWrite('   Hvrw01    Version strings... ');
  const aoVersion = fCheckVersion(aoFile);
  aoAll.push(...aoVersion);
  fLog(`${aoVersion.length} issues`);

  fWrite('   Hvrw03    clsHide self-anchors... ');
  const aoSelf = fCheckSelfAnchor(aoFile);
  aoAll.push(...aoSelf);
  fLog(`${aoSelf.length} issues`);

  fWrite('   Hvrw05    Tag lowercase... ');
  const aoTagCase = fCheckTagCase(aoFile);
  aoAll.push(...aoTagCase);
  fLog(`${aoTagCase.length} issues`);

  fWrite('   Hvrw06    Attr double-quote... ');
  const aoAttr = fCheckAttrQuote(aoFile);
  aoAll.push(...aoAttr);
  fLog(`${aoAttr.length} issues`);

  fWrite('   Hvrw07    Heading gaps... ');
  const aoHeadingGap = fCheckHeadingGap(aoFile);
  aoAll.push(...aoHeadingGap);
  fLog(`${aoHeadingGap.length} issues`);

  return aoAll;
}
