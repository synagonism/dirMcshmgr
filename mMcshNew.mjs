/*
 * mMcshNew.mjs - it creates a-new file McsHitp-senso-concept
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
 *     - updates SitePagesArr.json//dirMcsh
 *     - creates McsDir000000.txt
 *     - indexes new file
 *     - uploads new and modified files
 * INPUT:
 * OUTPUT: McsDir000000.last.html
 * RUN from dirMcsh:
 *  node ../dirMcshmgr/mMcshNew.mjs <sDir> <sNameInformal> <sNameMain> <sNameId> <true|false>
 *  with a-sect-concept to move into the-new file (see mMcshSectMove.mjs):
 *  node ../dirMcshmgr/mMcshNew.mjs <sDir> <sNameInformal> <sNameMain> <sNameId> <true|false> <sPassword> <sFileOld> <sIdSect> [--no-upload]
 *
 * ISSUE: IF you want to recreate the-file,
 * you have to delete IT from SitePagesArr.json
 */

import moFs from 'fs'
import * as moUtil from './mUtil.mjs'
import {fNamidx} from './mNamidx.mjs'
import {fSftp, fAskHidden} from './mSftp.mjs'
import {fPlanSectMove, fReadRawOther} from './mMcshSectMove.mjs'

const
  // contains the-versions of mHitp.js
  aVersion = [
    'mMcshNew.mjs.1-11-0.2026-10-30: moves a-sect-concept into the-new file (Make-current-file)',
    'mMcshNew.mjs.1-10-0.2026-10-19: tree-names with underscore _Wltr|_Sptr|_Prtr|_Chtr|_Pntr|Sympan_Wltr',
    'mMcshNew.mjs.1-9-0.2026-10-19: tree-ids gntr|chtr|wltr|prtr, child-tree::, entity_Gntr, names -Wltr|-Sptr|-Prtr|-Chtr|-Pntr|Sympan-Wltr',
    'mMcshNew.mjs.1-8-0.2026-09-30: entity-gtr|Sympan-wtr',
    'mMcshNew.mjs.1-7-0.2026-09-29: pc|wp|gs trees',
    'mMcshNew.mjs.1-6-0.2026-09-24: prompt password when run alone',
    'mMcshNew.mjs.1-5-0.2026-09-24: mMcshNew',
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

  //1. Directory of the-concept dirCor|dirEdu|dirHlth|dirHmn|dirLag|dirNtr|
  //   dirOgm|dirStn|dirStnlaw|dirTch|dirTchPrgm|dirTchInf
  sDir = 'dirHmn',

  //2. Name of the-title: Ethereum--blockchain-net
  sNameInformal = 'Human A',

  //3. SHORT-name: sysNet, ogn, DnChain, DnEth, Dchain-net, lagoSngu,
  sNameMain = 'humnA',

  //4. Name for IDs, unique in this file: Net, Dtc, LTurk, SocGrca,
  sNameId = 'HumnA',

  //5. Add counter or not
  bCounter = true,

  sNameFile = '',
  sNameFileNaked = '',
  SitePagesArr,
  nFile = 0,
  sDirShort = sDir.substring(3)


// INPUT VALUES may be supplied as CLI args (VS Code task inputs); else defaults above.
// argv[2]=sDir  argv[3]=sNameInformal  argv[4]=sNameMain  argv[5]=sNameId  argv[6]=bCounter
if (process.argv[2]) sDir          = process.argv[2]
if (process.argv[3]) sNameInformal = process.argv[3]
if (process.argv[4]) sNameMain   = process.argv[4]
if (process.argv[5]) sNameId       = process.argv[5]
if (process.argv[6]) bCounter      = process.argv[6] === 'true'
sDirShort = sDir.substring(3)


SitePagesArr = JSON.parse(moFs.readFileSync('../dirMcsh/SitePagesArr.json'))

// find file-name
for (n = 0; n < SitePagesArr.length; n++) {
  //SitePagesArr contains the-counter files
  if (new RegExp('^Mcsh'+sDirShort+'[0-9]+\.txt').test(SitePagesArr[n][0])) nFile = nFile + 1
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
  '  <title>Mcs.' + sNameMain + '!=' + sNameInformal + '\n' +
  '    (' + sNameFileNaked + '.0-1-0.' + moUtil.fDateYMD() + ' draft)</title>\n' +
  '  <meta name="keywords" content="' + sNameInformal + ', ' + sNameMain + ', modelConceptSenso, McsHitp, Synagonism">\n' +
  '  <link rel="stylesheet" href="/dirMcshmgr/mMcsh2.css">\n' +
  '</head>\n' +
  '\n' +
  '<body>\n' +
  '  <header id="idHeader">\n' +
  '  <p></p>\n' +
  '  <h1 id="idHeaderH1">' + sNameInformal + '\n' +
  '    <br>senso-concept-Mcs (' + sNameMain + ')\n' +
  '    </h1>\n' +
  '  </header>\n' +
  '\n' +
  '  <section id="idOverview">\n' +
  '  <h1 id="idOverviewH1">overview of ' + sNameMain + '\n' +
  '    <a class="clsHide" href="#idOverviewH1"></a></h1>\n' +
  '  <p id="idDescription">description::\n' +
  '    <br>× Mcsh-creation: {' + moUtil.fDateYMD() + '}\n' +
  '    <br>· \n' +
  '    <a class="clsHide" href="#idDescription"></a></p>\n' +
  '  <p id="idName">name::\n' +
  '    <br>* McshEngl.' + sNameInformal + '!⇒' + sNameMain + ',\n' +
  '    <br>* McshEngl.' + sNameMain + '!=' + sNameInformal + ',\n' +
  '    <br>* McshEngl.' + sNameMain + '!@' + sNameFileNaked + ',\n' +
  '    <br>* McshEngl.' + sNameFile + '//' + sDir + '//dirMcsh!⇒' + sNameMain + ',\n' +
  '    <br>* McshEngl.' + sDir + '//dirMcsh!⇒' + sNameMain + ',\n' +
  '    <br>* McshEngl.' + sDir +'/' + sNameFile + '!⇒' + sNameMain + ',\n' +
  '    <a class="clsHide" href="#idName"></a></p>\n' +
  '  </section>\n' +
  '\n' +
  '  <section id="' + sNameId + 'irsc">\n' +
  '  <h1 id="' + sNameId + 'irscH1">info-resource of ' + sNameMain + '\n' +
  '    <a class="clsHide" href="#' + sNameId + 'irscH1"></a></h1>\n' +
  '  <p id="' + sNameId + 'irscdsn">description::\n' +
  '    <br>* \n' +
  '    <a class="clsHide" href="#' + sNameId + 'irscdsn"></a></p>\n' +
  '  <p id="' + sNameId + 'irscnam">name::\n' +
  '    <br>* McshEngl.' + sNameMain + '\'InfRsc,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'irscnam"></a></p>\n' +
  '  </section>\n' +
  //'\n' +
  //'  <section id="' + sNameId + 'srtr">\n' +
  //'  <h1 id="' + sNameId + 'srtrH1">structure of ' + sNameMain + '\n' +
  //'    <a class="clsHide" href="#' + sNameId + 'srtrH1"></a></h1>\n' +
  //'  <p id="' + sNameId + 'srtrnam">name::\n' +
  //'    <br>* McshEngl.' + sNameMain + '\'structure,\n' +
  //'    <a class="clsHide" href="#' + sNameId + 'srtrnam"></a></p>\n' +
  //'  <p id="' + sNameId + 'srtrdsn">description::\n' +
  //'    <br>* \n' +
  //'    <a class="clsHide" href="#' + sNameId + 'srtrdsn"></a></p>\n' +
  //'  </section>\n' +
  '\n' +
  '  <section id="' + sNameId + 'dong">\n' +
  '  <h1 id="' + sNameId + 'dongH1">DOING of ' + sNameMain + '\n' +
  '    <a class="clsHide" href="#' + sNameId + 'dongH1"></a></h1>\n' +
  '  <p id="' + sNameId + 'dongdsn">description::\n' +
  '    <br>× Mcsh-creation: {' + moUtil.fDateYMD() + '}\n' +
  '    <br>* \n' +
  '    <a class="clsHide" href="#' + sNameId + 'dongdsn"></a></p>\n' +
  '  <p id="' + sNameId + 'dongnam">name::\n' +
  '    <br>* McshEngl.' + sNameMain + '\'doing,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'dongnam"></a></p>\n' +
  '  </section>\n' +
  '\n' +
  '  <section id="' + sNameId + 'evog">\n' +
  '  <h1 id="' + sNameId + 'evogH1">evoluting of ' + sNameMain + '\n' +
  '    <a class="clsHide" href="#' + sNameId + 'evogH1"></a></h1>\n' +
  '  <p id="' + sNameId + 'evogdsn">description::\n' +
  '    <br>× Mcsh-creation: {' + moUtil.fDateYMD() + '}\n' +
  '    <br>· creation of current <a class="clsPreview" href="../dirTchInf/McshTchInf000009.last.html#idMcsHitp">concept</a>.\n' +
  '    <a class="clsHide" href="#' + sNameId + 'evogdsn"></a></p>\n' +
  '  <p id="' + sNameId + 'evognam">name::\n' +
  '    <br>* McshEngl.evoluting-of-' + sNameMain + ',\n' +
  '    <br>* McshEngl.' + sNameMain + '\'evoluting,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'evognam"></a></p>\n' +
  '  </section>\n' +
  '\n' +
  '  <section id="' + sNameId + 'pctr">\n' +
  '  <h1 id="' + sNameId + 'pctrH1">PARENT-CHILD-TREE of ' + sNameMain + '\n' +
  '    <a class="clsHide" href="#' + sNameId + 'pctrH1"></a></h1>\n' +
  '  <p id="' + sNameId + 'pctrdsn">description::\n' +
  '    <br>× Mcsh-creation: {' + moUtil.fDateYMD() + '}\n' +
  '    <a class="clsHide" href="#' + sNameId + 'pctrdsn"></a></p>\n' +
  '  <p id="' + sNameId + 'pctrnam">name::\n' +
  '    <br>* McshEngl.' + sNameMain + '\'parent_child_tree,\n' +
  '    <br>* McshEngl.' + sNameMain + '\'child_parent_tree,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'pctrnam"></a></p>\n' +
  '  <p id="' + sNameId + 'pntr">parent-tree::\n' +
  '    <br>* McshEngl.' + sNameMain + '_Pntr,\n' +
  '    <br>===\n' +
  '    <a class="clsHide" href="#' + sNameId + 'pntr"></a></p>\n' +
  '  <p id="' + sNameId + 'chtr">child-tree::\n' +
  '    <br>* McshEngl.' + sNameMain + '_Chtr,\n' +
  '    <br>===\n' +
  '    <a class="clsHide" href="#' + sNameId + 'chtr"></a></p>\n' +
  '  </section>\n' +
  '\n' +
  '  <section id="' + sNameId + 'wptr">\n' +
  '  <h1 id="' + sNameId + 'wptrH1">WHOLE-PART-TREE of ' + sNameMain + '\n' +
  '    <a class="clsHide" href="#' + sNameId + 'wptrH1"></a></h1>\n' +
  '  <p id="' + sNameId + 'wptrdsn">description::\n' +
  '    <br>× Mcsh-creation: {' + moUtil.fDateYMD() + '}\n' +
  '    <a class="clsHide" href="#' + sNameId + 'wptrdsn"></a></p>\n' +
  '  <p id="' + sNameId + 'wptrnam">name::\n' +
  '    <br>* McshEngl.' + sNameMain + '\'whole_part_tree,\n' +
  '    <br>* McshEngl.' + sNameMain + '\'part_whole_tree,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'wptrnam"></a></p>\n' +
  '  <p id="' + sNameId + 'wltr">whole-tree::\n' +
  '    <br>* McshEngl.' + sNameMain + '_Wltr,\n' +
  '    <br>===\n' +
  '    <br>* ... Sympan_Wltr.\n' +
  '    <a class="clsHide" href="#' + sNameId + 'wltr"></a></p>\n' +
  '  <p id="' + sNameId + 'prtr">part-tree::\n' +
  '    <br>* McshEngl.' + sNameMain + '_Prtr,\n' +
  '    <br>===\n' +
  '    <a class="clsHide" href="#' + sNameId + 'prtr"></a></p>\n' +
  '  </section>\n' +
  '\n' +
  '  <section id="' + sNameId + 'gstr">\n' +
  '  <h1 id="' + sNameId + 'gstrH1">GENERIC-SPECIFIC-TREE of ' + sNameMain + '\n' +
  '    <a class="clsHide" href="#' + sNameId + 'gstrH1"></a></h1>\n' +
  '  <p id="' + sNameId + 'gstrdsn">description::\n' +
  '    <br>× Mcsh-creation: {' + moUtil.fDateYMD() + '}\n' +
  '    <a class="clsHide" href="#' + sNameId + 'gstrdsn"></a></p>\n' +
  '  <p id="' + sNameId + 'gstrnam">name::\n' +
  '    <br>* McshEngl.' + sNameMain + '\'generic_specific_tree,\n' +
  '    <br>* McshEngl.' + sNameMain + '\'specific_generic_tree,\n' +
  '    <a class="clsHide" href="#' + sNameId + 'gstrnam"></a></p>\n' +
  '  <p id="' + sNameId + 'gntr">generic-tree::\n' +
  '    <br>* McshEngl.' + sNameMain + '_Gntr,\n' +
  '    <br>===\n' +
  '    <br>* ...entity_Gntr.\n' +
  '    <a class="clsHide" href="#' + sNameId + 'gntr"></a></p>\n' +
  '  <p id="' + sNameId + 'sptr">specific-tree::\n' +
  '    <br>* McshEngl.' + sNameMain + '_Sptr,\n' +
  '    <br>===\n' +
  '    <a class="clsHide" href="#' + sNameId + 'sptr"></a></p>\n' +
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
  '    ' + sNameMain + '\n' +
  '    </p>\n' +
  '  <p id="idMetaP1">SEARCH::\n' +
  '    <br>· this page uses \'<span class="clsColorRed">locator-names</span>\', names that when you find them, you find the-LOCATION of the-concept they denote.\n' +
  '    <br>⊛ <strong>GLOBAL-SEARCH</strong>:\n' +
  '    <br>· clicking on <span class="clsColorGreenBg">the-green-BAR of a-page</span> you have access to the-global--locator-names of my-site.\n' +
  '    <br>· use the-prefix \'<span class="clsColorRed">' + sNameMain + '</span>\' for <a class="clsPreview" href="../dirCor/McshCor000002.last.html#idOverview">senso-concepts</a> related to current concept \'' + sNameInformal + '\'.\n' +
  '    <br>⊛ <strong>LOCAL-SEARCH</strong>:\n' +
  '    <br>· TYPE <span class="clsColorRed">CTRL+F "McshLang.words-of-concept\'s-name"</span>, to go to the-LOCATION of the-concept.\n' +
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

// a-sect-concept to move: we plan it BEFORE we write anything.
// argv[8]=sFileOld  argv[9]=sIdSect  argv[10]=--no-upload
const
  sFileOld = process.argv[8],
  sIdSect = process.argv[9],
  bUpload = process.argv[10] !== '--no-upload'
let oMove = null
if (sFileOld) {
  try {
    if (moFs.existsSync(sDir + '/' + sNameFile)) throw new Error(sNameFile + ' exists')
    oMove = fPlanSectMove({
      sRawOld: moFs.readFileSync(sFileOld, 'utf8'),
      sRawNew: s,
      sIdSect,
      sIdNew: sNameId,
      sFileOld,
      sFileNew: sDir + '/' + sNameFile,
      sNameMain,
      oRawOther: fReadRawOther('.', sFileOld)
    })
  } catch (oErr) {
    console.error('Make-current-file, NOTHING written: ' + oErr.message)
    process.exit(1)
  }
  s = oMove.sRawNew
}

moFs.writeFileSync(sDir + '/' + sNameFile, s)
if (oMove) {
  moFs.writeFileSync(sFileOld, oMove.sRawOld)
  for (const sPath of Object.keys(oMove.oRawOther)) moFs.writeFileSync(sPath, oMove.oRawOther[sPath])
}

if (bCounter) {
  moFs.writeFileSync('../dirPgm/dirCntr/dirCntrfiles/' + sNameFileNaked + '.txt', '1')
}

// add file to SitePagesArr
SitePagesArr.push([sNameFileNaked+'.txt', sNameInformal])
SitePagesArr.sort((aA, aB) => {
  return aA[0] > aB[0] ? 1 : -1
})
moUtil.fWriteJsonArray('../dirMcsh/SitePagesArr.json', SitePagesArr)

// index new file
fNamidx(oMove ? [sDir + '/' + sNameFile, sFileOld] : sDir + '/' + sNameFile)

//add extra files to upload
let aSftp = JSON.parse(moFs.readFileSync('../dirMcsh/dirManager/sftp.json'))
aSftp.push('../dirMcsh/SitePagesArr.json')
aSftp.push('../dirPgm/dirCntr/dirCntrfiles/' + sNameFileNaked + '.txt')
if (oMove) aSftp.push(...Object.keys(oMove.oRawOther))
moUtil.fWriteJsonArray('../dirMcsh/dirManager/sftp.json', aSftp)
if (!bUpload) process.exit(0)
//upload files (argv[7] = SFTP password from the VS Code task; else prompt when run alone)
let sSftpPwd = process.argv[7]
if (!sSftpPwd) sSftpPwd = await fAskHidden('Enter password: ')
fSftp(sSftpPwd)