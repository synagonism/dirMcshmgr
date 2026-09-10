/*
 * mLagElln.js - module of Greek-language for the-browser.
 * The MIT License (MIT)
 *
 * Copyright (c) 2022-2025 Kaseluris.Nikos.1959 (synagonism)
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

import * as omLagUtil from './mLagUtil.js'
import * as omMcsh from './mMcsh2.js'
//import fetch from 'node-fetch'

const
  // contains the-versions of mLagElln.js
  aVersion = [
    'mLagElln.js.0-4-3.2026-07-31: Elln_noun',
    'mLagElln.js.0-4-2.2026-07-21: Elln_noun',
    'mLagElln.js.0-4-1.2025-10-08: import mMcsh2.js',
    'mLagElln.js.0-4-0.2022-04-24: αθρίτιδα',
    'mLagElln.js.0-3-0.2022-04-18: το-παρόν',
    'mLagElln.js.0-2-0.2022-04-09: fFindVerbEllnRegularNo',
    'mLagElln.js.0-1-0.2022-04-06: creation'
  ],
  sFileElln = omMcsh.sPathSite + 'dirMcsh/dirLag/McshLag000020.last.html'

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
//fFindVerbEllnRegularNo()

/*
 * DOING: it finds the-inflection-method of wordIn
 * INPUT:  'αγάπη', 'η αγάπη', bSinizisi
 * OUTPUT: [methods]
 */
function fFindMethodNounElln (sWordIn, bSinizisiIn) {
  let
    sGender = '', //masc, femi, neut
    sWord,
    aOut = [],
    nSyllable = -1 //1=liyusa, 2=paraliyusa, 3=proparaliyusa

  if (sWordIn.startsWith('ο ')) {sGender = 'masc'; sWord = sWordIn.substring(2)}
  else if (sWordIn.startsWith('η ')) {sGender = 'femi'; sWord = sWordIn.substring(2)}
  else if (sWordIn.startsWith('το ')) {sGender = 'neut'; sWord = sWordIn.substring(3)}
  else  sWord = sWordIn

  if (bSinizisiIn)
    nSyllable = omLagUtil.fGreektonosFindSyllable(sWord, true)
  else
    nSyllable = omLagUtil.fGreektonosFindSyllable(sWord)

  // endsWith /a/
  if (sWord.endsWith('αρ'))
    aOut = ["Elln_nounMaG3XarT2SuNcF1Ba-ουδέτερο-αρ-παρ-ήπ-αρ-ατος-ατα-άτων"]
  else if (sWord.endsWith('άς'))
    aOut = [
      "Elln_nounMnG1XasT1SuNcF1Ba-αρσενικό-ας-οξυ-ψαρ-άς-ά-άδες-άδων",
      "Elln_nounMnG1XasT1SuNcF1Bnp-αρσενικό-ας-οξυ-ψαρ-άς-ά"]
  else if (sWord.endsWith('άδες'))
    aOut = ["Elln_nounMnG1XasT1SuNcF1Bns-αρσενικό-ας-οξυ-ψαρ-άδες-άδων"]
  else if (sWord.endsWith('πατέρας'))
    aOut = ["Elln_nounMnaG1XasT2SeuNucF2Ba-αρσενικό-ας-παρ-πατ-έρας-έρα|ρός-έρα|ερ-εράδες|έρες-εράδων|έρων"]
  else if (sWord.endsWith('κιας'))
    aOut = ["Elln_nounMnG1Xas2T2SuNuF1Ba-αρσενικό-ας-παρ-γιαλάκ-ιας-ια-ηδες-ηδων"]
  else if (sWord.endsWith('έας') && sGender !== 'neut')
    aOut = [
      "Elln_nounMnaG1XasT2SuNcF2Ba-αρσενικό-ας-παρ-αμφορ-έας-α|έως-είς-έων",
      "Elln_nounMnG1XasT2SuNuF1Ba-αρσενικό-ας-παρ-Αντρέ-ας-α-ηδες-ηδων",
      "Elln_nounMnG3XasT2SuNcF1Ba-ουδέτερο-ας-παρ-κρέ-ας-ατος-ατα-άτων"]
  else if (sWord.endsWith('ας') && nSyllable===2 && sGender==='neut')
    aOut = ["Elln_nounMnG3XasT2SuNcF1Ba-ουδέτερο-ας-παρ-κρέ-ας-ατος-ατα-άτων"]
  else if (sWord.endsWith('ας') && nSyllable===2 && sGender==='masc')
    aOut = [
      "Elln_nounMnG1XasT2SeNuF1Ba-αρσενικό-ας-παρ-αγών-ας-α-ες-ων",
      "Elln_nounMnG1XasT2SeNcF1Ba-αρσενικό-ας-παρ-ταμί-ας-α-ες-ών",
      "Elln_nounMnaG1XasT2SeNucF2Ba-αρσενικό-ας-παρ-μήν-ας-α|ός-ες-ών",
      "Elln_nounMnG1XasT2SuNcF1Ba-αρσενικό-ας-παρ-ρήγ-ας-α-άδες-άδων",
      "Elln_nounMnG1XasT2SeuNuF2Ba-αρσενικό-ας-παρ-αέρ-ας-α-ες|ηδες-ων|ηδων",
      "Elln_nounMnG1XasT2SuNucF2Ba-αρσενικό-ας-παρ-Γρίβ-ας-α-ηδες|αίοι-ηδων|αίων-ηδες|αίους"]
  else if (sWord.endsWith('ας') && nSyllable===2 )
    aOut = [
      "Elln_nounMnG1XasT2SeNuF1Ba-αρσενικό-ας-παρ-αγών-ας-α-ες-ων",
      "Elln_nounMnG1XasT2SeNcF1Ba-αρσενικό-ας-παρ-ταμί-ας-α-ες-ών",
      "Elln_nounMnaG1XasT2SeNucF2Ba-αρσενικό-ας-παρ-μήν-ας-α|ός-ες-ών",
      "Elln_nounMnG1XasT2SuNcF1Ba-αρσενικό-ας-παρ-ρήγ-ας-α-άδες-άδων",
      "Elln_nounMnG1XasT2SeuNuF2Ba-αρσενικό-ας-παρ-αέρ-ας-α-ες|ηδες-ων|ηδων",
      "Elln_nounMnG1XasT2SuNucF2Ba-αρσενικό-ας-παρ-Γρίβ-ας-α-ηδες|αίοι-ηδων|αίων-ηδες|αίους",
      "Elln_nounMnG3XasT2SuNcF1Ba-ουδέτερο-ας-παρ-κρέ-ας-ατος-ατα-άτων"]
  else if (sWord.endsWith('ας') && nSyllable===3 )
    aOut = [
      "Elln_nounMnG1XasT3SeNcF1Ba-αρσενικό-ας-προ-φύλακ-ας-α-ες-'ων",
      "Elln_nounMnG1XasT3SeNuF1Ba-αρσενικό-ας-προ-βαρύμαγκ-ας-α-ες-ων",
      "Elln_nounMnG1XasT3SuNcF1Ba-αρσενικό-ας-προ-Μπούκουρ-ας-α-αίοι-αίων-αίους",
      "Elln_nounMnG1XasT3SeuNucF2Ba-αρσενικό-ας-προ-τσέλιγκ-ας-α-ες|άδες-άδων"]

  else if (sWord.endsWith('ά'))
    aOut = [
      "Elln_nounMnG2XaT1SeNuF1Ba-θηλυκό-α-οξυ-καρδι-ά-άς-ές-ών",
      "Elln_nounMnG2XaT1SuNcF1Ba-θηλυκό-α-οξυ-μαμ-ά-άς-άδες-άδων",
      "Elln_nounMnG2XaT1SeuNucF2Ba-θηλυκό-α-οξυ-γιαγι-ά-άς-ές|άδες-άδων"]
  else if (sWord.endsWith('α') && nSyllable===2 && sGender==='femi')
    aOut = [
      "Elln_nounMnG2XaT2SeNuF1Ba-θηλυκό-α-παρ-ελπίδ-α-ας-ες-ων",
      "Elln_nounMnG2XaT2SeNcF1Ba-θηλυκό-α-παρ-σοφί-α-ας-ες-ών",
      "Elln_nounMnG2XaT2SeNcF1Bu6-θηλυκό-α-παρ-νότ-α-ας-ες-(ών)",
      "Elln_nounMnG2XaT2SeNcF1Bn6-θηλυκό-α-παρ-πείν-α-ας-ες"]
  else if (sWord.endsWith('α') && nSyllable===2 && sGender==='neut')
    aOut = [
      "Elln_nounMnG3XaT2SuNcF1Ba-ουδέτερο-α-παρ-κύμ-α-ατος-ατα-άτων"]
  else if (sWord.endsWith('α') && nSyllable===2 && sGender==='')
    aOut = [
      "Elln_nounMnG2XaT2SeNuF1Ba-θηλυκό-α-παρ-ελπίδ-α-ας-ες-ων",
      "Elln_nounMnG2XaT2SeNcF1Ba-θηλυκό-α-παρ-σοφί-α-ας-ες-ών",
      "Elln_nounMnG2XaT2SeNcF1Bu6-θηλυκό-α-παρ-νότ-α-ας-ες-(ών)",
      "Elln_nounMnG2XaT2SeNcF1Bn6-θηλυκό-α-παρ-πείν-α-ας-ες",
      "Elln_nounMnG3XaT2SuNcF1Ba-ουδέτερο-α-παρ-κύμ-α-ατος-ατα-άτων"]
  else if (sWord.endsWith('α') && nSyllable===3 && sGender==='femi')
    aOut = [
      "Elln_nounMnG2XaT3SeNuF1Ba-θηλυκό-α-προ-αρθρίτιδ-α-ας-ες-ων",
      "Elln_nounMnG2XaT3SeNcF1Ba-θηλυκό-α-προ-θάλασσ-α-ας-ες-ών",
      "Elln_nounMnG2XaT3SeNc2F1Ba-θηλυκό-α-προ-σάλπιγγ-α-ας-ες-'ων"]
  else if (sWord.endsWith('α') && nSyllable===3 && sGender==='neut')
    aOut = [
      "Elln_nounMnG3XaT3SuNcF1Ba-ουδέτερο-α-προ-όνομ-α-'ατος-'ατα-άτων"]
  else if (sWord.endsWith('α') && nSyllable===3 && sGender==='')
    aOut = [
      "Elln_nounMnG2XaT3SeNuF1Ba-θηλυκό-α-προ-αρθρίτιδ-α-ας-ες-ων",
      "Elln_nounMnG2XaT3SeNcF1Ba-θηλυκό-α-προ-θάλασσ-α-ας-ες-ών",
      "Elln_nounMnG2XaT3SeNc2F1Ba-θηλυκό-α-προ-σάλπιγγ-α-ας-ες-'ων",
      "Elln_nounMnG3XaT3SuNcF1Ba-ουδέτερο-α-προ-όνομ-α-'ατος-'ατα-άτων"]


  // endsWith /e/
  else if (sWord.endsWith('ές') && sGender==='masc' )
    aOut = ["Elln_nounMnG1XesT1SuNuF1Ba-αρσενικό-ες-οξυ-καφ-ές-έ-έδες-έδων"]
  else if (sWord.endsWith('ές') && sGender==='neut' )
    aOut = ["Elln_nounMaG3XesT1SeNuF1Ba-ουδέτερο-ες-οξυ-αιλουροειδ-ές-ούς-ή-ών"]
  else if (sWord.endsWith('ές') && sGender==='')
    aOut = [
      "Elln_nounMnG1XesT1SuNuF1Ba-αρσενικό-ες-οξυ-καφ-ές-έ-έδες-έδων",
      "Elln_nounMaG3XesT1SeNuF1Ba-ουδέτερο-ες-οξυ-αιλουροειδ-ές-ούς-ή-ών"]
  else if (sWord.endsWith('ες') )
    aOut = [
      "Elln_nounMnG1XesT2SuNuF1Ba-αρσενικό-ες-παρ-κόντ-ες-ε-ηδες-ηδων",
      "Elln_nounMaG3XesT2SeNcF1Ba-ουδέτερο-ες-παρ-ιδεώδ-ες-ους-ή-ών"]


  // endsWith /i/
  else if (sWord.endsWith('ής') )
    aOut = [
      "Elln_nounMnG1XisT1SeNuF1Ba-αρσενικό-ης-οξυ-νικητ-ής-ή-ές-ών",
      "Elln_nounMnG1Xis2T1SeNuF1Ba-αρσενικό-ης-οξυ-συγγεν-ής-ή-είς-ών",
      "Elln_nounMnG1XisT1SuNuF1Ba-αρσενικό-ης-οξυ-καφετζ-ής-ή-ήδες-ήδων",
      "Elln_nounMnaG1XisT1SuNuF2Ba-αρσενικό-ης-οξυ-Περικλ-ής-ή|έους-ή-είς|ήδες-έων|ήδων",
      "Elln_nounMnG1XisT1SeuNuF2Ba-αρσενικό-ης-οξυ-πραματευτ-ής-ή-ές|άδες-ών|άδων",
      "Elln_nounMnaG1XisT1SeuNuF2Ba-αρσενικό-ης-οξυ-καθηγητ-ής-ή|ού-ή|ά-ές|άδες-ών|άδων",
      "Elln_nounMnG1XisT1SuNuF2Ba-αρσενικό-ης-οξυ-Σαρρ-ής-ή-ήδες|αίοι-ήδων|αίων-ήδες|αίους"]
  else if (sWord.endsWith('ης') && nSyllable===2 )
    aOut = [
      "Elln_nounMnG1XisT2SeNcF1Ba-αρσενικό-ης-παρ-ναύτ-ης-η-ες-ών",
      "Elln_nounMnG1XisT2SuNuF1Ba-αρσενικό-ης-παρ-μανάβ-ης-η-ηδες-ηδων",
      "Elln_nounMnG1XisT2SeuNcuF2Ba-αρσενικό-ης-παρ-λαχειοπώλ-ης-η-ες|ηδες-ών|ηδων",
      "Elln_nounMnG1XisT2SeuuNcucF3Ba-αρσενικό-ης-παρ-ράφτ-ης-η-ες|ηδες|άδες-ών|ηδων|άδων",
      "Elln_nounMnG1XisT2SuNucF2Ba-αρσενικό-ης-παρ-νοικοκύρ-ης-η-ηδες|αίοι-ηδων|αίων-ηδες|αίους",
      "Elln_nounMnG1XisT2Su2NucF2Ba-αρσενικό-ης-παρ-τσοπάν-ης-η-ηδες|αραίοι-ηδων|αραίων-ηδες|αραίους"]
  else if (sWord.endsWith('ης') && nSyllable===3 )
    aOut = [
      "Elln_nounMnG1XisT3SuNcF1Ba-αρσενικό-ης-προ-Μπότσαρ-ης-η-αίοι-αίων-αίους"]

  else if (sWord.endsWith('ή') )
    aOut = [
      "Elln_nounMnG2XiT1SeNuF1Ba-θηλυκό-ή-οξυ-ψυχ-ή-ής-ές-ών",
      "Elln_nounMnG2XiT1SeuNucF2Ba-θηλυκό-η-οξυ-αδερφ-ή-ής-ές|άδες-ών|άδων"]
  else if (sWord.endsWith('η') && nSyllable===2 )
    aOut = [
      "Elln_nounMnG2XiT2SeNcF1Ba-θηλυκό-η-παρ-νίκ-η-ης-ες-ών",
      "Elln_nounMnG2XiT2SeNcF1Bn6-θηλυκό-η-παρ-ζέστ-η-ης-ες",
      "Elln_nounMnG2XiT2SeNuF1Ba-θηλυκό-η-παρ-ερωμέν-η-ης-ες-ων",
      "Elln_nounMnG2XiT2SeNdF1Ba-θηλυκό-η-παρ-κατηγορουμέν-η-ης-ες-ων",
      "Elln_nounMnaG2XiT2SuNcF2Ba-θηλυκό-η-παρ-λύσ-η-ης|εως-εις-εων",
      "Elln_nounMnG2XiT2SeuNucF2Ba-θηλυκό-η-παρ-νύφ-η-ης-ες|άδες-άδων"]
  else if (sWord.endsWith('η') && nSyllable===3 )
    aOut = [
      "Elln_nounMnG2XiT3SeNuF1Ba-θηλυκό-η-προ-ασημόσκον-η-ης-ες-ων",
      "Elln_nounMnG2XiT3SeNuF1Bn6-θηλυκό-η-προ-ρίγαν-η-ης-ες",
      "Elln_nounMnG2XiT3SeNucF2Ba-θηλυκό-η-προ-διανοούμεν-η-ης-ες-ων|'ων",
      "Elln_nounMnG2XiT3SeaNucF2Ba-θηλυκό-η-προ-δύναμ-η-ης|'εως-'εις-'εων",
      "Elln_nounMnG2XiT3SeuNucF1Ba-θηλυκό-η-προ-αγανάχτησ-η-ης-'εις-'εων"]

  else if (sWord.endsWith('ις') && sGender==='masc' )
    aOut = [
      "Elln_nounMaG1XisT3SuNcF2Ba-αρσενικό-ις-προ-ρίψασπ-ις-'ιδος-ι|ιν-'ιδες-ίδων|'ιδων"]
  else if (sWord.endsWith('ις') && sGender==='femi' )
    aOut = [
      "Elln_nounManG2XisT2SuNucF1Ba-θηλυκό-ις-παρ-συνεργάτ-ις-ιδος|ιδας-ιδα-ι-ιδες-ίδων|ιδων"]
  else if (sWord.endsWith('ις') && sGender==='')
    aOut = [
      "Elln_nounMaG1XisT3SuNcF2Ba-αρσενικό-ις-προ-ρίψασπ-ις-'ιδος-ι|ιν-'ιδες-ίδων|'ιδων",
      "Elln_nounManG2XisT2SuNucF1Ba-θηλυκό-ις-παρ-συνεργάτ-ις-ιδος|ιδας-ιδα-ι-ιδες-ίδων|ιδων"]

  else if (sWord.endsWith('ί'))
    aOut = [
      "Elln_nounMnG3XiT1SeNuF1Ba-ουδέτερο-ι-οξυ-παιδ-ί-ιού-ιά-ιών"]
  else if (sWord.endsWith('ι') && nSyllable===2 )
    aOut = [
      "Elln_nounMnG3XiT2SeNcF1Ba-ουδέτερο-ι-παρ-τραγούδ-ι-ιού-ια-ιών",
      "Elln_nounMaG3XiT2SuNcF1Ba-ουδέτερο-ι-παρ-μίλ-ι-ίου-ια-ίων",
      "Elln_nounMnaG3XiT2SeuNcF2Ba-ουδέτερο-ι-παρ-καράτ-ι-ιού|ίου-ια-ιών|ίων",
      "Elln_nounMnG3XiT2SeNuF1Bn26-ουδέτερο-ι-παρ-παιδάκ-ι-ια",
      "Elln_nounMnG3XiT2Se2NcF1Ba-ουδέτερο-ι-παρ-τσά-ι-γιού-για-γιών",
      "Elln_nounMn2G3XiT2SeNcF1Ba-ουδέτερο-ι-παρ-ρολό-ι-ϊού-ια-ϊών"]
  else if (sWord.endsWith('ι') && nSyllable===3 )
    aOut = [
      "Elln_nounMnG3XiT3SeNcF1Bnp-ουδέτερο-ι-προ-φίλντισ-ι-ιού"]


  // endsWith /o/
  else if (sWord.endsWith('όν') )
    aOut = [
      "Elln_nounMaG3XonT1SuNcF1Ba-ουδέτερο-ον-οξυ-παρ-όν-όντος-όντα-όντων"]
  else if (sWord.endsWith('ός') && sGender==='masc' )
    aOut = [
      "Elln_nounMnG1XosT1SeNuF1Ba-αρσενικό-ος-οξυ-να-ός-ού-ό-έ-οί-ών-ούς"]
  else if (sWord.endsWith('ός') && sGender==='femi' )
    aOut = [
      "Elln_nounMnG2XosT1SeNuF1Ba-θηλυκό-ός-οξυ-οδ-ός-ού-ο-ε-οί-ών-ούς"]
  else if (sWord.endsWith('ός') && sGender==='neut' )
    aOut = [
      "Elln_nounMnG3XosT1SuNcF1Ba-ουδέτερο-ος-οξυ-γεγον-ός-ότος-ότα-ότων"]
  else if (sWord.endsWith('ός') && sGender==='' )
    aOut = [
      "Elln_nounMnG1XosT1SeNuF1Ba-αρσενικό-ος-οξυ-να-ός-ού-ό-έ-οί-ών-ούς",
      "Elln_nounMnG2XosT1SeNuF1Ba-θηλυκό-ός-οξυ-οδ-ός-ού-ο-ε-οί-ών-ούς",
      "Elln_nounMnG3XosT1SuNcF1Ba-ουδέτερο-ος-οξυ-γεγον-ός-ότος-ότα-ότων"]
  else if (sWord.endsWith('ος') && nSyllable===2 && sGender==='masc')
    aOut = [
      "Elln_nounMnG1XosT2SeNuF1Ba-αρσενικό-ος-παρ-δρόμ-ος-ου-ο-ε-οι-ων-ους",
      "Elln_nounMnG1XosT2Se2NuF1Ba-αρσενικό-ος-παρ-υπνάκ-ος-ου-ο-οι-ων-ους",
      "Elln_nounMnG1XosT2SeNuF2Ba-αρσενικό-ος-παρ-μούτσ-ος-ου-ο-ε|ο-οι-ων-ους",
      "Elln_nounMnG1XosT2SuNuF1Ba-αρσενικό-ος-παρ-Γιώργ-ος-ου-ο-ηδες-ηδων",
      "Elln_nounMnG1XosT2SeuNucuF3Ba-αρσενικό-ος-παρ-Σαρακατσάν-ος-ου-ο-ε-οι|αίοι|ηδες-ων|αίων|ηδων-ους|αίους|ηδες",
      "Elln_nounMnG1XosT2SeuNucF2Ba-αρσενικό-ος-παρ-καπετάν-ιος-ιου-ιο-ιε-ιοι|αίων-ιων|αίων-ιους|αίους"]
  else if (sWord.endsWith('ος') && nSyllable===3 && sGender==='masc')
    aOut = [
      "Elln_nounMnG1XosT3SeNuF1Ba-αρσενικό-ος-προ-αντίλαλ-ος-ου-ο-ε-οι-ων-ους",
      "Elln_nounMnG1XosT3SeNcF1Ba-αρσενικό-ος-προ-χοντράνθρωπ-ος-ου-ο-ε-οι-'ων-ους",
      "Elln_nounMnG1XosT3SeNc2F1Ba-αρσενικό-ος-προ-άνθρωπ-ος-'ου-ο-ε-οι-'ων-ους",
      "Elln_nounManG1XosT3SeNcF2Ba-αρσενικό-ος-προ-όροφ-ος-'ου|ου-ο-ε-οι-'ων-ους",
      "Elln_nounManG1XosT3SeNc2F2Ba-αρσενικό-ος-προ-δάσκαλ-ος-'ου|ου-ο-ε-οι-'ων-'ους|ους",
      "Elln_nounMnaG1XosT3SeNucF2Ba-αρσενικό-ος-προ-καρδινάλι-ος-ου|'ου-ο-ε-οι-ων|'ων-ους|'ους",
      "Elln_nounMnG1XosT3SeuNucF2Ba-αρσενικό-ος-προ-Παπαδόπουλ-ος-ου|'ου-ο-ε-οι|αίοι-ων|αίων-ους|αίους"]
  else if (sWord.endsWith('ος') && nSyllable===2 && sGender==='femi')
    aOut = [
      "Elln_nounMnG2XosT2SeNuF2Ba-θηλυκό-ος-παρ-διχοτόμ-ος-ου-ο-ε|ο-οι-ων-ους",
      "Elln_nounMnG2XosT2SeNuF1Ba-θηλυκό-ος-παρ-νόσ-ος-ου-ο-ε-οι-ων-ους"]
  else if (sWord.endsWith('ος') && nSyllable===3 && sGender==='femi')
    aOut = [
      "Elln_nounMnG2XosT3SeNcF1Ba-θηλυκό-ος-προ-άμπελ-ος-'ου-ο-ε-οι-'ων-'ους",
      "Elln_nounMnG2XosT3SeNcF2Ba-θηλυκό-ος-προ-ήπειρ-ος-'ου-ο-ε|ο-οι-'ων-'ους",
      "Elln_nounMnG2XosT3SeNcF2bBa-θηλυκό-ος-προ-διάμετρ-ος-'ου-ο-ε|ο-οι|ες-'ων-'ους|ες",
      "Elln_nounMnaG2XosT3SeNucF2Ba-θηλυκό-ος-προ-πανσέλην-ος-ου|'ου-ο-ε|ο-οι-ων|'ων-ους|'ους"]
  else if (sWord.endsWith('ος') && nSyllable===2 && sGender==='neut')
    aOut = [
      "Elln_nounMnG3XosT2SeNcF1Ba-ουδέτερο-ος-παρ-δάσ-ος-ους-η-ών",
      "Elln_nounMaG3XosT2SuNcF1Ba-ουδέτερο-ος-παρ-άνθ-ος-ους-η-έων"]
  else if (sWord.endsWith('ος') && nSyllable===3 && sGender==='neut')
    aOut = [
      "Elln_nounMnG3XosT3SeNcF1Ba-ουδέτερο-ος-προ-έδαφ-ος-'ους-'η-ών",
      "Elln_nounMnG3XosT3SuNcF1Ba-ουδέτερο-ος-προ-αεριόφ-ως-ωτος-ωτα-ώτων"]
  else if (sWord.endsWith('ος') && nSyllable===2 && sGender==='')
    aOut = [
      "Elln_nounMnG1XosT2SeNuF1Ba-αρσενικό-ος-παρ-δρόμ-ος-ου-ο-ε-οι-ων-ους",
      "Elln_nounMnG1XosT2Se2NuF1Ba-αρσενικό-ος-παρ-υπνάκ-ος-ου-ο-οι-ων-ους",
      "Elln_nounMnG1XosT2SeNuF2Ba-αρσενικό-ος-παρ-μούτσ-ος-ου-ο-ε|ο-οι-ων-ους",
      "Elln_nounMnG1XosT2SuNuF1Ba-αρσενικό-ος-παρ-Γιώργ-ος-ου-ο-ηδες-ηδων",
      "Elln_nounMnG1XosT2SeuNucuF3Ba-αρσενικό-ος-παρ-Σαρακατσάν-ος-ου-ο-ε-οι|αίοι|ηδες-ων|αίων|ηδων-ους|αίους|ηδες",
      "Elln_nounMnG1XosT2SeuNucF2Ba-αρσενικό-ος-παρ-καπετάν-ιος-ιου-ιο-ιε-ιοι|αίων-ιων|αίων-ιους|αίους",
      "Elln_nounMnG2XosT2SeNuF2Ba-θηλυκό-ος-παρ-διχοτόμ-ος-ου-ο-ε|ο-οι-ων-ους",
      "Elln_nounMnG2XosT2SeNuF1Ba-θηλυκό-ος-παρ-νόσ-ος-ου-ο-ε-οι-ων-ους",
      "Elln_nounMnG3XosT2SeNcF1Ba-ουδέτερο-ος-παρ-δάσ-ος-ους-η-ών",
      "Elln_nounMaG3XosT2SuNcF1Ba-ουδέτερο-ος-παρ-άνθ-ος-ους-η-έων"]
  else if (sWord.endsWith('ος') && nSyllable===3 && sGender==='')
    aOut = [
      "Elln_nounMnG1XosT3SeNuF1Ba-αρσενικό-ος-προ-αντίλαλ-ος-ου-ο-ε-οι-ων-ους",
      "Elln_nounMnG1XosT3SeNcF1Ba-αρσενικό-ος-προ-χοντράνθρωπ-ος-ου-ο-ε-οι-'ων-ους",
      "Elln_nounMnG1XosT3SeNc2F1Ba-αρσενικό-ος-προ-άνθρωπ-ος-'ου-ο-ε-οι-'ων-ους",
      "Elln_nounManG1XosT3SeNcF2Ba-αρσενικό-ος-προ-όροφ-ος-'ου|ου-ο-ε-οι-'ων-ους",
      "Elln_nounManG1XosT3SeNc2F2Ba-αρσενικό-ος-προ-δάσκαλ-ος-'ου|ου-ο-ε-οι-'ων-'ους|ους",
      "Elln_nounMnaG1XosT3SeNucF2Ba-αρσενικό-ος-προ-καρδινάλι-ος-ου|'ου-ο-ε-οι-ων|'ων-ους|'ους",
      "Elln_nounMnG1XosT3SeuNucF2Ba-αρσενικό-ος-προ-Παπαδόπουλ-ος-ου|'ου-ο-ε-οι|αίοι-ων|αίων-ους|αίους",
      "Elln_nounMnG2XosT3SeNcF1Ba-θηλυκό-ος-προ-άμπελ-ος-'ου-ο-ε-οι-'ων-'ους",
      "Elln_nounMnG2XosT3SeNcF2Ba-θηλυκό-ος-προ-ήπειρ-ος-'ου-ο-ε|ο-οι-'ων-'ους",
      "Elln_nounMnG2XosT3SeNcF2bBa-θηλυκό-ος-προ-διάμετρ-ος-'ου-ο-ε|ο-οι|ες-'ων-'ους|ες",
      "Elln_nounMnaG2XosT3SeNucF2Ba-θηλυκό-ος-προ-πανσέλην-ος-ου|'ου-ο-ε|ο-οι-ων|'ων-ους|'ους",
      "Elln_nounMnG3XosT3SeNcF1Ba-ουδέτερο-ος-προ-έδαφ-ος-'ους-'η-ών",
      "Elln_nounMnG3XosT3SuNcF1Ba-ουδέτερο-ος-προ-αεριόφ-ως-ωτος-ωτα-ώτων"]

  else if (sWord.endsWith('ό') )
    aOut = [
      "Elln_nounMnG3XoT1SeNuF1Ba-ουδέτερο-ο-οξυ-βουν-ό-ού-ά-ών"]
  else if (sWord.endsWith('ο') && nSyllable===2 )
    aOut = [
      "Elln_nounMnG3XoT2SeNuF1Ba-ουδέτερο-ο-παρ-πεύκ-ο-ου-α-ων"]
  else if (sWord.endsWith('ο') && nSyllable===3 )
    aOut = [
      "Elln_nounMnG3XoT3SeNuF1Ba-ουδέτερο-ο-προ-σίδερ-ο-ου-α-ων",
      "Elln_nounMaG3XoT3SeNcF1Ba-ουδέτερο-ο-προ-άτομ-ο-'ου-α-'ων",
      "Elln_nounManG3XoT3SeNcuF2Ba-ουδέτερο-ο-προ-πρόσωπ-ο-'ου|ου-α-'ων",
      "Elln_nounMnaG3XoT3SeNucF2Ba-ουδέτερο-ο-προ-βούτυρ-ο-ου|'ου-α-ων|'ων",
      "Elln_nounMnG3XoT3SuNcF1Ba-ουδέτερο-ο-προ-δέσιμ-ο-'ατος-'ατα-άτων"]

  else if (sWord.endsWith('ώ') )
    aOut = [
      "Elln_nounMnG2XoT1SeNuF1Bnp-θηλυκό-ω-οξυ-Ρηνι-ώ-ώς"]
  else if (sWord.endsWith('ω') && nSyllable===2 )
    aOut = [
      "Elln_nounMnG2XoT2SeNuF1Ba-θηλυκό-ω-παρ-τρελέγκ-ω-ως-ες-ων"]


  // endsWith /u/
  else if (sWord.endsWith('ούς') )
    aOut = [
      "Elln_nounMnG1XusT1SuNuF1Ba-αρσενικό-ους-οξυ-παππ-ούς-ού-ούδες-ούδων"]
  else if (sWord.endsWith('ους') && nSyllable===1 )
    aOut = [
      "Elln_nounMaG1XusT1SeuNucF2Ba-αρσενικό-ους-οξυ-ν-ους-ου|οός-ου-όες-όων"]
  else if (sWord.endsWith('ους') && nSyllable===2 )
    aOut = [
      "Elln_nounMnG1XusT2SeNuF1Ba-αρσενικό-ους-παρ-απόπλ-ους-ου-οι-ων-ους"]
  else if (sWord.endsWith('ού') )
    aOut = [
      "Elln_nounMnG2XuT1SuNcF1Ba-θηλυκό-ου-οξυ-αλεπ-ού-ούς-ούδες-ούδων"]

  return aOut
}

/**
 * DOING: it finds info of a-Greek-case FROM example in dirLag/McshLag000020.last.html
 * INPUT:
 *  - sWordIn = αγάπη
 *  - sMethodIn = Elln_nounMnG2XiT2SeNcF1Bn6
 * OUPUT: [table-members, note]
 */
async function fFindNounmbrElln (sWordIn, sMethodIn, bSinizisiIn) {
  console.log(sWordIn +': ' +sMethodIn)
  let
    aCase = [],   // the-output cases as table-rows
    aMethod = [], // info of method
    aMcs,
    n,
    sStemM,    //stem nominativeSingular of method
    sStemMRem, //remove
    sStemMInc, //increase
    sStemMDec, //decrease
    sStemW,    //stem nominativeSingular of word
    sStemWRem,
    sStemWInc,
    sStemWDec,
    sStemW3,
    sStemMx, //
    sSufxM,
    sSufxMx,
    sWord = sWordIn, // ξαδέρφη
    sWordGS, //genitiveSingular
    sWordAS, //accusativeSingular
    sWordVS, //vocativeSingular
    sWordNP, //nominativePlural
    sWordGP, //genitivePlural
    sWordAP, //accusativePlurl
    sWordVP, //vocativePlural
    sWordX,
    bSinizisi = bSinizisiIn

  const response = await fetch(sFileElln)
  const sHtml = await response.text()
  aMcs = sHtml.toString().split('\n')
  // aMcs = moFs.readFileSync(sFileElln).toString().split('\n') //node

  //find the-index of method in McsLagElln
  n = aMcs.findIndex(function(sLn){
    return sLn.indexOf('"idLEllnnoun' +sMethodIn.substring(9) +'dsn"') > 1
  })
  //we found method
  sLn = aMcs[n+1] //<p>description::
  sLn = aMcs[n+2] //<br>× Elln_nounMnG2Xi
  aCase.push(sLn.substring(10))
  aMethod.push(sLn.substring(10))
  sLn = aMcs[n+3] //</p>
  sLn = aMcs[n+4] //<table class="clsTblBorderNo">
  sLn = aMcs[n+5] //<tr><td>η<td>νύφ-η
  aCase.push(sLn.substring(sLn.indexOf('<'), sLn.lastIndexOf('>')+1))
  aMethod.push(sLn.substring(sLn.lastIndexOf('>')+1))
  sLn = aMcs[n+6] //<tr><td>της<td>νύφ-ης
  aCase.push(sLn.substring(sLn.indexOf('<'), sLn.lastIndexOf('>')+1))
  aMethod.push(sLn.substring(sLn.lastIndexOf('>')+1))
  sLn = aMcs[n+7] //<tr><td>την<td>νύφ-η
  aCase.push(sLn.substring(sLn.indexOf('<'), sLn.lastIndexOf('>')+1))
  aMethod.push(sLn.substring(sLn.lastIndexOf('>')+1))
  sLn = aMcs[n+8] //<tr><td><td>νύφ-η
  aCase.push(sLn.substring(sLn.indexOf('<'), sLn.lastIndexOf('>')+1))
  aMethod.push(sLn.substring(sLn.lastIndexOf('>')+1))
  sLn = aMcs[n+9] //<tr><td>οι<td>νύφ-ες|νυφ-άδες
  aCase.push(sLn.substring(sLn.indexOf('<'), sLn.lastIndexOf('>')+1))
  aMethod.push(sLn.substring(sLn.lastIndexOf('>')+1))
  sLn = aMcs[n+10] //<tr><td>των<td>νυφ-άδων
  aCase.push(sLn.substring(sLn.indexOf('<'), sLn.lastIndexOf('>')+1))
  aMethod.push(sLn.substring(sLn.lastIndexOf('>')+1))
  sLn = aMcs[n+11] //<tr><td>τις<td>νύφ-ες|νυφ-άδες
  aCase.push(sLn.substring(sLn.indexOf('<'), sLn.lastIndexOf('>')+1))
  aMethod.push(sLn.substring(sLn.lastIndexOf('>')+1))
  sLn = aMcs[n+12] //<tr><td><td>νύφ-ες|νυφ-άδες
  aCase.push(sLn.substring(sLn.indexOf('<'), sLn.lastIndexOf('>')+1))
  aMethod.push(sLn.substring(sLn.lastIndexOf('>')+1))
  //console.log(aMethod)
  //console.log(aCase)

  //find stems
  if (!sMethodIn.endsWith('Bns')) {
    sStemM = aMethod[1].substring(0, aMethod[1].indexOf('-'))
    sStemMRem = omLagUtil.fGreektonosRemove(sStemM)
    sStemMInc = omLagUtil.fGreektonosIncrease(sStemM, bSinizisi)
    sStemMDec = omLagUtil.fGreektonosDecrease(sStemM, bSinizisi)
    sSufxM = aMethod[1].substring(aMethod[1].lastIndexOf('-')+1)
  } else {
    // no singular
    sStemM = aMethod[5].substring(0, aMethod[5].indexOf('-'))
    sStemMRem = omLagUtil.fGreektonosRemove(sStemM)
    sStemMInc = omLagUtil.fGreektonosIncrease(sStemM, bSinizisi)
    sStemMDec = omLagUtil.fGreektonosDecrease(sStemM, bSinizisi)
    sSufxM = aMethod[5].substring(aMethod[5].lastIndexOf('-')+1)
  }
  sStemW = sWord.substring(0, sWord.length-sSufxM.length) //ξαδέρφ
  sStemWRem = omLagUtil.fGreektonosRemove(sStemW)
  sStemWInc = omLagUtil.fGreektonosIncrease(sStemW, bSinizisi)
  sStemWDec = omLagUtil.fGreektonosDecrease(sStemW, bSinizisi)
  //console.log(sStemWRem+', '+sStemWInc+', '+sStemWDec)

  //γενι-ενικ gs
  if (aMethod[2].indexOf('|') != -1) {
    //we have many forms
    const aExl = aMethod[2].split('|')
    sWordGS = fFindWordX(aExl[0])
    for (n=1; n<aExl.length; n++) {
      sWordGS = sWordGS +'|' +fFindWordX(aExl[n])
    }
  } else {
    sWordGS = fFindWordX(aMethod[2])
  }
  //console.log(sWordGS)

  /**
   * it returns a-member, given example method
   * INPUT: νότ-α, (νοτ-ών)
   */
  function fFindWordX(sMethexlIn) {
    if (sMethexlIn !== '∅') { //empty-set
      sStemMx = sMethexlIn.substring(0, sMethexlIn.indexOf('-'))
      sSufxMx = sMethexlIn.substring(sMethexlIn.indexOf('-')+1)
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
      let sPhnm = omLagUtil.fGreekwordFindPhonema(sWordX, bSinizisi)
      if (sPhnm.indexOf('111') !== -1){
        //TODO: fix it from base-form
        console.log(sPhnm +'/' + sWordX)
      }
      sWordX = sWordX + sPhnm
      if (omLagUtil.fGreekphonemaHasSyllableOne(sWordX) == 1) {
        sWordX = omLagUtil.fGreektonosRemove(sWordX)
        sWordX = omLagUtil.fPhonemaTonosRemove(sWordX)
      }
    } else
      sWordX = '∅'
    return sWordX
  }

  if (!sMethodIn.endsWith('Bns')) {
    aCase[1] = aCase[1] + sWord + omLagUtil.fGreekwordFindPhonema(sWord, bSinizisi)
  } else {
    aCase[1] = aCase[1] + '∅'
  }
  aCase[2] = aCase[2] + sWordGS

  //αιτ-ενικ as
  if (aMethod[3].indexOf('|') != -1) {
    //we have many forms
    const aExl = aMethod[3].split('|')
    sWordAS = fFindWordX(aExl[0])
    for (n=1; n<aExl.length; n++) {
      sWordAS = sWordAS +'|' +fFindWordX(aExl[n])
    }
  } else {
    sWordAS = fFindWordX(aMethod[3])
  }
  aCase[3] = aCase[3] + sWordAS

  //κλητ-ενικ vs
  if (aMethod[4].indexOf('|') != -1) {
    //we have many forms
    const aExl = aMethod[4].split('|')
    sWordVS = fFindWordX(aExl[0])
    for (n=1; n<aExl.length; n++) {
      sWordVS = sWordVS +'|' +fFindWordX(aExl[n])
    }
  } else {
    sWordVS = fFindWordX(aMethod[4])
  }
  aCase[4] = aCase[4] + sWordVS

  //ονομ-πληθ np
  if (aMethod[5].indexOf('|') != -1) {
    //we have many forms
    const aExl = aMethod[5].split('|')
    sWordNP = fFindWordX(aExl[0])
    for (n=1; n<aExl.length; n++) {
      sWordNP = sWordNP +'|' +fFindWordX(aExl[n])
    }
  } else {
    sWordNP = fFindWordX(aMethod[5])
  }
  aCase[5] = aCase[5] + sWordNP

  //γενι-πληθ gp
  if (aMethod[6].indexOf('|') != -1) {
    //we have many forms
    const aExl = aMethod[6].split('|')
    sWordGP = fFindWordX(aExl[0])
    for (n=1; n<aExl.length; n++) {
      sWordGP = sWordGP +'|' +fFindWordX(aExl[n])
    }
  } else {
    sWordGP = fFindWordX(aMethod[6])
  }
  aCase[6] = aCase[6] + sWordGP

  //αιτ-πληθ ap
  if (aMethod[7].indexOf('|') != -1) {
    //we have many forms
    const aExl = aMethod[7].split('|')
    sWordAP = fFindWordX(aExl[0])
    for (n=1; n<aExl.length; n++) {
      sWordAP = sWordAP +'|' +fFindWordX(aExl[n])
    }
  } else {
    sWordAP = fFindWordX(aMethod[7])
  }
  aCase[7] = aCase[7] + sWordAP

  //κλητ-πληθ vp
  if (aMethod[8].indexOf('|') != -1) {
    //we have many forms
    const aExl = aMethod[8].split('|')
    sWordVP = fFindWordX(aExl[0])
    for (n=1; n<aExl.length; n++) {
      sWordVP = sWordVP +'|' +fFindWordX(aExl[n])
    }
  } else {
    sWordVP = fFindWordX(aMethod[8])
  }
  aCase[8] = aCase[8] + sWordVP

  let sCase =
    aCase[1] +
    aCase[2] +
    aCase[3] +
    aCase[4] +
    aCase[5] +
    aCase[6] +
    aCase[7] +
    aCase[8]

  // console.log(sCase)
  return [sCase, aCase[0]]
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
  fFindMethodNounElln,
  fFindNounmbrElln
}
