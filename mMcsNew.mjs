/*
 * mMcsNew.mjs - it creates a-new file McsHitp-senso-concept
 * The MIT License (MIT)
 *
 * Copyright (c) 2017-2026 Kaseluris.Nikos.1959 (hmnSngu)
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
 * DOING: it creates a-new file senso-concept McsDir000000.last.html
 *     - updates aPages.json
 *     - creates McsDir000000.txt
 *     - indexes new file
 *     - uploads new and modified files
 * INPUT:
 * OUTPUT: McsDir000000.last.html
 * RUN: cd dirMcsh && node ../dirMcshmgr/mMcsNew.mjs <sDir> <sNameInformal> <sNameFormal> <sNameId> <true|false> <sftpPassword>
 *
 * ISSUE: IF you want to recreate the-file,
 * you have to delete IT from aPages.json
 */

import moFs from 'fs'
import * as moUtil from './mUtil.mjs'
import {fNamidx} from './mNamidx.mjs'
import {fSftp} from './mSftp.mjs'

const
  // contains the-versions of mHitp.js
  aVersion = [
    'mMcsNew.mjs.1-4-1.2026-09-01: relations pc, wp, gs',
    'mMcsNew.mjs.1-4-0.2026-09-01: dirManager',
    'mMcsNew.mjs.1-3-12.2026-08-17: Mcsh-creation',
    'mMcsNew.mjs.1-3-11.2026-05-02: .specific',
    'mMcsNew.mjs.1-3-10.2026-04-28: validator pass',
    'mMcsNew.mjs.1-3-9.2026-04-12: dirManager/sftp.json',
    'mMcsNew.mjs.1-3-8.2026-04-11: script async',
    'mMcsNew.mjs.1-3-7.2025-12-10: mMcsh2',
    'mMcsNew.mjs.1-3-6.2024-07-04: parent-child-tree',
    'mMcsNew.mjs.1-3-5.2024-02-27: parent-child-tree',
    'mMcsNew.mjs.1-3-4.2023-12-12: title !=',
    'mMcsNew.mjs.1-3-3.2023-12-12: title',
    'mMcsNew.mjs.1-3-2.2023-11-29: evoluting-of',
    'mMcsNew.mjs.1-3-1.2023-10-23: absolute-links',
    'mMcsNew.mjs.1-3-0.2023-08-29: classification-trees',
    'mMcsNew.mjs.1-2-0.2023-08-16: parent-child-tree',
    'mMcsNew.mjs.1-1-3.2023-08-15: shorname!=name',
    'mMcsNew.mjs.1-1-2.2022-07-30: filename on title',
    'mMcsNew.mjs.1-1-1.2022-06-22: renamed to mMcsNew',
    'mMcs.mjs.1-1-0.2022-01-09: filMcs to McsCor000002',
    'mMcs.mjs.1-0-0.2021-12-12: ',
    'version.0-15-0.2021-08-04: module rename from js-mcsAdd3.js',
    'version.0-14-2.2020-12-04: no-steemit',
    'version.0-14-1.2020-11-28: Infrsc',
    'version.0-14-0.2020-07-05: hitp-files-local',
    'version.0-13-0.2020-04-06: structure-doing',
    'version.0-12-0.2020-02-19: whole-part-generic-tree',
    'version.0-11-1.2020-02-19: whole-part-generic-tree',
    'version.0-11-0.2020-01-12: versions',
    'version.0-10-0.2019-12-28: generic-whole-trees',
    'version.0-9-0.2019-12-25: whole-att',
    'version.0-8-0.2019-12-23: entity-link',
    'version.0-7-0.2019-09-06: comments on filMcsDirNam',
    'version.0-6-4.2019-08-09: github',
    'version.0-6-3.2019-07-30: idOverview',
    'version.0-6-2.2019-06-29: misc',
    'version.0-6-1.2019-05-05: misc',
    'version.0-6-0.2018-06-29: disqus-dir',
    'version.0-5-1.2018-03-17: filMcs',
    'version.0-5-0.2018-02-18: steemit',
    'version.0-4-0.2018-01-14: lower-case',
    'version.0-3-0.2017-12-10: NameFileIdShort',
    'version.0-2-1.2017-11-26: cpt.FilMcsId.last.html',
    'version.0-1-3.2017-11-17: idHeadercrd',
    'version.0-1-1.2017-09-27',
    'version.0-1-0.2017-06-27'
  ]

let
  n,
  s,

  //// INPUT VALUES ////
  //1. Add counter or not
  bCounter = true,

  //2. Directory of the-concept dirCor|dirEdu|dirHlth|dirHmn|dirLag|dirNtr|
  //   dirOgm|dirStn|dirStnlaw|dirTch|dirTchPrgm|dirTchInf
  sDir = 'dirTchPrgm',

  //3. Name of the-title: Ethereum--blockchain-net
  sNameInformal = 'Table-of-contents--Chrome-extension',
  //4. SHORT-name: sysNet, ogn, DnChain, DnEth, Dchain-net, lagoSngu,
  sNameFormal = 'CrxToc',

  //5. Name for IDs, unique in this file: Net, Dtc, LTurk, SocGrca,
  sNameId = 'idCrxToc',


  sNameFile = '',
  sNameFileNaked = '',
  aPages,
  nFile = 0,
  sDirShort = sDir.substring(3)


// INPUT VALUES may be supplied as CLI args (VS Code task inputs); else defaults above.
// argv[2]=sDir  argv[3]=sNameInformal  argv[4]=sNameFormal  argv[5]=sNameId  argv[6]=bCounter
if (process.argv[2]) sDir          = process.argv[2]
if (process.argv[3]) sNameInformal = process.argv[3]
if (process.argv[4]) sNameFormal   = process.argv[4]
if (process.argv[5]) sNameId       = process.argv[5]
if (process.argv[6]) bCounter      = process.argv[6] === 'true'
sDirShort = sDir.substring(3)


aPages = JSON.parse(moFs.readFileSync('../dirMcsh/SitePagesArr.json'))

// find file-name
for (n = 0; n < aPages.length; n++) {
  //aPages contains the-counter files
  if (new RegExp('^Mcsh'+sDirShort+'[0-9]+\.txt').test(aPages[n][0])) nFile = nFile + 1
}
// first file-number 000000
sNameFileNaked = 'Mcsh' + sDirShort + nFile.toString().padStart(6, '0')
sNameFile = sNameFileNaked + '.last.html'

//if file exist exit

s =
  '<!DOCTYPE html>\n' +
  '<html>\n' +
  '<head>\n' +
  '  <meta charset="utf-8">\n' +
  '  <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
  '  <title>Mcs.' + sNameFormal + '!=' + sNameInformal + '\n' +
  '    (' + sNameFileNaked + '.0-1-0.' + moUtil.fDateYMD() + ' draft)</title>\n' +
  '  <meta name="keywords" content="' + sNameInformal + ', ' + sNameFormal + ', modelConceptSenso, McsHitp, Synagonism">\n' +
  '  <link rel="stylesheet" href="/dirMcshmgr/mMcsh2.css">\n' +
  '</head>\n' +
  '\n' +
  '<body>\n' +
  '  <header id="idHeader">\n' +
  '  <p></p>\n' +
  '  <h1 id="idHeaderH1">' + sNameInformal + '\n' +
  '    <br>senso-concept-Mcs (' + sNameFormal + ')\n' +
  '    </h1>\n' +
  '  </header>\n' +
  '\n' +
  '  <section id="idOverview">\n' +
  '  <h1 id="idOverviewH1">overview of ' + sNameFormal + '\n' +
  '    <a class="clsHide" href="#idOverviewH1"></a></h1>\n' +
  '  <p id="idDescription">description::\n' +
  '    <br>× Mcsh-creation: {' + moUtil.fDateYMD() + '}\n' +
  '    <br>· \n' +
  '    <a class="clsHide" href="#idDescription"></a></p>\n' +
  '  <p id="idName">name::\n' +
  '    <br>* McsEngl.' + sNameInformal + '!⇒' + sNameFormal + ',\n' +
  '    <br>* McsEngl.' + sNameFormal + '!=' + sNameInformal + ',\n' +
  '    <br>* McsEngl.' + sNameFormal + '!~' + sNameFileNaked + ',\n' +
  '    <br>* McsEngl.' + sNameFile + '//' + sDir + '//dirMcsh!⇒' + sNameFormal + ',\n' +
  '    <br>* McsEngl.' + sDir +'/' + sNameFile + '!⇒' + sNameFormal + ',\n' +
  '    <a class="clsHide" href="#idName"></a></p>\n' +
  '  </section>\n' +
  '\n' +
  '  <section id="' + sNameId + 'irsc">\n' +
  '  <h1 id="' + sNameId + 'irscH1">info-resource of ' + sNameFormal + '\n' +
  '    <a class="clsHide" href="#' + sNameId + 'irscH1"></a></h1>\n' +
  '  <p id="' + sNameId + 'irscdsn">description::\n' +
  '    <br>* \n' +
  '    <a class="clsHide" href="#' + sNameId + 'irscdsn"></a></p>\n' +
  '  <p id="' + sNameId + 'irscnam">name::\n' +
  '    <br>* McsEngl.' + sNameFormal + '\'InfRsc,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'irscnam"></a></p>\n' +
  '  </section>\n' +
  //'\n' +
  //'  <section id="' + sNameId + 'srtr">\n' +
  //'  <h1 id="' + sNameId + 'srtrH1">structure of ' + sNameFormal + '\n' +
  //'    <a class="clsHide" href="#' + sNameId + 'srtrH1"></a></h1>\n' +
  //'  <p id="' + sNameId + 'srtrnam">name::\n' +
  //'    <br>* McsEngl.' + sNameFormal + '\'structure,\n' +
  //'    <a class="clsHide" href="#' + sNameId + 'srtrnam"></a></p>\n' +
  //'  <p id="' + sNameId + 'srtrdsn">description::\n' +
  //'    <br>* \n' +
  //'    <a class="clsHide" href="#' + sNameId + 'srtrdsn"></a></p>\n' +
  //'  </section>\n' +
  '\n' +
  '  <section id="' + sNameId + 'dng">\n' +
  '  <h1 id="' + sNameId + 'dngH1">DOING of ' + sNameFormal + '\n' +
  '    <a class="clsHide" href="#' + sNameId + 'dngH1"></a></h1>\n' +
  '  <p id="' + sNameId + 'dngdsn">description::\n' +
  '    <br>× McsHitp-creation: {' + moUtil.fDateYMD() + '}\n' +
  '    <br>* \n' +
  '    <a class="clsHide" href="#' + sNameId + 'dngdsn"></a></p>\n' +
  '  <p id="' + sNameId + 'dngnam">name::\n' +
  '    <br>* McsEngl.' + sNameFormal + '\'doing,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'dngnam"></a></p>\n' +
  '  </section>\n' +
  '\n' +
  '  <section id="' + sNameId + 'evg">\n' +
  '  <h1 id="' + sNameId + 'evgH1">evoluting of ' + sNameFormal + '\n' +
  '    <a class="clsHide" href="#' + sNameId + 'evgH1"></a></h1>\n' +
  '  <p id="' + sNameId + 'evgdsn">description::\n' +
  '    <br>× McsHitp-creation: {' + moUtil.fDateYMD() + '}\n' +
  '    <br>· creation of current <a class="clsPreview" href="../dirTchInf/McshTchInf000009.last.html#idMcsHitp">concept</a>.\n' +
  '    <a class="clsHide" href="#' + sNameId + 'evgdsn"></a></p>\n' +
  '  <p id="' + sNameId + 'evgnam">name::\n' +
  '    <br>* McsEngl.evoluting-of-' + sNameFormal + ',\n' +
  '    <br>* McsEngl.' + sNameFormal + '\'evoluting,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'evgnam"></a></p>\n' +
  '  </section>\n' +
  '\n' +
  '  <section id="' + sNameId + 'pct">\n' +
  '  <h1 id="' + sNameId + 'pctH1">PARENT-CHILD-TREE of ' + sNameFormal + '\n' +
  '    <a class="clsHide" href="#' + sNameId + 'pctH1"></a></h1>\n' +
  '  <p id="' + sNameId + 'pctdsn">description::\n' +
  '    <br>× McsHitp-creation: {' + moUtil.fDateYMD() + '}\n' +
  '    <br>· parent-child relations of ' + sNameFormal + '\n' +
  '    <a class="clsHide" href="#' + sNameId + 'pctdsn"></a></p>\n' +
  '  <p id="' + sNameId + 'pctnam">name::\n' +
  '    <br>* McsEngl.' + sNameFormal + '\'parent-child-tree,\n' +
  '    <br>* McsEngl.' + sNameFormal + '\'child-parent-tree,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'pctnam"></a></p>\n' +
  '  <p id="' + sNameId + 'pntr">parent-tree-of-' + sNameFormal + '::\n' +
  '    <br>* ,\n' +
  '    <br>* McsEngl.' + sNameFormal + '\'parent-tree,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'pntr"></a></p>\n' +
  '  <p id="' + sNameId + 'ctr">child-tree-of-' + sNameFormal + '::\n' +
  '    <br>* ,\n' +
  '    <br>* McsEngl.' + sNameFormal + '\'child-tree,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'ctr"></a></p>\n' +
  '  </section>\n' +
  '\n' +
  '  <section id="' + sNameId + 'wpt">\n' +
  '  <h1 id="' + sNameId + 'wptH1">WHOLE-PART-TREE of ' + sNameFormal + '\n' +
  '    <a class="clsHide" href="#' + sNameId + 'wptH1"></a></h1>\n' +
  '  <p id="' + sNameId + 'wptdsn">description::\n' +
  '    <br>× McsHitp-creation: {' + moUtil.fDateYMD() + '}\n' +
  '    <br>· whole-part relations of ' + sNameFormal + '\n' +
  '    <a class="clsHide" href="#' + sNameId + 'wptdsn"></a></p>\n' +
  '  <p id="' + sNameId + 'wptnam">name::\n' +
  '    <br>* McsEngl.' + sNameFormal + '\'whole-part-tree,\n' +
  '    <br>* McsEngl.' + sNameFormal + '\'part-whole-tree,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'wptnam"></a></p>\n' +
  '  <p id="' + sNameId + 'wtr">whole-tree-of-' + sNameFormal + '::\n' +
  '    <br>* ,\n' +
  '    <br>* ... <a class="clsPreview" href="../dirCor/McshCor000003.last.html#idEntwtr">Sympan</a>.\n' +
  '    <br>* McsEngl.' + sNameFormal + '\'whole-tree,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'wtr"></a></p>\n' +
  '  <p id="' + sNameId + 'ptr">part-tree-of-' + sNameFormal + '::\n' +
  '    <br>* ,\n' +
  '    <br>* McsEngl.' + sNameFormal + '\'part-tree,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'ptr"></a></p>\n' +
  '  </section>\n' +
  '\n' +
  '  <section id="' + sNameId + 'gst">\n' +
  '  <h1 id="' + sNameId + 'gstH1">GENERIC-SPECIFIC-TREE of ' + sNameFormal + '\n' +
  '    <a class="clsHide" href="#' + sNameId + 'gstH1"></a></h1>\n' +
  '  <p id="' + sNameId + 'gstdsn">description::\n' +
  '    <br>× McsHitp-creation: {' + moUtil.fDateYMD() + '}\n' +
  '    <br>· generic-specific relations of ' + sNameFormal + '\n' +
  '    <a class="clsHide" href="#' + sNameId + 'gstdsn"></a></p>\n' +
  '  <p id="' + sNameId + 'gstnam">name::\n' +
  '    <br>* McsEngl.' + sNameFormal + '\'generic-specific-tree,\n' +
  '    <br>* McsEngl.' + sNameFormal + '\'specific-generic-tree,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'gstnam"></a></p>\n' +
  '  <p id="' + sNameId + 'gtr">generic-tree-of-' + sNameFormal + '::\n' +
  '    <br>* ,\n' +
  '    <br>* ... <a class="clsPreview" href="../dirCor/McshCor000003.last.html#idOverview">entity</a>.\n' +
  '    <br>* McsEngl.' + sNameFormal + '\'generic-tree,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'gtr"></a></p>\n' +
  '  <p id="' + sNameId + 'str">specific-tree-of-' + sNameFormal + '::\n' +
  '    <br>* ,\n' +
  '    <br>* McsEngl.' + sNameFormal + '.specific-tree,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'str"></a></p>\n' +
  '  </section>\n' +
  '\n' +
  '  <section id="idMeta">\n' +
  '  <h1 id="idMetaH1">meta-info\n' +
  '    <a class="clsHide" href="#idMetaH1"></a></h1>\n';
if (bCounter) {
  s = s +
  '  <p id="idMetaCounter" class="clsCenter">this page was-visited\n' +
  '    <span class="clsColorRed">\n' +
  '    <script async src="../../dirPgm/dirCntr/counter.php?page='
         + sNameFileNaked + '"></script>\n' +
  '    </span>\n' +
  '    times since {' + moUtil.fDateYMD() + '}</p>\n';
}
s = s +
  '  <!-- the content of page-path paragraph is displayed as it is on top of toc -->\n' +
  '  <p id="idMetaWebpage_path"><span class="clsColorGreen">page-wholepath</span>:\n' +
  '    <a class="clsPreview" href="../../index.html#idOverview">synagonism.net</a> /\n' +
  '    <a class="clsPreview" href="../Mcsh000000.last.html#idOverview">worldviewSngo</a> /\n' +
  '    <a class="clsPreview" href="../' + sDir + '/Mcsh' + sDirShort + '000000.last.html#idOverview">' + sDir + '</a> /\n' +
  '    ' + sNameFormal + '\n' +
  '    </p>\n' +
  '  <p id="idMetaP1">SEARCH::\n' +
  '    <br>· this page uses \'<span class="clsColorRed">locator-names</span>\', names that when you find them, you find the-LOCATION of the-concept they denote.\n' +
  '    <br>⊛ <strong>GLOBAL-SEARCH</strong>:\n' +
  '    <br>· clicking on <span class="clsColorGreenBg">the-green-BAR of a-page</span> you have access to the-global--locator-names of my-site.\n' +
  '    <br>· use the-prefix \'<span class="clsColorRed">' + sNameFormal + '</span>\' for <a class="clsPreview" href="../dirCor/McshCor000002.last.html#idOverview">senso-concepts</a> related to current concept \'' + sNameInformal + '\'.\n' +
  '    <br>⊛ <strong>LOCAL-SEARCH</strong>:\n' +
  '    <br>· TYPE <span class="clsColorRed">CTRL+F "McsLang.words-of-concept\'s-name"</span>, to go to the-LOCATION of the-concept.\n' +
  '    <br>· a-preview of the-description of a-global-name makes reading fast.\n' +
  '    <a class="clsHide" href="#idMetaP1"></a></p>\n' +
  '  <p id="idFooterP1">footer::\n' +
  '    <br>• author: <a class="clsPreview" href="../dirHmn/McshHmn000003.last.html#idOverview">Kaseluris.Nikos.1959</a>\n' +
  '    <br>• email:\n' +
  '    <br> &nbsp;<img src="../../dirRsc/dirImg/mail.png" alt="mail">\n' +
  '    <br>• edit on github: https://github.com/synagonism/dirMcsh/blob/master/' + sDir +'/' + sNameFile + ',\n' +
  '    <br>• comments on <a class="clsPreview" href="../' + sDir + '/Mcsh' + sDirShort + '000000.last.html#idComment">Disqus</a>,\n' +
  '    <br>• twitter: <a href="https://twitter.com/synagonism">@synagonism</a>,\n' +
  '    <a class="clsHide" href="#idFooterP1"></a></p>\n' +
  '  <p id="idMetaVersion">webpage-versions::\n' +
  '    <br>• version.last.dynamic: <a class="clsPreview" href="../' + sDir + '/' + sNameFile + '">' + sNameFile + '</a>,\n' +
  '    <br>• version.draft.creation: ' + sNameFileNaked + '.0-1-0.' + moUtil.fDateYMD() + '.last.html,\n' +
  '    <a class="clsHide" href="#idMetaVersion"></a></p>\n' +
  '  </section>\n' +
  '\n' +
  '  <section id="idSupport">\n' +
  '  <h1 id="idSupportH1">support (<a class="clsPreview" href="../../index.html#idSupport">link</a>)</h1>\n' +
  '  <p></p>\n' +
  '  </section>\n' +
  '\n' +
  '  <script type="module">\n' +
  '    import * as omMcsh from \'/dirMcshmgr/mMcsh2.js\'\n' +
  '  </script>\n' +
  '  <!-- Global site tag (gtag.js) - Google Analytics -->\n' +
  '  <script async src="https://www.googletagmanager.com/gtag/js?id=G-N8T0MHWLS1"></script>\n' +
  '  <script>\n' +
  '    window.dataLayer = window.dataLayer || [];\n' +
  '    function gtag(){dataLayer.push(arguments);}\n' +
  '    gtag(\'js\', new Date());\n' +
  '    gtag(\'config\', \'G-N8T0MHWLS1\');\n' +
  '  </script>\n' +
  '  <!--    -->\n' +
  '</body>\n' +
  '</html>'

moFs.writeFileSync(sDir + '/' + sNameFile, s)

if (bCounter) {
  moFs.writeFileSync('../dirPgm/dirCntr/dirCntrfiles/' + sNameFileNaked + '.txt', '1')
}

// add file to aPages
aPages.push([sNameFileNaked+'.txt', sNameInformal])
aPages.sort((aA, aB) => {
  return aA[0] > aB[0] ? 1 : -1
})
moUtil.fWriteJsonArray('../dirMcsh/SitePagesArr.json', aPages)

// index new file
fNamidx(sDir + '/' + sNameFile)

//add extra files to upload
let aSftp = JSON.parse(moFs.readFileSync('../dirMcsh/dirManager/sftp.json'))
aSftp.push('../dirMcsh/SitePagesArr.json')
aSftp.push('../dirPgm/dirCntr/dirCntrfiles/' + sNameFileNaked + '.txt')
moUtil.fWriteJsonArray('../dirMcsh/dirManager/sftp.json', aSftp)
//upload files (argv[7] = SFTP password, supplied by the VS Code task prompt)
fSftp(process.argv[7])