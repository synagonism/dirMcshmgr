/*
 * go to line 89 (aLagALL) to change indexed languages.
 * mNamidx.mjs - module that creates name-indexes and uploads the-files
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 - 2026 Kaseluris.Nikos.1959 (hmnSngu)
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
 *   it works as a-module
 *   1) it creates the-file 'dirManager/sftp.json' that contains the-changed files we have to upload.
 *   2) it computes the-number of names.
 *   3) it computes the-number of concepts.
 *   4) it uploads the-files
 * INCREMENTAL:
 *   It keeps for each Mcs|Hitp-file[a] a-namurl-record, on
 *   'dirManager/dirNamurl/<the-path-of-a>.json', with the-name-Urls it[a] gave on
 *   the-previous-run AND the-index-file of each of them. So it removes|adds ONLY
 *   the-name-Urls that changed, on ONLY the-index-files that hold them.
 *   WITHOUT a-record it does the-FULL-scan of ALL index-files of ALL languages
 *   and writes one. So:
 *   - to re-index one file from zero, DELETE its namurl-record.
 *   - to re-index ALL from zero, DELETE the-dir 'dirManager/dirNamurl'.
 *   The-namurl-records are local-data: we do NOT upload them.
 * INPUT:
 * OUTPUT: dirLang/namidx.lagLangX.json, namidx.lagRoot.json, Mcshqnt.json, dirManager/sftp.json,
 *   dirManager/dirNamurl/...json
 *
 */

import moFs from 'fs'
import mfReadlines from 'n-readlines' // npm install n-readlines
import {oSftp, fSftp} from './mSftp.mjs'
import {fDateYMD, fWriteJsonArray} from './mUtil.mjs'

const
  // contains the-versions of mHitp.js
  aVersion = [
    'mNamidx.mjs.1-1-0.2026-11-27: bFullIn, full re-index of the-input-files',
    'mNamidx.mjs.1-0-0.2026-09-30: incremental re-index, dirManager/dirNamurl-records',
    'mNamidx.mjs.0-9-0.2026-09-24: auto-add + sort new DIRS in Mcshqnt.root.json',
    'mNamidx.mjs.0-8-0.2026-08-30: dirMcshmgr',
    'mNamidx.mjs.0-7-1.2026-02-03: lagKhmr',
    'mNamidx.mjs.0-7-0.2025-11-30: only module',
    'mNamidx.mjs.0-6-1.2025-02-23: sFileIdxRest===sLagIn+00_0',
    'mNamidx.mjs.0-6-0.2025-02-22: sFileIdxRest===sLagIn+00',
    'mNamidx.mjs.0-5-2.2023-12-04: <p>[name:: on EXTRA names',
    'mNamidx.mjs.0-5-1.2023-11-27: >[name:: on EXTRA names',
    'mNamidx.mjs.0-5-0.2022-09-13: meta-info::',
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

function fNamidx(aFileIn, fSftpIn, bFullIn) {
  // aFileIn: an-array of Mcs-files, or ONE Mcs-file as string.
  // bFullIn true: we IGNORE the-namurl-records of the-input-files and re-index ALL
  // their names with the-full-scan (then write new records), not only the-changed ones.
  let
    bExtra = false, // extra names, added manually on namidx.lagLagoExtra.json to-be removed!
    bNamurl = true,
    // true: INCREMENTAL re-index. We keep for each Mcs-file[a] a-namurl-record with the
    // name-Urls it[a] gave on the-previous-run and the-index-file of each of them.
    // Then we remove|add ONLY what changed, on ONLY the-index-files that hold it.
    // false: the-old full-scan of ALL index-files of ALL languages, on every run.
    sDirNamurl = 'dirManager/dirNamurl',
    // the-dir with the-namurl-records. It is local-data, we do NOT upload it.
    sVersionNamurl = '0-1-0',
    // the-version of the-namurl-record-format.
    // On a-change of the-harvesting of names, bump it to invalidate ALL records.
    oCacheRefNamidx = {},
    // {path: array-of-reference-index-file} to read each reference-index-file ONCE per run
    oNextln,
    oSetFileUp = new Set,
    // files to upload, index, Mcs, Mcsqnt
    // we use a-set, because we add same files and want unique.
    aFileMcsIn,
    // array with names of dirCor/McshCor000010.last.html to remove|add its names
    aLag,
    // array of languages ['lagALLL']
    //aLagALL = ['lagEngl','lagElln','lagZhon','lagDeut','lagFrac'],
    aLagALL = ['lagEngl','lagSngu','lagElln','lagZhon',
    'lagArab','lagDeut','lagElla','lagEspo','lagFrac',
    'lagHind','lagItln','lagJpns','lagKhmr','lagKora','lagRomn',
    'lagSbos','lagShrv','lagScnr','lagSsrp','lagSbul','lagSmkd','lagSrus','lagSslv',
    'lagSpan','lagSqip',
    'lagTurk','lagVnma'],
    //
    // 'lagBel','lagBos','lagCes','lagDan','lagEst',
    // 'lagFin','lagHrv','lagHun','lagLav','lagLit','lagMlt',
    // 'lagMol','lagNld','lagNor','lagPol','lagPor','lagSlk',
    // 'lagSlv','lagSrp','lagSwe','lagUkr',
    // 'lagJpn'
    aRootFileIdx_Idx_Qntnam = JSON.parse(moFs.readFileSync('dirNamidx/namidx.lagRoot.json')),
    // [['lagEngl01ei','A',1111]} with quantity of names
    aFileMcs_QntMcs = [],
    // array with the-file-Mcs and the-quantity of Mcs they include
    // [ 'dirTchInf/McsTchInf999999.last.html', 51 ]
    oRootFileIdx_Idx = {},
    // holds the-names of index-files and the related chars
    // {lagEngl01ei:'A|a', lagZhon024:'13312..14000'}
    oFileIdx_Qntnam = {},
    // {lagEngl01ei:222} the-quantities of names of index-files
    sLn,
    n

  if (typeof aFileIn === 'string') {
    aFileMcsIn = [aFileIn]
  } else {
    aFileMcsIn = aFileIn
  }

  /**
   * DOING: creates object {fileIdx: index} from [[fileIdx,idx,quantity]]
   * INPUT: aIn = [['lagEngl01ei','A',1234]]
   * OUTPUT: {lagEngl01ei:'A'}
   */
  function fCreateOFileIdx_Index(aIn) {
    let oOut = {}
    for (n = 0; n < aIn.length; n++) {
      if (!aIn[n][1].startsWith(';')) {
        // remove non index info
        oOut[aIn[n][0]] = aIn[n][1]
      }
    }
    return oOut
  }
  oRootFileIdx_Idx = fCreateOFileIdx_Index(aRootFileIdx_Idx_Qntnam)

  aLag = aLagALL

  // We upload ONLY the-files we WRITE. So namidx.lagRoot.json, Mcshqnt.json and
  // Mcshqnt.root.json are-added on the-upload-list by the-code that writes them:
  // IF no name and no Mcs-quantity changed, we upload ONLY the-Mcs-file.

  /**
   * for EACH FILE in aFileMcsIn,
   * for EACH LANGUAGE
   * READ the-file and store temporarilly its name-Urls
   * IF we have a-namurl-record of this file (the-usual-case)
   *   THEN REMOVE|ADD ONLY the-changed name-Urls, on ONLY the-index-files that hold them
   *   ELSE REMOVE the-names linked to this file, for ALL index-files (the-full-scan)
   *        and ADD ALL its name-Urls in index-files
   * WRITE the-new namurl-record of the-file
   */
  for (let n = 0; n < aFileMcsIn.length; n++) {
    let
      nMcsqnt = 0,
      sFileMcs = aFileMcsIn[n], // the-Mcs-file we want to work
      bIsHitp = sFileMcs.substring(sFileMcs.lastIndexOf('/') + 1).startsWith('Hitp') // Hitp page → no Mcs-quantity

    // add the-file to upload-list. It is the-ONLY file we upload ALWAYS.
    oSetFileUp.add(sFileMcs)

    // READ the-namurl-record of this file: the-name-Urls it gave on the-previous-run.
    // oNamurl = null means we have NO record (or bFullIn), so we do the-old full-scan and write one.
    let
      oNamurl = (bNamurl && !bFullIn) ? fReadNamurl(sFileMcs) : null,
      aoNamurlNew = []
      // the-new namurl-record: [[lag, fileIdx, name, Url]]

    // for EACH language
    for (let nL = 0; nL < aLag.length; nL++) {
      var
        aNU, // array with a-name-Url
        oFileIdx_ANamUrl = {}
        // object to hold the-Αrrays with the-Νame-Urls per index-file
        // after reading Mcs-files.
        // {lagEngl01ei:[['name1','Url1'],['name2','Url2']]}

      // a-lag with NO record can-NOT be diffed: we must scan ALL its index-files.
      // bExtra also needs the-full-scan: extra-names carry Urls of OTHER Mcs-files.
      let bFullLag = !oNamurl || !oNamurl.aLag.includes(aLag[nL]) || bExtra

      // REMOVE name-Urls of ALL index-files of this lag.
      // ONLY on the-full-scan. On the-diff we first read the-file, then remove
      // ONLY the-names that changed.
      if (bFullLag) {
        fRemoveNamUrl(oRootFileIdx_Idx, sFileMcs, aLag[nL])
      }

      // remove name-Urls and for the-extra-files in this lag
      if (bExtra) {
        let aFileIdxExtr = JSON.parse(moFs.readFileSync('dirNamidx/dirLag' +aLag[nL].substring(3)
          +'/namidx.' +aLag[nL] +'Extra.json')),
          oSetExtra_files = new Set(),
          aExtra_files

        for (n = 0; n < aFileIdxExtr.length; n++) {
          oSetExtra_files.add(aFileIdxExtr[n][1].substring(0, aFileIdxExtr[n][1].indexOf('#')))
        }
        aExtra_files = Array.from(oSetExtra_files)
        //console.log(aExtra_files)
        for (n = 0; n <aExtra_files.length; n++) {
          fRemoveNamUrl(oRootFileIdx_Idx, aExtra_files[n], aLag[nL])
        }
      }

      // READ Mcs-file and ADD its name-Urls on oFileIdx_ANamUrl{lagEngl01ei:[[name,Url]]}
      let
        bMcsSection = true,
        sUrl, // The-url of a-section. it may-contain a-section-Mcs.
        sUrlP, // The-url of a-paragraph. it may-contain a-paragraph-Mcs.
        sUrlPPrev, // the-sUrl of previous-paragraph
        oReadlines = new mfReadlines(sFileMcs)

      while (oNextln = oReadlines.next()) {
        sLn = oNextln.toString()

        // process the-section and Mcs-name lines
        if (sLn.indexOf('<section id="') >= 0) {
          // first get the-id of the-section
          // names are-stored inside a-section and <p>name::
          sUrl = sLn.substring(sLn.indexOf('"')+1,sLn.lastIndexOf('"'))
          sUrl = sFileMcs + '#' + sUrl
        } else if (sLn.indexOf('<p>name::') >= 0 ||
            sLn.indexOf('<p>[name::') >= 0 ) {
          if (aLag[nL] === 'lagEngl') {
            nMcsqnt = nMcsqnt + 1
          }
          bMcsSection = true;
        } else if (sLn.indexOf('<p id="') >= 0) {
          bMcsSection = false;
          sUrlPPrev = sUrlP
          sUrlP = sLn.substring(sLn.indexOf('"')+1,sLn.indexOf('>')-1)
          sUrlP = sFileMcs + '#' + sUrlP
          if (sLn.indexOf('>name::') >= 0 ||
              sLn.indexOf('>[name::') >= 0 ||
              sLn.indexOf('>meta-info::') >= 0) {
            if (aLag[nL] === 'lagEngl') {
              nMcsqnt = nMcsqnt + 1
            }
            bMcsSection = true;
          }
        } else {
          if (aLag[nL] === 'lagElln') {
            if (sLn.startsWith('    <br>* ενν.')
             || sLn.startsWith('    <br> &nbsp; &nbsp;* ενν.') // σύνταγμα.2008 ειδική περίπτωση!
             || sLn.startsWith('    <br> &nbsp; &nbsp; &nbsp; &nbsp;* ενν.')) {
              if (sLn.indexOf('* ενν.') > 0) {
                aNU = [sLn.substring(sLn.indexOf('* ενν.')+6, sLn.indexOf(',')), sUrl]
              } else  {
                aNU = [sLn.substring(18, sLn.indexOf(',')), sUrl]
              }
              fStoreNamUrlLag(aNU, aLag[nL])
            }
          }
          if (sLn.startsWith('    <br>* Mcsh'+aLag[nL].substring(3)+'.')) {
            if (bMcsSection) {
              aNU = [sLn.substring(19, sLn.indexOf(',')), sUrl]
              fStoreNamUrlLag(aNU, aLag[nL])
            } else {
              aNU = [sLn.substring(19, sLn.indexOf(',')), sUrlP]
              fStoreNamUrlLag(aNU, aLag[nL])
              // if previous-id different for current
              // we have a-new-paragraph-cpt
              // because in one paragraph we can-have many Mcs.
              if (sUrlPPrev !== sUrlP) {
                //we count a-concept in ONE language and try all concepts
                //to have at least and English name
                if (aLag[nL] === 'lagEngl') {
                  nMcsqnt = nMcsqnt + 1
                }
              }
              sUrlPPrev = sUrlP
            }
          }
        }
      }

      // STORE the-harvest of this lag on the-new namurl-record.
      // BEFORE the-extra-names, which belong to OTHER Mcs-files.
      fStoreNamurlNew(oFileIdx_ANamUrl, aLag[nL], aoNamurlNew)

      if (bExtra) {
        // ADD extra name-Urls on oFileIdx_ANamUrl for current language
        let aFileIdxExtr = JSON.parse(moFs.readFileSync('dirNamidx/dirLag' +aLag[nL].substring(3)
          +'/namidx.' +aLag[nL] +'Extra.json'))
        for (let nE = 0; nE < aFileIdxExtr.length; nE++) {
          fStoreNamUrlLag(aFileIdxExtr[nE], aLag[nL])
        }
      }

      // DIFF the-harvest against the-namurl-record and write ONLY the-changes
      if (!bFullLag) {
        let oDiff = fDiffNamUrl(fSelectNamurlLag(oNamurl.aoRow, aLag[nL]), oFileIdx_ANamUrl)

        if (oDiff.nRmv === 0 && oDiff.nAdd === 0) {
          // NO name of this lag changed: no index-file to read, none to write, none to upload
          continue
        }
        if (fApplyNamUrlDiff(oDiff, aLag[nL])) {
          continue
        }
        // the-record does NOT match the-index-files (hand-edit, or a-split|merge of the
        // index-tree). NOTHING was written. Heal this lag with the-full-scan.
        console.log('>> namurl-record stale, full-scan: ' +sFileMcs +', ' +aLag[nL])
        fRemoveNamUrl(oRootFileIdx_Idx, sFileMcs, aLag[nL])
      }

      // WRITE arrays in oFileIdx_ANamUrl ({lagEngl01ei:[[name,Url]]})
      // in index-files
      for (let sFilIdx in oFileIdx_ANamUrl) {
        console.log(aLag[nL]+", "+sFilIdx)
        let
          aNew = oFileIdx_ANamUrl[sFilIdx], // the-array with name-Urls
          // the-name of the existing file with names-urls
          sFileIdxFullExist = 'dirNamidx/dirLag' +aLag[nL].substring(3) +'/namidx.' +sFilIdx +'.json',
          sMeta

        fSetFileUpNamidx(sFileIdxFullExist)
        aNew.sort(fCompare)

        // if index-file exists, put new names and write
        if (moFs.existsSync(sFileIdxFullExist)) {
          let
            aEx = JSON.parse(moFs.readFileSync(sFileIdxFullExist))
            //the-existing-array

          sMeta = aEx.shift() // [";fileIdx",";char..char.2"
          // add on existed-names the new names,
          for (let nN = 0; nN < aNew.length; nN++) {
            aEx.push(aNew[nN])
          }
          aEx = fRemoveArrayDupl(aEx) // remove duplicates
          aEx.sort(fCompare)
          oFileIdx_Qntnam[sFilIdx] = aEx.length
          aEx.unshift(sMeta)
          fWriteJsonQntDate(sFileIdxFullExist, aEx)
        } else {
          // index-file does not exist, write new-array of names.
          oFileIdx_Qntnam[sFilIdx] = aNew.length
          let
            aMeta = []
          aMeta[0] = ';' +sFilIdx
          aMeta[1] = fFindIndex(sFilIdx)
          aNew.unshift(aMeta)
          fWriteJsonQntDate(sFileIdxFullExist, aNew)
        }
      }
    }

    // WRITE the-namurl-record LAST, after the-index-files of ALL languages.
    // If we crash before it, the-record stays one-run-behind and the-next-run
    // heals this file with the-full-scan. A-record ahead of the-index-files
    // would leave orphan-names for ever.
    if (bNamurl) {
      fWriteNamurl(sFileMcs, aoNamurlNew)
    }

    // update Mcshqnt.json
    // only on Mcs-files measure Mcs; Hitp pages are NOT measured
    if (!bIsHitp
       && (sFileMcs.indexOf('filMcs') >= 0
       || sFileMcs.indexOf('Mcs') >= 0) )  {
      aFileMcs_QntMcs.push([sFileMcs, nMcsqnt])
    }
  }

  /**
   * DOING: REMOVES name-Urls from index-files per language
   * INPUT:
   *   - oFileIdx_IdxIn: object {lagElln01alfa: 'Α'} from which the-names will-be-removed
   *   - sFileMcsRmvIn: the-Mcsfile whose names will-be-removed
   *   - sLagIn: the-lag whose names will-be-removed
   */
  function fRemoveNamUrl(oFileIdx_IdxIn, sFileMcsRmvIn, sLagIn) {
    // oFileIdx_IdxIn = { lagElln00: 'charREST', lagElln01alfa: 'Α', ... lagSngu25u: 'U' }
    // sFileMcsRmvIn = dirCor/McsCor999999.last.html
    // sLagIn = lagElln
    // for ALL index-files remove names with Url sFileMcsRmvIn
    // TODO: IF we have a-file for each Mcs-file[a]
    // with ALL the-index-files in which it[a] is-used
    // THEN we can-iterate ONLY in these files. {2018-07-23}
    for (let sFileIdxShort in oFileIdx_IdxIn) {
      // ALL index-files in sLagIn
      if (sFileIdxShort.startsWith(sLagIn)) { // sFileIdxShort: lagEngl01ei, sLagIn: lagEngl
        let
          aNamDif = [],
          sFileIdxFull = 'dirNamidx/dirLag' + sLagIn.substring(3) +
                         '/namidx.' + sFileIdxShort + '.json',
          sUrl

        if (moFs.existsSync(sFileIdxFull)) {
          let
            // read existing namidx.X
            aNamExist,
            bRemoved = false

          try {
            aNamExist = JSON.parse(moFs.readFileSync(sFileIdxFull))
          } catch(e) {
            console.log('>> json problem:' + sFileIdxFull)
          }

          // IF fileIdx is reference (endsWith('_0.json'))
          // read it, make oFileIdx_IdxIn, and remove names
          if (sFileIdxFull.endsWith('_0.json')) {
            let oIN = fCreateOFileIdx_Index(aNamExist)
            fRemoveNamUrl(oIN, sFileMcsRmvIn, sLagIn)
          } else {
            // ELSE remove names
            // create new array with names NOT in sFileMcsRmvIn
            // first put on new array meta-info: [";lagElln06zita",";Ζ..Η",1,"2019-09-04"]
            aNamDif.push(aNamExist[0])
            for (let nE = 1; nE < aNamExist.length; nE++) {
              // the-url of a-name
              sUrl = aNamExist[nE][1]
              // add on aNamDif the-names without the-file to remove
              if (!sUrl.startsWith(sFileMcsRmvIn)) {
                aNamDif.push(aNamExist[nE])
              } else if (sUrl.startsWith(sFileMcsRmvIn)) {
                bRemoved = true
                fSetFileUpNamidx(sFileIdxFull)
              }
            }
            // store fileIdx length
            if (bRemoved) {
              oFileIdx_Qntnam[sFileIdxShort] = aNamDif.length - 1
              // sFileIdxShort changed, store it
              fWriteJsonQntDate(sFileIdxFull, aNamDif)
            }
          }
        }
      }
    }
  }

  /**
   * DOING: the-full-path of the-namurl-record of a-Mcs-file
   * INPUT: sFileMcsIn = 'dirCor/McshCor000002.last.html'
   * OUTPUT: 'dirManager/dirNamurl/dirCor/McshCor000002.last.json'
   */
  function fFileNamurl(sFileMcsIn) {
    let sPath = sFileMcsIn

    // sFileMcs can-be '../index.html': we keep the-record INSIDE the-worldview
    while (sPath.startsWith('../')) {
      sPath = '_up_/' +sPath.substring(3)
    }
    if (sPath.endsWith('.html')) {
      sPath = sPath.substring(0, sPath.length-5)
    }
    return sDirNamurl +'/' +sPath +'.json'
  }

  /**
   * DOING: the-identity of a-name-Url. We use the-'JJ'-join of fRemoveArrayDupl.
   * INPUT: aNUIn = ['name','dirCor/McshCor000002.last.html#idName']
   */
  function fKeyNamUrl(aNUIn) {
    return aNUIn[0] +'JJ' +aNUIn[1]
  }

  /**
   * DOING: the-set of the-identities of an-array of name-Urls
   */
  function fSetKeyNamUrl(aoNUIn) {
    let
      nR,
      oOut = new Set()

    if (!aoNUIn) { return oOut }
    for (nR = 0; nR < aoNUIn.length; nR++) {
      oOut.add(fKeyNamUrl(aoNUIn[nR]))
    }
    return oOut
  }

  /**
   * DOING: READS the-namurl-record of a-Mcs-file
   * OUTPUT:
   *   - null, IF we have NO usable record. Then the-caller does the-full-scan.
   *   - {aLag: ['lagEngl'], aoRow: [[lag,fileIdx,name,Url]]}
   */
  function fReadNamurl(sFileMcsIn) {
    let
      sFile = fFileNamurl(sFileMcsIn),
      aoRow

    if (!moFs.existsSync(sFile)) { return null }
    try {
      aoRow = JSON.parse(moFs.readFileSync(sFile))
    } catch(e) {
      console.log('>> json problem:' +sFile)
      return null
    }
    // the-first-row is meta: [';namurl','0-1-0','2026-09-30','lagEngl|lagElln']
    if (!aoRow.length || !aoRow[0][0].startsWith(';')) { return null }
    // an-other-format of record is NOT usable
    if (aoRow[0][1] !== sVersionNamurl) { return null }
    return {aLag: (aoRow[0][3] || '').split('|'), aoRow: aoRow.slice(1)}
  }

  /**
   * DOING: STORES on the-new-namurl-record the-harvest of ONE language
   * INPUT:
   *   - oFileIdx_ANamUrlIn: {lagEngl01ei:[[name,Url]]} the-harvest
   *   - sLagIn: 'lagEngl'
   *   - aoRowIn: the-array of the-new-record, we push on it
   */
  function fStoreNamurlNew(oFileIdx_ANamUrlIn, sLagIn, aoRowIn) {
    let
      nR,
      sFileIdx,
      sKey,
      aNU,
      oSetKey = new Set()

    for (sFileIdx in oFileIdx_ANamUrlIn) {
      for (nR = 0; nR < oFileIdx_ANamUrlIn[sFileIdx].length; nR++) {
        aNU = oFileIdx_ANamUrlIn[sFileIdx][nR]
        sKey = sFileIdx +'JJ' +fKeyNamUrl(aNU)
        // the-same name-Url can-be harvested many times: we store it ONCE
        if (oSetKey.has(sKey)) { continue }
        oSetKey.add(sKey)
        aoRowIn.push([sLagIn, sFileIdx, aNU[0], aNU[1]])
      }
    }
  }

  /**
   * DOING: WRITES the-namurl-record of a-Mcs-file.
   *   It is local-data: we do NOT add it on oSetFileUp.
   */
  function fWriteNamurl(sFileMcsIn, aoRowIn) {
    let aoOut = [[';namurl', sVersionNamurl, fDateYMD(), aLag.join('|')]]

    for (let nR = 0; nR < aoRowIn.length; nR++) {
      aoOut.push(aoRowIn[nR])
    }
    fWriteJsonArray(fFileNamurl(sFileMcsIn), aoOut)
  }

  /**
   * DOING: the-name-Urls of ONE language of a-namurl-record, per index-file
   * INPUT: aoRowIn = [[lag,fileIdx,name,Url]]
   * OUTPUT: {lagEngl01ei:[[name,Url]]}
   */
  function fSelectNamurlLag(aoRowIn, sLagIn) {
    let
      nR,
      oOut = {}

    for (nR = 0; nR < aoRowIn.length; nR++) {
      if (aoRowIn[nR][0] !== sLagIn) { continue }
      if (!oOut[aoRowIn[nR][1]]) { oOut[aoRowIn[nR][1]] = [] }
      oOut[aoRowIn[nR][1]].push([aoRowIn[nR][2], aoRowIn[nR][3]])
    }
    return oOut
  }

  /**
   * DOING: COMPARES the-name-Urls of the-record with the-name-Urls of the-harvest
   * INPUT: both {lagEngl01ei:[[name,Url]]}, the-old and the-new
   * OUTPUT: {
   *   oRmvFileIdx_oSetKey: {lagEngl01ei: Set('nameJJUrl')}, the-names to-REMOVE
   *   oAddFileIdx_ANamUrl: {lagEngl01ei: [[name,Url]]},     the-names to-ADD
   *   nRmv, nAdd
   * }
   */
  function fDiffNamUrl(oOldIn, oNewIn) {
    let
      nR,
      sFileIdx,
      sKey,
      oSetKeyOld,
      oSetKeyNew,
      oOut = {oRmvFileIdx_oSetKey: {}, oAddFileIdx_ANamUrl: {}, nRmv: 0, nAdd: 0}

    // on the-record and NOT on the-harvest: to-REMOVE
    for (sFileIdx in oOldIn) {
      oSetKeyNew = fSetKeyNamUrl(oNewIn[sFileIdx])
      for (nR = 0; nR < oOldIn[sFileIdx].length; nR++) {
        sKey = fKeyNamUrl(oOldIn[sFileIdx][nR])
        if (oSetKeyNew.has(sKey)) { continue }
        if (!oOut.oRmvFileIdx_oSetKey[sFileIdx]) {
          oOut.oRmvFileIdx_oSetKey[sFileIdx] = new Set()
        }
        if (oOut.oRmvFileIdx_oSetKey[sFileIdx].has(sKey)) { continue }
        oOut.oRmvFileIdx_oSetKey[sFileIdx].add(sKey)
        oOut.nRmv = oOut.nRmv + 1
      }
    }
    // on the-harvest and NOT on the-record: to-ADD
    for (sFileIdx in oNewIn) {
      oSetKeyOld = fSetKeyNamUrl(oOldIn[sFileIdx])
      for (nR = 0; nR < oNewIn[sFileIdx].length; nR++) {
        sKey = fKeyNamUrl(oNewIn[sFileIdx][nR])
        if (oSetKeyOld.has(sKey)) { continue }
        if (!oOut.oAddFileIdx_ANamUrl[sFileIdx]) {
          oOut.oAddFileIdx_ANamUrl[sFileIdx] = []
        }
        oOut.oAddFileIdx_ANamUrl[sFileIdx].push(oNewIn[sFileIdx][nR])
        oOut.nAdd = oOut.nAdd + 1
      }
    }
    return oOut
  }

  /**
   * DOING: the-full-path of an-index-file
   * INPUT: sFileIdxIn = 'lagEngl01ei', sLagIn = 'lagEngl'
   * OUTPUT: 'dirNamidx/dirLagEngl/namidx.lagEngl01ei.json'
   */
  function fFileIdxFull(sFileIdxIn, sLagIn) {
    return 'dirNamidx/dirLag' +sLagIn.substring(3) +'/namidx.' +sFileIdxIn +'.json'
  }

  /**
   * DOING: adds an-index-file we wrote, and its parent-reference, on the-upload-list
   */
  function fSetFileUpNamidx(sFileIdxFullIn) {
    oSetFileUp.add(sFileIdxFullIn)
    if (sFileIdxFullIn.indexOf('_') > 0) {
      // IF we wrote a-child, we upload and its parent-reference
      oSetFileUp.add(sFileIdxFullIn.substring(0, sFileIdxFullIn.lastIndexOf('_')) +'_0.json')
    }
  }

  /**
   * DOING: WRITES the-changes of ONE language on ONLY the-index-files that hold them.
   *   PHASE-1 reads and VERIFIES: we write NOTHING until EVERY name to-remove
   *   is-found on its index-file.
   *   PHASE-2 writes.
   * INPUT: oDiffIn from fDiffNamUrl, sLagIn = 'lagEngl'
   * OUTPUT:
   *   - true: the-index-files are updated.
   *   - false: the-record does NOT match the-index-files, NOTHING was written,
   *     the-caller must do the-full-scan.
   */
  function fApplyNamUrlDiff(oDiffIn, sLagIn) {
    let
      nR,
      sFileIdx,
      sFileIdxFull,
      sKey,
      aMeta,
      aLeaf,
      aKeep,
      aAddOut,
      aOut,
      aAdd,
      oSetKeyRmv,
      oSetKeyEx,
      oSetKeyAdd,
      oSetIdx = new Set(),
      oIdx_ALeaf = {},   // {lagEngl01ei: the-array of the-index-file} null: to-create
      oIdx_oSetKey = {}  // {lagEngl01ei: the-set of the-keys it holds}

    for (sFileIdx in oDiffIn.oRmvFileIdx_oSetKey) { oSetIdx.add(sFileIdx) }
    for (sFileIdx in oDiffIn.oAddFileIdx_ANamUrl) { oSetIdx.add(sFileIdx) }

    // PHASE-1: READ and VERIFY
    for (sFileIdx of oSetIdx) {
      if (sFileIdx.endsWith('_0')) {
        // the-recorded index-file became a-reference-index-file.
        // fWriteJsonQntDate would destroy its rows, so we do NOT touch it.
        return false
      }
      sFileIdxFull = fFileIdxFull(sFileIdx, sLagIn)
      if (!moFs.existsSync(sFileIdxFull)) {
        if (oDiffIn.oRmvFileIdx_oSetKey[sFileIdx]) {
          // we can-NOT remove names from an-index-file that does NOT exist
          return false
        }
        oIdx_ALeaf[sFileIdx] = null // ADD-only: we create it on PHASE-2
        continue
      }
      try {
        oIdx_ALeaf[sFileIdx] = JSON.parse(moFs.readFileSync(sFileIdxFull))
      } catch(e) {
        console.log('>> json problem:' +sFileIdxFull)
        return false
      }
      aLeaf = oIdx_ALeaf[sFileIdx]
      oSetKeyEx = new Set()
      for (nR = 1; nR < aLeaf.length; nR++) {
        oSetKeyEx.add(fKeyNamUrl(aLeaf[nR]))
      }
      oIdx_oSetKey[sFileIdx] = oSetKeyEx
      // EVERY name to-remove MUST be on its index-file
      oSetKeyRmv = oDiffIn.oRmvFileIdx_oSetKey[sFileIdx]
      if (oSetKeyRmv) {
        for (sKey of oSetKeyRmv) {
          if (!oSetKeyEx.has(sKey)) { return false }
        }
      }
    }

    // PHASE-2: WRITE
    for (sFileIdx of oSetIdx) {
      sFileIdxFull = fFileIdxFull(sFileIdx, sLagIn)
      aLeaf = oIdx_ALeaf[sFileIdx]
      oSetKeyRmv = oDiffIn.oRmvFileIdx_oSetKey[sFileIdx]
      oSetKeyEx = oIdx_oSetKey[sFileIdx] || new Set()
      aAdd = oDiffIn.oAddFileIdx_ANamUrl[sFileIdx]

      if (!aLeaf) {
        // the-index-file does NOT exist, we create its meta-row
        aMeta = [';' +sFileIdx, fFindIndex(sFileIdx)]
        aKeep = []
      } else {
        // keep the-names we do NOT remove, ON THEIR ORDER
        aMeta = aLeaf[0]
        aKeep = []
        for (nR = 1; nR < aLeaf.length; nR++) {
          if (oSetKeyRmv && oSetKeyRmv.has(fKeyNamUrl(aLeaf[nR]))) { continue }
          aKeep.push(aLeaf[nR])
        }
      }

      if (aAdd) {
        aAddOut = []
        oSetKeyAdd = new Set()
        for (nR = 0; nR < aAdd.length; nR++) {
          sKey = fKeyNamUrl(aAdd[nR])
          // the-same name-Url twice on the-harvest, or already on the-index-file
          if (oSetKeyAdd.has(sKey) || oSetKeyEx.has(sKey)) { continue }
          oSetKeyAdd.add(sKey)
          aAddOut.push(aAdd[nR])
        }
        aAddOut.sort(fCompare)
        aKeep = fMergeSortedNamUrl(aKeep, aAddOut)
      }
      aOut = [aMeta].concat(aKeep)

      // store fileIdx length, fComputeQntName needs it to update the-parents
      oFileIdx_Qntnam[sFileIdx] = aOut.length - 1
      fWriteJsonQntDate(sFileIdxFull, aOut)
      fSetFileUpNamidx(sFileIdxFull)
    }
    return true
  }

  /**
   * DOING: MERGES the-new sorted name-Urls INTO the-existing sorted name-Urls.
   *   We do NOT sort the-whole-array: fCompare never returns 0, so a-sort
   *   shuffles the-names that are-EQUAL and rewrites-uploads the-index-file
   *   for nothing. On equal names the-existing-name stays first.
   * INPUT: aExIn, aNewIn: both sorted arrays of [name,Url]
   */
  function fMergeSortedNamUrl(aExIn, aNewIn) {
    let
      nE = 0,
      nN = 0,
      aOut = []

    while (nE < aExIn.length && nN < aNewIn.length) {
      if (aNewIn[nN][0] < aExIn[nE][0]) {
        aOut.push(aNewIn[nN])
        nN = nN + 1
      } else {
        aOut.push(aExIn[nE])
        nE = nE + 1
      }
    }
    while (nE < aExIn.length) {
      aOut.push(aExIn[nE])
      nE = nE + 1
    }
    while (nN < aNewIn.length) {
      aOut.push(aNewIn[nN])
      nN = nN + 1
    }
    return aOut
  }

  /**
   * DOING: READS a-reference-index-file ONCE per run.
   *   fStoreNamUrlNamidx and fStoreNamUrlReference need it for EVERY name they route,
   *   and it holds ONLY ids and char-ranges, which NO run changes.
   *   fComputeQntName and fFindIndex must NOT use it: they change the-quantities.
   * OUTPUT: the-array of the-reference-index-file, or null if it is-missing
   */
  function fReadRefNamidx(sFileIdxFullIn) {
    if (oCacheRefNamidx[sFileIdxFullIn] !== undefined) {
      return oCacheRefNamidx[sFileIdxFullIn]
    }
    // the-reference-tree is a-manual split: if its file is-missing, skip (don't crash)
    if (!moFs.existsSync(sFileIdxFullIn)) {
      console.log('>> missing index-file: ' +sFileIdxFullIn)
      oCacheRefNamidx[sFileIdxFullIn] = null
      return null
    }
    oCacheRefNamidx[sFileIdxFullIn] = JSON.parse(moFs.readFileSync(sFileIdxFullIn))
    return oCacheRefNamidx[sFileIdxFullIn]
  }

  /**
   * DOING:
   *  it stores one name-Url in oFileIdx_ANamUrl
   *  using first character of name, for a-language
   * INPUT:
   *  - aNUIn: ["name","dirNtr/McshNtr000007.last.html#idChmElrBoron"]
   *  - sLagIn: 'lagSngu','lagEngl','lagElln'
   */
  function fStoreNamUrlLag(aNUIn, sLagIn) {
    let
      bRest = true,
      // if first-char of name NOT in an-index in the-lag, then it is a-charREST in this lag
      sCharName,    // the-first char of name
      sIndex,       // the-chars-of-index in the-index-file
      sIdxCrnt,
      sIdxNext,
      sFileIdx,      // name of index-file on which to store the-name-Url
      sFileIdxRest,
      nCharName,
      nIdxCrnt,
      nIdxNext

    // FIND index-file
    // choose root-char or rest
    sCharName = aNUIn[0].substring(0,1)
    for (sFileIdx in oRootFileIdx_Idx) {
      if (sFileIdx === sLagIn + '00' || sFileIdx === sLagIn + '00_0'){
        sFileIdxRest = sFileIdx
      }
      if (sFileIdx.startsWith(sLagIn)) {
        sIndex = oRootFileIdx_Idx[sFileIdx]

        if (sIndex.indexOf('..') < 0) {
          // index is a-set of chars 'B|b|'
          if (sIndex.indexOf(sCharName) >= 0) {
            // found index-file
            bRest = false
            fStoreNamUrlNamidx(sFileIdx, aNUIn, sLagIn)
            break
          }
        } else {
          // index is a-sequence of chars 'C..D'
          let a = sIndex.split('..')
          sIdxCrnt = a[0]
          sIdxNext = a[1]
          //compare codepoints
          nCharName = sCharName.codePointAt()
          // if srch-char is a-supplement with surrogates (high 55296–56319), find it
          if (nCharName >= 55296 && nCharName <= 56319) {
            let sSupplement = String.fromCodePoint(aNUIn[0].charAt(0).charCodeAt(0),
                                                   aNUIn[0].charAt(1).charCodeAt(0))
            nCharName = sSupplement.codePointAt()
          }
          if (!Number.isInteger(Number(sIdxCrnt))) {
            // it is char
            nIdxCrnt = sIdxCrnt.codePointAt()
          } else {
            // it is number
            nIdxCrnt = Number(sIdxCrnt)
          }
          if (!Number.isInteger(Number(sIdxNext))) {
            nIdxNext = sIdxNext.codePointAt()
          } else {
            nIdxNext = Number(sIdxNext)
          }
          //console.log(nIdxCrnt+', '+nIdxNext)
          if (nCharName >= nIdxCrnt && nCharName < nIdxNext) {
            // found index-file
            bRest = false
            fStoreNamUrlNamidx(sFileIdx, aNUIn, sLagIn)
            break
          }
        }
      }
    }
    if (bRest) {
      sFileIdx = sFileIdxRest
      fStoreNamUrlNamidx(sFileIdx, aNUIn, sLagIn)
    }
  }

  /**
   * DOING: it stores a-name-Url in oFileIdx_ANamUrl in a-index-file
   * INPUT: sFileIdxIn: lagSngu24i, lagZhon05, lagEngl19es_0
   */
  function fStoreNamUrlNamidx(sFileIdxIn, aNUIn, sLagIn) {
    //console.log(sFileIdxIn+', '+aNUIn[0])
    if (!sFileIdxIn.endsWith('_0')) {
      // fileIdx is NOT a-reference
      if (oFileIdx_ANamUrl[sFileIdxIn]) {
        oFileIdx_ANamUrl[sFileIdxIn].push(aNUIn)
      } else {
        oFileIdx_ANamUrl[sFileIdxIn] = []
        oFileIdx_ANamUrl[sFileIdxIn].push(aNUIn)
      }
    } else {
      // lagNam03si_0 is a-reference
      let aNi = fReadRefNamidx(fFileIdxFull(sFileIdxIn, sLagIn))
      if (!aNi) { return }
      fStoreNamUrlReference(aNi, aNUIn, sLagIn)
    }
  }

  /**
   * DOING:
   *   stores one name-Url in oFileIdx_ANamUrl
   *   using Unicode-code-points order
   * INPUT:
   * - aFileIdxRefIn: an-array of a-reference-index-file
   * [
   *   [";lagEngl03si_0","C..D",167556,"2021-11-07","codepoint order"],
   *   ["lagEngl03si_1","C..char",2178],
   *   ["lagEngl03si_2_0","char..chas",163164],
   *   ["lagEngl03si_3","chas..d",2214]
   * ]
   * - aNUIn: ['name','Url']
   */
  function fStoreNamUrlReference(aFileIdxRefIn, aNUIn, sLagIn) {
    //PROBLEM a-reference-index-file ALWAYS contains sequencies (..) of indecies
    //PROBLEM: on new language, we must create its directory first, local and online.
    //console.log(aNUIn[0]+':   '+aFileIdxRefIn[0])
    for (n = 1; n < aFileIdxRefIn.length; n++) {
      //console.log(aNUIn[0]+':   '+aFileIdxRefIn[n][1])
      let
        sIdxCrnt = aFileIdxRefIn[n][1].split('..')[0],
        sIdxNext = aFileIdxRefIn[n][1].split('..')[1]

      // PROBLEM with supplementary-chars on reference-index-files
      if (aNUIn[0] >= sIdxCrnt && aNUIn[0] < sIdxNext) {
        //console.log(aNUIn[0]+', '+aFileIdxRefIn[n][1])
        // if index-file is NOT a-reference, store name-Url
        if (!aFileIdxRefIn[n][0].endsWith('_0')) {
          if (oFileIdx_ANamUrl[aFileIdxRefIn[n][0]]) {
            oFileIdx_ANamUrl[aFileIdxRefIn[n][0]].push(aNUIn)
          } else {
            oFileIdx_ANamUrl[aFileIdxRefIn[n][0]] = []
            oFileIdx_ANamUrl[aFileIdxRefIn[n][0]].push(aNUIn)
          }
        } else {
          // index-file is a-reference
          let aNi = fReadRefNamidx(fFileIdxFull(aFileIdxRefIn[n][0], sLagIn))
          if (!aNi) { break }
          fStoreNamUrlReference(aNi, aNUIn, sLagIn)
        }
        break
      }
    }
  }

  /**
   * DOING: it finds the-index of a-given index-file.
   */
  function fFindIndex(sFileIdxIn) {
    let
      sIdx = '',
      sFileIdxFull,
      sLag = sFileIdxIn.substring(3, 7),
      sFile,
      aRef

    if (sFileIdxIn.indexOf('_') < 0) {
      // search root
      sIdx = fFindIdxArray(aRootFileIdx_Idx_Qntnam)
    } else if (sFileIdxIn.endsWith('_0')) {
      // lagEngl03si_0 search lagEngl03si
      // lagEngl03si_2_0 search lagEngl03si_0
      sFile = sFileIdxIn.substring(0, sFileIdxIn.lastIndexOf('_'))
      if (sFile.indexOf('_') < 0) {
        sIdx = fFindIdxArray(aRootFileIdx_Idx_Qntnam)
      } else {
        sFile = sFile.substring(0, sFile.lastIndexOf('_'))
        sFileIdxFull = 'dirNamidx/dirLag'+sLag +'/namidx.' +sFile +'_0.json'
        aRef = JSON.parse(moFs.readFileSync(sFileIdxFull))
        sIdx = fFindIdxArray(aRef)
      }
    } else {
      // lagEngl03si_2_14 search lagEngl03si_2_0
      sFile = sFileIdxIn.substring(0, sFileIdxIn.lastIndexOf('_'))
      sFileIdxFull = 'dirNamidx/dirLag'+sLag +'/namidx.' +sFile +'_0.json'
      aRef = JSON.parse(moFs.readFileSync(sFileIdxFull))
      sIdx = fFindIdxArray(aRef)
    }

    function fFindIdxArray (aFileIdx) {
      for (n = 1; n < aFileIdx.length; n++) {
        if (aFileIdx[n][0] === sFileIdxIn) {
          // we found idxfile
          sIdx = aFileIdx[n][1]
          break
        }
      }
      return sIdx
    }
    return sIdx
  }

  /**
   * Remove duplicates of an-array [["a","b"],["a","c"],["a","b"],["c","d"]]
   */
  function fRemoveArrayDupl(aIn) {
    let
      // a-set, NOT an-array: an-index-file has up to 37000 names and
      // aHelp.includes() on each of them was quadratic.
      oSetHelp = new Set(),
      aOut = [],
      nR,
      sElt

    for (nR = 0; nR < aIn.length; nR++) {
      sElt = aIn[nR].join('JJ')
      if (!oSetHelp.has(sElt)) {
        oSetHelp.add(sElt)
        aOut.push(aIn[nR])
      }
    }
    return aOut
  }

  /**
   * DOING: creates json-file from array.
   *   Each element in the-array is another array
   *   with name and url elements.
   *   on the-first element updates the-quantity of names and the-date.
   * INPUT:
   *   - sFilIn the-index-file we want to create
   *   - aIn the-array of the-name-Url-arrays to include,
   */
  function fWriteJsonQntDate(sFilIn, aIn) {
    let
      s

    // aIn[0] = [";lagEngl01ei",";A..B",419,"2018-08-04"],
    // JSON.stringify escapes " \ tab etc. in names/urls (manual concatenation did not)
    if (aIn.length === 1) {
      s = '[\n  ' + JSON.stringify([aIn[0][0], aIn[0][1], 0, fDateYMD()]) + '\n'
    } else {
      s = '[\n  ' +
        JSON.stringify([aIn[0][0], aIn[0][1], aIn.length-1, fDateYMD()]) + ',\n'
      for (let n = 1; n < aIn.length-1; n++) {
        s = s +'  ' + JSON.stringify([aIn[n][0], aIn[n][1]]) + ',\n'
      }
      // last element no-comma at the-end
      s = s + '  ' + JSON.stringify([aIn[aIn.length-1][0], aIn[aIn.length-1][1]]) + '\n'
    }

    s = s + ']'
    // create the-parent-dir (dirNamidx/dirLag<Lag>) on demand for a-fresh-worldview
    let sDir = sFilIn.substring(0, sFilIn.lastIndexOf('/'))
    if (sDir) moFs.mkdirSync(sDir, { recursive: true })
    moFs.writeFileSync(sFilIn, s)
  }

  /**
   * DOING: writes a-json-array-file AND adds it on the-upload-list.
   *   fComputeQntName rewrites the-quantities of the-reference-index-files,
   *   grand-parents included, so ALL of them must-be uploaded.
   */
  function fWriteJsonArrayUp(sFilIn, aIn) {
    fWriteJsonArray(sFilIn, aIn)
    oSetFileUp.add(sFilIn)
  }

  /**
   * Compares elements of arrays
   * Used in: aNew.sort(fCompare)
   * to sort arrays of arrays.
   */
  function fCompare(aA, aB) {
    return aA[0] > aB[0] ? 1 : -1
  }

  /**
   * DOING: it computes quantities of names
   */
  function fComputeQntName() {
    // oFileIdx_Qntnam={lagEngl00: 1101,lagEngl01ei: 419,lagEngl03si_1: 1038,lagEngl03si_2_1: 6959}
    // the-set of index-files we computed
    let oSetNamidxComputed = new Set()

    for (let sFileIdx in oFileIdx_Qntnam) {
      //console.log('>>> compute: '+sFileIdx)
      let sFileIdxRef // the-reference-file lagEngl03si_2_0

      // if fileIdx is a-child, we find its reference-parent
      if (sFileIdx.indexOf('_') > 0) {
        // lagEngl03si_1 >> lagEngl03si_0
        sFileIdxRef = sFileIdx.substring(0, sFileIdx.lastIndexOf('_')) +'_0'
      }

      if (sFileIdx.indexOf('_') === -1 && !oSetNamidxComputed.has('lagRoot')) {
        // a namidx.lagRoot.json element
        oSetNamidxComputed.add('lagRoot')
        fUpdate_from_oFileIdxQ('dirNamidx/namidx.lagRoot.json')
      } else if (sFileIdx.indexOf('_') > 0 && !oSetNamidxComputed.has(sFileIdxRef)) {
        // sFileIdxRef=lagEngl03si_2_0
        oSetNamidxComputed.add(sFileIdxRef)
        fUpdate_from_oFileIdxQ('dirNamidx/dirLag' + sFileIdx.substring(3,7)
          + '/namidx.' + sFileIdxRef + '.json')
      }
    }

    // update quantities in a-reference-index-file
    // and computes new sums
    function fUpdate_from_oFileIdxQ(sFileIdxRefIn) {
      // read array of index-file
      // iterate over array and update oFileIdx_Qntnam items
      // store new file
      // [";lagEngl03si_2_0",";char",129181,"2018-07-29","codepoint order"],
      // ["lagEngl03si_2_1","char",6959],
      let
        aNi = JSON.parse(moFs.readFileSync(sFileIdxRefIn)),
        n,
        nSum = 0

      if (sFileIdxRefIn.indexOf('.lagRoot.json') === -1) {
        //console.log("update: " +sFileIdxRefIn)
        for (n = 1; n < aNi.length; n++) {
          // aNi=[["lagEngl03si_2_1","char",1000]]
          // oFileIdx_Qntnam= [lagEngl03si_2_1:1000]]
          // if oFileIdx_Qntnam contains info of aNi[n]
          if (!aNi[n][0].startsWith(';')) {
            // don't compute lag-sums twice [";lagEngl","English",145191],
            // >= 0 and NOT truthiness: an-index-file CAN lose ALL its names
            if (oFileIdx_Qntnam[aNi[n][0]] >= 0) {
              aNi[n][2] = oFileIdx_Qntnam[aNi[n][0]]
              nSum = nSum + aNi[n][2]
              oSetNamidxComputed.add(aNi[n][0])
            } else {
              nSum = nSum + aNi[n][2]
            }
          }
        }
        aNi[0][2] = nSum
        aNi[0][3] = fDateYMD()
        fWriteJsonArrayUp(sFileIdxRefIn, aNi)
        fUpdate_from_child(sFileIdxRefIn, nSum)
      } else {
        // lagRoot index-file
        let
          nLag = 1, // first lang index
          nSumAGGR = 0

        nSum = 0
        // [";AGGR","char",0,"2018-09-11","root chars"],
        // [";lagElln","Greek",1848],
        for (n = 2; n < aNi.length; n++) {
          // ["lagElln01alfa","Α",258],
          if (new RegExp('^;lag....$').test(aNi[n][0])) {
            // on new lag reset nSum
            nSumAGGR = nSumAGGR + nSum
            aNi[nLag][2] = nSum
            nSum = 0
            nLag = n
          } else if (oFileIdx_Qntnam[aNi[n][0]] >= 0) {
            aNi[n][2] = oFileIdx_Qntnam[aNi[n][0]]
            nSum = nSum + aNi[n][2]
            oSetNamidxComputed.add(aNi[n][0])
          } else if (!oFileIdx_Qntnam[aNi[n][0]]) {
            nSum = nSum + aNi[n][2]
          }
        }
        nSumAGGR = nSumAGGR + nSum
        aNi[nLag][2] = nSum
        aNi[0][2] = nSumAGGR
        aNi[0][3] = fDateYMD()
        fWriteJsonArrayUp(sFileIdxRefIn, aNi)
      }
    }

    // update sum in parent files
    function fUpdate_from_child(sChld_pathIn, nChld_sumIn) {
      // double
      let
        sPrnt_path,
        aPrnt_nmix,
        n,
        nPrnt_sum = 0,
        sChld_path_only = sChld_pathIn.substring(0, sChld_pathIn.lastIndexOf('_')),
        sChld_nmix = sChld_pathIn.substring(sChld_pathIn.indexOf('namidx.')+7, sChld_pathIn.lastIndexOf('.'))

      if (sChld_path_only.indexOf('_') > 0) {
        // parent is NOT the-root-reference
        sPrnt_path = sChld_path_only.substring(0, sChld_path_only.lastIndexOf('_')) + '_0.json'
        //console.log('update-child: ' +sPrnt_path +', ' +nChld_sumIn)
        aPrnt_nmix = JSON.parse(moFs.readFileSync(sPrnt_path))
        for (n = 1; n < aPrnt_nmix.length; n++) {
          // ["lagEngl03si_0","C",130313],
          if (aPrnt_nmix[n][0] === sChld_nmix) {
            nPrnt_sum = nPrnt_sum + nChld_sumIn
            aPrnt_nmix[n][2] = nChld_sumIn
          } else {
            nPrnt_sum = nPrnt_sum + aPrnt_nmix[n][2]
          }
        }
        aPrnt_nmix[0][2] = nPrnt_sum // all sum
        aPrnt_nmix[0][3] = fDateYMD()
        fWriteJsonArrayUp(sPrnt_path, aPrnt_nmix)
        fUpdate_from_child(sPrnt_path, nPrnt_sum)
      } else {
        // parent is the-root-reference
        //console.log('update-child: root, ' +nChld_sumIn)
        let
          nAllSum = 0,
          nLagSum = 0, // sum of lag
          nLagIdx = 1 // index of lag

        sPrnt_path = 'dirNamidx/namidx.lagRoot.json'
        aPrnt_nmix = JSON.parse(moFs.readFileSync(sPrnt_path))
        for (n = 2; n < aPrnt_nmix.length; n++) {
          if (new RegExp('^;lag....$').test(aPrnt_nmix[n][0])) {
            nAllSum = nAllSum + nLagSum
            aPrnt_nmix[nLagIdx][2] = nLagSum
            nLagSum = 0
            nLagIdx = n
          } else if (aPrnt_nmix[n][0] === sChld_nmix) {
            nLagSum = nLagSum + nChld_sumIn
            aPrnt_nmix[n][2] = nChld_sumIn
          } else if (aPrnt_nmix[n][0] !== sChld_nmix) {
            nLagSum = nLagSum + aPrnt_nmix[n][2]
          }
        }
        nAllSum = nAllSum + nLagSum
        aPrnt_nmix[nLagIdx][2] = nLagSum
        aPrnt_nmix[0][2] = nAllSum
        aPrnt_nmix[0][3] = fDateYMD()
        fWriteJsonArrayUp(sPrnt_path, aPrnt_nmix)
      }
    }
  }
  fComputeQntName()

  console.log('>>> Mcs-file indexed:')
  console.log(aFileMcs_QntMcs)

  /**
   * DOING: updates the-quantity of Mcs of ONE Mcs-file[a] in Mcshqnt.json-files
   *    AND all wholes of it[a]
   * INPUT: the-name of an-Mcs-file[a] and the-new quantity of Mcs in this[a] file.
   * OUTPUT: the-Mcsqnt-files affected
   */
  function fUpdateQntMcs(sFileMcsIn, nMcsqntIn) {
    let
      aMcsqnt,
      bMcs = false,
      bChanged = false,
      // NOTHING changed ⇒ we do NOT write and we do NOT upload this Mcshqnt-file,
      // and its wholes need no update either.
      nMcsqntSum = 0,
      sDir = sFileMcsIn.substring(0, sFileMcsIn.lastIndexOf('/')),
      sMcsqnt

    if (sFileMcsIn.startsWith('Mcsh000')) {
      sMcsqnt = 'Mcshqnt.root.json'
    } else {
      sMcsqnt = sDir + '/Mcshqnt.json'
    }

    // read the-Mcsqnt-file, or start a-meta-only skeleton on demand (fresh worldview)
    if (moFs.existsSync(sMcsqnt)) {
      aMcsqnt = JSON.parse(moFs.readFileSync(sMcsqnt))
    } else {
      aMcsqnt = [[sDir === '' ? ';qntAGG' : ';' + sDir, 0, fDateYMD()]]
      bChanged = true
    }
    for (n = 1; n < aMcsqnt.length; n++) {
      // [";dirDIR",115,"2018-10-06"],
      // ["dirDIR/filMcsNAME.last.html",112],
      // [";dirTchInf/dirUcd",33136,"2021-03-22"],
      // ["dirTchInf/dirUcd/filMcsDirUcd.last.html",0],
      if (aMcsqnt[n][1] === 0) {
        // remove files with 0 Mcs
        aMcsqnt.splice(n, 1)
        bChanged = true
      } else if (aMcsqnt[n][0] === sFileMcsIn) {
        if (aMcsqnt[n][1] !== nMcsqntIn) { bChanged = true }
        aMcsqnt[n][1] = nMcsqntIn
        nMcsqntSum = nMcsqntSum + nMcsqntIn
        bMcs = true
      } else {
        nMcsqntSum = nMcsqntSum + aMcsqnt[n][1]
      }
    }
    // if Mcsfile is new, add it
    // we have to remove old!!! or qnt=0
    if (!bMcs) {
      aMcsqnt.push([sFileMcsIn, nMcsqntIn])
      nMcsqntSum = nMcsqntSum + nMcsqntIn
      bChanged = true
    }
    // the-sum of the-dir can-change from a-sibling-file of the-same run
    if (aMcsqnt[0][1] !== nMcsqntSum) { bChanged = true }
    if (!bChanged) { return }
    // on root
    if (sDir === '') {
      aMcsqnt[0] = [';qntAGG', nMcsqntSum, fDateYMD()]
    } else {
      aMcsqnt[0] = [';'+sDir, nMcsqntSum, fDateYMD()]
    }
    aMcsqnt.sort()
    fWriteJsonArrayUp(sMcsqnt, aMcsqnt)

    // update parents
    if (sDir === '') {
      // do nothing, root is ok
    } else if (sDir.indexOf('/') === -1) {
      // parent = root
      fUpdate_root(sDir, nMcsqntSum)
    } else {
      fUpdateQntMcs(sDir, nMcsqntSum)
    }

    // update root file
    function fUpdate_root(sDfIn, nQIn) {
      let
        aMcsqntRt,
        bFound = false,
        bChangedRt = false,
        nMcsqntRtSum = 0,
        sMcsqntRt = 'Mcshqnt.root.json'

      // read Mcshqnt.root.json, or start a-meta-only skeleton on demand (fresh worldview)
      if (moFs.existsSync(sMcsqntRt)) {
        aMcsqntRt = JSON.parse(moFs.readFileSync(sMcsqntRt))
      } else {
        aMcsqntRt = [[';qntAGG', 0, fDateYMD()]]
        bChangedRt = true
      }
      for (n = 1; n < aMcsqntRt.length; n++) {
        // [";qntAGG",179925,"2018-10-05"],
        // ["dirCor",10],
        if (aMcsqntRt[n][0] === sDfIn) {
          if (aMcsqntRt[n][1] !== nQIn) { bChangedRt = true }
          aMcsqntRt[n][1] = nQIn
          nMcsqntRtSum = nMcsqntRtSum + nQIn
          bFound = true
        } else {
          nMcsqntRtSum = nMcsqntRtSum + aMcsqntRt[n][1]
        }
      }
      // on a-fresh-root the dir is not listed yet: add it, so it is recorded
      if (!bFound) {
        aMcsqntRt.push([sDfIn, nQIn])
        nMcsqntRtSum = nMcsqntRtSum + nQIn
        bChangedRt = true
      }
      if (aMcsqntRt[0][1] !== nMcsqntRtSum) { bChangedRt = true }
      if (!bChangedRt) { return }
      // keep DIRS ordered (a-new-dir was pushed at the-end); ';qntAGG' sorts to index 0
      aMcsqntRt.sort()
      aMcsqntRt[0] = [';qntAGG', nMcsqntRtSum, fDateYMD()]
      fWriteJsonArrayUp(sMcsqntRt, aMcsqntRt)
    }
  }

  /**
   * DOING: update the-quantity of Mcs of ALL Mcs-files.
   */
  function fUpdateALLQntMcs(aIn) {
    for (const item of aIn) {
      fUpdateQntMcs(item[0], item[1])
    }
  }
  fUpdateALLQntMcs(aFileMcs_QntMcs)

  // WRITE the-files to upload, AFTER the-Mcshqnt-files: the-upload-list must
  // contain ALL the-files we wrote, and ONLY them.
  let aSftp = Array.from(oSetFileUp)
  aSftp.sort()
  console.log(aSftp)
  moFs.mkdirSync('dirManager', { recursive: true })   // per-worldview manager-data folder
  fWriteJsonArray('dirManager/sftp.json', aSftp)

  //call
  if (fSftpIn) fSftpIn()
}

export {fNamidx}