(function () {
  'use strict';
  var box = document.getElementById('anBox');
  if (!box) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  // условные данные, сходятся с заявками из demo.js: 5 заявок, 67 т, 3 назначены
  var KPI = [
    { label: 'Заявок за неделю', val: 5, suffix: '', dec: 0 },
    { label: 'Тонн к перевозке', val: 67, suffix: ' т', dec: 0 },
    { label: 'Назначено', val: 60, suffix: '%', dec: 0 },
    { label: 'Средний вес рейса', val: 13.4, suffix: ' т', dec: 1 }
  ];
  var DAYS = [['Пн', 12], ['Вт', 0], ['Ср', 5], ['Чт', 22], ['Пт', 28]];
  var CARGO = [['Металлопрокат', 22], ['Арматура', 20], ['Цемент', 12], ['Паллеты', 8], ['Песок', 5]];
  var BARGES = [['Береговая-3', 22], ['Заря-14', 20], ['Лазурная', 12], ['Каскад', 8], ['Север-7', 5]];
  var CAP = 25; // условная грузоподъёмность баржи, т
  var TOTAL = 67;

  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function sv(tag, attrs) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }
  function fmt(v, dec) { return v.toFixed(dec).replace('.', ','); }
  function pct(a, b) { return Math.round(a / b * 100); }

  var tip, counters = [], animEls = [];

  function figure(title, sub, label) {
    var f = el('figure', 'an-card'); f.setAttribute('aria-label', label);
    var hd = el('figcaption', 'an-ch'); hd.appendChild(el('b', null, title)); hd.appendChild(el('span', null, sub));
    f.appendChild(hd); return f;
  }
  function srText(f, text) { f.appendChild(el('p', 'an-sr', text)); }

  // тултип: один на весь блок, двигается за наведением/фокусом
  function bindTip(node, html) {
    function show() {
      tip.textContent = ''; tip.appendChild(el('b', null, html[0])); tip.appendChild(el('span', null, html[1]));
      var b = box.getBoundingClientRect(), r = node.getBoundingClientRect();
      tip.classList.add('on');
      var x = r.left - b.left + r.width / 2, y = r.top - b.top;
      var w = tip.offsetWidth;
      x = Math.max(w / 2 + 4, Math.min(b.width - w / 2 - 4, x));
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
    }
    function hide() { tip.classList.remove('on'); }
    node.addEventListener('mouseenter', show); node.addEventListener('mouseleave', hide);
    node.addEventListener('focus', show); node.addEventListener('blur', hide);
    node.addEventListener('touchstart', show, { passive: true });
  }

  function buildKpi(root) {
    var row = el('div', 'an-kpi');
    KPI.forEach(function (k) {
      var t = el('div', 'an-k'); var v = el('div', 'an-kv', fmt(k.val, k.dec) + k.suffix);
      t.appendChild(v); t.appendChild(el('div', 'an-kl', k.label)); row.appendChild(t);
      counters.push({ node: v, k: k });
    });
    root.appendChild(row);
  }

  // тоннаж по дням: колонки в SVG
  function buildDays(root) {
    var f = figure('Тоннаж по дням', 'тонн в сутки', 'Столбчатый график: тоннаж по дням недели');
    srText(f, DAYS.map(function (d) { return d[0] + ': ' + d[1] + ' т'; }).join('; ') + '. Всего ' + TOTAL + ' т.');
    var W = 360, H = 210, L = 30, B = 28, T = 20, ph = H - B - T, max = 30;
    var s = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'an-svg', role: 'img', 'aria-hidden': 'true', preserveAspectRatio: 'xMidYMid meet' });
    [0, 10, 20, 30].forEach(function (g) {
      var y = T + ph - g / max * ph;
      s.appendChild(sv('line', { x1: L, x2: W, y1: y, y2: y, 'class': 'an-grid' }));
      var t = sv('text', { x: L - 8, y: y + 4, 'class': 'an-ax', 'text-anchor': 'end' }); t.textContent = g; s.appendChild(t);
    });
    var slot = (W - L) / DAYS.length, bw = 34;
    DAYS.forEach(function (d, i) {
      var cx = L + slot * i + slot / 2, h = Math.max(d[1] / max * ph, 0), x = cx - bw / 2, y = T + ph - h;
      var g = sv('g', { 'class': 'an-col', tabindex: '0', 'aria-label': d[0] + ': ' + d[1] + ' т' });
      g.appendChild(sv('rect', { x: cx - slot / 2 + 4, y: T, width: slot - 8, height: ph, 'class': 'an-hit' }));
      if (h > 0) {
        var r = sv('path', { d: 'M' + x + ',' + (T + ph) + 'V' + (y + 4) + 'Q' + x + ',' + y + ' ' + (x + 4) + ',' + y + 'H' + (x + bw - 4) + 'Q' + (x + bw) + ',' + y + ' ' + (x + bw) + ',' + (y + 4) + 'V' + (T + ph) + 'Z', 'class': 'an-bar' });
        g.appendChild(r); animEls.push({ node: r, delay: i * 80 });
        var v = sv('text', { x: cx, y: y - 7, 'class': 'an-val', 'text-anchor': 'middle' }); v.textContent = d[1]; g.appendChild(v); animEls.push({ node: v, delay: 500 + i * 80 });
      } else {
        g.appendChild(sv('line', { x1: x + 6, x2: x + bw - 6, y1: T + ph - 1, y2: T + ph - 1, 'class': 'an-zero' }));
      }
      var lb = sv('text', { x: cx, y: H - 8, 'class': 'an-ax', 'text-anchor': 'middle' }); lb.textContent = d[0]; g.appendChild(lb);
      bindTip(g, [d[0], d[1] + ' т · ' + pct(d[1], TOTAL) + '% недели']);
      s.appendChild(g);
    });
    s.appendChild(sv('line', { x1: L, x2: W, y1: T + ph, y2: T + ph, 'class': 'an-base' }));
    f.appendChild(s); root.appendChild(f);
  }

  // горизонтальные бары в HTML: текст остаётся читаемым на любой ширине
  function buildBars(root, o) {
    var f = figure(o.title, o.sub, o.label);
    srText(f, o.sr);
    var list = el('div', 'an-bars');
    o.rows.forEach(function (r, i) {
      var row = el('div', 'an-row'); row.tabIndex = 0; row.setAttribute('aria-label', r.aria);
      row.appendChild(el('span', 'an-rn', r.name));
      var tr = el('span', 'an-tr'); var fill = el('i', 'an-fill' + (r.hot ? ' hot' : '')); fill.style.width = r.w + '%'; tr.appendChild(fill);
      row.appendChild(tr); row.appendChild(el('span', 'an-rv', r.text));
      bindTip(row, r.tip); list.appendChild(row);
      animEls.push({ node: fill, delay: i * 80 });
    });
    f.appendChild(list); root.appendChild(f);
  }

  function build() {
    box.textContent = '';
    var hd = el('div', 'an-hd'); hd.appendChild(el('i')); hd.appendChild(el('span', null, 'Аналитика по заявкам'));
    box.appendChild(hd);
    buildKpi(box);
    var grid = el('div', 'an-grid-c'); box.appendChild(grid);
    buildDays(grid);
    buildBars(grid, {
      title: 'Доли по грузам', sub: '% от общего тоннажа', label: 'Горизонтальные столбцы: доли грузов в общем тоннаже',
      sr: CARGO.map(function (c) { return c[0] + ': ' + c[1] + ' т, ' + pct(c[1], TOTAL) + '%'; }).join('; ') + '.',
      rows: CARGO.map(function (c) { var p = pct(c[1], TOTAL); return { name: c[0], w: Math.min(p / 33 * 100, 100), text: p + '%', aria: c[0] + ': ' + p + '%', tip: [c[0], c[1] + ' т · ' + p + '% тоннажа'], hot: false }; })
    });
    buildBars(grid, {
      title: 'Загрузка барж', sub: '% от грузоподъёмности ' + CAP + ' т', label: 'Горизонтальные столбцы: загрузка барж',
      sr: BARGES.map(function (b) { return b[0] + ': ' + b[1] + ' т из ' + CAP + ', ' + pct(b[1], CAP) + '%'; }).join('; ') + '.',
      rows: BARGES.map(function (b) { var p = pct(b[1], CAP); return { name: b[0], w: p, text: p + '%', aria: b[0] + ': ' + p + '%', tip: [b[0], b[1] + ' т из ' + CAP + ' т'], hot: p >= 80 }; })
    });
    tip = el('div', 'an-tip'); tip.setAttribute('role', 'tooltip'); box.appendChild(tip);
  }

  function finalState() {
    box.classList.add('is-in');
    animEls.forEach(function (a) { a.node.classList.add('done'); });
  }

  function countUp() {
    var t0 = performance.now(), D = 1100;
    (function step(now) {
      var p = Math.min((now - t0) / D, 1), e = 1 - Math.pow(1 - p, 3);
      counters.forEach(function (c) { c.node.textContent = fmt(c.k.val * e, c.k.dec) + c.k.suffix; });
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  function play() {
    box.classList.add('is-in');
    countUp();
    animEls.forEach(function (a) { setTimeout(function () { a.node.classList.add('done'); }, a.delay); });
  }

  build();
  if (reduce || !('IntersectionObserver' in window)) { finalState(); return; }
  counters.forEach(function (c) { c.node.textContent = fmt(0, c.k.dec) + c.k.suffix; });
  var io = new IntersectionObserver(function (es) {
    if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); play(); }
  }, { threshold: 0.25 });
  io.observe(box);
})();
