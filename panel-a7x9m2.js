let data=null,current='profile',accessToken=null,deviceTimer=null;

const CONFIG=window.SEA_ADMIN_CONFIG||{};
const API='https://api.github.com';
const DEVICE_URL='https://github.com/login/device/code';
const TOKEN_URL='https://github.com/login/oauth/access_token';

function $(s){return document.querySelector(s)}
function setStatus(m,t){const el=$('#status');if(el){el.textContent=m||'';el.className='status'+(t?' '+t:'')}}
function setLoginError(m){const el=$('#loginError');if(!el)return;el.textContent=m;el.hidden=!m}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function requireConfig(){
  if(CONFIG.githubOAuthClientId)return true;
  $('#loginBtn').disabled=true;
  setLoginError('GitHub OAuth Client ID henüz ayarlanmadı. admin-config.js içindeki githubOAuthClientId alanına OAuth App Client ID eklenmeli.');
  return false;
}

async function formPost(url,params){
  const r=await fetch(url,{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:new URLSearchParams(params)});
  let j=null;try{j=await r.json()}catch{}
  if(!r.ok)throw new Error((j&&j.error_description)||'GitHub isteği başarısız.');
  return j;
}

async function startDeviceFlow(){
  if(!requireConfig())return;
  const btn=$('#loginBtn');btn.disabled=true;setLoginError('');
  try{
    const j=await formPost(DEVICE_URL,{client_id:CONFIG.githubOAuthClientId,scope:CONFIG.scope||'public_repo'});
    $('#deviceBox').hidden=false;
    $('#userCode').textContent=j.user_code||'—';
    $('#verifyLink').href=j.verification_uri||'https://github.com/login/device';
    $('#pollStatus').textContent='GitHub onayı bekleniyor…';
    const interval=Math.max(Number(j.interval)||5,5)*1000;
    const expires=Date.now()+((Number(j.expires_in)||900)*1000);
    clearTimeout(deviceTimer);
    const poll=async()=>{
      if(Date.now()>expires){throw new Error('Yetkilendirme kodunun süresi doldu. Yeniden başlat.')}
      const token=await formPost(TOKEN_URL,{client_id:CONFIG.githubOAuthClientId,device_code:j.device_code,grant_type:'urn:ietf:params:oauth:grant-type:device_code'});
      if(token.access_token){
        accessToken=token.access_token;
        $('#pollStatus').textContent='Yetki alındı, hesap doğrulanıyor…';
        await verifyIdentity();
        return;
      }
      if(token.error==='authorization_pending'){deviceTimer=setTimeout(poll,interval);return}
      if(token.error==='slow_down'){deviceTimer=setTimeout(poll,interval+5000);return}
      throw new Error(token.error_description||'GitHub yetkilendirmesi tamamlanamadı.');
    };
    await poll();
  }catch(e){
    accessToken=null;
    $('#deviceBox').hidden=true;
    setLoginError(e.message||'Giriş başarısız.');
  }finally{btn.disabled=false}
}

async function github(path,options={}){
  if(!accessToken)throw new Error('Oturum bulunamadı.');
  const headers=new Headers(options.headers||{});
  headers.set('Accept','application/vnd.github+json');
  headers.set('X-GitHub-Api-Version','2026-03-10');
  headers.set('Authorization','Bearer '+accessToken);
  if(options.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  const r=await fetch(API+path,{...options,headers});
  let j=null;try{j=await r.json()}catch{}
  if(r.status===401){accessToken=null;throw new Error('GitHub oturumu sona erdi. Yeniden giriş yap.')}
  if(!r.ok)throw new Error((j&&j.message)||('GitHub isteği başarısız ('+r.status+').'));
  return j;
}

async function verifyIdentity(){
  const user=await github('/user');
  const login=String(user.login||'');
  if(login.toLowerCase()!==String(CONFIG.allowedGitHubLogin||'').toLowerCase()){
    accessToken=null;throw new Error('Bu GitHub hesabının yönetim yetkisi yok.');
  }
  const repo=await github('/repos/'+encodeURIComponent(CONFIG.owner)+'/'+encodeURIComponent(CONFIG.repo));
  const perms=repo.permissions||{};
  if(!(perms.admin||perms.push||perms.maintain)){
    accessToken=null;throw new Error('GitHub hesabının bu depoda yazma yetkisi yok.');
  }
  $('#loginScreen').hidden=true;
  $('#admin').hidden=false;
  $('#repoLabel').textContent=CONFIG.owner+'/'+CONFIG.repo;
  $('#userLabel').textContent='@'+login;
  $('#deviceBox').hidden=true;
  setStatus('GitHub hesabı doğrulandı. Değişiklikler doğrudan data.js dosyasına kaydedilir.','ok');
  await connect();
}

function decode(b64){
  const bytes=Uint8Array.from(atob(String(b64).replace(/\n/g,'')),c=>c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function encode(s){
  const bytes=new TextEncoder().encode(s);let bin='';
  bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin);
}

async function connect(){
  try{
    setStatus('GitHub verisi okunuyor…');
    const f=await github('/repos/'+CONFIG.owner+'/'+CONFIG.repo+'/contents/data.js?ref='+encodeURIComponent(CONFIG.branch||'main'));
    const src=decode(f.content);
    const m=src.match(/window\.SEA_DEFAULT\s*=\s*([\s\S]*?)\s*;?\s*$/);
    if(!m)throw new Error('data.js formatı tanınamadı.');
    data=JSON.parse(m[1]);
    renderEditor();
    setStatus('Bağlandı.','ok');
  }catch(e){setStatus(e.message,'error')}
}

const field=(label,path,value)=>'<div class="field"><label>'+label+'<input data-path="'+path+'" value="'+esc(value)+'"></label></div>';
const text=(label,path,value)=>'<div class="field"><label>'+label+'<textarea data-path="'+path+'">'+esc(value)+'</textarea></label></div>';
function section(title,desc,content){return '<div class="form-section"><h2>'+title+'</h2><p>'+desc+'</p>'+content+'</div>'}

function renderEditor(){
  if(!data)return;
  let html='',title='';
  if(current==='profile'){
    title='Profil & iletişim';const p=data.profile;
    html=section('Kimlik','Ana sayfada gösterilen bilgiler.','<div class="grid">'+field('Ad soyad','profile.name',p.name)+field('Kısa logo','profile.initials',p.initials)+field('Türkçe unvan','profile.role.tr',p.role.tr)+field('English title','profile.role.en',p.role.en)+'</div>'+text('Türkçe tanıtım','profile.intro.tr',p.intro.tr)+text('English introduction','profile.intro.en',p.intro.en));
    html+=section('Görseller ve iletişim','Yollar ve iletişim bilgileri.','<div class="grid">'+field('Profil fotoğrafı yolu','profile.photo',p.photo)+field('Logo yolu','profile.logo',p.logo)+field('E-posta','profile.email',p.email)+field('Alternatif e-posta','profile.alternateEmail',p.alternateEmail)+field('GitHub kullanıcı adı','profile.github',p.github)+'</div>');
  }
  if(current==='about'){
    title='Hakkımda';html=section('Türkçe','Hakkımda metinleri.',text('Paragraf 1','about.tr.0',data.about.tr[0])+text('Paragraf 2','about.tr.1',data.about.tr[1]));
    html+=section('English','About section.',text('Paragraph 1','about.en.0',data.about.en[0])+text('Paragraph 2','about.en.1',data.about.en[1]));
  }
  if(current==='skills'){
    title='Yetenekler';html=section('Teknolojiler','Virgülle ayırın.',text('Teknoloji listesi','skills',data.skills.join(', ')));
  }
  if(current==='projects'){
    title='Projeler';html=section('Proje kartları','Değişiklikler yayınlanan data.js içine yazılır.',data.projects.map((p,i)=>'<div class="project-card"><div class="card-title">Proje '+(i+1)+'<button class="remove" data-remove-project="'+i+'">Sil</button></div><div class="grid">'+field('Başlık (TR)','projects.'+i+'.name.tr',typeof p.name==='string'?p.name:p.name.tr)+field('Title (EN)','projects.'+i+'.name.en',typeof p.name==='string'?p.name:p.name.en)+field('Simge veya görsel yolu','projects.'+i+'.icon',p.icon)+field('Teknolojiler','projects.'+i+'.tech',p.tech.join(', '))+'</div>'+text('Açıklama (TR)','projects.'+i+'.tr',p.tr)+text('Description (EN)','projects.'+i+'.en',p.en)+'</div>').join('')+'<button class="add" data-add-project>+ Proje ekle</button>');
  }
  if(current==='timeline'){
    title='Deneyim & eğitim';html=section('Zaman çizelgesi','Kayıtları ekleyip silebilirsiniz.',data.timeline.map((p,i)=>'<div class="timeline-card"><div class="card-title">Kayıt '+(i+1)+'<button class="remove" data-remove-time="'+i+'">Sil</button></div><div class="grid">'+field('Tarih','timeline.'+i+'.date',p.date)+field('Tür','timeline.'+i+'.type',p.type)+field('Başlık (TR)','timeline.'+i+'.tr',p.tr)+field('Title (EN)','timeline.'+i+'.en',p.en)+'</div>'+text('Açıklama (TR)','timeline.'+i+'.trDesc',p.trDesc)+text('Description (EN)','timeline.'+i+'.enDesc',p.enDesc)+'</div>').join('')+'<button class="add" data-add-time>+ Kayıt ekle</button>');
  }
  $('#pageTitle').textContent=title;$('#editor').innerHTML=html;bindEditor();
}

function setPath(obj,path,v){
  const a=path.split('.');let x=obj;for(let i=0;i<a.length-1;i++){if(x[a[i]]==null)x[a[i]]={};x=x[a[i]]}
  if(path==='skills'||path.endsWith('.tech'))v=v.split(',').map(z=>z.trim()).filter(Boolean);
  x[a[a.length-1]]=v;
}
function bindEditor(){
  document.querySelectorAll('[data-path]').forEach(x=>x.oninput=()=>setPath(data,x.dataset.path,x.value));
  document.querySelectorAll('[data-remove-project]').forEach(x=>x.onclick=()=>{data.projects.splice(+x.dataset.removeProject,1);renderEditor()});
  document.querySelectorAll('[data-remove-time]').forEach(x=>x.onclick=()=>{data.timeline.splice(+x.dataset.removeTime,1);renderEditor()});
  const addP=$('[data-add-project]');if(addP)addP.onclick=()=>{data.projects.push({featured:false,name:{tr:'Yeni proje',en:'New project'},icon:'*',tr:'Proje açıklaması',en:'Project description',tech:['Technology']});renderEditor()};
  const addT=$('[data-add-time]');if(addT)addT.onclick=()=>{data.timeline.push({type:'work',date:'2026',tr:'Yeni kayıt',en:'New entry',trDesc:'Açıklama',enDesc:'Description'});renderEditor()};
}

async function save(){
  if(!data||!accessToken)return;
  const btn=$('#save');btn.disabled=true;setStatus('GitHub’a kaydediliyor…');
  try{
    const path='/repos/'+CONFIG.owner+'/'+CONFIG.repo+'/contents/data.js?ref='+encodeURIComponent(CONFIG.branch||'main');
    const f=await github(path);
    const source='window.SEA_DEFAULT = '+JSON.stringify(data,null,2)+';\n';
    await github('/repos/'+CONFIG.owner+'/'+CONFIG.repo+'/contents/data.js',{method:'PUT',body:JSON.stringify({message:'Update portfolio content from secure admin',content:encode(source),sha:f.sha,branch:CONFIG.branch||'main'})});
    btn.textContent='Kaydedildi';
    setStatus('Kaydedildi. GitHub Pages dağıtımı başlatıldı.','ok');
  }catch(e){setStatus(e.message,'error');btn.textContent='Tekrar dene'}
  finally{btn.disabled=false;setTimeout(()=>btn.textContent='GitHub’a kaydet',2200)}
}

function logout(){accessToken=null;data=null;clearTimeout(deviceTimer);location.reload()}

document.addEventListener('DOMContentLoaded',()=>{
  $('#loginBtn').addEventListener('click',startDeviceFlow);
  $('#logout').addEventListener('click',logout);
  $('#save').addEventListener('click',save);
  document.querySelectorAll('.tab').forEach(x=>x.addEventListener('click',()=>{current=x.dataset.tab;document.querySelectorAll('.tab').forEach(y=>y.classList.toggle('active',y===x));renderEditor()}));
  requireConfig();
});
