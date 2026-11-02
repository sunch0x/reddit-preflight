import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudPass} from '../extension/eclipse-motion.js';
test('cloud passes leave the sun clear for more than three quarters of a cycle',()=>{
 let clear=0;for(let i=0;i<360;i++){const t=i/10;if(!cloudPass(t,0,false)&&!cloudPass(t,1,false))clear++;}
 assert.ok(clear/360>.75);assert.equal(cloudPass(0,0,false),null);assert.equal(cloudPass(30,1,false),null);
});
test('cloud crosses in one direction then leaves; reduced motion keeps the sun clear',()=>{
 const a=cloudPass(13,0,false),b=cloudPass(15,0,false),c=cloudPass(17,0,false);
 assert.ok(a.drift<b.drift&&b.drift<c.drift);assert.ok(b.alpha>0&&b.alpha<=1);
 assert.equal(cloudPass(20,0,false),null);assert.equal(cloudPass(15,0,true),null);
});
