/**
 * DOING: sftp the-files in dirManager/sftp.json
 * INPUT:
 * OUTPUT:
 * RUN: node mSftp.mjs password
 *
 * modified: {2026-09-09} single persistent connection + sequential upload with retry (fixes ECONNRESET); numbered progress
 * modified: {2021-04-29}
 * created: {2018-09-27}
 */

import moFs from 'fs'
import mfClient from 'ssh2-sftp-client'

var oSftp = {
  host: 'linux1087.grserver.gr',
  port: 2234,
  username: 'kaseluri160933'
}

if (process.argv[2]) {
  oSftp.password = process.argv[2]
} else {
  console.log('type password as 3rd argument')
  process.exit()
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

export {oSftp, fSftp}