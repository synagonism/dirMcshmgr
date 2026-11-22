/*
 * mAsk.js - module: answer an English question by finding the-worldview
 *   concepts (names) it is about. No LLM: it reduces each word to its
 *   first-form (reusing the-English form-finder) and looks the-forms up in
 *   the-name-index. Kept thin and structured, open to future understanding.
 * The MIT License (MIT)
 *
 * Copyright (c) 2021-2026 Kaseluris.Nikos.1959 (synagonism)
 * kaseluris.nikos@gmail.com
 * https:// synagonism.net/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as omLagEngl from './mLagEngl.js'

const
  // contains the-versions of mAsk.js
  aVersion = [
    'mAsk.js.0-2-1.2026-11-22: strip a hyphen-attached article from each question-word (the-concepts -> concepts, an-organization -> organization)',
    'mAsk.js.0-2-0.2026-11-22: dedupe results by NAME and by URL (same name, or a-concept and its own inflection = one concept)',
    'mAsk.js.0-1-0.2026-11-22: creation - finds the-worldview names in an-English question (first-form reduction, no LLM)'
  ],
  // small English stopword-set: dropped before name-lookup
  oSetStop = new Set([
    'the', 'a', 'an', 'of', 'to', 'in', 'on', 'and', 'or', 'is', 'are', 'am', 'be',
    'was', 'were', 'been', 'do', 'does', 'did', 'how', 'what', 'why', 'when', 'where',
    'which', 'who', 'whom', 'whose', 'that', 'this', 'these', 'those', 'with', 'for',
    'as', 'by', 'at', 'it', 'its', 'there', 'from', 'into', 'can', 'could', 'would',
    'should', 'will', 'shall', 'may', 'might', 'must', 'about', 'not', 'no', 'yes',
    'if', 'then', 'than', 'so', 'such', 'we', 'you', 'they', 'he', 'she', 'them',
    'us', 'me', 'my', 'your', 'our', 'his', 'her', 'their', 'but', 'have', 'has', 'had'
  ]),
  // a-clean word-form: lowercase letters, inner hyphens (so 'tree-system' survives)
  rForm = /^[a-z][a-z-]*$/,
  // a-hyphen-attached article at a-word-start: 'the-concepts' / 'an-organization' / 'a-concept'
  rArticleHyphen = /^(?:the|an|a)-/,
  // lemma inside a-surface form-line 'leaf!~nounEnglB1.leaf'1'  -> 'leaf'
  rLemmaSurface = /!~[a-z]+\d*\.([a-z][a-z-]*)/i,
  // lemma inside a-method/all-forms line 'nounEnglB1.leaf;leaves' | 'verbEnglC.write!=write;..' -> 1st form
  rLemmaMethod = /^[a-z]+\d*\.([a-z][a-z-]*)/i

/**
 * DOING: lowercases, drops non-letters (keeps inner hyphens), strips a
 *   hyphen-attached article ('the-concepts' -> 'concepts') and drops stopwords.
 * OUTPUT: array of question-words.
 */
function fTokenize (sQuestionIn) {
  return (sQuestionIn || '')
    .toLowerCase()
    .replace(/[^a-z\s-]+/g, ' ')
    .split(/\s+/)
    .map(s => s.replace(/^-+|-+$/g, '')) // trim stray edge-hyphens
    .map(s => s.replace(rArticleHyphen, '')) // 'the-concepts' -> 'concepts', 'an-organization' -> 'organization'
    .filter(s => s.length >= 2 && !oSetStop.has(s))
    .slice(0, 12) // bound the-work per question
}

/**
 * DOING: extracts first-form lemmas from the-form-finder output-lines.
 * INPUT: aLinesIn: lines from fFindNounForms / fFindVerbForms.
 * OUTPUT: array of lemma-strings.
 */
function fLemmasFromForms (aLinesIn) {
  const aOut = []
  for (const sLine of aLinesIn) {
    if (/FORMS:/.test(sLine)) continue // the 'SITE EXISTING FORMS:' / 'POSSIBLE FORMS:' header
    const sClean = sLine.replace(/,\s*$/, '')
    const aM = sClean.match(rLemmaSurface) || sClean.match(rLemmaMethod)
    if (aM) aOut.push(aM[1].toLowerCase())
  }
  return aOut
}

/**
 * DOING: the-word plus its noun/verb first-forms, as clean candidate-forms.
 * OUTPUT: array of distinct forms.
 */
async function fFirstForms (sWordIn) {
  const oForm = new Set([sWordIn])
  try { fLemmasFromForms(await omLagEngl.fFindNounForms(sWordIn)).forEach(s => oForm.add(s)) }
  catch (oErr) { console.warn(oErr) }
  try { fLemmasFromForms(await omLagEngl.fFindVerbForms(sWordIn)).forEach(s => oForm.add(s)) }
  catch (oErr) { console.warn(oErr) }
  return [...oForm].filter(s => rForm.test(s))
}

/**
 * DOING: name-index concepts whose NAME EQUALS the-form (an-exact name in the
 *   question, not a-keyword): so 'concept' matches the-concept 'concept' but NOT
 *   its relation-lines 'concept:generic'/'concept.specific' nor 'concept-map'.
 *   Multi-word names ('programming-language') are caught by the-pair step.
 * INPUT: sFormIn: a-clean form, fSearchNameIn: the-name-index searcher.
 * OUTPUT: array of { sName, sUrl }.
 */
async function fNamesForForm (sFormIn, fSearchNameIn) {
  let aaRow = []
  try { aaRow = await fSearchNameIn(sFormIn, 'lagEngl') } catch (oErr) { console.warn(oErr); return [] }
  const aoOut = []
  for (let n = 0; n < aaRow.length && n < 500; n++) {
    const
      sName = aaRow[n][0],
      sUrl = aaRow[n][1],
      sClean = sName.split('!')[0] // drop any '!~pos' / '!=info' / '!⇒main' tail
    if (sClean.toLowerCase() === sFormIn) aoOut.push({ sName: sClean, sUrl: sUrl })
  }
  return aoOut
}

/**
 * DOING: finds the-worldview concepts an-English question is about.
 * INPUT: sQuestionIn: the-question, fSearchNameIn: mMcsh2.fSearchName (passed
 *   in to avoid an-import-cycle).
 * OUTPUT: { sQuestion, aoName: [{ sName, sUrl, nHit }], aWordUnmatched: [..] }.
 */
async function fAskAnswer (sQuestionIn, fSearchNameIn) {
  const
    aWord = fTokenize(sQuestionIn),
    oByKey = new Map(),      // 'n:<name>' | 'u:<url>' -> a-shared concept-record
    oWordHitAny = new Set()

  // record a-concept once, merging by NAME (same name via noun/verb/redirect) AND by
  // URL (a-concept and its own inflection 'name'/'names' hit the-same page), so the-same
  // concept collapses to one. the-first name/url is kept; each contributing word tracked.
  function fRecord (oNameIn, sWordIn) {
    oWordHitAny.add(sWordIn)
    const
      sNameKey = 'n:' + oNameIn.sName.toLowerCase(),
      sUrlKey = 'u:' + oNameIn.sUrl,
      oByN = oByKey.get(sNameKey),
      oByU = oByKey.get(sUrlKey)
    let oRec = oByN || oByU || { sName: oNameIn.sName, sUrl: oNameIn.sUrl, sNameKey: sNameKey, oWordHit: new Set() }
    // name and url already point at two different records: fold the-url-one into the-name-one
    if (oByN && oByU && oByN !== oByU) {
      oByU.oWordHit.forEach(s => oByN.oWordHit.add(s))
      oByKey.set(oByU.sNameKey, oByN)
      oRec = oByN
    }
    oRec.oWordHit.add(sWordIn)
    // show the-shorter name (usually the-first-form: 'leaf' over 'leaves', 'name' over 'names')
    if (oNameIn.sName.length < oRec.sName.length) oRec.sName = oNameIn.sName
    oByKey.set(sNameKey, oRec)
    oByKey.set(sUrlKey, oRec)
  }

  // single words, reduced to first-forms
  for (const sWord of aWord) {
    const aForm = await fFirstForms(sWord)
    for (const sForm of aForm) {
      for (const oName of await fNamesForForm(sForm, fSearchNameIn)) fRecord(oName, sWord)
    }
  }
  // adjacent word-pairs joined by '-' catch multi-word names ('tree system' -> 'tree-system')
  for (let n = 0; n + 1 < aWord.length; n++) {
    const sPair = aWord[n] + '-' + aWord[n + 1]
    if (!rForm.test(sPair)) continue
    for (const oName of await fNamesForForm(sPair, fSearchNameIn)) {
      fRecord(oName, aWord[n]); fRecord(oName, aWord[n + 1])
    }
  }

  const aoName = [...new Set(oByKey.values())] // unique shared records
    .sort((oA, oB) =>
      oB.oWordHit.size - oA.oWordHit.size ||
      oA.sName.length - oB.sName.length ||
      oA.sName.localeCompare(oB.sName))
    .slice(0, 40)
    .map(oV => ({ sName: oV.sName, sUrl: oV.sUrl, nHit: oV.oWordHit.size }))

  return {
    sQuestion: sQuestionIn,
    aoName: aoName,
    aWordUnmatched: aWord.filter(s => !oWordHitAny.has(s))
  }
}

export { fAskAnswer }
