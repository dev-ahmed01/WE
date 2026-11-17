(()=>{'use strict';
const selector='[data-card-variant="quadrant"] .we-hl__card';
const cards=[...document.querySelectorAll(selector)];
let touchMode=false;
function origin(card,event){
 const r=card.getBoundingClientRect();
 const x=event?Math.max(0,Math.min(r.width,event.clientX-r.left)):r.width/2;
 const y=event?Math.max(0,Math.min(r.height,event.clientY-r.top)):r.height/2;
 card.style.setProperty('--we-fill-x',x+'px');
 card.style.setProperty('--we-fill-y',y+'px');
 card.style.setProperty('--we-fill-size',(2*Math.hypot(Math.max(x,r.width-x),Math.max(y,r.height-y))+8)+'px');
}
document.addEventListener('pointerdown',event=>{
 touchMode=event.pointerType==='touch';
 if(touchMode&&!event.target.closest(selector))cards.forEach(card=>card.classList.remove('is-active'));
});
cards.forEach(card=>{
 card.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')origin(card,event)});
 card.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch')origin(card,event)});
 card.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')origin(card,event)});
 card.addEventListener('focus',()=>{if(card.matches(':focus-visible'))origin(card)});
 card.addEventListener('click',()=>{
  if(!touchMode)return;
  const active=card.classList.contains('is-active');
  cards.forEach(item=>item.classList.remove('is-active'));
  if(!active)card.classList.add('is-active');
 });
});
})();