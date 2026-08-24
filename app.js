const fallback=window.SEA_DEFAULT||{};
function getData(){try{const raw=localStorage.getItem('sea-portfolio-content');if(!raw)return fallback;const saved=JSON.parse(raw);return{...fallback,...saved,profile:{...fallback.profile,...saved.profile},about:{...fallback.about,...saved.about},stats:Array.isArray(saved.stats)?saved.stats:fallback.stats,skills:Array.isArray(saved.skills)?saved.skills:fallback.skills,timeline:Array.isArray(saved.timeline)?saved.timeline:fallback.timeline,projects:Array.isArray(saved.projects)?saved.projects:fallback.projects}}catch{return fallback}}
const lang=()=>localStorage.getItem('sea-portfolio-lang')||'tr';
const t=(v,l)=>v&&typeof v==='object'?(v[l]??v.tr??v.en??''):v??'';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let markets=[['USD/TRY','--','--','up'],['EUR/TRY','--','--','up'],['XAU/USD','--','--','down'],['BTC/USDT','--','--','up']];
let prevMarkets={};

async function fetchMarkets(){
  try{const r=await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');const t=await r.json();const p=parseFloat(t.lastPrice);const c=parseFloat(t.priceChangePercent);prevMarkets.btc={price:markets[3][1],change:markets[3][2]};markets[3]=['BTC/USDT',p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),(c>=0?'+':'')+c.toFixed(2)+'%',c>=0?'up':'down']}catch(e){}
  try{const r=await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT');const t=await r.json();const p=parseFloat(t.lastPrice);const c=parseFloat(t.priceChangePercent);prevMarkets.gold={price:markets[2][1],change:markets[2][2]};markets[2]=['XAU/USD',p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),(c>=0?'+':'')+c.toFixed(2)+'%',c>=0?'up':'down']}catch(e){}
  try{const r=await fetch('https://api.exchangerate-api.com/v4/latest/USD');const j=await r.json();if(j&&j.rates){prevMarkets.usd={price:markets[0][1]};markets[0]=['USD/TRY',j.rates.TRY.toFixed(2),'+0.00%','up'];prevMarkets.eur={price:markets[1][1]};markets[1]=['EUR/TRY',(j.rates.TRY/j.rates.EUR).toFixed(2),'+0.00%','up']}}catch(e){}
  updateMarketUI();
}

function updateMarketUI(){
  var el=document.querySelector('.markets');
  if(!el)return;
  var head=el.querySelector('.market-head');
  if(!head)return;
  el.innerHTML='';
  el.appendChild(head);
  markets.forEach(function(m){
    var dir=m[3];
    var arrows=dir==='down'?'\u2198\u2197\u2198\u2198':'\u2197\u2197\u2198\u2197\u2197\u2197';
    el.innerHTML+='<div class="market"><div><small>'+m[0]+'</small><strong>'+m[1]+'</strong></div><span class="change '+dir+'">'+m[2]+'</span><div class="spark">'+arrows+'</div></div>';
  });
  el.innerHTML+='<a class="market-foot" href="#">T\u00dcM P\u0130YASALARI G\u00d6R&nbsp; \u2192</a>';
}

var sparkSvg=function(down){return'<svg viewBox="0 0 150 42" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,31 8,28 15,34 25,24 33,27 42,18 50,22 60,16 68,20 77,12 87,15 96,10 104,16 113,9 121,12 130,5 138,10 148,3" fill="none" class="'+(down?'red':'green')+'" stroke-width="1.7"/></svg>'};
var chartSvg=function(){return'<svg viewBox="0 0 650 230" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#a9ef38" stop-opacity=".18"/><stop offset="1" stop-color="#a9ef38" stop-opacity="0"/></linearGradient></defs><g class="grid">'+[40,80,120,160,200].map(function(y){return'<line x1="0" y1="'+y+'" x2="650" y2="'+y+'"/>'}).join('')+'</g><path class="area" d="M0 188 L30 165 L55 176 L80 120 L110 135 L140 92 L175 108 L205 88 L235 110 L265 82 L300 96 L330 70 L365 83 L400 61 L435 77 L470 52 L505 66 L540 48 L575 60 L610 42 L650 58 L650 230 L0 230 Z" fill="url(#fill)"/><path class="line" d="M0 188 L30 165 L55 176 L80 120 L110 135 L140 92 L175 108 L205 88 L235 110 L265 82 L300 96 L330 70 L365 83 L400 61 L435 77 L470 52 L505 66 L540 48 L575 60 L610 42 L650 58"/></svg>'};

function render(){
  var d=getData(),l=lang(),p=d.profile||fallback.profile;
  document.documentElement.lang=l;
  document.title=p.name+' \u2014 '+t(p.role,l);
  var about=(d.about&&d.about[l])||[];
  document.querySelector('#app').innerHTML='<div class="noise"></div><nav><a class="brand" href="#" id="brandLink">SEA</a><div class="nav-name">'+esc(p.name)+'</div><div class="navlinks"><a class="active" href="#top">Ana Sayfa</a><a href="#about">Hakk\u0131mda</a><a href="#projects">Projeler</a><a href="#skills">Yetenekler</a><a href="#journey">Deneyimler</a><a href="#contact">\u0130leti\u015Fim</a></div><button class="theme" aria-label="Tema">\u25D0</button></nav><main id="top"><section class="hero wrap reveal"><div class="hero-copy"><div class="eyebrow">YAZILIM GEL\u0130\u015ET\u0130R\u0130C\u0130</div><h1>Kod yaz\u0131yorum,<br>\u00e7\u00f6z\u00fcmler \u00fcretiyorum,<br><em>de\u011fer yarat\u0131yorum.</em></h1><p>Modern teknolojilerle dijital d\u00fcnyada<br>fark yaratan projeler geli\u015ftiriyorum.</p><div class="buttons"><a class="primary" href="#projects">PROJELER\u0130M\u0130 KE\u015eFET <b>\u2192</b></a><a class="secondary" href="#about">HAKKIMDA</a></div></div><div class="markets"><div class="market-head"><b>P\u0130YASALAR</b><span><i></i> CANLI</span></div></div></section><section class="stats wrap reveal">'+(d.stats||[]).map(function(x){return'<div><strong>'+esc(x.n)+'</strong><span>'+esc(t(x,l))+'</span></div>'}).join('')+'</section><section class="work wrap reveal"><div class="work-intro"><span class="kicker">NELER YAPIYORUM?</span><h2>Fikirleri ger\u00e7e\u011fe<br>d\u00f6n\u00fc\u015ft\u00fcr\u00fcyorum.</h2><i class="shortline"></i><p>Web, mobil ve backend teknolojileri kullanarak \u00f6l\u00e7eklenebilir, kullan\u0131c\u0131 odakl\u0131 \u00e7\u00f6z\u00fcmler geli\u015ftiriyorum.</p><div class="signature">'+esc(p.name)+'</div><div class="mini-stats"><b>2+<small>Y\u0131l Profesyonel Deneyim</small></b><b>20+<small>Tamamlanan Proje</small></b><b>10+<small>Mutlu M\u00fc\u015fteri</small></b><b>\u221e<small>\u00d6\u011frenmeye Devam</small></b></div><a class="cv" href="#contact">\u00d6ZGE\u00c7M\u015e\u0130 \u0130ND\u0130R <span>\u2193</span></a></div><div class="project-area"><div id="projects" class="projects">'+(d.projects||[]).slice(0,3).map(function(x,i){return'<article class="project '+(x.featured?'featured':'')+'"><div class="project-img '+(i===0?'code':'wave')+'">'+(i===0?'\u2301':i===1?'\u25D2':'\u300A')+'</div><div class="project-no">0'+(i+1)+'</div><h3>'+esc(t(x.name,l))+'</h3><p>'+esc(t({tr:x.tr,en:x.en},l))+'</p><div class="tags">'+(x.tech||[]).slice(0,4).map(function(z){return'<span>'+esc(z)+'</span>'}).join('')+'</div><a href="#contact">PROJEY\u0130 \u0130NCELE&nbsp; \u2192</a></article>'}).join('')+'</div><div id="skills" class="tech-strip">'+(d.skills||[]).slice(0,8).map(function(x){return'<span>'+esc(x)+'</span>'}).join('')+'</div></div></section><section id="market" class="bottom-grid wrap reveal"><div class="market-chart"><div class="panel-title"><span>P\u0130YASA TAK\u0130P PANEL\u0130</span><b>'+markets[0][1]+'</b></div><div class="chart-wrap">'+chartSvg()+'<div class="axis"><span>42.50</span><span>42.00</span><span>41.50</span><span>41.00</span><span>40.50</span><span>40.00</span></div></div><div class="periods"><b>1G</b><span>1H</span><span>1A</span><span>3A</span><span>1Y</span><span>T\u00dcM\u00dc</span></div></div><div id="about" class="about-card"><div><span class="kicker">HAKKIMDA</span>'+about.slice(0,2).map(function(x){return'<p>'+esc(x)+'</p>'}).join('')+'<div class="pills"><span>Problem \u00c7\u00f6zme</span><span>Yenilik\u00e7i</span><span>Disiplinli</span><span>\u00d6\u011frenmeye A\u00e7\u0131k</span></div><a href="#about">DAHA FAZLA&nbsp; \u2192</a></div><img src="'+esc(p.photo||'photo.jpg')+'" alt="'+esc(p.name)+'"></div></section><section id="journey" class="sr-only"></section><section id="contact" class="contact"><div class="footer-grid wrap"><div><span class="dot"></span>\u015eU AN<br><small>\u00c7al\u0131\u015f\u0131yorum...</small></div><div class="code-footer"><b>const</b> hedef = "Daha iyi bir yar\u0131n";<br><b>while</b>(\u00fcretiyorum) {<br>&nbsp;&nbsp;&nbsp;&nbsp;fark_yarat();<br>}</div><div>\u2316 &nbsp; KONUM<br><small>\u0130stanbul, T\u00fcrkiye</small></div><div>\u2709 &nbsp; E-POSTA<br><small>'+esc(p.email)+'</small></div><div>SOSYAL<br><small>\u25c9 &nbsp;&nbsp; in &nbsp;&nbsp; \u25ce</small></div></div></section></main><footer>\u00a9 '+new Date().getFullYear()+' '+esc(p.name)+'. T\u00fcm haklar\u0131 sakl\u0131d\u0131r.</footer>';
  document.querySelector('.theme').onclick=function(){document.body.classList.toggle('light')};
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('is-visible')})},{threshold:.1});
  document.querySelectorAll('.reveal').forEach(function(e){io.observe(e)});
}

document.addEventListener('click',function(e){
  var brand=e.target.closest('.brand');
  if(brand){
    e.preventDefault();
    var now=Date.now();
    if(!window._brandClicks)window._brandClicks=0;
    if(!window._brandTimer)window._brandTimer=0;
    if(now-window._brandTimer>1200)window._brandClicks=0;
    window._brandClicks++;
    window._brandTimer=now;
    if(window._brandClicks>=3){window._brandClicks=0;window.location.href='panel-a7x9m2.html'}
    return;
  }
  var navLink=e.target.closest('.navlinks a');
  if(navLink){
    var href=navLink.getAttribute('href');
    if(href&&href.charAt(0)==='#'){
      e.preventDefault();
      var target=document.getElementById(href.substring(1));
      if(target)target.scrollIntoView({behavior:'smooth'});
      history.replaceState(null,'',location.pathname);
    }
    return;
  }
  var hashLink=e.target.closest('a[href^="#"]');
  if(hashLink){
    var h=hashLink.getAttribute('href');
    if(h&&h.length>1&&h.charAt(0)==='#'){
      e.preventDefault();
      var tgt=document.getElementById(h.substring(1));
      if(tgt)tgt.scrollIntoView({behavior:'smooth'});
      history.replaceState(null,'',location.pathname);
    }
  }
});

render();
fetchMarkets();
setInterval(fetchMarkets,60000);
