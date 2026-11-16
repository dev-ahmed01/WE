
(()=>{
 const sec=document.getElementById('benefits');
 if(!sec)return;
 const lines=[...sec.querySelectorAll('.bn-heading-line')];
 const intro=sec.querySelector('.bn-head .section-intro');
 const rows=[...sec.querySelectorAll('.bn-row')];
 const pending=[];
 if(!Element.prototype.animate || matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const prep=(el,x,y,duration,delay)=>{
   if(!el)return null;
   el.style.opacity='0';el.style.transform=`translate(${x}px,${y}px)`;
   return {el,x,y,duration,delay};
 };
 const play=({el,x,y,duration,delay})=>{
   const frames=Array.from({length:61},(_,i)=>{
     const t=i/60,q=(1-t)**4;
     return {offset:t,opacity:1-q,transform:`translate(${x*q}px,${y*q}px)`};
   });
   const a=el.animate(frames,{duration,delay,fill:'both',easing:'linear'});
   a.onfinish=()=>{el.style.removeProperty('opacity');el.style.removeProperty('transform');a.cancel();};
 };
 const register=(el,threshold,items)=>pending.push({el,threshold,items:items.filter(Boolean),played:false});
 register(sec,.78,[...lines.map((el,i)=>prep(el,0,30,700,i*120)),prep(intro,0,20,600,570)]);
 rows.forEach(row=>{
   const dx=row.dataset.side==='right'?48:-48;
   register(row,.86,[
     prep(row.querySelector('.bn-row-photo'),-dx,0,750,0),
     prep(row.querySelector('.bn-row-heading'),0,26,600,450),
     prep(row.querySelector('.bn-row-desc'),0,18,600,750),
     prep(row.querySelector('.bn-row-points'),0,18,600,830)
   ]);
 });
 let raf=0;
 function check(){
   raf=0;
   for(const p of pending){if(!p.played && p.el.getBoundingClientRect().top<=innerHeight*p.threshold){p.played=true;p.items.forEach(play);}}
   if(pending.every(p=>p.played)){removeEventListener('scroll',schedule);removeEventListener('resize',schedule);}
 }
 function schedule(){if(!raf)raf=requestAnimationFrame(check);}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);schedule();
})();

