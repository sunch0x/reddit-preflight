// Low-resolution procedural pixel scenery. One capped loop, no WebGL or external assets.
export function startAmbient(){
 const canvas=document.getElementById('ambient-world');if(!canvas)return;
 const ctx=canvas.getContext('2d',{alpha:false}),motion=matchMedia('(prefers-reduced-motion: reduce)');
 let width=0,height=0,frame=0,last=0,origin=performance.now();
 const particles=Array.from({length:22},(_,i)=>({x:((i*71+13)%997)/997,y:((i*137+83)%991)/991,speed:.4+(i%5)*.12,phase:i*2.399}));
 const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 function ridge(base,seed,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,height);for(let x=0;x<=width+8;x+=8){const y=base+Math.sin(x*.025+seed)*14+Math.sin(x*.061+seed)*5;ctx.lineTo(x,Math.round(y/3)*3);}ctx.lineTo(width,height);ctx.closePath();ctx.fill();}
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
 function eclipse(t){
  const r=width<250?8:14,x=width-r-9,y=r+9;
  const halo=ctx.createRadialGradient(x,y,r*.8,x,y,r*2.3);
  halo.addColorStop(0,'#ac292b32');halo.addColorStop(.5,'#8f20231c');halo.addColorStop(1,'#11111300');
  ctx.fillStyle=halo;ctx.fillRect(x-r*3,y-r*3,r*6,r*6);
  disc(x,y,r+3,'#482026');disc(x,y,r+1,'#a43135');disc(x,y,r,'#eb5140');disc(x,y,r-1,'#bc3435');disc(x,y,r-3,'#08090b');
  // Quiet uneven corona, with only a slight breathing change in intensity.
  ctx.globalAlpha=.35+Math.sin(t*.55)*.05;
  for(let i=0;i<14;i++){
   const a=i*Math.PI*2/14,rr=r+1;
   rect(x+Math.cos(a)*rr,y+Math.sin(a)*rr,1,i%3===0?3:1,'#f4774d');
  }
  ctx.globalAlpha=1;
 }
 function lantern(x,y,t,phase){
  rect(x,y-10,1,11,'#292029');rect(x-3,y-10,7,1,'#35252c');
  ctx.globalAlpha=.55+Math.sin(t*.45+phase)*.06;
  rect(x-1,y-8,3,4,'#81342e');rect(x,y-7,1,2,'#b15b40');ctx.globalAlpha=1;
 }
 function gate(x,y){
  rect(x-8,y-14,17,2,'#30252b');rect(x-10,y-16,21,2,'#3a292d');
  rect(x-6,y-12,2,12,'#2c232a');rect(x+5,y-12,2,12,'#2c232a');rect(x-7,y-10,16,1,'#3b292e');
 }
 function valley(t){
  // Sparse midground details stay to the right, outside the emblem's clear rail.
  ctx.globalAlpha=.45;pagoda(width*.75,height*.77,11);ctx.globalAlpha=1;
  gate(width*.84,height*.94);pagoda(width*.95,height*.94,22);
  lantern(width*.89,height*.96,t,0);lantern(width*.99,height*.96,t,2);
  // Dark water and short broken reflections, rather than a bright decorative stripe.
  const waterY=Math.round(height*.965);rect(width*.68,waterY,width*.32,height-waterY,'#17151b');
  for(let i=0;i<8;i++){
   const y=waterY+i*2,x=width*.94+Math.sin(t*.18+i*1.4)*2,span=2+i*.85;
   ctx.globalAlpha=.48-i*.035;rect(x-span,y,span*1.3,1,i%3?'#4b272b':'#6c322d');rect(x+span*.6,y,span*.5,1,'#382229');
  }
  ctx.globalAlpha=1;
 }
 function fog(t){
  for(let layer=0;layer<3;layer++){
   const y=height*(.78+layer*.065),drift=Math.sin(t*.035+layer)*width*.025;
   const gradient=ctx.createLinearGradient(width*.3+drift,y,width,y);
   gradient.addColorStop(0,'#29232c00');gradient.addColorStop(.5,'#34303b0d');gradient.addColorStop(1,'#29232c00');
   ctx.fillStyle=gradient;ctx.fillRect(width*.3+drift,y,width*.7,3+layer*2);
  }
 }
 function draw(now){
  const t=motion.matches?0:(now-origin)/1000;
  rect(0,0,width,height,'#111113');
  eclipse(t);
  ridge(height*.64,1.3,'#17161a');ridge(height*.81,3.1,'#1a171d');ridge(height*.95,5.1,'#1d191f');
  valley(t);fog(t);
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
 function resize(){width=Math.ceil(innerWidth/3);height=Math.ceil(innerHeight/3);canvas.width=width;canvas.height=height;refresh();}
 document.addEventListener('visibilitychange',refresh);motion.addEventListener('change',refresh);window.addEventListener('resize',resize,{passive:true});window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});resize();
}
