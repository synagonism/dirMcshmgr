/**
 * DOING: sftp the-files in dirManager/sftp.json
 * INPUT:
 * OUTPUT:
 * RUN(dirMcsh): node ../dirMcshmgr/mSftpOnly.mjs   (prompts for password)
 *
 * modified: {2026-09-08} worldview-agnostic paths (upload from cwd); masked password prompt
 * modified: {2025-11-30} dirManager/SftpOnly.json
 * modified: {2022-03-17} mSftpOnly.mjs
 * modified: {2021-04-29}
 * created: {2018-09-27}
 */

import moFs from 'fs'
import mfClient from 'ssh2-sftp-client'
import mfEs6_promise_pool from 'es6-promise-pool'
import { stdin as input, stdout as output } from 'node:process'

var oSftp = {
  host: 'linux1087.grserver.gr',
  port: 2234,
  username: 'kaseluri160933'
}

// read a line from the terminal in raw mode, echoing '*' for each typed char
function askHidden (sPromptIn) {
  return new Promise((resolve) => {
    output.write(sPromptIn)
    var bWasRaw = input.isRaw
    if (input.isTTY) input.setRawMode(true)
    input.resume()
    input.setEncoding('utf8')
    var sPwd = ''
    const fOnData = (sChunk) => {
      for (const sCh of sChunk) {
        var nCode = sCh.charCodeAt(0)
        if (nCode === 13 || nCode === 10 || nCode === 4) {          // Enter / Ctrl-D: done
          if (input.isTTY) input.setRawMode(bWasRaw)
          input.pause()
          input.removeListener('data', fOnData)
          output.write('\n')
          resolve(sPwd)
          return
        } else if (nCode === 3) {                                   // Ctrl-C: abort
          output.write('\n')
          process.exit(1)
        } else if (nCode === 27) {                                  // Esc: ignore arrow/nav sequences
          break
        } else if (nCode === 127 || nCode === 8) {                  // Backspace / Del
          if (sPwd.length > 0) { sPwd = sPwd.slice(0, -1); output.write('\b \b') }
        } else if (nCode >= 32) {                                   // printable char
          sPwd += sCh
          output.write('*')
        }
      }
    }
    input.on('data', fOnData)
  })
}

// password: 3rd argument if given, otherwise prompt (as mNamidxFile.mjs)
oSftp.password = process.argv[2] || await askHidden('Enter password: ')

function fSftp () {
  var aFil = JSON.parse(moFs.readFileSync('dirManager/sftp.json'))
  console.log(aFil)
  // worldview-agnostic: local root = the worldview folder we run in (cwd); remote = httpdocs/<worldview>/
  var sLocalRoot = process.cwd().replace(/\\/g, '/') + '/'
  var sWorldview = sLocalRoot.split('/').filter(Boolean).pop()

  const fSend_file = (oConfigIn, sFileIn) => {
      return new Promise(function (resolve, reject) {
      let sftp = new mfClient();
      console.log(sFileIn);
      sftp.on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => { finish([oConfigIn.password]); });
      // SPECIFIC INFO
      var sRemote = "/var/www/vhosts/synagonism.net/httpdocs/" + sWorldview + "/" + sFileIn;
      var sRemoteDir = sRemote.substring(0, sRemote.lastIndexOf('/'));
      sftp.connect(oConfigIn).then(async () => {
        // put does not create parent dirs; ensure the remote directory exists first
        if (!(await sftp.exists(sRemoteDir))) await sftp.mkdir(sRemoteDir, true);
        return sftp.put(sLocalRoot + sFileIn, sRemote);
      }).then(() => {
        console.log('finish '+sFileIn);
        sftp.end();
        resolve(sFileIn);
      }).catch((err) => {
        console.log(err, 'catch error');
        sftp.end();
        resolve(sFileIn);
      });
    });
  };

  var nCount = 0;
  var fSend_file_producer = function () {
    console.log("count= " + nCount);
    if (nCount < aFil.length) {
      nCount++;
      return(fSend_file(oSftp, aFil[nCount-1]));
    } else {
      return null;
    }
  }

  // The number of promises to process simultaneously.
  var nConcurrency = 10;

  // Create a pool.
  var oPool = new mfEs6_promise_pool(fSend_file_producer, nConcurrency)

  oPool.start().then(function () {
    console.log({"message":"OK"}); // res.send('{"message":"OK"}');
  });
}
fSftp()

export {oSftp, fSftp}
