/*
 * mNamidxFile.mjs - creates name-indexes of input-file and uploads changed-files
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
 * DOING: indexes one input-file and uploads changed-files
 * INPUT:
 * OUTPUT:
 * RUN from dirMcsh: node ../dirMcshmgr/mNamidxFile.mjs file pwd
 * process.argv[2] → first argument you provided
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
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const
  // contains the-versions of mNamidxFile.mjs
  aVersion = [
    'mNamidxFile.mjs.0-3-0.2026-08-30: dirMcshmgr',
    'mNamidxFile.mjs.0-2-0.2026-04-21: password',
    'mNamidxFile.mjs.0-1-0.2026-04-20: creation'
  ]

if (process.argv.length !== 3) {
  console.log('run: node ../dirMcshmgr/mNamidxFile.mjs file')
  process.exit()
}

async function askHidden(promptText) {
  const rl = readline.createInterface({ input, output, terminal: true });

  // Fallback simple prompt. This does not fully mask on all terminals.
  // Best option is to use a proper hidden-input package if you want masking.
  const answer = await rl.question(promptText);
  rl.close();
  return answer;
}

let
  sFilename = process.argv[2],
  pwd = process.argv[3];

if (!pwd) {
  pwd = await askHidden('Enter password: ');
}

// namidx-files not accept '\'
sFilename = sFilename.replace(/\\/g, '/')
if (!sFilename.endsWith('.last.html')) {
  console.log('this is NOT an-Mcs-file, exit')
  process.exit()
}

// only relative paths are accepted: make the-path relative to the-worldview (cwd),
// so the same tool works in any worldview folder (e.g. dirMcsh, dirMcs..., dirHitp...)
sFilename = moPath.relative(process.cwd(), sFilename).replace(/\\/g, '/')

oSftp.password = pwd

fNamidx(sFilename, fSftp)
