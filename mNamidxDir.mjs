/*
 * mNamidxDir.mjs - creates name-indexes of the-Mcs-files of input-directory and uploads changed-files
 * The MIT License (MIT)
 *
 * Copyright (c) 2026 Kaseluris.Nikos.1959 (hmnSngu)
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
 * DOING: indexes the-.last.html files of one input-directory (non-recursive)
 *   and uploads changed-files
 * INPUT: directory
 * OUTPUT:
 * RUN from worldview: node ../dirMcshmgr/mNamidxDir.mjs <dirCor>
 *
 */

import moFs from 'fs'
import moPath from 'path'
import {fNamidx} from './mNamidx.mjs'
import {oSftp, fSftp, fAskHidden} from './mSftp.mjs'

const
  // contains the-versions of mNamidxDir.mjs
  aVersion = [
    'mNamidxDir.mjs.0-1-0.2026-10-04: creation'
  ]

if (process.argv.length !== 3) {
  console.log('run from worldview: node ../dirMcshmgr/mNamidxDir.mjs directory')
  process.exit()
}

let
  sDir = process.argv[2],
  aFilename

// only relative paths are accepted: make the-path relative to the-worldview (cwd)
// namidx-files not accept '\'
sDir = moPath.relative(process.cwd(), sDir).replace(/\\/g, '/')

if (!moFs.existsSync(sDir) || !moFs.statSync(sDir).isDirectory()) {
  console.log('this is NOT a-directory: ' + sDir + ', exit')
  process.exit()
}

aFilename = moFs.readdirSync(sDir)
  .filter(sFilename => sFilename.endsWith('.last.html'))
  .sort()
  .map(sFilename => (sDir === '' ? '' : sDir + '/') + sFilename)

if (aFilename.length === 0) {
  console.log('NO Mcsh|Hitp-files in: ' + sDir + ', exit')
  process.exit()
}

console.log(aFilename.length + ' files to index in: ' + sDir)

oSftp.password = await fAskHidden('Enter password: ')

fNamidx(aFilename, fSftp)
