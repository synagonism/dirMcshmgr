/*
 * mGiscus.js - loads Giscus comments (GitHub Discussions of synagonism/comments)
 * into the <div class="giscus" data-term="..."> of a page.
 * Usage in a page:
 *   <div class="giscus" data-term="McsCorDisqus"></div>
 *   <script src="/dirMcshmgr/mGiscus.js"></script>
 * mMcsh2.js rebuilds the body before DOMContentLoaded, so giscus is attached after it.
 * The giscus theme follows the site's clsDark class on <body>.
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
      'data-loading': 'lazy',
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fGiscusLoad)
  } else {
    fGiscusLoad()
  }
})()
