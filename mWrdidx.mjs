/*
 * mWrdidx.mjs - module that creates word-indexes and uploads the-files
 * The MIT License (MIT)
 *
 * Copyright (c) 2022 Kaseluris.Nikos.1959 (hmnSngo)
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
 *   1) it reads the-Wrdidx.txt, and creates the-word-concepts for the-words in.
 *   2) it name-indexes the-new files.
 * INPUT: Wrdidx.txt
 * OUTPUT: dirWrdidx/dirLang/McsWrdidxLangX.last.html, McsWrdidxLangX.txt aPages, name-idx-files, sftp.json,
 *
 * RUN: node mWrdidx.mjs pwd 
 *
 * PROBLEM:
 * - ambigous phonemic-notation
 */

import moFs from 'fs';
import {fNamidx} from './mNamidx.mjs'
import {oSftp, fSftp} from './mSftp.mjs'
import * as moUtil from './mUtil.mjs'
import * as moLagUtil from './mLagUtil.js'
import * as moLagElln from './mLagElln.mjs'

const
  // contains the-versions of mHitp.js 
  aVersion = [
    'mWrdidx.mjs.0-4-1.2022-03-16: same-name',
    'mWrdidx.mjs.0-4-0.2022-03-13: index-phonema',
    'mWrdidx.mjs.0-3-0.2022-02-26: version of WrdidxMcs',
    'mWrdidx.mjs.0-2-0.2022-02-21: fCreateWordinfo',
    'mWrdidx.mjs.0-1-0.2022-02-08: created'
  ]

let
  aWordsInComments,
  aWordsIn = [],
  sMethod,
  bWrdidx = false

if (process.argv[2]) {
  oSftp.password = process.argv[2]
  bWrdidx = true
} else {
  console.log('type password after mWrdidx.mjs')
  process.exit()
}

if (bWrdidx) {
  aWordsInComments = moFs.readFileSync('Wrdidx.txt').toString().split('\n')

  /**
   * find words and method to work on.
   */
  for (let n = 0; n < aWordsInComments.length; n++) {
    let sLn = aWordsInComments[n]

    // remove comments and empty-lines
    if (!sLn.startsWith('//') && sLn.length !== 0) {
      // remove comments after ;
      if (sLn.indexOf(';') > 0) {
        aWordsIn.push(sLn.substring(0,sLn.lastIndexOf(';')))
      } else {
        aWordsIn.push(sLn)
      }
    }
  }
  //the-first item is the-method
  sMethod = aWordsIn.shift()
}

/**
 * DOING: it stores word-info
 * INPUT:
 *    - asWordsIn: an array-of-words OR one word to index.
 *    - sMethodIn
 */
function fWrdidx(asWordsIn, sMethodIn) {
  let
    oSetFileUp = new Set, 
    // files to upload, 
    // we use a-set, because we add same files and want unique.
    oSetFileIndex = new Set,
    // files to name-index,
    aSftp,
    aIndex,
    aWordsIn,
    // array with words to index
    sMethod = sMethodIn,
    sLag = sMethod.substring(4, 8),
    aRootWrdidx_Idx = JSON.parse(moFs.readFileSync('dirWrdidx/McsWrdidx_0.json')),
    // [['McsWrdidxEngl01ei','A']}
    oWrdidxMcs_Idx = {},
    // holds the-names of Wrdidx-files and the related indexes
    // {McsWrdidxEngl01ei:'A|a', McsWrdidxZhon024:'13312..14000'}
    sLn,
    n

  // one wordIn or an array of words
  if (typeof asWordsIn === 'string') {
    aWordsIn = [asWordsIn]
  } else {
    aWordsIn = asWordsIn
  }

  /**
   * for EACH word in aWordsIn, FINDS its Wrdidx-file, ADDS word-info
   * INPUT: sWordIn = 'ξαδέρφη-η/ksadhérfi-i/'
   */
  aWordsIn.forEach((sWordIn) => {
    let
      aWordinfo,
      sWord,
      aWrdidxMcs_Idx, //["McsWrdidxElln02vita","Β|β"]
      sWrdidxMcs,
      sWrdidxMcsFull,
      sIndex

    sWord = sWordIn
    //console.log(sWord)
    aWrdidxMcs_Idx = fFindWrdidxMcs(sWord, sLag, aRootWrdidx_Idx)
    sWrdidxMcs = aWrdidxMcs_Idx[0]
    sIndex = aWrdidxMcs_Idx[1]
    //console.log(sWrdidxMcs)

    sWrdidxMcsFull = 'dirWrdidx/dirLag' + sLag + '/' + sWrdidxMcs

    //create word-info
    //["ξαδέρφη-η","  <p id=="idWrdEllnksadhérfi-i"><span class="clsColorRed">ξαδέρφη-η/ksadhérfi-i/..."]
    aWordinfo = fCreateWordinfo(sWord, sMethod)
    //console.log(aWordinfo)

    //add word-info
    if (moFs.existsSync(sWrdidxMcsFull)) {
      //add word-info
      fStoreWordinfo(sWrdidxMcsFull, aWordinfo)
    } else {
      //create file and add word-info
      fCreateWrdidxMcs(sWrdidxMcsFull, sIndex)
      fStoreWordinfo(sWrdidxMcsFull, aWordinfo)
    }
  })

  /**
   * DOING: it creates McsWrdidx-file
   * INPTUT: sWiMcsFullIn='dirWrdidx/dirLagElln/McsWrdidxElln01alfa_1.last.html'
   */
  function fCreateWrdidxMcs(sWiMcsFullIn, sIndexIn) {
    let
      n,
      s,
      sName = sWiMcsFullIn.substring(sWiMcsFullIn.lastIndexOf('/')+1, sWiMcsFullIn.indexOf('.')),
      sFile = sName + '.last.html', //McsWrdidxElln01alfa_1.last.html
      sLag =  sWiMcsFullIn.substring(16, sWiMcsFullIn.lastIndexOf('/')), //Elln
      sId = sName.substring(9), //Elln01alfa_1
      aPages

    aPages = JSON.parse(moFs.readFileSync('../aPages.json'))
    s =
      '<!DOCTYPE html>\n' +
      '<html>\n' +
      '<head>\n' +
      '  <meta charset="utf-8">\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '  <title>Mcs.' + sName + '-(0-1-0.' + moUtil.fDateYMD() + ') ' + sIndexIn + '</title>\n' +
      '  <meta name="keywords" content="' + sName + ', word' +sLag +', ModelConceptSensorial, McsHitp, Synagonism">\n' +
      '  <link rel="stylesheet" href="../../Mcsmgr/mHitp.css">\n' +
      '</head>\n' +
      '\n' +
      '<body>\n' +
      '<header id="idHeader">\n' +
      '  <p></p>\n' +
      '  <h1 id="idHeaderH1">' + sName + ' - ' + sIndexIn + '\n' +
      '    <br>senso-concept-Mcs\n' +
      '    </h1>\n' +
      '  <p id="idHeadercrd">McsHitp-creation:: {' + moUtil.fDateYMD() + '}\n' +
      '    <a class="clsHide" href="#idHeadercrd"></a></p>\n' +
      '</header>\n' +
      '\n' +
      '<section id="idOverview">\n' +
      '  <h1 id="idOverviewH1">overview of ' + sName + '\n' +
      '    <a class="clsHide" href="#idOverviewH1"></a></h1>\n' +
      '  <p id="idDescription">description::\n' +
      '    <br>× quantity of words: \n' +
      '    <a class="clsHide" href="#idDescription"></a></p>\n' +
      '  <p id="idName">name::\n' +
      '    <br>* McsEngl.' + sName + ',\n' +
      '    <br>* McsEngl.wordary' + sLag +'\'' +sIndexIn +',\n' +
      '    <a class="clsHide" href="#idName"></a></p>\n' +
      '  <p id="idOverviewwtr">whole-tree-of-McsWrdidxElln01alfa::\n'
    if (sLag === 'Elln') {
      s = s +
      '    <br>* <a class="clsPreview" href="../../dirLag/McsLag000025.last.html#idOverview">wordaryElln</a>,\n'
    } else if (sLag === 'Engl') {
      s = s +
      '    <br>* <a class="clsPreview" href="../../dirLag/McsLag000024.last.html#idOverview">wordaryEngl</a>,\n'
    } else if (sLag === 'Zhon') {
      s = s +
      '    <br>* <a class="clsPreview" href="../../dirLag/McsLag000023.last.html#idOverview">wordaryZhon</a>,\n'
    } else {
      s = s +
      '    <br>* <a class="clsPreview" href="../../dirLag/McsLag00007.last.html#idLHmnmwrdIdx">wordary</a>,\n'
    }
    s = s +
      '    <a class="clsHide" href="#idOverviewwtr"></a></p>\n' +
      '</section>\n' +
      '\n' +
      '<section id="idWrd' + sId + '">\n' +
      '  <h1 id="idWrd' + sId + 'H1">' + sIndexIn + ' of ' + sName + '\n' +
      '    <a class="clsHide" href="#idWrd' + sId + 'H1"></a></h1>\n' +
      '</section>\n' +
      '\n' +
      '<section id="idMeta">\n' +
      '  <h1 id="idMetaH1">meta-info\n' +
      '    <a class="clsHide" href="#idMetaH1"></a></h1>\n' +
      '  <p id="idMetaCounter" class="clsCenter">this page was-visited\n' +
      '    <span class="clsColorRed">\n' +
      '    <script src="../../../dirPgm/dirCntr/counter.php?page=' + sName + '"></script>\n' +
      '    </span>\n' +
      '    times since {' + moUtil.fDateYMD() + '}</p>\n' +
      '  <!-- the content of page-path paragraph is displayed as it is on top of toc -->\n' +
      '  <p id="idMetaWebpage_path"><span class="clsB clsColorGreen">page-wholepath</span>:\n' +
      '    <a class="clsPreview" href="../../../#idOverview">synagonism.net</a> /\n' +
      '    <a class="clsPreview" href="../../Mcs000000.last.html#idOverview">worldviewSngo</a> /\n' +
      '    dirWrdidx /\n' +
      '    dirLag' + sLag + ' /\n' +
      '    ' + sName + '\n' +
      '    </p>\n' +
      '  <p id="idMetaP1">SEARCH::\n' +
      '    <br>· this page uses \'<span class="clsColorRed">locator-names</span>\', names that when you find them, you find the-LOCATION of the-concept they denote.\n' +
      '    <br>⊛ <strong>GLOBAL-SEARCH</strong>:\n' +
      '    <br>· clicking on <span class="clsColorGreenBg">the-green-BAR of a-page</span> you have access to the-global--locator-names of my-site.\n' +
      '    <br>· use the-prefix \'<span class="clsColorRed">word' + sLag + '</span>\' for <a class="clsPreview" href="../dirCor/McsCor000002.last.html#idOverview">senso-concepts</a> related to current concept \'' + sName + '\'.\n' +
      '    <br>⊛ <strong>LOCAL-SEARCH</strong>:\n' +
      '    <br>· TYPE <span class="clsColorRed">CTRL+F "McsLang.words-of-concept\'s-name"</span>, to go to the-LOCATION of the-concept.\n' +
      '    <br>· a-preview of the-description of a-global-name makes reading fast.\n' +
      '    <a class="clsHide" href="#idMetaP1"></a></p>\n' +
      '  <p id="idFooterP1">footer::\n' +
      '    <br>• author: <a class="clsPreview" href="../../dirHmn/McsHmn000003.last.html#idOverview">Kaseluris.Nikos.1959</a>\n' +
      '    <br>• email:\n' +
      '    <br> &nbsp;<img src="../../../dirRsc/dirImg/mail.png">\n' +
      '    <br>• edit on github: https://github.com/synagonism/McsWorld/blob/master/dirMcsh/' + sWiMcsFullIn + ',\n' +
      '    <br>• comments on <a class="clsPreview" href="../../dirLag/McsLag000015.last.html#idOverview">Disqus</a>,\n' +
      '    <br>• twitter: <a href="https://twitter.com/synagonism">@synagonism</a>,\n' +
      '    <a class="clsHide" href="#idFooterP1"></a></p>\n' +
      '  <p id="idMetaVersion">webpage-versions::\n' +
      '    <br>• version.last.dynamic: <a lass="clsPreview" href="' + sFile + '">' + sFile + '</a>,\n' +
      '    <br>• version.draft.creation: ' + sName + '.0-1-0.' + moUtil.fDateYMD() + '.last.html,\n' +
      '    <a class="clsHide" href="#idMetaVersion"></a></p>\n' +
      '</section>\n' +
      '\n' +
      '<section id="idSupport">\n' +
      '  <h1 id="idSupportH1">support (<a class="clsPreview" href="../../../#idSupport">link</a>)</h1>\n' +
      '  <p></p>\n' +
      '  <!--                              -->\n' +
      '</section>\n' +
      '\n' +
      '<script type="module">\n' +
      '  import * as oHitp from \'../../Mcsmgr/mHitp.js\'' +
      '</script>\n' +
      '</body>\n' +
      '</html>'
    moFs.writeFileSync(sWiMcsFullIn, s)
    moFs.writeFileSync('../dirPgm/dirCntr/dirCntrfiles/' + sName + '.txt', '1')
    //
    if (!moUtil.fAArrayIncludes(aPages, sName+'.txt')){
      aPages.push([sName+'.txt', sIndexIn])
      moUtil.fAArraySort(aPages)
      moUtil.fWriteJsonArray('../aPages.json', aPages)
      oSetFileUp.add('../aPages.json')
    } else {
      console.log('aPages already includes ' + sName+'.txt')
    }
    oSetFileUp.add('../dirPgm/dirCntr/dirCntrfiles/' + sName + '.txt')
  }

  /**
   * DOING: it stores a-word-info in a-Wrdidx-file
   * INPUT:
   *    - sWrdidxMcsFullIn: dirWrdinf/dirLagElln/McsWrdidxElln02vita.last.html
   *    - aWrdinfIn: ['βουνό-το','  p id="idWrdEllnvunó-to"><span...']
   */
  function fStoreWordinfo(sWrdidxMcsFullIn, aWrdinfIn) {
    //1. reads the-file
    //2. stores new-array
    //3. sorts the-array
    //4. stores the-new file
    let
      aFile = moFs.readFileSync(sWrdidxMcsFullIn).toString().split('\n'),
      aFile1 = [], //the-lines BEFORE words
      aWords = [], //[['βουνό-το','  p id="idWrdEllnvunó-to"><span...']]
      aFile2 = [], //the-lines of words: ['  p id="idWrdEllnvunó-to"><span...']
      aFile3 = [], //the-lines AFTER words
      sName, //name of word existed
      aIdExisted = [],
      bSameword = false,
      n,
      n2,//word lines
      n3 //meta lines

    for (n=0; n<aFile.length; n++) {
      if (aFile[n].indexOf('id="idWrd') === -1) {
        aFile1.push(aFile[n])
      } else {
        aFile1.push(aFile[n])   //<section id="idWrd
        aFile1.push(aFile[n+1]) //  <h1 id="idWrd
        aFile1.push(aFile[n+2]) //    <a class="clsHide
        if (aFile[n+3].indexOf('</section>') === 0) {
          n2 = 0  // no words added yet
          n3 = n + 3
        } else n2 = n + 3
        break
      }
    }

    if (n2 !== 0) {
      let
        sId,
        sHtml
      for (n=n2; n<aFile.length; n++) {
        if (aFile[n].indexOf('<p id="idWrd') !== -1) {
          //<p id="idWrdEllnálas-to"><span class="clsColorRed">άλας-το/álas-to/
          sName = aFile[n].substring(aFile[n].indexOf('ColorRed')+10, aFile[n].indexOf('/'))
          sId = aFile[n].substring(aFile[n].indexOf('"')+1, aFile[n].indexOf('">'))
          aIdExisted.push(sId)
          sHtml = aFile[n]
          if (sName === aWrdinfIn[0]) {
            bSameword = true
            console.log(sName + ' is-stored ALREADY: did nothing => ' +sWrdidxMcsFullIn.substring(30))
            break
          } else if (sName.toLowerCase() == aWrdinfIn[0].toLowerCase())
            console.log('ID COLLISION - SAME NAME: ' + sName +' => ' +sWrdidxMcsFullIn.substring(30))
        } else if (aFile[n].indexOf('</section>') === 0) {
          n3 = n 
          break
        } else if (aFile[n].indexOf('    <a class="clsHide') === 0) {
          sHtml = sHtml +'\n' + aFile[n]
          aWords.push([sName, sHtml])
        } else {
          sHtml = sHtml +'\n' + aFile[n]
        }
      }
    }

    //IF new word not-included, add it
    if (!bSameword) {
      for (n=n3; n<aFile.length; n++) {
        aFile3.push(aFile[n])
      }

      //add new word-info
      aWords.push(aWrdinfIn)
      aWords.sort()
      

      //create html of words
      for (let aElm of aWords) {
        aFile2.push(aElm[1])
      }

      //set the-quantity of names
      aFile1[24] = '    <br>× quantity of words: ' + aWords.length
      //set version ONCE per process
      if (!oSetFileUp.has(sWrdidxMcsFullIn)) {
        //  <title>Mcs.McsWrdidxElln01alfa_2-(0-1-0.2022-02-26) α..αμ</title>
        let
          s5 = aFile1[5],
          sT1 = s5.substring(0, s5.indexOf('(')+1),
          sT2 = s5.substring(s5.indexOf('(')+1, s5.indexOf(')')-11), 
          sV = sT2.substring(sT2.indexOf('-')+1, sT2.lastIndexOf('-')),
          sT3 = s5.substring(s5.indexOf(')'))
        sT2 = sT2.substring(0, sT2.indexOf('-')+1) +
          (Number(sV) + 1) +
          '-0.' + moUtil.fDateYMD()
        aFile1[5] = sT1 + sT2 + sT3
      }

      //write file with new word
      let s = ''
      for (n=0; n<aFile1.length; n++) {
        s = s + aFile1[n] + '\n'
      }
      for (n=0; n<aFile2.length; n++) {
        s = s + aFile2[n] + '\n'
      }
      s = s + aFile3[0]
      for (n=1; n<aFile3.length; n++) {
        s = s + '\n' + aFile3[n]
      }
      moFs.writeFileSync(sWrdidxMcsFullIn, s)
      oSetFileUp.add(sWrdidxMcsFullIn)

      //add the-file for name-index
      oSetFileIndex.add(sWrdidxMcsFullIn)
    }

    //check of Id collision
    let sIdNew = aWrdinfIn[1].substring(aWrdinfIn[1].indexOf('"')+1, aWrdinfIn[1].indexOf('">'))
    if (aIdExisted.includes(sIdNew) && !bSameword)
      console.log('ID COLLISION: ' + sIdNew +' => ' +sWrdidxMcsFullIn.substring(30))
  }

  //name-index the-files
  aIndex = Array.from(oSetFileIndex)
  if (aIndex.length > 0)
    fNamidx(aIndex)

  // write the-indexed-files to upload
  aSftp = JSON.parse(moFs.readFileSync('sftp.json'))
  for (let sFile of aSftp) {
     oSetFileUp.add(sFile)
  }
  //sftp the-files
  aSftp = Array.from(oSetFileUp)
  aSftp.sort()
  if (aSftp.length > 0) {
    moUtil.fWriteJsonArray('sftp.json', aSftp)
    fSftp()
  }
}
fWrdidx(aWordsIn, sMethod)

/**
 * DOING: it creates an-array with word-info
 * INPUT:
 *  - sWordIn = 'ξαδέρφη-η/ksadhérfi-i/'
 *  - sMethodIn = caseEllnMnG2XiT2SeuNucF2Bo
 * OUTPUT: ["ξαδέρφη-η","  <p id="idWrdEllnksadhe9rfi-i"><span class="clsColorRed">ξαδέρφη-η/ksadhérfi-i/..."]
 */
function fCreateWordinfo(sWordIn, sMethodIn) {
  let
    aWordinfo = [],
    sWord = sWordIn.substring(0, sWordIn.indexOf('/')), //ξαδέρφη-η
    sPhonema = sWordIn.substring(sWordIn.indexOf('/')+1, sWordIn.length-1), //ksadhérfi-i
    sPhonemaPreview = moLagUtil.fPhonemaTonosReplace(sPhonema), //no tonos to have previews
    sMethod = sMethodIn,
    sLag = sMethod.substring(4, 8), //Elln
    sInfo,
    oCase

  aWordinfo[0] = sWord
  sInfo = '  <p id="idWrd' + sLag + sPhonemaPreview + '">' +
    '<span class="clsColorRed">' + sWordIn + '</span>::\n' +
    '    <br>* McsEngl.word' + sLag + '.' + sWordIn + '@word' + sLag + ',\n' +
    '    <br>* Mcs' + sLag + './' + sPhonema + '/' + sWord + '@word' + sLag + ',\n'

  oCase = moLagElln.fFindCaseinfoElln(sWordIn, sMethod)
  //console.log(oCase)
  /*{
    McsElln1: '.λέξηΕλλν.ξαδέρφη-η/ksadhérfi-i/@wordElln,',
    McsElln2: '.ουσιαστικό.ξαδέρφη-η/ksadhérfi-i/@wordElln,',
    sinNom: 'ξαδέρφη/ksadhérfi/',
    sinGen: 'ξαδέρφης/ksadhérfis/',
    sinAcc: 'ξαδέρφη/ksadhérfi/',
    sinVoc: 'ξαδέρφη/ksadhérfi/',
    pluNom: 'ξαδέρφες/ksadhérfes/|ξαδερφάδες/ksadherfádhes/',
    pluGen: 'ξαδερφάδων/ksadherfádhon/',
    pluAcc: 'ξαδέρφες/ksadhérfes/|ξαδερφάδες/ksadherfádhes/',
    pluVoc: 'ξαδέρφες/ksadhérfes/|ξαδερφάδες/ksadherfádhes/',
    Baseform: 'ξαδέρφη',
    Basespch: '/ksadhérfi/',
    functionality: 'μορφή',
    pos: 'ουσιαστικό',
    gender: 'θηλυκό',
    method: 'caseEllnMnG2XiT2SeuNucF2Bo-πτωτΕλλνΜνΓ2ΚιΤ2ΣιαΝαμΦ2Λο',
    members: 'ξαδέρφη/ksadhérfi/-ξαδέρφης/ksadhérfis/-ξαδέρφη/ksadhérfi/-ξαδέρφη/ksadhérfi/-ξαδέρφες/ksadhérfes/|ξαδερφάδες/ksadherfádhes/-ξαδερφάδων/ksadherfádhon/-ξαδέρφες/ksadhérfes/|ξαδερφάδες/ksadherfádhes/-ξαδέρφες/ksadhérfes/|ξαδερφάδες/ksadherfádhes/'
  }*/
  if (sLag === 'Elln') {
    sInfo = sInfo +
      '    <br>* McsElln' + oCase.McsElln1 + '\n' +
      '    <br>* McsElln' + oCase.McsElln2 + '\n'
    let
      aMember = [],
      oSetMember = new Set,
      sElm,
      sMember
    //ενικός-ονομαστική
    if (oCase.sinNom != '∅') {
      oSetMember.add(oCase.sinNom)
      sMember = oCase.sinNom + '!~ονομ-ενικ'
      if (oCase.sinGen.indexOf(oCase.sinNom) != -1)
        sMember = sMember + '|γενι-ενικ'
      if (oCase.sinAcc.indexOf(oCase.sinNom) != -1)
        sMember = sMember + '|αιτι-ενικ'
      if (oCase.sinVoc.indexOf(oCase.sinNom) != -1)
        sMember = sMember + '|κλητ-ενικ'
      if (oCase.pluNom.indexOf(oCase.sinNom) != -1)
        sMember = sMember + '|ονομ-πληθ'
      if (oCase.pluGen.indexOf(oCase.sinNom) != -1)
        sMember = sMember + '|γενι-πληθ'
      if (oCase.pluAcc.indexOf(oCase.sinNom) != -1)
        sMember = sMember + '|αιτι-πληθ'
      if (oCase.pluVoc.indexOf(oCase.sinNom) != -1)
        sMember = sMember + '|κλητ-πληθ'
      sInfo = sInfo + '    <br>* McsElln.' + sMember + ':' + sWord + '@wordElln,\n'
    }
    //ενικός-γενική
    if (oCase.sinGen != '∅') {
      if (oCase.sinGen.indexOf('|') === -1) {
        // if not stored
        if (!oSetMember.has(oCase.sinGen)) {
          oSetMember.add(oCase.sinGen)
          sMember = oCase.sinGen + '!~γενι-ενικ'
          if (oCase.sinAcc.indexOf(oCase.sinGen) != -1)
            sMember = sMember + '|αιτι-ενικ'
          if (oCase.sinVoc.indexOf(oCase.sinGen) != -1)
            sMember = sMember + '|κλητ-ενικ'
          if (oCase.pluNom.indexOf(oCase.sinGen) != -1)
            sMember = sMember + '|ονομ-πληθ'
          if (oCase.pluGen.indexOf(oCase.sinGen) != -1)
            sMember = sMember + '|γενι-πληθ'
          if (oCase.pluAcc.indexOf(oCase.sinGen) != -1)
            sMember = sMember + '|αιτι-πληθ'
          if (oCase.pluVoc.indexOf(oCase.sinGen) != -1)
            sMember = sMember + '|κλητ-πληθ'
          sInfo = sInfo + '    <br>* McsElln.' + sMember + ':' + sWord + '@wordElln,\n'
        }
      } else {
        aMember = oCase.sinGen.split('|')
        for (sElm of aMember) {
          if (!oSetMember.has(sElm)) {
            oSetMember.add(sElm)
            sMember = sElm + '!~γενι-ενικ'
            if (oCase.sinAcc.indexOf(sElm) != -1)
              sMember = sMember + '|αιτι-ενικ'
            if (oCase.sinVoc.indexOf(sElm) != -1)
              sMember = sMember + '|κλητ-ενικ'
            if (oCase.pluNom.indexOf(sElm) != -1)
              sMember = sMember + '|ονομ-πληθ'
            if (oCase.pluGen.indexOf(sElm) != -1)
              sMember = sMember + '|γενι-πληθ'
            if (oCase.pluAcc.indexOf(sElm) != -1)
              sMember = sMember + '|αιτι-πληθ'
            if (oCase.pluVoc.indexOf(sElm) != -1)
              sMember = sMember + '|κλητ-πληθ'
            sInfo = sInfo + '    <br>* McsElln.' + sMember + ':' + sWord + '@wordElln,\n'
          }
        }
      }
    }
    //ενικός-αιτιατική
    if (oCase.sinAcc != '∅') {
      if (oCase.sinAcc.indexOf('|') === -1) {
        // if not stored
        if (!oSetMember.has(oCase.sinAcc)) {
          oSetMember.add(oCase.sinAcc)
          sMember = oCase.sinAcc + '!~αιτι-ενικ'
          if (oCase.sinVoc.indexOf(oCase.sinAcc) != -1)
            sMember = sMember + '|κλητ-ενικ'
          if (oCase.pluNom.indexOf(oCase.sinAcc) != -1)
            sMember = sMember + '|ονομ-πληθ'
          if (oCase.pluGen.indexOf(oCase.sinAcc) != -1)
            sMember = sMember + '|γενι-πληθ'
          if (oCase.pluAcc.indexOf(oCase.sinAcc) != -1)
            sMember = sMember + '|αιτι-πληθ'
          if (oCase.pluVoc.indexOf(oCase.sinAcc) != -1)
            sMember = sMember + '|κλητ-πληθ'
          sInfo = sInfo + '    <br>* McsElln.' + sMember + ':' + sWord + '@wordElln,\n'
        }
      } else {
        aMember = oCase.sinAcc.split('|')
        for (sElm of aMember) {
          if (!oSetMember.has(sElm)) {
            oSetMember.add(sElm)
            sMember = sElm + '!~αιτι-ενικ'
            if (oCase.sinVoc.indexOf(sElm) != -1)
              sMember = sMember + '|κλητ-ενικ'
            if (oCase.pluNom.indexOf(sElm) != -1)
              sMember = sMember + '|ονομ-πληθ'
            if (oCase.pluGen.indexOf(sElm) != -1)
              sMember = sMember + '|γενι-πληθ'
            if (oCase.pluAcc.indexOf(sElm) != -1)
              sMember = sMember + '|αιτι-πληθ'
            if (oCase.pluVoc.indexOf(sElm) != -1)
              sMember = sMember + '|κλητ-πληθ'
            sInfo = sInfo + '    <br>* McsElln.' + sMember + ':' + sWord + '@wordElln,\n'
          }
        }
      }
    }
    //ενικός-κλητική
    if (oCase.sinVoc != '∅') {
      if (oCase.sinVoc.indexOf('|') === -1) {
        // if not stored
        if (!oSetMember.has(oCase.sinVoc)) {
          oSetMember.add(oCase.sinVoc)
          sMember = oCase.sinVoc + '!~κλητ-ενικ'
          if (oCase.pluNom.indexOf(oCase.sinVoc) != -1)
            sMember = sMember + '|ονομ-πληθ'
          if (oCase.pluGen.indexOf(oCase.sinVoc) != -1)
            sMember = sMember + '|γενι-πληθ'
          if (oCase.pluAcc.indexOf(oCase.sinVoc) != -1)
            sMember = sMember + '|αιτι-πληθ'
          if (oCase.pluVoc.indexOf(oCase.sinVoc) != -1)
            sMember = sMember + '|κλητ-πληθ'
          sInfo = sInfo + '    <br>* McsElln.' + sMember + ':' + sWord + '@wordElln,\n'
        }
      } else {
        aMember = oCase.sinVoc.split('|')
        for (sElm of aMember) {
          if (!oSetMember.has(sElm)) {
            oSetMember.add(sElm)
            sMember = sElm + '!~κλητ-ενικ'
            if (oCase.pluNom.indexOf(sElm) != -1)
              sMember = sMember + '|ονομ-πληθ'
            if (oCase.pluGen.indexOf(sElm) != -1)
              sMember = sMember + '|γενι-πληθ'
            if (oCase.pluAcc.indexOf(sElm) != -1)
              sMember = sMember + '|αιτι-πληθ'
            if (oCase.pluVoc.indexOf(sElm) != -1)
              sMember = sMember + '|κλητ-πληθ'
            sInfo = sInfo + '    <br>* McsElln.' + sMember + ':' + sWord + '@wordElln,\n'
          }
        }
      }
    }
    //πληθυντικός-ονομαστική
    if (oCase.pluNom != '∅') {
      if (oCase.pluNom.indexOf('|') === -1) {
        // if not stored
        if (!oSetMember.has(oCase.pluNom)) {
          oSetMember.add(oCase.pluNom)
          sMember = oCase.pluNom + '!~ονομ-πληθ'
          if (oCase.pluGen.indexOf(oCase.pluNom) != -1)
            sMember = sMember + '|γενι-πληθ'
          if (oCase.pluAcc.indexOf(oCase.pluNom) != -1)
            sMember = sMember + '|αιτι-πληθ'
          if (oCase.pluVoc.indexOf(oCase.pluNom) != -1)
            sMember = sMember + '|κλητ-πληθ'
          sInfo = sInfo + '    <br>* McsElln.' + sMember + ':' + sWord + '@wordElln,\n'
        }
      } else {
        aMember = oCase.pluNom.split('|')
        for (sElm of aMember) {
          if (!oSetMember.has(sElm)) {
            oSetMember.add(sElm)
            sMember = sElm + '!~ονομ-πληθ'
            if (oCase.pluGen.indexOf(sElm) != -1)
              sMember = sMember + '|γενι-πληθ'
            if (oCase.pluAcc.indexOf(sElm) != -1)
              sMember = sMember + '|αιτι-πληθ'
            if (oCase.pluVoc.indexOf(sElm) != -1)
              sMember = sMember + '|κλητ-πληθ'
            sInfo = sInfo + '    <br>* McsElln.' + sMember + ':' + sWord + '@wordElln,\n'
          }
        }
      }
    }
    //πληθυντικός-γενική
    if (oCase.pluGen != '∅') {
      if (oCase.pluGen.indexOf('|') === -1) {
        // if not stored
        if (!oSetMember.has(oCase.pluGen)) {
          oSetMember.add(oCase.pluGen)
          sMember = oCase.pluGen + '!~γενι-πληθ'
          if (oCase.pluAcc.indexOf(oCase.pluGen) != -1)
            sMember = sMember + '|αιτι-πληθ'
          if (oCase.pluVoc.indexOf(oCase.pluGen) != -1)
            sMember = sMember + '|κλητ-πληθ'
          sInfo = sInfo + '    <br>* McsElln.' + sMember + ':' + sWord + '@wordElln,\n'
        }
      } else {
        aMember = oCase.pluGen.split('|')
        for (sElm of aMember) {
          if (!oSetMember.has(sElm)) {
            oSetMember.add(sElm)
            sMember = sElm + '!~γενι-πληθ'
            if (oCase.pluAcc.indexOf(sElm) != -1)
              sMember = sMember + '|αιτι-πληθ'
            if (oCase.pluVoc.indexOf(sElm) != -1)
              sMember = sMember + '|κλητ-πληθ'
            sInfo = sInfo + '    <br>* McsElln.' + sMember + ':' + sWord + '@wordElln,\n'
          }
        }
      }
    }
    //πληθυντικός-αιτιατική
    if (oCase.pluAcc != '∅') {
      if (oCase.pluAcc.indexOf('|') === -1) {
        // if not stored
        if (!oSetMember.has(oCase.pluAcc)) {
          oSetMember.add(oCase.pluAcc)
          sMember = oCase.pluAcc + '!~αιτι-πληθ'
          if (oCase.pluVoc.indexOf(oCase.pluAcc) != -1)
            sMember = sMember + '|κλητ-πληθ'
          sInfo = sInfo + '    <br>* McsElln.' + sMember + ':' + sWord + '@wordElln,\n'
        }
      } else {
        aMember = oCase.pluAcc.split('|')
        for (sElm of aMember) {
          if (!oSetMember.has(sElm)) {
            oSetMember.add(sElm)
            sMember = sElm + '!~αιτι-πληθ'
            if (oCase.pluVoc.indexOf(sElm) != -1)
              sMember = sMember + '|κλητ-πληθ'
            sInfo = sInfo + '    <br>* McsElln.' + sMember + ':' + sWord + '@wordElln,\n'
          }
        }
      }
    }
    //πληθυντικός-κλητική
    if (oCase.pluVoc != '∅') {
      if (oCase.pluVoc.indexOf('|') === -1) {
        // if not stored
        if (!oSetMember.has(oCase.pluVoc)) {
          oSetMember.add(oCase.pluVoc)
          sMember = oCase.pluVoc + '!~κλητ-πληθ'
          sInfo = sInfo + '    <br>* McsElln.' + sMember + ':' + sWord + '@wordElln,\n'
        }
      } else {
        aMember = oCase.pluVoc.split('|')
        for (sElm of aMember) {
          if (!oSetMember.has(sElm)) {
            oSetMember.add(sElm)
            sMember = sElm + '!~κλητ-πληθ'
            sInfo = sInfo + '    <br>* McsElln.' + sMember + ':' + sWord + '@wordElln,\n'
          }
        }
      }
    }

  }

  sInfo = sInfo +
    '    <br>\n' +
    '    <br>× base-form: ' + oCase.Baseform + '\n' +
    '    <br>× base-pronunciation: ' + oCase.Basespch + '\n' +
    '    <br>× functionality: ' + oCase.functionality + '\n' +
    '    <br>× pos: ' + oCase.pos + '\n' +
    '    <br>× gender: ' + oCase.gender + '\n' +
    '    <br>× members: ' + oCase.members + '\n' +
    '    <br>× inflection-method: <a class="clsPreview" href="../../dirLag/McsLag000020.last.html#idLEllncase' 
            + oCase.method.substring(8, oCase.method.indexOf('-')) + '">' + oCase.method + '</a>\n' +
    '    <br>× el.wiktionary.org: <a href="https://el.wiktionary.org/wiki/' + oCase.Baseform + '">' + oCase.Baseform + '</a>\n' +
    '    <a class="clsHide" href="#idWrd' +sLag + sPhonemaPreview + '"></a></p>'

  aWordinfo[1] = sInfo
  return aWordinfo
}

/**
 * DOING: creates object {Wrdidx: index} from [[Wrdidx,idx,quantity]]
 * INPUT: aIn = [['McsWrdidxEngl01ei','A',1234]]
 * OUTPUT: {McsWrdidxEngl01ei:'A'}
 */
function fCreateOWrdidxMcs_Index(aIn) {
  let
    n,
    oOut = {}
  for (n = 0; n < aIn.length; n++) {
    if (!aIn[n][1].startsWith(';')) {
      // remove non index info
      oOut[aIn[n][0]] = aIn[n][1]
    }
  }
  return oOut
}

/**
 * DOING: it finds the-Wrdidx-html-file to store a-word
 * INPUT:
 *  - sWordIn: 'νύφη/nífi/'
 *  - sLagIn: 'Elln'
 *  - aWrdidxIdxIn: [['McsWrdidxX','X']]
 * OUTPUT: ['McsWrdidxEngl18ar.last.html', 'R|r']
 */
function fFindWrdidxMcs(sWordIn, sLagIn, aWrdidxIdxIn) {
  let
    aWrdidxMcs_Idx, // the-output WrdidxMcs-index info
    bRest = true,
    // if first-char of name NOT in an-index in the-lag, then it is a-charREST in this lag
    sCharWord,    // the-first char of name
    sIndex,       // the-chars-of-index in the-Wrdidx-file
    sIdxFrom,
    sIdxTo,
    sWrdidx,      // name of Wrdidx-file on which to store the-word
    sWrdidxOut,
    nCharWord,
    nIdxFrom,
    nIdxTo,
    oWrdidxMcs_Idx,
    sWrdidxRefFull,
    aRef

  // FIND Wrdidx-file
  // choose root-char or rest
  sCharWord = sWordIn[0].substring(0,1)
  oWrdidxMcs_Idx = fCreateOWrdidxMcs_Index(aWrdidxIdxIn)

  for (sWrdidx in oWrdidxMcs_Idx) {
    if (sWrdidx.startsWith('McsWrdidx'+sLagIn)) {
      sIndex = oWrdidxMcs_Idx[sWrdidx]

      if (sIndex.indexOf('..') < 0) {
        // index is a-set of chars 'B|b|'
        if (sIndex.indexOf(sCharWord) >= 0) {
          // found Wrdidx-file
          bRest = false 
          sWrdidxOut = sWrdidx
          aWrdidxMcs_Idx = [sWrdidxOut, sIndex]
          break
        }
      } else {
        // index is a-sequence of chars 'C..D' or "26000..27000" or "αμ..β"
        // we are on a-reference or Chinese root reference
        let a = sIndex.split('..')
        sIdxFrom = a[0]
        sIdxTo = a[1]
        //IF indexes more than one, compare word, ELSE codepoints and first-word-char
        if (sIdxFrom.length > 1 || sIdxTo.length > 1) {
          if (sWordIn >= sIdxFrom && sWordIn < sIdxTo) {
            // found Wrdidx-file
            bRest = false 
            sWrdidxOut = sWrdidx
            aWrdidxMcs_Idx = [sWrdidxOut, sIndex]
            break
          }
        } else {
          //compare codepoints
          nCharWord = sCharWord.codePointAt()
          // if srch-char is a-supplement with surrogates (high 55296–56319), find it
          if (nCharWord >= 55296 && nCharWord <= 56319) {
            let sSupplement = String.fromCodePoint(sWordIn[0].charAt(0).charCodeAt(0),
                                                   sWordIn[0].charAt(1).charCodeAt(0))
            nCharWord = sSupplement.codePointAt()
          }
          if (!Number.isInteger(Number(sIdxFrom))) {
            // it is char
            nIdxFrom = sIdxFrom.codePointAt()
          } else {
            // it is number
            nIdxFrom = Number(sIdxFrom)
          }
          if (!Number.isInteger(Number(sIdxTo))) {
            nIdxTo = sIdxTo.codePointAt()
          } else {
            nIdxTo = Number(sIdxTo)
          }
          //console.log(nIdxFrom+', '+nIdxTo)
          if (nCharWord >= nIdxFrom && nCharWord < nIdxTo) {
            // found Wrdidx-file
            bRest = false 
            sWrdidxOut = sWrdidx
            aWrdidxMcs_Idx = [sWrdidxOut, sIndex]
            break
          }
        }
      }
    }
  }
  if (bRest) {
    sWrdidxOut = 'McsWrdidx' + sLagIn + '00'
    aWrdidxMcs_Idx = [sWrdidxOut, '']
  }

  if (!sWrdidxOut.endsWith('_0')) {
    sWrdidxOut = sWrdidxOut +'.last.html'
    aWrdidxMcs_Idx = [sWrdidxOut, sIndex]
    //console.log(aWrdidxMcs_Idx)
    return aWrdidxMcs_Idx 
  } else {
    sWrdidxRefFull = 'dirWrdidx/dirLag'+sLagIn +'/' +sWrdidxOut +'.json'
    aRef = JSON.parse(moFs.readFileSync(sWrdidxRefFull))
    return fFindWrdidxMcs(sWordIn, sLagIn, aRef)
  }
}

export {
  fCreateWordinfo,
  fWrdidx
}