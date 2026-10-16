/* ===========================================================================
   SCOTLING V2 — ART-DIRECTION SPIKE A
   No dependencies, no network calls, no storage, no tracking of any kind.
   Everything below is transform/opacity work plus an fps instrument.
   Target: 60fps on a 2018 iPad in Safari with no WebGL.
   =========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;

  function $(id) { return doc.getElementById(id); }
  function on(el, ev, fn, opts) { if (el && el.addEventListener) el.addEventListener(ev, fn, opts || false); }

  var reduceMotion = false;
  try {
    reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { /* older engines: just animate */ }

  /* ---------------------------------------------------------------------
     1. Keep the composition framed at any aspect ratio.
        The artwork bleeds well past the safe rect, so we simply widen or
        heighten the viewBox around the safe rect's centre.
     --------------------------------------------------------------------- */
  var svg = $('sceneSvg');
  var SAFE = { x: 260, y: 120, w: 1080, h: 520 };
  var SAFE_A = SAFE.w / SAFE.h;
  var cx = SAFE.x + SAFE.w / 2;
  var cy = SAFE.y + SAFE.h / 2;

  function fitViewBox() {
    if (!svg) return;
    var vw = window.innerWidth || 1;
    var vh = window.innerHeight || 1;
    var a = vw / vh;
    var w, h;
    if (a >= SAFE_A) { h = SAFE.h; w = SAFE.h * a; }
    else { w = SAFE.w; h = SAFE.w / a; }
    // Bias the frame upward a little so the game rail sits over empty machair,
    // not over Ruairidh.
    var oy = Math.min(h * 0.12, 90);
    svg.setAttribute('viewBox',
      (cx - w / 2).toFixed(1) + ' ' + (cy - h / 2 + oy).toFixed(1) + ' ' +
      w.toFixed(1) + ' ' + h.toFixed(1));
  }
  fitViewBox();

  var resizeTimer = null;
  on(window, 'resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitViewBox, 120);
  });
  on(window, 'orientationchange', function () { setTimeout(fitViewBox, 180); });

  /* ---------------------------------------------------------------------
     2. Parallax. Two custom properties written at most once per frame;
        every layer resolves them in a GPU-only translate3d.
     --------------------------------------------------------------------- */
  var tx = 0, ty = 0;      // target  -1..1
  var ax = 0, ay = 0;      // actual (eased)
  var lastWritten = '';
  var pointerSeen = 0;

  if (!reduceMotion) {
    on(window, 'pointermove', function (e) {
      var vw = window.innerWidth || 1, vh = window.innerHeight || 1;
      tx = ((e.clientX / vw) - 0.5) * 2;
      ty = ((e.clientY / vh) - 0.5) * 2;
      pointerSeen = performance.now();
    }, { passive: true });

    on(window, 'pointerleave', function () { tx = 0; ty = 0; }, { passive: true });
  }

  /* ---------------------------------------------------------------------
     3. fps instrument (exposed as window.__hubFPS for the measurement run)
     --------------------------------------------------------------------- */
  var fps = { current: 0, min: Infinity, max: 0, mean: 0, windows: 0, startedAt: 0 };
  window.__hubFPS = fps;

  var frames = 0;
  var windowStart = 0;
  var devOpen = false;
  var fpsNow = $('fpsNow'), fpsMin = $('fpsMin'), fpsAvg = $('fpsAvg');

  function loop(t) {
    /* --- parallax easing + idle drift --- */
    if (!reduceMotion) {
      var idle = (t - pointerSeen) > 2500;
      var dx = tx, dy = ty;
      if (idle) {                       // slow breathing drift for touch devices
        dx = Math.sin(t / 9000) * 0.3;
        dy = Math.cos(t / 13000) * 0.18;
      }
      ax += (dx - ax) * 0.065;
      ay += (dy - ay) * 0.065;
      var s = ax.toFixed(3) + '|' + ay.toFixed(3);
      if (s !== lastWritten) {
        lastWritten = s;
        root.style.setProperty('--px', ax.toFixed(3));
        root.style.setProperty('--py', ay.toFixed(3));
      }
    }

    /* --- fps --- */
    if (!windowStart) { windowStart = t; fps.startedAt = t; }
    frames++;
    if (t - windowStart >= 500) {
      var v = Math.round((frames * 1000) / (t - windowStart));
      fps.current = v;
      fps.windows++;
      if (fps.windows > 2) {            // skip warm-up windows
        if (v < fps.min) fps.min = v;
        if (v > fps.max) fps.max = v;
        fps.mean = fps.mean + (v - fps.mean) / (fps.windows - 2);
      }
      frames = 0; windowStart = t;
      if (devOpen) {
        if (fpsNow) fpsNow.textContent = String(v);
        if (fpsMin) fpsMin.textContent = (fps.min === Infinity ? '—' : String(fps.min));
        if (fpsAvg) fpsAvg.textContent = fps.mean ? fps.mean.toFixed(1) : '—';
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ---------------------------------------------------------------------
     4. Weather
     --------------------------------------------------------------------- */
  var wxBtns = doc.querySelectorAll('.wx__btn');
  function setWeather(name) {
    body.className = body.className.replace(/\bwx-\S+/g, '').trim() + ' wx-' + name;
    for (var i = 0; i < wxBtns.length; i++) {
      var isOn = wxBtns[i].getAttribute('data-wx') === name;
      wxBtns[i].classList.toggle('is-on', isOn);
      wxBtns[i].setAttribute('aria-pressed', isOn ? 'true' : 'false');
    }
  }
  for (var i = 0; i < wxBtns.length; i++) {
    (function (btn) {
      on(btn, 'click', function () { setWeather(btn.getAttribute('data-wx') || 'fair'); });
    })(wxBtns[i]);
  }

  /* ---------------------------------------------------------------------
     5. Gaelic label toggle
     --------------------------------------------------------------------- */
  var tagsBtn = $('tagsBtn');
  on(tagsBtn, 'click', function () {
    var off = body.classList.toggle('no-tags');
    tagsBtn.setAttribute('aria-pressed', off ? 'false' : 'true');
  });

  /* ---------------------------------------------------------------------
     6. Card rail
     --------------------------------------------------------------------- */
  var track = $('track');
  var status = $('status');

  function step(dir) {
    if (!track) return;
    var card = track.querySelector('.crd');
    var amount = card ? (card.getBoundingClientRect().width + 16) * 2 : 320;
    if (typeof track.scrollBy === 'function') {
      try { track.scrollBy({ left: dir * amount, behavior: reduceMotion ? 'auto' : 'smooth' }); return; }
      catch (e) { /* fall through */ }
    }
    track.scrollLeft += dir * amount;
  }
  on($('prevBtn'), 'click', function () { step(-1); });
  on($('nextBtn'), 'click', function () { step(1); });
  on(track, 'keydown', function (e) {
    if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
  });

  var titles = {
    giomach: 'Glac an Giomach',
    sgadan: 'Cho coltach ris an dà sgadan',
    bradan: "Cho luath ris a' bhradan",
    carn: 'Càrn',
    clo: 'Clò na Hearadh',
    ferry: 'Ferry Run',
    blackening: 'The Blackening',
    pipes: 'Pipe Hero'
  };
  var cards = doc.querySelectorAll('.crd__btn');
  for (var c = 0; c < cards.length; c++) {
    (function (btn) {
      on(btn, 'click', function () {
        var key = btn.getAttribute('data-game') || '';
        if (status) {
          status.textContent = titles[key]
            ? titles[key] + ' — art-direction spike only. No game is wired up behind this card yet.'
            : 'Art-direction spike only. No game is wired up behind this card yet.';
        }
      });
    })(cards[c]);
  }

  /* ---------------------------------------------------------------------
     7. Dev panel (instruments + grave-accent proof). Never ships to a child.
     --------------------------------------------------------------------- */
  var dev = $('dev');
  function countAnimated() {
    var all = doc.querySelectorAll('.scene *');
    var n = 0;
    for (var k = 0; k < all.length; k++) {
      var cs = window.getComputedStyle(all[k]);
      if (cs && cs.animationName && cs.animationName !== 'none') n++;
    }
    return n;
  }
  function toggleDev(force) {
    if (!dev) return;
    devOpen = (typeof force === 'boolean') ? force : dev.hasAttribute('hidden');
    if (devOpen) {
      dev.removeAttribute('hidden');
      var ac = $('animCount'), sc = $('svgCount'), rm = $('rmState');
      try { if (ac) ac.textContent = String(countAnimated()); } catch (e) { if (ac) ac.textContent = 'n/a'; }
      if (sc) sc.textContent = String(doc.querySelectorAll('#sceneSvg *').length);
      if (rm) rm.textContent = reduceMotion ? 'on (animation disabled)' : 'off';
    } else {
      dev.setAttribute('hidden', '');
    }
  }
  on($('devBtn'), 'click', function () { toggleDev(); });
  on(doc, 'keydown', function (e) {
    if ((e.key === 'd' || e.key === 'D') && !e.metaKey && !e.ctrlKey && !e.altKey) {
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      toggleDev();
    }
  });
})();
