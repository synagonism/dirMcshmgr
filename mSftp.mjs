/**
 * DOING: module that sftp the-files in dirManager/sftp.json
 *
 * AUTHENTICATION: a-ssh-KEY, so we type NO password.
 *   The-key lives OUTSIDE the-repos, on <home>/.ssh/mcsh_upload,
 *   or on the-path of the-env-variable MCSH_SFTP_KEY.
 *   Its public-part must-be on the-server, on ~/.ssh/authorized_keys.
 *   WITHOUT a-key-file we ask the-password, as before.
 *   To-revoke the-key: remove its line from authorized_keys on the-server.
 *
 * modified: {2026-11-01} ssh-agent first, then the-ssh-key-file (fAuthSftp): no password to type
 * modified: {2026-09-09} single persistent connection + sequential upload with retry (fixes ECONNRESET); numbered progress
 * modified: {2021-04-29}
 * created: {2018-09-27}
 */

import moFs from 'fs'
import moOs from 'os'
import mfClient from 'ssh2-sftp-client'
import { stdin as input, stdout as output } from 'node:process'

var oSftp = {
  host: 'linux1087.grserver.gr',
  port: 2234,
  username: 'kaseluri160933'
}

/**
 * DOING: the-path of the-ssh-key we upload with
 */
function fFileKeySftp() {
  return process.env.MCSH_SFTP_KEY || moOs.homedir().replace(/\\/g, '/') + '/.ssh/mcsh_upload'
}

/**
 * DOING: the-ssh-agent that holds our key:
 *   the-named-pipe of Windows-OpenSSH, or the-socket on Linux
 */
function fAgentSftp() {
  if (process.env.MCSH_SFTP_AGENT) return process.env.MCSH_SFTP_AGENT
  if (process.platform === 'win32') return '\\\\.\\pipe\\openssh-ssh-agent'
  return process.env.SSH_AUTH_SOCK || ''
}

/**
 * DOING: is the-ssh-agent running?
 *   moFs.existsSync says FALSE for a-named-pipe that exists,
 *   so on Windows we LIST the-pipes and look for ours.
 */
function fExistsAgent(sAgentIn) {
  var sPipeDir = '\\\\.\\pipe\\'

  if (!sAgentIn) return false
  if (!sAgentIn.startsWith(sPipeDir)) return moFs.existsSync(sAgentIn)
  try {
    return moFs.readdirSync(sPipeDir).includes(sAgentIn.substring(sPipeDir.length))
  } catch (e) {
    return false
  }
}

/**
 * DOING: puts on oSftp the-way we authenticate, ONCE per run:
 *   1) a-password a-caller gave us already (env MCSH_SFTP_PASSWORD, a-prompt), or
 *   2) the-ssh-AGENT, which holds the-key DECRYPTED: a-key WITH a-passphrase
 *      is-unlocked ONCE per boot (ssh-add), NOT on every upload, or
 *   3) the-ssh-key-FILE, or
 *   4) the-password we ask.
 */
async function fAuthSftp() {
  var sFileKey,
    sAgent

  // a-caller authenticated us already
  if (oSftp.password || oSftp.privateKey || oSftp.agent) return

  sAgent = fAgentSftp()
  if (fExistsAgent(sAgent)) {
    oSftp.agent = sAgent
    console.log('>>> sftp: ssh-agent ' + sAgent)
    return
  }

  sFileKey = fFileKeySftp()
  if (moFs.existsSync(sFileKey)) {
    oSftp.privateKey = moFs.readFileSync(sFileKey)
    // a-key with a-passphrase needs it; a-key without one ignores it
    if (process.env.MCSH_SFTP_KEY_PASSPHRASE) {
      oSftp.passphrase = process.env.MCSH_SFTP_KEY_PASSPHRASE
    }
    console.log('>>> sftp: ssh-key ' + sFileKey)
    return
  }

  console.log('>>> sftp: NO ssh-key on ' + sFileKey)
  oSftp.password = await fAskHidden('Enter password: ')
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
  // the-ssh-key, or the-password: ONE place decides it
  await fAuthSftp()
  var aFil = JSON.parse(moFs.readFileSync('dirManager/sftp.json'))
  console.log(aFil)
  // worldview-agnostic: local root = the worldview folder we run in (cwd); remote = httpdocs/<worldview>/
  var sLocalRoot = process.cwd().replace(/\\/g, '/') + '/'
  var sWorldview = sLocalRoot.split('/').filter(Boolean).pop()
  var sRemoteRoot = "/var/www/vhosts/synagonism.net/httpdocs/" + sWorldview + "/"

  // one persistent connection for the whole run (a connection-per-file storm
  // overwhelms the shared host and triggers ECONNRESET)
  var oSftpClient = new mfClient()
  oSftpClient.on('keyboard-interactive', (sName, sInstructions, sInstructionsLang, aPrompts, fFinish) => { fFinish([oSftp.password]); })

  // upload one file over the shared connection; ensure its remote dir exists first
  const fPut_one = async (sFileIn) => {
    var sRemote = sRemoteRoot + sFileIn
    var sRemoteDir = sRemote.substring(0, sRemote.lastIndexOf('/'))
    if (!(await oSftpClient.exists(sRemoteDir))) await oSftpClient.mkdir(sRemoteDir, true)
    await oSftpClient.put(sLocalRoot + sFileIn, sRemote)
  }

  var aFailed = []
  var sErrorConn = ''
  try {
    await oSftpClient.connect(oSftp)
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
            try { await oSftpClient.end() } catch (e) {}
            await oSftpClient.connect(oSftp)
          }
        }
      }
      if (!bDone) aFailed.push(sFileIn)
    }
  } catch (err) {
    sErrorConn = err.message
    console.log('connection error: ' + sErrorConn)
    // the-usual-case after a-reboot: the-agent runs, but holds no key yet
    if (oSftp.agent && sErrorConn.indexOf('authentication') >= 0) {
      console.log('   the-ssh-agent holds NO key for this server.')
      console.log('   unlock it ONCE per boot:  ssh-add ' + fFileKeySftp())
    }
  } finally {
    try { await oSftpClient.end() } catch (e) {}
  }

  // report honestly: name the files that did not upload, no false "OK".
  // a-connection that never opened is a-FAILURE, even with an-empty file-list.
  if (sErrorConn) {
    console.log('FAILED: no connection: ' + sErrorConn)
  } else if (aFailed.length === 0) {
    console.log({ "message": "OK" })
  } else {
    console.log('FAILED (' + aFailed.length + '):', aFailed)
  }
}

export {oSftp, fSftp, fAskHidden, fAuthSftp, fFileKeySftp, fAgentSftp, fExistsAgent}