/*
 * Giriş animasyonu: sahne hareketleri + tarayıcı ajanları + sayaç + kaydırma açılımı.
 * Kendi kaynağımızdan yüklenir (script-src 'self'). Hareket azaltma tercihinde hiçbir şey yapmaz;
 * sayfa statik ve eksiksiz kalır. Animasyon bir kez oynar, kalıcı döngü yok.
 */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { markReveal(); return; }

  function markReveal() {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    // 1) Sahne: gövdeye anim sınıfı (CSS zamanlamaları devralır).
    requestAnimationFrame(function () { document.body.classList.add('anim'); });

    // 2) Tarayıcı ajanları (yalnız geniş ekranda, hero varsa).
    var hero = document.querySelector('.hero');
    if (hero && window.innerWidth >= 900) {
      var katman = document.createElement('div');
      katman.className = 'agents';
      katman.setAttribute('aria-hidden', 'true');
      var renkler = ['red', 'teal', 'violet', 'white'];
      for (var i = 0; i < 4; i++) {
        var a = document.createElement('div');
        a.className = 'agent a' + (i + 1) + ' ' + renkler[i];
        a.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M4 2l12 6-5 1.6L8 15z"/></svg><b>' + ['dilekçe', 'içtihat', 'mevzuat', 'dosya'][i] + '</b>';
        katman.appendChild(a);
      }
      hero.appendChild(katman);
      var cizgi = document.createElement('div');
      cizgi.className = 'scanline';
      cizgi.setAttribute('aria-hidden', 'true');
      hero.appendChild(cizgi);
    }

    // 3) İstatistik sayaçları: 03 · 06 · 2026 · TR
    document.querySelectorAll('.hero-stats .stat b').forEach(function (b, idx) {
      var hedef = b.textContent.trim();
      var sayi = parseInt(hedef.replace(/[^\d]/g, ''), 10);
      if (!sayi || isNaN(sayi)) return;
      var bas = performance.now(), sure = 900 + idx * 110;
      b.textContent = '0';
      function tik(now) {
        var o = Math.min(1, (now - bas) / sure);
        var deger = Math.round(sayi * (1 - Math.pow(1 - o, 3)));
        b.textContent = String(deger).padStart(hedef.length, '0');
        if (o < 1) requestAnimationFrame(tik); else b.textContent = hedef;
      }
      requestAnimationFrame(tik);
    });

    // 4) Bölüm açılımı: ekrana giren bloklar yükselir.
    var hedefler = document.querySelectorAll('.section, .page-grid, .projects, .principles, .section-head, .contact');
    hedefler.forEach(function (el) {
      if (!el.classList.contains('reveal')) el.classList.add('reveal');
    });
    document.querySelectorAll('.projects .project, .page-grid .panel, .section-head > *').forEach(function (el, i) {
      el.classList.add('reveal', 'd' + (i % 3 + 1));
    });
    setTimeout(function(){document.querySelectorAll('.reveal:not(.in)').forEach(function(el){el.classList.add('in')})},8000);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    } else markReveal();
  });
})();
