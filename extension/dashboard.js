import {startAmbient} from './ambient.js';
import {enhanceSelects} from './select-menu.js';
import {LABELS,REASONS,escapeHTML as e,parseCommunities,exportCSV,exportHTML,validateBackup,isCommunitySearchURL,mergeCollected} from './core.js';
import {collectSnapshot} from './snapshot.js';import {Scanner} from './scanner.js';
import {Collector} from './collector.js';import {readSearchPage} from './search-page.js';
const $=id=>document.getElementById(id),KEY='reddit-preflight-v2';
let state,scanner,collector,collecting=false,collectionCancelled=false,version=0,lastTable='',menu='',lastCounts={},lastActivity=null;
const say=s=>{$('message').textContent=s;};
const save=()=>chrome.storage.local.set({[KEY]:state});
const changed=()=>{version++;draw();};
function count(id,value,markup){
 if(lastCounts[id]!==value){$(id).innerHTML=markup||String(value);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$(id).animate([{opacity:.35,transform:'translateY(2px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});lastCounts[id]=value;}
}
function draw(){
 const running=scanner?.running||collecting,total=state.rows.length,checked=state.rows.filter(r=>!['pending','checking'].includes(r.status)).length;
 if(lastActivity!==Boolean(running)){lastActivity=Boolean(running);document.dispatchEvent(new CustomEvent('preflight:activity',{detail:{running:lastActivity}}));}
 const opened=state.rows.filter(r=>r.status==='form_open').length,blocked=state.rows.filter(r=>['blocked','restricted','unavailable','manual_bad'].includes(r.status)).length,review=state.rows.filter(r=>['unknown','login','challenge','rate_limit','session_changed'].includes(r.status)).length;
 count('checked-count',checked+'/'+total,checked+' <small>/ '+total+'</small>');count('open-count',opened);count('blocked-count',blocked);count('review-count',review);
 $('progress-fill').style.width=(total?checked/total*100:0)+'%';$('progress').setAttribute('aria-valuenow',String(checked));$('progress').setAttribute('aria-valuemax',String(total));
 $('start').disabled=running||!state.rows.some(r=>r.status==='pending');$('pause').hidden=!running;$('start').hidden=running;
 $('start-label').textContent=checked?'Continue checking':'Start checking';
 for(const id of ['add','sample','import-list','retry','recheck','restore','clear','collect','refresh-source','source-tab','manage-list'])$(id).disabled=running;
 $('collect-label').textContent=collecting?'Collecting…':'Collect & check';
 $('foreground').disabled=running;for(const id of ['export','csv','backup'])$(id).disabled=!total;
 $('view').hidden=!state.workerTabId;$('close').hidden=running||!state.workerTabId;
 $('empty').hidden=Boolean(total);$('table-wrap').hidden=!total;
 $('account-label').textContent=state.account?'Checking as u/'+state.account:'Uses your Reddit session';
 $('account-pill').title=state.account?'Last explicitly identified account. Individual rows retain their own detected identity.':'No extra login. The account is displayed only when Reddit exposes it in the account menu.';
 $('local-label').textContent=collecting?'Collecting search results / saved locally':running?'Checking one tab / saved locally':state.runState==='done'?'Report ready / saved locally':'Saved only in this browser';
 const key=[version,$('search').value,$('filter').value,menu,running].join('|');if(lastTable===key)return;lastTable=key;
 const search=$('search').value.toLowerCase(),filter=$('filter').value;
 const rows=state.rows.filter(r=>(!filter||r.status===filter)&&[r.name,r.evidence,r.note,REASONS[r.reason],LABELS[r.status]].join(' ').toLowerCase().includes(search));
 $('no-matches').hidden=!total||Boolean(rows.length);
 $('rows').innerHTML=rows.map(r=>'<tr><td><a href="https://www.reddit.com/r/'+e(r.name)+'/" target="_blank" rel="noopener noreferrer">r/'+e(r.name)+'</a><small>'+e(r.account?'u/'+r.account:r.checkedAt?'Account not identified':'Not checked yet')+'</small></td><td><span class="badge '+e(r.status)+'">'+e(LABELS[r.status])+'</span><small>'+e(r.checkedAt?new Date(r.checkedAt).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}):'')+'</small></td><td>'+(r.reason?'<strong>'+e(REASONS[r.reason]||r.reason)+'</strong><br>':'')+e(r.evidence||r.note||'Waiting for its turn')+(r.note&&r.evidence?'<br>'+e(r.note):'')+'</td><td><div class="row-action"><button aria-label="Actions for r/'+e(r.name)+'" aria-expanded="'+(menu===r.name)+'" data-menu="'+e(r.name)+'" '+(running?'disabled':'')+'>⋯</button>'+(menu===r.name?'<div class="row-menu"><button data-action="pending" data-name="'+e(r.name)+'">Check again</button><button data-action="user_confirmed" data-name="'+e(r.name)+'">Mark confirmed</button><button data-action="manual_bad" data-name="'+e(r.name)+'">Mark excluded</button><button data-action="remove" data-name="'+e(r.name)+'">Remove from list</button></div>':'')+'</div></td></tr>').join('');
}
async function confirmAction(title,description,action){
 const dialog=$('confirm-dialog');$('confirm-title').textContent=title;$('confirm-description').textContent=description;$('confirm-action').textContent=action;dialog.returnValue='';dialog.showModal();
 return new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true}));
}
function download(name,body,type){const url=URL.createObjectURL(new Blob([body],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
async function addList(text){
 const {names,invalid}=parseCommunities(text);let added=0;for(const name of names){if(state.rows.length>=1000)break;if(state.rows.some(r=>r.name.toLowerCase()===name.toLowerCase()))continue;state.rows.push({name,status:'pending'});added++;}
 await save();changed();$('input-message').textContent=added+' added'+(invalid.length?' / '+invalid.length+' invalid entries skipped':'')+(state.rows.length>=1000?' / list limit: 1,000':'');
 if(added){$('community-input').value='';say('Ready to check');}
}
async function start(){
 if(scanner.running||collecting)return;
 await navigator.locks.request('reddit-preflight-runner',{ifAvailable:true},async lock=>{if(!lock){say('A check is already running in another Preflight window');return;}await scanner.run();});
}
async function refreshSources(){
 const select=$('source-tab'),previous=select.value;
 const tabs=(await chrome.tabs.query({url:'https://www.reddit.com/*'})).filter(t=>isCommunitySearchURL(t.url));
 tabs.sort((a,b)=>(b.lastAccessed||0)-(a.lastAccessed||0));
 const preferred=(await chrome.storage.session.get('preflightSourceTab')).preflightSourceTab;
 select.replaceChildren();
 if(!tabs.length){const o=document.createElement('option');o.value='';o.textContent='No Communities search tab found';select.append(o);return;}
 for(const tab of tabs){const o=document.createElement('option');o.value=String(tab.id);o.textContent=(new URL(tab.url).searchParams.get('q')||'Reddit search')+' / Communities';select.append(o);}
 const selected=tabs.find(t=>String(t.id)===previous)||tabs.find(t=>t.id===preferred)||tabs[0];select.value=String(selected.id);
}
async function collectAndCheck(){
 if(scanner.running||collecting)return;
 await navigator.locks.request('reddit-preflight-runner',{ifAvailable:true},async lock=>{
  if(!lock){say('A check is already running in another Preflight window');return;}
  collecting=true;collectionCancelled=false;changed();let added=0;
  try{
   if(!$('source-tab').value)await refreshSources();
   const id=Number($('source-tab').value);if(!id)throw Error('Open a Reddit search, select Communities, then click Refresh tabs');
   const tab=await chrome.tabs.get(id);if(!isCommunitySearchURL(tab.url))throw Error('The selected tab is no longer a Communities search');
   if(collectionCancelled){say('Collection stopped. Your list is unchanged.');return;}
   collector=new Collector(chrome,tab,{readPage:readSearchPage,onBatch:async names=>{added+=mergeCollected(state.rows,names);await save();changed();},changed:n=>{$('collect-message').textContent=n+' found / '+added+' new in your list';say('Collecting communities from Reddit / '+n+' found');}});
   const result=await collector.run();
   const descriptions={end:'End of loaded search results',limit:'Community limit reached',stopped:'Collection stopped',navigation:'Search tab closed or navigated elsewhere',challenge:'Reddit requested a browser check',rate_limit:'Reddit rate-limited the search',login:'Reddit requested sign-in',timeout:'Collection time limit reached',stalled:'Search stopped loading new results',unreadable:'Could not read the search page'};
   $('collect-message').textContent=(descriptions[result.reason]||result.reason)+' / '+result.names.length+' found / '+added+' new';
   collecting=false;changed();
   if(!result.names.length){say('No community links found. Check that the selected search has Communities results, then try again.');}
   else if(result.canCheck&&state.rows.some(r=>r.status==='pending')){say('Collected. Starting checks with saved observations preserved.');await scanner.run();}
   else say(result.canCheck?'Collected. These communities were already checked.':(descriptions[result.reason]||'Collection paused')+'. Collected names are saved; you can check them with Start checking.');
  }catch(err){say('Could not collect: '+err.message);$('collect-message').textContent=err.message;}
  finally{collecting=false;collector=null;changed();}
 });
}
async function init(){
 enhanceSelects();
 const locks=await navigator.locks.query();
 const otherRunning=locks.held.some(lock=>lock.name==='reddit-preflight-runner');
 const stored=(await chrome.storage.local.get(KEY))[KEY];
 try{state=stored?validateBackup(stored):{schema:2,rows:[],account:'',workerTabId:null,workerUrl:'',runState:'idle'};}catch{state={schema:2,rows:[],account:'',workerTabId:null,workerUrl:'',runState:'idle'};say('Saved data could not be loaded. You can restore an exported backup.');}
 // Only restore ownership from this trusted local storage, never from an imported file.
 if(stored?.workerTabId&&stored.workerUrl?.startsWith('https://www.reddit.com/r/')){state.workerTabId=stored.workerTabId;state.workerUrl=stored.workerUrl;}
 scanner=new Scanner(chrome,state,{snapshot:collectSnapshot,persist:save,changed,message:say,foreground:()=>$('foreground').checked});
 for(const [value,label] of Object.entries(LABELS)){const o=document.createElement('option');o.value=value;o.textContent=label;$('filter').append(o);}
 if(otherRunning){draw();for(const button of document.querySelectorAll('button,input[type="file"]'))button.disabled=true;say('A check is running in another Preflight window. Use that window, or reload this one after it stops.');return;}
 await save();draw();if(state.rows.length)say('Your list is saved. Continue checking or export the report.');
 $('manage-list').onclick=()=>$('list-dialog').showModal();
 $('close-list-dialog').onclick=()=>$('list-dialog').close();
 $('list-dialog').addEventListener('click',ev=>{if(ev.target.closest('#retry,#recheck,#backup,#clear'))$('list-dialog').close();});
 $('restore').addEventListener('change',()=>$('list-dialog').close());
 $('add').onclick=()=>addList($('community-input').value).catch(err=>say(err.message));
 $('sample').onclick=()=>addList('socialmedia\ncontent_marketing\ncreators\nSocialMediaMarketing\nSaaS');
 $('start').onclick=()=>start().catch(err=>say('Could not start: '+err.message));
 $('pause').onclick=()=>{if(collecting){collectionCancelled=true;collector?.pause();}else scanner.pause();say('Stopping after the current page read…');};
 $('collect').onclick=()=>collectAndCheck().catch(err=>say(err.message));
 $('refresh-source').onclick=()=>refreshSources().catch(err=>say(err.message));
 $('search').oninput=draw;$('filter').onchange=draw;
 $('view').onclick=()=>{if(state.workerTabId)chrome.tabs.update(state.workerTabId,{active:true}).catch(()=>say('The scanning tab is no longer open'));};
 $('close').onclick=()=>scanner.closeTab();
 $('rows').onclick=async ev=>{
  const target=ev.target.closest('button');if(!target||scanner.running||collecting)return;
  if(target.dataset.menu){menu=menu===target.dataset.menu?'':target.dataset.menu;draw();return;}
  const name=target.dataset.name,action=target.dataset.action,r=state.rows.find(r=>r.name===name);if(!r)return;menu='';
  if(action==='remove'){state.rows=state.rows.filter(row=>row!==r);}
  else Object.assign(r,{status:action,evidence:action==='pending'?'':'Manually marked by the user; not an automated eligibility check.',reason:'',checkedAt:action==='pending'?'':new Date().toISOString(),account:''});
  await save();changed();
 };
 document.addEventListener('click',ev=>{if(menu&&!ev.target.closest('.row-action')){menu='';draw();}});
 $('retry').onclick=async()=>{for(const r of state.rows)if(['unknown','login','rate_limit','challenge'].includes(r.status))r.status='pending';await save();changed();say('Uncertain results are back in the queue');};
 $('recheck').onclick=async()=>{
  if(!await confirmAction('Recheck your list?','Previous observations and manual marks will be reset. Export a report first if you want to keep them. This is also required after changing Reddit accounts.','Recheck all'))return;
  await scanner.closeTab();state.account='';for(const r of state.rows)Object.assign(r,{status:'pending',evidence:'',reason:'',checkedAt:'',account:'',note:''});state.runState='idle';await save();changed();say('Ready to check again with your current Reddit session');
 };
 $('clear').onclick=async()=>{
  if(!await confirmAction('Clear everything?','This removes your community list and saved results from this extension. Download a backup first if you need them.','Clear everything'))return;
  await scanner.closeTab();state.rows=[];state.account='';state.runState='idle';await chrome.storage.local.remove(KEY);changed();say('List and results cleared');
 };
 const stamp=()=>new Date().toISOString().slice(0,10);
 $('export').onclick=()=>download('reddit-preflight-'+stamp()+'.html',exportHTML(state.rows),'text/html;charset=utf-8');
 $('csv').onclick=()=>download('reddit-preflight-'+stamp()+'.csv',exportCSV(state.rows),'text/csv;charset=utf-8');
 $('backup').onclick=()=>download('reddit-preflight-backup-'+stamp()+'.json',JSON.stringify({...state,workerTabId:null,workerUrl:'',runState:'paused'},null,2),'application/json');
 $('import-list').onchange=async ev=>{try{const f=ev.target.files[0];if(f){if(f.size>200000)throw Error('Please keep lists under 200 KB');await addList(await f.text());}}catch(err){$('input-message').textContent=err.message;}ev.target.value='';};
 $('restore').onchange=async ev=>{
  try{const f=ev.target.files[0];if(!f)return;if(f.size>3000000)throw Error('Backup exceeds 3 MB');const data=validateBackup(JSON.parse(await f.text()));if(!await confirmAction('Restore this backup?','This replaces your current list and results. The backup may belong to a different Reddit account.','Restore'))return;await scanner.closeTab();Object.assign(state,data);await save();changed();say('Backup restored. Check that it matches the Reddit account you are using.');}catch(err){say('Could not restore: '+err.message);}finally{ev.target.value='';}
 };
 await refreshSources().catch(()=>{$('collect-message').textContent='Open a Reddit Communities search, then click Refresh tabs';});
}
window.addEventListener('beforeunload',()=>{scanner?.pause();collector?.pause();});
startAmbient();
init().catch(err=>say('Could not open Preflight: '+err.message));
