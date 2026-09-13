/*
 * mWatch.mjs - module that watches for changes in *.last.html, creates name-indexes,
 *   and uploads the-files
 * The MIT License (MIT)
 *
 * Copyright (c) 2021-2026 Kaseluris.Nikos.1959 (hmnSngu)
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
 *
 * DOING: watch changes on files ending .last.html
 * INPUT:
 * OUTPUT:
 * RUN from worldview: node ../dirMcshmgr/mWatch.mjs pwd
 *
 */

import moFs from 'fs'
import moCrypto from 'crypto'
import moPath from 'path'
import mfReadlines from 'n-readlines' // npm install n-readlines
import {fNamidx} from './mNamidx.mjs'
import mfClient from 'ssh2-sftp-client'
import mfEs6_promise_pool from 'es6-promise-pool'
import {oSftp, fSftp} from './mSftp.mjs'
import {fWriteJsonObject} from './mUtil.mjs'

const
  // contains the-versions of mHitp.js 
  aVersion = [
    'mWatch.mjs.0-5-0.2026-09-13: dirManager/oHash',
    'mWatch.mjs.0-4-0.2021-12-14: save ordered oHash',
    'mWatch.mjs.0-3-0.2021-12-01: setTimeout solves file reading',
    'mWatch.mjs.0-2-0.2021-11-29: imports mNamidx, mSftp, stores hashes of Mcs',
    'mWatch.mjs.0-1-0.2021-11-28: creation'
  ]

let
  oHash = JSON.parse(moFs.readFileSync('dirManager/oHash.json')),
  aFileMcsIn = [],
  sCwd = process.cwd() + moPath.sep

sCwd = sCwd.replace(/\\/g, '/')
if (process.argv[2]) {
  oSftp.password = process.argv[2]
} else {
  console.log('type password after mWatch.mjs')
  process.exit()
}

moFs.watch(sCwd, {recursive: true}, (eventType, sFilename) => {
  if (sFilename && eventType === 'change' && sFilename.endsWith('.last.html')) {

    sFilename = sFilename.replace(/\\/g, '/')
    let sFileResolved = moPath.join(sCwd, sFilename)
    console.log(sFilename)
    console.log('>>>RESOLVED: '+sFileResolved)
    setTimeout(() => {
      const fileBuffer = moFs.readFileSync(sFileResolved)
      const hashSum = moCrypto.createHash('sha256')
      hashSum.update(fileBuffer)
      const sHashCurrent = hashSum.digest('hex')
      if (oHash[sFilename]) {
        if (sHashCurrent === oHash[sFilename]) {
          return
        }
      }
      oHash[sFilename] = sHashCurrent
      const oMHOrdered = {}
      Object.keys(oHash).sort().forEach(function(key) {
        oMHOrdered[key] = oHash[key];
      })
      //moFs.writeFileSync('oHash.json', JSON.stringify(oMHOrdered))
      fWriteJsonObject('dirManager/oHash.json', oMHOrdered)

      //aFileMcsIn.push(sFilename)
      //setTimeout(() => console.log(aFileMcsIn), 1000)

      fNamidx(sFilename, fSftp)
    }, 500)

  } 
})
