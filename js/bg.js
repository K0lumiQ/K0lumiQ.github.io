// Фон: поле частиц на canvas. Точки дрейфуют, соседние соединяются линиями, курсор их отталкивает.
// Не работает при prefers-reduced-motion, на вкладке в фоне останавливается.
(function () {
  var canvas = document.getElementById('ambFx');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var ctx = canvas.getContext('2d');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var LINK = 128, REPEL = 170;
  var w = 0, h = 0, nodes = [], mouse = { x: -9999, y: -9999 }, raf = 0;

  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cap = w < 760 ? 30 : 70;
    var n = Math.round(Math.min(cap, Math.max(22, (w * h) / 24000)));
    nodes = [];
    for (var i = 0; i < n; i++) nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 2 + 1.3, warm: i % 3 === 0 });
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    var i, n;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      var dx = n.x - mouse.x, dy = n.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < REPEL * REPEL && d2 > .01) { var push = (REPEL * REPEL - d2) * .000012; n.vx += dx * push; n.vy += dy * push; }
      n.x += n.vx; n.y += n.vy; n.vx *= .985; n.vy *= .985;
      if (n.x < -10) n.x = w + 10; if (n.x > w + 10) n.x = -10;
      if (n.y < -10) n.y = h + 10; if (n.y > h + 10) n.y = -10;
      ctx.fillStyle = n.warm ? 'rgba(255,192,143,.7)' : 'rgba(255,145,67,.75)';
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.lineWidth = .6;
    for (var a = 0; a < nodes.length; a++) {
      for (var b = a + 1; b < nodes.length; b++) {
        var p = nodes[a], q = nodes[b], ddx = p.x - q.x, ddy = p.y - q.y, dist2 = ddx * ddx + ddy * ddy;
        if (dist2 < LINK * LINK) {
          ctx.strokeStyle = 'rgba(255,160,100,' + (.15 * (1 - dist2 / (LINK * LINK))).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(frame);
  }

  function start() { if (!raf) raf = requestAnimationFrame(frame); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  if (fine) {
    window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
  }
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  resize(); start();
})();
