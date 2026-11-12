(()=>{
'use strict';
const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
const esc = (s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
let lastFocus=null;
function showOverlay(modal,focus){lastFocus=document.activeElement;modal.classList.add('open');modal.hidden=false;modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');(focus || $('button',modal))?.focus();}
function hideOverlay(modal){modal.classList.remove('open');modal.hidden=true;modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');if(lastFocus&&lastFocus.isConnected)lastFocus.focus();}
const gallery = {
'All Photos':[
 ['/assets/img/jayanagar-workspace-8305969a.jpg','Reception & coworking'],['/assets/img/one-person-office-dfb5956b.webp','One Person Office'],['/assets/img/jp-nagar-workspace-7a871d3c.webp','Meeting Room'],['/assets/img/bannerghatta-road-workspace-e85c27e2.webp','Open Workspace'],['/assets/img/arekere-workspace-f3cbd409.webp','Full Floor Office'],['/assets/img/welcome-area-712a74c1.webp','Welcome Area'],['/assets/img/private-meeting-room-ca25c712.webp','Private Meeting Room'],['/assets/img/workstations-2d09a12b.jpg','Workstations'],['/assets/img/meeting-space-dee1cf8a.jpg','Meeting Space'],['/assets/img/community-work-17db361c.jpg','Community & Work']
],
'Private Offices':[['/assets/img/one-person-office-dfb5956b.webp','One Person Office'],['/assets/img/arekere-workspace-f3cbd409.webp','Full Floor Office'],['/assets/img/bannerghatta-road-workspace-e85c27e2.webp','Large Team Office'],['/assets/img/private-meeting-room-ca25c712.webp','Private Meeting Space'],['/assets/img/workstations-2d09a12b.jpg','Flexible Office']],
'Coworking':[['/assets/img/workstations-2d09a12b.jpg','Coworking Area'],['/assets/img/bannerghatta-road-workspace-e85c27e2.webp','Shared Workstations'],['/assets/img/welcome-area-712a74c1.webp','Reception'],['/assets/img/arekere-workspace-f3cbd409.webp','Lounge'],['/assets/img/jayanagar-workspace-8305969a.jpg','Community Spaces']],
'Meeting Rooms':[['/assets/img/jp-nagar-workspace-7a871d3c.webp','Meeting Room'],['/assets/img/private-meeting-room-ca25c712.webp','Day Office Meeting'],['/assets/img/meeting-space-dee1cf8a.jpg','Meeting Area'],['/assets/img/arekere-workspace-f3cbd409.webp','Collaboration Space'],['/assets/img/community-work-17db361c.jpg','Workspace Interior']]
};
let galleryCategory='All Photos';
{ /* ===== Section 2 — Photos: grid + categorized lightbox ===== */
const reduceG=matchMedia('(prefers-reduced-motion: reduce)');
const CATS=[['All Photos','All photos'],['Private Offices','Private offices'],['Coworking','Coworking'],['Meeting Rooms','Meeting rooms']];
const SHORT=Object.fromEntries(CATS);
const EASE='cubic-bezier(.22,1,.36,1)';
let cat='All Photos',idx=0,isOpen=false,token=0,lastFocus=null,hideTimer=0,bgFlip=false,bgSrc='';
const root=$('#weGal'),grid=$('#weGalGrid'),lb=$('#lightbox'),gDock=$('#gDock'),lbDock=$('#lbDock');
const img=$('#lbImg'),frame=$('#lbFrame'),stage=$('#lbStage'),thumbs=$('#lbThumbs');
const bgs=[$('#lbBgA'),$('#lbBgB')];
const pad=n=>String(n).padStart(2,'0');

/* ---- category dock (one component, two places) ---- */
const docks=[gDock,lbDock];
docks.forEach(el=>{
  el.innerHTML='<span class="we-dock__thumb" aria-hidden="true"></span>'+CATS.map(([k,l])=>`<button type="button" data-cat="${esc(k)}" aria-pressed="false"><span>${esc(l)}</span></button>`).join('');
  el.addEventListener('click',e=>{const b=e.target.closest('button[data-cat]');if(b)setCat(b.dataset.cat);});
});
function syncDock(el,smooth){
  const thumb=el.firstElementChild;
  el.querySelectorAll('button').forEach(b=>{
    const on=b.dataset.cat===cat;b.setAttribute('aria-pressed',on?'true':'false');b.classList.toggle('is-on',on);
    if(on&&b.offsetWidth){
      thumb.style.setProperty('--tx',b.offsetLeft+'px');thumb.style.setProperty('--tw',b.offsetWidth+'px');
      if(el.scrollWidth>el.clientWidth+2)el.scrollTo({left:b.offsetLeft-(el.clientWidth-b.offsetWidth)/2,behavior:smooth&&!reduceG.matches?'smooth':'auto'});
    }
  });
}
const syncDocks=smooth=>docks.forEach(d=>syncDock(d,smooth));

/* ---- grid ---- */
grid.innerHTML=[0,1,2,3,4].map(i=>`<button type="button" class="we-tile" style="--i:${i}" data-i="${i}"><img decoding="async" alt=""></button>`).join('');
const tiles=[...grid.children];
function paintTile(t,i){
  const list=gallery[cat],p=list[i],im=t.firstElementChild;
  im.src=p[0];im.alt='';t.setAttribute('aria-label',`Open ${p[1]} in the gallery (${SHORT[cat]}, photo ${i+1} of ${list.length})`);
}
function swapTiles(){
  tiles.forEach((t,i)=>{
    const im=t.firstElementChild;im.getAnimations().forEach(a=>a.cancel());
    if(reduceG.matches){paintTile(t,i);return;}
    const out=im.animate([{opacity:1},{opacity:0}],{duration:130,easing:'ease-in',fill:'forwards'});
    out.onfinish=()=>{paintTile(t,i);im.animate([{opacity:0,transform:'scale(1.05)'},{opacity:1,transform:'scale(1)'}],{duration:420,delay:i*45,easing:EASE,fill:'backwards'});out.cancel();};
  });
}
tiles.forEach((t,i)=>{paintTile(t,i);t.addEventListener('click',()=>openLB(i,t));});

function setCat(k){
  if(k===cat||!gallery[k])return;
  cat=k;galleryCategory=k;idx=0;syncDocks(true);swapTiles();
  if(isOpen){buildThumbs();show(0,0);}
}

/* reveal on scroll */
if('IntersectionObserver' in window&&document.documentElement.classList.contains('we-motion')){
  const io=new IntersectionObserver(([e])=>{if(!e.isIntersecting)return;io.disconnect();root.classList.add('is-in');setTimeout(()=>root.classList.add('is-done'),1500);},{threshold:.12});
  io.observe(root);
}else root.classList.add('is-in','is-done');

/* ---- lightbox ---- */
function buildThumbs(){
  thumbs.innerHTML=gallery[cat].map((p,i)=>`<button type="button" class="we-lb__thumb" data-i="${i}" aria-label="Photo ${i+1}: ${esc(p[1])}"><img src="${p[0]}" alt=""></button>`).join('');
}
thumbs.addEventListener('click',e=>{const b=e.target.closest('.we-lb__thumb');if(!b)return;const i=+b.dataset.i;if(i!==idx)show(i,i>idx?1:-1);});
const CAP=2.4;
function fit(src){
  const w=src.naturalWidth,h=src.naturalHeight;if(!w||!h)return;
  const s=Math.min(frame.clientWidth/w,frame.clientHeight/h,CAP);
  img.style.width=Math.round(w*s)+'px';img.style.height=Math.round(h*s)+'px';
}
function setBg(src){
  if(src===bgSrc)return;bgSrc=src;
  const nxt=bgs[bgFlip?0:1],cur=bgs[bgFlip?1:0];bgFlip=!bgFlip;
  nxt.src=src;nxt.classList.add('is-on');cur.classList.remove('is-on');
}
async function show(i,dir,instant){
  const list=gallery[cat],n=list.length;idx=((i%n)+n)%n;
  const [src,label]=list[idx],my=++token;
  $('#lbKicker').textContent=SHORT[cat];$('#lbTitle').textContent=label;
  $('#lbCount').textContent=pad(idx+1)+' / '+pad(n);$('#lbBar').style.transform=`scaleX(${(idx+1)/n})`;
  [...thumbs.children].forEach((b,k)=>{b.classList.toggle('is-on',k===idx);if(k===idx)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
  const on=thumbs.children[idx];
  if(on)thumbs.scrollTo({left:on.offsetLeft-(thumbs.clientWidth-on.offsetWidth)/2,behavior:instant||reduceG.matches?'auto':'smooth'});
  setBg(src);
  const pre=new Image();pre.src=src;try{await pre.decode();}catch(e){}
  if(my!==token)return;
  const swap=()=>{img.src=src;img.alt=label;fit(pre);};
  if(instant||reduceG.matches||!isOpen){swap();img.getAnimations().forEach(a=>a.cancel());}
  else{
    const cur=+getComputedStyle(img).opacity||1,old=img.getAnimations();
    const out=img.animate([{opacity:cur},{opacity:0,transform:`translateX(${-dir*40}px) scale(.985)`}],{duration:150,easing:'ease-in',fill:'forwards'});
    old.forEach(a=>a.cancel());
    try{await out.finished;}catch(e){return;}
    if(my!==token)return;
    swap();
    img.animate([{opacity:0,transform:`translateX(${dir*52}px) scale(.985)`},{opacity:1,transform:'none'}],{duration:420,easing:EASE});
    out.cancel();
  }
  [idx+1,idx-1].forEach(k=>{const p=list[((k%n)+n)%n];const im=new Image();im.src=p[0];});
}
const step=d=>show(idx+d,d);

function setBackdropInert(on){
  [...document.body.children].forEach(c=>{
    if(c===lb||c.tagName==='SCRIPT'||c.tagName==='STYLE')return;
    if(on){if(!c.inert){c.inert=true;c.dataset.weInert='1';}}
    else if(c.dataset.weInert){c.inert=false;delete c.dataset.weInert;}
  });
}
function openLB(i,trigger){
  if(isOpen)return;
  clearTimeout(hideTimer);isOpen=true;lastFocus=trigger||document.activeElement;
  const sbw=innerWidth-document.documentElement.clientWidth;
  document.documentElement.style.overflow='hidden';if(sbw>0)document.body.style.paddingRight=sbw+'px';
  lb.hidden=false;lb.setAttribute('aria-hidden','false');
  lbDock.classList.remove('is-ready');syncDock(lbDock);buildThumbs();idx=i;bgSrc='';
  show(i,0,true);
  void lb.offsetWidth;lb.classList.add('is-open');
  requestAnimationFrame(()=>lbDock.classList.add('is-ready'));
  setBackdropInert(true);
  $('#lbClose').focus({preventScroll:true});
}
function closeLB(){
  if(!isOpen)return;
  isOpen=false;token++;lb.classList.remove('is-open');lb.setAttribute('aria-hidden','true');
  setBackdropInert(false);
  document.documentElement.style.overflow='';document.body.style.paddingRight='';
  if(lastFocus&&lastFocus.isConnected)lastFocus.focus({preventScroll:true});
  hideTimer=setTimeout(()=>{lb.hidden=true;},reduceG.matches?0:340);
}
$('#lbClose').addEventListener('click',closeLB);
$('#lbPrev').addEventListener('click',()=>step(-1));
$('#lbNext').addEventListener('click',()=>step(1));
stage.addEventListener('click',e=>{if(e.target===stage||e.target===frame)closeLB();});

document.addEventListener('keydown',e=>{
  if(!isOpen)return;
  if(e.key==='Escape'){e.preventDefault();closeLB();}
  else if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}
  else if(e.key==='ArrowRight'){e.preventDefault();step(1);}
  else if(e.key==='Home'){e.preventDefault();show(0,-1);}
  else if(e.key==='End'){e.preventDefault();show(gallery[cat].length-1,1);}
  else if(e.key==='Tab'){
    const f=$$('button',lb).filter(b=>b.offsetParent!==null);if(!f.length)return;
    const first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    else if(!lb.contains(document.activeElement)){e.preventDefault();first.focus();}
  }
});

/* swipe (touch / pen) */
let sx=0,sy=0,sid=null;
stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||e.target.closest('button'))return;sid=e.pointerId;sx=e.clientX;sy=e.clientY;});
stage.addEventListener('pointerup',e=>{if(e.pointerId!==sid)return;sid=null;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.3)step(dx<0?1:-1);});
stage.addEventListener('pointercancel',()=>{sid=null;});

/* layout */
let rz=0;
addEventListener('resize',()=>{cancelAnimationFrame(rz);rz=requestAnimationFrame(()=>{if(isOpen&&img.naturalWidth)fit(img);syncDocks(false);});});
syncDocks(false);requestAnimationFrame(()=>docks[0].classList.add('is-ready'));
document.fonts&&document.fonts.ready.then(()=>syncDocks(false));
}

const pillType={'Private Office':'Private Office','Coworking':'Coworking','Meeting Rooms':'Meeting Rooms','Event Space':'Other','Day Pass':'Coworking','Virtual Office':'Other'};
$$('.cat-pill').forEach(btn=>btn.addEventListener('click',()=>{const label=$('span',btn).textContent.trim();$$('.cat-pill').forEach(x=>{x.classList.toggle('active',x===btn);x.setAttribute('aria-pressed',String(x===btn));});
  const t=$('#type');if(t){try{t.value=pillType[label]||'Private Office';}catch(e){}}
  setTimeout(()=>{const e=$('#enquiry');if(e)e.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});},280);}));
// Location exploration — no invented travel times, no unconfirmed street addresses
const locations=[
 {name:'Jayanagar',img:'/assets/img/jayanagar-workspace-8305969a.jpg',address:'Jayanagar 3rd Block, Bengaluru',landmarks:['Jayanagar Metro','South End Circle','Jayanagar shopping district'],map:'Workspace by Emlen, Jayanagar 3rd Block Bengaluru',exact:true},
 {name:'JP Nagar',img:'/assets/img/jp-nagar-workspace-7a871d3c.webp',address:'JP Nagar, Bengaluru',landmarks:['JP Nagar business neighbourhood','Metro connections','Dining & everyday essentials'],map:'JP Nagar Bengaluru',exact:false},
 {name:'Bannerghatta Road',img:'/assets/img/bannerghatta-road-workspace-e85c27e2.webp',address:'Bannerghatta Road, Bengaluru',landmarks:['Bannerghatta Road corridor','Nearby business hubs','Food & daily essentials'],map:'Bannerghatta Road Bengaluru',exact:false},
 {name:'Arekere',img:'/assets/img/arekere-workspace-f3cbd409.webp',address:'Arekere, Bengaluru',landmarks:['Arekere neighbourhood','Main road connectivity','Nearby conveniences'],map:'Arekere Bengaluru',exact:false}
];
let locationIdx=0;
const locRoot=$('#weLc'),locList=$('#weLcList'),locPhotos=$('#weLcPhotos'),locCard=$('#weLcCard'),locNear=$('#weLcNear'),locFrame=$('#locationMap');
const LOC_ARROW='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const LOC_OUT='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>';
locList.insertAdjacentHTML('beforeend',locations.map((l,i)=>`<button type="button" class="we-lc__row" role="tab" data-loc="${i}" style="--i:${i+1}"><span class="we-lc__th"><img src="${l.img}" alt="" loading="lazy"></span><span class="we-lc__rt"><b>${esc(l.name)}</b><span>${esc(l.address)}</span></span><span class="we-lc__go">${LOC_ARROW}</span></button>`).join(''));
locPhotos.innerHTML=locations.map((l,i)=>`<img src="${l.img}" alt="" loading="lazy">`).join('');
/* DISTANCES: only figures with a source are shown. Jayanagar walking times: public listing for the Jayanagar centre
   (South End Circle station 7 min walk, Jayanagar station 8 min walk). Add more as 'Landmark name':'N min walk' (or '650 m') per location.
   Landmarks without a figure show a "Find on map" link instead of an invented number. */
const locDist={'Jayanagar':{'Jayanagar Metro':'8 min walk','South End Circle':'7 min walk'}};
const locQuery=l=>l.map||(l.name+', Bengaluru, Karnataka, India');
const locUrl=l=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(locQuery(l));
function placeLocThumb(){const b=locList.querySelector('[aria-selected="true"]');if(!b||getComputedStyle(locList.querySelector('.we-lc__thumb')).display==='none')return;
  locList.style.setProperty('--th',b.offsetHeight+'px');locList.style.setProperty('--ty',b.offsetTop+'px');requestAnimationFrame(()=>requestAnimationFrame(()=>locList.classList.add('is-ready')));}
function renderLocations(){
  const l=locations[locationIdx];
  $$('.we-lc__row',locList).forEach((b,i)=>{const on=i===locationIdx;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
  $$('img',locPhotos).forEach((im,i)=>im.classList.toggle('is-on',i===locationIdx));
  locCard.innerHTML=`<span class="we-lc__eb" style="--k:0">Explore this workspace</span><h3 style="--k:1">${esc(l.name)}</h3><p class="we-lc__addr" style="--k:2">${esc(l.address)}</p>
<a class="we-lc__cta" style="--k:3" href="${locUrl(l)}" target="_blank" rel="noopener noreferrer"><span>Get directions</span><i>${LOC_OUT}</i></a>`;
  const dd=locDist[l.name]||{};
  locNear.innerHTML=`<h4 style="--k:0">Nearby landmarks</h4><ul class="we-lc__lm" aria-label="Nearby landmarks">${l.landmarks.map((x,k)=>{const d=dd[x];
    const tail=d?`<span class="we-lc__d">${esc(d)}</span>`:`<a class="we-lc__find" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x+' '+l.name+' Bengaluru')}" target="_blank" rel="noopener noreferrer">Find on map</a>`;
    return `<li style="--k:${k+1}"><b>${esc(x)}</b>${tail}</li>`;}).join('')}</ul><p class="we-lc__note" style="--k:4">Approximate walking times from this centre.</p>`;
  const u='https://maps.google.com/maps?q='+encodeURIComponent(locQuery(l))+'&t=&z=14&ie=UTF8&iwloc=&output=embed';
  if(locFrame.dataset.src!==u){locFrame.dataset.src=u;locFrame.src=u;}
  locFrame.title='Map showing '+l.name+', Bengaluru';
  $('#mapAreaLabel').textContent=l.name;$('#mapExternalLink').href=locUrl(l);
  placeLocThumb();
  const r=locList.querySelector('[aria-selected="true"]');
  if(r){const L=r.offsetLeft-locList.offsetLeft,R=L+r.offsetWidth;
    if(L-8<locList.scrollLeft)locList.scrollTo({left:Math.max(0,L-8),behavior:'smooth'});else if(R+8>locList.scrollLeft+locList.clientWidth)locList.scrollTo({left:R+8-locList.clientWidth,behavior:'smooth'});}
}
function locListState(){if(window.locNav)window.locNav();const v=locList.scrollWidth>locList.clientWidth+2;
  locList.classList.toggle('has-more',v);locList.classList.toggle('at-end',v&&locList.scrollLeft+locList.clientWidth>=locList.scrollWidth-4);}
locList.addEventListener('scroll',()=>requestAnimationFrame(locListState),{passive:true});
addEventListener('resize',locListState);
locList.addEventListener('click',e=>{const b=e.target.closest('[data-loc]');if(b){locationIdx=Number(b.dataset.loc);renderLocations();}});
locList.addEventListener('keydown',e=>{const n=locations.length;let k=-1;if(e.key==='ArrowDown'||e.key==='ArrowRight')k=(locationIdx+1)%n;else if(e.key==='ArrowUp'||e.key==='ArrowLeft')k=(locationIdx-1+n)%n;else if(e.key==='Home')k=0;else if(e.key==='End')k=n-1;
  if(k>=0){e.preventDefault();locationIdx=k;renderLocations();locList.querySelectorAll('.we-lc__row')[k].focus();}});
addEventListener('resize',placeLocThumb);document.fonts&&document.fonts.ready.then(placeLocThumb);
(()=>{const head=document.querySelector('.we-lc__head');
  if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;if(e.target===head)head.classList.add('is-in');else{locRoot.classList.add('is-in');setTimeout(()=>locRoot.classList.add('is-done'),1500);}io.unobserve(e.target);}),{threshold:.12});io.observe(head);io.observe(locRoot);}
  else{head.classList.add('is-in');locRoot.classList.add('is-in','is-done');}})();
renderLocations();locListState();document.fonts&&document.fonts.ready.then(locListState);
(()=>{const pv=$('#weLcPrev'),nx=$('#weLcNext');if(!pv||!nx)return;
  window.locNav=()=>{pv.disabled=locList.scrollLeft<=2;nx.disabled=locList.scrollLeft+locList.clientWidth>=locList.scrollWidth-2;};
  const go=d=>{const r=locList.querySelector('.we-lc__row');if(r)locList.scrollBy({left:d*(r.offsetWidth+14)*2,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});};
  pv.addEventListener('click',()=>go(-1));nx.addEventListener('click',()=>go(1));window.locNav();})();
const solutionData={
 'Private Office':[
 {name:'One Person Office',img:'/assets/img/one-person-office-dfb5956b.webp',desc:'A quiet, private workspace to focus on what matters.',chips:['Private workspace','Move-in ready']},
 {name:'Small Team Office',img:'/assets/img/jp-nagar-workspace-7a871d3c.webp',desc:'A comfortable team base without the setup overhead.',chips:['Team-ready','Managed support']},
 {name:'Large Team Office',img:'/assets/img/bannerghatta-road-workspace-e85c27e2.webp',desc:'More space to collaborate, plan and keep growing.',chips:['Room to grow','Flexible setup']},
 {name:'Full Floor Office',img:'/assets/img/arekere-workspace-f3cbd409.webp',desc:'A dedicated workspace for larger teams and operations.',chips:['Dedicated floor','Tailored options']}
 ],
 'Coworking':[
 {name:'Dedicated Desk',img:'/assets/img/workstations-2d09a12b.jpg',desc:'Keep a familiar desk in a shared professional environment.',chips:['Regular workspace','Community']},
 {name:'Coworking Access Plans',img:'/assets/img/bannerghatta-road-workspace-e85c27e2.webp',desc:'Flexible access for hybrid work and changing schedules.',chips:['Flexible access','Work-ready']},
 {name:'Day Pass',img:'/assets/img/welcome-area-712a74c1.webp',desc:'Get a professional place to work whenever you need one.',chips:['Day access','Convenient setup']}
 ],
 'Meeting Rooms':[
 {name:'Meeting Rooms',img:'/assets/img/jp-nagar-workspace-7a871d3c.webp',desc:'A dedicated setting for team and client conversations.',chips:['Professional setting','Flexible booking']},
 {name:'Training Rooms',img:'/assets/img/private-meeting-room-ca25c712.webp',desc:'A comfortable space for workshops and group sessions.',chips:['Group sessions','Adaptable seating']}
 ],
 'Additional':[
 {name:'Virtual Office',img:'/assets/img/one-person-office-dfb5956b.webp',desc:'Build a professional business presence with a lighter footprint.',chips:['Business presence','Flexible option']},
 {name:'Day Office',img:'/assets/img/private-meeting-room-ca25c712.webp',desc:'Use a private workspace for the day when you need extra focus.',chips:['Private space','Day access']},
 {name:'Event Space',img:'/assets/img/arekere-workspace-f3cbd409.webp',desc:'A flexible environment for hosting professional gatherings.',chips:['Events','Flexible formats']},
 {name:'Enterprise & GCC',img:'/assets/img/bannerghatta-road-workspace-e85c27e2.webp',desc:'Discuss tailored workspace needs for larger organisations.',chips:['Custom plans','Larger teams']}
 ]
};
/* ---- Workspaces section: carousel of private offices + "Office spaces at {location}" ---- */
(()=>{
const sel=$('#spSelect'),track=$('#spTrack'),tabsEl=$('#spTabs'),card=$('#spCard'),title=$('#spTitle'),head=$('#spHead'),prev=$('#spPrev'),next=$('#spNext');
if(!sel||!track)return;
let cat='Private Office',item=0;
const ICONS=['<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V8l8-5 8 5v13M9 21v-6h6v6"/></svg>','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'];
const motion=()=>matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth';
const loc=()=>locations[locationIdx];
function quote(name,type){
  const l=loc(),t=$('#type');if(t){try{t.value=type;}catch(e){}}
  const m=$('#message');if(m)m.value=`I am interested in ${name} at ${l.name}. Please contact me with availability and a quote.`;
  const e=$('#enquiry');if(e)e.scrollIntoView({behavior:motion()});setTimeout(()=>{const n=$('#name');if(n)n.focus({preventScroll:true});},650);
}
sel.innerHTML=locations.map((l,i)=>`<option value="${i}">${esc(l.name)}</option>`).join('');
const po=solutionData['Private Office'];
track.innerHTML=po.map((v,i)=>`<article class="lx-loc" role="listitem"><span class="lx-pic"><img src="${v.img}" alt="${esc(v.name)}" loading="lazy"></span><span class="lx-name">${esc(v.name)}</span><p class="lx-desc">${esc(v.desc)}</p><div class="lx-meta"><span>${esc(v.chips[0])}</span><em>Pricing on request</em></div><button type="button" class="lx-btn" data-q="${i}">Get a quote</button></article>`).join('');
tabsEl.innerHTML=Object.keys(solutionData).map(k=>`<button type="button" class="lx-tab" role="tab" data-cat="${esc(k)}">${esc(k==='Additional'?'Additional Solutions':k)}</button>`).join('');
function detail(swap){
  const l=loc(),items=solutionData[cat],it=items[item]||items[0];
  title.innerHTML=`Office spaces at <span>${esc(l.name)}</span>`;
  $$('.lx-tab',tabsEl).forEach(b=>{const on=b.dataset.cat===cat;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
  const chips=[it.chips[0],it.chips[1],l.name+' centre'];
  card.innerHTML=`<div class="lx-ph"><img src="${it.img}" alt="${esc(it.name)} at ${esc(l.name)}"></div>
<div class="lx-body"><h3>${esc(it.name)}</h3>
${items.length>1?`<div class="lx-items" role="group" aria-label="Options">${items.map((x,i)=>`<button type="button" class="lx-item" data-item="${i}" aria-pressed="${i===item}">${esc(x.name)}</button>`).join('')}</div>`:''}
<p>${esc(it.desc)}</p>
<div class="lx-chips">${chips.map((c,i)=>`<span class="lx-chip"><i>${ICONS[i]}</i>${esc(c)}</span>`).join('')}</div>
<div class="lx-price"><b>Pricing on request</b> · shared after a quick call</div>
<div class="lx-actions"><button type="button" class="lx-btn" data-enq>Get a quote</button><a class="lx-btn is-ghost" href="${locUrl(l)}" target="_blank" rel="noopener noreferrer">Get directions</a></div>
<div class="lx-foot">Availability varies by centre. Our team confirms details before you commit.</div></div>`;
  if(swap){card.classList.remove('is-swap');void card.offsetWidth;card.classList.add('is-swap');}
}
function sync(swap){
  const l=loc();sel.value=String(locationIdx);
  head.innerHTML=`Private offices in <span class="accent">${esc(l.name)}.</span>`;
  detail(swap);
}
window.spSync=sync;
function arrows(){const max=track.scrollWidth-track.clientWidth-2;prev.disabled=track.scrollLeft<=2;next.disabled=track.scrollLeft>=max;}
function step(d){const c=track.children[0];if(c)track.scrollBy({left:d*(c.offsetWidth+18),behavior:motion()});}
prev.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
track.addEventListener('scroll',()=>requestAnimationFrame(arrows),{passive:true});addEventListener('resize',arrows);
track.addEventListener('click',e=>{const b=e.target.closest('[data-q]');if(b)quote(po[Number(b.dataset.q)].name,'Private Office');});
sel.addEventListener('change',()=>{locationIdx=Number(sel.value);renderLocations();sync(true);});
tabsEl.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;cat=b.dataset.cat;item=0;detail(true);});
tabsEl.addEventListener('keydown',e=>{const ks=Object.keys(solutionData),n=ks.length,i=ks.indexOf(cat);let k=-1;
  if(e.key==='ArrowRight')k=(i+1)%n;else if(e.key==='ArrowLeft')k=(i-1+n)%n;else if(e.key==='Home')k=0;else if(e.key==='End')k=n-1;
  if(k>=0){e.preventDefault();cat=ks[k];item=0;detail(true);const t=tabsEl.querySelectorAll('.lx-tab')[k];if(t)t.focus();}});
card.addEventListener('click',e=>{
  const it=e.target.closest('[data-item]');if(it){item=Number(it.dataset.item);detail(true);const f=card.querySelector('.lx-item[aria-pressed="true"]');if(f)f.focus({preventScroll:true});return;}
  if(e.target.closest('[data-enq]')){const items=solutionData[cat],v=items[item]||items[0];quote(v.name,cat==='Additional'?'Other':cat);}
});
/* keep in step with the Locations section below */
locList.addEventListener('click',()=>sync(true));
locList.addEventListener('keydown',()=>setTimeout(()=>sync(true),0));
sync(false);arrows();document.fonts&&document.fonts.ready.then(arrows);
})();

// Testimonials: equal-sized cards, continuous left-to-right motion, reduced-motion and pause support
const reviews=[
 {tag:'Genuine support',quote:'Their professionalism and attention to detail make a noticeable difference in the overall experience.',initial:'S',name:'Saritha Kumari',role:'Henry Harvin Education'},
 {tag:'Thoughtful spaces',quote:'The space is modern, clean, and well-equipped.',initial:'J',name:'Jnanesh K',role:'Workspace visitor'},
 {tag:'Great location',quote:'The best you can ask for in the heart of Jayanagar, near main road, yet very quiet.',initial:'S',name:'Saandeep K Das',role:'Upman Placements Pvt Ltd'},
 {tag:'Everyday comfort',quote:'Excellent workplace in Jayanagar 3rd block.',initial:'K',name:'K Anand Anand',role:'Workspace visitor'}
];
const track=$('#marqueeTrack'),rail=$('#marqueeShell'),pauseBtn=$('#toggleMotion');
const firstSet=document.createElement('div');firstSet.className='marquee-set';firstSet.innerHTML=reviews.map(t=>`<article class="t-card glass-strong"><div class="t-top"><span class="t-badge">${esc(t.tag)}</span><span class="quote-mark" aria-hidden="true">“</span></div><blockquote>“${esc(t.quote)}”</blockquote><div class="t-author"><span class="mono" aria-hidden="true">${t.initial}</span><span><strong>${esc(t.name)}</strong><small>${esc(t.role)}</small></span></div></article>`).join('');track.appendChild(firstSet);
const reduce=window.matchMedia('(prefers-reduced-motion:reduce)');let period=0,offset=0,paused=false,currentSpeed=0,lastTime=0,dragging=false,lastX=0,lastPointerT=0,velocity=0,inertia=0;
function measureMarquee(){track.querySelectorAll('.marquee-set:not(:first-child)').forEach(n=>n.remove());period=firstSet.getBoundingClientRect().width;if(!period)return;const copies=Math.max(3,Math.ceil((rail.clientWidth+period)/period)+1);for(let i=1;i<copies;i++){const clone=firstSet.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.inert=true;track.appendChild(clone)}offset=((offset%period)+period)%period;}
function setMotionLabel(){pauseBtn.textContent=paused?'▶ Resume motion':'Ⅱ Pause motion';pauseBtn.setAttribute('aria-pressed',String(paused));}
pauseBtn.addEventListener('click',()=>{paused=!paused;setMotionLabel();});setMotionLabel();
rail.addEventListener('pointerdown',e=>{if(reduce.matches||e.button!==0)return;dragging=true;lastX=e.clientX;lastPointerT=performance.now();inertia=0;velocity=0;rail.classList.add('dragging');rail.setPointerCapture(e.pointerId);});rail.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX;offset+=dx;const now=performance.now();velocity=dx/Math.max(now-lastPointerT,1)*16.67;lastX=e.clientX;lastPointerT=now;});function releaseDrag(){if(!dragging)return;dragging=false;rail.classList.remove('dragging');inertia=Math.max(-14,Math.min(14,velocity));}rail.addEventListener('pointerup',releaseDrag);rail.addEventListener('pointercancel',releaseDrag);
function frame(now){const dt=Math.min(45,Math.max(0,now-(lastTime||now)));lastTime=now;if(period&&!reduce.matches){const base=44;const target=(paused||document.hidden)?0:(rail.matches(':hover')?6:base);currentSpeed+=(target-currentSpeed)*Math.min(1,dt/520);if(!dragging){offset+=currentSpeed*dt/1000+inertia;inertia*=Math.pow(.9,dt/16.67);if(Math.abs(inertia)<.02)inertia=0;}offset=((offset%period)+period)%period;track.style.transform=`translate3d(${offset-period}px,0,0)`;}else{track.style.transform='none';}requestAnimationFrame(frame);}new ResizeObserver(measureMarquee).observe(rail);measureMarquee();requestAnimationFrame(frame);reduce.addEventListener('change',()=>{if(reduce.matches){track.style.transform='none';}});
// The demo form has client-side validation, but cannot send until a backend/CRM endpoint is connected.
$('#enquiryForm').addEventListener('submit',e=>{e.preventDefault();const name=$('#name'),phone=$('#phone'),status=$('#formStatus');if(!name.value.trim()){name.setCustomValidity('Please enter your name.');name.reportValidity();name.setCustomValidity('');return;}if(!/^[+\d][\d\s()+-]{7,19}$/.test(phone.value.trim())){phone.setCustomValidity('Enter a valid phone number.');phone.reportValidity();phone.setCustomValidity('');return;}const msg=['Hello Workspace by Emlen, I would like a callback about workspace options.','Name: '+name.value.trim(),'Phone: '+phone.value.trim(),'Team size: '+($('#team').value||'Not specified'),'Workspace type: '+($('#type').value||'Not specified'),'Requirements: '+($('#message').value.trim()||'None')].join('\n');EmlenLead.deliver(msg,{source:'workspaces',name:name.value.trim(),phone:phone.value.trim(),teamSize:$('#team').value,workspaceType:$('#type').value,requirements:$('#message').value.trim()},status).then(()=>{status.scrollIntoView({block:'nearest',behavior:'smooth'})}).catch(()=>{status.scrollIntoView({block:'nearest',behavior:'smooth'})});});
// FAQ: five accordions, all closed on load to match selected design
const faqs=[
 ['What workspace options are available?','Explore private offices, coworking, meeting rooms and flexible workspace options. The best choice depends on your team size, preferred location and working style.'],
 ['Can I choose a short-term plan?','There are flexible options for different needs. Our team can confirm available terms and minimum commitments for your chosen workspace.'],
 ['Are the offices fully furnished?','Our managed office options are designed to be move-in ready. Exact furniture, facilities and inclusions depend on the office and plan you select.'],
 ['Which locations can I choose from?','Our current featured neighbourhoods are Jayanagar, JP Nagar, Bannerghatta Road and Arekere. Ask our team about exact addresses and current availability.'],
 ['How quickly can I move in?','It depends on the office you choose, availability and any requested changes. The team can confirm the expected move-in date after understanding your needs.']
];
const faqList=$('#faqList');faqList.innerHTML=faqs.map((f,i)=>`<div class="faq-item"><button class="faq-q" type="button" aria-expanded="false" aria-controls="faq-answer-${i}" id="faq-control-${i}"><span>${esc(f[0])}</span><span class="plus" aria-hidden="true">+</span></button><div class="faq-a" id="faq-answer-${i}" role="region" aria-labelledby="faq-control-${i}"><p>${esc(f[1])}</p></div></div>`).join('');$$('.faq-q',faqList).forEach(btn=>btn.addEventListener('click',()=>{const item=btn.closest('.faq-item'),wasOpen=item.classList.contains('open');$$('.faq-item',faqList).forEach(el=>{el.classList.remove('open');$('.faq-q',el).setAttribute('aria-expanded','false');$('.faq-a',el).style.maxHeight='0px';});if(!wasOpen){item.classList.add('open');btn.setAttribute('aria-expanded','true');$('.faq-a',item).style.maxHeight=$('.faq-a',item).scrollHeight+'px';}}));
})();;
(()=>{'use strict';const cards=[...document.querySelectorAll('#highlights .highlight-card')];
const motionOff=window.matchMedia('(prefers-reduced-motion:reduce)');let scheduled=false;
function frame(){scheduled=false;const h=window.innerHeight||800;
cards.forEach((card,i)=>{const rect=card.getBoundingClientRect();
 const progress=motionOff.matches?1:Math.max(0,Math.min(1,(h*.89-rect.top-i*24)/(h*.49)));
 const copy=Math.max(0,Math.min(1,(progress-.58)*3.2));
 card.style.setProperty('--fill',progress.toFixed(3));card.style.setProperty('--copy-visibility',copy.toFixed(3));
});}
function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(frame)}
window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue,{passive:true});
if(motionOff.addEventListener)motionOff.addEventListener('change',queue);queue();
})();;
(()=>{'use strict';
  const hero=document.querySelector('.we-hero'),nav=document.getElementById('weNav');
  if(!hero)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'),desk=matchMedia('(min-width:1280px)');
  const $=id=>document.getElementById(id);
  const card=$('weCard'),stage=$('weStage'),talk=$('weTalk'),cord=$('weCord');
  const line=$('weCordLine'),pulse=$('weCordPulse'),topG=$('weCordTopG'),topRip=$('weCordTopRipple'),eye=$('weCordEye'),eyeRip=$('weCordEyeRipple');
  const anchor=card&&card.querySelector('.we-card__anchor'),edge=card&&card.querySelector('.we-card__edge');
  const hasCord=!!(cord&&card&&talk&&anchor&&line);

  /* ---------- Cord: "Talk to our team" button → glass card ---------- */
  const geo={x0:0,y0:0,rx:0,ry:0};let following=false;
  const offsetIn=(n,root)=>{let x=0,y=0;while(n&&n!==root){x+=n.offsetLeft;y+=n.offsetTop;n=n.offsetParent;}return{x,y};};
  const pathD=(ex,ey)=>{const{x0,y0}=geo,y1=ey-6;if(Math.abs(ex-x0)<1.5)return`M${x0} ${y0}L${ex} ${y1}`;const k=(y1-y0)*.5;return`M${x0} ${y0}C${x0} ${y0+k} ${ex} ${y1-k} ${ex} ${y1}`;};
  const draw=(ex,ey)=>{const d=pathD(ex,ey);line.setAttribute('d',d);pulse.setAttribute('d',d);eye.setAttribute('transform',`translate(${ex} ${ey})`);};
  function layout(){
    if(!hasCord)return;
    if(!desk.matches){cord.classList.remove('is-on');return;}
    const b=talk.getBoundingClientRect(),hr=hero.getBoundingClientRect(),o=offsetIn(card,hero),cw=card.offsetWidth;
    geo.x0=b.left+b.width/2;geo.y0=b.bottom;                           /* nav is fixed: same at any scroll */
    const cl=hr.left+o.x,ax=Math.max(48,Math.min(cw-48,geo.x0-cl));    /* attach point on the card's top edge */
    card.style.setProperty('--ax',ax+'px');
    geo.rx=cl+ax;geo.ry=hr.top+scrollY+o.y;
    cord.style.height=(hr.top+scrollY+hero.offsetHeight)+'px';
    topG.setAttribute('transform',`translate(${geo.x0} ${geo.y0})`);
    if(!following)draw(geo.rx,geo.ry);
    if(hero.classList.contains('is-in'))cord.classList.add('is-on');
  }
  /* while the card drops in, the cord pays out and always ends at the card's attach point */
  function follow(ms){
    following=true;const t0=performance.now();
    const tick=()=>{const r=anchor.getBoundingClientRect();draw(r.left+r.width/2,r.top+r.height/2+scrollY);
      if(performance.now()-t0<ms)requestAnimationFrame(tick);else{following=false;draw(geo.rx,geo.ry);}};
    tick();
  }
  const ripple=n=>{if(!n||reduce.matches)return;n.animate([{transform:'scale(1)',opacity:.75},{transform:'scale(3.2)',opacity:0}],{duration:700,easing:'cubic-bezier(.2,.7,.3,1)'});};
  const sweep=()=>{if(!edge||reduce.matches)return;const cw=card.offsetWidth,ax=parseFloat(card.style.getPropertyValue('--ax'))||cw/2;
    edge.animate([{clipPath:`inset(0 ${cw-ax}px 0 ${ax}px)`,opacity:1},{clipPath:'inset(0 0 0 0)',opacity:1,offset:.55},{clipPath:'inset(0 0 0 0)',opacity:0}],{duration:1000,easing:'cubic-bezier(.2,.7,.3,1)'});};
  /* a short red pulse travels the cord; on arrival the end ripples */
  function firePulse(dir){
    if(reduce.matches||!hasCord||!cord.classList.contains('is-on'))return;
    pulse.getAnimations().forEach(a=>a.cancel());
    const f=dir>0?[{strokeDashoffset:.16,opacity:1},{strokeDashoffset:-1,opacity:1}]:[{strokeDashoffset:-1,opacity:1},{strokeDashoffset:.16,opacity:1}];
    pulse.animate(f,{duration:560,easing:'cubic-bezier(.4,0,.2,1)'}).onfinish=()=>{if(dir>0){ripple(eyeRip);sweep();}else ripple(topRip);};
  }
  const nudge=()=>{if(reduce.matches||!desk.matches)return;
    card.animate([{transform:'rotate(0deg)'},{transform:'rotate(-.8deg)',offset:.3},{transform:'rotate(.45deg)',offset:.62},{transform:'rotate(0deg)'}],{duration:800,easing:'ease-in-out'});};
  if(hasCord){
    /* hovering either end lights the other: button ⇄ card */
    const on=()=>{card.classList.add('is-linked');firePulse(1);nudge();},off=()=>card.classList.remove('is-linked');
    talk.addEventListener('mouseenter',on);talk.addEventListener('focus',on);talk.addEventListener('mouseleave',off);talk.addEventListener('blur',off);
    card.addEventListener('mouseenter',()=>{talk.classList.add('is-linked');firePulse(-1);});
    card.addEventListener('mouseleave',()=>talk.classList.remove('is-linked'));
    setInterval(()=>{if(desk.matches&&!reduce.matches&&!document.hidden&&scrollY<60&&hero.classList.contains('is-done'))firePulse(1);},6500);
    let lr=0;const relayout=()=>{if(lr)return;lr=requestAnimationFrame(()=>{lr=0;layout();});};
    addEventListener('resize',relayout);
    if('ResizeObserver' in window){const ro=new ResizeObserver(relayout);ro.observe(stage);ro.observe(hero);}
    if(desk.addEventListener)desk.addEventListener('change',relayout);
    document.fonts&&document.fonts.ready.then(relayout);addEventListener('load',relayout);
  }

  /* ---------- 1A entrance — starts once fonts are ready (max 700ms) so lines never re-wrap mid-animation ---------- */
  const start=()=>{if(hero.classList.contains('is-in'))return;layout();
    requestAnimationFrame(()=>{hero.classList.add('is-in');layout();
      if(hasCord&&desk.matches)follow(1500);
      setTimeout(()=>hero.classList.add('is-done'),1500);
      setTimeout(()=>{if(hasCord&&desk.matches){ripple(eyeRip);sweep();}},1400);});};
  if(document.documentElement.classList.contains('we-motion')){
    Promise.race([document.fonts?document.fonts.ready:Promise.resolve(),new Promise(r=>setTimeout(r,700))]).then(start);
  }else{hero.classList.add('is-in','is-done');layout();}

  /* ---------- Nav — denser glass once content passes beneath; highlight the section in view ---------- */
  let ticking=false;
  const onScroll=()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{
    nav&&nav.classList.toggle('is-scrolled',scrollY>24);
    nav&&nav.style.setProperty('--sp',Math.min(1,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)).toFixed(4));
    cord&&cord.style.setProperty('--cf',Math.max(0,1-scrollY/90).toFixed(2));   /* cord lets go as the page scrolls */
    ticking=false;});};
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  if(nav&&'IntersectionObserver' in window){
    const links=[...nav.querySelectorAll('.we-nav__links a')].filter(a=>(a.getAttribute('href')||'').charAt(0)==='#');
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{
      if(!e.isIntersecting)return;
      links.forEach(a=>{if(a.getAttribute('href')==='#'+e.target.id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
    }),{rootMargin:'-45% 0px -50% 0px'});
    [...new Set(links.map(a=>a.getAttribute('href')))].forEach(h=>{const t=document.querySelector(h);t&&io.observe(t);});
    new IntersectionObserver(([e])=>{if(e.isIntersecting)links.forEach(a=>a.removeAttribute('aria-current'));},{rootMargin:'-45% 0px -50% 0px'}).observe(hero);
  }


  /* ---------- Nav — liquid highlight glides to the hovered / current link ---------- */
  if(nav){
    const ind=nav.querySelector('.we-nav__ind'),wrap=nav.querySelector('.we-nav__links'),ls=[...wrap.querySelectorAll('a')];
    const to=a=>{if(!a){ind.classList.remove('is-on');return;}
      const first=!ind.classList.contains('is-on');
      ind.style.setProperty('--ix',a.offsetLeft+'px');ind.style.setProperty('--iw',a.offsetWidth+'px');
      if(first){ind.classList.remove('is-ready');ind.classList.add('is-on');requestAnimationFrame(()=>requestAnimationFrame(()=>ind.classList.add('is-ready')));}};
    const cur=()=>ls.find(a=>a.getAttribute('aria-current')==='true');
    ls.forEach(a=>{a.addEventListener('mouseenter',()=>to(a));a.addEventListener('focus',()=>to(a));});
    wrap.addEventListener('mouseleave',()=>to(cur()));
    wrap.addEventListener('focusout',()=>to(cur()));
    new MutationObserver(()=>{if(!wrap.matches(':hover'))to(cur());}).observe(wrap,{attributes:true,subtree:true,attributeFilter:['aria-current']});
    addEventListener('resize',()=>to(wrap.matches(':hover')?ls.find(a=>a.matches(':hover')):cur()));
  }

  /* ---------- 1B pills — red fill wipes in the direction of travel ---------- */
  const pills=[...hero.querySelectorAll('.we-pill')];
  let current=pills.findIndex(p=>p.classList.contains('active'));
  const FULL='inset(0 0 0 0 round 999px)',FROM_L='inset(0 100% 0 0 round 999px)',TO_R='inset(0 0 0 100% round 999px)';
  pills.forEach((pill,i)=>pill.addEventListener('click',()=>{
    if(i===current)return;
    const fwd=i>current,next=pill.querySelector('.we-pill__fill'),prev=pills[current]&&pills[current].querySelector('.we-pill__fill');
    next.style.transition='none';next.style.clipPath=fwd?FROM_L:TO_R;void next.offsetWidth;
    next.style.transition='';next.style.clipPath=FULL;
    if(prev)prev.style.clipPath=fwd?TO_R:FROM_L;
    current=i;
  }));

  /* ---------- Depth — drawing drifts with the pointer; the card sways on its cord (desktop, motion allowed) ---------- */
  if(stage&&matchMedia('(hover:hover) and (pointer:fine)').matches){
    let raf=0,nx=0,ny=0;
    const apply=()=>{raf=0;hero.style.setProperty('--px',nx.toFixed(3));hero.style.setProperty('--py',ny.toFixed(3));};
    hero.addEventListener('pointermove',e=>{
      if(reduce.matches||!hero.classList.contains('is-done'))return;
      const r=stage.getBoundingClientRect();
      nx=Math.max(-1,Math.min(1,(e.clientX-(r.left+r.width/2))/(r.width/2)));
      ny=Math.max(-1,Math.min(1,(e.clientY-(r.top+r.height/2))/(r.height/1.2)));
      if(!raf)raf=requestAnimationFrame(apply);
    });
    hero.addEventListener('pointerleave',()=>{nx=0;ny=0;if(!raf)raf=requestAnimationFrame(apply);});
  }
})();;
(()=>{'use strict';
  const hl=document.getElementById('weHl');if(!hl)return;
  const head=document.querySelector('.we-hl__head');
  const motion=document.documentElement.classList.contains('we-motion');
  if(motion&&'IntersectionObserver' in window){
    new IntersectionObserver(([e],o)=>{if(!e.isIntersecting)return;o.disconnect();head.classList.add('is-in');},{threshold:.4}).observe(head);
    new IntersectionObserver(([e],o)=>{if(!e.isIntersecting)return;o.disconnect();hl.classList.add('is-in');setTimeout(()=>hl.classList.add('is-done'),2200);},{threshold:.18}).observe(hl);
  }else{head.classList.add('is-in');hl.classList.add('is-in','is-done');}
  /* the liquid fill starts and drains at the pointer */
  hl.querySelectorAll('.we-hl__card').forEach(c=>{
    const set=e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');};
    c.addEventListener('pointerenter',set);c.addEventListener('pointerleave',set);
  });
})();;
(()=>{'use strict';
  const grid=document.getElementById('weAm'),pop=document.getElementById('weAmPop');if(!grid||!pop)return;
  const head=document.querySelector('.we-am__head'),card=pop.querySelector('.we-pop__card'),closeBtn=document.getElementById('closeAmenities'),more=document.getElementById('viewAmenities');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'),motion=document.documentElement.classList.contains('we-motion');
  /* reveal */
  if(motion&&'IntersectionObserver' in window){
    new IntersectionObserver(([e],o)=>{if(!e.isIntersecting)return;o.disconnect();head.classList.add('is-in');},{threshold:.4}).observe(head);
    new IntersectionObserver(([e],o)=>{if(!e.isIntersecting)return;o.disconnect();grid.classList.add('is-in');setTimeout(()=>grid.classList.add('is-done'),1700);},{threshold:.2}).observe(grid);
  }else{head.classList.add('is-in');grid.classList.add('is-in','is-done');}
  /* liquid fill from the pointer */
  const tiles=[...grid.querySelectorAll('.we-am__item')];
  tiles.forEach(c=>{const set=e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');};
    c.addEventListener('pointerenter',set);c.addEventListener('pointerleave',set);});
  /* the "all amenities" screen: the section's own eight tiles, then more fade in */
  /* NOTE: the second set below is a proposed list — edit names / icons here to match what you actually offer */
  const MORE=[
    ['reception','Reception Support','<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'],
    ['print','Printing &amp; Scanning','<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v6H7z"/>'],
    ['booth','Phone Booths','<rect x="7" y="3" width="10" height="18" rx="3"/><path d="M11 18h2"/>'],
    ['power','Power Backup','<path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z"/>'],
    ['ac','Air Conditioning','<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/>'],
    ['event','Event Space','<circle cx="8" cy="9" r="2.5"/><circle cx="16" cy="9" r="2.5"/><path d="M3 19a5 5 0 0 1 10 0M11 19a5 5 0 0 1 10 0"/>'],
    ['community','Community Events','<rect height="16" rx="2" width="18" x="3" y="5"/><path d="M8 3v4m8-4v4M3 10h18"/><path d="M12 13.2l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3z"/>'],
    ['locker','Lockers &amp; Storage','<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 3v18M9 9h.01M15 9h.01"/>']
  ];
  const all=document.getElementById('weAmAll');
  const mk=(cls,i,n,key,icon,name)=>`<div class="we-am__item we-pop__tile${cls}" data-key="${key}" style="--i:${i};--n:${n}"><span class="we-am__ic" aria-hidden="true">${icon}</span><h3>${name}</h3></div>`;
  all.innerHTML=tiles.map((t,i)=>mk('',i,0,t.dataset.key,t.querySelector('.we-am__ic').innerHTML,t.querySelector('h3').innerHTML)).join('')
    +MORE.map(([k,name,p],n)=>mk(' is-new',tiles.length+n,n,k,`<svg viewBox="0 0 24 24">${p}</svg>`,name)).join('');
  const amenityGroups=[
    {title:'Work & productivity',keys:['wifi','meeting','booth','print','power']},
    {title:'Comfort & facilities',keys:['lounge','pantry','parking','ac','clean','locker']},
    {title:'People & experience',keys:['reception','security','outdoor','event','community']}
  ];
  const amenityTiles=new Map([...all.children].map(el=>[el.dataset.key,el]));
  all.replaceChildren();
  amenityGroups.forEach((group,g)=>{
    const column=document.createElement('section');column.className='we-pop__column';column.style.setProperty('--g',g);
    const heading=document.createElement('h3');heading.className='we-pop__category';heading.textContent=group.title;
    const items=document.createElement('div');items.className='we-pop__column-items';
    group.keys.forEach((key,step)=>{
      const tile=amenityTiles.get(key);if(!tile)return;
      tile.style.setProperty('--g',g);tile.style.setProperty('--step',step);items.appendChild(tile);
    });
    column.append(heading,items);all.appendChild(column);
  });
  all.querySelectorAll('.we-pop__tile').forEach(c=>{const set=e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');};
    c.addEventListener('pointerenter',set);c.addEventListener('pointerleave',set);});
  /* open / close */
  let isOpen=false,lastFocus=null,hideT=0;
  const setInert=on=>[...document.body.children].forEach(c=>{
    if(c===pop||c.tagName==='SCRIPT'||c.tagName==='STYLE')return;
    if(on){if(!c.inert){c.inert=true;c.dataset.weInertA='1';}}else if(c.dataset.weInertA){c.inert=false;delete c.dataset.weInertA;}});
  /* the popup grows out of what you clicked (the grid for the button, the card for a tile) and shrinks back into it */
  const flip=(from,to)=>{const sx=Math.max(.05,from.width/to.width),sy=Math.max(.05,from.height/to.height);
    return `translate(${from.left-to.left}px,${from.top-to.top}px) scale(${sx},${sy})`;};
  let srcEl=null;
  function open(trigger,key){
    if(isOpen)return;clearTimeout(hideT);isOpen=true;lastFocus=trigger;srcEl=head;
    const sbw=innerWidth-document.documentElement.clientWidth;document.documentElement.style.overflow='hidden';if(sbw>0)document.body.style.paddingRight=sbw+'px';
    pop.querySelectorAll('.we-pop__tile').forEach(li=>li.classList.toggle('is-focus',!!key&&li.dataset.key===key));
    pop.hidden=false;pop.setAttribute('aria-hidden','false');card.scrollTop=0;
    const hr=head.getBoundingClientRect(),gr=grid.getBoundingClientRect();const fromR={left:hr.left,top:hr.top,width:Math.max(hr.right,gr.right)-hr.left,height:gr.bottom-hr.top};document.documentElement.classList.add('we-pop-open');
    const to=card.getBoundingClientRect();
    card.getAnimations().forEach(a=>a.cancel());
    if(!reduce.matches)card.animate([{transform:flip(fromR,to),opacity:.4,borderRadius:'26px'},{transform:'none',opacity:1,borderRadius:'36px'}],{duration:760,easing:'cubic-bezier(.17,.82,.17,1)'});
    void pop.offsetWidth;pop.classList.add('is-open');setTimeout(()=>pop.classList.add('is-settled'),2300);setInert(true);closeBtn.focus({preventScroll:true});
    const f=pop.querySelector('.we-pop__tile.is-focus');if(f)setTimeout(()=>f.scrollIntoView({block:'nearest',behavior:reduce.matches?'auto':'smooth'}),500);
  }
  function close(){
    if(!isOpen)return;isOpen=false;pop.classList.remove('is-open','is-settled');pop.setAttribute('aria-hidden','true');setInert(false);
    document.documentElement.classList.remove('we-pop-open');
    document.documentElement.style.overflow='';document.body.style.paddingRight='';
    if(lastFocus&&lastFocus.isConnected)lastFocus.focus({preventScroll:true});
    if(!reduce.matches){
      const to=card.getBoundingClientRect();card.getAnimations().forEach(a=>a.cancel());
      const hr=head.getBoundingClientRect(),gr=grid.getBoundingClientRect();card.animate([{transform:'none',opacity:1},{transform:flip({left:hr.left,top:hr.top,width:Math.max(hr.right,gr.right)-hr.left,height:gr.bottom-hr.top},to),opacity:0}],{duration:480,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
    }
    hideT=setTimeout(()=>{pop.hidden=true;card.getAnimations().forEach(a=>a.cancel());},reduce.matches?0:500);
  }
  more.addEventListener('click',()=>open(more,null));
  tiles.forEach(t=>t.addEventListener('click',()=>open(t,t.dataset.key)));
  closeBtn.addEventListener('click',close);
  pop.addEventListener('click',e=>{if(e.target===pop)close();});
  pop.querySelector('.we-pop__cta').addEventListener('click',close);
  document.addEventListener('keydown',e=>{
    if(!isOpen)return;
    if(e.key==='Escape'){e.preventDefault();close();}
    else if(e.key==='Tab'){const f=[...pop.querySelectorAll('button,a[href]')].filter(b=>b.offsetParent!==null);if(!f.length)return;
      const a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}
      else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}
      else if(!pop.contains(document.activeElement)){e.preventDefault();a.focus();}}
  });
})();;