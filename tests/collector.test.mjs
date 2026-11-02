import test from 'node:test';import assert from 'node:assert/strict';
import {Collector} from '../extension/collector.js';
import {isCommunitySearchURL,mergeCollected} from '../extension/core.js';
test('only community-search pages qualify, not Posts or arbitrary Reddit pages',()=>{
 assert.ok(isCommunitySearchURL('https://www.reddit.com/search/?q=smm&type=communities'));
 assert.ok(isCommunitySearchURL('https://www.reddit.com/search/?q=smm&type=sr'));
 assert.equal(isCommunitySearchURL('https://www.reddit.com/search/?q=smm&type=posts'),false);
 assert.equal(isCommunitySearchURL('https://evil.com/search/?type=communities'),false);
 assert.equal(isCommunitySearchURL('https://www.reddit.com/r/example/'),false);
});
test('merging does not overwrite existing observations or requeue checked rows',()=>{
 const rows=[{name:'SaaS',status:'form_open',evidence:'saved'}];const n=mergeCollected(rows,['saas','creators','creators']);assert.equal(n,1);assert.deepEqual(rows,[{name:'SaaS',status:'form_open',evidence:'saved'},{name:'creators',status:'pending'}]);
});
function setup(pages){
 let index=0,stop=false,elapsed=0,scrolls=0;const batches=[];const tab={id:7,url:'https://www.reddit.com/search/?q=smm&type=communities'};
 const api={tabs:{get:async()=>({...tab})},scripting:{executeScript:async({args})=>{if(args?.[0])scrolls++;return [{result:pages[Math.min(index++,pages.length-1)]}];}}};
 const collector=new Collector(api,{id:tab.id,url:tab.url},{readPage(){},onBatch:async names=>batches.push(names),changed(){},wait:async ms=>{elapsed+=ms;},clock:()=>elapsed});
 return {collector,tab,batches,get scrolls(){return scrolls;}};
}
test('collects virtualized batches, deduplicates, then stops on stable bottom',async()=>{
 const f=setup([{names:['one'],atBottom:false},{names:['two','one'],atBottom:true},{names:['two'],atBottom:true}]);const r=await f.collector.run();assert.deepEqual(r.names,['one','two']);assert.equal(r.reason,'end');assert.ok(f.scrolls>0);
});
test('stops on a challenge without automatically starting checks',async()=>{
 const f=setup([{names:['one'],atBottom:false},{names:[],atBottom:false,challenge:true}]);const r=await f.collector.run();assert.equal(r.reason,'challenge');assert.equal(r.canCheck,false);assert.deepEqual(r.names,['one']);
});
test('user navigation stops scrolling and preserves collected names',async()=>{
 const f=setup([{names:['one'],atBottom:false}]);f.collector.wait=async()=>{f.tab.url='https://www.reddit.com/r/elsewhere/';};const r=await f.collector.run();assert.equal(r.reason,'navigation');assert.equal(r.canCheck,false);assert.deepEqual(r.names,['one']);
});
test('Stop keeps collected names without starting checks',async()=>{
 const f=setup([{names:['one'],atBottom:false}]);f.collector.wait=async()=>f.collector.pause();const r=await f.collector.run();assert.equal(r.reason,'stopped');assert.equal(r.canCheck,false);assert.deepEqual(r.names,['one']);
});
