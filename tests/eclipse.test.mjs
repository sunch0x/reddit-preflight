import test from 'node:test';
import assert from 'node:assert/strict';
import {EclipseMotion} from '../extension/eclipse-motion.js';
test('click opens and returns to the original eclipse within one bounded cycle',()=>{
 const m=new EclipseMotion();assert.equal(m.sample(0,false).open,0);assert.equal(m.activate(100,false),true);
 assert.equal(m.sample(800,false).open,1);assert.equal(m.sample(1400,false).busy,true);
 const done=m.sample(2700,false);assert.equal(done.open,0);assert.equal(done.busy,false);assert.equal(done.burst,0);
});
test('repeat clicks do not queue cycles or postpone completion',()=>{
 const m=new EclipseMotion();m.activate(0,false);assert.equal(m.activate(600,false),false);assert.equal(m.sample(2600,false).busy,false);assert.equal(m.activate(2700,false),true);
});
test('reduced motion uses a static click toggle without particles or a timer',()=>{
 const m=new EclipseMotion();m.activate(0,true);assert.equal(m.sample(10,true).open,1);assert.equal(m.sample(9999,true).open,1);assert.equal(m.sample(9999,true).burst,0);m.activate(10000,true);assert.equal(m.sample(10001,true).open,0);
});
test('reset discards an interrupted effect and hover state',()=>{
 const m=new EclipseMotion();m.setHovered(true);m.activate(0,false);m.sample(600,false);m.reset();assert.equal(m.sample(700,false).open,0);assert.equal(m.sample(700,false).hover,0);assert.equal(m.sample(700,false).busy,false);
});
