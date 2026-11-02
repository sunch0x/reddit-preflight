// Read-only DOM inspection. No input values, cookies, credentials or network calls.
// Self-contained so Chrome can inject the function in its isolated world.
export function collectSnapshot(){
 const elements=[],roots=[document];
 for(let i=0;i<roots.length&&elements.length<24000;i++){
  for(const el of roots[i].querySelectorAll('*')){if(elements.length>=24000)break;elements.push(el);if(el.shadowRoot)roots.push(el.shadowRoot);}
 }
 const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
 const readable=el=>String(el.innerText||el.textContent||'').trim();
 const shown=elements.filter(visible);
 const dialogs=shown.filter(el=>el.matches('dialog[open],[role="dialog"],[role="alertdialog"],[role="alert"],faceplate-modal')||el.tagName.toLowerCase().includes('eligibility'));
 const phrases=/can't contribute|cannot contribute|can’t contribute|can't post|not eligible|activity requirements|only approved users|request to post|community doesn.t exist|не можете публиковать|не можете участвовать|не можете создавать|слишком новый/i;
 const gates=shown.filter(el=>/^(P|H1|H2|H3|SPAN|DIV|BUTTON)$/.test(el.tagName)&&el.children.length<6&&readable(el).length<2200&&phrases.test(readable(el)));
 const gateText=[...new Set([...dialogs,...gates].map(readable).filter(Boolean))].join('\n').slice(0,7000);
 const inputs=shown.filter(el=>el.matches('textarea,input,[role="textbox"],[contenteditable="true"]')&&!el.disabled&&el.getAttribute('aria-disabled')!=='true'&&!el.readOnly);
 const fieldName=el=>[el.getAttribute('placeholder'),el.getAttribute('aria-label'),el.getAttribute('name'),el.getAttribute('data-testid'),el.id].filter(Boolean).join(' ');
 const titleField=inputs.some(el=>/title|заголовок|название/i.test(fieldName(el))&&!/search|поиск/i.test(fieldName(el)));
 const editor=inputs.some(el=>el.isContentEditable||el.getAttribute('role')==='textbox'&&el.getAttribute('aria-multiline')==='true'||el.tagName==='TEXTAREA'&&!/title|search|заголовок|поиск/i.test(fieldName(el))&&(/body|text|content|текст|описание/i.test(fieldName(el))||el.closest('form')));
 const text=((document.body?.innerText||'')+'\n'+roots.slice(1).map(r=>r.textContent||'').join('\n')).slice(0,18000);
 const authDialog=dialogs.some(el=>/log in|sign in|войти/i.test(readable(el))&&(/password|пароль|username|имя пользователя/i.test(readable(el))||el.querySelector('input[type="password"]')));
 const challenge=/verify you are human|verify you.re human|подтвердите.*человек|checking your browser/i.test(text)||shown.some(el=>el.matches('iframe')&&/captcha|challenges.cloudflare/i.test(el.getAttribute('src')||''));
 const accountCandidates=[];
 // Only explicit account-menu identifiers. Never infer the viewer from post authors.
 const menus=elements.filter(el=>el.matches('#user-drawer-content,#user-dropdown-content,#user-dropdown,shreddit-account-menu,[data-testid="user-drawer"],[data-testid="user-dropdown"]'));
 for(const menu of menus){
  const attrs=['username','data-username','user-name'];
  for(const a of attrs){const v=menu.getAttribute(a);if(v)accountCandidates.push('u/'+v.replace(/^u\//,''));}
  for(const root of [menu,...(menu.shadowRoot?[menu.shadowRoot]:[])]){
   for(const link of root.querySelectorAll('a[href]')){const match=(link.getAttribute('href')||'').match(/^(?:https:\/\/www\.reddit\.com)?\/(?:user|u)\/([A-Za-z0-9_-]{3,30})\/?$/);if(match)accountCandidates.push('u/'+match[1]);}
  }
 }
 const mediaRequirement=shown.filter(el=>!el.closest('aside')&&el.children.length<3).map(readable).find(t=>t.length<240&&/^This community requires you to add an image, video, or link[.!]?$/i.test(t))||'';
 return {url:location.href,text,gateText,titleField,editor,authDialog,challenge,accountCandidates,mediaRequirement};
}
