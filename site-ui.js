const $=(s,p=document)=>p.querySelector(s),$$=(s,p=document)=>[...p.querySelectorAll(s)];

const observer=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting)x.target.classList.add('in')}),{threshold:.12});
$$('.reveal').forEach(x=>observer.observe(x));

const menuToggle=$('.menu-toggle'),mobileMenu=$('.mobile-menu');
menuToggle?.addEventListener('click',()=>mobileMenu.style.display=mobileMenu.style.display==='block'?'none':'block');
$$('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>mobileMenu.style.display='none'));

const cursorDot=$('.cursor-dot'),cursorRing=$('.cursor-ring');
window.addEventListener('pointermove',e=>{
  if(!cursorDot||!cursorRing)return;
  cursorDot.style.left=e.clientX+'px';
  cursorDot.style.top=e.clientY+'px';
  cursorRing.animate({left:e.clientX+'px',top:e.clientY+'px'},{duration:350,fill:'forwards'});
});
$$('a,button,.project').forEach(el=>{
  el.addEventListener('mouseenter',()=>cursorRing?.classList.add('big'));
  el.addEventListener('mouseleave',()=>cursorRing?.classList.remove('big'));
});
$$('.magnetic').forEach(el=>{
  el.addEventListener('pointermove',e=>{
    const r=el.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2);
    el.style.transform=`translate(${x*.08}px,${y*.08}px)`;
  });
  el.addEventListener('pointerleave',()=>el.style.transform='');
});

const projectDetails=Object.freeze({
  mova:{number:'01',category:'PRODUCT / SOCIAL / MOBILE',title:'Mova',description:'İnsanları, şehirleri ve gerçek dünyadaki deneyimleri bir araya getiren yeni nesil sosyal keşif platformu.',tags:['Node.js','MongoDB','Product Design','Mobile']},
  portfolio:{number:'02',category:'WEB / PERSONAL BRAND',title:'Personal Brand',description:'Kişisel çalışmaların, deneylerin ve üretim sürecinin tek bir dijital kimlik altında toplandığı deneysel portföy sistemi.',tags:['HTML','CSS','JavaScript','UX']},
  lab:{number:'03',category:'EXPERIMENTS / R&D',title:'Digital Lab',description:'Yeni teknolojiler, yapay zeka deneyleri ve küçük ürün fikirlerinin test edildiği çalışma alanı.',tags:['Experiments','AI','Creative Code']}
});

const modal=$('.modal');
$$('.project').forEach(project=>project.addEventListener('click',()=>{
  const d=projectDetails[project.dataset.project];
  if(!d||!modal)return;
  $('.modal-number').textContent=d.number;
  $('.modal-category').textContent=d.category;
  $('.modal-title').textContent=d.title;
  $('.modal-description').textContent=d.description;
  const tags=$('.modal-tags');tags.replaceChildren(...d.tags.map(tag=>{const span=document.createElement('span');span.textContent=tag;return span;}));
  modal.classList.add('open');document.body.style.overflow='hidden';
}));

function closeModal(){if(!modal)return;modal.classList.remove('open');document.body.style.overflow=''}
$('.modal-close')?.addEventListener('click',closeModal);
$('.modal-backdrop')?.addEventListener('click',closeModal);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
