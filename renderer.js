clippy.BASE_PATH = 'assets/agents/'

function fmtTok (n) {
  n = n || 0
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return Math.round(n / 1e3) + 'k'
  return String(n)
}

function renderPanel (s) {
  var fill = Math.min(100, s.pct)
  var mark = s.level === 'over' ? ' &#9888;' : ' &#10003;'
  var html =
    '<div class="hd"><span>Agent SDK usage</span><span class="cyc">' + s.cycleLabel + '</span></div>' +
    '<div class="big">$' + s.total.toFixed(2) + ' <span class="muted">/ $' + s.cap + '</span> <span class="pct ' + s.level + '">' + s.pct + '%</span></div>' +
    '<div class="bar"><div class="fill ' + s.level + '" style="width:' + fill + '%"></div></div>' +
    '<div class="proj ' + s.level + '">Projected by cycle end: $' + s.projected.toFixed(2) + mark + '</div>' +
    '<div class="toks"><span class="tlab">Tokens</span><span>In<b>' + fmtTok(s.inTok) + '</b></span><span>Out<b>' + fmtTok(s.outTok) + '</b></span><span>Cache<b>' + fmtTok(s.cacheTok) + '</b></span></div>' +
    '<div class="ft">Resets ' + s.resetLabel + ' &middot; in ' + s.daysLeft + ' day' + (s.daysLeft === 1 ? '' : 's') + '</div>'
  if (s.regressed && s.regressed.length) {
    html += '<div class="warn-row">&#9888; ' + s.regressed.length + ' script(s) on a pricier model</div>'
  }
  return html
}

clippy.load('Clippy', function (agent) {
  window.agent = agent
  agent.show(true)
  agent.moveTo(12, 12, 0)
  agent.play('Greeting')
  setInterval(function () { agent.animate() }, 15000)

  $('.clippy').off('mousedown')
  var $panel = $('#panel')

  function toggleSpend () {
    if (!$panel.hasClass('hidden')) {
      $panel.addClass('hidden')
      window.clippyAPI.setWindowSize(160, 130)
      return
    }
    window.clippyAPI.getSpend().then(function (s) {
      window.clippyAPI.setWindowSize(300, 300)
      $panel.html(renderPanel(s)).removeClass('hidden')
      agent.play(s.level === 'over' ? 'GetAttention' : (s.level === 'warn' ? 'Thinking' : 'Congratulate'))
    }).catch(function (err) {
      window.clippyAPI.setWindowSize(300, 170)
      $panel.html('<div class="warn-row">Could not read spend: ' + err.message + '</div>').removeClass('hidden')
    })
  }

  var drag = null
  $(document).on('mousedown', '.clippy', function (e) {
    drag = { sx: e.screenX, sy: e.screenY, wx: null, wy: null, moved: false }
    window.clippyAPI.getWindowPos().then(function (pos) {
      if (drag) { drag.wx = pos[0]; drag.wy = pos[1] }
    })
  })
  $(document).on('mousemove', function (e) {
    if (!drag) return
    if (Math.abs(e.screenX - drag.sx) > 3 || Math.abs(e.screenY - drag.sy) > 3) drag.moved = true
    if (drag.moved && drag.wx !== null) {
      window.clippyAPI.setWindowPos(drag.wx + (e.screenX - drag.sx), drag.wy + (e.screenY - drag.sy))
    }
  })
  $(document).on('mouseup', function () {
    if (drag && !drag.moved) toggleSpend()
    drag = null
  })
})
