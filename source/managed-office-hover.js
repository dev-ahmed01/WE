/* Cursor-following spotlight on the four approved yellow feature cards.
   No red fill, no global event listeners, and no forced animation on touch. */
(() => {
  if (!window.matchMedia || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  document.querySelectorAll('.hero .cards .card').forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = Math.max(0,Math.min(100,(event.clientX-rect.left)*100/rect.width));
      const y = Math.max(0,Math.min(100,(event.clientY-rect.top)*100/rect.height));
      card.style.setProperty('--spot-x', x.toFixed(1)+'%');
      card.style.setProperty('--spot-y', y.toFixed(1)+'%');
    }, {passive:true});
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--spot-x');
      card.style.removeProperty('--spot-y');
    }, {passive:true});
  });
})();