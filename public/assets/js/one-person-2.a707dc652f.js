/* Navigation glass, scroll depth and the values pour. Nothing here hides or duplicates page content. */
(()=>{
 const html=document.documentElement,nav=document.querySelector('.site-nav');
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

 /* Refraction at the glass edge. Only Chromium renders url() in backdrop-filter;
    other browsers keep the blur and saturation glass from the stylesheet. */
 const isChromium=!!(navigator.userAgentData&&navigator.userAgentData.brands.some(b=>/Chromium/.test(b.brand)))||/Chrome\//.test(navigator.userAgent);
 const mapNode=document.getElementById('nav-refract-map');
 function buildRefractionMap(){
  const r=nav.getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height);
  if(!w||!h)return;
  const edge=Math.min(11,h*.18),radius=Math.min(h/2,30);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="x"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#f00"/></linearGradient><linearGradient id="y" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#0f0"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="${edge*.7}"/></filter></defs><rect width="${w}" height="${h}" fill="url(#x)"/><rect width="${w}" height="${h}" fill="url(#y)" style="mix-blend-mode:screen"/><rect x="${edge}" y="${edge}" width="${w-edge*2}" height="${h-edge*2}" rx="${radius}" fill="#808080" filter="url(#b)"/></svg>`;
  mapNode.setAttribute('href','data:image/svg+xml,'+encodeURIComponent(svg));
  mapNode.setAttribute('width',w);mapNode.setAttribute('height',h);
 }
 if(isChromium&&mapNode){
  buildRefractionMap();html.classList.add('has-refraction');
  let queued=false;
  new ResizeObserver(()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;buildRefractionMap()})}}).observe(nav);
 }

 /* One lens glides between links; its leading edge moves first so it stretches like liquid. */
 const links=document.querySelector('.navlinks');
 if(links){
  const lens=document.createElement('span');lens.className='nav-lens';lens.setAttribute('aria-hidden','true');links.prepend(lens);
  const pos={l:0,r:0};let shown=false;
  const paint=()=>{lens.style.transform=`translateX(${pos.l}px)`;lens.style.width=`${pos.r-pos.l}px`};
  const moveTo=a=>{
   const l=a.offsetLeft,r=l+a.offsetWidth;
   if(!shown||matchMedia('(prefers-reduced-motion: reduce)').matches){gsap.killTweensOf(pos);pos.l=l;pos.r=r;paint();lens.style.opacity=1;shown=true;return}
   const right=r>pos.r;
   gsap.to(pos,{l,duration:right?.42:.24,ease:'power3.out',overwrite:'auto',onUpdate:paint});
   gsap.to(pos,{r,duration:right?.24:.42,ease:'power3.out',overwrite:'auto',onUpdate:paint});
  };
  links.querySelectorAll('a').forEach(a=>{a.addEventListener('pointerenter',()=>moveTo(a));a.addEventListener('focus',()=>moveTo(a))});
  const hide=()=>{lens.style.opacity=0;shown=false};
  links.addEventListener('pointerleave',hide);links.addEventListener('focusout',e=>{if(!links.contains(e.relatedTarget))hide()});
 }

 gsap.registerPlugin(ScrollTrigger);
 ScrollTrigger.create({start:48,end:'max',toggleClass:{targets:nav,className:'is-compact'}});

 /* Offer ticket: the sheen answers hover. */
 const ticket=document.querySelector('#home .hero-ticket'),sheen=document.querySelector('#home .ticket-sheen');
 if(ticket&&sheen)ticket.addEventListener('pointerenter',()=>{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)gsap.fromTo(sheen,{opacity:1,xPercent:-110},{xPercent:310,duration:.65,ease:'power2.inOut',overwrite:true,onComplete(){gsap.set(sheen,{opacity:0})}})});

 /* Values cards: an empty coloured layer is clipped by a moving wave edge. */
 const cards=[...document.querySelectorAll('#values .value-card')].map(card=>{
  const flood=document.createElement('div');flood.className='value-flood';flood.setAttribute('aria-hidden','true');card.prepend(flood);
  return {card,flood,parts:[...card.querySelectorAll('h3,p')],mid:[],w:0,h:0};
 });
 const measure=()=>cards.forEach(c=>{c.w=c.card.clientWidth;c.h=c.card.clientHeight;c.mid=c.parts.map(el=>el.offsetTop+el.offsetHeight*.5)});
 const WAVE=13,STEPS=26;
 const reset=c=>{c.flood.style.visibility='hidden';c.flood.style.clipPath='';c.parts.forEach(el=>el.classList.remove('is-over'));gsap.set(c.card,{clearProps:'y'})};
 function pour(c,p,seed){return;
  if(p<=0){c.flood.style.visibility='hidden';c.parts.forEach(el=>el.classList.remove('is-over'));return}
  c.flood.style.visibility='visible';
  const front=p*(c.h+WAVE*2)-WAVE;
  c.parts.forEach((el,i)=>el.classList.toggle('is-over',front>c.mid[i]));
  if(p>=1){c.flood.style.clipPath='none';return}
  const swell=WAVE*Math.pow(Math.sin(Math.PI*p),.7)+4*(1-p),phase=p*7+seed;
  const pts=[`0 0`,`${c.w}px 0`];
  for(let i=STEPS;i>=0;i--){
   const t=i/STEPS,y=front+swell*(.68*Math.sin(t*6.2+phase)+.32*Math.sin(t*12.4-phase*1.4));
   pts.push(`${(t*c.w).toFixed(1)}px ${y.toFixed(1)}px`);
  }
  c.flood.style.clipPath=`polygon(${pts.join(',')})`;
 }
 const lift=(c,p)=>{};
 /* Never part-filled on arrival, even when the row is already on screen. */
 const startAt=(el,at)=>Math.max(44,el.getBoundingClientRect().top+scrollY-innerHeight*at);

 const mm=gsap.matchMedia();

 /* Photo drifts slower than the page, behind the glass. Panel and ticket stay put so their spacing never changes. */
 mm.add('(prefers-reduced-motion: no-preference) and (min-width: 901px)',()=>{
  gsap.fromTo('#home .hero-photo img',{yPercent:0},{yPercent:4,ease:'none',immediateRender:false,scrollTrigger:{trigger:'#home',start:'top top',end:'bottom top',scrub:.4}});
 });

 mm.add('(prefers-reduced-motion: no-preference) and (min-width: 1001px)',()=>{
  const state={p:0},grid=document.querySelector('#values .values-grid');
  const draw=()=>cards.forEach((c,i)=>{const p=clamp((state.p-i*.12)/.64,0,1);pour(c,p,i*1.7);lift(c,p)});
  ScrollTrigger.addEventListener('refreshInit',measure);measure();
  const tween=gsap.to(state,{p:1,ease:'none',onUpdate:draw,scrollTrigger:{trigger:grid,start:()=>startAt(grid,.8),end:()=>startAt(grid,.8)+innerHeight*.55,scrub:.45,invalidateOnRefresh:true,onRefresh:()=>{measure();draw()}}});
  draw();
  return ()=>{ScrollTrigger.removeEventListener('refreshInit',measure);tween.kill();cards.forEach(reset)};
 });
 mm.add('(prefers-reduced-motion: no-preference) and (max-width: 1000px)',()=>{
  measure();
  const tweens=cards.map((c,i)=>{
   const state={p:0},draw=()=>pour(c,state.p,i*1.7);
   return gsap.to(state,{p:1,ease:'none',onUpdate:draw,scrollTrigger:{trigger:c.card,start:()=>startAt(c.card,.84),end:()=>startAt(c.card,.84)+innerHeight*.44,scrub:.4,invalidateOnRefresh:true,onRefresh:()=>{measure();draw()}}});
  });
  return ()=>{tweens.forEach(t=>t.kill());cards.forEach(reset)};
 });

 /* Pointer effect: slight tilt and a light that tracks the cursor. */
 mm.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (min-width: 1001px)',()=>{
  const off=cards.map(({card})=>{
   const shine=document.createElement('span');shine.className='value-shine';shine.setAttribute('aria-hidden','true');card.appendChild(shine);
   gsap.set(card,{transformPerspective:900});
   const rx=gsap.quickTo(card,'rotationX',{duration:.4,ease:'power3.out'}),ry=gsap.quickTo(card,'rotationY',{duration:.4,ease:'power3.out'});
   const move=e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;rx((.5-y)*5);ry((x-.5)*5);shine.style.setProperty('--mx',x*100+'%');shine.style.setProperty('--my',y*100+'%')};
   const leave=()=>{rx(0);ry(0)};
   card.addEventListener('pointermove',move);card.addEventListener('pointerleave',leave);
   return ()=>{card.removeEventListener('pointermove',move);card.removeEventListener('pointerleave',leave);shine.remove();gsap.set(card,{clearProps:'rotationX,rotationY,transformPerspective'})};
  });
  return ()=>off.forEach(f=>f());
 });

 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>ScrollTrigger.refresh());
 addEventListener('load',()=>ScrollTrigger.refresh());
})();

/* ---- Section 3: solution cards. The markup is complete without this; the script adds the form hand-off, pointer light and one reveal. ---- */
(()=>{
 const grid=document.querySelector('#options .sol-grid');
 if(!grid)return;
 const items=[...grid.querySelectorAll('.sol-item')],cards=[...grid.querySelectorAll('.sol-card')];
 const officeSelect=document.getElementById('officeSelect'),enquiry=document.getElementById('enquiry');
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

 cards.forEach(card=>{
  const link=card.querySelector('.sol-link'),glass=card.querySelector('.sol-glass');
  if(!link||!glass)return;
  /* Same hand-off the old buttons had: pick this office in the enquiry form, then scroll to it. Without JS the link still jumps to #enquiry. */
  link.addEventListener('click',e=>{
   if(!enquiry)return;
   e.preventDefault();
   if(officeSelect&&link.dataset.office)officeSelect.value=link.dataset.office;
   enquiry.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'});
   history.replaceState(null,'','#enquiry');
  });
  /* The whole card acts as the link for pointer users. */
  card.addEventListener('click',e=>{if(!e.target.closest('a'))link.click()});
  /* Light that follows the pointer across the glass. */
  card.addEventListener('pointermove',e=>{
   if(e.pointerType!=='mouse')return;
   const r=glass.getBoundingClientRect();
   glass.style.setProperty('--mx',clamp((e.clientX-r.left)/r.width*100,0,100)+'%');
   glass.style.setProperty('--my',clamp((e.clientY-r.top)/r.height*100,0,100)+'%');
  });
  card.addEventListener('pointerleave',()=>{glass.style.removeProperty('--mx');glass.style.removeProperty('--my')});
 });
 function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

 /* One reveal: the row rises in sequence while the photos settle. Moves the list items, so a highlighted card keeps its CSS lift. */
 const mm=gsap.matchMedia();
 mm.add('(prefers-reduced-motion: no-preference)',()=>{
  const trigger={trigger:grid,start:'top 86%',once:true};
  gsap.from(items,{y:44,opacity:0,duration:.8,ease:'power3.out',stagger:.09,clearProps:'transform,opacity',scrollTrigger:trigger});
  gsap.from(cards.map(c=>c.querySelector('.sol-bg')),{scale:1.14,duration:1.2,ease:'power2.out',stagger:.09,clearProps:'transform',scrollTrigger:trigger});
 });
})();

/* Section 4: guided finder */
(()=>{
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const f=document.getElementById('customise'); if(!f||!f.classList.contains('cz-section'))return;
 const sizes=[...f.querySelectorAll('[data-size]')],prefs=[...f.querySelectorAll('[data-pref]')];
 const title=f.querySelector('#customise-suggestion'),detail=f.querySelector('#customise-detail'),thumb=f.querySelector('.cz-thumb-img');
 const office={'Just me':'One Seater','2–4':'Two Seater','5–8':'Small Team Office','9+':'Small Team Office'};
 let team='Just me'; const picked=new Set();
 const list=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
 const photo=name=>{const l=document.querySelector('#options .sol-link[data-office="'+name+'"]');return l?l.closest('.sol-card').querySelector('.sol-bg'):null};
 function paint(){
  const o=office[team],who=team==='Just me'?'your own private office':'a team of '+team;
  title.textContent=o;
  const p=[...picked];
  detail.textContent=p.length?'Starting point for '+who+', with '+list(p.map(x=>x.toLowerCase()))+' to talk through.':'Choose what matters to you and we will add it to your enquiry.';
  const img=photo(o);
  if(img&&thumb&&thumb.dataset.o!==o){thumb.dataset.o=o;thumb.classList.add('is-swap');setTimeout(()=>{thumb.src=img.currentSrc||img.src;thumb.classList.remove('is-swap')},reduced()?0:160)}
 }
 sizes.forEach((b,i)=>b.addEventListener('click',()=>{team=b.dataset.size;b.parentElement.style.setProperty('--i',i);sizes.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));paint()}));
 prefs.forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.pref;picked.has(k)?picked.delete(k):picked.add(k);b.setAttribute('aria-pressed',String(picked.has(k)));paint()}));
 f.querySelector('#customise-enquire').addEventListener('click',()=>{
  const sel=document.getElementById('officeSelect'),req=document.getElementById('requirements');
  if(sel)sel.value=office[team];
  const msg='Office setup enquiry: '+team+(picked.size?'; interested in '+list([...picked].map(x=>x.toLowerCase()))+' customisation.':'.');
  if(req&&!req.value.includes(msg))req.value=(req.value.trim()?req.value.trim()+'\n':'')+msg;
  const t=document.getElementById('enquiry')||document.getElementById('why-us');
  t&&t.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'});
 });
 paint();
 if(thumb&&!thumb.dataset.o){const img=photo(office[team]);if(img){thumb.dataset.o=office[team];thumb.src=img.currentSrc||img.src}}
 if(!reduced()&&window.gsap&&window.ScrollTrigger){
  const els=f.querySelectorAll('.cz-intro>*,.cz-panel');
  gsap.from(els,{y:34,opacity:0,duration:.8,ease:'power3.out',stagger:.1,clearProps:'transform,opacity',scrollTrigger:{trigger:f,start:'top 78%',once:true}});
 }
})();

/* Section 5: lead magnet count-up */
(()=>{
 const n=document.querySelector('#consultation .lm-num'); if(!n||!window.gsap||!window.ScrollTrigger)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches; if(reduced)return;
 const banner=document.querySelector('#consultation .lm-banner'),to=+n.dataset.to,o={v:0};
 const copy=banner.querySelectorAll('.lm-copy>*'),offer=banner.querySelector('.lm-offer');
 gsap.set(copy,{y:26,opacity:0});gsap.set(offer,{y:40,opacity:0});
 gsap.timeline({scrollTrigger:{trigger:banner,start:'top 78%',once:true,refreshPriority:-1},defaults:{ease:'power3.out'}})
  .to(copy,{y:0,opacity:1,duration:.7,stagger:.08,clearProps:'transform,opacity'})
  .to(offer,{y:0,opacity:1,duration:.8,clearProps:'transform,opacity'},.15)
  .to(o,{v:to,duration:1.3,ease:'power2.out',onUpdate:()=>{n.textContent=Math.round(o.v)},onComplete:()=>{n.textContent=to}},.35);
 n.textContent='0';
})();

/* Section 6: benefits. Heading lines rise first, then each photo row slides in from its own side as it scrolls into view */
(()=>{
 const sec=document.getElementById('benefits'); if(!sec||!window.gsap||!window.ScrollTrigger)return;
 const lines=[...sec.querySelectorAll('.bn-heading-line')];
 const intro=sec.querySelector('.bn-head .section-intro');
 const rows=[...sec.querySelectorAll('.bn-row')];
 gsap.set(lines,{y:30,opacity:0});
 if(intro)gsap.set(intro,{y:20,opacity:0});
 rows.forEach(r=>gsap.set(r,{x:r.dataset.side==='right'?56:-56,opacity:0}));
 /* by request this reveal plays on every system, regardless of the OS animation setting */
 const tl=gsap.timeline({scrollTrigger:{trigger:sec,start:'top 78%',once:true}})
  .to(lines,{y:0,opacity:1,duration:.7,ease:'power3.out',stagger:.12,clearProps:'transform,opacity'});
 if(intro)tl.to(intro,{y:0,opacity:1,duration:.6,ease:'power3.out',clearProps:'transform,opacity'},'-=0.25');
 rows.forEach(r=>{
  gsap.to(r,{x:0,opacity:1,duration:.8,ease:'power3.out',clearProps:'transform,opacity',
   scrollTrigger:{trigger:r,start:'top 86%',once:true}});
 });
})();

/* Section 7: how to get started. The office draws itself, left to right, once it scrolls into view */
(()=>{
 const sec=document.getElementById('how-it-works'); if(!sec)return;
 const svg=sec.querySelector('.hs-scene'),steps=[...sec.querySelectorAll('.hs-step')];
 const parts=[...svg.querySelectorAll('.hs-draw')].map(el=>({el,s:+el.dataset.s,e:+el.dataset.e,f:el.dataset.f||null,t:-1,fo:-1}));
 const floor=svg.querySelector('.hs-floor'),marks=[...svg.querySelectorAll('.hs-mk')],ground=svg.querySelector('.hs-ground'),tip=svg.querySelector('.hs-tip'),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const TH=[.01,.13,.25],MK=[.27,.48,.69],END=.95,VW=svg.viewBox.baseVal.width||1800; let gt=-1;
 function render(p){
  parts.forEach(o=>{
   const t=clamp((p-o.s)/(o.e-o.s),0,1),tr=Math.round(t*500)/500;
   if(tr!==o.t){o.t=tr;o.el.style.strokeDashoffset=1-tr;o.el.style.opacity=tr>0?1:0}
   if(o.f){const fo=Math.round(clamp((p-o.e)/.05,0,1)*20)/20;if(fo!==o.fo){o.fo=fo;o.el.style.fill=fo>0?o.f:'none';o.el.style.fillOpacity=fo}}
  });
  const g=clamp(p/END,0,1);
  if(g!==gt){gt=g;ground.style.strokeDasharray=1;ground.style.strokeDashoffset=1-g;tip.setAttribute('cx',(g*VW).toFixed(1));floor.setAttribute('width',(g*VW).toFixed(1));tip.style.opacity=g>=1?0:1}
  steps.forEach((s,i)=>s.classList.toggle('is-on',p>=TH[i]));
  marks.forEach((m,i)=>m.classList.toggle('is-on',p>=MK[i]));
  sec.classList.toggle('hs-done',p>=END);
 }
 const finish=()=>{parts.forEach(o=>{o.el.style.strokeDashoffset=0;o.el.style.opacity=1;if(o.f){o.el.style.fill=o.f;o.el.style.fillOpacity=1}});ground.style.strokeDasharray='none';floor.setAttribute('width',String(VW));tip.style.display='none';steps.forEach(s=>s.classList.add('is-on'));marks.forEach(m=>m.classList.add('is-on'));sec.classList.add('hs-done')};
 if(matchMedia('(prefers-reduced-motion: reduce)').matches||!window.gsap||!window.ScrollTrigger){finish();return}
 sec.classList.add('hs-js'); render(0);
 const o={p:0};let tween=null,armed=true;
 const play=()=>{
  if(!armed)return; armed=false;
  tween=gsap.to(o,{p:1,duration:1.4,delay:0,ease:'power1.inOut',onUpdate:()=>render(o.p),onComplete:()=>{render(1);tip.style.display='none'}});
 };
 /* back to the empty room once the section has fully left the screen, so it replays on return */
 const reset=()=>{
  if(tween){tween.kill();tween=null}
  o.p=0;gt=-1;parts.forEach(q=>{q.t=-1;q.fo=-1});tip.style.display='';tip.style.opacity=1;render(0);armed=true;
 };
 /* plays once, the first time the section comes on screen */
 let lastCheck=0;
 const tick=(time)=>{
  if(time-lastCheck<.08)return; lastCheck=time;
  const r=sec.getBoundingClientRect(),h=innerHeight;
  if(armed&&r.top<h*(innerWidth>800?.72:.82)&&r.bottom>0){play();gsap.ticker.remove(tick)}
 };
 gsap.ticker.add(tick);
 /* safety net: if the page opens with the section already on screen */
 setTimeout(()=>{const r=sec.getBoundingClientRect();if(armed&&r.top<innerHeight*.5&&r.bottom>innerHeight*.5)play()},1200);
})();;