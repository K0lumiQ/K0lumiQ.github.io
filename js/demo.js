(function () {
  'use strict';
  var chat = document.getElementById('dmChat'), table = document.getElementById('dmTable'), stage = document.getElementById('demoStage');
  if (!chat || !table || !stage) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ORDERS = [
    { text: 'Баржа «Заря-14» под погрузку, арматура 20 т, завтра к 9', time: '09:12', date: '16 окт', route: 'Заря-14', cargo: 'Арматура', w: '20 т', ok: true },
    { text: 'Добрый день, «Каскад» свободна, паллеты 8 тонн, в пятницу', time: '09:40', date: '18 окт', route: 'Каскад', cargo: 'Паллеты', w: '8 т', ok: true },
    { text: 'Нужна «Лазурная» на понедельник, цемент 12 т', time: '10:05', date: '21 окт', route: 'Лазурная', cargo: 'Цемент', w: '12 т', ok: false },
    { text: 'Бигбэги с песком, 5 т, баржа «Север-7», в среду', time: '10:31', date: '23 окт', route: 'Север-7', cargo: 'Песок', w: '5 т', ok: true },
    { text: 'Заявка: металлопрокат 22 т, «Береговая-3», на четверг', time: '11:02', date: '24 окт', route: 'Береговая-3', cargo: 'Металлопрокат', w: '22 т', ok: false }
  ];
  var COLS = [['c-date', 'Дата'], ['c-route', 'Баржа'], ['c-cargo', 'Груз'], ['c-w', 'Вес'], ['c-st', 'Статус']];

  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  var msgs, typing, slots = [], token = 0, visible = false, started = false;

  function build() {
    chat.textContent = ''; table.textContent = ''; slots = [];
    var hd = el('div', 'dm-hd'); hd.appendChild(el('i')); hd.appendChild(el('span', null, 'Чат с заявками')); chat.appendChild(hd);
    msgs = el('div', 'dm-msgs'); chat.appendChild(msgs);
    typing = el('div', 'dm-typing'); typing.appendChild(el('i')); typing.appendChild(el('i')); typing.appendChild(el('i'));
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
  function fillRow(row, o, ok) {
    var c = row.children;
    c[0].textContent = o.date; c[1].textContent = o.route; c[2].textContent = o.cargo; c[3].textContent = o.w;
    setStatus(row, ok);
  }

  function showFinal() {
    build();
    ORDERS.forEach(function (o, i) {
      var m = el('div', 'dm-msg in sent', o.text); m.appendChild(el('small', null, o.time)); msgs.appendChild(m);
      fillRow(slots[i], o, o.ok); slots[i].classList.add('on');
    });
  }

  function until() { // ждать, пока блок на экране
    return new Promise(function (res) { (function chk() { visible ? res() : setTimeout(chk, 200); })(); });
  }

  function fly(from, to, label) {
    var sr = stage.getBoundingClientRect(), a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    var chip = el('div', 'dm-chip', label); stage.appendChild(chip);
    var x0 = a.left - sr.left + 16, y0 = a.top - sr.top + a.height / 2 - 16;
    var x1 = b.left - sr.left + 16, y1 = b.top - sr.top + b.height / 2 - 16;
    var anim = chip.animate([
      { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(.8)', opacity: 0 },
      { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(1)', opacity: 1, offset: .2 },
      { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(1)', opacity: 1, offset: .85 },
      { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(.9)', opacity: 0 }
    ], { duration: 1100, easing: 'cubic-bezier(.22,.8,.24,1)', fill: 'forwards' });
    return anim.finished.catch(function () {}).then(function () { chip.remove(); });
  }

  async function run() {
    var my = ++token;
    build();
    for (var i = 0; i < ORDERS.length; i++) {
      await until(); if (my !== token) return;
      var o = ORDERS[i];
      msgs.appendChild(typing); void typing.offsetWidth; typing.classList.add('on'); await wait(700); if (my !== token) return;
      typing.classList.remove('on'); typing.remove();
      var m = el('div', 'dm-msg', o.text); m.appendChild(el('small', null, o.time)); msgs.appendChild(m);
      void m.offsetWidth; m.classList.add('in'); await wait(900); if (my !== token) return;
      await until(); if (my !== token) return;
      m.classList.add('sent');
      var row = slots[i]; fillRow(row, o, false);
      await fly(m, row, o.route + ' · ' + o.w); if (my !== token) return;
      row.classList.add('on', 'flash'); await wait(350);
      row.classList.remove('flash'); await wait(250); if (my !== token) return;
    }
    // часть заявок получает машину
    for (var j = 0; j < ORDERS.length; j++) {
      if (!ORDERS[j].ok) continue;
      await wait(450); await until(); if (my !== token) return;
      setStatus(slots[j], true); slots[j].classList.add('flash');
      (function (r) { setTimeout(function () { r.classList.remove('flash'); }, 500); })(slots[j]);
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
