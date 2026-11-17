(()=>{'use strict';
const cards=[...document.querySelectorAll('[data-card-variant="quadrant"] .we-hl__card')];
let touchMode=false;
document.addEventListener('pointerdown',event=>{
 touchMode=event.pointerType==='touch';
 if(touchMode&&!event.target.closest('[data-card-variant="quadrant"] .we-hl__card')) cards.forEach(card=>card.classList.remove('is-active'));
});
cards.forEach(card=>card.addEventListener('click',()=>{
 if(!touchMode)return;
 const active=card.classList.contains('is-active');
 cards.forEach(item=>item.classList.remove('is-active'));
 if(!active)card.classList.add('is-active');
}));
})();