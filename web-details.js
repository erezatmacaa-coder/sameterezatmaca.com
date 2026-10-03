(() => {
  const modal=document.getElementById('webDetailsModal');
  const open=document.getElementById('webDetailsOpen');
  if(!modal||!open)return;
  const close=()=>{
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  };
  open.addEventListener('click',()=>{
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  });
  modal.querySelectorAll('[data-close-details]').forEach(el=>el.addEventListener('click',close));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&modal.classList.contains('open'))close();
  });
})();