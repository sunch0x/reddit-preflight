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
  const r=width<250?10:19,x=width*.91,y=Math.max(r+8,Math.min(height*.12,38));
  const halo=ctx.createRadialGradient(x,y,r*.8,x,y,r*2.7);
  halo.addColorStop(0,'#a827293d');halo.addColorStop(.5,'#8f202326');halo.addColorStop(1,'#11111300');
  ctx.fillStyle=halo;ctx.fillRect(x-r*3,y-r*3,r*6,r*6);
  disc(x,y,r+3,'#482026');disc(x,y,r+1,'#a43135');disc(x,y,r,'#eb5140');disc(x,y,r-1,'#bc3435');disc(x,y,r-3,'#08090b');
  // Quiet uneven corona, with only a slight breathing change in intensity.
  ctx.globalAlpha=.5+Math.sin(t*.55)*.08;
  for(let i=0;i<14;i++){
   const a=i*Math.PI*2/14,rr=r+1;
   rect(x+Math.cos(a)*rr,y+Math.sin(a)*rr,1,i%3===0?3:1,'#f4774d');
  }
  ctx.globalAlpha=1;
 }
 function draw(now){
  const t=motion.matches?0:(now-origin)/1000;
  rect(0,0,width,height,'#111113');
  eclipse(t);
  ridge(height*.62,1.3,'#18161b');ridge(height*.8,3.1,'#1c181d');ridge(height*.94,5.1,'#201b20');
  pagoda(width*.94,height*.94,25);
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
