/**
 * DOING: sftp the-files in dirManager/sftp.json
 * INPUT:
 * OUTPUT:
 * RUN(dirMcsh): node ../dirMcshmgr/mSftpOnly.mjs   (prompts for password)
 *
 * modified: {2026-09-25} import its code
 * modified: {2026-09-09} single persistent connection + sequential upload with retry (fixes ECONNRESET)
 * modified: {2026-09-08} worldview-agnostic paths (upload from cwd); masked password prompt
 * modified: {2025-11-30} dirManager/SftpOnly.json
 * modified: {2022-03-17} mSftpOnly.mjs
 * modified: {2021-04-29}
 * created: {2018-09-27}
 */

import moFs from 'fs'
import {fAskHidden, fSftp, oSftp} from './mSftp.mjs'

oSftp.password = await fAskHidden('Enter password: ')
fSftp()
