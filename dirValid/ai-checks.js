/**
 * ai-checks.js
 * Semantic consistency checks powered by DeepSeek Cloud API.
 *
 * Requires DeepSeek API key: https://platform.deepseek.com/api_keys
 * Model: deepseek-chat (or deepseek-coder as needed)
 *
 * AI checks performed:
 *  A01  Description doesn't match the concept's heading/names (semantic drift)
 *  A02  Description contains undefined terms (uses names not defined in name:: section)
 *  A03  Suggest missing name aliases the AI notices from the description
 *  A04  Detect concepts whose description is copy-pasted / suspiciously similar
 *        to another concept (potential duplicates)
 *
 * Set environment variable:
 *
 * bash
 * set|export DEEPSEEK_API_KEY="your-api-key-here"
 *
 * Optional: Choose different model:
 * bash
 * export MCS_MODEL="deepseek-coder"  # or keep as "deepseek-chat"
 */

const
  aVersion = [
    'ai-checks-deepseek.js.0-2-0.2026-09-04: naming convention',
    'ai-checks-deepseek.js.0-1-0.2026-04-28: creation'
  ];

// DeepSeek API configuration
const sApiKey = process.env.DEEPSEEK_API_KEY;
const sApiUrl = 'https://api.deepseek.com/v1/chat/completions';
const sModel  = process.env.MCS_MODEL ?? 'deepseek-chat';

// How many concepts to AI-check per run (keep low for speed, raise as needed)
const nMaxConcept = 50;

// ─── helpers ──────────────────────────────────────────────────────────────────

async function fAsk(sPrompt, nMaxToken = 300) {
  if (!sApiKey) {
    throw new Error('DEEPSEEK_API_KEY environment variable is not set. Please set it to your DeepSeek API key.');
  }

  try {
    const oResponse = await fetch(sApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sApiKey}`
      },
      body: JSON.stringify({
        model: sModel,
        messages: [{ role: 'user', content: sPrompt }],
        max_tokens: nMaxToken,
        temperature: 0.1
      })
    });

    if (!oResponse.ok) {
      const oErrorData = await oResponse.json();
      throw new Error(`DeepSeek API error: ${oResponse.status} ${oResponse.statusText} - ${JSON.stringify(oErrorData)}`);
    }

    const oData = await oResponse.json();
    return oData.choices[0].message.content.trim();
  } catch (e) {
    throw new Error(`DeepSeek API error (check API key and network): ${e.message}`);
  }
}

function fSummaryConcept(oSect) {
  const aoParaDesc = oSect.oParaByTitle?.['description'] ?? [];
  const sDesc = aoParaDesc.map(oPara => oPara.sText.replace(/^description::\s*/i, '')).join('\n').slice(0, 600);
  const sName = (oSect.aoName ?? []).slice(0, 5).map(oName => oName.sNameRaw).join(', ');
  return `Heading: "${oSect.sNameTitle}"\nNames: ${sName || 'none'}\nDescription:\n${sDesc}`;
}

// ─── A01: semantic drift ───────────────────────────────────────────────────────

async function fCheckDrift(oSect, sNameFile) {
  const sSummary = fSummaryConcept(oSect);
  const sPrompt = `You are checking a structured knowledge base called MCS.
Each concept has a heading and a description. They should be semantically consistent.

${sSummary}

Question: Does the description accurately describe what the heading says?
Answer ONLY with one of:
- OK
- DRIFT: <one-sentence explanation of the mismatch>

Answer:`;

  const sReply = await fAsk(sPrompt, 100);
  if (sReply.startsWith('DRIFT:')) {
    return {
      sLevel: 'WARN', sCode: 'A01', sNameFile, sConcept: oSect.sNameTitle,
      sMessage: `Semantic drift in "${oSect.sNameTitle}": ${sReply.replace('DRIFT:', '').trim()}`,
    };
  }
  return null;
}

// ─── A02: undefined terms ─────────────────────────────────────────────────────

async function fCheckTermUndefined(oSect, sNameFile) {
  const aoParaDesc = oSect.oParaByTitle?.['description'] ?? [];
  const sDesc = aoParaDesc.map(oPara => oPara.sText.replace(/^description::\s*/i, '')).join('\n').slice(0, 800);
  const sName = (oSect.aoName ?? []).map(oName => oName.sNameRaw).join(', ');
  if (!sDesc.trim()) return null;

  const sPrompt = `You are reviewing a concept in a knowledge base that aims to be fully monosemantic.
Every technical or domain-specific term used in a description should either be defined in the
concept's own name:: section or be a standard English word.

Concept heading: "${oSect.sNameTitle}"
Defined names: ${sName || 'none'}
Description:
${sDesc}

List any terms/names in the description that appear to be undefined jargon or knowledge-base-specific
terms that are NOT in the defined names list above.
If none, respond: NONE
If some, respond: UNDEFINED: term1, term2, term3 (max 5)

Answer:`;

  const sReply = await fAsk(sPrompt, 80);
  if (sReply.startsWith('UNDEFINED:')) {
    const sTerm = sReply.replace('UNDEFINED:', '').trim();
    return {
      sLevel: 'INFO', sCode: 'A02', sNameFile, sConcept: oSect.sNameTitle,
      sMessage: `Possibly undefined terms in "${oSect.sNameTitle}": ${sTerm}`,
    };
  }
  return null;
}

// ─── A03: suggest missing name aliases ───────────────────────────────────────

async function fCheckAliasMissing(oSect, sNameFile) {
  const aoParaDesc = oSect.oParaByTitle?.['description'] ?? [];
  const sDesc = aoParaDesc.map(oPara => oPara.sText.replace(/^description::\s*/i, '')).join('\n').slice(0, 500);
  const sName = (oSect.aoName ?? []).map(oName => oName.sNameRaw).join('\n');
  if (!sDesc.trim() || !oSect.aName?.length) return null;

  const sPrompt = `You are helping manage a structured knowledge base with strict naming conventions.
McsEngl names follow patterns like: McsEngl.Domain.Subdomain, McsEngl.ConceptName, McsEngl.concept-with-hyphens

Existing names for concept "${oSect.sNameTitle}":
${sName}

Description: ${sDesc}

Suggest up to 3 ADDITIONAL McsEngl name entries that would be natural aliases
based on the description but are NOT already in the list above.
Only suggest if you are confident. If none needed, say: NONE
Format: SUGGEST: McsEngl.Name1, McsEngl.Name2

Answer:`;

  const sReply = await fAsk(sPrompt, 100);
  if (sReply.startsWith('SUGGEST:')) {
    const sSuggest = sReply.replace('SUGGEST:', '').trim();
    return {
      sLevel: 'INFO', sCode: 'A03', sNameFile, sConcept: oSect.sNameTitle,
      sMessage: `Possible missing aliases for "${oSect.sNameTitle}": ${sSuggest}`,
    };
  }
  return null;
}

// ─── A04: duplicate description detection ────────────────────────────────────
// Compare concept descriptions in small batches to find suspicious similarity

async function fCheckDuplicateNear(aoSample) {
  const aoIssue = [];
  const nSample = 20;
  const aoSampled = aoSample.slice(0, nSample);

  for (let i = 0; i < aoSampled.length; i++) {
    for (let j = i + 1; j < aoSampled.length; j++) {
      const [oS1, sF1] = aoSampled[i];
      const [oS2, sF2] = aoSampled[j];
      const fDescOf = oS => (oS.oParaByTitle?.['description'] ?? [])
        .map(oPara => oPara.sText.replace(/^description::\s*/i, '')).join(' ').slice(0, 300);
      const sD1 = fDescOf(oS1);
      const sD2 = fDescOf(oS2);
      if (!sD1 || !sD2) continue;

      const sPrompt = `Compare these two concept descriptions from a knowledge base.
Are they describing the same concept (potential duplicate)?

Concept A (${oS1.sNameTitle}): ${sD1}
Concept B (${oS2.sNameTitle}): ${sD2}

Answer ONLY:
- DIFFERENT
- SIMILAR: <one-line reason>

Answer:`;

      const sReply = await fAsk(sPrompt, 60);
      if (sReply.startsWith('SIMILAR:')) {
        aoIssue.push({
          sLevel: 'WARN', sCode: 'A04',
          sNameFile: sF1,
          sConcept: oS1.sNameTitle,
          sMessage: `Possible duplicate: "${oS1.sNameTitle}" (${sF1}) and "${oS2.sNameTitle}" (${sF2}): ${sReply.replace('SIMILAR:', '').trim()}`,
        });
      }
    }
  }
  return aoIssue;
}

// ─── main export ──────────────────────────────────────────────────────────────

export async function fRunChecksAi(aoFile) {
  const aoIssue = [];

  // Validate API key early
  if (!sApiKey) {
    console.error('\n   ❌ ERROR: DEEPSEEK_API_KEY environment variable is not set.');
    console.error('   Please set it with: export DEEPSEEK_API_KEY="your-api-key-here"');
    console.error('   Get your API key from: https://platform.deepseek.com/api_keys\n');
    return aoIssue;
  }

  // Flatten all CnptSect with file reference; filter to those with descriptions
  const aoSect = [];
  for (const oFile of aoFile) {
    for (const oSect of oFile.aoCnptSect) {
      aoSect.push([oSect, oFile.sNameFile]);
    }
  }

  const aoSample = aoSect
    .filter(([oS]) => {
      const bHasDesc = (oS.oParaByTitle?.['description'] ?? []).length > 0;
      return bHasDesc && oS.aName.length > 0;
    })
    .slice(0, nMaxConcept);

  const nTotal = aoSample.length;
  console.log(`   Checking ${nTotal} CnptSect (of ${aoSect.length} total)`);
  console.log(`   Model: ${sModel}  (DeepSeek Cloud API)`);
  console.log(`   API Key: ${sApiKey ? '✓ Set' : '✗ Missing'}\n`);

  for (let i = 0; i < aoSample.length; i++) {
    const [oSect, sNameFile] = aoSample[i];
    process.stdout.write(`   [${String(i+1).padStart(3)}/${nTotal}] ${oSect.sNameTitle.slice(0,45).padEnd(45)} `);

    try {
      const oDrift = await fCheckDrift(oSect, sNameFile);
      const oUndef = await fCheckTermUndefined(oSect, sNameFile);
      const oAlias = await fCheckAliasMissing(oSect, sNameFile);

      const aoFound = [oDrift, oUndef, oAlias].filter(Boolean);
      aoIssue.push(...aoFound);
      console.log(aoFound.length > 0 ? `⚠  ${aoFound.length} issue(s)` : '✓');
    } catch (e) {
      console.log(`✗ error: ${e.message}`);
      if (e.message.includes('DeepSeek API error')) {
        console.error('\n   ⚠  Could not reach DeepSeek API. Check your API key and network connection.');
        break;
      }
    }
  }

  if (aoSample.length >= 4) {
    console.log('\n   Running near-duplicate check on sample...');
    try {
      const aoDupe = await fCheckDuplicateNear(aoSample);
      aoIssue.push(...aoDupe);
      console.log(`   Found ${aoDupe.length} potential duplicates`);
    } catch (e) {
      console.log(`   Skipped: ${e.message}`);
    }
  }

  return aoIssue;
}
