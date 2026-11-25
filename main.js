/* Motus Edits — behaviour. No dependencies. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fmt(s) {
    s = Math.max(0, Math.floor(s || 0));
    function p(n) { return String(n).padStart(2, '0'); }
    return p(Math.floor(s / 3600)) + ':' + p(Math.floor(s / 60) % 60) + ':' + p(s % 60);
  }

  // Reads "m:ss" or "m:ss.ff" from a timestamp field. Returns null for placeholders.
  function parseTs(text) {
    var m = /(\d+):(\d{2})(?:\.(\d+))?/.exec(text || '');
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]) + (m[3] ? Number('0.' + m[3]) : 0);
  }

  function play(v) {
    if (!v) return;
    var r = v.play();
    if (r && r.catch) r.catch(function () {});
  }

  /* ---------- Videos: load from data-src, show placeholder until ready ---------- */
  document.querySelectorAll('video[data-src]').forEach(function (v) {
    var box = v.closest('.vbox');
    v.muted = true;
    v.addEventListener('loadeddata', function () { box.classList.add('ready'); });
    v.addEventListener('error', function () { box.classList.remove('ready'); }, true);
    v.src = v.getAttribute('data-src');
  });

  // Hover to play (muted), pause on leave only if hover started it.
  document.querySelectorAll('.hoverplay video').forEach(function (v) {
    v.addEventListener('mouseenter', function () {
      if (v.paused) { v.dataset.hov = '1'; play(v); }
    });
    v.addEventListener('mouseleave', function () {
      if (v.dataset.hov === '1') { v.pause(); delete v.dataset.hov; }
    });
    v.addEventListener('click', function () { delete v.dataset.hov; });
  });

  /* ---------- Global timeline bar ---------- */
  var gph = document.querySelector('[data-gph]');
  var gtc = document.querySelector('[data-gtc]');
  var ticks = Array.prototype.slice.call(document.querySelectorAll('.tick[data-sec]'));
  var TOTAL = 160; // seconds shown at the end of the page (00:02:40)
  var raf = null;

  function updateBar() {
    raf = null;
    var se = document.scrollingElement || document.documentElement;
    var max = Math.max(1, se.scrollHeight - window.innerHeight);
    var f = Math.min(1, Math.max(0, window.scrollY / max));
    if (gph) gph.style.left = (f * 100) + '%';
    if (gtc) gtc.textContent = fmt(f * TOTAL);
    var current = null;
    ticks.forEach(function (t) {
      var sec = document.getElementById(t.dataset.sec);
      if (!sec) return;
      var pos = Math.min(sec.offsetTop, max) / max;
      t.style.left = Math.min(98, Math.max(2, pos * 100)) + '%';
      if (window.scrollY + window.innerHeight * 0.4 >= sec.offsetTop) current = t;
    });
    ticks.forEach(function (t) { t.classList.toggle('on', t === current); });
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(updateBar); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', updateBar);
  updateBar();

  /* ---------- Tabs (hard cut, short slide) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab[data-tab]'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel[data-panel]'));

  function selectTab(id, focus) {
    tabs.forEach(function (t) {
      var on = t.dataset.tab === id;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach(function (p) {
      var on = p.dataset.panel === id;
      if (!on) p.querySelectorAll('video').forEach(function (v) { v.pause(); });
      p.hidden = !on;
      p.classList.remove('cut-in');
      if (on && !reduced) { void p.offsetWidth; p.classList.add('cut-in'); }
    });
  }
  tabs.forEach(function (t, i) {
    t.tabIndex = t.classList.contains('on') ? 0 : -1;
    t.addEventListener('click', function () { selectTab(t.dataset.tab); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      selectTab(tabs[(i + d + tabs.length) % tabs.length].dataset.tab, true);
    });
  });

  /* ---------- Breakdown panels: markers, NLE strip, compare slider ---------- */
  panels.forEach(function (panel) {
    var main = panel.querySelector('video[data-main]');
    var list = panel.querySelector('[data-list]');
    var tcEl = panel.querySelector('[data-tc]');
    var durEl = panel.querySelector('[data-dur]');
    var phEl = panel.querySelector('[data-ph]');
    var scrub = panel.querySelector('[data-scrub]');
    var active = null;

    function markers() {
      return Array.prototype.slice.call(panel.querySelectorAll('[data-ts]')).map(function (b) {
        return { n: b.dataset.ts, s: parseTs(b.textContent), btn: b };
      });
    }

    function sync() {
      if (!main) return;
      var dur = main.duration || 0;
      var t = main.currentTime || 0;
      if (tcEl) tcEl.textContent = fmt(t);
      if (durEl && dur) durEl.textContent = fmt(dur);
      if (phEl && dur) phEl.style.left = (t / dur * 100) + '%';

      var best = null;
      markers().forEach(function (m) {
        if (m.s === null) return;
        var pin = panel.querySelector('[data-pin="' + m.n + '"]');
        if (pin && dur) { pin.style.left = Math.min(100, m.s / dur * 100) + '%'; pin.classList.add('set'); }
        if (m.s <= t && (!best || m.s >= best.s)) best = m;
      });

      var n = best ? best.n : null;
      if (n === active) return;
      active = n;
      panel.querySelectorAll('[data-mk]').forEach(function (li) {
        li.classList.toggle('on', li.dataset.mk === n);
      });
      panel.querySelectorAll('[data-pin]').forEach(function (p) {
        p.classList.toggle('on', p.dataset.pin === n);
      });
      var li = n && panel.querySelector('[data-mk="' + n + '"]');
      if (list && li && list.scrollHeight > list.clientHeight + 4) {
        list.scrollTo({ top: li.offsetTop - 10, behavior: reduced ? 'auto' : 'smooth' });
      }
    }

    if (main) {
      main.addEventListener('timeupdate', sync);
      main.addEventListener('loadedmetadata', sync);
      main.addEventListener('seeked', sync);
    }

    panel.querySelectorAll('[data-ts]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = parseTs(b.textContent);
        if (!main || s === null) return;
        delete main.dataset.hov;
        main.currentTime = s;
        play(main);
      });
    });

    if (scrub) {
      scrub.addEventListener('click', function (e) {
        if (!main || !main.duration) return;
        var r = scrub.getBoundingClientRect();
        var x = (e.clientX - r.left - 30) / (r.width - 30);
        main.currentTime = Math.max(0, Math.min(1, x)) * main.duration;
      });
    }

    var cmp = panel.querySelector('[data-cmp]');
    if (cmp) {
      var range = cmp.querySelector('.cmp-range');
      range.addEventListener('input', function () { cmp.style.setProperty('--split', range.value + '%'); });
      var btn = panel.querySelector('[data-playboth]');
      if (btn) btn.addEventListener('click', function () {
        var vs = cmp.querySelectorAll('video[data-cmpv]');
        if (!vs.length) return;
        var go = vs[0].paused;
        vs.forEach(function (v) {
          v.muted = true;
          if (go) { v.currentTime = 0; play(v); } else { v.pause(); }
        });
      });
    }
  });

  /* ---------- Form ---------- */
  var form = document.querySelector('[data-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      // Until an endpoint is set in index.html, stay on the page.
      if (!form.getAttribute('action') || form.getAttribute('action') === '#') e.preventDefault();
    });
  }
})();
