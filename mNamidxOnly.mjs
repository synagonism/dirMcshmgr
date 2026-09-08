/*
 * mNamidxOnly.mjs - go 115 for lag, module that creates name-indexes
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
 *   it works as a-module AND stand-alone.
 *   1) it updates the-names of Mcs-files in NamidxOnly.txt, in index-files.
 *   2) it appends the-file 'SftpAgg.json' that contains the-changed files we have to upload.
 *   3) it computes the-number of names.
 *   4) it computes the-number of concepts.
 * INPUT: dirManager/NamidxOnly.txt
 * OUTPUT: dirLang/namidx.lagLangX.json, namidx.lagRoot.json, Mcsqnt.json,
           dirManager/SftpOnly.json,
 * RUN: node ../dirMcshmgr/mNamidxOnly.mjs
 *
 * PROBLEM:
 * - to compute the-number of concepts, we must set new DIRS at cptqnt.root.json.
 *
 */

import moFs from 'fs'
import {fWriteJsonArray} from './mUtil.mjs'

const
  // contains the-versions of mHitp.js
  aVersion = [
    'mNamidxOnly.mjs.0-7-0.2026-08-30: dirMcshmgr',
    'mNamidxOnly.mjs.0-6-0.2025-11-30: clear only index',
    'mNamidxOnly.mjs.0-5-0.2022-03-17: only index',
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
    'namidx: {2021-01-04} * McsSngo',
    'namidx: {2020-10-19} * Mcs. for section and paragraph-Mcs',
    'namidx: {2020-10-18} McsP.',
    'namidx: {2019-12-11} cptqnt.root.json',
    'namidx: {2019-09-05} lagKmo',
    'namidx: {2018-10-25} cptqnt.json',
    'namidx: {2018-10-16} * Mcs.',
    'namidx: {2018-09-22}',
    'namidx: {2017-06-01} created'
  ]

let
  aFileMcsInComments,
  aFileMcsTxt = [],
  aLagAlone = undefined


aFileMcsInComments = moFs.readFileSync('dirManager/NamidxOnly.txt').toString().split('\n')

/**
 * a) find Mcs-files to remove|add its names and put paths in aFileMcsIn.
 * b) find languages to work-with.
 */
for (let n = 0; n < aFileMcsInComments.length; n++) {
  let sLn = aFileMcsInComments[n]

  // remove comments and empty-lines
  if (!sLn.startsWith('//') && sLn.length !== 0) {
    if (sLn.startsWith('lag')) {
      if (!aLagAlone) aLagAlone = []
      aLagAlone.push(sLn.substring(0,7))
      // aLag = ['lagALLL'] or ['lagElln','lagEngl',...]
    } else {
      // remove comments after ;
      if (sLn.indexOf(';') > 0) {
        aFileMcsTxt.push(sLn.substring(0,sLn.lastIndexOf(';')))
      } else {
        aFileMcsTxt.push(sLn)
      }
    }
  }
}

function fNamidx(fileIn) {
  let
    bExtra = false, // extra names, added manually on namidx.lagLagoExtra.json to-be removed!
    oNextln,
    oSetFileUp = new Set,
    // files to upload, index, Mcs, Mcsqnt
    // we use a-set, because we add same files and want unique.
    aFileMcsIn,
    // array with names of dirCor/McsCor000010.last.html to remove|add its names
    aLag,
    // array of languages ['lagALLL'] or ['lagElln','lagEngl',...]
    aLagALL = ['lagEngl','lagSngu','lagElln','lagZhon',
    'lagArab','lagDeut','lagElla','lagEspo','lagFrac',
    'lagHind','lagItln','lagJpns','lagKhmr','lagKora','lagRomn',
    'lagSbos','lagShrv','lagScnr','lagSsrp','lagSbul','lagSmkd','lagSrus','lagSslv',
    'lagSpan','lagSqip',
    'lagTurk','lagVnma'],
    // 'lagAlb','lagBel','lagBos','lagBul','lagCes','lagDan','lagDeu','lagEst',
    // 'lagFin','lagFra','lagHrv','lagHun','lagIta','lagLav','lagLit','lagMlt',
    // 'lagMol','lagNld','lagNor','lagPol','lagPor','lagRom','lagRus','lagSlk',
    // 'lagSlv','lagSrp','lagSpa','lagSwe','lagTur','lagUkr',
    // 'lagArb','lagHin','lagJpn'
    aRootFileIdx_Idx_Qntnam = JSON.parse(moFs.readFileSync('dirNamidx/namidx.lagRoot.json')),
    // [['lagEngl01ei','A',1111]] with quantity of names
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

  if (typeof fileIn === 'string') {
    aFileMcsIn = [fileIn]
  } else {
    aFileMcsIn = fileIn
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

  if (aLagAlone) aLag = aLagAlone
  else aLag = aLagALL

  // Hitp pages are books, not Mcs-concept files → a Hitp-only run computes no Mcs-quantities.
  var bAnyMcs = aFileMcsIn.some(function (s) { return !s.substring(s.lastIndexOf('/') + 1).startsWith('Hitp') })
  if (aFileMcsIn.length > 0) {
    // first file we want to upload
    oSetFileUp.add('dirNamidx/namidx.lagRoot.json');
    // also we want the-file with the-quantity of concepts (skip for Hitp-only runs).
    if (bAnyMcs) oSetFileUp.add('Mcsqnt.root.json');
  }

  /**
   * for EACH FILE in aFileMcsIn,
   * for EACH LANGUAGE
   * REMOVE the-names linked to this file, for ALL index-files
   * READ the-file and store temporarilly its name-Urls
   * ADD name-Urls in index-files
   */
  for (let n = 0; n < aFileMcsIn.length; n++) {
    let
      nMcsqnt = 0,
      sFileMcs = aFileMcsIn[n], // the-Mcs-file we want to work
      bIsHitp = sFileMcs.substring(sFileMcs.lastIndexOf('/') + 1).startsWith('Hitp') // Hitp page → no Mcs-quantity

    // add the-file to upload-list
    oSetFileUp.add(sFileMcs)
    // add Mcsqnt-file to upload-list
    // if sFileMcs ../index.html dirNamidx/abbreviation.html do nothing nnn
    if (!sFileMcs.startsWith('../')             // root-dir has no Mcs
        && !sFileMcs.startsWith("dirNamidx/")   // dirNamidx has no Mcs
        && !sFileMcs.startsWith("Mcs000")       // dirMcsh has Mcsqnt.root.json
        && !bIsHitp                             // Hitp pages have no Mcsqnt.json
       ) {
      oSetFileUp.add(sFileMcs.substring(0, sFileMcs.lastIndexOf('/')) + '/Mcsqnt.json')
    }

    // for EACH language
    for (let nL = 0; nL < aLag.length; nL++) {
      var
        aNU, // array with a-name-Url
        oFileIdx_ANamUrl = {}
        // object to hold the-Αrrays with the-Νame-Urls per index-file
        // after reading Mcs-files.
        // {lagEngl01ei:[['name1','Url1'],['name2','Url2']]}

      // REMOVE name-Urls
      fRemoveNamUrl(oRootFileIdx_Idx, sFileMcs, aLag[nL])

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
        aReadlines = moFs.readFileSync(sFileMcs).toString().split('\n')

      for (sLn of aReadlines) {
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
          if (sLn.startsWith('    <br>* Mcs'+aLag[nL].substring(3)+'.')) {
            if (bMcsSection) {
              aNU = [sLn.substring(18, sLn.indexOf(',')), sUrl]
              fStoreNamUrlLag(aNU, aLag[nL])
            } else {
              aNU = [sLn.substring(18, sLn.indexOf(',')), sUrlP]
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

      if (bExtra) {
        // ADD extra name-Urls on oFileIdx_ANamUrl for current language
        let aFileIdxExtr = JSON.parse(moFs.readFileSync('dirNamidx/dirLag' +aLag[nL].substring(3)
          +'/namidx.' +aLag[nL] +'Extra.json'))
        for (let nE = 0; nE < aFileIdxExtr.length; nE++) {
          fStoreNamUrlLag(aFileIdxExtr[nE], aLag[nL])
        }
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

        oSetFileUp.add(sFileIdxFullExist)
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

    // update Mcsqnt.json
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
                oSetFileUp.add(sFileIdxFull)
                if (sFileIdxFull.indexOf('_') > 0) {
                  // IF removed child, add and parent-reference
                  oSetFileUp.add(sFileIdxFull.substring(0, sFileIdxFull.lastIndexOf('_')) +'_0.json')
                }
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
   * DOING:
   *  it stores one name-Url in oFileIdx_ANamUrl
   *  using first character of name, for a-language
   * INPUT:
   *  - aNUIn: ["name","dirNtr/McsNtr000007.last.html#idChmElrBoron"]
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
      let aNi = JSON.parse(moFs.readFileSync('dirNamidx/dirLag' + sLagIn.substring(3)
        +'/namidx.' +sFileIdxIn +'.json'))
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
   *   [";lagEngl03si_0","C|c",167556,"2021-11-07","codepoint order"],
   *   ["lagEngl03si_1","C..char",2178],
   *   ["lagEngl03si_2_0","char..chas",163164],
   *   ["lagEngl03si_3","chas..D",2214]
   * ]
   * - aNUIn: ['name','Url']
   */
  function fStoreNamUrlReference(aFileIdxRefIn, aNUIn, sLagIn) {
    //PROBLEM a-reference-index-file ALWAYS contains sequencies (..) of indecies
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
          let aNi = JSON.parse(moFs.readFileSync('dirNamidx/dirLag' + sLagIn.substring(3)
              +'/namidx.' +aFileIdxRefIn[n][0] +'.json'))
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
      aHelp = [],
      aOut = [],
      sElt

    for (n = 0; n < aIn.length; n++) {
      sElt = aIn[n].join('JJ')
      if (!aHelp.includes(sElt)) {
        aHelp.push(sElt)
        aOut.push(aIn[n])
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
    if (aIn.length === 1) {
      s = '[\n  ["' + aIn[0][0] + '","' + aIn[0][1] + '",0,"' + fDateYMD() + '"]\n'
    } else {
      s = '[\n  ["' + aIn[0][0] + '","' + aIn[0][1] + '",' +
        (aIn.length-1) + ',"' + fDateYMD() + '"],\n'
      for (let n = 1; n < aIn.length-1; n++) {
        s = s +'  ["' + aIn[n][0] + '","' + aIn[n][1] + '"],\n'
      }
      // last element no-comma at the-end
      s = s + '  ["' + aIn[aIn.length-1][0] + '","' + aIn[aIn.length-1][1] + '"]\n'
    }

    s = s + ']'
    moFs.writeFileSync(sFilIn, s)
  }

  /**
   * DOING: it returns the-current-date as yyyy-mm-dd
   */
  function fDateYMD() {
    let
      oD, sY, sM, sD
    oD = new Date()
    sY = oD.getFullYear().toString()
    sM = (oD.getMonth() + 1).toString()
    if (sM.length === 1) {
      sM = '0' + sM
    }
    sD = oD.getDate().toString()
    if (sD.length === 1) {
      sD = '0' + sD
    }
    return sY + '-' + sM + '-' + sD
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
            if (oFileIdx_Qntnam[aNi[n][0]]) {
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
        fWriteJsonArray(sFileIdxRefIn, aNi)
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
        fWriteJsonArray(sFileIdxRefIn, aNi)
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
        fWriteJsonArray(sPrnt_path, aPrnt_nmix)
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
        fWriteJsonArray(sPrnt_path, aPrnt_nmix)
      }
    }
  }
  fComputeQntName()

  // APPEND files for upload — accumulate into our own SftpOnly.json across runs (tolerate first run)
  moFs.mkdirSync('dirManager', { recursive: true })
  let aSftp = moFs.existsSync('dirManager/SftpOnly.json')
    ? JSON.parse(moFs.readFileSync('dirManager/SftpOnly.json')) : []
  for (let sFile of aSftp) {
     oSetFileUp.add(sFile)
  }
  aSftp = Array.from(oSetFileUp)
  aSftp.sort()
  if (aSftp.length > 0) {
    fWriteJsonArray('dirManager/SftpOnly.json', aSftp)
  }

  console.log('>>> Mcs-file indexed:')
  console.log(aFileMcs_QntMcs)
  console.log('>>> files to upload:')
  console.log(aSftp)

  /**
   * DOING: updates the-quantity of Mcs of ONE Mcs-file[a] in Mcsqnt.json-files
   *    AND all wholes of it[a]
   * INPUT: the-name of an-Mcs-file[a] and the-new quantity of Mcs in this[a] file.
   * OUTPUT: the-Mcsqnt-files affected
   */
  function fUpdateQntMcs(sFileMcsIn, nMcsqntIn) {
    let
      aMcsqnt,
      bMcs = false,
      nMcsqntSum = 0,
      sDir = sFileMcsIn.substring(0, sFileMcsIn.lastIndexOf('/')),
      sMcsqnt

    if (sFileMcsIn.startsWith('Mcs000')) {
      sMcsqnt = 'Mcsqnt.root.json'
    } else {
      sMcsqnt = sDir + '/Mcsqnt.json'
    }

    aMcsqnt = JSON.parse(moFs.readFileSync(sMcsqnt))
    for (n = 1; n < aMcsqnt.length; n++) {
      // [";dirDIR",115,"2018-10-06"],
      // ["dirDIR/filMcsNAME.last.html",112],
      // [";dirTchInf/dirUcd",33136,"2021-03-22"],
      // ["dirTchInf/dirUcd/filMcsDirUcd.last.html",0],
      if (aMcsqnt[n][1] === 0) {
        // remove files with 0 Mcs
        aMcsqnt.splice(n, 1)
      } else if (aMcsqnt[n][0] === sFileMcsIn) {
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
    }
    // on root
    if (sDir === '') {
      aMcsqnt[0] = [';qntAGG', nMcsqntSum, fDateYMD()]
    } else {
      aMcsqnt[0] = [';'+sDir, nMcsqntSum, fDateYMD()]
    }
    aMcsqnt.sort()
    fWriteJsonArray(sMcsqnt, aMcsqnt)

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
        nMcsqntRtSum = 0,
        sMcsqntRt = 'Mcsqnt.root.json'

      aMcsqntRt = JSON.parse(moFs.readFileSync(sMcsqntRt))
      for (n = 1; n < aMcsqntRt.length; n++) {
        // [";qntAGG",179925,"2018-10-05"],
        // ["dirCor",10],
        if (aMcsqntRt[n][0] === sDfIn) {
          aMcsqntRt[n][1] = nQIn
          nMcsqntRtSum = nMcsqntRtSum + nQIn
        } else {
          nMcsqntRtSum = nMcsqntRtSum + aMcsqntRt[n][1]
        }
      }
      aMcsqntRt[0] = [';qntAGG', nMcsqntRtSum, fDateYMD()]
      fWriteJsonArray(sMcsqntRt, aMcsqntRt)
    }
  }

  /**
   * DOING: update the-quantity of Mcs of ALL Mcs-files.
   */
  async function fUpdateALLQntMcs(aIn) {
    for (const item of aIn) {
     await fUpdateQntMcs(item[0], item[1])
    }
  }
  fUpdateALLQntMcs(aFileMcs_QntMcs)
}

// create name-indices
fNamidx(aFileMcsTxt)

export {fNamidx}