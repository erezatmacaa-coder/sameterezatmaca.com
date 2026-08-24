const fallback=window.SEA_DEFAULT||{};
function getData(){try{const raw=localStorage.getItem('sea-portfolio-content');if(!raw)return fallback;const saved=JSON.parse(raw);return{...fallback,...saved,profile:{...fallback.profile,...saved.profile},about:{...fallback.about,...saved.about},stats:Array.isArray(saved.stats)?saved.stats:fallback.stats,skills:Array.isArray(saved.skills)?saved.skills:fallback.skills,timeline:Array.isArray(saved.timeline)?saved.timeline:fallback.timeline,projects:Array.isArray(saved.projects)?saved.projects:fallback.projects}}catch{return fallback}}
const lang=()=>localStorage.getItem('sea-portfolio-lang')||'tr';
const t=(v,l)=>v&&typeof v==='object'?(v[l]??v.tr??v.en??''):v??'';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let markets=[['USD/TRY','--','--','up',[]],['EUR/TRY','--','--','up',[]],['XAU/USD','--','--','down',[]],['BTC/USDT','--','--','up',[]]];
let chartHistory=[];

function sparkLine(points,color){
  if(!points||points.length<2)return '<svg viewBox="0 0 120 34" preserveAspectRatio="none" style="width:100%;height:34px"><line x1="0" y1="17" x2="120" y2="17" stroke="#333" stroke-width="1" stroke-dasharray="4"/></svg>';
  var min=Math.min.apply(null,points),max=Math.max.apply(null,points);
  var range=max-min||1;
  var w=120,h=34;
  var pts=points.map(function(v,i){
    var x=(i/(points.length-1))*w;
    var y=h-((v-min)/range)*(h-4)-2;
    return x+','+y;
  }).join(' ');
  return '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" style="width:100%;height:'+h+'px"><polyline points="'+pts+'" fill="none" stroke="'+color+'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function chartSvg(data){
  if(!data||data.length<2)return '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#555;font:12px DM Mono">Canli veri bekleniyor...</div>';
  var min=Math.min.apply(null,data),max=Math.max.apply(null,data);
  var range=max-min||0.1;
  var w=620,h=190,p=15;
  var pts=data.map(function(v,i){
    var x=(i/(data.length-1))*w;
    var y=p+(1-(v-min)/range)*(h-2*p);
    return {x:x,y:y};
  });
  var linePath='M'+pts.map(function(pt){return pt.x+' '+pt.y}).join(' L');
  var areaPath=linePath+' L'+w+' '+h+' L0 '+h+' Z';
  var grid='';
  for(var i=0;i<5;i++){
    var yy=p+(i/4)*(h-2*p);
    var val=(max-range*(i/4)).toFixed(2);
    grid+='<line x1="0" y1="'+yy+'" x2="'+w+'" y2="'+yy+'" stroke="#1c2021" stroke-width="1" stroke-dasharray="4,4"/>';
    grid+='<text x="-8" y="'+(yy+3)+'" fill="#666" font-size="9" font-family="DM Mono" text-anchor="end">'+val+'</text>';
  }
  var circles=pts.map(function(pt,idx){
    var opacity=0.3+(idx/pts.length)*0.7;
    var r=idx===pts.length-1?4:2;
    return '<circle cx="'+pt.x+'" cy="'+pt.y+'" r="'+r+'" fill="#a9ef38" opacity="'+opacity+'"/>';
  }).join('');
  var lastPt=pts[pts.length-1];
  var glow='<circle cx="'+lastPt.x+'" cy="'+lastPt.y+'" r="8" fill="#a9ef38" opacity="0.15"><animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.15;0.05;0.15" dur="2s" repeatCount="indefinite"/></circle>';
  var label='<text x="'+lastPt.x+'" y="'+(lastPt.y-12)+'" fill="#c9ed39" font-size="12" font-weight="bold" font-family="DM Mono" text-anchor="end">'+data[data.length-1].toFixed(2)+'</text>';
  return '<svg viewBox="-50 -10 '+(w+60)+' '+(h+35)+'" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#a9ef38" stop-opacity=".2"/><stop offset="1" stop-color="#a9ef38" stop-opacity="0"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'+grid+'<path d="'+areaPath+'" fill="url(#chartFill)"/><path d="'+linePath+'" fill="none" stroke="#a9ef38" stroke-width="2" stroke-linejoin="round" filter="url(#glow)"/>'+circles+glow+label+'</svg>';
}

async function fetchMarkets(){
  try{var r=await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');var t=await r.json();var p=parseFloat(t.lastPrice);var c=parseFloat(t.priceChangePercent);markets[3][4].push(p);if(markets[3][4].length>30)markets[3][4].shift();markets[3]=['BTC/USDT',p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),(c>=0?'+':'')+c.toFixed(2)+'%',c>=0?'up':'down',markets[3][4]]}catch(e){}
  try{var r2=await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT');var t2=await r2.json();var p2=parseFloat(t2.lastPrice);var c2=parseFloat(t2.priceChangePercent);markets[2][4].push(p2);if(markets[2][4].length>30)markets[2][4].shift();markets[2]=['XAU/USD',p2.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),(c2>=0?'+':'')+c2.toFixed(2)+'%',c2>=0?'up':'down',markets[2][4]]}catch(e){}
  try{var r3=await fetch('https://api.exchangerate-api.com/v4/latest/USD');var j=await r3.json();if(j&&j.rates){
    var usdTRY=j.rates.TRY;var eurTRY=j.rates.TRY/j.rates.EUR;
    chartHistory.push(usdTRY);if(chartHistory.length>30)chartHistory.shift();
    markets[0]=['USD/TRY',usdTRY.toFixed(2),'+0.00%','up',markets[0][4]];
    markets[1]=['EUR/TRY',eurTRY.toFixed(2),'+0.00%','up',markets[1][4]];
  }}catch(e){}
  updateMarketUI();
  updateChart();
}

function updateMarketUI(){
  var el=document.querySelector('.markets');
  if(!el)return;
  var head=el.querySelector('.market-head');
  if(!head)return;
  var html=head.outerHTML;
  var colors=['#a9ef38','#a9ef38','#e34b4b','#a9ef38'];
  markets.forEach(function(m,i){
    var dir=m[3];
    var sparkSvg=sparkLine(m[4],colors[i]);
    html+='<div class="market"><div><small>'+m[0]+'</small><strong>'+m[1]+'</strong></div><span class="change '+dir+'">'+m[2]+'</span><div class="spark">'+sparkSvg+'</div></div>';
  });
  html+='<a class="market-foot" href="#market">T\u00dcM P\u0130YASALARI G\u00d6R&nbsp; \u2192</a>';
  el.innerHTML=html;
}

function updateChart(){
  var chartEl=document.querySelector('.chart-wrap');
  if(!chartEl)return;
  var panelTitle=document.querySelector('.panel-title b');
  if(panelTitle&&markets[0][1]!=='--')panelTitle.textContent=markets[0][1];
  chartEl.innerHTML=chartSvg(chartHistory);
}

function render(){
  var d=getData(),l=lang(),p=d.profile||fallback.profile;
  document.documentElement.lang=l;
  document.title=p.name+' \u2014 '+t(p.role,l);
  var about=(d.about&&d.about[l])||[];
  document.querySelector('#app').innerHTML='<div class="noise"></div><nav><a class="brand" href="#" id="brandLink">SEA</a><div class="nav-name">'+esc(p.name)+'</div><div class="navlinks"><a class="active" href="#top">Ana Sayfa</a><a href="#about">Hakk\u0131mda</a><a href="#projects">Projeler</a><a href="#skills">Yetenekler</a><a href="#journey">Deneyimler</a><a href="#contact">\u0130leti\u015Fim</a></div><button class="theme" aria-label="Tema">\u25D0</button></nav><main id="top"><section class="hero wrap reveal"><div class="hero-copy"><div class="eyebrow">YAZILIM GEL\u0130\u015ET\u0130R\u0130C\u0130</div><h1>Kod yaz\u0131yorum,<br>\u00e7\u00f6z\u00fcmler \u00fcretiyorum,<br><em>de\u011fer yarat\u0131yorum.</em></h1><p>Modern teknolojilerle dijital d\u00fcnyada<br>fark yaratan projeler geli\u015ftiriyorum.</p><div class="buttons"><a class="primary" href="#projects">PROJELER\u0130M\u0130 KE\u015eFET <b>\u2192</b></a></div></div><div class="markets"><div class="market-head"><b>P\u0130YASALAR</b><span><i></i> CANLI</span></div></div></section><section class="stats wrap reveal">'+(d.stats||[]).map(function(x){return'<div><strong>'+esc(x.n)+'</strong><span>'+esc(t(x,l))+'</span></div>'}).join('')+'</section><section class="work wrap reveal"><div class="work-intro"><span class="kicker">NELER YAPIYORUM?</span><h2>Fikirleri ger\u00e7e\u011fe<br>d\u00f6n\u00fc\u015ft\u00fcr\u00fcyorum.</h2><i class="shortline"></i><p>Web, mobil ve backend teknolojileri kullanarak \u00f6l\u00e7eklenebilir, kullan\u0131c\u0131 odakl\u0131 \u00e7\u00f6z\u00fcmler geli\u015ftiriyorum.</p><div class="signature">'+esc(p.name)+'</div><div class="mini-stats"><b>2+<small>Y\u0131l Profesyonel Deneyim</small></b><b>20+<small>Tamamlanan Proje</small></b><b>10+<small>Mutlu M\u00fc\u015fteri</small></b><b>\u221e<small>\u00d6\u011frenmeye Devam</small></b></div></div></div><div class="project-area"><div id="projects" class="projects">'+(d.projects||[]).slice(0,3).map(function(x,i){
  return '<article class="project '+(x.featured?'featured':'')+'" data-idx="'+i+'"><div class="project-img '+(i===0?'code':i===1?'wave':'purple')+'">'+(i===0?'\u2301':i===1?'\u25D2':'\u300A')+'</div><div class="project-no">0'+(i+1)+'</div><button class="project-add" aria-label="Incele">\u271A</button><h3>'+esc(t(x.name,l))+'</h3><p>'+esc(t({tr:x.tr,en:x.en},l))+'</p><div class="tags">'+(x.tech||[]).slice(0,4).map(function(z){return'<span>'+esc(z)+'</span>'}).join('')+'</div><a href="'+(i===0?'locamo.html':'#contact')+'" class="project-link">'+(i===0?'PROJEY\u0130 \u0130NCELE&nbsp; \u2192':'PROJEY\u0130 \u0130NCELE&nbsp; \u2192')+'</a></article>';
  }).join('')+'</div><div id="skills" class="tech-strip">'+(d.skills||[]).slice(0,8).map(function(x){return'<span>'+esc(x)+'</span>'}).join('')+'</div></div></section><section id="market" class="bottom-grid wrap reveal"><div class="market-chart"><div class="panel-title"><span>P\u0130YASA TAK\u0130P PANEL\u0130</span><b>'+(markets[0][1]!=='--'?markets[0][1]:'---')+'</b></div><div class="chart-wrap"></div><div class="periods"><b>1G</b><span>1H</span><span>1A</span><span>3A</span><span>1Y</span><span>T\u00dcM\u00dc</span></div></div><div id="about" class="about-card"><div><span class="kicker">HAKKIMDA</span>'+about.slice(0,2).map(function(x){return'<p>'+esc(x)+'</p>'}).join('')+'<div class="pills"><span>Problem \u00c7\u00f6zme</span><span>Yenilik\u00e7i</span><span>Disiplinli</span><span>\u00d6\u011frenmeye A\u00e7\u0131k</span></div><a href="#about">DAHA FAZLA&nbsp; \u2192</a></div><div class="about-photo"><img src="'+esc(p.photo||'photo.jpg')+'" alt="'+esc(p.name)+'"><div class="about-meta"><span>\u260E Istanbul, T\u00fcrkiye</span></div></div></div></section><section id="journey" class="sr-only"></section><section id="contact" class="contact"><div class="footer-grid wrap"><div><span class="dot"></span>\u015eU AN<br><small>\u00c7al\u0131\u015f\u0131yorum...</small></div><div class="code-footer"><b>const</b> hedef = "Daha iyi bir yar\u0131n";<br><b>while</b>(\u00fcretiyorum) {<br>&nbsp;&nbsp;&nbsp;&nbsp;fark_yarat();<br>}</div><div>\u2316 &nbsp; KONUM<br><small>\u0130stanbul, T\u00fcrkiye</small></div><div>\u2709 &nbsp; E-POSTA<br><small>erez.atmaca@hotmail.com</small><small>erez.atmacaa@gmail.com</small></div><div>SOSYAL<br><small style="display:flex;gap:12px;margin-top:8px"><a href="https://github.com/'+esc(p.github)+'" target="_blank" style="color:var(--lime)"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg></a><a href="#" target="_blank" style="color:var(--lime)"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a><a href="#" target="_blank" style="color:var(--lime)"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a></small></div></div></section></main><footer>\u00a9 '+new Date().getFullYear()+' '+esc(p.name)+'. T\u00fcm haklar\u0131 sakl\u0131d\u0131r.</footer>';
  
  var themeBtn=document.querySelector('.theme');
  if(localStorage.getItem('sea-theme')==='light')document.body.classList.add('light');
  if(themeBtn)themeBtn.onclick=function(){
    document.body.classList.toggle('light');
    localStorage.setItem('sea-theme',document.body.classList.contains('light')?'light':'dark');
  };
  
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('is-visible')})},{threshold:.1});
  document.querySelectorAll('.reveal').forEach(function(e){io.observe(e)});
  
  updateChart();
}

document.addEventListener('click',function(e){
  var projectLink=e.target.closest('.project-link');
  if(projectLink){
    var card=projectLink.closest('.project');
    if(card){
      e.preventDefault();
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(function(){card.classList.remove('shake')},600);
      var href=projectLink.getAttribute('href');
      if(href&&href!=='#contact'){setTimeout(function(){window.location.href=href},400)}
    }
    return;
  }
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
