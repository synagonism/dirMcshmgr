/**
 * DOING: module that sftp the-files in dirManager/sftp.json
 *
 * modified: {2026-09-09} single persistent connection + sequential upload with retry (fixes ECONNRESET); numbered progress
 * modified: {2021-04-29}
 * created: {2018-09-27}
 */

import moFs from 'fs'
import mfClient from 'ssh2-sftp-client'
import { stdin as input, stdout as output } from 'node:process'

var oSftp = {
  host: 'linux1087.grserver.gr',
  port: 2234,
  username: 'kaseluri160933'
}

// read a line from the terminal in raw mode, echoing '*' for each typed char
function fAskHidden(promptText) {
  return new Promise((resolve) => {
    output.write(promptText);
    var bWasRaw = input.isRaw;
    if (input.isTTY) input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');
    var sPwd = '';
    const fOnData = (sChunk) => {
      for (const sCh of sChunk) {
        var nCode = sCh.charCodeAt(0);
        if (nCode === 13 || nCode === 10 || nCode === 4) {          // Enter / Ctrl-D: done
          if (input.isTTY) input.setRawMode(bWasRaw);
          input.pause();
          input.removeListener('data', fOnData);
          output.write('\n');
          resolve(sPwd);
          return;
        } else if (nCode === 3) {                                   // Ctrl-C: abort
          output.write('\n');
          process.exit(1);
        } else if (nCode === 27) {                                  // Esc: ignore arrow/nav sequences
          break;
        } else if (nCode === 127 || nCode === 8) {                  // Backspace / Del
          if (sPwd.length > 0) { sPwd = sPwd.slice(0, -1); output.write('\b \b'); }
        } else if (nCode >= 32) {                                   // printable char
          sPwd += sCh;
          output.write('*');
        }
      }
    };
    input.on('data', fOnData);
  });
}

async function fSftp (sPassword) {
  // callers that repurpose argv[2] (e.g. mMcsNew) pass the password here instead
  if (sPassword) oSftp.password = sPassword
  var aFil = JSON.parse(moFs.readFileSync('dirManager/sftp.json'))
  console.log(aFil)
  // worldview-agnostic: local root = the worldview folder we run in (cwd); remote = httpdocs/<worldview>/
  var sLocalRoot = process.cwd().replace(/\\/g, '/') + '/'
  var sWorldview = sLocalRoot.split('/').filter(Boolean).pop()
  var sRemoteRoot = "/var/www/vhosts/synagonism.net/httpdocs/" + sWorldview + "/"

  // one persistent connection for the whole run (a connection-per-file storm
  // overwhelms the shared host and triggers ECONNRESET)
  var sftp = new mfClient()
  sftp.on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => { finish([oSftp.password]); })

  // upload one file over the shared connection; ensure its remote dir exists first
  const fPut_one = async (sFileIn) => {
    var sRemote = sRemoteRoot + sFileIn
    var sRemoteDir = sRemote.substring(0, sRemote.lastIndexOf('/'))
    if (!(await sftp.exists(sRemoteDir))) await sftp.mkdir(sRemoteDir, true)
    await sftp.put(sLocalRoot + sFileIn, sRemote)
  }

  var aFailed = []
  try {
    await sftp.connect(oSftp)
    // sequential uploads: one file at a time, so the server is never flooded
    for (var i = 0; i < aFil.length; i++) {
      var sFileIn = aFil[i]
      console.log(sFileIn)
      var bDone = false
      // try once, then up to 2 retries (reconnecting if the socket dropped)
      for (var nTry = 1; nTry <= 3 && !bDone; nTry++) {
        try {
          await fPut_one(sFileIn)
          console.log((i + 1) + '/' + aFil.length + ' finish ' + sFileIn)
          bDone = true
        } catch (err) {
          console.log('  attempt ' + nTry + ' failed: ' + err.message)
          if (nTry < 3) {
            // socket may be dead after ECONNRESET; reconnect before retrying
            try { await sftp.end() } catch (e) {}
            await sftp.connect(oSftp)
          }
        }
      }
      if (!bDone) aFailed.push(sFileIn)
    }
  } catch (err) {
    console.log('connection error: ' + err.message)
  } finally {
    try { await sftp.end() } catch (e) {}
  }

  // report honestly: name the files that did not upload, no false "OK"
  if (aFailed.length === 0) {
    console.log({ "message": "OK" })
  } else {
    console.log('FAILED (' + aFailed.length + '):', aFailed)
  }
}

export {oSftp, fSftp, fAskHidden}