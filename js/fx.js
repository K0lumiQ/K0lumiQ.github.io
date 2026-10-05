// Движение сайта: плавный скролл (Lenis), загрузка, появление, магниты, курсор, наклон карточек, параллакс,
// бегущая строка, FLIP-переход карточки проекта в окно. Только transform/opacity.
// Публичный API: window.FX = { refresh(), lock(bool), scrollTo(el) }.
(function () {
  var html = document.documentElement, body = document.body;
  html.classList.add('fx'); // без этого класса стартовые «скрытые» состояния в motion.css не включаются
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var EASE = 'cubic-bezier(.22,.8,.24,1)';

  /* ---------- плавный скролл ---------- */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.25, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true, wheelMultiplier: .95, touchMultiplier: 1.4 });
    html.classList.add('lenis', 'lenis-smooth'); window.lenis = lenis;
    ['#mBox', '.case-tx'].forEach(function (s) { $$(s).forEach(function (e) { e.setAttribute('data-lenis-prevent', ''); }); });
  }
  var tick = [];
  var lastT = performance.now();
  function raf(t) { var dt = Math.min(64, t - lastT) / 16.67; lastT = t; if (lenis) lenis.raf(t); for (var i = 0; i < tick.length; i++) tick[i](dt, t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  var scrollY = function () { return lenis ? lenis.scroll : window.scrollY; };
  var velocity = function () { return lenis ? lenis.velocity : 0; };

  /* ---------- загрузка: занавес поднимается, герой въезжает следом ---------- */
  var loader = $('#loader'), T0 = Date.now(), ready = false;
  function startSite() { if (ready) return; ready = true; body.classList.remove('is-loading'); body.classList.add('is-ready'); }
  function boot() {
    var go = function () { if (loader) loader.classList.add('out'); setTimeout(startSite, 380); setTimeout(function () { loader && loader.remove(); }, 1500); };
    var done = function () { setTimeout(go, Math.max(0, 1000 - (Date.now() - T0))); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(done); else done();
  }
  if (reduce) { body.classList.remove('is-loading'); body.classList.add('is-ready'); ready = true; if (loader) loader.remove(); }
  else { if (loader) loader.classList.add('run'); if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot); setTimeout(function () { if (!ready) { startSite(); loader && loader.remove(); } }, 5000); }

  /* ---------- разбивка текста на слова ---------- */
  function split(el) {
    if (el.dataset.splitDone) return; el.dataset.splitDone = '1';
    var txt = el.textContent.trim(), words = txt.split(/\s+/); el.setAttribute('aria-label', txt);
    el.innerHTML = words.map(function (w, i) { return '<span class="sw" aria-hidden="true"><span class="sw-i" style="--w:' + i + '">' + w + '</span></span>'; }).join(' ');
  }

  /* ---------- появление при прокрутке ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); e.target.classList.add('in'); $$('.num', e.target).forEach(count); if (e.target.classList.contains('num')) count(e.target); });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  function count(el) { if (el.dataset.done) return; el.dataset.done = '1'; var to = Number(el.dataset.count), t0 = performance.now(); (function s(t) { var k = clamp((t - t0) / 1400, 0, 1), e = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(s); })(t0); }
  function observeAll() {
    $$('[data-split]').forEach(split);
    $$('[data-split], [data-fade], [data-card], [data-reveal-r], .quote, .f-line, .mail, .stat').forEach(function (el) { if (!el.dataset.obs) { el.dataset.obs = '1'; io.observe(el); } });
  }
  // секции помечаются seen: мягко проявляется их фоновое свечение
  var seenIo = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('seen'); seenIo.unobserve(e.target); } }); }, { threshold: .08 });
  $$('.sec').forEach(function (s) { seenIo.observe(s); });

  /* ---------- шапка, прогресс, индикатор меню ---------- */
  var hdr = $('#hdr'), prog = $('#progress i'), links = $$('#nav a[data-nav]'), ind = $('#navInd'), lastY = 0, activeId = 'top', nav = $('#nav');
  function moveInd(a) { if (!ind) return; if (!a || a.classList.contains('pill')) { ind.style.width = '0px'; return; } ind.style.width = (a.offsetWidth - 44) + 'px'; ind.style.transform = 'translateX(' + (a.offsetLeft + 22) + 'px)'; }
  var secs = ['top', 'about', 'services', 'works', 'process', 'contact'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
  function setActive(id) { if (id === 'process') id = 'works'; if (id === activeId) return; activeId = id; var a = null; links.forEach(function (l) { var on = l.dataset.nav === id; l.classList.toggle('on', on); if (on) a = l; }); moveInd(a); }
  var sio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); }); }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(function (s) { sio.observe(s); }); setTimeout(function () { moveInd($('#nav a.on')); }, 250);
  window.addEventListener('resize', function () { moveInd($('#nav a.on')); });
  function onScroll() {
    var y = scrollY(), max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (prog) prog.style.transform = 'scaleX(' + clamp(y / max, 0, 1).toFixed(4) + ')';
    hdr.classList.toggle('solid', y > 60);
    hdr.classList.toggle('hide', y > 500 && y > lastY + 2 && !nav.classList.contains('open'));
    if (y < lastY - 2 || y < 500) hdr.classList.remove('hide'); lastY = y;
  }
  if (lenis) lenis.on('scroll', onScroll); else window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- параллакс (считаем только видимые картинки) и свечение героя ---------- */
  var para = [], paraVis = new Set(), pio = new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? paraVis.add(e.target) : paraVis.delete(e.target); }); }, { rootMargin: '10% 0px 10% 0px' });
  var gx = 0, gy = 0, tx = 0, ty = 0, glowEl = $('#glow');
  window.addEventListener('pointermove', function (e) { tx = (e.clientX / innerWidth - .5) * 160; ty = (e.clientY / innerHeight - .5) * 120; }, { passive: true });
  tick.push(function (dt) {
    var k = 1 - Math.pow(1 - .06, dt); gx = lerp(gx, tx, k); gy = lerp(gy, ty, k); var y = scrollY();
    if (glowEl && y < innerHeight * 1.5) glowEl.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + (gy + y * .25).toFixed(1) + 'px,0)';
    if (!reduce) { var h = innerHeight; paraVis.forEach(function (img) { var r = img.parentNode.getBoundingClientRect(); var p = (r.top + r.height / 2 - h / 2) / h; img.style.transform = 'translate3d(0,' + (p * -34).toFixed(1) + 'px,0)'; }); }
  });

  /* ---------- бегущая строка: скорость и направление следуют за скроллом ---------- */
  var mq = $('#mqTrack');
  if (mq && !reduce) {
    var mqX = 0, mqSet = 0, mqDir = 1, mqBoost = 0, measure = function () { var s = $('.mq-set', mq); mqSet = s ? s.getBoundingClientRect().width : 0; };
    measure(); window.addEventListener('resize', measure); if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    tick.push(function (dt) {
      var v = velocity(); if (Math.abs(v) > .15) mqDir = v > 0 ? 1 : -1; mqBoost = lerp(mqBoost, Math.min(Math.abs(v), 40), .08);
      mqX -= (.7 + mqBoost * .55) * mqDir * dt;
      if (mqSet) { if (mqX <= -mqSet) mqX += mqSet; if (mqX > 0) mqX -= mqSet; mq.style.transform = 'translate3d(' + mqX.toFixed(2) + 'px,0,0)'; }
    });
  }

  /* ---------- магнитные кнопки и наклон карточек: цель + сглаживание в общем кадре ---------- */
  var fxItems = new Map(); // el → { kind, tx, ty, cx, cy, px, py, hover }
  function item(el, kind) { var it = fxItems.get(el); if (!it) { it = { kind: kind, tx: 0, ty: 0, cx: 0, cy: 0, px: .5, py: .5, hover: false }; fxItems.set(el, it); el.classList.add(kind === 'tilt' ? 'tilting' : 'mag'); } return it; }
  var lastPE = null, peQueued = false;
  function processPointer() {
    peQueued = false; var e = lastPE; if (!e) return;
    var tgt = e.target && e.target.closest ? e.target : null;
    var m = tgt && tgt.closest('[data-magnet]'), t = tgt && tgt.closest('[data-tilt]');
    fxItems.forEach(function (it) { it.hover = false; });
    if (m) { var r = m.getBoundingClientRect(), it = item(m, 'mag'); it.hover = true; it.tx = (e.clientX - (r.left + r.width / 2)) * .22; it.ty = (e.clientY - (r.top + r.height / 2)) * .3; }
    if (t) { var b = t.getBoundingClientRect(), it2 = item(t, 'tilt'); it2.hover = true; it2.px = (e.clientX - b.left) / b.width; it2.py = (e.clientY - b.top) / b.height; it2.tx = (it2.px - .5) * 6; it2.ty = (.5 - it2.py) * 5; t.style.setProperty('--mx', (it2.px * 100).toFixed(1) + '%'); t.style.setProperty('--my', (it2.py * 100).toFixed(1) + '%'); }
  }
  if (fine && !reduce) {
    document.addEventListener('pointermove', function (e) { lastPE = e; if (!peQueued) { peQueued = true; requestAnimationFrame(processPointer); } }, { passive: true });
    document.addEventListener('pointerleave', function () { fxItems.forEach(function (it) { it.hover = false; }); });
    tick.push(function (dt) {
      var k = 1 - Math.pow(1 - .16, dt);
      fxItems.forEach(function (it, el) {
        var gtx = it.hover ? it.tx : 0, gty = it.hover ? it.ty : 0; it.cx = lerp(it.cx, gtx, k); it.cy = lerp(it.cy, gty, k);
        if (!it.hover && Math.abs(it.cx) < .02 && Math.abs(it.cy) < .02) { el.style.transform = ''; el.classList.remove('tilting', 'mag'); fxItems.delete(el); return; }
        el.style.transform = it.kind === 'tilt' ? 'perspective(900px) rotateX(' + it.cy.toFixed(2) + 'deg) rotateY(' + it.cx.toFixed(2) + 'deg) translateZ(0)' : 'translate3d(' + it.cx.toFixed(1) + 'px,' + it.cy.toFixed(1) + 'px,0)';
      });
    });
  }

  /* ---------- курсор ---------- */
  if (fine && !reduce) {
    var cur = $('#cursor'), dot = $('.c-dot', cur), ring = $('.c-ring', cur), txt = $('.c-txt', cur), cx = innerWidth / 2, cy = innerHeight / 2, rx = cx, ry = cy;
    html.classList.add('has-cursor');
    window.addEventListener('pointermove', function (e) { cx = e.clientX; cy = e.clientY; cur.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest && e.target.closest('[data-cursor], a, button, .proj, input, textarea');
      var label = t && t.dataset ? t.dataset.cursor : '';
      cur.classList.toggle('hover', !!t); cur.classList.toggle('label', !!label); txt.textContent = label || '';
    });
    document.addEventListener('pointerleave', function () { cur.classList.remove('on'); });
    document.addEventListener('pointerdown', function () { cur.classList.add('down'); }); document.addEventListener('pointerup', function () { cur.classList.remove('down'); });
    tick.push(function (dt) { var k = 1 - Math.pow(1 - .2, dt); rx = lerp(rx, cx, k); ry = lerp(ry, cy, k); dot.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)'; ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)'; });
  }

  /* ---------- FLIP: картинка проекта летит из карточки в окно и обратно ---------- */
  var modal = $('#modal'), lastCard = null, flying = null;
  document.addEventListener('click', function (e) { var c = e.target.closest && e.target.closest('.proj[data-id]'); if (c) lastCard = c; }, true);
  document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.proj[data-id]')) lastCard = e.target; }, true);
  function fly(src, from, to, radius, done) {
    var el = document.createElement('div'); el.className = 'flyer'; el.style.backgroundImage = 'url("' + src + '")';
    el.style.cssText += ';left:' + from.left + 'px;top:' + from.top + 'px;width:' + from.width + 'px;height:' + from.height + 'px;border-radius:' + radius[0] + 'px';
    document.body.appendChild(el);
    var a = el.animate([{ left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px', borderRadius: radius[0] + 'px' }, { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px', borderRadius: radius[1] + 'px' }], { duration: 850, easing: EASE, fill: 'forwards' });
    a.onfinish = function () { el.remove(); done && done(); }; a.oncancel = function () { el.remove(); done && done(); };
    return a;
  }
  var wasOpen = false;
  function onModal() {
    var open = modal.classList.contains('open');
    if (open === wasOpen) return; wasOpen = open;
    var wide = modal.classList.contains('wide'), caseImg = $('.case-img', modal), card = lastCard && document.body.contains(lastCard) ? lastCard : null;
    if (reduce || !card) return;
    var cardImg = $('.proj-img', card);
    if (open && wide && caseImg && cardImg) {
      modal.classList.add('flip'); // убирает «всплытие» окна, чтобы целевой прямоугольник был точным
      var from = cardImg.getBoundingClientRect(), to = caseImg.getBoundingClientRect(), src = $('img', caseImg).getAttribute('src');
      caseImg.style.opacity = '0'; cardImg.style.visibility = 'hidden'; if (flying) flying.cancel();
      flying = fly(src, from, to, [18, 0], function () { caseImg.style.opacity = ''; flying = null; });
    } else if (!open && modal.classList.contains('flip') && caseImg && cardImg) {
      var from2 = caseImg.getBoundingClientRect(), to2 = cardImg.getBoundingClientRect(), src2 = $('img', caseImg).getAttribute('src'), inView = to2.bottom > 0 && to2.top < innerHeight;
      if (flying) flying.cancel();
      if (inView) { caseImg.style.opacity = '0'; flying = fly(src2, from2, to2, [0, 18], function () { cardImg.style.visibility = ''; flying = null; }); }
      else cardImg.style.visibility = '';
      setTimeout(function () { modal.classList.remove('flip'); $$('.proj-img').forEach(function (x) { x.style.visibility = ''; }); }, 900);
    }
  }
  // FLIP-переход отключён: картинка искажалась при смене пропорций; окно растёт из карточки через --ox/--oy (app.js)

  /* ---------- API ---------- */
  function refresh() { observeAll(); para = $$('[data-par]'); para.forEach(function (p) { if (!p.dataset.pobs) { p.dataset.pobs = '1'; pio.observe(p); } }); }
  window.FX = {
    refresh: refresh,
    lock: function (on) { if (lenis) { on ? lenis.stop() : lenis.start(); } else { document.body.style.overflow = on ? 'hidden' : ''; } },
    scrollTo: function (el) { if (lenis) lenis.scrollTo(el, { offset: el.id === 'top' ? 0 : -70, duration: 1.7, easing: function (t) { return 1 - Math.pow(1 - t, 4); } }); else el.scrollIntoView({ behavior: 'smooth' }); }
  };
  refresh();
})();
