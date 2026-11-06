/*
 * Samet Erez Atmaca — hero ortam katmanı ("aurora" sisteminin özgün uygulaması).
 *
 * Tasarım niyeti: saai.pro'daki ışık-kütlesi + halka fikrinin aynı *sistemi*,
 * farklı kompozisyonu. Kopya değil; üç katman birlikte çalışır:
 *   1) Nefes alan ışık kütleleri (site paletinden: kobalt, turkuaz, lale, mürekkep)
 *   2) Kırık halkalar: tam çember değil, yavaş dönen yay parçaları
 *   3) Nokta takımyıldızı: fare yakınında hafifçe itilen, birbirine ince çizgiyle bağlanan zerreler
 * Masaüstünde fare paralaksı + yay dönüşü; mobilde sadeleşmiş profil (daha az katman,
 * daha düşük DPR ve kare hızı, dokunmatik kaydırma paralaksı).
 *
 * Sınırlar: kendi kaynağımızdan yüklenir (CSP 'self'); "hareketi azalt" tercihinde tek
 * kare çizilir; sekme gizlenince ve hero görünmezken döngü durur; canvas DPR'si sınırlıdır.
 */
(function () {
  'use strict';

  var hero = null, canvas = null, ctx = null;
  var W = 0, H = 0, dpr = 1, cfg = null;
  var rafId = null, running = false, visible = true, inView = true;
  var frame = 0, lastPaint = 0, ringPhase = 0, scrollShift = 0;
  var reduce = false;
  var pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, px: -9999, py: -9999, inside: false };
  var orbs = [], dots = [];
  var palette = { ring: 'rgba(19,32,58,0.06)', ring2: 'rgba(36,72,201,0.05)', dot: 'rgba(19,32,58,0.28)', line: 'rgba(36,72,201,0.16)' };

  function css(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }
  function rgb(hex) {
    var h = (hex || '').replace('#', '').trim();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgba(hex, a) {
    var c = rgb(hex);
    return c ? 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')' : 'rgba(120,140,180,' + a + ')';
  }
  function temaKoyu() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  // Koyu zeminli bölümlerde (ör. proje sayfalarındaki renkli "field" alanları) tema açık
  // olsa bile açık tonlar kullanılır; aksi hâlde animasyon zeminde kaybolur.
  function zeminKoyu(el) {
    try {
      if (el && el.classList && (el.classList.contains('field') || el.classList.contains('nerio'))) return true;
      var bg = el ? (getComputedStyle(el).backgroundColor || '') : '';
      var m = bg.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
      if (!m) return temaKoyu();
      var l = (0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]) / 255;
      return l < 0.45;
    } catch (e) { return temaKoyu(); }
  }
  // Animasyon alanı: site genelinde hero varsa hero, yoksa sayfa başlığı bandı.
  function hedefSec() {
    return document.querySelector('[data-aurora]') ||
      document.querySelector('.hero') ||
      document.querySelector('.page-hero') ||
      document.querySelector('main > section:first-of-type') ||
      document.querySelector('main');
  }
  function isMobile() {
    return (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || window.innerWidth < 760;
  }

  function profile() {
    var mobile = isMobile();
    cfg = mobile
      ? { orbs: 3, dots: 14, rings: 3, fps: 24, dprCap: 1.25, parallax: 0.35, scroll: 0.5, connect: 0 }
      : { orbs: 4, dots: 34, rings: 5, fps: 34, dprCap: 1.75, parallax: 1, scroll: 1, connect: 110 };
  }

  function paletteRefresh() {
    var dark = zeminKoyu(hero) || temaKoyu();
    var cobalt = css('--cobalt', dark ? '#93a9ff' : '#2448c9');
    var teal = css('--teal', dark ? '#5ad3c2' : '#0a7468');
    var tulip = css('--tulip', dark ? '#ff8f8a' : '#b3303a');
    var ink = css('--ink', dark ? '#e6ecf4' : '#13203a');
    var w = dark ? [0.15, 0.12, 0.09, 0.06] : [0.10, 0.09, 0.07, 0.05];
    var renkler = [rgba(cobalt, w[0]), rgba(teal, w[1]), rgba(tulip, w[2]), rgba(ink, w[3])];
    orbs = [];
    for (var i = 0; i < cfg.orbs; i++) {
      orbs.push({
        x: 0.22 + (i * 0.27) % 0.62,
        y: 0.26 + (i * 0.19) % 0.5,
        r: 0.42 + (i % 3) * 0.09,
        vx: (i % 2 ? -1 : 1) * (0.00016 + i * 0.00002),
        vy: (i % 3 ? 1 : -1) * (0.00012 + i * 0.00002),
        c: renkler[i % renkler.length]
      });
    }
    palette.ring = rgba(ink, dark ? 0.10 : 0.055);
    palette.ring2 = rgba(cobalt, dark ? 0.10 : 0.045);
    palette.dot = rgba(dark ? ink : '#3a4d78', dark ? 0.55 : 0.30);
    palette.line = rgba(cobalt, dark ? 0.18 : 0.13);
    zerreleriKur();
  }

  function zerreleriKur() {
    dots = [];
    for (var i = 0; i < cfg.dots; i++) {
      dots.push({
        x: Math.random(), y: Math.random(),
        r: 0.8 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.00022,
        vy: (Math.random() - 0.5) * 0.00018,
        ox: 0, oy: 0
      });
    }
  }

  function resize() {
    if (!canvas || !hero) return;
    var rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, cfg.dprCap);
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scrollShift = 0;
    if (reduce) tekKare();
  }

  // Işık kütleleri: çok düşük alfalı radyal geçişler.
  function kutleler(mx, my) {
    for (var i = 0; i < orbs.length; i++) {
      var o = orbs[i];
      o.x += o.vx; o.y += o.vy;
      if (o.x < 0.08 || o.x > 0.92) o.vx *= -1;
      if (o.y < 0.08 || o.y > 0.92) o.vy *= -1;
      var px = (o.x + (mx - 0.5) * 0.06 + scrollShift * 0.004) * W;
      var py = (o.y + (my - 0.5) * 0.06 - scrollShift * 0.01) * H;
      var rr = o.r * Math.min(W, H);
      var g = ctx.createRadialGradient(px, py, 0, px, py, rr);
      g.addColorStop(0, o.c);
      g.addColorStop(0.55, o.c);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, rr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Kırık halkalar: her halka farklı yönde dönen yay parçalarından oluşur.
  function halkalar() {
    var cx = W * (0.5 + (pointer.x - 0.5) * 0.02);
    var cy = H * (0.46 + (pointer.y - 0.5) * 0.02);
    var max = Math.max(W, H);
    var step = 150;
    for (var i = 0; i < cfg.rings; i++) {
      var radius = ((ringPhase * (i % 2 ? -1 : 1) * (0.6 + i * 0.15)) % (max * 0.9)) + i * step + 40;
      radius = Math.abs(radius);
      if (radius < 24 || radius > max * 0.95) continue;
      var alpha = Math.max(0, 1 - radius / (max * 0.95)) * (i % 2 ? 0.9 : 0.7);
      if (alpha <= 0.02) continue;
      ctx.strokeStyle = i % 2 ? palette.ring2 : palette.ring;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = i % 3 === 0 ? 1.25 : 0.8;
      var start = (i * 0.9 + frame * 0.0016) % (Math.PI * 2);
      var span = Math.PI * (0.55 + (i % 3) * 0.16);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, start + span);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Nokta takımyıldızı: hafif sürüklenme, fare yakınında itilme ve ince bağlantılar.
  function zerreler(mx, my) {
    if (!cfg.dots) return;
    var fx = mx * W, fy = my * H;
    var n = dots.length, i, j, d;
    for (i = 0; i < n; i++) {
      var p = dots[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0.02 || p.x > 0.98) p.vx *= -1;
      if (p.y < 0.02 || p.y > 0.98) p.vy *= -1;
      var px = p.x * W, py = p.y * H;
      if (pointer.inside && cfg.connect) {
        var dx = px - fx, dy = py - fy, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < cfg.connect && dist > 0.01) {
          var it = (1 - dist / cfg.connect) * 14;
          p.ox += (dx / dist) * it * 0.06;
          p.oy += (dy / dist) * it * 0.06;
        }
      }
      p.ox *= 0.94; p.oy *= 0.94;
      ctx.fillStyle = palette.dot;
      ctx.beginPath();
      ctx.arc(px + p.ox, py + p.oy, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!cfg.connect) return;
    ctx.strokeStyle = palette.line;
    ctx.lineWidth = 0.7;
    for (i = 0; i < n; i++) {
      for (j = i + 1; j < n; j++) {
        var ax = dots[i].x * W + dots[i].ox, ay = dots[i].y * H + dots[i].oy;
        var bx = dots[j].x * W + dots[j].ox, by = dots[j].y * H + dots[j].oy;
        d = (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
        if (d < 90 * 90) {
          ctx.globalAlpha = (1 - Math.sqrt(d) / 90) * 0.5;
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function tekKare() {
    ctx.clearRect(0, 0, W, H);
    ringPhase = 120;
    kutleler(0.5, 0.5);
    halkalar();
    zerreler(0.5, 0.5);
  }

  function render(now) {
    if (!running) return;
    rafId = requestAnimationFrame(render);
    if (now - lastPaint < 1000 / cfg.fps) return;
    lastPaint = now;
    frame++;
    ringPhase += 0.55;
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    ctx.clearRect(0, 0, W, H);
    kutleler(pointer.x, pointer.y);
    halkalar();
    zerreler(pointer.x, pointer.y);
  }

  function start() {
    if (running || reduce || !visible || !inView) return;
    running = true;
    lastPaint = 0;
    rafId = requestAnimationFrame(render);
  }
  function stop() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function init() {
    hero = hedefSec();
    if (!hero) return;
    reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    profile();
    canvas = document.createElement('canvas');
    canvas.id = 'aurora-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.firstChild);
    ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    hero.classList.add('has-aurora');
    paletteRefresh();
    resize();
    if (reduce) { tekKare(); return; }
    start();

    var refresh = function () { paletteRefresh(); resize(); if (reduce) tekKare(); };
    window.addEventListener('resize', refresh, { passive: true });
    window.addEventListener('orientationchange', refresh, { passive: true });
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', refresh); else if (mq.addListener) mq.addListener(refresh);
    }
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('.theme-toggle')) setTimeout(refresh, 60);
    });

    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        pointer.tx = (e.clientX - r.left) / Math.max(1, r.width);
        pointer.ty = (e.clientY - r.top) / Math.max(1, r.height);
        pointer.inside = true;
      }, { passive: true });
      hero.addEventListener('pointerleave', function () { pointer.inside = false; pointer.px = -9999; });
    }

    // Kaydırma paralaksı: masaüstünde tam, mobilde yarım etkili.
    window.addEventListener('scroll', function () {
      var r = hero.getBoundingClientRect();
      scrollShift = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height))) * 100 * cfg.scroll;
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      visible = !document.hidden;
      if (visible) start(); else stop();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) start(); else stop();
      }, { threshold: 0.02 }).observe(hero);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
