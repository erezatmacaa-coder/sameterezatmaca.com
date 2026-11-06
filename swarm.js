/* AUTOMATION-PROBE: muhtemel otomatik dagitim kapatildi mi kontrolu */
/*
 * "Yeniden inşa" giriş sahnesi — sameterezatmaca.com
 * Sayfa bir kez yüklenirken tam ekran bir blueprint katmanı açılır: sayfa yukarıdan
 * aşağıya doğru "inşa edilerek" açığa çıkar. İmleç ajanları inşa hattında gezer,
 * HUD sayaç/katman bilgisi gösterir. Kaydırma hattı ilerletir; bitince katman söner
 * ve sayfa normal şekilde kullanılır. Tamamen kendi kodumuz; harici kütüphane yok.
 *
 * Kurallar: "hareketi azalt" tercihinde hiç çalışmaz; mobilde kısa ve sade çalışır;
 * oturum başına bir kez oynar (?swarm=1 ile zorlanır, ?swarm=off ile kapanır).
 * Sayfa bu katman açıkken kaydırılamaz; bitince kilit açılır.
 */
(function () {
  'use strict';
  var q = function (n) { try { return new URLSearchParams(location.search).get(n); } catch (e) { return null; } };
  if (q('swarm') === 'off' || q('swarm') === '0') return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var anahtar = 'sea-swarm-v1';
  try {
    if (q('swarm') !== '1' && sessionStorage.getItem(anahtar)) return;
    sessionStorage.setItem(anahtar, '1');
  } catch (e) { /* depolama kapalı */ }

  var mobil = window.innerWidth < 760 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  var durum = { calisiyor: false, hat: 0, hedef: 0, hiz: mobil ? 220 : 150, son: 0, bitti: false };
  var katman, tuval, ctx, hudKatman, hudPct, hudAgents, hudLayers, iptalBtn;
  var ajanlar = [], izler = [];
  var raf = null, boy = 0;

  var HUD_ADI = ['dilekçe', 'içtihat', 'mevzuat', 'dosya', 'kaynak', 'atıf', 'süre', 'masraf', 'şablon', 'imza', 'ekler', 'vekil'];
  var AGENT = mobil ? 5 : 12;
  var LAYERS = mobil ? 64 : 254;

  function olustur() {
    katman = document.createElement('div');
    katman.className = 'swarm';
    katman.setAttribute('aria-hidden', 'true');
    katman.innerHTML = [
      '<canvas class="swarm-canvas"></canvas>',
      '<div class="swarm-hud">',
      '  <div class="swarm-hud-left"><span class="swarm-dot"></span>YENİDEN İNŞA<span class="swarm-sub">sameterezatmaca.com</span></div>',
      '  <div class="swarm-hud-right"><span class="swarm-agents">0 ajan</span><span class="swarm-layers">0 / ' + LAYERS + ' katman</span><span class="swarm-pct">0%</span></div>',
      '</div>',
      '<div class="swarm-front"><span></span></div>',
      '<div class="swarm-foot"><div class="swarm-bar"><i></i></div><button type="button" class="swarm-skip">Siteye geç →</button></div>'
    ].join('');
    document.body.appendChild(katman);
    tuval = katman.querySelector('.swarm-canvas');
    ctx = tuval.getContext('2d');
    hudPct = katman.querySelector('.swarm-pct');
    hudAgents = katman.querySelector('.swarm-agents');
    hudLayers = katman.querySelector('.swarm-layers');
    iptalBtn = katman.querySelector('.swarm-skip');
    iptalBtn.addEventListener('click', bitir);
  }

  function boyutla() {
    boy = window.innerHeight;
    tuval.width = Math.round(window.innerWidth * Math.min(devicePixelRatio || 1, 1.5));
    tuval.height = Math.round(boy * Math.min(devicePixelRatio || 1, 1.5));
    tuval.style.width = window.innerWidth + 'px';
    tuval.style.height = boy + 'px';
    ctx.setTransform(Math.min(devicePixelRatio || 1, 1.5), 0, 0, Math.min(devicePixelRatio || 1, 1.5), 0, 0);
  }

  function ajanKur() {
    ajanlar = [];
    for (var i = 0; i < AGENT; i++) {
      ajanlar.push({
        x: Math.random() * window.innerWidth,
        y: 0,
        hedefY: 0,
        ad: HUD_ADI[i % HUD_ADI.length],
        renk: ['#ef4444', '#5ad3c2', '#a78bfa', '#f5f5f5'][i % 4],
        v: 40 + Math.random() * 120,
        bekle: Math.random() * 900
      });
    }
  }

  function blueprint(t) {
    var w = window.innerWidth, h = boy, hat = durum.hat;
    // Blueprint ızgarası (hattın üstünde)
    ctx.strokeStyle = 'rgba(239,68,68,.16)';
    ctx.lineWidth = 1;
    var adim = 64;
    for (var x = 0; x < w; x += adim) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); ctx.stroke(); }
    for (var y = 0; y < h; y += adim) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); ctx.stroke(); }
    // İnşa hattı: parlak çizgi + ölçü işaretleri
    ctx.strokeStyle = 'rgba(239,68,68,.95)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, hat); ctx.lineTo(w, hat); ctx.stroke();
    ctx.strokeStyle = 'rgba(239,68,68,.35)';
    ctx.lineWidth = 1;
    for (var m = 0; m < w; m += 24) { ctx.beginPath(); ctx.moveTo(m, hat - 5); ctx.lineTo(m, hat + 5); ctx.stroke(); }
    // Hattın üstünde kalan alanı koyu filmle ört
    var g = ctx.createLinearGradient(0, 0, 0, Math.max(1, hat));
    g.addColorStop(0, 'rgba(5,5,5,.96)');
    g.addColorStop(1, 'rgba(5,5,5,.86)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, Math.max(0, hat));
    // Gezinen ajan imleçleri ve bıraktıkları iz
    var simdi = t;
    for (var i = 0; i < ajanlar.length; i++) {
      var a = ajanlar[i];
      if (!a.bas) a.bas = simdi + a.bekle;
      if (!a.bas) a.bas = simdi + a.bekle;
      if (simdi > a.bas) {
        var derinlik = Math.max(120, h - hat);
        a.hedefY = hat + 40 + ((i * 97) % derinlik);
        a.y += ((a.hedefY + Math.sin(simdi / 620 + i) * 10) - a.y) * 0.08;
        a.x += Math.sin((simdi + i * 300) / 700) * 1.8;
        if (a.x < 8) a.x = 8; if (a.x > w - 60) a.x = w - 60;
        if (a.y < hat + 18) a.y = hat + 18;
        if (a.y > h - 24) a.y = h - 24;
        if (Math.random() < 0.14 && izler.length < 140) izler.push({ x: a.x, y: a.y, r: Math.random() * 1.6 + .6, c: a.renk, o: 0.6 });
      }
      // imleç
      ctx.fillStyle = a.renk;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x + 11, a.y + 4);
      ctx.lineTo(a.x + 5, a.y + 6);
      ctx.lineTo(a.x + 7, a.y + 12);
      ctx.lineTo(a.x + 4, a.y + 13);
      ctx.lineTo(a.x + 2, a.y + 7);
      ctx.lineTo(a.x, a.y + 10);
      ctx.closePath();
      ctx.fill();
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(239,248,245,.9)';
      ctx.fillText(a.ad, a.x + 14, a.y + 12);
      if (a.y < hat + 14) a.y = hat + 14;
    }
    for (var k = izler.length - 1; k >= 0; k--) {
      var p = izler[k];
      p.o -= 0.012;
      if (p.o <= 0) { izler.splice(k, 1); continue; }
      ctx.fillStyle = p.c;
      ctx.globalAlpha = p.o;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // HUD metinleri teknoloji hissi
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(239,68,68,.55)';
    var kat = Math.round((hat / Math.max(1, boy)) * LAYERS);
    ctx.fillText('LAYER ' + String(Math.min(kat, LAYERS)).padStart(3, '0') + ' / ' + LAYERS, 20, Math.max(16, hat - 14));
    if (hat > 120) {
      ctx.fillStyle = 'rgba(245,245,245,.22)';
      ctx.fillText('COMPOSE › hero.name', 20, Math.max(20, hat - 84));
      ctx.fillText('PAINT   › layout.grid', 20, Math.max(20, hat - 68));
    }
  }

  function adim(t) {
    if (!durum.calisiyor) return;
    if (!durum.son) durum.son = t;
    var dt = Math.min(80, t - durum.son);
    durum.son = t;
    durum.hat = Math.min(durum.hedef, durum.hat + durum.hiz * (dt / 1000) + (durum.hedef - durum.hat) * 0.02);
    var pct = Math.min(100, Math.round((durum.hat / Math.max(1, boy)) * 100));
    hudPct.textContent = pct + '%';
    hudLayers.textContent = Math.min(Math.round(pct / 100 * LAYERS), LAYERS) + ' / ' + LAYERS + ' katman';
    hudAgents.textContent = ajanlar.length + ' ajan';
    katman.style.setProperty('--hat', durum.hat + 'px');
    katman.style.setProperty('--pct', pct + '%');
    katman.style.clipPath = 'inset(' + Math.max(0, durum.hat) + 'px 0 0 0)';
    ctx.clearRect(0, 0, window.innerWidth, boy);
    blueprint(t);
    if (durum.hat >= boy - 1) { bitir(); return; }
    raf = requestAnimationFrame(adim);
  }

  function ilerlet(px) {
    if (!durum.calisiyor) return;
    durum.hedef = Math.min(boy, durum.hedef + px);
  }

  function basla() {
    durum.calisiyor = true;
    durum.hat = 0; durum.hedef = 0;
    document.documentElement.classList.add('swarm-on');
    window.scrollTo(0, 0);
    boyutla(); ajanKur();
    adim(performance.now());
    // Kısa sürede bitmesin diye otomatik ilerleme
    var otomatik = setInterval(function () {
      if (!durum.calisiyor) { clearInterval(otomatik); return; }
      durum.hedef = Math.min(boy, durum.hedef + (mobil ? 90 : 46));
    }, 90);
    katman._otomatik = otomatik;
    var teker = function (e) { ilerlet(Math.abs(e.deltaY) * 2.2); if (e.cancelable) e.preventDefault(); };
    var dokun = function (e) {
      var y = e.touches && e.touches[0] ? e.touches[0].clientY : 0;
      if (y && katman._sonY) ilerlet(Math.abs(y - katman._sonY) * 2);
      katman._sonY = y;
    };
    window.addEventListener('wheel', teker, { passive: false });
    window.addEventListener('touchmove', dokun, { passive: true });
    katman._teker = teker; katman._dokun = dokun;
    window.addEventListener('resize', function () { if (durum.calisiyor) { boyutla(); } });
  }

  function bitir() {
    if (durum.bitti) return;
    durum.bitti = true; durum.calisiyor = false;
    if (raf) cancelAnimationFrame(raf);
    if (katman._otomatik) clearInterval(katman._otomatik);
    window.removeEventListener('wheel', katman._teker);
    window.removeEventListener('touchmove', katman._dokun);
    katman.style.setProperty('--hat', boy + 'px');
    katman.style.clipPath = 'inset(0 0 0 0)';
    document.documentElement.classList.remove('swarm-on');
    katman.classList.add('swarm-off');
    // Açılış animasyonlarını tetikle
    document.body.classList.add('anim');
    setTimeout(function () { if (katman && katman.parentNode) katman.parentNode.removeChild(katman); }, 700);
  }

  function hazir() {
    if (mobil && !window.matchMedia('(min-width: 760px)').matches) {
      // Mobilde kısa sahne: yalnız hızlı bir açılış perdesi
      document.documentElement.classList.add('swarm-on');
      var perde = document.createElement('div');
      perde.className = 'swarm swarm-mobile';
      perde.innerHTML = '<div class="swarm-hud swarm-hud-mobile"><span class="swarm-dot"></span>YENİDEN İNŞA</div><div class="swarm-front"></div>';
      document.body.appendChild(perde);
      perde.style.clipPath = 'inset(0 0 0 0)';
      requestAnimationFrame(function () { perde.style.clipPath = 'inset(100% 0 0 0)'; });
      setTimeout(function () { perde.classList.add('swarm-off'); document.documentElement.classList.remove('swarm-on'); document.body.classList.add('anim'); setTimeout(function () { perde.remove(); }, 600); }, 1500);
      return;
    }
    olustur();
    boyutla();
    basla();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(hazir, 260); });
  else setTimeout(hazir, 260);
})();
