/*
 * mEllnTtfm.mjs - module that converts Greek text to phonemic-notation
 * The MIT License (MIT)
 *
 * Copyright (c) 2022 Kaseluris.Nikos.1959 (hmnSngo)
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
 *
 * DOING:
 *   it works as a-module AND stand-alone.
 *   1) it reads the-wrdidx.txt, and creates the-word-concepts for the-words in.
 *   2) it creates the-file 'sftp.json' that contains the-changed files we have to upload.
 *   3) it computes the-number of names.
 *   4) it computes the-number of concepts.
 *   5) it uploads the-files
 * INPUT: wrdidx.txt
 * OUTPUT: dirWrdidx/dirLang/wrdidx.lagLangX.last.html, wrdidx.lagRoot.json, Mcshqnt.json, sftp.json,
 *
 * RUN: node Mcsmgr/mEllnTtfm.mjs pwd ALONE|ANYTHING
 *
 * PROBLEM:
 * - 
 *
 */

import moFs from 'fs';
import mfReadlines from 'n-readlines'; // npm install n-readlines
//import mfClient from 'ssh2-sftp-client'
//import mfEs6_promise_pool from 'es6-promise-pool'
//import {oSftp, fSftp} from './mSftp.mjs'
//import {fWriteJsonArray} from './mUtil.mjs'
import * as moLagUtil from './mLagUtil.js'

const
  // contains the-versions of mHitp.js 
  aVersion = [
    'mEllnTtfm.mjs.0-1-0.2022-02-11: created'
  ]

let
  sFileIn = 'wrd.txt',
  sFileOut = 'wrdidx.txt'


/**
 * DOING: it finds the-phonemic-notation of Greek-words
 */
function mEllnTtfm(sFileIn, sFileOut) {
  let
    aFileIn,
    aFile = [],
    n,
    s = '',
    sLn

  aFileIn = moFs.readFileSync(sFileIn).toString().split('\n')

  for (n = 0; n < aFileIn.length; n++) {
    sLn = aFileIn[n]
    //finds pronunciation
    sLn = sLn + moLagUtil.fGreekwordFindPhonema(sLn)
    //add on new array
    aFile[n] = sLn
  }

  //create string of new array
  for (n = 0; n < aFile.length; n++) {
    sLn = aFile[n]
    s = s + sLn + '\n'
  }

  //write new file
  moFs.writeFileSync(sFileOut, s)
}
mEllnTtfm(sFileIn, sFileOut)

export {mEllnTtfm}