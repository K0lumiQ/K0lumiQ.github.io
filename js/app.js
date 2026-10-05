// Контент и интерфейс: отрисовка карточек из data.js, фильтр, окна, форма, навигация.
// Анимации и плавный скролл живут в js/fx.js (window.FX).
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  window.$ = $; window.$$ = $$;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
  var refresh = function () { if (window.FX && FX.refresh) FX.refresh(); };

  /* ---------- контакты ---------- */
  $('#tgBtn').href = ME.telegramUrl; $('#ghBtn').href = ME.githubUrl;
  $('.mail-t').textContent = ME.email; $('#mail').href = 'mailto:' + ME.email;
  var fm = $('#fMail'); fm.textContent = ME.email; fm.href = 'mailto:' + ME.email;
  var ft = $('#fTg'); ft.textContent = ME.telegram; ft.href = ME.telegramUrl;
  var ICON = {
    tg: '<svg viewBox="0 0 24 24"><path d="M21 4 3 11l5.500 2L10 19l3-3.500 4.500 3.500L21 4ZM8.500 13l9-6.500-6 7"/></svg>',
    gh: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-2.850 17.540c.45.080.62-.2.62-.43v-1.500c-2.500.54-3.030-1.200-3.030-1.200-.41-1.040-1-1.320-1-1.320-.82-.56.060-.55.060-.55.900.06 1.380.93 1.380.93.800 1.380 2.100.98 2.610.75.080-.58.310-.98.570-1.200-2-.23-4.100-1-4.100-4.450 0-.98.350-1.790.930-2.420-.09-.23-.4-1.150.09-2.390 0 0 .76-.24 2.480.93a8.600 8.600 0 0 1 4.520 0c1.720-1.170 2.480-.93 2.480-.93.490 1.240.18 2.160.09 2.390.58.630.93 1.440.93 2.420 0 3.460-2.110 4.220-4.120 4.440.32.280.61.830.61 1.670v2.480c0 .24.160.52.620.43A9 9 0 0 0 12 3Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>'
  };
  $('#soc').innerHTML = '<a href="' + ME.telegramUrl + '" target="_blank" rel="noopener" aria-label="Telegram">' + ICON.tg + '</a><a href="' + ME.githubUrl + '" target="_blank" rel="noopener" aria-label="GitHub">' + ICON.gh + '</a><a href="mailto:' + ME.email + '" aria-label="Почта">' + ICON.mail + '</a>';

  /* ---------- статистика, услуги, процесс, цитата ---------- */
  $('#stats').innerHTML = STATS.map(function (s) { return '<div class="stat" data-fade><b class="num" data-count="' + s.n + '">0</b>' + (s.plus ? '<i>+</i>' : '') + '<span>' + s.label + '</span></div>'; }).join('');
  $('#svcGrid').innerHTML = SERVICES.map(function (s, i) {
    return '<article class="svc" data-card data-tilt style="--i:' + i + '"><span class="svc-n">' + s.n + '</span><h3>' + s.title + '</h3><p>' + s.text + '</p><div class="tags">' + s.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div><i class="svc-glow"></i></article>';
  }).join('');
  $('#stepGrid').innerHTML = STEPS.map(function (s, i) { return '<article class="step" data-card style="--i:' + i + '"><span class="step-n">' + s.n + '</span><h3>' + s.title + '</h3><p>' + s.text + '</p></article>'; }).join('');
  $('#quote blockquote').textContent = QUOTE.text; $('#quote figcaption').innerHTML = '<b>' + QUOTE.author + '</b><span>' + QUOTE.role + '</span>';

  /* ---------- проекты и фильтр ---------- */
  var cur = 'Все', grid = $('#projGrid'), fbox = $('#filters');
  fbox.insertAdjacentHTML('beforeend', FILTERS.map(function (f, i) { return '<button role="tab" aria-selected="' + (i ? 'false' : 'true') + '" class="' + (i ? '' : 'on') + '" data-f="' + f + '">' + f + '</button>'; }).join(''));
  function cardHtml(p, i) {
    return '<article class="proj" data-card data-tilt data-id="' + p.id + '" style="--i:' + i + '" tabindex="0" role="button" aria-label="Открыть проект ' + esc(p.title) + '" data-cursor="смотреть"><div class="proj-img"><img src="' + p.img + '" alt="Скриншот проекта ' + esc(p.title) + '" loading="lazy" data-par><span class="proj-badge">' + p.type + '</span></div>' +
      '<div class="proj-hd"><h3>' + p.title + '</h3><i class="line"></i></div><dl><div><dt>Тип:</dt><dd>' + p.kind + '</dd></div><div><dt>Стек:</dt><dd>' + p.stack.join(' · ') + '</dd></div></dl></article>';
  }
  function placeholder(i) { return '<article class="proj next" data-card style="--i:' + i + '"><div class="next-in"><span class="next-ic">+</span><h3>Ваш проект</h3><p>Здесь появится следующая работа. Расскажите о задаче, и обсудим.</p><a class="btn btn-o" href="#contact" data-magnet data-cursor="написать"><span>Обсудить</span>' + ARROW + '</a></div></article>'; }
  function draw() {
    var list = PROJECTS.filter(function (p) { return cur === 'Все' || p.type === cur; });
    grid.classList.add('swap');
    setTimeout(function () {
      grid.innerHTML = list.map(cardHtml).join('') + placeholder(list.length);
      grid.classList.remove('swap'); refresh();
    }, grid.dataset.ready ? 320 : 0);
    grid.dataset.ready = '1';
  }
  function moveFilter() { var on = $('#filters .on'), ind = $('#fInd'); if (on && ind) { ind.style.width = on.offsetWidth + 'px'; ind.style.transform = 'translateX(' + on.offsetLeft + 'px)'; } }
  fbox.addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (!b || b.dataset.f === cur) return; cur = b.dataset.f; $$('#filters button').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', String(x === b)); }); moveFilter(); draw(); });
  window.addEventListener('resize', moveFilter);
  draw(); setTimeout(moveFilter, 60); if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveFilter);

  /* ---------- окна ---------- */
  var modal = $('#modal'), mBody = $('#mBody'), lastFocus = null;
  function openModal(html, cls, origin) {
    lastFocus = document.activeElement; mBody.innerHTML = html; modal.className = 'modal open' + (cls ? ' ' + cls : ''); modal.setAttribute('aria-hidden', 'false');
    if (origin) { var r = origin.getBoundingClientRect(), b = $('#mBox'); b.style.transformOrigin = (r.left + r.width / 2) + 'px ' + (r.top + r.height / 2 - b.getBoundingClientRect().top) + 'px'; }
    if (window.FX && FX.lock) FX.lock(true); $('.m-x', modal).focus({ preventScroll: true });
  }
  function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); if (window.FX && FX.lock) FX.lock(false); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
  document.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Tab') { var f = $$('a[href], button, input, textarea, [tabindex="0"]', modal).filter(function (x) { return x.offsetParent !== null; }); if (!f.length) return; var first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  });

  function openProject(id, origin) {
    var p = PROJECTS.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    openModal('<div class="case"><div class="case-img"><img src="' + p.img + '" alt="' + esc(p.title) + '"></div><div class="case-tx"><span class="badge">' + p.type + ' · ' + p.year + '</span><h3>' + p.title + '</h3><p class="kind">' + p.kind + '</p><p>' + p.text + '</p><ul>' + p.points.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul><div class="tags">' + p.stack.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>' +
      '<div class="case-act"><a class="btn btn-o" href="' + p.demo + '" target="_blank" rel="noopener"><span>Открыть сайт</span>' + ARROW + '</a><a class="btn btn-ghost" href="' + p.code + '" target="_blank" rel="noopener"><span>Код на GitHub</span></a></div></div></div>', 'wide', origin);
  }
  grid.addEventListener('click', function (e) { var c = e.target.closest('.proj[data-id]'); if (c) openProject(c.dataset.id, c); });
  grid.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.proj[data-id]')) { e.preventDefault(); openProject(e.target.dataset.id, e.target); } });

  $('#aboutMore').addEventListener('click', function (e) {
    e.preventDefault();
    openModal('<div class="more"><span class="badge">Обо мне</span><h3>Владислав Ким</h3><p class="lead">' + ABOUT_MORE.lead + '</p><div class="more-grid">' + ABOUT_MORE.groups.map(function (g) { return '<div><h4>' + g.title + '</h4><ul>' + g.items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul></div>'; }).join('') + '</div><a class="btn btn-o" href="#contact" data-close><span>Обсудить проект</span>' + ARROW + '</a></div>', '', this);
  });

  /* ---------- toast, копирование почты ---------- */
  var tt; function toast(m) { var t = $('#toast'); t.textContent = m; void t.offsetWidth; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('show'); }, 2600); }
  window.toast = toast;
  $('#mail').addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey) return; e.preventDefault();
    var done = function () { toast('Почта скопирована: ' + ME.email); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ME.email).then(done, function () { location.href = 'mailto:' + ME.email; }); else location.href = 'mailto:' + ME.email;
  });

  /* ---------- форма ---------- */
  var form = $('#form');
  form.addEventListener('input', function (e) { e.target.classList.remove('bad'); var er = e.target.parentNode.querySelector('.err'); if (er) er.textContent = ''; });
  form.addEventListener('submit', function (e) {
    e.preventDefault(); var f = form.elements, bad = false;
    function chk(n, c, m) { var x = f[n], er = x.parentNode.querySelector('.err'); x.classList.remove('bad'); er.textContent = ''; if (c) { x.classList.add('bad'); er.textContent = m; void x.offsetWidth; bad = true; } }
    chk('name', f.name.value.trim().length < 2, 'Как к вам обращаться?'); chk('contact', f.contact.value.trim().length < 4, 'Оставьте почту или Telegram'); chk('msg', f.msg.value.trim().length < 10, 'Напишите пару слов о задаче');
    if (bad) return;
    var body = 'Здравствуйте, меня зовут ' + f.name.value.trim() + '.\n\n' + f.msg.value.trim() + '\n\nКонтакт для ответа: ' + f.contact.value.trim();
    window.location.href = 'mailto:' + ME.email + '?subject=' + encodeURIComponent('Заказ с сайта: ' + f.name.value.trim()) + '&body=' + encodeURIComponent(body);
    toast('Открываю почтовый клиент с готовым письмом'); form.reset();
  });

  /* ---------- меню на телефоне ---------- */
  var burger = $('#burger'), nav = $('#nav');
  function closeNav() { nav.classList.remove('open'); burger.classList.remove('open'); $('#hdr').classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); if (window.FX && FX.lock) FX.lock(false); }
  burger.addEventListener('click', function () { var o = nav.classList.toggle('open'); burger.classList.toggle('open', o); $('#hdr').classList.toggle('menu-open', o); burger.setAttribute('aria-expanded', String(o)); if (window.FX && FX.lock) FX.lock(o); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });

  /* ---------- якоря ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return; var id = a.getAttribute('href').slice(1); if (!id) { e.preventDefault(); return; }
    var t = document.getElementById(id); if (!t) return; e.preventDefault();
    if (window.FX && FX.scrollTo) FX.scrollTo(t); else t.scrollIntoView({ behavior: 'smooth' });
  });

  window.App = { toast: toast, openProject: openProject };
})();
