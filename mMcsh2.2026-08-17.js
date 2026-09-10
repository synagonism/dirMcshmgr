/*
 * mMcsh2.js - module McsHitp webpage-format code.
 * The MIT License (MIT)
 *
 * Copyright (c) 2010-2026 Kaseluris.Nikos.1959 (hmnSngu)
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

 * name-languages:
 * 0 English (Engl, F2)
 * 1 Sinagu (Sngu, Shift+F2)
 * 2 Greek (Elln, Ctrl+F2)
 * 3 Chinese (Zhon, Alt+F2)
 * 4 ---
 * 5 Albanian (Sqip)
 * 6 Arabic (Arab)
 * 7 Esperanto (Espo)
 * 8 French (Frac)
 * 9 German (Deut)
 * 10 GreekAncient (Ella)
 * 11 Hindi (Hind)
 * 12 Italian (Itln)
 * 13 Japanese (Jpns)
 * 14 Khmer (Khmr)
 * 15 Korean (Kora)
 * 16 Romanian (Romn)
 * 17 SlavoBosnian (Sbos)
 * 18 SlavoCroatian (Shrv)
 * 19 SlavoMondenegrin (Scnr)
 * 20 SlavoSerbian (Ssrp)
 * 21 SlavoBulgarian (Sbul)
 * 22 SlavoMacedonian (Smkd)
 * 23 SlavoRussian (Srus)
 * 24 SlavoSlovenian (Sslv)
 * 25 Spanish (Span)
 * 26 Turkish (Turk)
 * 27 Vietnamese (Vnma)
 */

const
  // contains the-versions of mMcsh.js
  aVersion = [
    'mMcsh2.js.24-8-3.2026-08-17: ooFile_cnpt',
    'mMcsh2.js.24-8-2.2026-08-09: web-apps',
    'mMcsh2.js.24-8-1.2026-07-31: search-selected',
    'mMcsh2.js.24-8-0.2026-07-01: aoFile_cnpt',
    'mMcsh2.js.24-7-0.2026-02-03: Khmer-language',
    'mMcsh2.js.24-6-1.2026-01-31: currencies',
    'mMcsh2.js.24-6-0.2026-01-21: Kora fron Korn',
    'mMcsh2.js.24-5-0.2026-01-19: menu Japanese-Korean',
    'mMcsh2.js.24-4-0.2026-01-15: Korean-language',
    'mMcsh2.js.24-3-0.2025-12-28: Japanese-language',
    'mMcsh2.js.24-2-0.2025-12-15: oEltCnrTopTitleP listener',
    'mMcsh2.js.24-1-0.2025-12-13: cyan-link',
    'mMcsh2.js.24-0-0.2025-12-06: dark mode',
    'mMcsh2.js.23-1-0.2025-12-03: title search',
    'mMcsh2.js.23-0-0.2025-11-29: audio players',
    'mMcsh2.js.22-7-0.2025-11-21: language apps',
    'mMcsh2.js.22-6-1.2025-11-08: δ,θ',
    'mMcsh2.js.22-6-0.2025-11-06: EnglVerbFormFinder',
    'mMcsh2.js.22-5-0.2025-11-05: insert no keyboard chars',
    'mMcsh2.js.22-4-0.2025-11-02: oEltTabSearchIpt with arrow down|up, EnglNounFormFinder',
    'mMcsh2.js.22-3-3.2025-10-30: fSearchName',
    'mMcsh2.js.22-3-2.2025-10-29: clean-name-search',
    'mMcsh2.js.22-3-1.2025-10-26: TitleP, SearchIcn, fFetchSiteMenu',
    'mMcsh2.js.22-2-1.2025-10-25: fFetchSiteMenu',
    'mMcsh2.js.22-2-0.2025-10-23: WebApps',
    'mMcsh2.js.22-1-0.2025-10-20: fixes, more menu languages',
    'mMcsh2.js.22-0-0.2025-10-20: fCmdQueryInput, fExpandSelectionRight',
    'mMcsh2.js.21-4-0.2025-10-19: fChooseInputLanguage not working',
    'mMcsh2.js.21-3-1.2025-10-18: wait first suggestion',
    'mMcsh2.js.21-2-0.2025-10-17: DoubleClick query name and preview first, esc remove',
    'mMcsh2.js.21-1-0.2025-10-16: parent-child names',
    'mMcsh2.js.21-0-0.2025-10-15: open http',
    'mMcsh2.js.20-3-0.2025-10-14: expand selection',
    'mMcsh2.js.20-2-0.2025-10-12: one-click on non-preview links',
    'mMcsh2.js.20-1-0.2025-10-08: enter on search',
    'mMcsh2.js.20-0-0.2025-10-06: menu, query-selection, one-click',
    'mMcsh.js.19-24-0.2025-08-03: SlavoBcms',
    'mMcsh.js.19-23-0.2025-08-02: SlavoMacedonian',
    'mMcsh.js.19-22-0.2025-08-01: SlavoSlovenian',
    'mMcsh.js.19-21-0.2025-07-27: Slovenian',
    'mMcsh.js.19-20-0.2025-07-26: Romanian',
    'mMcsh.js.19-19-0.2025-06-04: Russian',
    'mMcsh.js.19-18-0.2025-05-10: [ escaped for search',
    'mMcsh.js.19-17-0.2025-05-07: Hindi',
    'mMcsh.js.19-16-0.2025-04-30: Arabic',
    'mMcsh.js.19-15-0.2025-04-20: Spanish',
    'mMcsh.js.19-14-0.2025-04-17: Toc on CLICK content: remove line 1575 fEvtMouseoverContent',
    'mMcsh.js.19-13-0.2025-03-16: Albanian, Bulgarian',
    'mMcsh.js.19-12-0.2025-02-24: German',
    'mMcsh.js.19-11-3.2025-02-10: Chinese Alt+F2',
    'mMcsh.js.19-11-2.2025-02-06: lang shortcuts',
    'mMcsh.js.19-11-1.2025-02-04: lang shortcuts',
    'mMcsh.js.19-11-0.2025-02-02: Italian',
    'mMcsh.js.19-10-0.2025-01-29: lagVnma',
    'mMcsh.js.19-9-3.2024-03-10: suggest on space -',
    'mMcsh.js.19-9-2.2023-08-28: suggest on space @',
    'mMcsh.js.19-9-1.2023-08-17: suggest on space ;',
    'mMcsh.js.19-9-0.2023-07-14: suggest on space',
    'mMcsh.js.19-8-1.2023-07-01: navigation-animation',
    'mMcsh.js.19-8-0.2022-12-11: TriUl',
    'mMcsh.js.19-7-0.2022-12-10: fTriUlExpandLevel1',
    'mMcsh.js.19-6-0.2022-10-24: Turk-Alt+F3',
    'mMcsh.js.19-5-0.2022-10-17: lagEspo',
    'mMcsh.js.19-4-0.2022-10-16: lagTurk',
    'mMcsh.js.19-3-0.2022-04-19: Ella-Alt+F2',
    'mMcsh.js.19-2-0.2022-04-04: fSearchname',
    'mMcsh.js.19-1-0.2022-03-21: charRest-reference',
    'mMcsh.js.19-0-0.2022-03-20: Mcsh',
    'mHitp.js.18-10-0.2022-03-19: phoneme-events',
    'mHitp.js.18-9-1.2022-03-14: phonemes',
    'mHitp.js.18-9-0.2022-01-30: codepoints',
    'mHitp.js.18-8-1.2022-01-15: name-language',
    'mHitp.js.18-8-0.2022-01-07: lagElla',
    'mHitp.js.18-7-0.2021-12-31: lagEspo',
    'mHitp.js.18-6-0.2021-11-25: popup on content',
    'mHitp.js.18-5-1.2021-11-19: popup left',
    'mHitp.js.18-5-0.2021-11-19: create treeUl on preview',
    'mHitp.js.18-4-0.2021-11-17: Shift+1 codepoint',
    'mHitp.js.18-3-1.2021-11-16: supplementary-chars',
    'mHitp.js.18-3-0.2021-11-14: Chinese codepoints',
    'mHitp.js.18-2-1.2021-11-10: index without ;',
    'mHitp.js.18-2-0.2021-11-07: root-char sequence or not',
    'mHitp.js.18-1-1.2021-08-13: // total NAMES',
    'mHitp.js.18-1-0.2021-05-30: ctrl+F3',
    'mHitp.js.18-0-0.2021-05-25: module',
    'hitp.js.17-7-7.2021-04-28: dirMcsh',
    'hitp.js.17-7-6.2021-04-02: dirMcsh',
    'hitp.js.17-7-5.2021-04-02: lagLang',
    'hitp.js.17-7-4.2021-04-01: langoSinago-path',
    'hitp.js.17-7-3.2021-01-04: langoSinago',
    'hitp.js.17-7-2.2020-05-24: Greek search accents',
    'hitp.js.17-7-1.2020-05-05: F2, ctrl+F2',
    'hitp.js.17-6-2.2019-12-14: site-search',
    'hitp.js.17-6-1.2019-09-09: search-info',
    'hitp.js.17-6-0.2019-09-08: langoKomo-sensorial-concept',
    'hitp.js.17-5-0.2019-09-01: langoKamo',
    'hitp.js.17-4-0.2019-08-28: scrollTop',
    'hitp.js.17-3-0.2019-02-19.2019-03-05: main-name-searching',
    'hitp.js.17-2-1.2018-10-08: filMcs.last.html',
    'hitp.js.17-2-0.2018-09-21: name-notation',
    'hitp.js.17-1-0.2018-09-16: location.hash',
    'hitp.js.17-0-1.2018-09-15: home-icon',
    'hitp.js.17-0-0.2018-09-15: search-scalability',
    'hitp.js.16-5-2.2018-01-23',
    'hitp.js.16-5-1.2018-01-06: Đchain-network',
    'hitp.js.16-5-0.2017-11-10: arrow keys in search',
    'hitp.js.16-4-2.2017-10-17: no type-ahead in search',
    'hitp.js.16-4-1.2017-06-23: greek search',
    'hitp.js.16-3-5.2017-06-18: type after type-ahead, title-help, cnrInf-width',
    'hitp.js.16-2-0.2017-06-07: search-toc-show-easy',
    'hitp.js.16-1-2.2017-06-07: search-icon',
    'hitp.js.16.2017-06-05.search (15-6): hitp.16.2017-06-05.js',
    'hitp.js.15.2016-10-27.any-machine (14-9): hitp.15.2016-10-27.js',
    'hitp.js.14.2016-06-09.table-content-tree (13): hitp.14.2016-06-09.js',
    'hitp.js.13.2016-06-07.preview (12-11): hitp.13.2016-06-07.js',
    'hitp.js.12.2016-01-24.toc-icn-img (11.9): hitp.2016.01.24.12.js',
    'hitp.js.11.2015-10-26.preferences: hitp.2015.10.26.11.js',
    'hitp.js.10.2014-08-05.valuenames: hitp.2014.08.05.10.js',
    'hitp.js.9.2014-08-02.no-jQuery: hitp.2014.08.02.9.js',
    'hitp.js.8.2014-01-09.toc-on-hovering: hitp.2014.01.09.8.js',
    'hitp.js.7.2013-11-06.tabs: hitp.2013.11.06.7.js',
    'hitp.js.6.2013-08-21.site-structure: hitp.2013.08.21.6.js',
    'hitp.js.previous: hitp.2013.07.15.js (toc-ul-specific, hitp-obj)',
    'hitp.js.previous: /hitp/hitp.2013.06.29.js (hitp-dir)',
    'hitp.js.previous: toc.2013.05.30.js (section id)',
    'hitp.js.previous: toc.2013.04.19.js (JSLint ok)',
    'hitp.js.previous: toc.2013.04.14.js (preview links)',
    'hitp.js.previous: toc.2013.04.07.js (button expand|collapse)',
    'hitp.js.previous: toc.2013.04.05.js (toc scrolls to highlited)',
    'hitp.js.previous: toc.2013.04.04.js (goes click location)',
    'hitp.js.previous: toc.2013.04.01.js (toc on any browser)',
    'hitp.js.previous: 2010.12.06 (toc on chrome)'
  ],
  bEdge = navigator.userAgent.indexOf('Edg/') > -1,
  bFirefox = navigator.userAgent.indexOf('Firefox/') > -1

let
  // contains the-array of the-array of the-name-index-files of all languages of the-names
  // of senso-concepts [["lagEngl01ei","A|a"]]
  aaNamidxfileRoot,
  aaSuggestions = [[]],
  ooFile_cnpt = {}, // {sNameIdRela: oFile_cnpt}

  // % of window width of pageinfo-container
  nCfgPageinfoWidth = 30,

  // holds the-object of the-Html-element a-user clicks on
  oEltClicked =  document.body,
  // holds the-site-structure
  sEltSitemenuUl,
  oEltCnrPreviewDiv = document.createElement('div'),

  // filSite-structure contains absolute urls, because we see it from many pages.
  // Then we must-know the-homepage of the-site and create different menus.
  sCfgHomeLocal,
  // the-index-file to search first
  sIdxfile,
  // current search-index
  sIdxFrom,
  // next search-index
  sIdxTo,
  sPathSite,
  sPathSitemenu,
  // selector for elements with clsClickCnt
  sQrslrAClk,
  sQrslrAClkLast

/**
 * Creates new containers and inserts them in the-body-element:
 * - Top-cnr for title and menus.
 * - Main-cnr for page-info and page-content.
 * - Width-cnr for managing the-width of page-info.
 * - Site-cnr for containing the-site-strucute.
 * - Preview-cnr to display link-previews.
 */
let fContainersInsert = function () {
  let
    fEvtLink,
    fEvtContentClick,
    fEvtMouseoverContent,
    oEltBody = document.body,
    // top-container with menu, home, title, search and width subcontainers,
    oEltCnrTopDiv = document.createElement('div'),
    oEltCnrTopTitleP = document.createElement('p'),
    oEltCnrTopWidthIcnI = document.createElement('i'),
    oEltCnrTopHomeIcnI = document.createElement('i'),
    oEltCnrTopMenuIcnI = document.createElement('i'),
    oEltCnrTopSearchIcnI,
    // main-container with page-content and page-info sub-containers,
    oEltCnrMainDiv = document.createElement('div'),
    oEltCnrMainContentDiv = document.createElement('div'),
    oEltCnrMainInfoDiv = document.createElement('div'),
    // extra containers,
    oEltCnrWidthDiv = document.createElement('div'),
    // Page-info-cnr: PathP, TabHeadersUl, TabCntDiv,
    oEltInfoPathP = document.createElement('p'),
    oEltTabHeaderUl = document.createElement('ul'),
    // Tab-content contains: TabCntToc, TabCntSrch,
    oEltTabContentDiv = document.createElement('div'),
    oEltTabTocDiv = document.createElement('div'),
    oEltTabTocExpBtn = document.createElement('input'),
    oEltTabTocCpsBtn = document.createElement('input'),
    oEltTabTocPrfDiv = document.createElement('div'),
    oEltTabTocNotP = document.createElement('p'),
    oEltTabSearchDiv,
    oEltTabSearchLbl,
    oEltTabSearchSlct,
    oEltTabSearchP,
    oEltTabSearchLblChk,
    oEltTabSearchPPnm,
    oEltTabSearchIpt,
    oEltTabSearchOl,
    oEltCnrMenuDiv = document.createElement('div'),
    oEltMenuUl = document.createElement('ul'),
    sContentOriginal = oEltBody.innerHTML,
    sIdTabActive,
    sTabSearchOl = ''

  function fCnrSearchShow() {
    // Remove active-class from first-child-elt of PginfTabHeaders
    document.getElementById('idPginfTabHeadersUl')
      .firstElementChild.classList.remove('clsTabActive')
    // Add active-class on second-child-element of PginfTabHeaders
    document.getElementById('idPginfTabHeadersUl')
      .childNodes[1].classList.add('clsTabActive')
    // Hide tab-content from TabCntToc
    document.getElementById('idTabCntTocDiv').style.display = 'none'
    // Show tab-content on TabCntSrch
    document.getElementById('idTabCntSrchDiv').style.display = 'block'
    // on TabCntSrch focus input-element
    oEltTabSearchIpt.focus()
    oEltCnrMainInfoDiv.scrollTo(0, 0)
  }

  // localhost or online,
  sTabSearchOl =
    '<li>SEE ' +
      '<a class="clsPreview" href="' + sPathSite + 'dirMcsh/dirCor/McshCor000002.last.html#idMcsattNamcvn">name-notation--of-Mcs</a>.</li>' +
    '<li>TYPE a-name of ' +
      '<a class="clsPreview" href="' + sPathSite + 'dirMcsh/dirCor/McshCor000002.last.html#idOverview">a-senso-concept-Mcs</a> of ' +
      '<a class="clsPreview" href="' + sPathSite + 'dirMcsh/dirHmn/McshHmn000003.last.html#idOverview">Kaseluris.Nikos.1959-WORLDVIEW</a>.</li>' +
    '<li>some important concepts are: "<strong>char</strong>", ' +
      '"<strong>javascript</strong>", "<strong>human-language</strong>", ' +
      '"<strong>chain-net</strong>", ...</li>' +
    '<li>senso-concept-searching demonstrates THE-POWER of senso-concepts.' +
      '<br>· compare them with Google-WORD-search and Wikipedia-TEXT-entries.</li>' +
    '<li><a class="clsPreview" href="' + sPathSite + 'dirMcsh/dirHmn/McshHmn000003.last.html#idOverview">Kaseluris.Nikos.1959</a> works more than 30 years on senso-concepts. ' +
      '<br>· <a class="clsPreview" href="' + sPathSite + '#idSupport">support him</a> to continue publishing.</li>' +
    '<li>this site uses 3 types of searching:' +
      '<br>- word--site-search from Menu,' +
      '<br>- word--page-search by hitting Ctrl+F and' +
      '<br>- senso-concept--search here.</li>'

  oEltCnrTopSearchIcnI = document.createElement('i')
  oEltTabSearchDiv = document.createElement('div')
  oEltTabSearchLbl = document.createElement('label')
  oEltTabSearchSlct = document.createElement('select')
  oEltTabSearchP = document.createElement('p')
  oEltTabSearchLblChk = document.createElement('label')
  oEltTabSearchPPnm = document.createElement('p')
  oEltTabSearchIpt = document.createElement('input')
  oEltTabSearchOl = document.createElement('ol')
  sIdxfile = 'lagRoot' // the-index-file to search first
  sIdxFrom = '' // current search-index
  sIdxTo = '' // next search-index
  oEltCnrTopTitleP.setAttribute('title', 'clicking GREEN-BAR shows search-tab, clicking CONTENT shows Toc-tab')
  oEltCnrTopSearchIcnI.setAttribute('title', 'search-selected')
  oEltCnrTopSearchIcnI.setAttribute('class', 'clsFa clsFaSearch clsTopIcn clsColorWhite clsFloatRight clsPosRight')
  oEltCnrTopSearchIcnI.addEventListener('pointerdown', function (oEvtIn) {
    oEvtIn.preventDefault()
    fCmdQuerySelection()
  })
  oEltCnrTopDiv.id = 'idCnrTopDiv'
  oEltCnrMainDiv.id = 'idCnrMainDiv'

  // top-title-text
  oEltCnrTopTitleP.innerHTML = document.getElementsByTagName('title')[0].innerHTML
  oEltCnrTopTitleP.id = 'idTopTitleP'

  // width-icon
  oEltCnrTopWidthIcnI.setAttribute('title', 'width of page-info')
  oEltCnrTopWidthIcnI.setAttribute('class', 'clsFa clsFaArrowsH clsTopIcn clsColorWhite clsFloatRight clsTtp clsPosRight')
  // to show a-tooltip on an-element:
  // - set clsTtp on element
  // - set tooltip (<span class="clsTtp">Width of Page-Info</span>) inside the-element
  // - on element click add clsClicked and clsTtpShow
  oEltCnrTopWidthIcnI.innerHTML = '<span class="clsTtp">width of page-info</span>'
  oEltCnrTopWidthIcnI.addEventListener('click', function () {
    if (oEltCnrTopWidthIcnI.className.indexOf('clsClicked') > -1) {
      oEltCnrWidthDiv.style.display = 'none'
      oEltClicked.classList.remove('clsClicked', 'clsTtpShow', 'clsTriClicked')
    } else {
      oEltClicked.classList.remove('clsClicked', 'clsTtpShow', 'clsTriClicked')
      oEltClicked = oEltCnrTopWidthIcnI
      oEltCnrTopWidthIcnI.classList.add('clsClicked')
      oEltCnrWidthDiv.style.display = 'block'
    }
  })
  // width-content
  oEltCnrWidthDiv.id = 'idCnrWidthDiv'
  oEltCnrWidthDiv.innerHTML =
    '<fieldset><legend>Page-Info-width:</legend>' +
    '<input type="radio" id="idRdbWidth0" name="nameRdbWidth">0 %<br>' +
    '<input type="radio" id="idRdbWidth10" name="nameRdbWidth">10 %<br>' +
    '<input type="radio" id="idRdbWidth20" name="nameRdbWidth">20 %<br>' +
    '<input type="radio" id="idRdbWidth25" name="nameRdbWidth">25 %<br>' +
    '<input type="radio" id="idRdbWidth30" name="nameRdbWidth">30 %<br>' +
    '<input type="radio" id="idRdbWidth40" name="nameRdbWidth">40 %<br>' +
    '<input type="radio" id="idRdbWidth50" name="nameRdbWidth">50 %<br>' +
    '<input type="radio" id="idRdbWidth100" name="nameRdbWidth">100 %<br>' +
    '</fieldset>'
  oEltCnrTopDiv.appendChild(oEltCnrTopTitleP)
  oEltCnrTopDiv.appendChild(oEltCnrTopWidthIcnI)
  oEltCnrTopDiv.appendChild(oEltCnrTopSearchIcnI)
  oEltCnrTopTitleP.addEventListener('pointerdown', function (oEvtIn) {
    oEvtIn.preventDefault()
    oEltTabSearchIpt.value = ''
    oEltTabSearchOl.innerHTML = sTabSearchOl
    oEltTabSearchP.innerHTML = sTabSearchPSetText()
    sIdxfile = 'lagRoot'
    fCnrSearchShow()
    fCnrOntopRemove()
    //oEvtIn.preventDefault()
    //fCmdQuerySelection()
  })

  function fCnrOntopRemove() {
    oEltCnrPreviewDiv.style.display = 'none' // remove popup-cnr
    oEltCnrWidthDiv.style.display = 'none' // remove width-cnr
    oEltCnrMenuDiv.style.display = 'none' // remove menu-cnr
    oEltClicked.classList.remove('clsClicked', 'clsTtpShow', 'clsTriClicked') // remove tooltip clicks
  }

  // show toc-tab
  function fCnrTocShow() {
    // Remove active-class from second-child-elt of TabHeaders
    document.getElementById('idPginfTabHeadersUl')
      .childNodes[1].classList.remove('clsTabActive')
    // Add active-class on second-child-element of TabHeaders
    document.getElementById('idPginfTabHeadersUl')
      .childNodes[0].classList.add('clsTabActive')
    // Hide tab-search-content
    document.getElementById('idTabCntSrchDiv').style.display = 'none'
    // Show tab-toc-content
    document.getElementById('idTabCntTocDiv').style.display = 'block'
  }

  oEltBody.innerHTML = ''
  oEltBody.setAttribute('class', 'clsDark')
  oEltBody.appendChild(oEltCnrTopDiv)
  oEltBody.appendChild(oEltCnrMainDiv)
  oEltBody.appendChild(oEltCnrWidthDiv)
  document.getElementById('idRdbWidth0').addEventListener('click', function () {
    fWidthPginf(0)
    nCfgPageinfoWidth = 0
  })
  document.getElementById('idRdbWidth10').addEventListener('click', function () {
    fWidthPginf(10)
    nCfgPageinfoWidth = 10
  })
  document.getElementById('idRdbWidth20').addEventListener('click', function () {
    fWidthPginf(20)
    nCfgPageinfoWidth = 20
  })
  document.getElementById('idRdbWidth25').addEventListener('click', function () {
    fWidthPginf(25)
    nCfgPageinfoWidth = 25
  })
  document.getElementById('idRdbWidth30').addEventListener('click', function () {
    fWidthPginf(30)
    nCfgPageinfoWidth = 30
  })
  document.getElementById('idRdbWidth40').addEventListener('click', function () {
    fWidthPginf(40)
    nCfgPageinfoWidth = 40
  })
  document.getElementById('idRdbWidth50').addEventListener('click', function () {
    fWidthPginf(50)
    nCfgPageinfoWidth = 50
  })
  document.getElementById('idRdbWidth100').addEventListener('click', function () {
    fWidthPginf(100)
    nCfgPageinfoWidth = 100
  })
  if (nCfgPageinfoWidth === 0) {
    document.getElementById('idRdbWidth0').checked = true
  } else if (nCfgPageinfoWidth === 10) {
    document.getElementById('idRdbWidth10').checked = true
  } else if (nCfgPageinfoWidth === 20) {
    document.getElementById('idRdbWidth20').checked = true
  } else if (nCfgPageinfoWidth === 25) {
    document.getElementById('idRdbWidth25').checked = true
  } else if (nCfgPageinfoWidth === 30) {
    document.getElementById('idRdbWidth30').checked = true
  } else if (nCfgPageinfoWidth === 40) {
    document.getElementById('idRdbWidth40').checked = true
  } else if (nCfgPageinfoWidth === 50) {
    document.getElementById('idRdbWidth50').checked = true
  } else if (nCfgPageinfoWidth === 100) {
    document.getElementById('idRdbWidth100').checked = true
  }

  // adds click event, other than default, on input link-elements
  fEvtLink = function (oEltIn) {
    oEltIn.addEventListener('click', function (oEvtIn) {
      oEvtIn.preventDefault()

      if (oEltIn.className.indexOf('clsClicked') > -1) {
        oEltIn.classList.remove('clsClicked')
        fCnrOntopRemove()
        location.href = oEltIn.href
      } else {
        oEltClicked.classList.remove('clsClicked', 'clsTtpShow', 'clsTriClicked')
        oEltClicked = oEltIn
        oEltIn.classList.add('clsClicked')
        fEvtPreview(oEvtIn)
      }
    })
  }

  // menu-icon
  oEltCnrTopMenuIcnI.setAttribute('title', 'menu')
  oEltCnrTopMenuIcnI.setAttribute('class', 'clsFa clsFaMenu clsTopIcn clsColorWhite clsFloatLeft')
  oEltCnrTopMenuIcnI.addEventListener('pointerdown', function (oEvtIn) {
    oEvtIn.preventDefault()
    // allready clicked, remove menu
    if (oEltCnrTopMenuIcnI.className.indexOf('clsClicked') > -1) {
      oEltCnrMenuDiv.style.display = 'none'
      oEltClicked.classList.remove('clsClicked', 'clsTtpShow', 'clsTriClicked')
      oEltCnrPreviewDiv.style.display = 'none'
      oEltCnrWidthDiv.style.display = 'none'
    } else {
      oEltClicked.classList.remove('clsClicked', 'clsTtpShow', 'clsTriClicked')
      oEltClicked = oEltCnrTopMenuIcnI
      oEltCnrTopMenuIcnI.classList.add('clsClicked')
      oEltCnrMenuDiv.style.display = 'block'
      oEltCnrPreviewDiv.style.display = 'none'
      oEltCnrWidthDiv.style.display = 'none'
    }
  })
  oEltCnrTopDiv.insertBefore(oEltCnrTopHomeIcnI, oEltCnrTopDiv.firstChild)
  // home-icn
  oEltCnrTopHomeIcnI.setAttribute('title', 'Home-webpage')
  oEltCnrTopHomeIcnI.setAttribute('class', 'clsFa clsFaHome clsTopIcn clsColorWhite clsFloatLeft')
  oEltCnrTopHomeIcnI.addEventListener('click', function () {
    oEltClicked.classList.remove('clsClicked', 'clsTtpShow', 'clsTriClicked')
    oEltClicked = oEltCnrTopHomeIcnI
    location.href = sPathSite //nnnFv
  })
  oEltCnrTopDiv.insertBefore(oEltCnrTopMenuIcnI, oEltCnrTopDiv.firstChild)

  // menu-content
  oEltCnrMenuDiv.id = 'idCnrMenuDiv'
  oEltCnrMenuDiv.addEventListener('pointerdown', e => e.preventDefault())
  oEltMenuUl.setAttribute('id', 'idMenuUl')
  oEltMenuUl.classList.add('clsTreeUl')
  // site-structure menu
  if (sEltSitemenuUl) {
    oEltMenuUl.innerHTML = sEltSitemenuUl
  }

  // command Search
  const oEltCmdSrch = document.createElement('li')
  oEltCmdSrch.innerHTML = 'Name-Search:'
  oEltMenuUl.appendChild(oEltCmdSrch)
  const oEltCmdSrchUl = document.createElement('ul')
  oEltCmdSrch.appendChild(oEltCmdSrchUl)
  // query selection and preview
  async function fCmdQuerySelection(){
    let sSelection = getSelection().toString().trim()
    fCnrOntopRemove()
    if (sSelection !== '')  {
      sSelection = fSelectionModify(sSelection)
      if (sSelection.startsWith('http')) {
        window.open(sSelection, '_blank')
      } else {
        oEltTabSearchIpt.value = sSelection
        oEltTabSearchP.innerHTML = sTabSearchPSetText()
        //clear suggestions
        oEltTabSearchOl.innerHTML = ''
        sIdxfile = 'lagRoot'
        await fSearchSuggest()
        await fPreviewFirstSuggestion()
        fCnrSearchShow()
      }
    } else {
      fCnrSearchShow()
    }
  }
  // query input and preview
  async function fCmdQueryInput(){
    fCnrOntopRemove()
    if (oEltTabSearchIpt.value !== '')  {
      //clear suggestions
      oEltTabSearchOl.innerHTML = ''
      await fSearchSuggest()
      await fPreviewFirstSuggestion()
      fCnrSearchShow()
    } else {
     oEltTabSearchP.innerHTML = sTabSearchPSetText()
     fCnrSearchShow()
    }
  }
  // English
  const oEltCmdSrchEngl = document.createElement('li')
  oEltCmdSrchEngl.innerHTML = '<button id="idCmdBtn2">English-name (F2, Engl)</button>'
  oEltCmdSrchEngl.addEventListener('pointerdown', async function (oEvtIn) {
    oEvtIn.preventDefault()
    oEltTabSearchSlct.options[0].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchEngl
  })
  addEventListener('keydown', async function (oEvtIn) {
    if (oEvtIn.key === 'F2'  || event.keyCode === 113) {
      oEvtIn.preventDefault()
      oEltTabSearchSlct.options[0].selected = true
      if (getSelection().toString().trim() !== '') {
        await fCmdQuerySelection()
      } else {
        await fCmdQueryInput()
      }
    }
  })
  oEltCmdSrchUl.appendChild(oEltCmdSrchEngl)
  // Sinagu
  const oEltCmdSrchSngu = document.createElement('li')
  oEltCmdSrchSngu.innerHTML = '<button id="idCmdBtn2">Sinagu-name (Shift+F2, Sngu)</button>'
  oEltCmdSrchSngu.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[1].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchSngu
  })
  addEventListener('keydown', async function (oEvtIn) {
    if (oEvtIn.shiftKey && oEvtIn.key === 'F2') {
      oEltTabSearchSlct.options[1].selected = true
      if (getSelection().toString().trim() !== '') {
        await fCmdQuerySelection()
      } else {
        await fCmdQueryInput()
      }
    }
  })
  oEltCmdSrchUl.appendChild(oEltCmdSrchSngu)
  // Greek
  const oEltCmdSrchElln = document.createElement('li')
  oEltCmdSrchElln.innerHTML = '<button id="idCmdBtn2">Greek-name (Ctrl+F2, Elln)</button>'
  oEltCmdSrchElln.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[2].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchElln
  })
  addEventListener('keydown', async function (oEvtIn) {
    if (oEvtIn.ctrlKey && oEvtIn.key === 'F2') {
      oEvtIn.preventDefault()
      oEltTabSearchSlct.options[2].selected = true
      if (getSelection().toString().trim() !== '') {
        await fCmdQuerySelection()
      } else {
        await fCmdQueryInput()
      }
    }
  })
  oEltCmdSrchUl.appendChild(oEltCmdSrchElln)
  //Chinese nnnFv:Esperanto
  const oEltCmdSrchZhon = document.createElement('li')
  oEltCmdSrchZhon.innerHTML = '<button id="idCmdBtn2">Chinese-name (Alt+F2, Zhon)</button>'
  oEltCmdSrchZhon.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[3].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchZhon
  })
  addEventListener('keydown', async function (oEvtIn) {
    if (oEvtIn.altKey && oEvtIn.key === 'F2') {
      oEltTabSearchSlct.options[3].selected = true
      if (getSelection().toString().trim() !== '') {
        await fCmdQuerySelection()
      } else {
        await fCmdQueryInput()
      }
    }
  })
  oEltCmdSrchUl.appendChild(oEltCmdSrchZhon)

  const oEltCmdSrchMisc = document.createElement('li')
  oEltCmdSrchMisc.innerHTML = 'More Names:'
  oEltCmdSrchUl.appendChild(oEltCmdSrchMisc)
  const oEltCmdSrchUl2 = document.createElement('ul')
  oEltCmdSrchMisc.appendChild(oEltCmdSrchUl2)
  // Albanian
  const oEltCmdSrchSqip = document.createElement('li')
  oEltCmdSrchSqip.innerHTML = '<button id="idCmdBtn3">Albanian (Sqip)</button>'
  oEltCmdSrchSqip.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[5].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchSqip
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchSqip)
  // Arabic
  const oEltCmdSrchArab = document.createElement('li')
  oEltCmdSrchArab.innerHTML = '<button id="idCmdBtn3">Arabic (Arab)</button>'
  oEltCmdSrchArab.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[6].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchArab
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchArab)
  // Esperanto
  const oEltCmdSrchEspo = document.createElement('li')
  oEltCmdSrchEspo.innerHTML = '<button id="idCmdBtn3">Esperanto (Espo)</button>'
  oEltCmdSrchEspo.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[7].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchEspo
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchEspo)
  // French
  const oEltCmdSrchFrac = document.createElement('li')
  oEltCmdSrchFrac.innerHTML = '<button id="idCmdBtn3">French (Frac)</button>'
  oEltCmdSrchFrac.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[8].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchFrac
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchFrac)
  // German
  const oEltCmdSrchDeut = document.createElement('li')
  oEltCmdSrchDeut.innerHTML = '<button id="idCmdBtn3">German (Deut)</button>'
  oEltCmdSrchDeut.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[9].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchDeut
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchDeut)
  // GreekAncient
  const oEltCmdSrchElla = document.createElement('li')
  oEltCmdSrchElla.innerHTML = '<button id="idCmdBtn3">GreekAncient (Ella)</button>'
  oEltCmdSrchElla.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[10].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchElla
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchElla)
  // Hindi
  const oEltCmdSrchHind = document.createElement('li')
  oEltCmdSrchHind.innerHTML = '<button id="idCmdBtn3">Hindi (Hind)</button>'
  oEltCmdSrchHind.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[11].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchHind
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchHind)
  // Italian
  const oEltCmdSrchItln = document.createElement('li')
  oEltCmdSrchItln.innerHTML = '<button id="idCmdBtn3">Italian (Itln)</button>'
  oEltCmdSrchItln.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[12].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchItln
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchItln)
  // Japanese
  const oEltCmdSrchJpns = document.createElement('li')
  oEltCmdSrchJpns.innerHTML = '<button id="idCmdBtn3">Japanese (Jpns)</button>'
  oEltCmdSrchJpns.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[13].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchJpns
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchJpns)
  // Khmer
  const oEltCmdSrchKhmr = document.createElement('li')
  oEltCmdSrchKhmr.innerHTML = '<button id="idCmdBtn3">Khmer (Khmr)</button>'
  oEltCmdSrchKhmr.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[14].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchKhmr
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchKhmr)
  // Korean
  const oEltCmdSrchKora = document.createElement('li')
  oEltCmdSrchKora.innerHTML = '<button id="idCmdBtn3">Korean (Kora)</button>'
  oEltCmdSrchKora.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[15].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchKora
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchKora)
  // Romanian
  const oEltCmdSrchRomn = document.createElement('li')
  oEltCmdSrchRomn.innerHTML = '<button id="idCmdBtn3">Romanian (Romn)</button>'
  oEltCmdSrchRomn.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[16].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchRomn
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchRomn)
  // SlavoBosnian
  const oEltCmdSrchSbos = document.createElement('li')
  oEltCmdSrchSbos.innerHTML = '<button id="idCmdBtn3">SlavoBosnian (Sbos)</button>'
  oEltCmdSrchSbos.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[17].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchSbos
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchSbos)
  // SlavoCroatian
  const oEltCmdSrchShrv = document.createElement('li')
  oEltCmdSrchShrv.innerHTML = '<button id="idCmdBtn3">SlavoCroatian (Shrv)</button>'
  oEltCmdSrchShrv.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[18].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchShrv
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchShrv)
  // SlavoMondenegrin
  const oEltCmdSrchScnr = document.createElement('li')
  oEltCmdSrchScnr.innerHTML = '<button id="idCmdBtn3">SlavoMondenegrin (Scnr)</button>'
  oEltCmdSrchScnr.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[19].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchScnr
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchScnr)
  // SlavoSerbian
  const oEltCmdSrchSsrp = document.createElement('li')
  oEltCmdSrchSsrp.innerHTML = '<button id="idCmdBtn3">SlavoSerbian (Ssrp)</button>'
  oEltCmdSrchSsrp.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[20].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchSsrp
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchSsrp)
  // SlavoBulgarian
  const oEltCmdSrchSbul = document.createElement('li')
  oEltCmdSrchSbul.innerHTML = '<button id="idCmdBtn3">SlavoBulgarian (Sbul)</button>'
  oEltCmdSrchSbul.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[21].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchSbul
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchSbul)
  // SlavoMacedonian
  const oEltCmdSrchSmkd = document.createElement('li')
  oEltCmdSrchSmkd.innerHTML = '<button id="idCmdBtn3">SlavoMacedonian (Smkd)</button>'
  oEltCmdSrchSmkd.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[22].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchSmkd
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchSmkd)
  // SlavoRussian
  const oEltCmdSrchSrus = document.createElement('li')
  oEltCmdSrchSrus.innerHTML = '<button id="idCmdBtn3">SlavoRussian (Srus)</button>'
  oEltCmdSrchSrus.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[23].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchSrus
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchSrus)
  // SlavoSlovenian
  const oEltCmdSrchSslv = document.createElement('li')
  oEltCmdSrchSslv.innerHTML = '<button id="idCmdBtn3">SlavoSlovenian (Sslv)</button>'
  oEltCmdSrchSslv.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[24].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchSslv
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchSslv)
  // Spanish
  const oEltCmdSrchSpan = document.createElement('li')
  oEltCmdSrchSpan.innerHTML = '<button id="idCmdBtn3">Spanish (Span)</button>'
  oEltCmdSrchSpan.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[25].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchSpan
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchSpan)
  // Turkish
  const oEltCmdSrchTurk = document.createElement('li')
  oEltCmdSrchTurk.innerHTML = '<button id="idCmdBtn3">Turkish (Turk)</button>'
  oEltCmdSrchTurk.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[26].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchTurk
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchTurk)
  // Vietnamese
  const oEltCmdSrchVnma = document.createElement('li')
  oEltCmdSrchVnma.innerHTML = '<button id="idCmdBtn3">Vietnamese (Vnma)</button>'
  oEltCmdSrchVnma.addEventListener('pointerdown', async function (oEvtIn) {
    oEltTabSearchSlct.options[27].selected = true
    if (getSelection().toString().trim() !== '') {
      await fCmdQuerySelection()
    } else {
      await fCmdQueryInput()
    }
    oEltClicked = oEltCmdSrchVnma
  })
  oEltCmdSrchUl2.appendChild(oEltCmdSrchVnma)

  // command SearchSelection
  const oEltCmdQurySlct = document.createElement('li')
  oEltCmdQurySlct.innerHTML = '<button id="idCmdBtn">Query-Selection (Ctrl+Q)</button>'
  oEltCmdQurySlct.addEventListener('pointerdown', async function (oEvtIn) {
    await fCmdQuerySelection()
    oEltClicked = oEltCmdQurySlct
  })
  addEventListener('keyup', async function (oEvtIn) {
    if (oEvtIn.ctrlKey && oEvtIn.key.toLowerCase() === 'q') {
      oEvtIn.preventDefault()
      fCnrOntopRemove()
      await fCmdQuerySelection()
    }
  })
  oEltMenuUl.appendChild(oEltCmdQurySlct)

  // command dblclick
  const oEltCmdDblclck = document.createElement('li')
  oEltCmdDblclck.innerHTML = '(DoubleClick) Query-Selected'
  oEltMenuUl.appendChild(oEltCmdDblclck)
  // on content expand selection of dblclick, query it, and preview first suggestion
  oEltCnrMainContentDiv.addEventListener('dblclick', async function (oEvtIn) {
    // Skip inputs/textareas
    const sTag = (oEvtIn.target.closest('input, textarea, [contenteditable="true"]') || {}).tagName
    if (sTag === 'INPUT' || sTag === 'TEXTAREA') return

    // Define what counts as “word” letters, numbers, symbols.
    const rWORD = /[\p{L}\p{N}]/u // letters & numbers
    // :. generic-specific, // / whoel-part, - _ polyword, @ view, ' attribute,
    const oSetSymbols = new Set(['-', '_', '\'', '.', ':', '/', ';', '@', '#', '+'])

    // sChIn: is a word char or expandable-symbol
    function fIsWord(sChIn) {
      if (!sChIn) return false
      return rWORD.test(sChIn) || oSetSymbols.has(sChIn)
    }

    // Expand selection inside a Text node
    function fExpandSelectionRight() {
      const oSel = window.getSelection()
      if (!oSel || oSel.rangeCount === 0) {
        return ''
      } else {
        const oRange = oSel.getRangeAt(0)
        const oNode = oRange.startContainer
        // Only handle simple cases in a single text node (typical double-click behavior).
        if (oNode !== oRange.endContainer || oNode.nodeType !== Node.TEXT_NODE) {
          return ''
        } else {
          const sText = oNode.textContent
          let nStart = oRange.startOffset
          let nEnd   = oRange.endOffset
          if (oSel.toString().endsWith(' ')) nEnd--
          // Expand right
          while (nEnd < sText.length && fIsWord(sText[nEnd])) nEnd++
          // If nothing changed, do nothing
          if (nEnd === oRange.endOffset) {
            return oSel.toString().trim()
          } else {
            const newRange = document.createRange()
            newRange.setStart(oNode, nStart)
            newRange.setEnd(oNode, nEnd)
            oSel.removeAllRanges()
            oSel.addRange(newRange)
            return oSel.toString().trim()
          }
        }
      }
    }
    let sSelection = fExpandSelectionRight()
    if (sSelection !== '') {
      sSelection = sSelection.replace(/[-_'.:/;@+]*$/, '')
      if (sSelection.startsWith('_'))  sSelection = sSelection.slice(1) //_DESCRIPTION
      if (sSelection.startsWith('cpt'))  sSelection = 'concept' + sSelection.slice(3)
      oEltTabSearchIpt.value = sSelection + ' '
      if (sSelection.startsWith('http')) {
        window.open(sSelection, '_blank')
      } else {
        fCmdQueryInput()
      }
    }
  }, true)
  // command CodePoints
  const oEltCmdCodepoints = document.createElement('li')
  oEltCmdCodepoints.innerHTML = '<button id="idCmdBtn">Selection-Codepoints (Ctrl+0)</button>'
  function fCmdCodePoint(){
    let
      s = getSelection().toString(),
      sOut = '',
      n
    for (n = 0; n < s.length; n++) {
      if (s.charCodeAt(n) >= 55296 && s.charCodeAt(n) <= 56319) {
        //on high-surrogates do not count the low-surrogate
        sOut = sOut + s.codePointAt(n) + '-'
        n = n+1
      } else {
        sOut = sOut + s.codePointAt(n) + '-'
      }
    }
    oEltCnrPreviewDiv.innerHTML = '► chars: '+s +'<br>► codepoints: ' + sOut.substring(0, sOut.length-1)
    oEltCnrPreviewDiv.style.display = 'block'
    oEltCnrPreviewDiv.style.top = 59 + 'px'
    oEltCnrPreviewDiv.style.left = 59 + 'px'
  }
  oEltCmdCodepoints.addEventListener('pointerdown', function (oEvtIn) {
    oEvtIn.preventDefault()
    fCmdCodePoint()
    oEltCnrMenuDiv.style.display = 'none'
    oEltClicked.classList.remove('clsClicked', 'clsTtpShow', 'clsTriClicked')
    oEltClicked = oEltCmdCodepoints
  })
  addEventListener('keyup', function (oEvtIn) {
    if (oEvtIn.ctrlKey && oEvtIn.key.toLowerCase() === '0') {
      oEvtIn.preventDefault()
      fCmdCodePoint()
    }
  })
  oEltMenuUl.appendChild(oEltCmdCodepoints)

  // command web-apps  // nnn
  const oEltCmdWebApp = document.createElement('li')
  oEltCmdWebApp.innerHTML = 'Site web-apps:'
  oEltMenuUl.appendChild(oEltCmdWebApp)
  const oEltCmdWebAppUl = document.createElement('ul')
  oEltCmdWebApp.appendChild(oEltCmdWebAppUl)

  const oEltCmdLagApp = document.createElement('li')
  oEltCmdLagApp.innerHTML = 'Language web-apps:'
  oEltCmdWebAppUl.appendChild(oEltCmdLagApp)
  const oEltCmdLagAppUl2 = document.createElement('ul')
  oEltCmdLagApp.appendChild(oEltCmdLagAppUl2)
  const oEltCmdLagAppSwcr = document.createElement('li')
  oEltCmdLagAppSwcr.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirLag/McshLag000010.last.html#idL0014wrdcrtr">SinaguWordCreator</a>'
  oEltCmdLagAppUl2.appendChild(oEltCmdLagAppSwcr)
  const oEltCmdWebAppEnff = document.createElement('li')
  oEltCmdWebAppEnff.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirLag/McshLag000011.last.html#idLEnglnouformfndr">EnglishNoun FormFinder</a>'
  oEltCmdLagAppUl2.appendChild(oEltCmdWebAppEnff)
  const oEltCmdWebAppEvff = document.createElement('li')
  oEltCmdWebAppEvff.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirLag/McshLag000011.last.html#idLEnglverbfmfd">EnglishVerb FormFinder</a>'
  oEltCmdLagAppUl2.appendChild(oEltCmdWebAppEvff)
  const oEltCmdWebAppGnmf = document.createElement('li')
  oEltCmdWebAppGnmf.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirLag/McshLag000020.last.html#idLEllnnounmbrfdr">GreekNoun MemberFinder</a>'
  oEltCmdLagAppUl2.appendChild(oEltCmdWebAppGnmf)
  const oEltCmdWebAppGwpn = document.createElement('li')
  oEltCmdWebAppGwpn.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirLag/McshLag000020.last.html#idLEllnwrdspch">Greek WordPronunciation</a>'
  oEltCmdLagAppUl2.appendChild(oEltCmdWebAppGwpn)
  const oEltCmdWebAppGawp = document.createElement('li')
  oEltCmdWebAppGawp.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirLag/McshLag000027.last.html#idLEllawordspch">GreekAncient WordPronunciation</a>'
  oEltCmdLagAppUl2.appendChild(oEltCmdWebAppGawp)
  const oEltCmdWebAppGwca = document.createElement('li')
  oEltCmdWebAppGwca.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'otenet/gr/gwcreator.html">GreekWordCreator Applet</a>'
  oEltCmdLagAppUl2.appendChild(oEltCmdWebAppGwca)
  const oEltCmdWebAppWfja = document.createElement('li')
  oEltCmdWebAppWfja.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'otenet/grammar/wordforms.html">WordForms Applet</a>'
  oEltCmdLagAppUl2.appendChild(oEltCmdWebAppWfja)

  const oEltCmdWebAppCrNs = document.createElement('li')
  oEltCmdWebAppCrNs.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirCor/McshCor000010.last.html#idQntNbrnmrlsysdthc">Numerral Converter</a>'
  oEltCmdWebAppUl.appendChild(oEltCmdWebAppCrNs)

  const oEltCmdWebAppCCtC = document.createElement('li')
  oEltCmdWebAppCCtC.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirLag/McshLag000006.last.html#idCharUcdstdcpfdr">Char⇔Codepoint Converter</a>'
  oEltCmdWebAppUl.appendChild(oEltCmdWebAppCCtC)

  const oEltCmdWebAppCrcy = document.createElement('li')
  oEltCmdWebAppCrcy.innerHTML = 'Currency Converters:'
  oEltCmdWebAppUl.appendChild(oEltCmdWebAppCrcy)
  const oEltCmdWebAppCrcyUl2 = document.createElement('ul')
  oEltCmdWebAppCrcy.appendChild(oEltCmdWebAppCrcyUl2)
  const oEltCmdWebAppBbgn = document.createElement('li')
  oEltCmdWebAppBbgn.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirStn/McshStn000038.last.html#idBgraeconevu">Euro⇔BulgariaLev-BGN</a>'
  oEltCmdWebAppCrcyUl2.appendChild(oEltCmdWebAppBbgn)
  const oEltCmdWebAppKhma = document.createElement('li')
  oEltCmdWebAppKhma.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirStn/McshStn000050.last.html#idKhmaeconevu">Euro⇔Cambodia-KHR</a>'
  oEltCmdWebAppCrcyUl2.appendChild(oEltCmdWebAppKhma)
  const oEltCmdWebAppCcny = document.createElement('li')
  oEltCmdWebAppCcny.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirStn/McshStn000031.last.html#idChnaEconevu">Euro⇔ChinaRenMinBi-CNY</a>'
  oEltCmdWebAppCrcyUl2.appendChild(oEltCmdWebAppCcny)
  const oEltCmdWebAppEtGd = document.createElement('li')
  oEltCmdWebAppEtGd.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirStn/McshStn000020.last.html#idEusaEconEurevuapp">Euro⇔GreeceDrachmas</a>'
  oEltCmdWebAppCrcyUl2.appendChild(oEltCmdWebAppEtGd)
  const oEltCmdWebAppJpna = document.createElement('li')
  oEltCmdWebAppJpna.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirStn/McshStn000048.last.html#idJpnaeconevu">Euro⇔Japan-JPY</a>'
  oEltCmdWebAppCrcyUl2.appendChild(oEltCmdWebAppJpna)
  const oEltCmdWebAppSmkd = document.createElement('li')
  oEltCmdWebAppSmkd.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirStn/McshStn000040.last.html#idNmkdeconevu">Euro⇔NorthMacedonia-MKD</a>'
  oEltCmdWebAppCrcyUl2.appendChild(oEltCmdWebAppSmkd)
  const oEltCmdWebAppRrub = document.createElement('li')
  oEltCmdWebAppRrub.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirStn/McshStn000043.last.html#idRusaeconevu">Euro⇔Russia-RUB</a>'
  oEltCmdWebAppCrcyUl2.appendChild(oEltCmdWebAppRrub)
  const oEltCmdWebAppSgpr = document.createElement('li')
  oEltCmdWebAppSgpr.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirStn/McshStn000051.last.html#idSgpreconevu">Euro⇔Singapore-SGD</a>'
  oEltCmdWebAppCrcyUl2.appendChild(oEltCmdWebAppSgpr)
  const oEltCmdWebAppKors = document.createElement('li')
  oEltCmdWebAppKors.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirStn/McshStn000049.last.html#idKorseconevu">Euro⇔SouthKorea-KRW</a>'
  oEltCmdWebAppCrcyUl2.appendChild(oEltCmdWebAppKors)
  const oEltCmdWebAppTtry = document.createElement('li')
  oEltCmdWebAppTtry.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirStn/McshStn000033.last.html#idTurkeconevu">Euro⇔Turkey-TRY</a>'
  oEltCmdWebAppCrcyUl2.appendChild(oEltCmdWebAppTtry)
  const oEltCmdWebAppVvnd = document.createElement('li')
  oEltCmdWebAppVvnd.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirStn/McshStn000034.last.html#idVtnmeconevu">Euro⇔Vietnam-VND</a>'
  oEltCmdWebAppCrcyUl2.appendChild(oEltCmdWebAppVvnd)
  const oEltCmdWebAppTock = document.createElement('li')

  oEltCmdWebAppTock.innerHTML = '<a class="clsPreview" href="' + sPathSite +
    'dirMcsh/dirCor/McshCor000002.last.html#idMcsmToc">TableOfContents ChromeExtension</a>'
  oEltCmdWebAppUl.appendChild(oEltCmdWebAppTock)

  // command Esc
  addEventListener('keyup', function (oEvtIn) {
    if (event.key === 'Escape') {
      oEvtIn.preventDefault()
      fCnrOntopRemove()
    }
  })
  // style commands
  Array.prototype.slice.call(oEltMenuUl.querySelectorAll('#idCmdBtn')).forEach(function (oEltIn) {
    oEltIn.style.cursor = 'pointer'
    oEltIn.style.width = "222px"
    oEltIn.style.fontSize = '14px'
  })
  Array.prototype.slice.call(oEltMenuUl.querySelectorAll('#idCmdBtn2')).forEach(function (oEltIn) {
    oEltIn.style.cursor = 'pointer'
    oEltIn.style.width = "197px"
    oEltIn.style.fontSize = '12px'
  })
  Array.prototype.slice.call(oEltMenuUl.querySelectorAll('#idCmdBtn3')).forEach(function (oEltIn) {
    oEltIn.style.cursor = 'pointer'
    oEltIn.style.width = "172px"
    oEltIn.style.fontSize = '12px'
  })
  oEltCnrMenuDiv.appendChild(oEltMenuUl)
  oEltBody.appendChild(oEltCnrMenuDiv)
  // on a-links, first highlight
  Array.prototype.slice.call(document.querySelectorAll('#idMenuUl a')).forEach(function (oEltIn) {
    fEvtLink(oEltIn)
  })

  /**
   * 'purifies' selection
   */
  function fSelectionModify(sSelectionIn) {
    sSelectionIn = sSelectionIn.replace(/[-_'.:/;@+]*$/, '') // clears end
    if (sSelectionIn.startsWith('_'))  sSelectionIn = sSelectionIn.slice(1) //_DESCRIPTION
    if (sSelectionIn.startsWith('cpt'))  sSelectionIn = 'concept' + sSelectionIn.slice(3)
    sSelectionIn = sSelectionIn + ' ' // for exact searching
    return sSelectionIn
  }

  // set on page-content-cnr the original-body content
  oEltCnrMainContentDiv.id = 'idCnrMainContentDiv'
  oEltCnrMainContentDiv.innerHTML = sContentOriginal
  oEltCnrMainDiv.appendChild(oEltCnrMainContentDiv)

  // insert page-info-cnr
  oEltCnrMainInfoDiv.id = 'idCnrMainInfoDiv'
  // insert content on TabCntToc
  oEltTabTocDiv.id = 'idTabCntTocDiv'
  oEltTabTocDiv.setAttribute('class', 'clsTabCnt')
  oEltTabTocDiv.innerHTML = fTocTriCreate()
  // insert collaplse-button
  oEltTabTocCpsBtn.setAttribute('id', 'idBtnCollapse_All')
  oEltTabTocCpsBtn.setAttribute('type', 'button')
  oEltTabTocCpsBtn.setAttribute('value', 'collapse-all')
  oEltTabTocCpsBtn.setAttribute('class', 'clsBtn')
  oEltTabTocCpsBtn.addEventListener('click', function () {
    oTriUl.fTriUlCollapseAll('idTocTri')
  })
  oEltTabTocDiv.insertBefore(oEltTabTocCpsBtn, oEltTabTocDiv.firstChild)
  // insert expand-button
  oEltTabTocExpBtn.setAttribute('id', 'idBtnExp_All')
  oEltTabTocExpBtn.setAttribute('type', 'button')
  oEltTabTocExpBtn.setAttribute('value', 'expand-all')
  oEltTabTocExpBtn.setAttribute('class', 'clsBtn')
  oEltTabTocExpBtn.addEventListener('click', function () {
    oTriUl.fTriUlExpandAll('idTocTri')
  })
  oEltTabTocDiv.insertBefore(oEltTabTocExpBtn, oEltTabTocDiv.firstChild)
  // TabCntToc: preferences
  oEltTabTocDiv.appendChild(document.createElement('p'))
  oEltTabTocPrfDiv.innerHTML = '<span class="clsColorGreen clsB">PREFERENCES</span>:<br>' +
    '<fieldset><legend><span class="clsColorGreen">fonts</span>:</legend>' +
    '<input type="radio" id="idRdbFontMono" name="nameRdbFont" checked/>Mono (default)<br>' +
    '<input type="radio" id="idRdbFontSerif" name="nameRdbFont"/>Serif<br>' +
    '<input type="radio" id="idRdbFontSSerif" name="nameRdbFont"/>Sans-serif' +
    '</fieldset>' +
    '<fieldset><legend><span class="clsColorGreen">mode</span>:</legend>' +
    '<input type="radio" id="idRdbModeDark" name="nameRdbMode" checked/>Dark (default)<br>' +
    '<input type="radio" id="idRdbModeLight" name="nameRdbMode"/>Light<br>' +
    '</fieldset>'
  oEltTabTocDiv.appendChild(oEltTabTocPrfDiv)
  // TabCntToc: end-note
  oEltTabTocNotP.innerHTML = '<span class="clsColorGreen clsB">notes</span>:<br>' +
    '🥺 SEE <a href="' + sPathSite + 'index.html#idNvgtn">site-navigation-animation</a>.<br>' +
    'a) clicking on CONTENT, shows its Toc position, the-links, the-address-link-icon <i class="clsFa clsFaLink clsImgLnkIcn"></i>, and removes ontop windows and highlights.<br>' +
    'b) clicking on TITLE or SEARCH-icon, shows SEARCH-tab.<br>' +
    'c) clicking on ADDRESS-LINK-ICON or on Toc, you see the-address of that text on address-bar.<br>' +
    'd) clicking <span style="color:#00ffff">a-CYAN-LINK</span> shows a-preview.<br>' +
    'e) SECOND-CLICK, usually, does the-events attached to components in-order-to work well on touch-screens.'
  oEltTabTocDiv.appendChild(oEltTabTocNotP)
  // insert TabCntToc in TabCnt
  oEltTabContentDiv.id = 'idTabCntDiv'
  oEltTabContentDiv.appendChild(oEltTabTocDiv)

  // insert tab-cnr IN page-info-cnr
  oEltCnrMainInfoDiv.appendChild(oEltTabContentDiv)

  // insert TabHeaders IN page-info-cnr
  oEltTabHeaderUl.id = 'idPginfTabHeadersUl'
  oEltTabHeaderUl.innerHTML =
    '<li class="clsTabActive"><a href="#idTabCntTocDiv">page-Toc</a></li>' +
    '<li><a href="#idTabCntSrchDiv">name-search</a></li>'
  oEltCnrMainInfoDiv.insertBefore(oEltTabHeaderUl, oEltCnrMainInfoDiv.firstChild)

  // insert page-path-elt IN page-info-cnr
  oEltInfoPathP.id = 'idPginfPathP'
  oEltInfoPathP.setAttribute('title', '© 2010-2025 Kaseluris.Nikos.1959') // nnn
  if (!document.getElementById('idMetaWebpage_path')) {
    oEltInfoPathP.innerHTML = 'Toc: ' + document.title
  } else {
    oEltInfoPathP.innerHTML = document.getElementById('idMetaWebpage_path').innerHTML
  }
  oEltCnrMainInfoDiv.insertBefore(oEltInfoPathP, oEltCnrMainInfoDiv.firstChild)

  // TabCntSrch
  oEltTabSearchDiv.id = 'idTabCntSrchDiv'
  oEltTabSearchDiv.setAttribute('class', 'clsTabCnt')
  oEltTabSearchLbl.innerHTML = 'name-lang:'
  oEltTabSearchLbl.for = 'idTabCntSrchSlt'
  oEltTabSearchSlct.id = 'idTabCntSrchSlt'
  //let oEltTabSearchOpn1 = document.createElement('option')
  //oEltTabSearchOpn1.value = 'lagALL'
  //oEltTabSearchOpn1.text = 'ALL'
  //oEltTabSearchSlct.add(oEltTabSearchOpn1)
  let oEltTabSearchOpn2 = document.createElement('option')
  oEltTabSearchOpn2.value = 'lagEngl'
  oEltTabSearchOpn2.text = 'English (Engl - F2)'
  oEltTabSearchSlct.add(oEltTabSearchOpn2)
  let oEltTabSearchOpn3 = document.createElement('option')
  oEltTabSearchOpn3.value = 'lagSngu'
  oEltTabSearchOpn3.text = 'Sinagu (Sngu - Shift+F2)'
  oEltTabSearchSlct.add(oEltTabSearchOpn3)
  let oEltTabSearchOpn4 = document.createElement('option')
  oEltTabSearchOpn4.value = 'lagElln'
  oEltTabSearchOpn4.text = 'Greek (Elln - Ctrl+F2)'
  oEltTabSearchSlct.add(oEltTabSearchOpn4)
  let oEltTabSearchOpn5 = document.createElement('option')
  oEltTabSearchOpn5.value = 'lagZhon'
  oEltTabSearchOpn5.text = 'Chinese (Zhon - Alt+F2)'
  oEltTabSearchSlct.add(oEltTabSearchOpn5)
  let oEltTabSearchOpn6 = document.createElement('option')
  oEltTabSearchOpn6.value = ''
  oEltTabSearchOpn6.text = '---'
  oEltTabSearchSlct.add(oEltTabSearchOpn6)

  let oEltTabSearchOpn7 = document.createElement('option')
  oEltTabSearchOpn7.value = 'lagSqip'
  oEltTabSearchOpn7.text = 'Albanian (Sqip)'
  oEltTabSearchSlct.add(oEltTabSearchOpn7)
  let oEltTabSearchOpn8 = document.createElement('option')
  oEltTabSearchOpn8.value = 'lagArab'
  oEltTabSearchOpn8.text = 'Arabic (Arab)'
  oEltTabSearchSlct.add(oEltTabSearchOpn8)
  let oEltTabSearchOpn9 = document.createElement('option')
  oEltTabSearchOpn9.value = 'lagEspo'
  oEltTabSearchOpn9.text = 'Esperanto (Espo)'
  oEltTabSearchSlct.add(oEltTabSearchOpn9)
  let oEltTabSearchOpn10 = document.createElement('option')
  oEltTabSearchOpn10.value = 'lagFrac'
  oEltTabSearchOpn10.text = 'French (Frac)'
  oEltTabSearchSlct.add(oEltTabSearchOpn10)
  let oEltTabSearchOpn11 = document.createElement('option')
  oEltTabSearchOpn11.value = 'lagDeut'
  oEltTabSearchOpn11.text = 'German (Deut)'
  oEltTabSearchSlct.add(oEltTabSearchOpn11)
  let oEltTabSearchOpn12 = document.createElement('option')
  oEltTabSearchOpn12.value = 'lagElla'
  oEltTabSearchOpn12.text = 'GreekAncient (Ella)'
  oEltTabSearchSlct.add(oEltTabSearchOpn12)
  let oEltTabSearchOpn13 = document.createElement('option')
  oEltTabSearchOpn13.value = 'lagHind'
  oEltTabSearchOpn13.text = 'Hindi (Hind)'
  oEltTabSearchSlct.add(oEltTabSearchOpn13)
  let oEltTabSearchOpn14 = document.createElement('option')
  oEltTabSearchOpn14.value = 'lagItln'
  oEltTabSearchOpn14.text = 'Italian (Itln)'
  oEltTabSearchSlct.add(oEltTabSearchOpn14)
  let oEltTabSearchOpn15 = document.createElement('option')
  oEltTabSearchOpn15.value = 'lagJpns'
  oEltTabSearchOpn15.text = 'Japanese (Jpns)'
  oEltTabSearchSlct.add(oEltTabSearchOpn15)
  let oEltTabSearchOpn16 = document.createElement('option')
  oEltTabSearchOpn16.value = 'lagKhmr'
  oEltTabSearchOpn16.text = 'Khmer (Khmr)'
  oEltTabSearchSlct.add(oEltTabSearchOpn16)
  let oEltTabSearchOpn17 = document.createElement('option')
  oEltTabSearchOpn17.value = 'lagKora'
  oEltTabSearchOpn17.text = 'Korean (Kora)'
  oEltTabSearchSlct.add(oEltTabSearchOpn17)
  let oEltTabSearchOpn18 = document.createElement('option')
  oEltTabSearchOpn18.value = 'lagRomn'
  oEltTabSearchOpn18.text = 'Romanian (Romn)'
  oEltTabSearchSlct.add(oEltTabSearchOpn18)
  let oEltTabSearchOpn19 = document.createElement('option')
  oEltTabSearchOpn19.value = 'lagSbos'
  oEltTabSearchOpn19.text = 'SlavoBosnian (Sbos)'
  oEltTabSearchSlct.add(oEltTabSearchOpn19)
  let oEltTabSearchOpn20 = document.createElement('option')
  oEltTabSearchOpn20.value = 'lagShrv'
  oEltTabSearchOpn20.text = 'SlavoCroatian (Shrv)'
  oEltTabSearchSlct.add(oEltTabSearchOpn20)
  let oEltTabSearchOpn21 = document.createElement('option')
  oEltTabSearchOpn21.value = 'lagScnr'
  oEltTabSearchOpn21.text = 'SlavoMondenegrin (Scnr)'
  oEltTabSearchSlct.add(oEltTabSearchOpn21)
  let oEltTabSearchOpn22 = document.createElement('option')
  oEltTabSearchOpn22.value = 'lagSsrp'
  oEltTabSearchOpn22.text = 'SlavoSerbian (Ssrp)'
  oEltTabSearchSlct.add(oEltTabSearchOpn22)
  let oEltTabSearchOpn23 = document.createElement('option')
  oEltTabSearchOpn23.value = 'lagSbul'
  oEltTabSearchOpn23.text = 'SlavoBulgarian (Sbul)'
  oEltTabSearchSlct.add(oEltTabSearchOpn23)
  let oEltTabSearchOpn24 = document.createElement('option')
  oEltTabSearchOpn24.value = 'lagSmkd'
  oEltTabSearchOpn24.text = 'SlavoMacedonian (Smkd)'
  oEltTabSearchSlct.add(oEltTabSearchOpn24)
  let oEltTabSearchOpn25 = document.createElement('option')
  oEltTabSearchOpn25.value = 'lagSrus'
  oEltTabSearchOpn25.text = 'SlavoRussian (Srus)'
  oEltTabSearchSlct.add(oEltTabSearchOpn25)
  let oEltTabSearchOpn26 = document.createElement('option')
  oEltTabSearchOpn26.value = 'lagSslv'
  oEltTabSearchOpn26.text = 'SlavoSlovenian (Sslv)'
  oEltTabSearchSlct.add(oEltTabSearchOpn26)
  let oEltTabSearchOpn27 = document.createElement('option')
  oEltTabSearchOpn27.value = 'lagSpan'
  oEltTabSearchOpn27.text = 'Spanish (Span)'
  oEltTabSearchSlct.add(oEltTabSearchOpn27)
  let oEltTabSearchOpn28 = document.createElement('option')
  oEltTabSearchOpn28.value = 'lagTurk'
  oEltTabSearchOpn28.text = 'Turkish (Turk)'
  oEltTabSearchSlct.add(oEltTabSearchOpn28)
  let oEltTabSearchOpn29 = document.createElement('option')
  oEltTabSearchOpn29.value = 'lagVnma'
  oEltTabSearchOpn29.text = 'Vietnamese (Vnma)'
  oEltTabSearchSlct.add(oEltTabSearchOpn29)
  oEltTabSearchSlct.options[0].selected = true
  oEltTabSearchP.id = 'idTabCntSrchP'
  oEltTabSearchP.setAttribute('class', 'clsCenter')
  oEltTabSearchP.innerHTML = sTabSearchPSetText()
  oEltTabSearchLblChk.innerHTML =
    '<input type="checkbox" id="idTabCntSrchChk">show All, not 999 (slow)'
  oEltTabSearchPPnm.id = 'idTabCntSrchPPnm'
  oEltTabSearchPPnm.innerHTML =
    '<span id="idSrchpnm"> ā </span><span id="idSrchpnm">á </span><span id="idSrchpnm">ǎ </span><span id="idSrchpnm">à </span>' +
    '<span id="idSrchpnm">ē </span><span id="idSrchpnm">é </span><span id="idSrchpnm">ě </span><span id="idSrchpnm">è </span>' +
    '<span id="idSrchpnm">ī </span><span id="idSrchpnm">í </span><span id="idSrchpnm">ǐ </span><span id="idSrchpnm">ì </span>' +
    '<span id="idSrchpnm">ō </span><span id="idSrchpnm">ó </span><span id="idSrchpnm">ǒ </span><span id="idSrchpnm">ò </span>' +
    '<span id="idSrchpnm">ū </span><span id="idSrchpnm">ú </span><span id="idSrchpnm">ǔ </span><span id="idSrchpnm">ù </span>' +
    '<span id="idSrchpnm">ç </span><span id="idSrchpnm">ğ </span><span id="idSrchpnm">ı </span><span id="idSrchpnm">ö </span><span id="idSrchpnm">ş </span><span id="idSrchpnm">ü </span>' +
    '<span id="idSrchpnm">ĉ </span><span id="idSrchpnm">ĝ </span><span id="idSrchpnm">ĥ </span><span id="idSrchpnm">ĵ </span><span id="idSrchpnm">ŝ </span><span id="idSrchpnm">ŭ </span>' +
    '<span id="idSrchpnm">δ </span><span id="idSrchpnm">θ </span>'
  oEltTabSearchLblChk.id = 'idTabCntSrchLblChk'
  oEltTabSearchIpt.id = 'idTabCntSrchIpt'

  oEltTabSearchSlct.addEventListener('change', async function () {
    fCmdQueryInput()
  })
  // on enter, go to concept
  // on typing, suggest
  oEltTabSearchIpt.addEventListener('keyup', function (oEvtIn) {
    let
      n,
      aLi, // list of elements of suggestion,
      sLoc = '',
      sTxt = ''
    if (oEvtIn.code === 'Enter' || oEvtIn.keyCode === 13) {
      // go to highlighted item
      aLi = oEltTabSearchOl.getElementsByClassName('clsClicked')
      if (aLi.length > 0) {
        // <a class="clsPreviw" href="...">concept-name</a>
        sLoc = aLi[0].href
        if (sLoc === undefined) {
          // li contains no a-element
          let
            sI = aLi[0].innerHTML,
            // char..chas : 126924 (lagEngl03si_2_0),
            sNif = sI.substring(sI.indexOf(' (lag') + 2, sI.lastIndexOf(')')),
            // lagEngl03si_2_0,
            a = sI.substring(0, sI.indexOf(' ')).split('..')
          oEltTabSearchIpt.value = a[0]
          fSearchSuggest(sNif)
        } else if (sLoc !== '') {
          sTxt = aLi[0].text
          if (sTxt.indexOf('!⇒') > 0) {
            // found main-name, search for this
            oEltTabSearchIpt.value = sTxt.substring(sTxt.indexOf('!⇒') + 2)
            fSearchSuggest()
          } else {
            // go to name's address
            location.href = sLoc
          }
        }
      } else {
        // no clicked elements, go to first
        let
          oLi = oEltTabSearchOl.getElementsByTagName('li')[0]
        if (oLi.innerHTML.indexOf(' (lag') === -1) {
          let
            oLiA = oLi.children[0],
            sLoc = oLiA.href
          if (sLoc !== '') {
            sTxt = oLiA.text
            if (sTxt.indexOf('!⇒') > 0) {
              // found main-name, search for this
              oEltTabSearchIpt.value = sTxt.substring(sTxt.indexOf('!⇒') + 2)
              fSearchSuggest()
            } else {
              // go to name's address
              location.href = sLoc
            }
          }
        }
      }
    } else if ((oEvtIn.code !== 'ArrowDown' && oEvtIn.code !== 'ArrowUp' &&
         oEvtIn.code !== 'ArrowLeft' && oEvtIn.code !== 'ArrowRight' &&
         oEvtIn.code !== 'PageDown' && oEvtIn.code !== 'PageUp' &&
         oEvtIn.code !== 'ShiftLeft' && oEvtIn.code !== 'ShiftRight' &&
         oEvtIn.code !== 'ControlLeft' && oEvtIn.code !== 'ControlRight') ||
       (oEvtIn.keyCode !== 40 && oEvtIn.keyCode !== 38 &&
        oEvtIn.keyCode !== 37 && oEvtIn.keyCode !== 39 &&
        oEvtIn.keyCode !== 34 && oEvtIn.keyCode !== 33 &&
        oEvtIn.keyCode !== 16 && oEvtIn.keyCode !== 17)) {
      fSearchSuggest()
    } else if (oEvtIn.code === 'ArrowDown' || oEvtIn.keyCode === 40) {
      let bClicked = false
      oEvtIn.preventDefault()
      aLi = oEltTabSearchOl.getElementsByTagName('li')
      for (n = 0; n < aLi.length; n++) {
        let oLi = aLi[n]
        if (oLi.innerHTML.indexOf(' (lag') > 0) { //stdR..t : 13120 (lagEngl19es_2) index-file
          if (oLi.className.indexOf('clsClicked') >= 0 && n + 1 < aLi.length) {
            oLi.classList.remove('clsClicked')
            oEltClicked = aLi[n + 1]
            aLi[n + 1].classList.add('clsClicked')
            bClicked = true
            break
          } else if (oLi.className.indexOf('clsClicked') >= 0 && n + 1 === aLi.length) {
            bClicked = true
          }
        } else if (oLi.children[0].className.indexOf('clsClicked') >= 0 && n + 1 < aLi.length) {
          oLi.children[0].classList.remove('clsClicked')
          oEltCnrPreviewDiv.style.display = 'none'
          oEltClicked = aLi[n + 1].children[0]
          aLi[n + 1].children[0].classList.add('clsClicked')
          bClicked = true
          oEltTabSearchIpt.value = aLi[n + 1].children[0].innerHTML
          break
        } else if (oLi.children[0].className.indexOf('clsClicked') >= 0 && n + 1 === aLi.length) {
          bClicked = true
          oEltTabSearchIpt.value = aLi[n + 1].children[0].innerHTML
        }
      }
      if (!bClicked) {
        //if no click found, click first
        if (aLi[0].innerHTML.indexOf(' (lag') > 0) { //stdR..t : 13120 (lagEngl19es_2) index-file
          oEltClicked = aLi[0]
          aLi[0].classList.add('clsClicked')
        } else {
          oEltClicked = aLi[0].children[0]
          aLi[0].children[0].classList.add('clsClicked')
          oEltTabSearchIpt.value = aLi[0].children[0].innerHTML
        }
      }
    } else if (oEvtIn.code === 'ArrowUp' || oEvtIn.keyCode === 38) {
      oEvtIn.preventDefault()
      aLi = oEltTabSearchOl.getElementsByTagName('li')
      for (n = 0; n < aLi.length; n++) {
        let oLi = aLi[n]
        if (oLi.innerHTML.indexOf(' (lag') > 0) {
          if (oLi.className.indexOf('clsClicked') >= 0 && n - 1 >= 0) {
            oLi.classList.remove('clsClicked')
            oEltClicked = aLi[n - 1]
            aLi[n - 1].classList.add('clsClicked')
            break
          }
        } else if (oLi.children[0].className.indexOf('clsClicked') > -1 &&
            n - 1 >= 0) {
          oLi.children[0].classList.remove('clsClicked')
          oEltCnrPreviewDiv.style.display = 'none'
          oEltClicked = aLi[n - 1].children[0]
          aLi[n - 1].children[0].classList.add('clsClicked')
          oEltTabSearchIpt.value = aLi[n - 1].children[0].innerHTML
          break
        }
      }
    }
  })

  /**
   * This DOES-NOT WORK, because same characters belong to MANY languages
   * eg 'α' is Greek and GreekAncient, 'a' is English, German, Spanish ...
   * created: {2025-10-18}
   * choose search language on sCharIn
   */
  function  fChooseInputLanguage(sCharIn) {
    // if Greek
    if (/[\u0370-\u03FF]/.test(sCharIn))
      oEltTabSearchSlct.options[2].selected = true
    // if Chinese
    else if (/[\u4E00-\u9FFF]/.test(sCharIn))
      oEltTabSearchSlct.options[3].selected = true
      // English
    else
      oEltTabSearchSlct.options[0].selected = true
  }

  /**
   * DOING: suggests names of senso-concepts,
   *   that BEGIN with input-search-string.
   * INPUT: nothing or string of index-file to search: lagEngl03si_2_0, lagRoot, ...
   */
  async function fSearchSuggest(sIdxfileIn) {
    let
      nLag, // number of lag name in lagRoot-index-file,
      sLi,  // text of first suggestion,
      sLag, // lagElln
      sIdxfileFull,
      sSearchInput = oEltTabSearchIpt.value,
      sSearchChar = sSearchInput.charAt(0),
      sSuggestions = ''

    // fChooseInputLanguage(sSearchChar)
    sLag = oEltTabSearchSlct.options[oEltTabSearchSlct.selectedIndex].value, // lagElln
    sIdxfile = ''
    sIdxFrom = ''
    sIdxTo = ''

    if (sIdxfileIn) {
      fSSIdxfilDisplay(sIdxfileIn)
    }

    if (sSearchInput.length > 0) {
      //console.log('>>> start: ' + sSearchInput + ', ' + sLag)
      let bRest = true
      // display rest-chars if main-char will-not-find

      for (let n = 1; n < aaNamidxfileRoot.length; n++) {
        // display quantities, for the-lag
        if (aaNamidxfileRoot[n][0] === ';' + sLag) {
            nLag = n // index of lag in aaNamidxfileRoot [";lagEngl","English",143707],
        } else if (aaNamidxfileRoot[n][0].startsWith(sLag) && aaNamidxfileRoot[n][1] !== '') {
          // only selected language
          if (aaNamidxfileRoot[n][1].indexOf('..') < 0) {
            // root-char "Ά|Α|ά|α"
            if (aaNamidxfileRoot[n][1].indexOf(sSearchChar) >= 0) {
              // found search-char
              sIdxFrom = aaNamidxfileRoot[n][1]
              sIdxTo = ''
              if (aaNamidxfileRoot[n][0].endsWith('_0')) {
                // index-file is a-reference
                fSSIdxfileReferenceManage(aaNamidxfileRoot[n][0])
              } else {
                // index-file is a-referenceNo
                fSSIdxfilDisplay(aaNamidxfileRoot[n][0])
              }
              // found main-char
              bRest = false
              break
            }
          } else {
            // root-char A..C a-sequence of chars
            let a = aaNamidxfileRoot[n][1].split('..')
            sIdxFrom = a[0]
            sIdxTo = a[1]
            // some Chinese are codepoints, then compare numbers
            let
              nIdxFrom = 0,
              nIdxTo = 0,
              nSearchChar = sSearchChar.codePointAt()
            //console.log(sSearchChar+', '+nSearchChar)
            // if srch-char is a-supplement with surrogates (high 55296–56319), find it
            if (nSearchChar >= 55296 && nSearchChar <= 56319) {
              let sSupplement = String.fromCodePoint(sSearchInput.charAt(0).charCodeAt(0),
                                                     sSearchInput.charAt(1).charCodeAt(0))
              nSearchChar = sSupplement.codePointAt()
            }
            if (!Number.isInteger(Number(sIdxFrom))) {
              // it is char
              nIdxFrom = sIdxFrom.codePointAt()
            } else {
              nIdxFrom = Number(sIdxFrom)
            }
            if (!Number.isInteger(Number(sIdxTo))) {
              // it is char
              nIdxTo = sIdxTo.codePointAt()
            } else {
              nIdxTo = Number(sIdxTo)
            }
            //console.log(sIdxFrom+', '+sIdxTo)
            if (nSearchChar >= nIdxFrom && nSearchChar < nIdxTo) {
              if (aaNamidxfileRoot[n][0].endsWith('_0')) {
                // index-file is a-reference
                fSSIdxfileReferenceManage(aaNamidxfileRoot[n][0])
              } else {
                // index-file is a-referenceNo
                fSSIdxfilDisplay(aaNamidxfileRoot[n][0])
              }
              // found main-char
              bRest = false
              break
            }
          }
        }
      }
      if (bRest) {
        sIdxFrom = 'charRest'
        sIdxTo = ''
        if (aaNamidxfileRoot[nLag + 1][0].endsWith('_0')) {
          // index-file is a-reference
          fSSIdxfileReferenceManage(aaNamidxfileRoot[nLag + 1][0])
        } else {
          // index-file is a-referenceNo
          fSSIdxfilDisplay(aaNamidxfileRoot[nLag + 1][0])
        }
      }
    } else {
      // sSearchInput.length < 0
      // no input value, display this:
      oEltTabSearchOl.innerHTML = sTabSearchOl
      oEltTabSearchP.innerHTML = sTabSearchPSetText()
      sIdxfile = 'lagRoot'
    }

    /**
     * DOING: decide what to do with a-reference-index-file
     * INPUT: lagEngl03si_0, lagEngl03si_2_0
     */
    function fSSIdxfileReferenceManage(sIdxfileReferenceIn) {
      //console.log('fRefManage'+sIdxfileReferenceIn)

      if (aaSuggestions.length === 1 || aaSuggestions[0][0] !== ';' + sIdxfileReferenceIn) {
        // read it
        sIdxfile = sIdxfileReferenceIn
        sIdxfileFull = fFindNamidxfileFull(sIdxfileReferenceIn)
        sSuggestions = ''
        fetch(sIdxfileFull)
        .then(response => response.json())
        .then(data => {
          aaSuggestions = data
          if (aaSuggestions[0][1].indexOf('..') > 0) {
            let a = aaSuggestions[0][1].split('..')
            sIdxFrom = a[0]
            sIdxTo = a[1]
          } else {
            sIdxFrom = aaSuggestions[0][1]
            sIdxTo = ''
          }

          if (sIdxFrom.toUpperCase() === sSearchInput.toUpperCase() ||
              (sIdxFrom === 'charRest' && sSearchInput.length === 1)) {
            // sIdxFrom.indexOf(sSearchInput) >= 0
            fSSIdxfileReferenceDisplay(sIdxfileReferenceIn)
          } else {
            fSSFindIdxinreference()
          }
        })
      } else if (aaSuggestions[0][0] === ';' + sIdxfileReferenceIn) {
        if (aaSuggestions[0][1].split('..')[0].toUpperCase() === sSearchInput.toUpperCase()) {
          fSSIdxfileReferenceDisplay(sIdxfileReferenceIn)
        } else {
          fSSFindIdxinreference()
        }
      }

      function fSSFindIdxinreference() {
        // we have the-suggestions, find the-index-file of input-search
        for (let n = 2; n < aaSuggestions.length; n++) {
          // ["lagEngl03si_2_0","char..chas",126924],
          // IF sSearchInput < index, THEN previous is our index-file
          if (sSearchInput < aaSuggestions[n][1].split('..')[0]) {
            sIdxfile = aaSuggestions[n - 1][0]
            if (sIdxfile.endsWith('_0')) {
              fSSIdxfileReferenceManage(sIdxfile)
            } else {
              // found index-file, display it
              fSSIdxfilDisplay(sIdxfile)
            }
            break
          } else if (n + 1 === aaSuggestions.length) {
            sIdxfile = aaSuggestions[n][0]
            if (sIdxfile.endsWith('_0')) {
              fSSIdxfileReferenceManage(sIdxfile)
            } else {
              // found index-file, display it
              fSSIdxfilDisplay(sIdxfile)
            }
            break
          }
        }
      }
    }

    /**
     * DOING: display names of a-reference-index-file,
     *   make them clickable,
     *   highligts first.
     * INPUT: sIdxfileReferenceIn: lagEngl03si_0, ..
     */
    function fSSIdxfileReferenceDisplay(sIdxfileReferenceIn) {
      sIdxfile = sIdxfileReferenceIn
      if (aaSuggestions[0][0] === ';' + sIdxfileReferenceIn) {
        fSSIdxfilRefDisplayRead()
      } else {
        sIdxfileFull = fFindNamidxfileFull(sIdxfileReferenceIn)
        sSuggestions = ''
        fetch(sIdxfileFull)
        .then(response => response.json())
        .then(data => {
          aaSuggestions = data
          if (aaSuggestions[0][1].indexOf('..') > 0) {
            let a = aaSuggestions[0][1].split('..')
            sIdxFrom = a[0]
            sIdxTo = a[1]
          } else {
            sIdxFrom = aaSuggestions[0][1]
            sIdxTo = ''
          }
          sSearchInput = fSSEscapeRs(sSearchInput)
          fSSIdxfilRefDisplayRead()
        })
      }

      function fSSIdxfilRefDisplayRead() {
        for (let i = 1; i < aaSuggestions.length; i++) {
          sSuggestions = sSuggestions +
            '<li>' + aaSuggestions[i][1] + ' : ' + aaSuggestions[i][2] +
            '  (' + aaSuggestions[i][0] + ')'
        }
        if (sIdxTo) {
          oEltTabSearchP.innerHTML = aaSuggestions[0][2].toLocaleString() +
            ' ' + sIdxFrom + '..' + sIdxTo +
            ' // ' + sTabSearchPSetText()
        } else {
          oEltTabSearchP.innerHTML = aaSuggestions[0][2].toLocaleString() +
            ' ' + sIdxFrom + ' // ' + sTabSearchPSetText()
        }
        oEltTabSearchOl.innerHTML = sSuggestions
        Array.prototype.slice.call(document.querySelectorAll('#idTabCntSrchOl li')).forEach(function (oEltIn) {
          oEltIn.style.cursor = 'pointer'
          oEltIn.addEventListener('click', function () {
            let
              sIn = oEltIn.innerHTML,
              // char..chas : 126924 (lagEngl03si_2_0),
              sNif = sIn.substring(sIn.indexOf('(') + 1, sIn.indexOf(')')),
              // lagEngl03si_2_0,
              sIx = sIn.substring(0, sIn.indexOf(' ')),
              // char..chas,
              a = sIx.split('..')
            oEltTabSearchIpt.value = a[0]
            fSSIdxfilDisplay(sNif)
          })
        })
        if (aaSuggestions.length > 0) {
          let oLi = oEltTabSearchOl.getElementsByTagName('li')[0]
          oLi.classList.add('clsClicked')
          oEltClicked = oLi
        }
      }
    }

    /**
     * DOING: displays names of an-index-file
     * INPUT: sIdxfileIn: lagElln01alfa, lagEngl03si_0
     */
    function fSSIdxfilDisplay(sIdxfileIn) {
      sIdxfile = sIdxfileIn

      if (sIdxfileIn.endsWith('_0')) {
        // case: reference-index-file
        fSSIdxfileReferenceDisplay(sIdxfileIn)
      } else {
        //console.log(sIdxfileIn)
        // case: referenceNo-index-file
        // IF sIdxfileIn is different from last-read, get it

        if (!aaSuggestions || (aaSuggestions[0][0] !== ';' + sIdxfileIn)) {
          sIdxfileFull = fFindNamidxfileFull(sIdxfileIn)
          sSuggestions = ''
          fetch(sIdxfileFull)
          .then(response => response.json())
          .then(data => {
            aaSuggestions = data
            //   [";lagEngl02bi",";B..C",2276,"2021-11-03"],
            if (aaSuggestions[0][1].indexOf('..') > 0) {
              let a = aaSuggestions[0][1].split('..')
              sIdxFrom = a[0]
              sIdxTo = a[1]
            } else {
              sIdxFrom = aaSuggestions[0][1]
              sIdxTo = ''
            }
            fSSIdxfilDisplayRead()
          })
          .catch(error => console.warn(error))
        } else if (aaSuggestions[0][0] === ';' + sIdxfileIn) {
          // we have-read the-index-file, display it
          fSSIdxfilDisplayRead()
        }
      } // referenceNo-index-file

      /**
       * DOING: reads from aaSuggestions the-names that match the-search-name,
       *   formats them as preview-links,
       *   adds the-eventlistener 'link-preview' on them and
       *   //highlights the-first.
       */
      function fSSIdxfilDisplayRead() {
        let n, i
        if (aaSuggestions[0][1].indexOf('..') > 0) {
          let a = aaSuggestions[0][1].split('..')
          sIdxFrom = a[0]
          sIdxTo = a[1]
        } else {
          sIdxFrom = aaSuggestions[0][1]
          if (!sIdxFrom) sIdxFrom = 'charREST'
          sIdxTo = ''
        }
        if (sSearchInput.toUpperCase() === sIdxFrom.toUpperCase()) {
          // if sSearchInput === sIdxFrom, display all
          n = 0
          for (i = 1; i < aaSuggestions.length; i++) {
            n = n + 1
            sSuggestions = sSuggestions +
              '<li><a class="clsPreview" href="' + sPathSite + 'dirMcsh/' + // nnnFv
              aaSuggestions[i][1] + '">' +
              aaSuggestions[i][0]
            if (!document.getElementById('idTabCntSrchChk').checked) {
              if (n > 998) {
                sSuggestions = sSuggestions + '<li>...'
                break
              }
            }
          }
          if (sIdxTo) {
            oEltTabSearchP.innerHTML =
              aaSuggestions[0][2].toLocaleString() +
              ' ' + sIdxFrom + '..' + sIdxTo +
              ' // ' + sTabSearchPSetText()
          } else {
            oEltTabSearchP.innerHTML =
              aaSuggestions[0][2].toLocaleString() +
              ' ' + sIdxFrom +
              ' // ' + sTabSearchPSetText()

          }
          oEltTabSearchOl.innerHTML = sSuggestions
          fSSEvtPreview()
          if (aaSuggestions.length > 0) {
            sLi = oEltTabSearchOl.getElementsByTagName('li')[0]
            //sLi.children[0].classList.add('clsClicked')
            oEltClicked = sLi.children[0]
          }
        } else if (sSearchInput.endsWith(' ')) {
          // display exactly sSearchInput if ends in space
          n = 0
          for (i = 1; i < aaSuggestions.length; i++) {
            // suggest name
            // name'xxx = attribute of name
            // name.xxx = specific of name
            // name:xxx = generic of name
            // name/xxx = part of name
            // name//xxx = whole of name
            // name;xxx = child of name
            // name;;xxx = parent of name
            // name!... = info on name
            // name@... = part of another worldview
            // name-... = many words name
            let
              sSgn = aaSuggestions[i][0],
              sInput = sSearchInput.substring(0, sSearchInput.length-1)
            if (sInput === sSgn ||
                new RegExp("^"+sInput+"'.*").test(sSgn) ||
                new RegExp("^"+sInput+"\\..*").test(sSgn) ||
                new RegExp("^"+sInput+":.*").test(sSgn) ||
                new RegExp("^"+sInput+"/.*").test(sSgn) ||
                new RegExp("^"+sInput+"//.*").test(sSgn) ||
                new RegExp("^"+sInput+";.*").test(sSgn) ||
                new RegExp("^"+sInput+";;.*").test(sSgn) ||
                new RegExp("^"+sInput+"!.*").test(sSgn) ||
                new RegExp("^"+sInput+"-.*").test(sSgn) ||
                new RegExp("^"+sInput+"@.*").test(sSgn) ) {
              n = n + 1
              sSuggestions = sSuggestions +
                '<li><a class="clsPreview" href="' + sPathSite + 'dirMcsh/' + // nnnFv
                aaSuggestions[i][1] + '">' +
                aaSuggestions[i][0]
            }
          }
          if (sIdxTo) {
            oEltTabSearchP.innerHTML = n.toLocaleString() +
              ' // ' + aaSuggestions[0][2].toLocaleString() +
              ' ' + sIdxFrom + '..' + sIdxTo +
              ' // ' + sTabSearchPSetText()
          } else {
            oEltTabSearchP.innerHTML = n.toLocaleString() +
              ' // ' + aaSuggestions[0][2].toLocaleString() +
              ' ' + sIdxFrom +
              ' // ' + sTabSearchPSetText()
          }
          oEltTabSearchOl.innerHTML = sSuggestions
          fSSEvtPreview()
          if (sSuggestions.length > 0) {
            sLi = oEltTabSearchOl.getElementsByTagName('li')[0]
            //sLi.children[0].classList.add('clsClicked')
            oEltClicked = sLi.children[0]
          }
        } else {
          // else display part
          n = 0
          //console.log(new RegExp('^u\\+','i').test('U+0011')) // true
          sSearchInput = fSSEscapeRs(sSearchInput)
          for (i = 1; i < aaSuggestions.length; i++) {
            if (new RegExp('^' + sSearchInput, 'i').test(aaSuggestions[i][0])) {
              // IF n > 999 stop ?
              n = n + 1
              sSuggestions = sSuggestions +
                '<li><a class="clsPreview" href="' + sPathSite + 'dirMcsh/' + // nnnFv
                aaSuggestions[i][1] + '">' +
                aaSuggestions[i][0]
              if (!document.getElementById('idTabCntSrchChk').checked) {
                if (n > 998) {
                  sSuggestions = sSuggestions + '<li>...'
                  break
                }
              }
            }
          }
          if (!document.getElementById('idTabCntSrchChk').checked) {
            if (n > 998) {
              if (sIdxTo) {
                oEltTabSearchP.innerHTML = n.toLocaleString() +
                  'plus // ' + aaSuggestions[0][2].toLocaleString() +
                  ' ' + sIdxFrom + '..' + sIdxTo +
                  ' // ' + sTabSearchPSetText()
              } else {
                oEltTabSearchP.innerHTML = n.toLocaleString() +
                  'plus // ' + aaSuggestions[0][2].toLocaleString() +
                  ' ' + sIdxFrom +
                  ' // ' + sTabSearchPSetText()
              }
            } else {
              if (sIdxTo) {
                oEltTabSearchP.innerHTML = n.toLocaleString() +
                  ' // ' + aaSuggestions[0][2].toLocaleString() +
                  ' ' + sIdxFrom + '..' + sIdxTo +
                  ' // ' + sTabSearchPSetText()
              } else {
                oEltTabSearchP.innerHTML = n.toLocaleString() +
                  ' // ' + aaSuggestions[0][2].toLocaleString() +
                  ' ' + sIdxFrom +
                  ' // ' + sTabSearchPSetText()
              }
            }
          } else {
            if (sIdxTo) {
              oEltTabSearchP.innerHTML = n.toLocaleString() +
                ' // ' + aaSuggestions[0][2].toLocaleString() +
                ' ' + sIdxFrom + '..' + sIdxTo +
                ' // ' + sTabSearchPSetText()
            } else {
              oEltTabSearchP.innerHTML = n.toLocaleString() +
                ' // ' + aaSuggestions[0][2].toLocaleString() +
                ' ' + sIdxFrom +
                ' // ' + sTabSearchPSetText()
            }
          }
          oEltTabSearchOl.innerHTML = sSuggestions
          fSSEvtPreview()
          if (sSuggestions.length > 0) {
            sLi = oEltTabSearchOl.getElementsByTagName('li')[0]
            //sLi.children[0].classList.add('clsClicked')
            oEltClicked = sLi.children[0]
          }
        }
      }
    }

    /**
     * DOING: adds preview-event on links in search-suggestions and
     *   adds its text on search-input
     */
    function fSSEvtPreview() {
      // clicking on TabCntSrchOl-links, first highlight
      Array.prototype.slice.call(document.querySelectorAll('#idTabCntSrchOl a')).forEach(function (oEltIn) {
        let sTxt = oEltIn.innerHTML
        if (sTxt.indexOf('!⇒') > 0) {
          // found main-name
          oEltIn.addEventListener('click', function (oEvtIn) {
            // don't link, set main-name as search-name, search for this.
            oEvtIn.preventDefault()
            oEltTabSearchIpt.value = sTxt.substring(sTxt.indexOf('!⇒') + 2)
            fSearchSuggest()
          })
        } else {
          fEvtLink(oEltIn)
          oEltIn.addEventListener('click', function () {
            oEltTabSearchIpt.value = sTxt
          })
        }
      })
    }

    /**
     * INPUT: a-search-name string
     * OUTPUT: the same string escaped (for '+' '.' '|' '(' '*')
     *   to use it as a-regexp without special chars.
     */
    function fSSEscapeRs(sIn) {
      if (sIn.indexOf('+') !== -1) {
        sIn = sIn.split('+').join('\\+')
      }
      if (sIn.indexOf('.') !== -1) {
        sIn = sIn.split('.').join('\\.')
      }
      if (sIn.indexOf('|') !== -1) {
        sIn = sIn.split('|').join('\\|')
      }
      if (sIn.indexOf('[') !== -1) {
        sIn = sIn.split('[').join('\\[')
      }
      if (sIn.indexOf('(') !== -1) {
        sIn = sIn.split('(').join('\\(')
      }
      if (sIn.indexOf('*') !== -1) {
        sIn = sIn.split('*').join('\\*')
      }
      return sIn
    }
    document.getElementById('idCnrMainInfoDiv').scrollTop = 0 //nnn
  }

  /**
   * created: {2025-10-16}
   * preview first suggestion
   */
  async function fPreviewFirstSuggestion() {
    const nStart = Date.now()
    const nMaxWait = 1200 // miliseconds max
    let
      oLi,
      sLoc = location.href,
      sId1, sId2,
      oDoc
    while (!oLi && (Date.now() - nStart < nMaxWait)) {
      oLi = oEltTabSearchOl.getElementsByTagName('li')[0]
      if (!oLi) {
        await new Promise(resolve => setTimeout(resolve, 70)) // Poll every 70ms
      }
    }
    if (oLi && oLi.children[0]) {
      sId1 = oLi.children[0].href
      if (sId1.indexOf('#') > 0) {
        sId2 = sId1.substring(sId1.indexOf('#') + 1)
        sId1 = sId1.substring(0, sId1.indexOf('#'))
      }
      if (sLoc.indexOf('#') > 0) {
        sLoc = sLoc.substring(0, sLoc.indexOf('#'))
      }
      // internal-link
      if (sLoc === sId1) {
        oEltCnrPreviewDiv.innerHTML = '<section>' + document.getElementById(sId2).innerHTML + '</section>'
      } else {
        oEltCnrPreviewDiv.innerHTML = ''
        fetch(sId1)
        .then(response => response.text())
        .then(data => {
          if (sId2) {
            // IF #fragment url, display only this element.
            oDoc = (new DOMParser()).parseFromString(data, 'text/html')
            oEltCnrPreviewDiv.innerHTML = '<section>' + oDoc.getElementById(sId2).innerHTML + '</section>'
          } else {
            document.getElementById('idCnrPreviewDiv').innerHTML = data
          }
        })
      }
      oEltCnrPreviewDiv.style.top = '33px'
      oEltCnrPreviewDiv.style.left = '25%'
      oEltCnrPreviewDiv.style.width = '70%'
      oEltCnrPreviewDiv.style.heith = '40%'
      oEltCnrPreviewDiv.style.display = 'block'
    } else {
      console.warn('No first suggestion found')
    }
  }

  oEltTabSearchOl.addEventListener('keyup', function (oEvtIn) {
    let aLi, n, oLi
    if (oEvtIn.code === 'ArrowDown' || oEvtIn.keyCode === 40) {
      aLi = oEltTabSearchOl.getElementsByTagName('li')
      for (n = 0; n < aLi.length; n++) {
        oLi = aLi[n]
        if (oLi.children[0].className.indexOf('clsClicked') > -1 &&
            n + 1 < aLi.length) {
          oLi.children[0].classList.remove('clsClicked')
          oEltCnrPreviewDiv.style.display = 'none'
          oEltClicked = aLi[n + 1].children[0]
          aLi[n + 1].children[0].classList.add('clsClicked')
          break
        }
      }
    } else if (oEvtIn.code === 'ArrowUp' || oEvtIn.keyCode === 38) {
      aLi = oEltTabSearchOl.getElementsByTagName('li')
      for (n = 0; n < aLi.length; n++) {
        oLi = aLi[n]
        if (oLi.children[0].className.indexOf('clsClicked') > -1 &&
            n - 1 >= 0) {
          oLi.children[0].classList.remove('clsClicked')
          oEltCnrPreviewDiv.style.display = 'none'
          oEltClicked = aLi[n - 1].children[0]
          aLi[n - 1].children[0].classList.add('clsClicked')
          break
        }
      }
    }
  })
  oEltTabSearchOl.id = 'idTabCntSrchOl'
  oEltTabSearchOl.innerHTML = sTabSearchOl
  oEltTabSearchDiv.appendChild(oEltTabSearchLbl)
  oEltTabSearchDiv.appendChild(oEltTabSearchSlct)
  oEltTabSearchDiv.appendChild(oEltTabSearchP)
  oEltTabSearchDiv.appendChild(oEltTabSearchLblChk)
  oEltTabSearchDiv.appendChild(oEltTabSearchPPnm)
  oEltTabSearchDiv.appendChild(oEltTabSearchIpt)
  oEltTabSearchDiv.appendChild(oEltTabSearchOl)
  oEltTabContentDiv.appendChild(oEltTabSearchDiv)

  /**
   * DOING: returns the-text with the-number of names found in search-tab
   */
  function sTabSearchPSetText() {
    let
      nLag,
      sLag = oEltTabSearchSlct.options[oEltTabSearchSlct.selectedIndex].value
    if (sLag === 'lagALL') {
      return aaNamidxfileRoot[0][2].toLocaleString() + ' total NAMES'
    } else {
      for (let n = 1; n < aaNamidxfileRoot.length; n++) {
        if (aaNamidxfileRoot[n][0] === ';'+sLag) {
          nLag = n
          break
        }
      }
      return aaNamidxfileRoot[nLag][2].toLocaleString() + ' ' + aaNamidxfileRoot[nLag][1] +
        ' // ' + aaNamidxfileRoot[0][2].toLocaleString() + ' total NAMES'
    }
  }

  // clicking on content-link first go to its location,
  // this way the backbutton goes where we clicked
  Array.prototype.slice.call(document.querySelectorAll('#idCnrMainContentDiv a')).forEach(function (oEltIn) {
    oEltIn.addEventListener('click', function (oEvtIn) {
      let
        oEltScn = oEltIn,
        sIdScn

      oEvtIn.preventDefault()

      function fGo_where_clicked() {
        // first, go to where you clicked
        while (!oEltScn.tagName.match(/^SECTION/i)) {
          sIdScn = oEltScn.id
          if (sIdScn) {
            break
          } else {
            oEltScn = oEltScn.parentNode
          }
        }
        sIdScn = '#' + sIdScn
        if (location.hash !== sIdScn) {
          location.href = sIdScn
        }
      }

      if (oEltIn.className.indexOf('clsClicked') > -1) {
        oEltIn.classList.remove('clsClicked')
        fGo_where_clicked()
        location.href = oEltIn.href
      } else {
        oEltClicked.classList.remove('clsClicked', 'clsTtpShow', 'clsTriClicked')
        oEltClicked = oEltIn
        oEltIn.classList.add('clsClicked')
        if (oEltIn.className.indexOf('clsPreview') > -1) {
          fEvtContentClick(oEvtIn)
          fEvtPreview(oEvtIn, 'sContent')
        } else {
          location.href = oEltIn.href
        }
      }

    })
  })

  // insert MainPginf-cnr in Main-cnr */
  oEltCnrMainDiv.insertBefore(oEltCnrMainInfoDiv, oEltCnrMainDiv.firstChild)

  // Sets width of MainPginf-cnr
  function fWidthPginf(nPercentIn) {
    let
      nWidthPgcnt,
      nWidthPginf

    nWidthPginf = parseInt(window.outerWidth * (nPercentIn / 100))
    nWidthPgcnt = oEltCnrMainDiv.offsetWidth - nWidthPginf
    oEltCnrMainInfoDiv.style.width = nWidthPginf + 'px'
    oEltCnrMainContentDiv.style.width = nWidthPgcnt + 'px'
    oEltCnrMainContentDiv.style.left = nWidthPginf + 'px'
  }
  fWidthPginf(nCfgPageinfoWidth)
  // needed for proper zoom
  window.addEventListener('resize', function () {
    fWidthPginf(nCfgPageinfoWidth)
  })

  // on MainPgcnt-cnr get-id, highlight toc, highlight links, remove popup, remove clicked link
  fEvtContentClick = function (oEvtIn) {
    let sIdScn = '',
      oEltScn = oEvtIn.target

    if (oEvtIn.target.nodeName !== 'A') {
      oEltClicked.classList.remove('clsClicked', 'clsTtpShow')
    }

    oEltCnrPreviewDiv.style.display = 'none' // remove popup
    oEltCnrMenuDiv.style.display = 'none' // remove site-cnr
    oEltCnrWidthDiv.style.display = 'none' // remove width-content
    fCnrTocShow()

    /* find id of enclosing SECTION, this is-stored on toc */
    sIdScn = '#' + oEltScn.id
    while (oEltScn && !oEltScn.tagName.match(/^SECTION/i)) {
      oEltScn = oEltScn.parentNode
      if (!oEltScn.tagName) {
        break
      } else if (oEltScn.tagName.match(/^HEADER/i) ||
              oEltScn.tagName.match(/^FOOTER/i)) {
        break
      }
    }
    if (oEltScn.tagName) {
      if (oEltScn.tagName.match(/^HEADER/i)) {
        sIdScn = '#idHeader'
      } else if (oEltScn.tagName.match(/^FOOTER/i)) {
        sIdScn = '#idFooter'
      } else {
        sIdScn = '#' + oEltScn.id
      }
    }

    /* on toc highlight the-found-id */
    Array.prototype.slice.call(document.querySelectorAll('#idTocTri a')).forEach(function (oEltAIn) {
      if (oEltAIn.getAttribute('href') === sIdScn) {
        oTriUl.fTriUlExpandParent(oEltAIn)
        fTocTriHighlightNode(oEltCnrMainInfoDiv, oEltAIn)
        if (oEltAIn.scrollIntoViewIfNeeded) {
          oEltAIn.scrollIntoViewIfNeeded(true)
        } else {
          oEltAIn.scrollIntoView(false)
        }
        document.getElementById('idCnrMainInfoDiv').scrollLeft = 0
      }
    })

    // on found-id on a-elt add clsClickCnt
    sQrslrAClkLast = sQrslrAClk
    let oElt = oEvtIn.target
    sQrslrAClk = '#' + oElt.id + ' a'
    while (sQrslrAClk === '# a') {
      oElt = oElt.parentNode
      sQrslrAClk = '#' + oElt.id + ' a'
    }
    if (sQrslrAClkLast !== sQrslrAClk) {
      Array.prototype.slice.call(document.querySelectorAll(sQrslrAClkLast)).forEach(function (oEltAIn) {
        oEltAIn.classList.remove('clsClickCnt')
      })
      Array.prototype.slice.call(document.querySelectorAll(sQrslrAClk)).forEach(function (oEltAIn) {
        oEltAIn.classList.add('clsClickCnt')
      })
    }
  }

  // on MainPgcnt-cnr get id on mouseover and highlight toc
  fEvtMouseoverContent = function (oEvtIn) {
    let sIdScn = '',
      oEltScn = oEvtIn.target

    // Find id of enclosing SECTION, this is-stored on toc
    sIdScn = '#' + oEltScn.id
    while (oEltScn && !oEltScn.tagName.match(/^SECTION/i)) {
      oEltScn = oEltScn.parentNode
      if (!oEltScn.tagName) {
        break
      } else if (oEltScn.tagName.match(/^HEADER/i) ||
                 oEltScn.tagName.match(/^FOOTER/i)) {
        break
      }
    }
    if (oEltScn.tagName) {
      if (oEltScn.tagName.match(/^HEADER/i)) {
        sIdScn = '#idHeader'
      } else if (oEltScn.tagName.match(/^FOOTER/i)) {
        sIdScn = '#idFooter'
      } else {
        sIdScn = '#' + oEltScn.id
      }
    }

    // on toc highlight the-found-id
    Array.prototype.slice.call(document.querySelectorAll('#idTocTri a')).forEach(function (oEltAIn) {
      if (oEltAIn.getAttribute('href') === sIdScn) {
        oTriUl.fTriUlExpandParent(oEltAIn)
        fTocTriHighlightNode(oEltCnrMainInfoDiv, oEltAIn)
        if (oEltAIn.scrollIntoViewIfNeeded) {
          oEltAIn.scrollIntoViewIfNeeded(true)
        } else {
          oEltAIn.scrollIntoView(false)
        }
        document.getElementById('idCnrMainInfoDiv').scrollLeft = 0
      }
    })
  }
  // events click, mouseover on elements in page-content-container
  Array.prototype.slice.call(document.querySelectorAll('#idCnrMainContentDiv *[id]:not([id^="idSrch"])')).forEach(function (oEltIn) {
    oEltIn.addEventListener('click', fEvtContentClick)
    //oEltIn.addEventListener('mouseover', fEvtMouseoverContent)
  })
  Array.prototype.slice.call(document.querySelectorAll('#idCnrMainInfoDiv *[id]')).forEach(function (oEltIn) {
    oEltIn.addEventListener('click', function () {
      oEltCnrPreviewDiv.style.display = 'none' // remove popup
      oEltCnrMenuDiv.style.display = 'none' // remove site-cnr
      oEltCnrWidthDiv.style.display = 'none' // remove width-content
    })
  })

  // event click on TAB-Headers
  Array.prototype.slice.call(document.querySelectorAll('ul#idPginfTabHeadersUl li')).forEach(function (oEltIn) {
    oEltIn.addEventListener('click', function (oEvtIn) {
      oEvtIn.preventDefault()
      // Remove any 'active' class
      document.querySelector('.clsTabActive').classList.remove('clsTabActive')
      // Add 'active' class to selected tab
      oEltIn.classList.add('clsTabActive')
      // Hide all tab content
      Array.prototype.slice.call(document.getElementsByClassName('clsTabCnt')).forEach(function (oEltIn) {
        oEltIn.style.display = 'none'
      })
      // Show content of active tab
      sIdTabActive = document.querySelector('.clsTabActive a').getAttribute('href').substring(1)
      document.getElementById(sIdTabActive).style.display = 'block'
      if (sIdTabActive === 'idTabCntSrchDiv') {
        // on TabCntSrch focus input-element
        oEltTabSearchIpt.focus()
      }
      // return false
    })
  })
  document.getElementById('idTabCntSrchDiv').style.display = 'none'

  // insert popup-container
  oEltCnrPreviewDiv.id = 'idCnrPreviewDiv'
  oEltBody.appendChild(oEltCnrPreviewDiv)

  // change font
  document.getElementById('idRdbFontMono').addEventListener('click', function () {
    oEltBody.style.fontFamily = 'fntUbuntuMonoRgr, "Courier New", "Lucida Console"'
  })
  document.getElementById('idRdbFontSerif').addEventListener('click', function () {
    oEltBody.style.fontFamily = '"Times New Roman", Georgia'
  })
  document.getElementById('idRdbFontSSerif').addEventListener('click', function () {
    oEltBody.style.fontFamily = 'Arial, Verdana'
  })

  // change mode
  document.getElementById('idRdbModeDark').addEventListener('click', function () {
    oEltBody.setAttribute('class', 'clsDark')
  })
  document.getElementById('idRdbModeLight').addEventListener('click', function () {
    oEltBody.classList.remove('clsDark')
  })

  // event on clicking a link in toc
  Array.prototype.slice.call(document.querySelectorAll('#idTocTri li > a')).forEach(function (oEltIn) {
    oEltIn.addEventListener('click', function (oEvtIn) {
      oEvtIn.preventDefault()
      oEltClicked.classList.remove('clsTtpShow')
      if (oEltIn.className.indexOf('clsPreview') > -1) {
        if (oEltIn.className.indexOf('clsClicked') > -1) {
          oEltIn.classList.remove('clsClicked')
          oEltCnrPreviewDiv.style.display = 'none'
          location.href = '#' + oEvtIn.target.href.split('#')[1]
          fTocTriHighlightNode(oEltCnrMainInfoDiv, oEltIn)
        } else {
          oEltClicked.classList.remove('clsClicked')
          oEltClicked = oEltIn
          oEltIn.classList.add('clsClicked')
          fEvtPreview(oEvtIn)
        }
      } else {
        oEltCnrPreviewDiv.style.display = 'none'
        location.href = '#' + oEvtIn.target.href.split('#')[1]
        fTocTriHighlightNode(oEltCnrMainInfoDiv, oEltIn)
      }
    })
  })

  // event on double-clicking id
  // searches the-text inside id
  Array.prototype.slice.call(document.querySelectorAll('#idSearch')).forEach(function (oEltIn) {
    let sSearch = oEltIn.innerHTML.trim()
    oEltIn.style.cursor = 'pointer'
    oEltIn.addEventListener('dblclick', function (oEvtIn) {
      oEvtIn.preventDefault()
      oEltTabSearchIpt.value = sSearch
      fSearchSuggest()
      fCnrSearchShow()
    })
  })
  // insert no keyboard chars
  Array.prototype.slice.call(document.querySelectorAll('#idSrchpnm')).forEach(function (oEltIn) {
    let sSearch = oEltIn.innerHTML.trim()
    oEltIn.style.cursor = 'pointer'
    oEltIn.addEventListener('click', function (oEvtIn) {
      oEvtIn.preventDefault()
      oEltTabSearchIpt.value = oEltTabSearchIpt.value +sSearch
      fSearchSuggest()
      oEltTabSearchIpt.focus()
    })
  })

  // clicking on PginfPathP-links and TabCntSrchOl-links, first highlight
  Array.prototype.slice.call(document.querySelectorAll('#idPginfPathP a, #idTabCntSrchOl a')).forEach(function (oEltIn) {
    fEvtLink(oEltIn)
  })

  // set audio-players
  //  <span class="clsAudio">
  //    <button class="clsAudioBtn">🗣</button>
  //    <audio src="file.mp3"></audio>
  //  </span>
  const oAudioPlayers = document.querySelectorAll('.clsAudio')
  oAudioPlayers.forEach(oEltAudio => {
    const oAudio = oEltAudio.querySelector('audio')
    const oAudioBtn = oEltAudio.querySelector('.clsAudioBtn')
    const sAudioIcon = oAudioBtn.textContent
    oAudioBtn.addEventListener('click', () => {
      if (oAudio.paused) {
        oAudio.play()
        oAudioBtn.textContent = '⏸' // Pause icon
      } else {
        oAudio.pause()
        oAudioBtn.textContent = sAudioIcon
      }
    })
    oAudio.addEventListener('ended', () => {
       oAudioBtn.textContent = sAudioIcon
    })
    oAudio.addEventListener('pause', () => {
        oAudioBtn.textContent = sAudioIcon
    })
  })

  window.onhashchange = function () {
    location.href = location.hash
  }

  // focus on right-div, Div can get the focus if it has tabindex attribute... on chrome
  document.getElementById('idCnrMainContentDiv').setAttribute('tabindex', -1)
  document.getElementById('idCnrMainContentDiv').focus()
}

// on clsPreview-links add this event-listener
let fEvtPreview = function (oEvtIn, sContent) {
  let sLoc, sId1, sId2,
    nPy, nPx, nWh, nWw,
    oDoc
  oEvtIn.preventDefault()
  oEvtIn.stopPropagation()
  nPx = oEvtIn.pageX
  nPy = oEvtIn.pageY
  nWh = window.innerHeight
  nWw = window.innerWidth
  if (oEvtIn.target.nodeName === 'IMG') {
    // links on img-elements
    sId1 = oEvtIn.target.parentNode.href
  } else {
    sId1 = oEvtIn.target.href
  }
  if (sId1.indexOf('#') > 0) {
    sId2 = sId1.substring(sId1.indexOf('#') + 1)
    sId1 = sId1.substring(0, sId1.indexOf('#'))
  }
  sLoc = location.href
  if (sLoc.indexOf('#') > 0) {
    sLoc = sLoc.substring(0, sLoc.indexOf('#'))
  }
  // internal-link
  if (sLoc === sId1) {
    oEltCnrPreviewDiv.innerHTML = '<section>' + document.getElementById(sId2).innerHTML + '</section>'
  } else {
    oEltCnrPreviewDiv.innerHTML = ''
    fetch(sId1)
    .then(response => response.text())
    .then(data => {
      if (sId2) {
        // IF #fragment url, display only this element.
        oDoc = (new DOMParser()).parseFromString(data, 'text/html')
        oEltCnrPreviewDiv.innerHTML = '<section>' + oDoc.getElementById(sId2).innerHTML + '</section>'
      } else {
        // IF link to a picture, display it, not its code.
        if (sId1.match(/(png|jpg|gif)$/)) {
          let oImg = new Image()
          let nIW, nIH, nPW, nPH
          nPW = nWw / 2.2
          nPH = nWh * 0.4
          oImg.src = sId1
          oImg.addEventListener('load', function () {
            nIW = oImg.width
            nIH = oImg.height
            if (nIH > nPH) {
              nIW = (nIW * nPH) / nIH
              nIH = nPH
            }
            oEltCnrPreviewDiv.innerHTML = '<p class="clsCenter"><img src="' + sId1 +
              '" width="' + nIW +
              '" height="' + nIH + '" /></p>'
          })
        } else {
          document.getElementById('idCnrPreviewDiv').innerHTML = data
        }
      }
    })
  }

  if (sContent) {
    oEltCnrPreviewDiv.style.top = (nWh / 2) - (nWh * 0.44 / 2) + 'px' // the height of popup is 44% of window
    if (nPx < nWw / 2) {
      oEltCnrPreviewDiv.style.left = (nWw / 2) + 9 + 'px'
    } else {
      oEltCnrPreviewDiv.style.left = 26 + 'px'
      oEltCnrPreviewDiv.style.width = (nWw / 2) + 'px'
    }
  } else {
    oEltCnrPreviewDiv.style.top = (nWh / 2) - (nWh * 0.74 / 2) + 'px' // the height of popup is 74% of window
    oEltCnrPreviewDiv.style.left = (nWw / 3) + 'px'
    oEltCnrPreviewDiv.style.width = 'auto'
  }
  oEltCnrPreviewDiv.style.display = 'block'
}

/**
 * created: {2013-07-17}
 * Returns a string html-ul-element that holds
 * the-toc-tree with the-headings of the-page.
 * <ul id="idTocTri" class="clsTreeUl">
 *   <li><a class="clsPreview" href="#idHeader">SynAgonism</a>
 *     <ul>
 *       <li><a href="#heading">heading</a><li>
 *       <li><a href="#heading">heading</a><li>
 *     </ul>
 *   <li>
 * </ul>
 */
let fTocTriCreate = function () {
  let
    aElm = document.body.getElementsByTagName('*'),
    aHdng = [],
    nLvlThis, nLvlNext, nLvlPrev = 0, nLvlToc = 0, n, nJ,
    rHdng = /h\d/i,
    sUl = '', sHcnt, sHid, sHlvl,
    oElt

  for (n = 0; n < aElm.length; n += 1) {
    oElt = aElm[n]
    if (rHdng.test(oElt.nodeName)) {
      aHdng.push(oElt)
    }
    // and and the 'footer' element
    if (oElt.nodeName.match(/footer/i)) {
      aHdng.push(oElt)
    }
  }
  aElm = []

  // the first heading is the title of doc
  sHcnt = aHdng[0].innerHTML
  sHcnt = sHcnt.replace(/\n {4}<a class="clsHide" href=[^<]+<\/a>/, '')
  sHcnt = sHcnt.replace(/<br\/*>/g, ' ')
  sUl = '<ul id="idTocTri" class="clsTreeUl"><li><a class="clsPreview" href="#idHeader">' + sHcnt + '</a>'

  for (n = 1; n < aHdng.length; n += 1) {
    oElt = aHdng[n]
    // special footer case
    if (oElt.nodeName.match(/footer/i)) {
      nLvlThis = 1
      nLvlToc = 1
      sUl += '<li><a class="clsPreview" href="#idFooter">footer</a></li>'
      nLvlPrev = 1
      continue
    }
    nLvlThis = oElt.nodeName.substr(1, 1)
    if (nLvlThis > nLvlPrev) {
      sUl += '<ul>' // new list
      nLvlToc = 1 + parseInt(nLvlToc, 10)
    }
    sHid = oElt.id
    sHlvl = sHid.charAt(sHid.length - 1)
    sHid = sHid.replace(/(\w*)H\d/, '$1')
    // removes from heading the 'clsHide' content
    sHcnt = oElt.innerHTML
    // jslint regexp: true
    sHcnt = sHcnt.replace(/\n {4}<a class="clsHide" href=[^<]+<\/a>/, '')
    sHcnt = sHcnt.replace(/<[^>]+>/g, '')
    // jslint regexp: false
    sHcnt = sHcnt.replace(/<br\/*>/g, ' ')
    if (sHid === 'idComment') {
      sUl += '<li><a href="#' + sHid + '">' + sHcnt + '</a>'
    } else {
      sUl += '<li><a class="clsPreview" href="#' + sHid + '">' + sHcnt + '</a>'
    }
    if (aHdng[n + 1]) {
      nLvlNext = aHdng[n + 1].nodeName.substr(1, 1)
      if (aHdng[n + 1].nodeName.match(/footer/i)) {
        nLvlNext = 1
      }
      if (nLvlThis > nLvlNext) {
        nLvlToc = nLvlToc - nLvlNext
        for (nJ = 0; nJ < nLvlToc; nJ += 1) {
          sUl += '</li></ul></li>'
        }
        nLvlToc = nLvlNext
      }
      if (nLvlThis === nLvlNext) {
        sUl += '</li>'
      }
    }
    nLvlPrev = nLvlThis
  }
  sUl += '</li></ul></li></ul>'
  return sUl
}

/**
 * Highlights ONE item in toc-list
 */
let fTocTriHighlightNode = function (oEltCnrMainInfoDiv, oElm) {
  // removes existing highlighting
  let
    aTocTriA = oEltCnrMainInfoDiv.getElementsByTagName('a'),
    n

  for (n = 0; n < aTocTriA.length; n += 1) {
    aTocTriA[n].classList.remove('clsTocTriHighlight')
  }
  oElm.classList.add('clsTocTriHighlight')
}

/**
 * Created: {2016-07-20}
 * Makes collapsible-trees, unordered-lists with clsTreeUl.
 */
let oTriUl = (function () {
  let oTriUl = {}

  /**
   * DOING: it creates one-clsTreeUl-list tree.
   * If no input, creates ALL lists of the-doc, trees.
   * PROBLEM: it does-not-work for one tree {2021-11-20}
   */
  oTriUl.fTriUlCreate = function (oUlIn) {
    // find all clsTreeUl-lists
    let
      aLi,
      aUl,
      aUlSub,
      n, n2,
      oEltI

    if (oUlIn) {
      aUl = [oUlIn]
    } else {
      aUl = document.querySelectorAll('.clsTreeUl')
    }

    for (n = 0; n < aUl.length; n++) {
      //if (!aUl[n].getElementsByClassName('clsFa')) {
      // add the-clsTreeUl to the-sub-lists
      let aSubul = aUl[n].getElementsByTagName('ul')
      if (aSubul.length >0 && !aSubul[0].className) {
        for (n2 = 0; n2 < aSubul.length; n2++) {
          aSubul[n2].className = 'clsTreeUl'
        }

        // on first li:
        // add node-image
        // add event-listener
        aLi = aUl[n].getElementsByTagName('li')
        for (n2 = 0; n2 < aLi.length; n2++) {
          aUlSub = aLi[n2].getElementsByTagName('ul')

          oEltI = document.createElement('i')
          oEltI.setAttribute('class', 'clsFa clsFaCircleCol')
          if (aUlSub.length === 0) {
            oEltI.setAttribute('class', 'clsFa clsFaCircle')
          } else {
            oEltI.addEventListener('click', fTriUlListenerClickCreate(aLi[n2]))
          }
          aLi[n2].insertBefore(oEltI, aLi[n2].firstChild)

          // collapse the-lists within this listitem
          oTriUl.fTriUlToggleLi(aLi[n2])

          // first-level expand
          if (aLi[n2].parentNode.parentNode.nodeName !== 'LI') {
            oTriUl.fTriUlToggleLi(aLi[n2])
          }
        }
      }
    }
  }

  /**
   * Expands or Collapses an-input-listitem.
   *
   * @input {object} oEltLiIn The-listitem to toggle
   */
  oTriUl.fTriUlToggleLi = function (oEltLiIn) {
    let
      aUl,
      // determine whether to expand or collaple,
      bCollapsed = oEltLiIn.firstChild.className.indexOf('clsFaCircleExp') > -1,
      n,
      oEltLi

    // find uls of input li
    aUl = oEltLiIn.getElementsByTagName('ul')
    for (n = 0; n < aUl.length; n++) {
      // toggle display of first-level ul
      oEltLi = aUl[n]
      while (oEltLi.nodeName !== 'LI') {
        oEltLi = oEltLi.parentNode
      }
      if (oEltLi === oEltLiIn) {
        aUl[n].style.display = bCollapsed ? 'block' : 'none'
      }
    }

    if (aUl.length > 0) {
      if (bCollapsed) {
        if (oEltLiIn.firstChild.tagName === 'I') {
          oEltLiIn.firstChild.classList.remove('clsFaCircleExp')
          oEltLiIn.firstChild.classList.add('clsFaCircleCol')
        }
      } else {
        if (oEltLiIn.firstChild.tagName === 'I') {
          oEltLiIn.firstChild.classList.remove('clsFaCircleCol')
          oEltLiIn.firstChild.classList.add('clsFaCircleExp')
        }
      }
    }
  }

  /** Makes the display-style: none. */
  oTriUl.fTriUlCollapseAll = function (sIdTriIn) {
    let
      aSubnodes,
      aTriLi = document.getElementById(sIdTriIn).getElementsByTagName('li'),
      n

    for (n = 0; n < aTriLi.length; n += 1) {
      aSubnodes = aTriLi[n].getElementsByTagName('ul')
      if (aSubnodes.length > 0 && aSubnodes[0].style.display === 'block') {
        oTriUl.fTriUlToggleLi(aTriLi[n])
      }
    }
  }

  /** Makes the display-style: block. */
  oTriUl.fTriUlExpandAll = function (sIdTriIn) {
    let
      aSubnodes,
      aTriLi = document.getElementById(sIdTriIn).getElementsByTagName('li'),
      n

    for (n = 0; n < aTriLi.length; n += 1) {
      aSubnodes = aTriLi[n].getElementsByTagName('ul')
      if (aSubnodes.length > 0 && aSubnodes[0].style.display === 'none') {
        oTriUl.fTriUlToggleLi(aTriLi[n])
      }
    }
  }

  /** Expands Level-1 of treeUl with given id. */
  oTriUl.fTriUlExpandLevel1 = function (sIdTriIn) {
    let oTriLi, oTriLiUl

    oTriLi = document.getElementById(sIdTriIn).getElementsByTagName('li')[0]
    /* expand the first ul-element */
    oTriLiUl = oTriLi.getElementsByTagName('ul')[0]
    if (oTriLiUl.style.display === 'none') oTriUl.fTriUlToggleLi(oTriLi)
  }

  /** Expands to Level-2 of treeUl with given id. */
  oTriUl.fTriUlExpandLevel2 = function (sIdTriIn) {
    let
      oTriLi,
      oTriLiUl

    // ul-trees have one li with 'title'
    oTriLi = document.getElementById(sIdTriIn).getElementsByTagName('li')[0]
    // expand the first ul-element
    oTriLiUl = oTriLi.getElementsByTagName('ul')[0]
    if (oTriLiUl && oTriLiUl.style.display === 'none') oTriUl.fTriUlToggleLi(oTriLi)
    // find sibling-li of ul
    oTriLi = oTriLiUl.getElementsByTagName('li')[0]
    while (oTriLi) {
      oTriLiUl = oTriLi.getElementsByTagName('ul')[0]
      if (oTriLiUl && oTriLiUl.style.display === 'none') oTriUl.fTriUlToggleLi(oTriLi)
      oTriLi = oTriLi.nextElementSibling
    }
  }

  /** Expands to Level-3 of treeUl with given id. */
  oTriUl.fTriUlExpandLevel3 = function (sIdTriIn) {
    let
      oTriLi,
      oTriLi2,
      oTriLi3,
      oTriLiUl,
      oTriLiUl2,
      aTriLiUl2 = [],
      oTriLiUl3,
      n

    // ul-trees have one li with 'title'
    oTriLi = document.getElementById(sIdTriIn).getElementsByTagName('li')[0]
    // expand the first ul-element
    oTriLiUl = oTriLi.getElementsByTagName('ul')[0]
    if (oTriLiUl.style.display === 'none') oTriUl.fTriUlToggleLi(oTriLi)

    // find sibling-li of level-2
    oTriLi2 = oTriLiUl.getElementsByTagName('li')[0]
    while (oTriLi2) {
      oTriLiUl2 = oTriLi2.getElementsByTagName('ul')[0]
      aTriLiUl2.push(oTriLiUl2)
      if (oTriLiUl2 && oTriLiUl2.style.display === 'none') {oTriUl.fTriUlToggleLi(oTriLi2)}
      oTriLi2 = oTriLi2.nextElementSibling
    }

    for (n = 0; n < aTriLiUl2.length; n += 1) {
      // find sibling-li of level-3
      oTriLi3 = aTriLiUl2[n].getElementsByTagName('li')[0]
      while (oTriLi3) {
        oTriLiUl3 = oTriLi3.getElementsByTagName('ul')[0]
        if (oTriLiUl3 && oTriLiUl3.style.display === 'none') oTriUl.fTriUlToggleLi(oTriLi3)
        oTriLi3 = oTriLi3.nextElementSibling
      }
    }
  }

  /**
   * Expands all the parents ONLY, of an element with link to a heading.
   */
  oTriUl.fTriUlExpandParent = function (oEltAIn) {
    let oEltI, oEltUl

    oTriUl.fTriUlCollapseAll('idTocTri')
    // the parent of a-link-elm is li-elm with parent a ul-elm.
    oEltUl = oEltAIn.parentNode.parentNode
    while (oEltUl.tagName === 'UL') {
      oEltUl.style.display = 'block'
      // the parent is li-elm, its first-child is img
      oEltI = oEltUl.parentNode.firstChild
      if (oEltI.tagName === 'I' && oEltI.className.indexOf('clsFaCircleExp') > -1) {
        oEltI.classList.remove('clsFaCircleExp')
        oEltI.classList.add('clsFaCircleCol')
      }
      oEltUl = oEltUl.parentNode.parentNode
    }
  }

  /**
   * Returns a-click-listener that toggles the input listitem.
   *
   * @input {object} oEltLiIn The-listitem to toggle
   */
  function fTriUlListenerClickCreate (oEltLiIn) {
    return function (oEvtIn) {
      let
        oEltI = oEvtIn.target,
        oEltLi = (oEvtIn.target.parentNode),
        sIcls = oEltI.className

      if (oEltLi === oEltLiIn) {
        oTriUl.fTriUlToggleLi(oEltLiIn)
      }
      if (sIcls.indexOf('clsFaCircleExp') > -1) {
        oEltI.classList.remove('clsFaCircleExp')
        oEltI.classList.add('clsFaCircleCol')
      } else if (sIcls.indexOf('clsFaCircleCol') > -1) {
        oEltI.classList.remove('clsFaCircleCol')
        oEltI.classList.add('clsFaCircleExp')
      }

/*
      // this code FIRST shows what we clicked and then expand|collapse
      if (sIcls.indexOf('clsTriClicked') > -1) {
        oEltClicked.classList.remove('clsTriClicked')
        oEltI.classList.remove('clsTriClicked')
        if (oEltLi === oEltLiIn) {
          oTriUl.fTriUlToggleLi(oEltLiIn)
        }
        if (sIcls.indexOf('clsFaCircleExp') > -1) {
          oEltI.classList.remove('clsFaCircleExp')
          oEltI.classList.add('clsFaCircleCol')
        } else if (sIcls.indexOf('clsFaCircleCol') > -1) {
          oEltI.classList.remove('clsFaCircleCol')
          oEltI.classList.add('clsFaCircleExp')
        }
      } else {
        oEltClicked.classList.remove('clsClicked', 'clsTtpShow', 'clsTriClicked')
        oEltClicked = oEltI
        oEltI.classList.add('clsTriClicked')
      }
*/
    }
  }

  return oTriUl
})()

/**
 * DOING: reads the-config, site-menu, namidx.lagRoot files, if exist,
 * and creates the-containers of the-page.
 */
if (location.hostname !== '') {
  // no server, display only Toc
  sPathSite = location.origin + '/'
}

if (sPathSite) {
  // read configMcs
  await fetch(sPathSite + 'configMcs.json') // HitpConfig
  .then(response => response.json())
  .then(oConfig => {
    if (oConfig.nCfgPageinfoWidth) {
      nCfgPageinfoWidth = oConfig.nCfgPageinfoWidth
    }
    if (oConfig.sCfgHomeLocal) {
      sCfgHomeLocal = oConfig.sCfgHomeLocal
      if (location.hostname === 'localhost') {
        sPathSite = location.origin + sCfgHomeLocal
        sPathSitemenu = sPathSite + 'fileSitestructureLocal.html' // nnn
      } else if (location.hostname.length > 1) {
        sPathSite = location.origin + '/'
        sPathSitemenu = sPathSite + 'fileSitestructure.html' // nnn
      }
    }
  })
  .catch(sPathSite="error")

  // read site-structure
  async function fFetchSiteMenu() {
    try {
      const response = await fetch(sPathSitemenu)
      if (response.status !== 404) sEltSitemenuUl = await response.text()
    } catch (error) {
      sEltSitemenuUl = ''
    }
  }
  fFetchSiteMenu()

  // read lagRoot
  await fetch(sPathSite + 'dirMcsh/dirNamidx/namidx.lagRoot.json') // nnnFv
  .then(response => response.json())
  .then(data => aaNamidxfileRoot=data)
}

fContainersInsert()
oTriUl.fTriUlCreate()
// IF on idMetaWebpage_path paragraph we have and the clsTocExpand
// then the toc expands-all
if (document.getElementById('idMetaWebpage_path')) {
  if (document.getElementById('idMetaWebpage_path').getAttribute('class') === 'clsTocExpand') {
    oTriUl.fTriUlExpandAll('idTocTri')
  }
}
if (location.hash) {
  location.href = location.hash
}
document.getElementById('idCnrMainContentDiv').focus()

/**
 * DOING: creates object {file: index} from [[file,idx,quantity]]
 * INPUT: aIn = [['lagEngl01ei','A',1234]]
 * OUTPUT: {laEngl01ei:'A'}
 */
function fCreateOFile_Index(aIn) {
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
 * INPUT: lagEngl01ei, lagElln01alfa
 * OUTPUT: site/dirMcsh/dirNamidx/dirLagEngl/namidx.lagEngl01ei.json
 */
function fFindNamidxfileFull(sIdxfileIn) {
  return sPathSite + 'dirMcsh/dirNamidx/dirL' + sIdxfileIn.substring(1, 7) + // nnnFv and dirNamIdx
         '/namidx.' + sIdxfileIn + '.json'
}

/**
 * DOING: it finds the-namidx-json-file to search a-name-link
 * INPUT:
 *  - sNameIn: 'νύφη'
 *  - sLagIn: 'lagElln'
 *  - aaNamidxIdxIn: [["lagEngl01ei","A|a"]]
 * OUTPUT: ["lagElln15omikron_0","Ό|Ο|ο|ό"]
 */
async function fFindNamidxfile(sNameIn, sLagIn, aaNamidxIdxIn) {
  let
    aNamidxfile_IdxOut, // the-output Namidxfile-index info
    oNamidxfile_Idx,
    bRest = true,
    // if first-char of nameIn NOT in an-index in the-lag, then it is a-charREST in this lag
    sCharName,    // the-first char of nameIn
    sIndex,       // the-chars-of-index in the-Namidx-file
    sIdxFrom,
    sIdxTo,
    sNamidx,      // name of Namidx-file on which to store the-word
    sNamidxOut,
    sNamidxRest,  // name of Namidx-file with rest words on input-lag
    nCharName,
    nIdxFrom,
    nIdxTo,
    sNamidxRefFull

  // FIND Namidx-file
  // choose root-char or rest
  sCharName = sNameIn[0].substring(0,1)
  oNamidxfile_Idx = fCreateOFile_Index(aaNamidxIdxIn)
  // {lagEngl01ei:'A|a'}

  for (sNamidx in oNamidxfile_Idx) {
    if (sNamidx.startsWith(sLagIn)) {
      sIndex = oNamidxfile_Idx[sNamidx]

      if (sIndex.indexOf('..') < 0) {
        // index is a-set of chars 'B|b|'
        if (sIndex.indexOf(sCharName) >= 0) {
          // found Namidx-file
          bRest = false
          sNamidxOut = sNamidx
          aNamidxfile_IdxOut = [sNamidxOut, sIndex]
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
          if (sNameIn >= sIdxFrom && sNameIn < sIdxTo) {
            // found Namidx-file
            bRest = false
            sNamidxOut = sNamidx
            aNamidxfile_IdxOut = [sNamidxOut, sIndex]
            break
          }
        } else {
          //compare codepoints
          nCharName = sCharName.codePointAt()
          // if srch-char is a-supplement with surrogates (high 55296–56319), find it
          if (nCharName >= 55296 && nCharName <= 56319) {
            let sSupplement = String.fromCodePoint(sNameIn[0].charAt(0).charCodeAt(0),
                                                   sNameIn[0].charAt(1).charCodeAt(0))
            nCharName = sSupplement.codePointAt()
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
          if (nCharName >= nIdxFrom && nCharName < nIdxTo) {
            // found Namidx-file
            bRest = false
            sNamidxOut = sNamidx
            aNamidxfile_IdxOut = [sNamidxOut, sIndex]
            break
          }
        }
      }
    }
    // in case where rest-file is reference ('_0')
    if (sNamidx.startsWith(sLagIn + '00'))
      sNamidxRest = sNamidx
  }
  if (bRest) {
    sNamidxOut = sNamidxRest
    aNamidxfile_IdxOut = [sNamidxOut, '']
  }

  if (!sNamidxOut.endsWith('_0')) {
    aNamidxfile_IdxOut = [sNamidxOut, sIndex]
    //console.log(aNamidxfile_IdxOut)
    return aNamidxfile_IdxOut
  } else {
    sNamidxRefFull = fFindNamidxfileFull(sNamidxOut)
    const response = await fetch(sNamidxRefFull)
    const json = await response.json()
    return fFindNamidxfile(sNameIn, sLagIn, json)
  }
}

/**
 * DOING: it searches for a-name of a-language
 * INPUT: sNameIn, sLagIn=lagElln, 
 * OUTPUT: promise of array of name-link-array [[name, link]]
 */
async function fSearchName(sNameIn, sLagIn) {
  let
    aFile,
    aaOut = [],
    n

  aFile = await fFindNamidxfile(sNameIn, sLagIn, aaNamidxfileRoot)
  const response = await fetch(fFindNamidxfileFull(aFile[0]))
  const json = await response.json()
  for (n = 1; n < json.length; n++) {
    // it searches for names that begin win nameIn, case insensitive
    if (new RegExp('^' + sNameIn, 'i').test(json[n][0])){
      aaOut.push(json[n])
    }
  }
  return aaOut
}

// oEltClicked, sIdxfile, sIdxTo,  sIdxFrom, sQrslrAClk, sQrslrAClkLast
export {
  aaNamidxfileRoot, aaSuggestions, aVersion, ooFile_cnpt,
  bEdge, bFirefox,
  nCfgPageinfoWidth,
  fContainersInsert, fEvtPreview, fTocTriCreate, fTocTriHighlightNode, fSearchName,
  oEltCnrPreviewDiv, sEltSitemenuUl, oTriUl,
  sCfgHomeLocal, sPathSite, sPathSitemenu
}
