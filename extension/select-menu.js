// Keep the existing select as the data model, render a consistent keyboard-friendly menu.
export function enhanceSelects(root=document){
 const closeAll=()=>document.querySelectorAll('.select-trigger[aria-expanded="true"]').forEach(b=>b.click());
 for(const select of root.querySelectorAll('select')){
  if(select.dataset.enhanced)continue;select.dataset.enhanced='true';
  const button=document.createElement('button');button.type='button';button.className='select-trigger';button.id=select.id+'-trigger';
  const label=document.createElement('span'),arrow=document.createElement('span');arrow.className='select-chevron';arrow.textContent='⌄';arrow.setAttribute('aria-hidden','true');button.append(label,arrow);
  button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',select.getAttribute('aria-label')||document.querySelector('label[for="'+select.id+'"]').textContent);
  const menu=document.createElement('div');menu.className='select-options';menu.id=select.id+'-options';menu.role='listbox';menu.hidden=true;menu.setAttribute('aria-label',button.getAttribute('aria-label'));button.setAttribute('aria-controls',menu.id);
  select.hidden=true;select.before(button);document.body.append(menu);
  let active=0;
  const items=()=>Array.from(menu.querySelectorAll('[role="option"]'));
  const close=()=>{menu.hidden=true;button.setAttribute('aria-expanded','false');};
  const position=()=>{const r=button.getBoundingClientRect(),width=Math.min(Math.max(r.width,230),innerWidth-24);menu.style.width=width+'px';menu.style.left=Math.max(12,Math.min(r.left,innerWidth-width-12))+'px';const height=Math.min(menu.scrollHeight,300),below=innerHeight-r.bottom-12;menu.style.top=(below>=height?r.bottom+6:Math.max(12,r.top-height-6))+'px';};
  const sync=()=>{
   label.textContent=select.selectedOptions[0]?.textContent||'Choose';button.disabled=select.disabled;
   menu.replaceChildren();Array.from(select.options).forEach((option,index)=>{const item=document.createElement('button');item.type='button';item.role='option';item.tabIndex=-1;item.disabled=option.disabled;item.setAttribute('aria-selected',String(option.selected));const text=document.createElement('span');text.textContent=option.textContent;const check=document.createElement('span');check.className='select-check';check.textContent=option.selected?'✓':'';check.setAttribute('aria-hidden','true');item.append(text,check);item.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));sync();close();button.focus();};item.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();close();button.focus();}else if(e.key==='Tab')close();else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();active=e.key==='Home'?0:e.key==='End'?select.options.length-1:(index+(e.key==='ArrowDown'?1:-1)+select.options.length)%select.options.length;items()[active]?.focus();}};menu.append(item);});
   if(select.disabled)close();else if(!menu.hidden)position();
  };
  button.onclick=()=>{if(!menu.hidden){close();return;}closeAll();sync();menu.hidden=false;button.setAttribute('aria-expanded','true');position();active=Math.max(0,select.selectedIndex);items()[active]?.focus({preventScroll:true});items()[active]?.scrollIntoView({block:'nearest'});};
  button.onkeydown=e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();if(menu.hidden)button.click();}};
  document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target)&&!button.contains(e.target))close();});
  document.addEventListener('scroll',e=>{if(!menu.hidden&&!menu.contains(e.target))close();},true);window.addEventListener('resize',close);
  select.addEventListener('change',sync);new MutationObserver(sync).observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected']});sync();
 }
}
