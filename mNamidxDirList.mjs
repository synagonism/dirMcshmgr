/*
 * mNamidxDirList.mjs - creates name-indexes of the-Mcs-files of the-directories in namidxDir.txt and uploads changed-files
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
 * DOING: indexes the-.last.html files of the-directories (non-recursive)
 *   listed in dirManager/namidxDir.txt and uploads changed-files
 * INPUT: dirManager/namidxDir.txt, one directory per line, eg 'dirCor/'
 *   lines starting with '//' are comments, text after ';' is comment
 * OUTPUT:
 * RUN from worldview: node ../dirMcshmgr/mNamidxDirList.mjs
 *
 */

import moFs from 'fs'
import {fNamidx} from './mNamidx.mjs'
import {oSftp, fSftp, fAskHidden} from './mSftp.mjs'

const
  // contains the-versions of mNamidxDirList.mjs
  aVersion = [
    'mNamidxDirList.mjs.0-1-0.2026-10-27: creation'
  ]

let
  aLine = moFs.readFileSync('dirManager/namidxDir.txt').toString().split('\n'),
  aDir = [],
  aFilename = []

// find the-directories: remove comments and empty-lines
for (let n = 0; n < aLine.length; n++) {
  let sLn = aLine[n].trim()
  if (sLn.startsWith('//') || sLn.length === 0) continue
  // remove comments after ;
  if (sLn.indexOf(';') > 0) sLn = sLn.substring(0, sLn.lastIndexOf(';')).trim()
  // namidx-files not accept '\'
  sLn = sLn.replace(/\\/g, '/').replace(/\/+$/, '')
  if (sLn.length !== 0) aDir.push(sLn)
}

// find the-Mcs-files of each directory
for (let n = 0; n < aDir.length; n++) {
  let sDir = aDir[n]
  if (!moFs.existsSync(sDir) || !moFs.statSync(sDir).isDirectory()) {
    console.log('this is NOT a-directory: ' + sDir + ', skip')
    continue
  }
  let aFilenameDir = moFs.readdirSync(sDir)
    .filter(sFilename => sFilename.endsWith('.last.html'))
    .sort()
    .map(sFilename => sDir + '/' + sFilename)
  console.log(sDir + ': ' + aFilenameDir.length + ' files')
  aFilename.push(...aFilenameDir)
}

if (aFilename.length === 0) {
  console.log('NO Mcsh|Hitp-files in dirManager/namidxDir.txt, exit')
  process.exit()
}

console.log(aFilename.length + ' files to index in ' + aDir.length + ' dirs')

oSftp.password = await fAskHidden('Enter password: ')

fNamidx(aFilename, fSftp)
