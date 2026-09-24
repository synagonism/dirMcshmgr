/*
 * mNamidxSftp.mjs - creates name-indexes and uploads the-files
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 - 2025 Kaseluris.Nikos.1959 (hmnSngu)
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
 *   it works as stand-alone.
 *   1) it updates the-names of Mcs-files in dirManager/namidx.txt, in index-files.
 *   2) it appends the-file 'sftp.json' that contains the-changed files we have to upload.
 *   3) it computes the-number of names.
 *   4) it computes the-number of concepts.
 *   5) it UPLOADS the-files
 *
 * INPUT: dirManager/namidx.txt
 * OUTPUT: dirLang/namidx.lagLangX.json, namidx.lagRoot.json, Mcshqnt.json,
           dirManager/SftpOnly.json,
 * RUN from worldview: node ../dirMcshmgr/mNamidxSftp.mjs
 *
 */

import moFs from 'fs'
import {fNamidx} from './mNamidx.mjs'
import {oSftp, fSftp} from './mSftp.mjs'

const
  // contains the-versions of mHitp.js
  aVersion = [
    'mNamidxSftp.mjs.0-8-0.2026-09-24: auto-add + sort new DIRS in Mcshqnt.root.json',
    'mNamidxSftp.mjs.0-7-0.2025-12-01: index and upload',
    'mNamidxOnly.mjs.0-6-0.2025-11-30: clear only index',
    'mNamidxOnly.mjs.0-5-0.2022-03-17: only index',
    'mNamidx.mjs.0-4-0.2022-02-09: p-Mcs',
    'mNamidx.mjs.0-2-0.2021-12-31: lagEspo',
    'mNamidx.mjs.0-1-0.2021-11-29: creation',
    'namidx: {2021-11-19} index-files-comments',
    'namidx: {2021-11-15} reference-index-file',
    'namidx: {2021-11-14} Chinese-indices',
    'namidx: {2021-11-01} solved char on other-lags but not on denoted',
    'namidx: {2021-05-02} .mjs',
    'namidx: {2021-04-04} lagALLL',
    'namidx: {2021-04-03} oSetFileUp',
    'namidx: {2021-03-25} * lagEngl lagElln',
    'namidx: {2021-01-04} * McshSngo',
    'namidx: {2020-10-19} * Mcs. for section and paragraph-Mcs',
    'namidx: {2020-10-18} McsP.',
    'namidx: {2019-12-11} cptqnt.root.json',
    'namidx: {2019-09-05} lagKmo',
    'namidx: {2018-10-25} cptqnt.json',
    'namidx: {2018-10-16} * Mcs.',
    'namidx: {2018-09-22}',
    'namidx: {2017-06-01} created'
  ]

let
  aFileMcsInComments,
  aFileMcsTxt = [],
  aLagAlone = undefined


aFileMcsInComments = moFs.readFileSync('dirManager/namidx.txt').toString().split('\n')

/**
 * a) find Mcs-files to remove|add its names and put paths in aFileMcsIn.
 * b) find languages to work-with.
 */
for (let n = 0; n < aFileMcsInComments.length; n++) {
  let sLn = aFileMcsInComments[n]

  // remove comments and empty-lines
  if (!sLn.startsWith('//') && sLn.length !== 0) {
    if (sLn.startsWith('lag')) {
      if (!aLagAlone) aLagAlone = []
      aLagAlone.push(sLn.substring(0,7))
      // aLag = ['lagALLL'] or ['lagElln','lagEngl',...]
    } else {
      // remove comments after ;
      if (sLn.indexOf(';') > 0) {
        aFileMcsTxt.push(sLn.substring(0,sLn.lastIndexOf(';')))
      } else {
        aFileMcsTxt.push(sLn)
      }
    }
  }
}

// create name-indices
fNamidx(aFileMcsTxt)

// upload files
fSftp()