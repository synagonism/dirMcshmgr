/*
 * mLagEngl.js - module of English-language.
 * The MIT License (MIT)
 *
 * Copyright (c) 2021-2025 Kaseluris.Nikos.1959 (synagonism)
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

import * as omLagUtil from './mLagUtil.js'
import * as omMcsh from './mMcsh2.js'

const
  // contains the-versions of mLagEngl.js
  aVersion = [
    'mLagEngl.js.2-3-0.2026-08-09: play',
    'mLagEngl.js.2-2-0.2026-07-11: nounEngl, verbEngl',
    'mLagEngl.js.2-1-0.2025-11-07: fFindVerbForms-ing',
    'mLagEngl.js.2-0-0.2025-11-06: fFindVerbForms',
    'mLagEngl.js.1-0-0.2025-11-02: fFindNounForms',
    'mLagEngl.js.0-1-0.2021-11-22: creation'
  ],
  sFileEngl = omMcsh.sPathSite + 'dirMcsh/dirLag/McshLag000011.last.html',
  aIrregulars = []

/**
 * DOING: searches sFormIn if it is an-existing irregular noun form
 * return: ['sFormIn!~nounEnglC1:form1;form2',...] if exists in my site
 * return: [] if not found.
 */
async function fIsIrregularNoun (sFormIn) {
  let
    aFormsOut = [],
    n,
    sMethod = ''

  // find the-irregular nouns
  // search which include sFormIn
  const aaJson = await omMcsh.fSearchName(sFormIn + '!~nounEnglC', 'lagEngl');
  for (n = 0; n < aaJson.length; n++) {
    sMethod = aaJson[n][0]
    aFormsOut.push(sMethod)
  }
  return aFormsOut
}

/**
 * DOING: searches sFormIn if it is an-existing irregular verb form
 * return: ['sFormIn!~verbEnglC1:form1;form2;form3;form4;form5',...] if exists in my site
 * return: [] if not found.
 */
async function fIsIrregularVerb (sFormIn) {
  let
    aFormsOut = [],
    n,
    sMethod = ''

  // find the-irregular verbs
  // search which include sFormIn
  const aaJson = await omMcsh.fSearchName(sFormIn + '!~verbEnglC', 'lagEngl');
  for (n = 0; n < aaJson.length; n++) {
    sMethod = aaJson[n][0]
    aFormsOut.push(sMethod)
  }
  return aFormsOut
}

/**
 * DOING: it finds the-EXISTING forms of English-nouns.
 * return: ['nounEnglA1:form1;form2',...]
 * return: [] if problem.
 */
async function fFindKnownNounForms (sFormIn) {
  let
    aaSuggestion = [],
    aFormsOut = [],
    n,
    sMethod = ''

  // find existing nouns
  aaSuggestion = await omMcsh.fSearchName(sFormIn +'!~nounEngl', 'lagEngl')

  // search which include sFormIn
  for (n = 0; n < aaSuggestion.length; n++) {
    sMethod = aaSuggestion[n][0]
    aFormsOut.push(sMethod)
  }

  return aFormsOut
}

/**
 * DOING: it finds the-EXISTING forms of English-verbs.
 * return: ['verbEnglA1:form1;form2',...]
 * return: [] if problem.
 */
async function fFindKnownVerbForms (sFormIn) {
  let
    aaSuggestion = [],
    aFormsOut = [],
    n,
    sMethod = ''

  // find existing verbs
  aaSuggestion = await omMcsh.fSearchName(sFormIn +'!~verbEngl', 'lagEngl')

  for (n = 0; n < aaSuggestion.length; n++) {
    sMethod = aaSuggestion[n][0]
    // run!~verbEnglC!=fctRunning
    // run!~verbEnglC-1:run;runs;ran;running;run
    if (!sMethod.includes('!=')) aFormsOut.push(sMethod)
  }

  return aFormsOut
}

/**
 * DOING: finds existing or POSSIBLE forms of any English-noun.
 * return: ['nounEnglA2:form1;form2',...] if found
 * return: [] if problem.
 */
async function fFindNounForms (sFormIn) {
  let
    aFormsOut = [],
    n,
    sMethod = ''

  sFormIn = sFormIn.toLowerCase()
  // search for existing
  const aOut = await fFindKnownNounForms(sFormIn)

  if (aOut.length >= 1) {
    // nounEnglA
    // nounEnglB
    // nounEnglC
    aFormsOut.push('SITE EXISTING FORMS:')
    for (n = 0; n < aOut.length; n++) {
      aFormsOut.push(aOut[n])
    }
    return aFormsOut
  } else {

    // find POSSIBLE forms
    aFormsOut.push('POSSIBLE FORMS:')

    // nounEnglB1.f|fe;ves: leaf;leaves | knife;knives
    if (sFormIn.endsWith('ves')) {
      aFormsOut.push('nounEnglB1.' + sFormIn.slice(0, -3) + 'f;' + sFormIn)
      aFormsOut.push('nounEnglB1.' + sFormIn.slice(0, -3) + 'fe;' + sFormIn)
      return aFormsOut
    }
    // nounEnglB2.(cons)y;(cons)ies: entity;entities, boy/boys
    else if (sFormIn.endsWith('ies') && fIsConsonantExceptY(sFormIn[sFormIn.length - 4])) {
      aFormsOut.push('nounEnglB2.' + sFormIn.slice(0, -3) + 'y;' + sFormIn)
      return aFormsOut
    }

    // nounEnglA2.∅;es   -ch|sh|s|x: torch,brush,bus,box
    else if (sFormIn.endsWith('ches') ||
        sFormIn.endsWith('shes') ||
        sFormIn.endsWith('ses') ||
        sFormIn.endsWith('xes') ) {
      aFormsOut.push('nounEnglA2.' + sFormIn.slice(0, -2) + ';' + sFormIn)
      return aFormsOut
    } else if (sFormIn.endsWith('ch') ||
        sFormIn.endsWith('sh') ||
        sFormIn.endsWith('x') ) {
      aFormsOut.push('nounEnglA2.' + sFormIn + ';' + sFormIn + 'es')
      return aFormsOut
    }

    // nounEnglB1.f|fe;ves: leaf;leaves | knife;knives
    else if (sFormIn.endsWith('f')) {
      aFormsOut.push('nounEnglB1.' + sFormIn + ';' + sFormIn.slice(0, -1) + 'ves')
      return aFormsOut
    } else if (sFormIn.endsWith('fe')) {
      aFormsOut.push('nounEnglB1.' + sFormIn + ';' + sFormIn.slice(0, -2) + 'ves')
      return aFormsOut
    }

    else if (sFormIn.endsWith('y') && fIsConsonantExceptY(sFormIn[sFormIn.length - 2])) {
      aFormsOut.push('nounEnglB2.' + sFormIn + ';' + sFormIn.slice(0, -1) + 'ies')
      return aFormsOut
    }

    // nounEnglA1-∅;s              car/cars
    else if (sFormIn.endsWith('s')) {
      aFormsOut.push('nounEnglA1.' + sFormIn.slice(0, -1) + ';' + sFormIn)
      aFormsOut.push('nounEnglA2.' + sFormIn + ';' + sFormIn + 'es')
      return aFormsOut
    } else if (/[a-zA-Z]$/.test(sFormIn)) {
      aFormsOut.push('nounEnglA1.' + sFormIn + ';' + sFormIn + 's')
      return aFormsOut
    }
  }
  return []
}

/**
 * DOING: finds existing or POSSIBLE forms of any English-verb.
 * return: ['verbEnglA2:form1;form2',...] if found
 * return: [] if problem.
 */
async function fFindVerbForms (sFormIn) {
  let
    aForms = [],
    aFormsOut = [],
    n,
    sChar,
    sForm = '',
    sMethod = ''

  sFormIn = sFormIn.toLowerCase()
  // search for existing
  const aOut = await fFindKnownVerbForms(sFormIn)

  if (aOut.length >= 1) {
    // verbEnglA
    // verbEnglB
    // verbEnglC
    aFormsOut.push('SITE EXISTING FORMS:')
    for (n = 0; n < aOut.length; n++) {
      aFormsOut.push(aOut[n])
    }
    return aFormsOut
  } else {

    // find POSSIBLE forms
    aFormsOut.push('POSSIBLE FORMS:')

    // verbEnglA1.∅;s;ed;ing;ed: climb;climbs;climbed;climbing;climbed,
    // verbEnglA2.∅;s;ped;ping;ped: stop;stops;stopped;stopping;stopped,
    // verbEnglA3.∅;es;ed;ing;ed: miss;misses;missed;missing;missed,
    // verbEnglB1.e;es;ed;ing;ed: like;likes;liked;liking;liked,
    // verbEnglB2.y;ies;ied;ying;ied: study;studies;studied;studying;studied,
    
    // -ching: A3,
    // -shing: A3,
    // -ssing: A3,
    // -lling,
    // -ccing: 1 syl, 

    // -ling,
    // -ying,
    // -ched: A3,
    // -shed: A3,
    // -ssed: A3,
    // -ches: A3,
    // -shes: A3,
    // -sses: A3,

    // -oed: A3,
    // -oes: A3,
    // -xed: A3,
    // -xes: A3,
    // -ied,
    // -ing,
    // -ies,
    // -led,
    
    // -cc: A1,
    // -ed,
    // -es,

    // -w|x|y: A1,
    // -e,
    // -s,

    // 5 last chars    
    if (sFormIn.endsWith('ching')) {
      sForm = sFormIn.slice(0, -5)
      // verbEnglA3.touch;touches;touched;tou-ching;touched,
      aFormsOut.push('verbEnglA1.' +sForm+'ch;' +sForm+'ches;' +sForm+'ched;' +sForm+'ching;' +sForm+'ched')
      return aFormsOut
    }
    else if (sFormIn.endsWith('shing')) {
      sForm = sFormIn.slice(0, -5)
      // verbEnglA3.wash;washes;washed;wa-shing;washed,
      aFormsOut.push('verbEnglA1.' +sForm+'sh;' +sForm+'shes;' +sForm+'shed;' +sForm+'shing;' +sForm+'shed')
      return aFormsOut
    }
    else if (sFormIn.endsWith('ssing')) {
      sForm = sFormIn.slice(0, -5)
      // verbEnglA3.miss;misses;missed;mi-ssing;missed,
      aFormsOut.push('verbEnglA1.' +sForm+'ss;' +sForm+'sses;' +sForm+'ssed;' +sForm+'ssing;' +sForm+'ssed')
      return aFormsOut
    }
    else if (sFormIn.endsWith('lling')) {
      sForm = sFormIn.slice(0, -5)
      // verbEnglCA2.travel;travels;traveled|travelled;traveling|trave-lling;traveled|travelled,
      aFormsOut.push('verbEnglA3.' +sForm+'l;' +sForm+'ls;' +sForm+'led|' +sForm+'lled;' +sForm+'ling|' +sForm+'lling;' +sForm+'led|' +sForm+'lled')
      // verbEnglA1.call;calls;called;ca-lling;called
      aFormsOut.push('verbEnglA1.' +sForm+'ll;' +sForm+'lls;' +sForm+'lled;' +sForm+'lling;' +sForm+'lled')
      return aFormsOut
    }
    else if (sFormIn.endsWith('bbing') || // grab grabbing
             sFormIn.endsWith('dding') || // forbid forbidding
             sFormIn.endsWith('ffing') ||
             sFormIn.endsWith('gging') ||
             sFormIn.endsWith('hhing') ||
             sFormIn.endsWith('jjing') ||
             sFormIn.endsWith('kking') ||
             sFormIn.endsWith('mming') ||
             sFormIn.endsWith('nning') ||
             sFormIn.endsWith('pping') ||
             sFormIn.endsWith('qqing') ||
             sFormIn.endsWith('rring') ||
             sFormIn.endsWith('tting') ||
             sFormIn.endsWith('vving') ||
             sFormIn.endsWith('zzing') 
            ) {
      sForm = sFormIn.slice(0, -5)
      sChar = sFormIn[sFormIn.length - 5]
      // if first part is one syllable 
      if (/^[bcdfghjklmnpqrstvwxyz]+[aeiou]$/i.test(sForm)) {
        // verbEnglA2.stop;stops;stopped;stopping;stopped,
        aFormsOut.push('verbEnglA2.' +sForm+sChar+';' +sForm+sChar+'s;' +sForm+sChar+sChar+'ed;'
          +sForm+sChar+sChar+'ing;' +sForm+sChar+sChar+'ed')
        return aFormsOut
      }
      else if (/[bcdfghjklmnpqrstvwxyz]+[aeiou]$/i.test(sForm)) {
        // verbEnglA2.forbid;forbids;forbidded;forbidding;forbidded,
        aFormsOut.push('verbEnglA2.' +sForm+sChar+';' +sForm+sChar+'s;' +sForm+sChar+sChar+'ed;'
          +sForm+sChar+sChar+'ing;' +sForm+sChar+sChar+'ed: IF stress on last syllable')
        // verbEnglA1.open;opens;opened;opening;opened,
        aFormsOut.push('verbEnglA1.' +sForm+sChar+';' +sForm+sChar+'s;' +sForm+sChar+'ed;'
          +sForm+sChar+'ing;' +sForm+sChar+'ed: IF stress NOT on last syllable')
        return aFormsOut
      }
    }

    // 4 last
    else if (sFormIn.endsWith('ched')) {
      sForm = sFormIn.slice(0, -4)
      // verbEnglA3.touch;touches;tou-ched;touching;touched,
      aFormsOut.push('verbEnglA3.' +sForm+'ch;' +sForm+'ches;' +sForm+'ched;' +sForm+'ching;' +sForm+'ched')
      return aFormsOut
    }
    else if (sFormIn.endsWith('shed')) {
      sForm = sFormIn.slice(0, -4)
      // verbEnglA3.wash;washes;wa-shed;washing;washed,
      aFormsOut.push('verbEnglA3.' +sForm+'sh;' +sForm+'shes;' +sForm+'shed;' +sForm+'shing;' +sForm+'shed')
      return aFormsOut
    }
    else if (sFormIn.endsWith('ssed')) {
      sForm = sFormIn.slice(0, -4)
      // verbEnglA3.miss;misses;mi-ssed;missing;missed,
      aFormsOut.push('verbEnglA3.' +sForm+'ss;' +sForm+'sses;' +sForm+'ssed;' +sForm+'ssing;' +sForm+'ssed')
      return aFormsOut
    }
    else if (sFormIn.endsWith('ches')) {
      sForm = sFormIn.slice(0, -4)
      // verbEnglA3.touch;tou-ches;touched;touching;touched,
      aFormsOut.push('verbEnglA3.' +sForm+'ch;' +sForm+'ches;' +sForm+'ched;' +sForm+'ching;' +sForm+'ched')
      return aFormsOut
    }
    else if (sFormIn.endsWith('shes')) {
      sForm = sFormIn.slice(0, -4)
      // verbEnglA3.wash;wa-shes;washed;washing;washed,
      aFormsOut.push('verbEnglA3.' +sForm+'sh;' +sForm+'shes;' +sForm+'shed;' +sForm+'shing;' +sForm+'shed')
      return aFormsOut
    }
    else if (sFormIn.endsWith('sses')) {
      sForm = sFormIn.slice(0, -4)
      // verbEnglA3.miss;mi-sses;missed;missing;missed,
      aFormsOut.push('verbEnglA3.' +sForm+'ss;' +sForm+'sses;' +sForm+'ssed;' +sForm+'ssing;' +sForm+'ssed')
      return aFormsOut
    }
    else if (sFormIn.endsWith('oing')) {
      sForm = sFormIn.slice(0, -4)
      // verbEnglA3.veto;vetoes;vetoed;vet-oing;vetoed,
      aFormsOut.push('verbEnglA3.' +sForm+'o;' +sForm+'oes;' +sForm+'oed;' +sForm+'oing;' +sForm+'oed')
      return aFormsOut
    }
    else if (sFormIn.endsWith('ling')) {
      // verbEnglCA2.travel;travels;traveled|travelled;trave-ling|travelling;traveled|travelled,
      sForm = sFormIn.slice(0, -4)
      aFormsOut.push('verbEnglCA2.' +sForm+'l;' +sForm+'ls;' +sForm+'led|' +sForm+'lled;' +sForm+'ling|' +sForm+'lling;' +sForm+'led|' +sForm+'lled')
      return aFormsOut
    }
    else if (sFormIn.endsWith('ying')) {
      // verbEnglB2.y;ies;ied;ying;ied: study;studies;studied;stud-ying;studied,
      sForm = sFormIn.slice(0, -4)
      aFormsOut.push('verbEnglB2.' +sForm+'y;' +sForm+'ies;' +sForm+'ied;' +sForm+'ying;' +sForm+'ied')
      return aFormsOut
    }

    // 3 last chars
    else if (sFormIn.endsWith('oed')) {
      sForm = sFormIn.slice(0, -3)
      // verbEnglA3.veto;vetoes;vet-oed;vetoing;vetoed,
      aFormsOut.push('verbEnglA3.' +sForm+'o;' +sForm+'oes;' +sForm+'oed;' +sForm+'oing;' +sForm+'oed')
      return aFormsOut
    }
    else if (sFormIn.endsWith('oes')) {
      sForm = sFormIn.slice(0, -3)
      // verbEnglA3.veto;vet-oes;vetoed;vetoing;vetoed,
      aFormsOut.push('verbEnglA3.' +sForm+'o;' +sForm+'oes;' +sForm+'oed;' +sForm+'oing;' +sForm+'oed')
      return aFormsOut
    }
    else if (sFormIn.endsWith('xed')) {
      sForm = sFormIn.slice(0, -3)
      // verbEnglA3.mix;mixes;mi-xed;mixing;mixed,
      aFormsOut.push('verbEnglA3.' +sForm+'x;' +sForm+'xes;' +sForm+'xed;' +sForm+'xing;' +sForm+'xed')
      return aFormsOut
    }
    else if (sFormIn.endsWith('xes')) {
      sForm = sFormIn.slice(0, -3)
      // verbEnglA3.mix;mi-xes;mixed;mixing;mixed,
      aFormsOut.push('verbEnglA3.' +sForm+'x;' +sForm+'xes;' +sForm+'xed;' +sForm+'xing;' +sForm+'xed')
      return aFormsOut
    }
    else if (sFormIn.endsWith('ies')) {
      sForm = sFormIn.slice(0, -3)
      // verbEnglB2.y;ies;ied;ying;ied: study;stud-ies;studied;studying;studied,
      aFormsOut.push('verbEnglB2.' +sForm+'y;' +sForm+'ies;' +sForm+'ied;' +sForm+'ying;' +sForm+'ied')
      return aFormsOut
    }
    else if (sFormIn.endsWith('ied')) {
      sForm = sFormIn.slice(0, -3)
      // verbEnglB2.y;ies;ied;ying;ied: study;studies;stud-ied;studying;studied,
      aFormsOut.push('verbEnglB2.' +sForm+'y;' +sForm+'ies;' +sForm+'ied;' +sForm+'ying;' +sForm+'ied')
      return aFormsOut
    }
    else if (sFormIn.endsWith('led')) {
      sForm = sFormIn.slice(0, -3)
      // verbEnglA3.travel;travels;trave-led|travelled;traveling|travelling;traveled|travelled,
      aFormsOut.push('verbEnglA3.' +sForm+'l;' +sForm+'ls;' +sForm+'led|' +sForm+'lled;' +sForm+'ling|' +sForm+'lling;' +sForm+'led|' +sForm+'lled')
      return aFormsOut
    }
    else if (sFormIn.endsWith('ing')) {
      sForm = sFormIn.slice(0, -3)
      aForms = await fFindVerbForms(sForm)
      aForms.shift() // POSSIBLE FORMS remove
      // verbEnglB1.e;es;ed;ing;ed: like;likes;liked;lik-ing;liked,
      aFormsOut.push('verbEnglB2.' +sForm+'e;' +sForm+'es;' +sForm+'ed;' +sForm+'ing;' +sForm+'ed')
      for (n = 0; n < aForms.length; n++) {
        aFormsOut.push(aForms[n])
      }
      return aFormsOut
    }

    // 2 last chars
    else if (/[bcdfghjklmnpqrtvz]{2}$/i.test(sFormIn)) {
      // ends in two conconants no wxy
      // verbEnglA1.∅;s;ed;ing;ed: climb;climbs;climbed;climb-ing;climbed,
      aFormsOut.push('verbEnglA1.' +sFormIn+';' +sFormIn+'s;' +sFormIn+'ed;'
        +sFormIn+'ing;' +sFormIn+'ed:  ends in 2 consonants')
      return aFormsOut
    }
    else if (sFormIn.endsWith('ss')) {
      // verbEnglA3.∅;es;ed;ing;ed: miss;misses;miss-ed;missing;missed,
      aFormsOut.push('verbEnglA3.' +sFormIn+';' +sFormIn+'es;' +sFormIn+'ed;' +sFormIn+'ing;' +sFormIn+'ed')
      return aFormsOut
    }
    else if (/[aeiou][bcdfghjklmnpqrstvyz]$/i.test(sFormIn)) {
      // ends in VC
      const sForm2 = sFormIn.slice(0, -2)
      sForm = sFormIn.slice(0, -1)
      sChar = sFormIn[sFormIn.length-1]
      // if it is one syllable 
      if (/^[bcdfghjklmnpqrstvwxyz]+$/i.test(sForm2)) {
        if (sChar === 'y') {
          // verbEnglA1.play;plays;played;playing;played,
          aFormsOut.push('verbEnglA1.' +sFormIn+';' +sFormIn+'s;' +sFormIn+'ed;'
            +sFormIn+'ing;' +sFormIn+'ed')
        } else {
          // verbEnglA2.stop;stops;stopped;stopping;stopped,
          aFormsOut.push('verbEnglA2.' +sForm+sChar+';' +sForm+sChar+'s;' +sForm+sChar+sChar+'ed;'
            +sForm+sChar+sChar+'ing;' +sForm+sChar+sChar+'ed')
        }
      }
      else if (/[bcdfghjklmnpqrstvwxyz]+[aeiou]$/i.test(sForm2)) {
        // verbEnglA1.keep;keeps;keeped;keeping;keeped,
        aFormsOut.push('verbEnglA1.' +sFormIn+';' +sFormIn+'s;' +sFormIn+'ed;'
          +sFormIn+'ing;' +sFormIn+'ed:  long vowel')
      }
      else {
        // verbEnglA2.forbid;forbids;forbidded;forbidding;forbidded,
        aFormsOut.push('verbEnglA2.' +sForm+sChar+';' +sForm+sChar+'s;' +sForm+sChar+sChar+'ed;'
          +sForm+sChar+sChar+'ing;' +sForm+sChar+sChar+'ed: IF stress on last syllable')
        // verbEnglA1.open;opens;opened;opening;opened,
        aFormsOut.push('verbEnglA1.' +sForm+sChar+';' +sForm+sChar+'s;' +sForm+sChar+'ed;'
          +sForm+sChar+'ing;' +sForm+sChar+'ed: IF stress NOT on last syllable')
      }
      return aFormsOut
    }
    else if (sFormIn.endsWith('ed')) {
      sForm = sFormIn.slice(0, -2)
      // verbEnglA1.∅;s;ed;ing;ed: climb;climbs;climb-ed;climbing;climbed,
      aFormsOut.push('verbEnglA1.' +sForm+';' +sForm+'s;' +sForm+'ed;' +sForm+'ing;' +sForm+'ed')
      // verbEnglA3.∅;es;ed;ing;ed: miss;misses;miss-ed;missing;missed,
      aFormsOut.push('verbEnglA3.' +sForm+';' +sForm+'es;' +sForm+'ed;' +sForm+'ing;' +sForm+'ed')
      // verbEnglB1.e;es;ed;ing;ed: like;likes;lik-ed;liking;liked,
      aFormsOut.push('verbEnglB2.' +sForm+'e;' +sForm+'es;' +sForm+'ed;' +sForm+'ing;' +sForm+'ed')
      return aFormsOut
    }
    else if (sFormIn.endsWith('es')) {
      sForm = sFormIn.slice(0, -2)
      // verbEnglA3.∅;es;ed;ing;ed: miss;miss-es;missed;missing;missed,
      aFormsOut.push('verbEnglA3.' +sForm+';' +sForm+'es;' +sForm+'ed;' +sForm+'ing;' +sForm+'ed')
      // verbEnglB1.e;es;ed;ing;ed: like;lik-es;liked;liking;liked,
      aFormsOut.push('verbEnglB2.' +sForm+'e;' +sForm+'es;' +sForm+'ed;' +sForm+'ing;' +sForm+'ed')
      return aFormsOut
    }

    // 1 last char
    // -w|x|y: A1,
    // -e,
    // -s,
    else if (sFormIn.endsWith('w')) {
      // verbEnglA1.sho-w;shows;showed;showing;showed,
      aFormsOut.push('verbEnglA1.' +sFormIn+';' +sFormIn+'s;' +sFormIn+'ed;' +sFormIn+'ing;' +sFormIn+'ed')
      return aFormsOut
    }
    else if (sFormIn.endsWith('x')) {
      // verbEnglA3.box;boxes;boxed;boxing;boxed,
      aFormsOut.push('verbEnglA3.' +sFormIn+';' +sFormIn+'es;' +sFormIn+'ed;' +sFormIn+'ing;' +sFormIn+'ed')
      return aFormsOut
    }
    else if (sFormIn.endsWith('y')) {
      sForm = sFormIn.slice(0, -1)
      // if vowel+y => verbEnglA1
      if (/[aeiou]$/i.test(sForm)) {
        // verbEnglA1.play;plays;played;playing;played,
        aFormsOut.push('verbEnglA1.' +sFormIn+';' +sFormIn+'s;' +sFormIn+'ed;' +sFormIn+'ing;' +sFormIn+'ed')
      } else {
        // verbEnglB2.study;studies;studied;studying;studied,
        aFormsOut.push('verbEnglB2.' +sForm+'y;' +sForm+'ies;' +sForm+'ied;' +sForm+'ying;' +sForm+'ied')
     }
      return aFormsOut
    }
    else if (sFormIn.endsWith('e')) {
      sForm = sFormIn.slice(0, -1)
      // verbEnglB1.lik-e;likes;liked;liking;liked,
      aFormsOut.push('verbEnglA1.' +sForm+'e;' +sForm+'es;' +sForm+'ed;' +sForm+'ing;' +sForm+'ed')
      return aFormsOut
    }
    else if (sFormIn.endsWith('s')) {
      sForm = sFormIn.slice(0, -1)
      aFormsOut.push('verbEnglA1.' +sForm+';' +sForm+'s;' +sForm+'ed;' +sForm+'ing;' +sForm+'ed')
      return aFormsOut
    }
    else if (/[a-zA-Z]$/.test(sFormIn)) {
      aFormsOut.push('verbEnglA1.' +sFormIn+';' +sFormIn+'s;' +sFormIn+'ed;' +sFormIn+'ing;' +sFormIn+'ed')
      return aFormsOut
    }
  }
  return []
}

/**
 * DOING: test in input char is consonant, except 'y'
 * INPUT: sCharIn
 * OUTPUT: boolean
 */
function fIsConsonantExceptY(sCharIn) {
  sCharIn = sCharIn.toLowerCase();
  // Ensure input is a single letter
  if (typeof sCharIn !== 'string' || sCharIn.length !== 1 || sCharIn === 'y') return false;

  return /[a-z]/.test(sCharIn) && !/[aeiou]/.test(sCharIn)
}

//console.log(await fFindNounForms('tomato'))
//console.log(fIsConsonantExceptY('t'))

export {
  fFindKnownNounForms,
  fFindKnownVerbForms,
  fFindNounForms,
  fFindVerbForms,
  fIsConsonantExceptY,
  fIsIrregularNoun,
  fIsIrregularVerb
}
