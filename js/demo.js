(function () {
  'use strict';
  var chat = document.getElementById('dmChat'), table = document.getElementById('dmTable'), stage = document.getElementById('demoStage');
  if (!chat || !table || !stage) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SENDERS = [
    { n: 'Анна · диспетчер', i: 'А', k: 's1' },
    { n: 'Капитан Сергеев', i: 'С', k: 's2' },
    { n: 'Игорь · менеджер', i: 'И', k: 's3' }
  ];
  // parts: строка или [текст, вид]; вид: b баржа, c груз, w вес, d дата
  var ORDERS = [
    { who: 0, time: '09:12', date: '16 окт', route: 'Заря-14', cargo: 'Арматура', w: '20 т', ok: true,
      parts: ['Баржа «', ['Заря-14', 'b'], '» под погрузку, ', ['арматура', 'c'], ' ', ['20 т', 'w'], ', ', ['завтра к 9', 'd']] },
    { who: 1, time: '09:40', date: '18 окт', route: 'Каскад', cargo: 'Паллеты', w: '8 т', ok: true,
      parts: ['Добрый день, «', ['Каскад', 'b'], '» свободна, ', ['паллеты', 'c'], ' ', ['8 тонн', 'w'], ', ', ['в пятницу', 'd']] },
    { who: 2, time: '10:05', date: '21 окт', route: 'Лазурная', cargo: 'Цемент', w: '12 т', ok: false,
      reply: { n: 'Капитан Сергеев', k: 's2', t: '«Каскад» свободна, паллеты 8 тонн' },
      parts: ['Эту не трогаем. Нужна «', ['Лазурная', 'b'], '» ', ['на понедельник', 'd'], ', ', ['цемент', 'c'], ' ', ['12 т', 'w']] },
    { who: 1, time: '10:31', date: '23 окт', route: 'Север-7', cargo: 'Песок', w: '5 т', ok: true,
      parts: ['Бигбэги с ', ['песком', 'c'], ', ', ['5 т', 'w'], ', баржа «', ['Север-7', 'b'], '», ', ['в среду', 'd']] },
    { who: 0, time: '11:02', date: '24 окт', route: 'Береговая-3', cargo: 'Металлопрокат', w: '22 т', ok: false,
      parts: ['Заявка: ', ['металлопрокат', 'c'], ' ', ['22 т', 'w'], ', «', ['Береговая-3', 'b'], '», ', ['на четверг', 'd']] }
  ];
  var HL_ORDER = ['b', 'c', 'w', 'd'];
  var COLS = [['c-date', 'Дата'], ['c-route', 'Баржа'], ['c-cargo', 'Груз'], ['c-w', 'Вес'], ['c-st', 'Статус']];
  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function svg(tag, attrs) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }

  var msgs, slots = [], token = 0, visible = false, started = false;

  function ticks() {
    var s = svg('svg', { viewBox: '0 0 18 11', 'class': 'dm-ticks', 'aria-hidden': 'true' });
    s.appendChild(svg('path', { d: 'M1 6l3 3L10 2' }));
    s.appendChild(svg('path', { 'class': 't2', d: 'M7 8l1.2 1L14.5 2' }));
    return s;
  }
  function avatar(cls, txt) { return el('span', 'dm-av ' + cls, txt); }

  function buildMsg(o) {
    var s = SENDERS[o.who];
    var row = el('div', 'dm-msg');
    row.appendChild(avatar(s.k, s.i));
    var bub = el('div', 'dm-bub');
    bub.appendChild(el('div', 'dm-name ' + s.k, s.n));
    if (o.reply) {
      var q = el('div', 'dm-reply ' + o.reply.k);
      q.appendChild(el('b', null, o.reply.n)); q.appendChild(el('span', null, o.reply.t));
      bub.appendChild(q);
    }
    var p = el('p', 'dm-text');
    o.parts.forEach(function (x) {
      if (typeof x === 'string') p.appendChild(document.createTextNode(x));
      else { var h = el('span', 'hl', x[0]); h.setAttribute('data-k', x[1]); p.appendChild(h); }
    });
    bub.appendChild(p);
    var meta = el('div', 'dm-meta');
    meta.appendChild(el('span', 'dm-ok', '✓ Заявка распознана'));
    var tm = el('span', 'dm-tm'); tm.appendChild(el('span', null, o.time)); tm.appendChild(ticks());
    meta.appendChild(tm); bub.appendChild(meta);
    row.appendChild(bub);
    return row;
  }

  function build() {
    chat.textContent = ''; table.textContent = ''; slots = [];
    var hd = el('div', 'dm-hd');
    hd.appendChild(avatar('grp', 'ЗБ'));
    var tt = el('div', 'dm-tt'); tt.appendChild(el('b', null, 'Заявки · Баржи')); tt.appendChild(el('span', null, '5 участников, онлайн'));
    hd.appendChild(tt); chat.appendChild(hd);
    msgs = el('div', 'dm-msgs'); chat.appendChild(msgs);
    var cp = el('div', 'dm-compose'); cp.appendChild(el('span', 'dm-inp', 'Сообщение'));
    var send = el('span', 'dm-send'); var sv = svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' });
    sv.appendChild(svg('path', { d: 'M4 12l16-8-6 16-2.5-6.5L4 12z' })); send.appendChild(sv);
    cp.appendChild(send); chat.appendChild(cp);

    var head = el('div', 'dm-row head');
    COLS.forEach(function (c) { head.appendChild(el('span', c[0], c[1])); });
    table.appendChild(head);
    ORDERS.forEach(function () {
      var row = el('div', 'dm-row slot');
      COLS.forEach(function (c) { row.appendChild(el('span', c[0])); });
      table.appendChild(row); slots.push(row);
    });
  }

  function setStatus(row, ok) {
    var st = row.children[4]; st.textContent = ok ? 'Назначена' : 'Новая'; st.className = 'c-st dm-st' + (ok ? ' ok' : '');
  }
  function cellValues(o) { return [o.date, o.route, o.cargo, o.w]; }

  function showFinal() {
    build();
    ORDERS.forEach(function (o, i) {
      var m = buildMsg(o); m.classList.add('in', 'read'); msgs.appendChild(m);
      [].forEach.call(m.querySelectorAll('.hl'), function (h) { h.classList.add('on'); });
      var v = cellValues(o), r = slots[i];
      v.forEach(function (t, k) { r.children[k].textContent = t; });
      setStatus(r, o.ok); r.classList.add('on');
      [].forEach.call(r.children, function (c) { c.classList.add('cv'); });
    });
  }

  function until() { // ждать, пока блок на экране
    return new Promise(function (res) { (function chk() { visible ? res() : setTimeout(chk, 200); })(); });
  }

  function pushMsg(m) {
    var prev = [].slice.call(msgs.children);
    msgs.appendChild(m);
    var h = m.offsetHeight + 12;
    prev.forEach(function (c) {
      c.animate([{ transform: 'translateY(' + h + 'px)' }, { transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.22,.8,.24,1)' });
    });
    void m.offsetWidth; m.classList.add('in');
  }

  async function run() {
    var my = ++token;
    build();
    await wait(400); if (my !== token) return;
    for (var i = 0; i < ORDERS.length; i++) {
      await until(); if (my !== token) return;
      var o = ORDERS[i];
      var m = buildMsg(o); pushMsg(m);
      await wait(1100); if (my !== token) return;
      // система разбирает сообщение: подсвечиваем найденное
      for (var k = 0; k < HL_ORDER.length; k++) {
        var hs = m.querySelectorAll('.hl[data-k="' + HL_ORDER[k] + '"]');
        [].forEach.call(hs, function (h) { h.classList.add('on'); });
        await wait(420); if (my !== token) return;
      }
      await until(); if (my !== token) return;
      m.classList.add('parsed'); await wait(900); if (my !== token) return;
      // строка таблицы заполняется по ячейкам
      var row = slots[i], v = cellValues(o);
      row.classList.add('on', 'flash');
      for (var c = 0; c < 4; c++) { row.children[c].textContent = v[c]; row.children[c].classList.add('cv'); await wait(75); }
      setStatus(row, false); row.children[4].classList.add('cv');
      await wait(600); if (my !== token) return;
      m.classList.remove('parsed'); m.classList.add('read');
      row.classList.remove('flash'); await wait(900); if (my !== token) return;
    }
    // часть заявок получает машину
    for (var j = 0; j < ORDERS.length; j++) {
      if (!ORDERS[j].ok) continue;
      await wait(500); await until(); if (my !== token) return;
      var st = slots[j].children[4]; setStatus(slots[j], true); st.classList.add('cv', 'chg');
      slots[j].classList.add('flash');
      (function (r, s) { setTimeout(function () { r.classList.remove('flash'); s.classList.remove('chg'); }, 900); })(slots[j], st);
    }
    await wait(5000); if (my !== token) return;
    // мягкий сброс и новый цикл
    stage.style.transition = 'opacity .5s'; stage.style.opacity = '0'; await wait(550); if (my !== token) return;
    build(); stage.style.opacity = '1'; await wait(500);
    if (my === token) run();
  }

  if (reduce || !('IntersectionObserver' in window) || !Element.prototype.animate) { showFinal(); return; }
  build();
  new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      visible = e.isIntersecting;
      if (visible && !started) { started = true; run(); }
    });
  }, { threshold: .3 }).observe(stage);
})();
