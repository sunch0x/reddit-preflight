import {EclipseMotion} from './eclipse-motion.js';
// Low-resolution procedural pixel scenery. One capped loop, no WebGL or external assets.
export function startAmbient(){
 const canvas=document.getElementById('ambient-world');if(!canvas)return;
 const ctx=canvas.getContext('2d',{alpha:false}),motion=matchMedia('(prefers-reduced-motion: reduce)'),finePointer=matchMedia('(hover: hover) and (pointer: fine) and (min-width: 761px)');
 let width=0,height=0,frame=0,last=0,origin=performance.now(),lightAngle=-Math.PI/3;
 const camera={x:0,y:0,tx:0,ty:0};
 const effect=new EclipseMotion(),trigger=document.getElementById('eclipse-trigger');
 const geometry=()=>{const r=width<250?8:14;return {r,x:width-r-9,y:r+9};};
 const particles=Array.from({length:22},(_,i)=>({x:((i*71+13)%997)/997,y:((i*137+83)%991)/991,speed:.4+(i%5)*.12,phase:i*2.399}));
 const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const ranges=[
  [[-.1,.73],[.04,.65],[.17,.44],[.25,.56],[.32,.51],[.43,.69],[.61,.47],[.7,.61],[.85,.41],[1.1,.7]],
  [[-.1,.9],[.08,.76],[.19,.68],[.28,.82],[.46,.61],[.57,.75],[.68,.69],[.83,.84],[1.1,.64]],
  [[-.1,1],[.12,.87],[.25,.93],[.43,.81],[.59,.9],[.72,.85],[.9,.96],[1.1,.86]]
 ];
 function ridge(layer,color){
  const points=ranges[layer],depth=[.45,.9,1.4][layer];ctx.save();ctx.translate(camera.x*depth,camera.y*depth*.4);
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-10,height+10);
  for(let part=0;part<points.length-1;part++){
   const [ax,ay]=points[part],[bx,by]=points[part+1],steps=Math.max(2,Math.ceil((bx-ax)*width/3));
   for(let i=0;i<steps;i++){const p=i/steps,x=(ax+(bx-ax)*p)*width,jag=(i%5===0?1:0)*(layer+1)*.45,y=(ay+(by-ay)*p)*height+jag;ctx.lineTo(Math.round(x),Math.round(y));}
  }
  ctx.lineTo(width+10,height+10);ctx.closePath();ctx.fill();
  if(layer===2){ctx.clip();for(let i=0;i<22;i++){const x=width*.28+(i*43)%(width*.76),y=height*.83+(i*17)%(height*.2);rect(x,y,2+i%3,1,'#2a202a');}}
  ctx.restore();
 }
 function distantTree(){
  const x=width*.075,y=height*.76;
  ctx.globalAlpha=.65;rect(x,y-13,1,14,'#2c222b');rect(x-5,y-10,6,1,'#2c222b');rect(x,y-12,5,1,'#2c222b');
  for(const [dx,dy,w] of [[-7,-13,6],[-2,-16,7],[4,-14,5],[-4,-10,6]])rect(x+dx,y+dy,w,2,'#38232d');ctx.globalAlpha=1;
 }
 function pagoda(x,y,size){
  for(let floor=0;floor<3;floor++){
   const yy=y-floor*size*.46,half=size*(.7-floor*.12);
   rect(x-half*.55,yy-size*.35,half*1.1,size*.32,'#201c20');
   rect(x-half,yy-size*.42,half*2,size*.09,'#2a2427');rect(x-half*1.16,yy-size*.37,half*2.32,size*.05,'#292126');
   for(let i=-1;i<=1;i++)rect(x+i*half*.34-1,yy-size*.23,2,size*.14,'#6a302b');
  }
  rect(x-size*.45,y,size*.9,size*.2,'#18181c');
 }
 function disc(x,y,r,color){
  for(let yy=-Math.ceil(r);yy<=r;yy++){
   const half=Math.floor(Math.sqrt(Math.max(0,r*r-yy*yy)));rect(x-half,y+yy,half*2+1,1,color);
  }
 }
 function eclipse(t,state){
  const {r,x,y}=geometry();
  const halo=ctx.createRadialGradient(x,y,r*.8,x,y,r*2.8);
  halo.addColorStop(0,`rgba(172,41,43,${.18+state.hover*.12+state.open*.1+state.scan*.18})`);halo.addColorStop(.45,`rgba(115,32,37,${.11+state.scan*.08})`);halo.addColorStop(1,'#11111300');
  ctx.fillStyle=halo;ctx.fillRect(x-r*3,y-r*3,r*6,r*6);
  // Three unequal flares break the silhouette without a separate circular outline.
  const flares=[[.65,3.6,.24],[3.4,2.8,.32],[4.95,5.3,.19]];
  ctx.fillStyle=state.scan>.2?'#8c3438':'#64292f';ctx.beginPath();
  for(let i=0;i<=96;i++){
   const a=i*Math.PI*2/96;
   let peak=0;for(const [center,length,spread] of flares){const d=Math.abs(Math.atan2(Math.sin(a-center),Math.cos(a-center)));peak+=Math.max(0,1-d/spread)**2*length;}
   const rr=r+peak*(.85+state.scan*.5+state.hover*.2)+Math.sin(a*7+.4)*.6,px=Math.round(x+Math.cos(a)*rr),py=Math.round(y+Math.sin(a)*rr);
   if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
  }
  ctx.closePath();ctx.fill();
  disc(x,y,r,'#d3453a');disc(x,y,r-1,'#a83236');
  ctx.save();ctx.beginPath();ctx.arc(x,y,r-1,0,Math.PI*2);ctx.clip();
  disc(x+state.open*r*2.15,y-state.open*r*.18,r-3,'#08090b');
  if(state.busy&&state.open>.85){ctx.globalAlpha=.14;rect(x-r+state.progress*r*5,y-r,1,r*2,'#ffe0a0');ctx.globalAlpha=1;}
  ctx.restore();
  if(state.hover>.01){
   ctx.globalAlpha=state.hover*.7;
   for(let i=-3;i<=3;i++){const a=lightAngle+i*.11;rect(x+Math.cos(a)*r,y+Math.sin(a)*r,1,1,'#ffb272');}
   for(let i=0;i<3;i++){const a=t*.32+i*2.094;rect(x+Math.cos(a)*(r+6),y+Math.sin(a)*(r+6),1,1,'#bb6046');}
   ctx.globalAlpha=1;
  }
  if(state.burst>0){
   ctx.globalAlpha=(1-state.burst)*.8;
   for(let i=0;i<12;i++){const a=i*Math.PI/6+.15,rr=r+4+state.burst*15;rect(x+Math.cos(a)*rr,y+Math.sin(a)*rr,1,i%3?1:2,'#db8558');}
   ctx.globalAlpha=1;
  }
  ctx.globalAlpha=.28+state.scan*.32+state.hover*.15;
  for(let i=0;i<14;i++){
   const a=i*Math.PI*2/14,rr=r+1;
   const length=[1,3,1,2,5,1,2,1,4,1,2,3,1,2][i];
   for(let step=0;step<length;step++)rect(x+Math.cos(a)*(rr+step),y+Math.sin(a)*(rr+step),1,1,step===0?'#f2a26c':'#b84c40');
  }
  ctx.globalAlpha=1;
  if(state.scan>.15){
   ctx.globalAlpha=state.scan*.55;
   for(let i=0;i<4;i++){const a=i*1.7+.3,drift=(t*.7+i*.37)%1,rr=r+5+drift*9;rect(x+Math.cos(a)*rr,y+Math.sin(a)*rr,1,1,'#bb654d');}
   ctx.globalAlpha=1;
  }
  ctx.globalAlpha=1;
 }
 function lantern(x,y,t,phase,open){
  rect(x,y-10,1,11,'#292029');rect(x-3,y-10,7,1,'#35252c');
  ctx.globalAlpha=.55+Math.sin(t*.45+phase)*.06+open*.35;
  rect(x-1,y-8,3,4,'#81342e');rect(x,y-7,1,2,'#b15b40');ctx.globalAlpha=1;
 }
 function gate(x,y){
  rect(x-8,y-14,17,2,'#30252b');rect(x-10,y-16,21,2,'#3a292d');
  rect(x-6,y-12,2,12,'#2c232a');rect(x+5,y-12,2,12,'#2c232a');rect(x-7,y-10,16,1,'#3b292e');
 }
 function valley(t,open){
  // Sparse midground details stay to the right, outside the emblem's clear rail.
  ctx.globalAlpha=.45;pagoda(width*.75,height*.77,11);ctx.globalAlpha=1;
  gate(width*.84,height*.94);pagoda(width*.95,height*.94,22);
  lantern(width*.89,height*.96,t,0,open);lantern(width*.99,height*.96,t,2,open);
  // Dark water and short broken reflections, rather than a bright decorative stripe.
  const waterY=Math.round(height*.965);rect(width*.68,waterY,width*.32,height-waterY,'#17151b');
  for(let i=0;i<8;i++){
   const y=waterY+i*2,x=width*.94+Math.sin(t*.18+i*1.4)*2,span=2+i*.85;
   ctx.globalAlpha=.48-i*.035;rect(x-span,y,span*1.3,1,i%3?'#4b272b':'#6c322d');rect(x+span*.6,y,span*.5,1,'#382229');
  }
  ctx.globalAlpha=1;
 }
 function mist(t,base,phase){
  const drift=Math.sin(t*.025+phase)*width*.018,y=height*base;
  for(let i=0;i<3;i++){
   const gradient=ctx.createLinearGradient(width*.12+drift,y,width,y);
   gradient.addColorStop(0,'#31273200');gradient.addColorStop(.5,`rgba(68,53,68,${.07-i*.015})`);gradient.addColorStop(1,'#31273200');
   ctx.fillStyle=gradient;ctx.fillRect(width*.12+drift,y+i*2,width*.9,2);
  }
 }
 function draw(now){
  const t=motion.matches?0:(now-origin)/1000,state=effect.sample(now,motion.matches);
  if(trigger){trigger.setAttribute('aria-busy',String(state.busy));trigger.dataset.phase=state.busy?'revealing':'idle';trigger.dataset.scanning=effect.scanTarget?'true':'false';trigger.setAttribute('aria-label',motion.matches&&state.open?'Restore eclipse':'Reveal the crimson moon');}
  const parallax=!motion.matches&&finePointer.matches;
  camera.x=parallax?camera.x+(camera.tx-camera.x)*.08:0;camera.y=parallax?camera.y+(camera.ty-camera.y)*.08:0;
  rect(0,0,width,height,'#111113');
  eclipse(t,state);
  ridge(0,'#17161b');mist(t,.69,0);ridge(1,'#211a23');distantTree();mist(t,.84,2);ridge(2,'#251d26');
  valley(t,state.open);
  for(let i=0;i<particles.length;i++){
   const p=particles[i],x=(p.x*width+t*p.speed*2)%(width+12)-6,y=p.y*height+Math.sin(t*.23+p.phase)*10;
   if(x<65&&y>height*.63)continue;
   const alpha=.3+.35*(.5+.5*Math.sin(t*.7+p.phase));ctx.globalAlpha=alpha;
   const shade=i%4===0?'#a45745':'#633239';rect(x,y,2,i%3===0?2:1,shade);rect(x-2,y+1,1,1,'#35222a');
  }
  ctx.globalAlpha=1;
 }
 function tick(now){frame=0;if(document.hidden||motion.matches)return;if(now-last>=1000/24){draw(now);last=now;}frame=requestAnimationFrame(tick);}
 function refresh(){cancelAnimationFrame(frame);frame=0;if(document.hidden)return;draw(performance.now());if(!motion.matches)frame=requestAnimationFrame(tick);}
 function updateHitArea(){
  if(!trigger)return;
  const {r,x,y}=geometry(),sx=innerWidth/width,sy=innerHeight/height,edge=(r+5)*2;
  const left=(x-edge/2)*sx,top=(y-edge/2)*sy,w=edge*sx,h=edge*sy;
  Object.assign(trigger.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
  const blocked=[...document.querySelectorAll('.results,.sidebar-panel')].some(el=>{const b=el.getBoundingClientRect();return left<b.right&&left+w>b.left&&top<b.bottom&&top+h>b.top;});
  trigger.disabled=blocked;trigger.style.pointerEvents=blocked?'none':'auto';
  if(blocked)effect.setHovered(false);
 }
 function resize(){width=Math.ceil(innerWidth/3);height=Math.ceil(innerHeight/3);canvas.width=width;canvas.height=height;updateHitArea();refresh();}
 trigger?.addEventListener('pointerenter',()=>{effect.setHovered(true);if(motion.matches)refresh();});
 trigger?.addEventListener('pointerleave',()=>{effect.setHovered(false);if(motion.matches)refresh();});
 trigger?.addEventListener('focus',()=>{effect.setHovered(true);if(motion.matches)refresh();});
 trigger?.addEventListener('blur',()=>{effect.setHovered(false);if(motion.matches)refresh();});
 trigger?.addEventListener('pointermove',ev=>{const b=trigger.getBoundingClientRect();lightAngle=Math.atan2(ev.clientY-b.y-b.height/2,ev.clientX-b.x-b.width/2);});
 trigger?.addEventListener('click',()=>{if(effect.activate(performance.now(),motion.matches))refresh();});
 document.addEventListener('preflight:activity',ev=>{effect.setScanning(Boolean(ev.detail?.running));if(motion.matches)refresh();});
 document.addEventListener('scroll',updateHitArea,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)effect.reset();updateHitArea();refresh();});
 motion.addEventListener('change',()=>{effect.reset();refresh();});
 window.addEventListener('pointermove',ev=>{if(!finePointer.matches||motion.matches||ev.pointerType==='touch')return;camera.tx=Math.max(-1,Math.min(1,ev.clientX/innerWidth*2-1));camera.ty=Math.max(-1,Math.min(1,ev.clientY/innerHeight*2-1));},{passive:true});
 document.documentElement.addEventListener('pointerleave',()=>{camera.tx=0;camera.ty=0;});
 finePointer.addEventListener('change',()=>{camera.tx=0;camera.ty=0;refresh();});
 window.addEventListener('resize',resize,{passive:true});window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});resize();
}
