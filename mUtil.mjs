/*
 * mUtil.mjs - module with utility code
 * The MIT License (MIT)
 *
 * Copyright (c) 2021-2022 Kaseluris.Nikos.1959 (hmnSngo)
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

import moFs from 'fs'

const
  // contains the-versions of mHitp.js 
  aVersion = [
    'mUtil.mjs.0-1-0.2021-11-29: creation'
  ]

/**
 * DOING: it checks if a-string is-included in array-elements [["a","b"],["c","d"]]
 */
function fAArrayIncludes(aIn, sIn) {
  let
    bOut = false,
    aElm

  for (aElm of aIn) {
    if (aElm.includes(sIn)) {
      bOut = true
      break
    }
  }
  return bOut
}

/**
 * Remove duplicates of an-array-of-arrays [["a","b"],["a","c"],["a","b"],["c","d"]]
 */
function fAArrayRemoveDupl(aIn) {
  let
    aHelp = [],
    aOut = [],
    sElt

  for (n = 0; n < aIn.length; n++) {
    sElt = aIn[n].join('JJ')
    if (!aHelp.includes(sElt)) {
      aHelp.push(sElt)
      aOut.push(aIn[n])
    }
  }
  return aOut
}

/**
 * DOING: it sorts an-array-of-arrays [["a","c"],["c","d"],["a","b"]]
 */
function fAArraySort(aIn) {
  aIn = aIn.sort(fCompare)
  function fCompare(aA, aB) {
    return aA[0] > aB[0] ? 1 : -1
  }
  return aIn
}

/*
 * OUTPUT: current-date in format: 2017-10-17
 */
function fDateYMD() {
  var
    oD, sY, sM, sD;
  oD = new Date();
  sY = oD.getFullYear().toString();
  sM = (oD.getMonth() + 1).toString();
  if (sM.length == 1) {
    sM = "0" + sM;
  }
  sD = oD.getDate().toString();
  if (sD.length == 1) {
    sD = "0" + sD;
  }
  return sY + "-" + sM + "-" + sD;
}

/*
 * OUTPUT: current-date in format: 20190908
 */
function fDateYMD2 () {
  var
    oD, sY, sM, sD;
  oD = new Date();
  sY = oD.getFullYear().toString();
  sM = (oD.getMonth() + 1).toString();
  if (sM.length == 1) {
    sM = "0" + sM;
  }
  sD = oD.getDate().toString();
  if (sD.length == 1) {
    sD = "0" + sD;
  }
  return sY + sM + sD;
}

/**
 * DOING:
 *  it creates a-json-file from array of arrays ONLY, with no extra info.
 */
function fWriteJsonArray(sFilIn, aIn) {
  let
    s

  // aIn length more than 1
  s = '[\n'
  for (let n = 0; n < aIn.length-1; n++) {
    s = s +'  ' + JSON.stringify(aIn[n]) + ',\n'
  }
  s = s + '  ' + JSON.stringify(aIn[aIn.length-1]) + '\n'
  s = s + ']'
  // create the-parent-dir on demand, so a-fresh-worldview needs no pre-created dirs
  let sDir = sFilIn.substring(0, sFilIn.lastIndexOf('/'))
  if (sDir) moFs.mkdirSync(sDir, { recursive: true })
  moFs.writeFileSync(sFilIn, s)
}

/**
 * DOING:
 *  it creates a-json-object-file from a-Javascript-object.
 */
function fWriteJsonObject(sFilIn, oIn) {
  let
    k,
    s

  s = '{\n'
  for (k in oIn) {
    s = s +'  "' + k + '":"' +oIn[k] + '",\n'
  }
  s = s.substring(0, s.length-2) + '\n}'
  // create the-parent-dir on demand, so a-fresh-worldview needs no pre-created dirs
  let sDir = sFilIn.substring(0, sFilIn.lastIndexOf('/'))
  if (sDir) moFs.mkdirSync(sDir, { recursive: true })
  moFs.writeFileSync(sFilIn, s)
}

export {
  fAArrayIncludes, fAArrayRemoveDupl, fAArraySort,
  fDateYMD, fDateYMD2,
  fWriteJsonArray, fWriteJsonObject
}