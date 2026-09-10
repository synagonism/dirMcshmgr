/*
 * mLagElln.mjs - module of Greek-language.
 * The MIT License (MIT)
 *
 * Copyright (c) 2022 Kaseluris.Nikos.1959 (synagonism)
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
 */

import moFs from 'fs'
import * as moLagUtil from './mLagUtil.js'
//import fetch from 'node-fetch'

const
  // contains the-versions of mLagElln.js
  aVersion = [
    'mLagElln.js.0-5-0.2022-03-12: fFindCaseinfoElln-(δύσχρηστο-μέλος)',
    'mLagElln.js.0-4-1.2022-03-08: fFindCaseinfoElln-sinizisi',
    'mLagElln.js.0-4-0.2022-03-07: fFindCaseinfoElln-sinizisi',
    'mLagElln.js.0-3-0.2022-03-06: fFindCaseinfoElln',
    'mLagElln.js.0-2-1.2022-03-05: fFindCaseinfoElln',
    'mLagElln.js.0-2-0.2022-02-26: member-phonema',
    'mLagElln.js.0-1-0.2022-01-15: creation'
  ],
  sFileElln = 'dirLag/McshLag000020.last.html'

let
  aVerbEllnRegularNo = [],
  sMembers,
  oReadlines,
  oNextln,
  sLn

function fFindVerbEllnRegularNo () {
  oReadlines = new mfReadlines(sFileElln)
  while (oNextln = oReadlines.next()) {
    sLn = oNextln.toString()
    /*
    oOl = oDoc.getElementById('idLEnglvrbC1Spcdsn')
    for (let n = 0; n < aLi.length; n++) {
      let s = aLi[n].innerHTML
      if (s.indexOf('<strong>') >= 0)
        aVerbEllnRegularNo.push(s.substring(8, s.lastIndexOf('<')))
      else
        aVerbEllnRegularNo.push(s.substring(0, s.lastIndexOf(',')))
    }
    */
  }
}

/**
 * DOING: it finds info of a-Greek-case FROM example in dirLag/McshLag000020.last.html
 * INPUT:
 *  - sWordIn = ξαδέρφη-η/ksadhérfi-i/, Ανθοχώρι-το/anthohóri-to-s/(sinizisi on members)
 *  - sMethodIn = caseEllnMnG2XiT2SeuNucF2Bo
 * OUPUT: an-object
 */
function fFindCaseinfoElln (sWordIn, sMethodIn) {
  let
    oCase = {}, //the output info
    aInfo = [],
    aMcs,
    n,
    sStemM, //stem nominativeSingular of method
    sStemMRem, //remove
    sStemMInc, //increase
    sStemMDec, //decrease
    sStemW, //stem nominativeSingular of word
    sStemWRem,
    sStemWInc,
    sStemWDec,
    sStemW3,
    sStemMx, //
    sSufxM,
    sSufxMx,
    sWord = sWordIn.substr(0, sWordIn.indexOf('-')), // ξαδέρφη
    sWordArti = sWordIn.substr(0, sWordIn.indexOf('/')), // ξαδέρφη-η
    sWordArtiPhnm = sWordIn.substr(sWordIn.indexOf('/')), // /ksadhérfi-i/
    sWordGS, //genitiveSingular
    sWordAS, //accusativeSingular
    sWordVS, //vocativeSingular
    sWordNP, //nominativePlural
    sWordGP, //genitivePlural
    sWordAP, //accusativePlurl
    sWordVP, //vocativePlural
    sWordX,
    bSinizisi
    
  if (sWordArtiPhnm.endsWith('-s/'))
    bSinizisi = true
  else
    bSinizisi = moLagUtil.fGreekwordHasSinizisi(sWordArtiPhnm)
  aMcs = moFs.readFileSync(sFileElln).toString().split('\n')

  //find the-index of method in McsLagElln
  n = aMcs.findIndex(function(sLn){
    return sLn.indexOf('"idLEllncase' +sMethodIn.substring(8) +'dsn"') > 1
  })
  //we found method
  sLn = aMcs[n+1] //<p>description::
  sLn = aMcs[n+2] //<br>× caseEllnMnG2Xi
  aInfo.push(sLn.substring(10))
  sLn = aMcs[n+3] //</p>
  sLn = aMcs[n+4] //<table class="clsTblBorderNo">
  sLn = aMcs[n+5] //<tr><td>η<td>νύφ-η
  aInfo.push(sLn.substring(sLn.lastIndexOf('>')+1))
  sLn = aMcs[n+6] //<tr><td>της<td>νύφ-ης
  aInfo.push(sLn.substring(sLn.lastIndexOf('>')+1))
  sLn = aMcs[n+7] //<tr><td>την<td>νύφ-η
  aInfo.push(sLn.substring(sLn.lastIndexOf('>')+1))
  sLn = aMcs[n+8] //<tr><td><td>νύφ-η
  aInfo.push(sLn.substring(sLn.lastIndexOf('>')+1))
  sLn = aMcs[n+9] //<tr><td>οι<td>νύφ-ες|νυφ-άδες
  aInfo.push(sLn.substring(sLn.lastIndexOf('>')+1))
  sLn = aMcs[n+10] //<tr><td>των<td>νυφ-άδων
  aInfo.push(sLn.substring(sLn.lastIndexOf('>')+1))
  sLn = aMcs[n+11] //<tr><td>τις<td>νύφ-ες|νυφ-άδες
  aInfo.push(sLn.substring(sLn.lastIndexOf('>')+1))
  sLn = aMcs[n+12] //<tr><td><td>νύφ-ες|νυφ-άδες
  aInfo.push(sLn.substring(sLn.lastIndexOf('>')+1))
  //console.log(aInfo)

  //find stems
  if (!sMethodIn.endsWith('Bns')) {
    sStemM = aInfo[1].substr(0, aInfo[1].indexOf('-'))
    sStemMRem = moLagUtil.fGreektonosRemove(sStemM)
    sStemMInc = moLagUtil.fGreektonosIncrease(sStemM, bSinizisi)
    sStemMDec = moLagUtil.fGreektonosDecrease(sStemM, bSinizisi)
    sSufxM = aInfo[1].substr(aInfo[1].lastIndexOf('-')+1)
  } else {
    // no singular
    sStemM = aInfo[5].substr(0, aInfo[5].indexOf('-'))
    sStemMRem = moLagUtil.fGreektonosRemove(sStemM)
    sStemMInc = moLagUtil.fGreektonosIncrease(sStemM, bSinizisi)
    sStemMDec = moLagUtil.fGreektonosDecrease(sStemM, bSinizisi)
    sSufxM = aInfo[5].substr(aInfo[5].lastIndexOf('-')+1)
  }
  sStemW = sWord.substr(0, sWord.length-sSufxM.length) //ξαδέρφ
  sStemWRem = moLagUtil.fGreektonosRemove(sStemW)
  sStemWInc = moLagUtil.fGreektonosIncrease(sStemW, bSinizisi)
  sStemWDec = moLagUtil.fGreektonosDecrease(sStemW, bSinizisi)
  //console.log(sStemWRem+', '+sStemWInc+', '+sStemWDec)

  //γενι-ενικ gs
  if (aInfo[2].indexOf('|') != -1) {
    //we have many forms
    const aExl = aInfo[2].split('|')
    sWordGS = fFindWordX(aExl[0]) 
    for (n=1; n<aExl.length; n++) {
      sWordGS = sWordGS +'|' +fFindWordX(aExl[n]) 
    }
  } else {
    sWordGS = fFindWordX(aInfo[2])
  }
  //console.log(sWordGS)

  /**
   * it returns a-member, given example method
   * INPUT: νότ-α, (νοτ-ών)
   */
  function fFindWordX(sMethexlIn) {
    if (sMethexlIn !== '∅') { //empty-set
      sStemMx = sMethexlIn.substr(0, sMethexlIn.indexOf('-'))
      sSufxMx = sMethexlIn.substr(sMethexlIn.indexOf('-')+1)
      //we do on wordIn, the-same function with methodX
      if (sStemMx === sStemM) sWordX = sStemW + sSufxMx
      else if (sStemMx === sStemMRem) sWordX = sStemWRem + sSufxMx
      else if (sStemMx === sStemMInc) sWordX = sStemWInc + sSufxMx
      else if (sStemMx === sStemMDec) sWordX = sStemWDec + sSufxMx
      //δύσχρηστο μέλος σε παρένθεση
      else if (sStemMx.substring(1) === sStemM) sWordX = '(' + sStemW + sSufxMx
      else if (sStemMx.substring(1) === sStemMRem) sWordX = '(' + sStemWRem + sSufxMx
      else if (sStemMx.substring(1) === sStemMInc) sWordX = '(' + sStemWInc + sSufxMx
      else if (sStemMx.substring(1) === sStemMDec) sWordX = '(' + sStemWDec + sSufxMx
      let sPhnm = moLagUtil.fGreekwordFindPhonema(sWordX, bSinizisi)
      if (sPhnm.indexOf('111') !== -1){
        //TODO: fix it from base-form
        console.log(sPhnm +'/' +sWordArtiPhnm)
      }
      sWordX = sWordX + sPhnm
      if (moLagUtil.fGreekwordHasSyllableOne(sWordX) == 1) {
        sWordX = moLagUtil.fGreektonosRemove(sWordX)
        sWordX = moLagUtil.fPhonemaTonosRemove(sWordX)
      }
    } else
      sWordX = '∅'
    return sWordX
  }
  
  oCase.McsElln1 = '.λέξηΕλλν.' + sWordIn +'@wordElln,'
  oCase.McsElln2 = '.ουσιαστικό.' + sWordIn +'@wordElln,'
  if (!sMethodIn.endsWith('Bns')) {
    oCase.sinNom = sWord + sWordArtiPhnm.substr(0, sWordArtiPhnm.indexOf('-')) + '/'
  } else {
    oCase.sinNom = '∅'
  }
  oCase.sinGen = sWordGS

  //αιτ-ενικ as
  if (aInfo[3].indexOf('|') != -1) {
    //we have many forms
    const aExl = aInfo[3].split('|')
    sWordAS = fFindWordX(aExl[0]) 
    for (n=1; n<aExl.length; n++) {
      sWordAS = sWordAS +'|' +fFindWordX(aExl[n]) 
    }
  } else {
    sWordAS = fFindWordX(aInfo[3])
  }
  oCase.sinAcc = sWordAS

  //κλητ-ενικ vs
  if (aInfo[4].indexOf('|') != -1) {
    //we have many forms
    const aExl = aInfo[4].split('|')
    sWordVS = fFindWordX(aExl[0]) 
    for (n=1; n<aExl.length; n++) {
      sWordVS = sWordVS +'|' +fFindWordX(aExl[n]) 
    }
  } else {
    sWordVS = fFindWordX(aInfo[4])
  }
  oCase.sinVoc = sWordVS

  //ονομ-πληθ np
  if (aInfo[5].indexOf('|') != -1) {
    //we have many forms
    const aExl = aInfo[5].split('|')
    sWordNP = fFindWordX(aExl[0]) 
    for (n=1; n<aExl.length; n++) {
      sWordNP = sWordNP +'|' +fFindWordX(aExl[n]) 
    }
  } else {
    sWordNP = fFindWordX(aInfo[5])
  }
  oCase.pluNom = sWordNP

  //γενι-πληθ gp
  if (aInfo[6].indexOf('|') != -1) {
    //we have many forms
    const aExl = aInfo[6].split('|')
    sWordGP = fFindWordX(aExl[0]) 
    for (n=1; n<aExl.length; n++) {
      sWordGP = sWordGP +'|' +fFindWordX(aExl[n]) 
    }
  } else {
    sWordGP = fFindWordX(aInfo[6])
  }
  oCase.pluGen = sWordGP

  //αιτ-πληθ ap
  if (aInfo[7].indexOf('|') != -1) {
    //we have many forms
    const aExl = aInfo[7].split('|')
    sWordAP = fFindWordX(aExl[0]) 
    for (n=1; n<aExl.length; n++) {
      sWordAP = sWordAP +'|' +fFindWordX(aExl[n]) 
    }
  } else {
    sWordAP = fFindWordX(aInfo[7])
  }
  oCase.pluAcc = sWordAP

  //κλητ-πληθ vp
  if (aInfo[8].indexOf('|') != -1) {
    //we have many forms
    const aExl = aInfo[8].split('|')
    sWordVP = fFindWordX(aExl[0]) 
    for (n=1; n<aExl.length; n++) {
      sWordVP = sWordVP +'|' +fFindWordX(aExl[n]) 
    }
  } else {
    sWordVP = fFindWordX(aInfo[8])
  }
  oCase.pluVoc = sWordVP

  oCase.Baseform = sWord
  oCase.Basespch = sWordArtiPhnm.substr(0, sWordArtiPhnm.indexOf('-')) + '/'
  oCase.functionality = 'μορφή'
  oCase.pos = 'ουσιαστικό'
  if (sWordArti.endsWith('-ο')) oCase.gender = 'αρσενικό'
  if (sWordArti.endsWith('-ο|η')) oCase.gender = 'αρσενικό|θηλυκό'
  if (sWordArti.endsWith('-η')) oCase.gender = 'θηλυκό'
  if (sWordArti.endsWith('-το')) oCase.gender = 'ουδέτερο'
  oCase.method = aInfo[0].substr(0, aInfo[0].indexOf(':'))
  oCase.members = oCase.sinNom + '-' +
                  oCase.sinGen + '-' +
                  oCase.sinAcc + '-' +
                  oCase.sinVoc + '-' +
                  oCase.pluNom + '-' +
                  oCase.pluGen + '-' +
                  oCase.pluAcc + '-' +
                  oCase.pluVoc
  //console.log(oCase)

  return oCase
}

/**
 * DOING: it finds the-members of a-Greek-adjective.
 */
function fFindAdjvmbrElln (sBaseIn, sMethodIn) {
  sMembers = sBaseIn
  return sMembers
}

/**
 * DOING: it finds the-members of a-Greek-verb.
 */
function fFindVerbmbrElln (sBaseIn, sMethodIn) {
  sMembers = sBaseIn
  return sMembers
}

export {
  aVerbEllnRegularNo,
  fFindCaseinfoElln
}
