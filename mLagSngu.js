/*
 * mLagSngu.js - module with misc util language functions.
 * The MIT License (MIT)
 *
 * Copyright (c) 2025 Kaseluris.Nikos.1959 (Synagonism)
 * kaseluris.nikos@gmail.com
 * https://synagonism.net/
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
import * as omConcept from './mConcept.js'

const
  // contains the-versions of mLagSngu.js
  aVersion = [
    'mLagSngu.js.1-2-0.2026-06-20: fIsMultiword',
    'mLagSngu.js.1-1-0.2026-06-19: argu, fIsValidWord',
    'mLagSngu.js.1-0-0.2025-11-09: fPickWeightedRandomElement',
    'mLagSngu.js.0-2-0.2025-11-09: fCreateNewWord',
    'mLagSngu.js.0-1-0.2025-11-08: creation'
  ],
  sFileSngu = omMcsh.sPathSite + 'dirMcsh/dirLag/McshLag000010.last.html',
  aVowl = ['a','e','o','i','u'],
  aCons = ['b','v','d','dh','j','z','g','y','n','l','p','f','t','th','c','s','k','h','m','r'],
  aSylb = [
    // english: C: 65%, Ø: 22%, CC: 12%, CCC: 1%
    // english: /s, t, p, k, b, d, f, m, n, r, l, w, h, g, j/
    // english: /pr, br, tr, dr, kr, gr, pl, bl, kl, gl/ /fl, fr/ /sp, st, sk/  /sl, sm, sn, sw/  /tw, dw, kw, gw/
    
    // slavic: plosives /p, t, k, b, d, g/ fricatives /s, v, z, ʃ/
    
    // Chinese: sh, j, zh, l** | ~5% - 7%
    // Chinese: y, d, b, z, w** | ~4% - 5%
    // Chinese: g, h, x, t, m, r** | ~3% - 4
    // Chinese: q, k, n, s, c** | ~2% - 3%
    // Chinese: f, p, ch** | ~1% - 2% 
    's;80','ss;70','z;74','zz;40','c;79','cc;69','j;69','jj;50','y;78','yy;68',
    'h;64','l;77','ll;67','t;76','b;75','p;64',
    'd;75','g;74','gg;40','k;64','m;73','n;72','nn;72','v;71','f;70','r;60',
    'dh;30','th;30',
    'a;59','e;59','i;59','o;59','u;59',
    'pl;9','pll;9','pn;9','pr;9','ps;9','pt;5',
    'fl;9','fr;9','ft;9',
    'tr;9',
    'sf;4','sh;4','sk;9','sl;9','sn;9','sp;9','sr;9','st;9',
    'cn;9','cp;9','cr;9',
    'kl;9','kn;9','kr;9','ks;9','kt;9','kv;9',
    'hk;9','hl;9','hn;9','hp;9','hr;9','hs;9','ht;9',
    'mn;9',
    'gl;9','gll;9','gn;9','gr;9',
    'yr;9',
    'lv;9',
    'dr;9','dv;9',
    'skl;5','skr;5','spr;9','str;5',
    'vl;9','vr;9',
    'bl;9','bll;1','br;9',
    'dhr;2','dhyy;2',
    'thl;2','thn;2','thr;2'
  ],
  aSylb2 = [
    'p;74','f;74','th;74','t;74','s;74','c;74','k;74','h;74','m;74','r;74',
    'b;74','v;74','dh;74','d;74','z;74','j;74','g;74','g;70','y;74','yy;70','n;74','nn;70','l;74','ll;70',
    'a;22','e;22','i;22','o;22','u;22','dh;22',
    'pc;9','pf;9','ph;9','phh;9','pk;9','pkk;9','pl;9','pll;9','pn;9','pnn;9','pr;9','ps;9','pt;9','pth;9','pyy;9',
    'fc;9','fh;9','fhh;9','fk;9','fkk;9','fl;9','fn;9','fnn;9','fp;9','fr;9','fs;9','ft;9','fth;9',
    'thc;9','thf;9','thh;9','thhh;9','thj;9','thk;9','thkk;9','thl;9','thll;9','thn;9','thnn;9','thr;9','ths;9','tht;9','thyy;9',
    'tf;9','tk;9','tkk;9','tl;9','tll;9','tn;9','tnn;9','tp;9','tr;9','tr;9','tth;9',
    'sc;9','scc;9','sf;9','sh;9','sk;9','skl;9','skr;9','sl;9','sn;9','snn;9','sp;9','spr;9','sr;9','ss;9','st;9','sth;9',
    'cf;9','ch;9','ck;9','cl;9','cn;9','cnn;9','cp;9','cr;9','ct;9','cth;9',
    'kc;9','kf;9','kh;9','khh;9','kl;9','kll;9','kn;9','knn;9','kp;9','kr;9','ks;9','kt;9','kth;9','kv;9',
    'hc;9','hf;9','hk;9','hkk;9','hl;9','hll;9','hn;9','hnn;9','hp;9','hr;9','hs;9','ht;9','hth;9',
    'mb;9','mc;9','md;9','mdh;9','mf;9','mg;9','mgg;9','mh;9','mhh;9','mj;9','ml;9','mll;9','mn;9','mnn;9','mr;9','mth;9','mv;9','my;9','myy;9','mz;9',
    'rb;9','rc;9','rd;9','rdh;9','rf;9','rg;9','rgg;9','rh;9','rhh;9','rj;9','rk;9','rkk;9','rl;9','rll;9','rm;9','rn;9','rnn;9','rp;9','rs;9','rt;9','rth;9','rv;9','ry;9','ryy;9','rz;9',
    'bd;9','bdh;9','bg;9','bgg;9','bj;9','bl;9','bll;9','bn;9','bnn;9','br;9','bv;9','by;9','byy;9','bz;9',
    'vb;9','vd;9','vdh;9','vg;9','vgg;9','vj;9','vl;9','vll;9','vn;9','vnn;9','vr;9','vy;9','vyy;9','vz;9',
    'dhb;9','dhd;9','dhg;9','dhgg;9','dhj;9','dhl;9','dhll;9','dhn;9','dhnn;9','dhr;9','dhv;9','dhy;9','dhyy;9',
    'ddh;9','dg;9','dgg;9','dj;9','dl;9','dll;9','dn;9','dnn;9','dr;9','dr;9','dv;9','dy;9','dyy;9','dz;9',
    'zc;9','zcc;9','zl;9','zn;9','znn;9','zr;9','zt;9','zth;9',
    'jd;9','jdh;9','jg;9','jgg;9','jj;9','jl;9','jll;9','jn;9','jnn;9','jr;9','jy;9','jyy;9',
    'gd;9','gdh;9','gg;9','gl;9','gll;9','gn;9','gnn;9','gr;9','gv;9','gz;9',
    'yd;9','ydh;9','yg;9','ygg;9','yy;9','yl;9','yll;9','yn;9','ynn;9','yr;9','yv;9','yz;9',
    'nb;9','nc;9','nd;9','ndh;9','nf;9','ng;9','ngg;9','nh;9','nhh;9','nn;9','nk;9','nkk;9','nl;9','nll;9','nm;9','nn;9','np;9','nr;9','ns;9','nt;9','nth;9','nv;9','ny;9','nyy;9','nz;9',
    'lb;9','lc;9','ld;9','ldh;9','lf;9','lg;9','lh;9','ll;9','lk;9','ll;9','ln;9','lp;9','lr;9','ls;9','lt;9','lth;9','lv;9','ly;9','lz;9',
    'str;5'
  ]

/**
 * DOING: it creates a-new Sinagu-word
 * INPUT: WordType, SyllableNumber, StartPart
 * OUTPUT: a-Sinagu-word
 */
function fCreateNewWord (sTypeIn, nSylbIn, sStartIn) {
  let
    sSylb1 = '',
    sSylb2 = '',
    sSylb3 = '',
    sSylb4 = '',
    sSylb5 = '',
    nSylbStart = 0,
    sWordOut = ''

  nSylbIn = Number(nSylbIn)
  // create the-syllables asked
  if (sTypeIn === 'argu') {
    sSylb1 = fPickArguSylb()
    sSylb2 = fPickArguSylb()
    sSylb3 = fPickArguSylb()
    sSylb4 = fPickArguSylb()
    sSylb5 = fPickArguSylb()
  } else if (sTypeIn === 'verb') {
    sSylb1 = fPickVerbSylb()
    sSylb2 = fPickVerbSylb()
    sSylb3 = fPickVerbSylb()
    sSylb4 = fPickVerbSylb()
    sSylb5 = fPickVerbSylb()
  } else if (sTypeIn === 'conjunction') {
    sSylb1 = fPickConjSylb()
    sSylb2 = fPickConjSylb()
    sSylb3 = fPickConjSylb()
    sSylb4 = fPickConjSylb()
    sSylb5 = fPickConjSylb()
  }
  //console.log(sSylb1)
  if (sStartIn !== '' && !'aeiou'.includes(sStartIn.slice(-1))
      && (sStartIn.length === 1 && 'aeiou'.includes(sStartIn))) {
    if (sTypeIn === 'argu') sStartIn = sStartIn + fPickArguVowel()
    else if (sTypeIn === 'verb') sStartIn = sStartIn + fPickVerbVowel()
    else if (sTypeIn === 'conjunction') sStartIn = sStartIn + fPickConjVowel()
  }
  nSylbStart = fCountSyllables(sStartIn)
  //console.log(sStartIn)
  if (nSylbIn <= nSylbStart) {
    sWordOut = fPickFirstSyllables(sStartIn, nSylbIn)
  } else if (nSylbIn - nSylbStart === 1) {
    sWordOut = sStartIn + sSylb1
  } else if (nSylbIn - nSylbStart === 2) {
    sWordOut = sStartIn + sSylb1 + sSylb2
  } else if (nSylbIn - nSylbStart === 3) {
    sWordOut = sStartIn + sSylb1 + sSylb2 + sSylb3
  } else if (nSylbIn - nSylbStart === 4) {
    sWordOut = sStartIn + sSylb1 + sSylb2 + sSylb3 + sSylb4
  } else if (nSylbIn - nSylbStart === 5) {
    sWordOut = sStartIn + sSylb1 + sSylb2 + sSylb3 + sSylb4 + sSylb5
  } 
  // make word match type
  if (sTypeIn === 'argu') sWordOut = sWordOut.slice(0, -1) + 'u'
  else if (sTypeIn === 'verb') sWordOut = sWordOut.slice(0, -1) + 'i'
  else if (sTypeIn === 'conjunction') sWordOut = sWordOut.slice(0, -1) + 'a'
  // clear
  sWordOut = sWordOut.replace('cci', 'ci')
  sWordOut = sWordOut.replace('cce', 'ce')
  sWordOut = sWordOut.replace('jji', 'ji')
  sWordOut = sWordOut.replace('jje', 'je')
  sWordOut = sWordOut.replace('kki', 'ki')
  sWordOut = sWordOut.replace('kke', 'ke')
  sWordOut = sWordOut.replace('ggi', 'gi')
  sWordOut = sWordOut.replace('gge', 'ge')
  sWordOut = sWordOut.replace('hhi', 'hi')
  sWordOut = sWordOut.replace('hhe', 'he')
  sWordOut = sWordOut.replace('yyi', 'yi')
  sWordOut = sWordOut.replace('yye', 'ye')
  sWordOut = sWordOut.replace('lli', 'li')
  sWordOut = sWordOut.replace('lle', 'le')
  sWordOut = sWordOut.replace('nni', 'ni')
  sWordOut = sWordOut.replace('nne', 'ne')
  sWordOut = sWordOut.replace('ssi', 'si')
  sWordOut = sWordOut.replace('sse', 'se')
  sWordOut = sWordOut.replace('zzi', 'zi')
  sWordOut = sWordOut.replace('zze', 'ze')
  return sWordOut
}

/**
 * DOING: it counts the-vowels, same with syllables
 */
function fCountSyllables(sIn) {
  const sVowels = 'aeiouAEIOU';
  let nCount = 0;
  for (let sChar of sIn) {
    if (sVowels.includes(sChar)) {
      nCount++;
    }
  }
  return nCount;
}

/**
 * DOING: check if name is multiword
 * INPUT: name, [type (argu, verb, conjunction)]
 * OUTPUT: a) "multiword" b) "not-multiword: reason"
 */
async function fIsMultiword(sIn) {
  // a-name is multiword if contains the-last letter AND the-created parts are names. {2026-06-19} 
  // example: karublanku, karuBlanku, karu.blanku, karusHoilu, karus-huilu,
  let aParts = fSplitOnLastLetter(sIn)
  aParts = aParts.map(str =>
    str
      .replace("s-", "")          // removes first "s-": "karus-huilu"
      .replace(/s(?=[A-Z])/, "")  // removes first "s" if next char is capital: "karusHoilu"
      .replace(/^[.-]+/, "")      // removes "." or "-" only from the beginning: "karu.blanku"
  );
  // must have at least 2 parts for a real multiword
  if (!Array.isArray(aParts) || aParts.length < 2) {
    return "not-multiword: no valid split; ";
  }

  const aaResult = await Promise.all(
    aParts.map(async sName => [sName, await fIsExistingName(sName)])
  );

  let sReason = "not-multiword: ";

  for (const [sName, sResult] of aaResult) {
    if (sResult !== "name") {
      sReason += `${sName}:${sResult}; `;
    }
  }

  return sReason === "not-multiword: "
    ? "multiword"
    : sReason;
}

/**
 * DOING: search sinagu-names for mach.
 * INPUT: a-string.
 * OUTPUT: a) [[name,link]] b) [[not-name, not-found|invalid...]]
 */
async function fIsExistingName(sNameIn, sTypeIn) {
  if (typeof sNameIn !== "string" || sNameIn.length === 0) {
    return [["not-existing-name","invalid input"]];
  }
  // valid ending
  const oEndings = {
    argu: 'u',
    verb: 'i',
    conjunction: 'a'
  }
  const sExpected_last_char = oEndings[sTypeIn]
  // not one of 3 name-types
  if (!Object.hasOwn(oEndings, sTypeIn)) {
    return [["not-existing-name", "invalid type"]];
  }
  else if (sNameIn.at(-1) !== sExpected_last_char) {
    return [["not-existing-name",`last char must-BE -${sExpected_last_char} for type: ${sTypeIn}`]];
  }


  const aaJson = await omMcsh.fSearchName(sNameIn, "lagSngu"); 
  // aaJson format: [[name, link], [name, link], ...]

  const aaMatched = aaJson.filter(row => {
    const sName = row[0];
    const sFirstPart = sName.split("!")[0];
    return sNameIn.toLowerCase() === sFirstPart.toLowerCase();
  });

  if (aaMatched.length === 0)
    return [["not-existing-name","not-found"]];
  else
    return aaMatched;
}

/**
 * DOING:
 * INPUT: a-name and its type.
 * OUTPUT: a) "valid-name", b) "not-valid-name: reason"
 */
async function fIsValidName(sNameIn, sTypeIn) {
  // 1) existing-name
  // 2) new name

  // valid string
  if (typeof sNameIn !== "string" || sNameIn.length === 0) {
    return "not-valid-name: invalid input";
  }
  // valid ending
  const oEndings = {
    argu: 'u',
    verb: 'i',
    conjunction: 'a'
  }
  const sExpected_last_char = oEndings[sTypeIn]
  if (sNameIn.at(-1) !== sExpected_last_char) {
    return `not-valid-name: last char must-BE -${sExpected_last_char} for type: ${sTypeIn}`
  }

  // existing name|no-name
  const aaExistingName = await fIsExistingName(sNameIn)
  //[[name,link]] [[not-name, not-found|invalid...]]
  const setLinks = new Set();
  // find names with different links|concepts
  const aaExistingNameDifLink = aaExistingName.filter(([sName, sLink]) => {
    if (setLinks.has(sLink)) {
      return false;
    }
    setLinks.add(sLink);
    return true;
  });
  // found name
  if (aaExistingNameDifLink[0][0] !== "not-name") {
    if (aaExistingNameDifLink.length > 1)
      return "invalid-name: denotes more than one concept"
    // if multiword, validate each
  }
}

/**
 * DOING: check if
 *        - argus end in -u and have no -u internally
 *        - verbs end in -i and have no -i internally
 *        - conjunctions end in -a and have no -a internally
 * INPUT: a-word and its type
 * OUPT: a) "valid", b) "not-valid: reason"
 */
function fIsValidWord(sIn, sTypeIn) {
  const oEndings = {
    argu: 'u',
    verb: 'i',
    conjunction: 'a'
  }
  const sExpected_last_char = oEndings[sTypeIn]
  let bInternalWrong = false

  if (!Object.hasOwn(oEndings, sTypeIn)) {
    return 'not-valid: invalid type'
  }
  if (typeof sIn !== 'string' || sIn.length === 0) {
    return 'not-valid: invalid word'
  }

  for (let n = 0; n < sIn.length; n++) {
    const sChar = sIn[n]

    if (n === sIn.length - 1) {
      const bLastWrong = sChar !== sExpected_last_char

      if (bLastWrong && bInternalWrong) {
        return `not-valid: last char must-BE -${sExpected_last_char} AND internal char must-NOT-be -${sExpected_last_char} for type: ${sTypeIn}`
      }

      if (bLastWrong) {
        return `not-valid: last char must-BE -${sExpected_last_char} for type: ${sTypeIn}`
      }

      if (bInternalWrong) {
        return `not-valid: internal char must-NOT-be -${sExpected_last_char} for type: ${sTypeIn}`
      }
    } else if (sChar === sExpected_last_char) {
      bInternalWrong = true
    }
  }

  return 'valid'
}

/**
 * DOING: returns a-random element of a-waited-array ['a;74','b;8']
 */
function fPickWeightedRandomElement(aIn) {
  const
    nTotalWeight = aIn.reduce((nTotal, sItem) => nTotal + Number(sItem.split(';')[1]), 0),
    // normalize array to sum 1
    aInNrm = aIn.map(w => w.split(';')[0]+';'+w.split(';')[1]/nTotalWeight)
  let
    nIdx = 0,
    nP = Math.random(),
    nSum = 0

  if (aIn.length === 0) {
    return null; // Handle empty array
  }
  for (let n = 0; n < aInNrm.length; n++) {
    if (nSum < nP && nP <= nSum + Number(aInNrm[n].split(';')[1])) return aInNrm[n].split(';')[0]
    nSum = nSum + Number(aInNrm[n].split(';')[1])
  }
  // Fallback (should rarely happen)
  return aInNrm[5].split(';')[0];
}

/**
 * DOING: returns a-random element of an-array
 */
function fPickRandomElement(aIn) {
  if (aIn.length === 0) {
    return null; // Handle empty array
  }
  const nRandomIndex = Math.floor(Math.random() * aIn.length);
  return aIn[nRandomIndex];

  /* 
  let
    nRandomIndex = 0,
    nP = Math.random(),
    nSum = 0
  for (let n = 0; n < aIn.length; n++) {
    if (nSum < nP && nP <= nSum + (1.0/aIn.length)) nRandomIndex = n
    nSum = nSum + (1.0/aIn.length);
  }
  return aIn[nRandomIndex]
  */
}

/**
 * DOING: returns a-random a,e,o,i
 */
function fPickArguVowel() {
  return fPickRandomElement(['a','e','o','i'])
}
function fPickArguSylb() {
  let sSylb = fPickWeightedRandomElement(aSylb)
  if (sSylb.length === 1 && 'aeiou'.includes(sSylb))
    return fPickRandomElement(['a','e','o','i'])
  else
    return sSylb + fPickRandomElement(['a','e','o','i'])
}

/**
 * DOING: returns a-random a,e,o,u
 */
function fPickVerbVowel() {
  return fPickRandomElement(['a','e','o','u'])
}
function fPickVerbSylb() {
  let sSylb = fPickWeightedRandomElement(aSylb)
  if (sSylb.length === 1 && 'aeiou'.includes(sSylb))
    return fPickRandomElement(['a','e','o','u'])
  else
    return sSylb + fPickRandomElement(['a','e','o','u'])
}

/**
 * DOING: returns a-random e,i,o,u
 */
function fPickConjVowel() {
  return fPickRandomElement(['e','o','i','u'])
}
function fPickConjSylb() {
  let sSylb = fPickWeightedRandomElement(aSylb)
  if (sSylb.length === 1 && 'aeiou'.includes(sSylb))
    return fPickRandomElement(['e','o','i','u'])
  else
    return sSylb + fPickRandomElement(['e','o','i','u'])
}

/**
 * DOING: returns first syllables of a-string
 */
function fPickFirstSyllables(sIn, nSylbIn) {
  let
    n,
    nCounter = 0,
    sOut = '',
    sSylbOut

  for (n = 0; n < sIn.length; n++) {
    sOut = sOut + sIn[n]
    if ('aeiou'.includes(sIn[n])) {
      // found vowel
      nCounter = nCounter + 1
      sSylbOut = sOut
      if (nCounter === nSylbIn) return sSylbOut
    }
  }
  // return only syllables
  return sSylbOut
}

/**
 * DOING: separates a-string on last letter.
 * INPUT: a-string.
 * OUTPUT: an-array of its parts on last letter.
 */
function fSplitOnLastLetter(sIn) {
  const sLastChar = sIn[sIn.length - 1];
  const aOut = [];
  let sPart = "";

  for (const sChar of sIn) {
    sPart += sChar;

    if (sChar === sLastChar) {
      aOut.push(sPart);
      sPart = "";
    }
  }

  return aOut;
}

// tests:
// console.log(await fIsExistingName("kro"));
// console.log(await fIsExistingName("kra"));
// console.log(await fIsExistingName("ka"));
// console.log(await fIsMultiword("karu"))
// console.log(await fIsValidName("karu", "argu"))

export {
  fCreateNewWord,
  fIsExistingName,
  fIsValidName,
  fIsValidWord
}