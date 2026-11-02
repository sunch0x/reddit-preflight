const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
export class EclipseMotion{
 constructor(){this.reset();}
 reset(){this.started=null;this.staticOpen=false;this.hovered=false;this.hover=0;this.last=null;this.scanTarget=this.scanTarget||0;this.scan=this.scanTarget;}
 setScanning(value){this.scanTarget=value?1:0;}
 setHovered(value){this.hovered=value;}
 activate(now,reduced){
  if(reduced){this.started=null;this.staticOpen=!this.staticOpen;return true;}
  if(this.started!==null&&now-this.started<2600)return false;
  this.staticOpen=false;this.started=now;return true;
 }
 sample(now,reduced){
  const dt=this.last===null?0:Math.min(100,Math.max(0,now-this.last));this.last=now;
  this.hover=reduced?0:this.hover+((this.hovered?1:0)-this.hover)*(1-Math.exp(-dt/130));
  this.scan=reduced?this.scanTarget:this.scan+(this.scanTarget-this.scan)*(1-Math.exp(-dt/360));
  if(reduced)return {scan:this.scan,open:this.staticOpen?1:0,hover:0,burst:0,progress:0,busy:false};
  if(this.started===null)return {scan:this.scan,open:0,hover:this.hover,burst:0,progress:0,busy:false};
  const elapsed=Math.max(0,now-this.started);
  if(elapsed>=2600){this.started=null;return {scan:this.scan,open:0,hover:this.hover,burst:0,progress:0,busy:false};}
  return {scan:this.scan,open:elapsed<700?smooth(elapsed/700):elapsed<1200?1:1-smooth((elapsed-1200)/1400),hover:this.hover,burst:elapsed>=500&&elapsed<1800?(elapsed-500)/1300:0,progress:elapsed/2600,busy:true};
 }
}

// Two brief passes in a 36-second cycle, with a long unobstructed interval.
export function cloudPass(seconds,layer,reduced){
 if(reduced)return null;
 const elapsed=((seconds%36)+36)%36-12-layer*1.2,duration=layer?5.6:6;
 if(elapsed<=0||elapsed>=duration)return null;
 const p=elapsed/duration;
 return {drift:-4.3+p*8.6,alpha:smooth(p/.12)*smooth((1-p)/.12)};
}
