import {classify,resolveAccount,sessionConflict,isOwnedURL,LABELS} from './core.js';
export class Scanner{
 constructor(api,state,options={}){
  this.api=api;this.state=state;this.snapshot=options.snapshot;this.persist=options.persist||async function(){};this.changed=options.changed||(()=>{});this.message=options.message||(()=>{});this.clock=options.clock||Date.now;this.wait=options.wait||(ms=>new Promise(r=>setTimeout(r,ms)));this.foreground=options.foreground||(()=>false);this.running=false;this.stopped=false;
 }
 pause(){this.stopped=true;}
 async save(){await this.persist();this.changed();}
 async ownedTab(){
  if(!this.state.workerTabId)return null;
  try{const t=await this.api.tabs.get(this.state.workerTabId);return isOwnedURL(t.pendingUrl||t.url,this.state.workerUrl)?t:null;}catch{return null;}
 }
 async closeTab(){const t=await this.ownedTab();if(t)await this.api.tabs.remove(t.id).catch(()=>{});this.state.workerTabId=null;this.state.workerUrl='';await this.save();}
 async visit(name){
  const url='https://www.reddit.com/r/'+name+'/submit/';
  const old=await this.ownedTab();
  if(this.state.workerTabId&&!old)throw Error('The scanning tab was closed or navigated elsewhere. Your navigation was left untouched.');
  const tab=old?await this.api.tabs.update(old.id,{url,active:this.foreground()}):await this.api.tabs.create({url,active:this.foreground()});
  this.state.workerTabId=tab.id;this.state.workerUrl=url;await this.save();
  let last={status:'unknown',reason:'other',evidence:'The composer did not become identifiable within the observation window.',account:''},ready=0;
  const deadline=this.clock()+8000;
  for(let i=0;i<40&&this.clock()<deadline;i++){
   if(i>0)await this.wait(250);if(this.stopped)return null;
   const t=await this.api.tabs.get(tab.id).catch(()=>null);if(!t)throw Error('The scanning tab was closed');if(t.pendingUrl)continue;
   let actual;try{actual=new URL(t.url);}catch{continue;}
   if(actual.origin!=='https://www.reddit.com')throw Error('The scanning tab left Reddit. Check it before continuing.');
   if(!isOwnedURL(t.url,url)&&!/^\/(login|register)(\/|$)/.test(actual.pathname)){
    if(i<4)continue;throw Error('Reddit opened a different page. Review the scanning tab before continuing.');
   }
   this.state.workerUrl=t.url;
   try{
    const outputs=await this.api.scripting.executeScript({target:{tabId:tab.id},func:this.snapshot});
    if(this.stopped)return null;
    const snapshot=outputs[0]?.result||{},account=resolveAccount(snapshot);
    if(sessionConflict(this.state.account,account))return {status:'session_changed',reason:'other',evidence:'Detected u/'+account+' after u/'+this.state.account+'. Recheck the list for the new account instead of mixing results.',account};
    if(account&&!this.state.account){this.state.account=account;await this.save();}
    last={...classify(snapshot),account};
    if(last.status==='form_open'){if(++ready>=2)return last;}
    else{ready=0;if(last.status!=='unknown')return last;}
   }catch(e){ready=0;last={status:'unknown',reason:'other',evidence:'Could not inspect this page: '+String(e.message).slice(0,300),account:''};}
  }
  // A single fleeting composer observation is not sufficient.
  if(last.status==='form_open'&&ready<2)return {status:'unknown',reason:'other',evidence:'The composer appeared once but could not be confirmed on a second observation.',account:last.account};
  return last;
 }
 async run(){
  if(this.running)return;this.running=true;this.stopped=false;this.state.runState='running';await this.save();let preserve=false,current;
  try{
   while(!this.stopped){
    current=this.state.rows.find(r=>r.status==='pending');if(!current){this.message('Finished. Your report is ready to export.');break;}
    current.status='checking';current.evidence='';await this.save();this.message('Checking r/'+current.name);
    const result=await this.visit(current.name);
    if(this.stopped||!result){current.status='pending';break;}
    Object.assign(current,result,{checkedAt:new Date().toISOString(),url:'https://www.reddit.com/r/'+current.name+'/submit/'});await this.save();
    if(['login','challenge','rate_limit','session_changed'].includes(result.status)){preserve=true;this.message('Paused: '+LABELS[result.status]+'. Review the scanning tab.');break;}
   }
  }catch(e){
   if(current?.status==='checking')Object.assign(current,{status:'unknown',reason:'other',evidence:String(e.message),checkedAt:new Date().toISOString(),account:''});
   preserve=true;this.message(String(e.message));
  }finally{
   for(const r of this.state.rows)if(r.status==='checking')r.status='pending';
   this.running=false;this.state.runState=preserve||this.state.rows.some(r=>r.status==='pending')?'paused':'done';await this.save();
   if(!preserve)await this.closeTab();
   if(this.stopped)this.message('Paused. Your completed checks are saved.');
  }
 }
}
