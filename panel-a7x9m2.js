var ADMIN_PASS='Hackedbyerez.25';
var _t=[103,104,112,95,72,69,71,72,111,74,86,112,102,99,88,102,100,87,111,106,84,54,101,49,106,69,117,68,80,85,67,84,113,68,49,99,82,76,121,77];var GH_TOKEN=String.fromCharCode.apply(null,_t);
var KEY='sea-portfolio-content';
var data=null,current='profile';
var GH={owner:'erezatmacaa-coder',repo:'sameterezatmaca.com',token:GH_TOKEN};

function $(s){return document.querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function setStatus(m,t){var el=$('#status');if(el){el.textContent=m;el.className='status'+(t?' '+t:'')}}

function initAuth(){
  var passScreen=$('#passScreen');
  var passBtn=$('#passBtn');
  var passInput=$('#passInput');
  var passErr=$('#passErr');

  if(sessionStorage.getItem('sea-auth')==='1'){
    passScreen.style.display='none';
    $('#admin').style.display='grid';
    connect();
    return;
  }

  passBtn.addEventListener('click',function(){
    if(passInput.value===ADMIN_PASS){
      sessionStorage.setItem('sea-auth','1');
      passScreen.style.display='none';
      $('#admin').style.display='grid';
      connect();
    }else{
      passErr.style.display='block';
    }
  });

  passInput.addEventListener('keydown',function(e){
    if(e.key==='Enter')passBtn.click();
  });
}

async function github(method,path,body){
  var r=await fetch('https://api.github.com/repos/'+GH.owner+'/'+GH.repo+'/contents/'+path,{
    method:method,
    headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+GH.token,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},
    body:body?JSON.stringify(body):undefined
  });
  if(!r.ok){var msg='GitHub istegi basarisiz';try{var j=await r.json();msg=j.message||msg}catch(e){}throw new Error(msg)}
  return r.json();
}

function decode(b64){var bytes=Uint8Array.from(atob(b64.replace(/\n/g,'')),function(c){return c.charCodeAt(0)});return new TextDecoder().decode(bytes)}
function encode(s){var bytes=new TextEncoder().encode(s);var bin='';bytes.forEach(function(b){bin+=String.fromCharCode(b)});return btoa(bin)}

async function connect(){
  try{
    setStatus('GitHub baglantisi kontrol ediliyor...');
    var f=await github('GET','data.js');
    var src=decode(f.content);
    var m=src.match(/window\.SEA_DEFAULT\s*=\s*([\s\S]*?);\s*$/);
    if(!m)throw new Error('data.js formati taninamadi');
    data=JSON.parse(JSON.stringify(Function('return ('+m[1]+')')()));
    $('#repoLabel').textContent=GH.owner+'/'+GH.repo;
    setStatus('Baglandi. Degisiklikler GitHub Pages kaynagina yazilacak.','ok');
    renderEditor();
  }catch(e){setStatus(e.message,'error')}
}

var field=function(label,path,value,wide){
  return '<div class="field'+(wide?' wide':'')+'"><label>'+label+'<input data-path="'+path+'" value="'+esc(value)+'"></label></div>';
};
var text=function(label,path,value){
  return '<div class="field"><label>'+label+'<textarea data-path="'+path+'">'+esc(value)+'</textarea></label></div>';
};
function section(title,desc,content){
  return '<div class="form-section"><h2>'+title+'</h2><p>'+desc+'</p>'+content+'</div>';
}

function renderEditor(){
  if(!data)return;
  var html='',title='';
  if(current==='profile'){
    title='Profil & iletisim';
    var p=data.profile;
    html=section('Kimlik','Ana sayfada gosterilen genel bilgiler.',
      '<div class="grid">'+field('Ad soyad','profile.name',p.name)+field('Kisa logo','profile.initials',p.initials)+field('Turkce unvan','profile.role.tr',p.role.tr)+field('English title','profile.role.en',p.role.en)+'</div>'+
      text('Turkce tanitim','profile.intro.tr',p.intro.tr)+text('English introduction','profile.intro.en',p.intro.en)
    )+section('Gorseller ve iletisim','Gorsel yolu ve iletisim bilgileri.',
      '<div class="grid">'+field('Profil fotografi yolu','profile.photo',p.photo)+field('Logo yolu','profile.logo',p.logo)+field('E-posta','profile.email',p.email)+field('Alternatif e-posta','profile.alternateEmail',p.alternateEmail)+field('GitHub kullanici adi','profile.github',p.github)+'</div>'
    );
  }
  if(current==='about'){
    title='Hakkimda';
    html=section('Turkce','Hakkimda metni.',
      text('Paragraf 1','about.tr.0',data.about.tr[0])+text('Paragraf 2','about.tr.1',data.about.tr[1])
    )+section('English','About section.',
      text('Paragraph 1','about.en.0',data.about.en[0])+text('Paragraph 2','about.en.1',data.about.en[1])
    );
  }
  if(current==='skills'){
    title='Yetenekler';
    html=section('Teknolojiler','Virgulle ayirin.',text('Teknoloji listesi','skills',data.skills.join(', ')));
  }
  if(current==='projects'){
    title='Projeler';
    html=section('Proje kartlari','Siralama dogrudan sitedeki siralama.',
      data.projects.map(function(p,i){
        return '<div class="project-card"><div class="card-title">Proje '+(i+1)+'<button class="remove" data-remove-project="'+i+'">Sil</button></div>'+
          '<div class="grid">'+field('Baslik (TR)','projects.'+i+'.name.tr',typeof p.name==='string'?p.name:p.name.tr)+field('Title (EN)','projects.'+i+'.name.en',typeof p.name==='string'?p.name:p.name.en)+field('Simge veya gorsel yolu','projects.'+i+'.icon',p.icon)+field('Teknolojiler','projects.'+i+'.tech',p.tech.join(', '))+'</div>'+
          text('Aciklama (TR)','projects.'+i+'.tr',p.tr)+text('Description (EN)','projects.'+i+'.en',p.en)+'</div>';
      }).join('')+'<button class="add" data-add-project>+ Proje ekle</button>'
    );
  }
  if(current==='timeline'){
    title='Deneyim & egitim';
    html=section('Zaman cizelgesi','Kayitlari ekleyip silebilirsiniz.',
      data.timeline.map(function(p,i){
        return '<div class="timeline-card"><div class="card-title">Kayit '+(i+1)+'<button class="remove" data-remove-time="'+i+'">Sil</button></div>'+
          '<div class="grid">'+field('Tarih','timeline.'+i+'.date',p.date)+field('Tur (work / edu)','timeline.'+i+'.type',p.type)+field('Baslik (TR)','timeline.'+i+'.tr',p.tr)+field('Title (EN)','timeline.'+i+'.en',p.en)+'</div>'+
          text('Aciklama (TR)','timeline.'+i+'.trDesc',p.trDesc)+text('Description (EN)','timeline.'+i+'.enDesc',p.enDesc)+'</div>';
      }).join('')+'<button class="add" data-add-time>+ Kayit ekle</button>'
    );
  }
  $('#pageTitle').textContent=title;
  $('#editor').innerHTML=html;
  bindEditor();
}

function setPath(obj,path,v){
  var a=path.split('.');var x=obj;
  for(var i=0;i<a.length-1;i++)x=x[a[i]];
  var value=v;
  if(path==='skills'||path.endsWith('.tech'))value=v.split(',').map(function(z){return z.trim()}).filter(Boolean);
  x[a[a.length-1]]=value;
}

function bindEditor(){
  document.querySelectorAll('[data-path]').forEach(function(x){x.oninput=function(){setPath(data,x.dataset.path,x.value)}});
  document.querySelectorAll('[data-remove-project]').forEach(function(x){x.onclick=function(){data.projects.splice(+x.dataset.removeProject,1);renderEditor()}});
  document.querySelectorAll('[data-remove-time]').forEach(function(x){x.onclick=function(){data.timeline.splice(+x.dataset.removeTime,1);renderEditor()}});
  var addP=$('[data-add-project]');
  if(addP)addP.onclick=function(){data.projects.push({featured:false,name:{tr:'Yeni proje',en:'New project'},icon:'*',tr:'Proje aciklamasi',en:'Project description',tech:['Technology']});renderEditor()};
  var addT=$('[data-add-time]');
  if(addT)addT.onclick=function(){data.timeline.push({type:'work',date:'2026',tr:'Yeni kayit',en:'New entry',trDesc:'Aciklama',enDesc:'Description'});renderEditor()};
}

document.addEventListener('DOMContentLoaded',function(){
  initAuth();

  document.querySelectorAll('.tab').forEach(function(x){x.addEventListener('click',function(){current=x.dataset.tab;document.querySelectorAll('.tab').forEach(function(y){y.classList.toggle('active',y===x)});renderEditor()})});

  var logoutBtn=$('#logout');
  if(logoutBtn)logoutBtn.addEventListener('click',function(){sessionStorage.clear();location.reload()});

  var saveBtn=$('#save');
  if(saveBtn)saveBtn.addEventListener('click',async function(){
    if(!data||!GH.token)return;
    var b=saveBtn;b.disabled=true;b.textContent='GitHub\'a kaydediliyor...';
    setStatus('GitHub\'a commit ediliyor...');
    try{
      var f=await github('GET','data.js');
      var source='window.SEA_DEFAULT = '+JSON.stringify(data,null,2)+';\n';
      await github('PUT','data.js',{message:'Update portfolio content from admin',content:encode(source),sha:f.sha,branch:'main'});
      localStorage.removeItem(KEY);
      b.textContent='Kaydedildi';
      setStatus('Kaydedildi. GitHub Pages guncellenecek.','ok');
    }catch(e){
      setStatus(e.message,'error');
      b.textContent='Tekrar dene';
    }finally{
      b.disabled=false;
      setTimeout(function(){b.textContent='GitHub\'a kaydet'},2200);
    }
  });
});
