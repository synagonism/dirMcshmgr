/*
 * mGiscus.js - loads Giscus comments (GitHub Discussions of synagonism/comments)
 * into the <div class="giscus" data-term="..."> of a page.
 * Usage in a page:
 *   <div class="giscus" data-term="McsCorGiscus"></div>
 *   <script src="/dirMcshmgr/mGiscus.js"></script>
 * mMcsh2.js rebuilds the body after DOMContentLoaded, so giscus is attached after it.
 * The giscus theme follows the site's clsDark class on <body>.
 * No data-loading="lazy": the page scrolls inside idCnrMainContentDiv, so a lazy iframe never loads.
 */
(function () {
  var sOrigin = 'https://giscus.app'

  function fTheme() {
    return document.body.classList.contains('clsDark') ? 'dark' : 'light'
  }

  function fGiscusLoad() {
    var oDiv = document.querySelector('div.giscus')
    if (!oDiv || oDiv.querySelector('iframe')) return
    var oScript = document.createElement('script')
    var oAttr = {
      'src': sOrigin + '/client.js',
      'data-repo': 'synagonism/comments',
      'data-repo-id': 'R_kgDOVoFDnA',
      'data-category': 'Comments',
      'data-category-id': 'DIC_kwDOVoFDnM4DKucP',
      'data-mapping': 'specific',
      'data-term': oDiv.getAttribute('data-term') || document.title,
      'data-strict': '1',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '0',
      'data-input-position': 'top',
      'data-theme': fTheme(),
      'data-lang': 'en',
      'crossorigin': 'anonymous'
    }
    Object.keys(oAttr).forEach(function (sKey) {
      oScript.setAttribute(sKey, oAttr[sKey])
    })
    oScript.async = true
    document.head.appendChild(oScript)

    // keeps giscus' theme equal to the site's (body.clsDark), which can change
    // after this script ran (preferences) or later (dark/light switch)
    var sThemeSent = oAttr['data-theme']
    var bReady = false
    function fThemeSync() {
      var oFrame = document.querySelector('iframe.giscus-frame')
      if (bReady && oFrame && fTheme() !== sThemeSent) {
        sThemeSent = fTheme()
        oFrame.contentWindow.postMessage({giscus: {setConfig: {theme: sThemeSent}}}, sOrigin)
      }
    }
    new MutationObserver(fThemeSync)
      .observe(document.body, {attributes: true, attributeFilter: ['class']})
    // giscus posts messages when its frame is ready: sync then
    window.addEventListener('message', function (oEvt) {
      if (oEvt.origin === sOrigin && oEvt.data && oEvt.data.giscus) {
        bReady = true
        fThemeSync()
      }
    })
  }

  // mMcsh2.js copies the body into idCnrMainContentDiv as html, after its
  // top-level awaits, so AFTER DOMContentLoaded. A giscus iframe inserted
  // before that copy becomes a dead copy. So load giscus only when the
  // div.giscus is inside idCnrMainContentDiv.
  var bStarted = false
  function fStart() {
    if (bStarted) return true
    var oCnr = document.getElementById('idCnrMainContentDiv')
    var oDiv = document.querySelector('div.giscus')
    if (oCnr && oDiv && oCnr.contains(oDiv)) {
      bStarted = true
      fGiscusLoad()
    }
    return bStarted
  }
  if (!fStart()) {
    var oObserver = new MutationObserver(function () {
      if (fStart()) oObserver.disconnect()
    })
    oObserver.observe(document.documentElement, {childList: true, subtree: true})
    // pages without mMcsh2.js: load anyway, some time after the load event
    window.addEventListener('load', function () {
      setTimeout(function () {
        if (!bStarted) {
          oObserver.disconnect()
          bStarted = true
          fGiscusLoad()
        }
      }, 5000)
    })
  }
})()
