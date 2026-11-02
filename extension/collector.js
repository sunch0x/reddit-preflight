import {isCommunitySearchURL,normalizeCommunity} from './core.js';
export class Collector{
 constructor(api,tab,options={}){this.api=api;this.tab=tab;this.readPage=options.readPage;this.onBatch=options.onBatch||async function(){};this.changed=options.changed||(()=>{});this.wait=options.wait||(ms=>new Promise(r=>setTimeout(r,ms)));this.clock=options.clock||Date.now;this.stopped=false;this.running=false;}
 pause(){this.stopped=true;}
 async run(){
  if(!isCommunitySearchURL(this.tab.url))throw Error('Open Reddit search and select the Communities tab first');
  const found=new Map();let stable=0,stalled=0,previousPosition='',reason='timeout';const deadline=this.clock()+120000;
  this.running=true;this.stopped=false;
  try{
   for(let i=0;i<350&&this.clock()<deadline;i++){
    if(this.stopped){reason='stopped';break;}
    const tab=await this.api.tabs.get(this.tab.id).catch(()=>null);
    if(!tab||tab.url!==this.tab.url){reason='navigation';break;}
    const response=await this.api.scripting.executeScript({target:{tabId:tab.id},func:this.readPage,args:[i>0]});
    const page=response[0]?.result;
    if(!page){reason='unreadable';break;}
    if(this.stopped){reason='stopped';break;}
    if(page.challenge||page.rateLimit||page.login){reason=page.challenge?'challenge':page.rateLimit?'rate_limit':'login';break;}
    const batch=[];for(const value of page.names||[]){const name=normalizeCommunity(value);if(name&&!found.has(name.toLowerCase())){found.set(name.toLowerCase(),name);batch.push(name);}}
    if(batch.length)await this.onBatch(batch);
    this.changed(found.size);
    if(found.size>=1000){reason='limit';break;}
    stable=page.atBottom&&!page.loading&&!batch.length?stable+1:0;
    const position=JSON.stringify([page.position,page.height]);stalled=!batch.length&&position===previousPosition?stalled+1:0;previousPosition=position;
    if(stable>=5){reason='end';break;}
    if(stalled>=18&&!page.loading){reason='stalled';break;}
    await this.wait(page.atBottom?850:350);
   }
  }finally{this.running=false;}
  return {names:[...found.values()],reason,canCheck:['end','limit'].includes(reason)};
 }
}
