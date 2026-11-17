/* Shared visual refinements: keep non-action controls and page-specific content intact. */
(()=>{
  const ns='http://www.w3.org/2000/svg', path='M9 5l7 7-7 7';
  const actions='a.btn-red,a.btn-yellow,a.we-btn--red,a.btn-line,a.we-btn--line,.em-nav__cta,.em-nav__mobile-cta,.hero .actions .button:first-child,.callback-btn,.submit-btn,.form-submit,.we-form button[type=submit],.lk-c,.dp a,.we-am__more,.we-pop__cta,.we-lc__cta,.ticket-unlock,.sol-link,.cz-cta,.consult-call,.lm-cta,.location-card,.other-pill,.office-tile';
  function icon(){
    const svg=document.createElementNS(ns,'svg'),p=document.createElementNS(ns,'path');
    for(const [k,v] of Object.entries({class:'we-action-chevron','aria-hidden':'true',focusable:'false',viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'2.8','stroke-linecap':'round','stroke-linejoin':'round'}))svg.setAttribute(k,v);
    p.setAttribute('d',path);svg.append(p);return svg;
  }
  function polish(el){
    if(el.closest('.em-nav-replaced')||el.matches('[inert]'))return;
    if(el.querySelector('svg.we-action-chevron,svg path[d="M9 5l7 7-7 7"]'))return;
    if(/sending|could not send|try again/i.test(el.textContent)&&el.matches('button[type=submit]'))return;
    const slots=el.querySelectorAll('.arr,.round-arrow,.pill-arr,.office-arrow,span[aria-hidden=true]');
    for(const slot of slots){
      if(/^[\s↗→➜›]+$/.test(slot.textContent)&&slot.textContent.trim()){
        slot.replaceChildren(icon());return;
      }
    }
    for(const s of el.querySelectorAll('svg')){
      const p=s.querySelector('path');
      if(p&&(/M7 17L17 7|M5 12h14M13 6|M9\.5 5\.5L16 12|M5 12h14|M7 17[L ]17 7/i.test(p.getAttribute('d')||''))){
        s.replaceWith(icon());return;
      }
    }
    for(const node of [...el.childNodes]){
      if(node.nodeType===Node.TEXT_NODE&&/[↗→➜›]/.test(node.textContent)){
        node.textContent=node.textContent.replace(/[↗→➜›]/g,'').trimEnd();
        el.append(icon());return;
      }
    }
    // Do not replace illustrations, card imagery, or meaningful standalone icons.
    if(el.matches('.location-card,.office-tile,.other-pill')||el.querySelector('svg'))return;
    el.append(icon());
  }
  const run=()=>document.querySelectorAll(actions).forEach(polish);
  let frame;
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(run)};
  run();
  new MutationObserver(records=>{
    if(records.some(r=>r.type==='childList'&&(r.target.closest?.(actions)||[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches(actions)||n.querySelector(actions))))))schedule();
  }).observe(document.body,{subtree:true,childList:true});
  // Workspaces starts with the H1; measure its visible lettering, not its box.
  // Home and One Person Office deliberately have different approved hero compositions.
  const hero=document.querySelector('#top.hp-b'),heroHeading=hero?.querySelector('h1'),nav=document.querySelector('.em-nav');
  const panel=document.querySelector('.we-form-main')?.closest('.we-form-panel');
  const layout=panel?.closest('.eq-w,.enquiry-grid,.why-layout');
  const sticky=layout?.querySelector(':scope > .glass-area')||panel;
  function measure(){
    if(!nav)return;
    const bottom=nav.getBoundingClientRect().bottom;
    document.documentElement.style.setProperty('--we-sticky-top',(bottom+20)+'px');
    if(hero&&heroHeading){
      const s=getComputedStyle(heroHeading),ctx=document.createElement('canvas').getContext('2d');
      ctx.font=s.fontWeight+' '+s.fontSize+' '+s.fontFamily;
      const label=s.textTransform==='uppercase'?heroHeading.textContent.trim().toUpperCase():heroHeading.textContent.trim();
      const m=ctx.measureText(label),line=parseFloat(s.lineHeight);
      const ink=Number.isFinite(m.fontBoundingBoxAscent)&&Number.isFinite(m.fontBoundingBoxDescent)?Math.max(0,(line-m.fontBoundingBoxAscent-m.fontBoundingBoxDescent)/2+m.fontBoundingBoxAscent-m.actualBoundingBoxAscent):5;
      const gap=heroHeading.getBoundingClientRect().top+scrollY-bottom+ink;
      const current=parseFloat(getComputedStyle(hero).paddingTop)||0;
      if(Math.abs(gap-80)>.5)hero.style.setProperty('--we-workspaces-hero-top',(current+80-gap)+'px');
      hero.dataset.visibleNavGap=String(Math.round((heroHeading.getBoundingClientRect().top+scrollY-bottom+ink)*10)/10);
    }
    if(layout&&sticky&&panel){
      layout.classList.add('we-enquiry-layout');
      layout.closest('section')?.classList.add('we-enquiry-section');
      const workspaces=!!hero;
      sticky.classList.toggle('we-sticky-enquiry',innerWidth>=1101&&(workspaces||panel.getBoundingClientRect().height+bottom+40<innerHeight));
      // Preserve a small sticky travel distance even when the optional enquiry
      // fields are taller than the left-side business cards.
      if(workspaces&&innerWidth>=1101)layout.style.setProperty('--we-enquiry-height',(panel.getBoundingClientRect().height+48)+'px');
    }
  }
  // Navigation is injected before these page scripts; also handle late font loads.
  const observer=new ResizeObserver(measure);
  if(nav)observer.observe(nav);
  if(heroHeading)observer.observe(heroHeading);
  if(panel)observer.observe(panel);
  addEventListener('resize',measure,{passive:true});
  document.fonts?.ready.then(measure);document.fonts?.addEventListener('loadingdone',measure);
  measure();
})();
