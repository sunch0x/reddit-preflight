import test from 'node:test';import assert from 'node:assert/strict';
import {Scanner} from '../extension/scanner.js';
function fixture(snapshots){
 const tabs=new Map(),calls=[],removed=[];let id=0,time=0,reads=0;
 const api={tabs:{create:async d=>{const t={id:++id,url:d.url};tabs.set(id,t);calls.push(d.url);return t;},get:async id=>{if(!tabs.has(id))throw Error('missing');return {...tabs.get(id)};},update:async(id,d)=>{Object.assign(tabs.get(id),d);calls.push(d.url);return {...tabs.get(id)};},remove:async id=>{removed.push(id);tabs.delete(id);}},scripting:{executeScript:async({target})=>{const i=reads++;return [{result:{url:tabs.get(target.tabId).url,titleField:true,editor:true,accountCandidates:['u/viewer'],...(snapshots[i]||{})}}];}}};
 const state={schema:2,rows:[{name:'one',status:'pending'},{name:'two',status:'pending'}],account:'',workerTabId:null,workerUrl:''};
 const scanner=new Scanner(api,state,{snapshot(){},persist:async()=>{},changed(){},message(){},clock:()=>time,wait:async ms=>{time+=ms;}});
 return {scanner,state,tabs,calls,removed,get reads(){return reads;}};
}
test('scan is sequential, reuses one tab, no inter-community delay and closes on completion',async()=>{
 const f=fixture([]);await f.scanner.run();assert.deepEqual(f.state.rows.map(r=>r.status),['form_open','form_open']);assert.equal(f.calls.length,2);assert.equal(f.removed.length,1);assert.equal(f.reads,4);assert.equal(f.state.account,'viewer');
});
test('a gate arriving after initial composer wins',async()=>{
 const f=fixture([{}, {gateText:"You can't contribute in this community yet. Your account isn't old enough yet."}]);await f.scanner.run();assert.equal(f.state.rows[0].status,'blocked');assert.equal(f.state.rows[0].reason,'age');
});
test('account change pauses and keeps remaining rows pending',async()=>{
 const f=fixture([{}, {}, {accountCandidates:['u/other']}]);await f.scanner.run();assert.equal(f.state.rows[1].status,'session_changed');assert.equal(f.state.runState,'paused');assert.equal(f.tabs.size,1);
});
test('rate limiting pauses without opening the next community',async()=>{
 const f=fixture([{text:'Too many requests'}]);await f.scanner.run();assert.equal(f.state.rows[0].status,'rate_limit');assert.equal(f.state.rows[1].status,'pending');assert.equal(f.calls.length,1);assert.equal(f.tabs.size,1);
});
test('closing preserves tabs the user navigated elsewhere',async()=>{
 const f=fixture([{text:'Too many requests'}]);await f.scanner.run();const id=f.state.workerTabId;f.tabs.get(id).url='https://www.reddit.com/r/elsewhere/';await f.scanner.closeTab();assert.equal(f.tabs.size,1);assert.equal(f.state.workerTabId,null);
});
test('pending-only policy leaves manual marks untouched',async()=>{
 const f=fixture([]);f.state.rows[0].status='manual_bad';await f.scanner.run();assert.equal(f.state.rows[0].status,'manual_bad');assert.equal(f.calls.length,1);
});
test('pausing returns active row to queue',async()=>{
 const f=fixture([]);f.scanner.wait=async()=>{f.scanner.pause();};await f.scanner.run();assert.equal(f.state.rows[0].status,'pending');assert.equal(f.state.rows[1].status,'pending');assert.equal(f.state.runState,'paused');
});
