(function(){
if(!window.gsap||!window.ScrollTrigger)return;
gsap.registerPlugin(ScrollTrigger);
/* Section 6: pinned stacking card flip (long rectangular cards, smooth lerped scrub) */
(()=>{
 const sec=document.getElementById('benefits'); if(!sec||!window.gsap||!window.ScrollTrigger)return;
 const cards=[...sec.querySelectorAll('.bn-card')],dots=[...sec.querySelectorAll('.bn-dot')],N=cards.length,pin=sec.querySelector('.bn-pin'),stage=sec.querySelector('.bn-stage');
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 /* gentle in-out with a soft landing: smootherstep */
 const E=t=>t*t*t*(t*(t*6-15)+10);
 /* scroll position q -> card progress p: each card rests (reads) for the first part of its step, then flips */
 const qToP=q=>{const k=Math.floor(q);if(k>=N-1)return N-1;return k+clamp((q-k-.03)/.94,0,1)};
 const HOLD=.2,STEP=.55,SPAN=STEP*(N-1)/(STEP*(N-1)+HOLD);
 const mm=gsap.matchMedia();
 mm.add('(min-width:901px) and (min-height:480px)',()=>{
  /* by request the flip plays on every system, regardless of the OS animation setting */
  sec.classList.add('bn-live');
  let strip=56,cardH=300,stageH=420,top0=0,cur=0,target=0,last=-1;
  const bars=dots.map(b=>b.querySelector('.bn-dot-bar span')),prev=cards.map(()=>({}));
  function measure(){
   strip=cards[0].querySelector('.bn-strip').offsetHeight||50;
   stageH=stage.clientHeight;
   cardH=Math.round(clamp(stageH-3*strip,200,420));
   stage.style.setProperty('--cardh',cardH+'px');
   top0=Math.max(0,Math.round((stageH-(cardH+3*strip))*.35));
   last=-1;
  }
  function render(p){
   cards.forEach((c,i)=>{
    const a=i===0?1:clamp(p-(i-1),0,1),e=E(a),rest=top0+i*strip,pv=prev[i];
    if(i>0&&a<=0.0005){ if(!pv.hidden){c.style.visibility='hidden';pv.hidden=true} return }
    if(pv.hidden){c.style.visibility='';pv.hidden=false}
    const fly=Math.sin(Math.PI*e);
    const travel=Math.max(110,stageH*.5-rest);gsap.set(c,{transformPerspective:2200,rotationX:-360*(1-e),y:rest+(1-e)*travel,opacity:i===0?1:clamp(a/.18,0,1),scale:1+fly*.035,zIndex:i+1,force3D:true});
    const g=+(fly*.55).toFixed(2); if(pv.g!==g){pv.g=g;c.style.setProperty('--glare-o',g)}
    const bar=i===0?1:+clamp((a-.35)/.4,0,1).toFixed(2); if(pv.b!==bar){pv.b=bar;c.style.setProperty('--bar',bar)}
    const act=Math.round(p)===i; if(pv.act!==act){pv.act=act;c.style.pointerEvents=act?'auto':'none'}
   });
   const idx=Math.round(p);
   dots.forEach((b,i)=>{
    const w=(clamp(p-i+1,0,1)*100).toFixed(1)+'%'; if(bars[i].style.width!==w)bars[i].style.width=w;
    const on=i===idx; if(b.classList.contains('is-active')!==on){b.classList.toggle('is-active',on);on?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current')}
   });
  }
  /* one ticker lerps toward the scroll target: frame-rate independent, no tween restarts */
  const tick=(t,dt)=>{
   const d=target-cur; if(Math.abs(d)<.0004&&last===cur)return;
   cur=Math.abs(d)<.0004?target:cur+d*(1-Math.exp(-Math.min(dt,50)/1000*4.2));
   last=cur; render(cur);
  };
  measure(); render(0); last=0;
  gsap.ticker.add(tick);
  const trig=ScrollTrigger.create({trigger:pin,start:'top top',end:()=>'+='+Math.round(innerHeight*(STEP*(N-1)+HOLD)),pin:true,anticipatePin:1,invalidateOnRefresh:true,
   snap:window.__BN_NOSNAP?false:{snapTo:v=>Math.round(clamp(v/SPAN,0,1)*(N-1))/(N-1)*SPAN,duration:{min:.5,max:1},delay:.15,ease:'power2.inOut'},
   onRefreshInit:measure,
   onRefresh:s=>{target=qToP(clamp(s.progress/SPAN,0,1)*(N-1));cur=target;last=-1;render(cur);last=cur},
   onUpdate:s=>{target=qToP(clamp(s.progress/SPAN,0,1)*(N-1))}});
  const go=i=>{window.scrollTo({top:trig.start+(trig.end-trig.start)*SPAN*i/(N-1),behavior:'smooth'})};
  const hs=dots.map((b,i)=>{const h=()=>go(i);b.addEventListener('click',h);return [b,h]});
  return()=>{gsap.ticker.remove(tick);sec.classList.remove('bn-live');hs.forEach(([b,h])=>b.removeEventListener('click',h));gsap.set(cards,{clearProps:'all'});stage.style.removeProperty('--cardh');cards.forEach(c=>{['--bar','--glare-o'].forEach(k=>c.style.removeProperty(k));c.style.pointerEvents='';c.style.visibility=''});trig.kill()};
 });
 const listMM=gsap.matchMedia();
 listMM.add('((max-width:900px) or (max-height:479px)) and (prefers-reduced-motion: no-preference)',()=>{
  cards.forEach(c=>gsap.from(c,{y:40,opacity:0,duration:.7,ease:'power3.out',clearProps:'transform,opacity',scrollTrigger:{trigger:c,start:'top 88%',once:true}}));
 });
})();


})();;
(() => {
  const $ = (q) => document.querySelector(q);
  const nav = $('.nav'), menu = $('.mobile-menu'), links = $('.nav-links');
  if(menu) menu.addEventListener('click', () => { const on=links.classList.toggle('open');menu.setAttribute('aria-expanded',String(on)); });
  links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{ links.classList.remove('open');menu.setAttribute('aria-expanded','false'); }));
  document.querySelectorAll('[data-office],[data-service]').forEach(a=>a.addEventListener('click',()=>{
    const target=a.dataset.office||a.dataset.service;const sel=$('#interest');
    if([...sel.options].some(o=>o.value===target))sel.value=target;
    else sel.value='Other services';
    $('#interest-detail').value=target;
  }));
  const modal=$('#subscribe-modal');const subBtn=$('#open-subscribe');const closeBtn=$('#close-subscribe');
  const openModal=()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false');closeBtn.focus();document.body.style.overflow='hidden';};
  const closeModal=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';subBtn&&subBtn.focus();};
  subBtn&&subBtn.addEventListener('click',openModal);closeBtn.addEventListener('click',closeModal);
  modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeModal();});
  const sendWhatsApp=(msg,status,payload)=>EmlenLead.deliver(msg,payload||{},status).catch(()=>{});
  $('#enquiry-form').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget;
    if(!f.reportValidity())return;
    const msg=['Hello Workspace by Emlen, I would like to request a callback.','Name: '+f.elements.namedItem('fullName').value,'Phone: '+f.elements.namedItem('phone').value,'Work email: '+(f.elements.namedItem('email').value||'Not provided'),'Team size: '+f.elements.namedItem('team').value,'Interested in: '+f.elements.namedItem('interest').value,'Selected option: '+(f.elements.namedItem('detail').value||'Not specified')].join('\n');
    sendWhatsApp(msg,$('#enquiry-status'),{source:'category-south-bangalore',name:f.elements.namedItem('fullName').value,phone:f.elements.namedItem('phone').value,email:f.elements.namedItem('email').value,teamSize:f.elements.namedItem('team').value,interest:f.elements.namedItem('interest').value,detail:f.elements.namedItem('detail').value});
  });
  $('#subscribe-form').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget;
    if(!f.reportValidity())return;
    const download=$('#checklist-download');download.click();
    const status=$('#sub-msg');
    status.textContent='Your office checklist is downloading.';
    if($('#sub-consent').checked){
      const msg=['Hello Workspace by Emlen, I downloaded your office decision checklist and would like to hear about relevant workspace options.','Name: '+f.elements.name.value,'WhatsApp: '+f.elements.phone.value,'Team size: '+f.elements.team.value].join('\n');
      sendWhatsApp(msg,status,{source:'category-checklist',name:f.elements.name.value,phone:f.elements.phone.value,teamSize:f.elements.team.value});
    }
  });
})();;