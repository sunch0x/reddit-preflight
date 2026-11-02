// Inspect rendered community search results and scroll only the result pane.
// No navigation, network requests, button clicks or form submissions.
export function readSearchPage(advance=false){
 const roots=[document],elements=[];
 for(let i=0;i<roots.length&&elements.length<20000;i++)for(const el of roots[i].querySelectorAll('*')){if(elements.length>=20000)break;elements.push(el);if(el.shadowRoot)roots.push(el.shadowRoot);}
 const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
 const main=elements.find(el=>el.tagName==='MAIN')||document.querySelector('#main-content')||document.body;
 const within=el=>{let n=el;while(n){if(n===main)return true;n=n.parentNode||n.host;}return false;};
 const names=[];
 for(const el of elements){
  if(el.tagName!=='A'||!within(el))continue;
  const href=el.getAttribute('href')||'';const m=href.match(/^(?:https:\/\/www\.reddit\.com)?\/r\/([A-Za-z0-9_]{2,30})\/?$/i);
  if(m&&!['all','popular'].includes(m[1].toLowerCase()))names.push(m[1]);
 }
 const bodyText=(document.body?.innerText||'').slice(0,18000);
 const challenge=/verify you are human|verify you.re human|checking your browser|подтвердите.*человек/i.test(bodyText);
 const rateLimit=/too many requests|http\s*429|слишком много запросов/i.test(bodyText);
 const login=elements.some(el=>visible(el)&&el.matches('dialog[open],[role="dialog"]')&&/log in|sign in/i.test(el.textContent||'')&&el.querySelector('input[type="password"]'));
 const candidates=elements.filter(el=>within(el)&&visible(el)&&el.scrollHeight>el.clientHeight+100&&el.clientHeight>180&&/(auto|scroll)/.test(getComputedStyle(el).overflowY));
 const scroller=candidates.sort((a,b)=>b.clientHeight-a.clientHeight)[0]||document.scrollingElement||document.documentElement;
 const atBottom=scroller.scrollTop+scroller.clientHeight>=scroller.scrollHeight-8;
 const loading=elements.some(el=>within(el)&&visible(el)&&el.matches('[role="progressbar"],[aria-busy="true"],faceplate-loading,faceplate-spinner'));
 const result={names:[...new Set(names)],atBottom,loading,position:Math.round(scroller.scrollTop),height:scroller.scrollHeight,challenge,rateLimit,login};
 if(advance&&!challenge&&!rateLimit&&!login)scroller.scrollBy({top:Math.max(300,scroller.clientHeight*.8),behavior:'instant'});
 return result;
}
