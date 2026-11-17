/* Browser regression for approved Managed Offices visuals and interactions. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const BASE = process.argv[2] || 'http://127.0.0.1:8802';
const SHOTS = process.env.EMLEN_NAV_SCREENSHOTS || '/tmp/we-navigation-screenshots';
fs.mkdirSync(SHOTS, {recursive:true});

(async () => {
 const browser = await chromium.launch({headless:true});
 try {
  for(const viewport of [{width:1440,height:900},{width:1535,height:795},{width:390,height:844}]) {
   const mobile=viewport.width<760;
   const page=await browser.newPage({viewport,reducedMotion:'reduce'});
   const jsErrors=[];
   page.on('pageerror',e=>jsErrors.push(e.message));
   await page.goto(BASE + '/managed-office/south-bangalore/',{waitUntil:'domcontentloaded',timeout:45000});
   await page.locator('#managedHl .we-hl__card').first().waitFor();
   assert.equal(await page.locator('#managedHl .we-hl__card').count(),4,'original four feature cards retained');
   assert.equal(await page.locator('.hero .copy h1').count(),1,'original centred heading retained');
   assert.equal(await page.locator('.hero .actions a.button').count(),2,'both CTAs retained');
   assert.equal(await page.locator('.hero .copy').evaluate(el=>getComputedStyle(el).textAlign),'center','heading stays centred');
   assert.equal(await page.locator('.hero .hero-art > svg').count(),2,'two independent complete illustrations');
   const left=page.locator('.hero-art .illustration--left'),right=page.locator('.hero-art .illustration--right');
   for(const art of [left,right]){
     const computed=await art.evaluate(el=>({
       opacity:getComputedStyle(el).opacity,
       mask:getComputedStyle(el).maskImage,
       paths:el.querySelectorAll('path').length
     }));
     assert.equal(computed.opacity,'0.48','art reduced to 48% opacity');
     assert.equal(computed.mask,'none','no fading or cropping mask');
     assert.ok(computed.paths>25,'complete vector scene retained');
     const clarity=await art.locator(':scope > g').first().evaluate(el=>({
       opacity:getComputedStyle(el).opacity,
       strokeWidth:el.getAttribute('stroke-width')
     }));
     assert.equal(clarity.opacity,'0.9','art contrast reinforced without changing outer opacity');
     assert.equal(clarity.strokeWidth,'1.85','illustration strokes sharpened');
   }
   assert.ok(await left.locator('path[d^="M61 274"]').count(),'desk/plant artwork included');
   assert.ok(await right.locator('path[d^="M395 274"]').count(),'full meeting pod included');
   assert.ok(await right.locator('path[d^="M899 256"]').count(),'full lounge sofa included');
   assert.ok(await right.locator('path[d^="M1411 274"]').count(),'full storage shelves included');
   assert.equal(await page.locator('.hero-art path[d^="M0 58H1590"]').count(),0,
      'no old full-width ceiling spanning the CTAs');
   const call = page.locator('.hero .actions .button').nth(1);
   assert.equal(await call.getAttribute('href'),'tel:+919814953954','secondary Call now retains dial link');
   assert.equal(await call.evaluate(el=>getComputedStyle(el).color),'rgb(22, 22, 22)',
      'secondary CTA neutral before hover');
   assert.ok((await call.evaluate(el=>getComputedStyle(el).backgroundImage)).includes('gradient'),
      'secondary CTA uses subtle frosted glass');
   if(!mobile){
     const artL=await left.boundingBox(),artR=await right.boundingBox();
     const first=await page.locator('.hero .actions .button').first().boundingBox();
     const second=await call.boundingBox();
     assert.ok(artL.x+artL.width<=first.x+12,'left illustration clears the main CTA');
     assert.ok(artR.x>=second.x+second.width-12,'right illustration clears secondary CTA');
   }
   await page.waitForFunction(()=>{const n=document.querySelector('.em-nav'),e=document.querySelector('#top .eyebrow');const s=getComputedStyle(e),ctx=document.createElement('canvas').getContext('2d');ctx.font=s.fontWeight+' '+s.fontSize+' '+s.fontFamily;let label=e.textContent.trim();if(s.textTransform==='uppercase')label=label.toUpperCase();else if(s.textTransform==='lowercase')label=label.toLowerCase();const m=ctx.measureText(label),line=parseFloat(s.lineHeight);const ink=Number.isFinite(m.fontBoundingBoxAscent)&&Number.isFinite(m.fontBoundingBoxDescent)?Math.max(0,(line-m.fontBoundingBoxAscent-m.fontBoundingBoxDescent)/2+m.fontBoundingBoxAscent-m.actualBoundingBoxAscent):5;return Math.abs(e.getBoundingClientRect().top+scrollY-n.getBoundingClientRect().bottom+ink-80)<=1});
   const geometry=await page.evaluate(()=>{
      const rect=s=>document.querySelector(s).getBoundingClientRect();
      const nav=rect('.em-nav'),eyebrow=rect('.hero .eyebrow'),cards=rect('#managedHl');
      const bottom=Math.max(...Array.from(document.querySelectorAll('.hero-art svg')).map(e=>e.getBoundingClientRect().bottom));
      const e=document.querySelector('.hero .eyebrow');const s=getComputedStyle(e),ctx=document.createElement('canvas').getContext('2d');ctx.font=s.fontWeight+' '+s.fontSize+' '+s.fontFamily;let label=e.textContent.trim();if(s.textTransform==='uppercase')label=label.toUpperCase();else if(s.textTransform==='lowercase')label=label.toLowerCase();const m=ctx.measureText(label),line=parseFloat(s.lineHeight);const ink=Number.isFinite(m.fontBoundingBoxAscent)&&Number.isFinite(m.fontBoundingBoxDescent)?Math.max(0,(line-m.fontBoundingBoxAscent-m.fontBoundingBoxDescent)/2+m.fontBoundingBoxAscent-m.actualBoundingBoxAscent):5;return {gap:eyebrow.top-nav.bottom+ink,lineBoxGap:eyebrow.top-nav.bottom,artGap:cards.top-bottom};
   });
   assert.ok(Math.abs(geometry.gap-80)<=1,'visible hero navigation spacing '+JSON.stringify(geometry));
   assert.ok(geometry.artGap>=20,'art stays above highlight cards');
   if(!mobile){
     const buttons=page.locator('.hero .actions .button');
     await buttons.first().hover();
     assert.ok(await buttons.first().evaluate(e=>/^0(?:px|%) 100%$/.test(getComputedStyle(e).backgroundSize)),'primary red slides away');
     assert.equal(await buttons.first().evaluate(e=>getComputedStyle(e).color),'rgb(237, 32, 36)');
     await buttons.nth(1).hover();
     await page.waitForFunction(()=>getComputedStyle(document.querySelector('#top.hero .actions .button:nth-child(2)')).borderTopColor==='rgb(237, 32, 36)');
     assert.equal(await buttons.nth(1).evaluate(e=>getComputedStyle(e).borderTopColor),'rgb(237, 32, 36)','secondary outline on hover');
     assert.equal(await buttons.nth(1).evaluate(e=>getComputedStyle(e).color),'rgb(237, 32, 36)');
     await page.mouse.move(0,0);
   }
   const optionStyles=await page.locator('#offices .office-glass').evaluateAll(items=>items.map(e=>{
     const h=getComputedStyle(e.querySelector('strong')),a=e.querySelector('.office-arrow'),s=getComputedStyle(a);
     return {size:h.fontSize,weight:h.fontWeight,red:s.backgroundColor,radius:s.borderRadius,path:a.querySelector('path')?.getAttribute('d')};
   }));
   assert.equal(optionStyles.length,7);
   const overlays=await page.locator('#offices .office-glass').evaluateAll(els=>els.map(e=>{const s=getComputedStyle(e),t=getComputedStyle(e.querySelector('strong'));return {radius:s.borderRadius,bg:s.backgroundColor,gradient:s.backgroundImage,color:t.color,blur:s.backdropFilter}}));
   for(const o of overlays){assert.equal(o.radius,'999px','glass option pill radius');assert.equal(o.bg,'rgb(237, 32, 36)');assert.ok(o.gradient.includes('rgba(255, 255, 255, 0.27)')&&o.blur.includes('blur(26px)'));assert.equal(o.color,'rgb(255, 255, 255)');}
   if(!mobile){
     await page.emulateMedia({reducedMotion:'no-preference'});
     await page.locator('#offices .office-tile').first().hover();
     assert.equal(await page.locator('#offices .office-glass').first().evaluate(e=>getComputedStyle(e,'::after').animationName),'we-service-pill-shine','office overlay uses travelling shine');
     await page.mouse.move(0,0);await page.emulateMedia({reducedMotion:'reduce'});
   }
   for(const x of optionStyles)assert.deepEqual(x,{size:'18px',weight:'500',red:'rgb(237, 32, 36)',radius:'8px',path:'M9 5l7 7-7 7'});
   assert.equal(await page.locator('#other-title .other-highlight').innerText(),'different office solution');
   assert.equal(await page.locator('#other-title .other-highlight').evaluate(e=>getComputedStyle(e,'::after').display),'none','decorative underline removed');
   if(!mobile)assert.ok(await page.locator('#other-title').evaluate(e=>e.getBoundingClientRect().height<=parseFloat(getComputedStyle(e).lineHeight)+7),'single-line other services');
   if(!mobile)assert.ok(await page.locator('#consult-heading').evaluate(e=>e.getBoundingClientRect().height<=parseFloat(getComputedStyle(e).lineHeight)+1),'single-line consultation');
   assert.equal(await page.locator('.consult-explore').count(),0,'single consultation CTA');
   assert.equal((await page.locator('#open-speak').innerText()).trim(),'Book a consultation');
   assert.equal(await page.locator('#open-speak svg.we-action-chevron').count(),1);
   await page.locator('#open-speak').click();
   assert.ok(await page.locator('#speak-dialog').isVisible(),'consultation dialog opens');
   await page.locator('#speak-name').fill('Browser test');
   await page.locator('#speak-phone').fill('9999999999');
   await page.locator('#speak-team').selectOption('1–10 people');
   await page.evaluate(()=>{window.EmlenLead.deliver=async(m,p,s)=>{window.testLead=p;s.textContent='Test captured';return {mode:'api'}}});
   await page.locator('#speak-form button[type=submit]').click();
   assert.equal(await page.locator('#speak-status').innerText(),'Test captured');
   assert.equal(await page.evaluate(()=>window.testLead.source),'category-consultation');
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#speak-dialog').isVisible(),false,'dialog closes');
   const formGrid=await page.locator('#enquiry-form .field-grid').evaluate(e=>{
     const s=getComputedStyle(e);
     const fields=[...e.querySelectorAll(':scope > .field')].map(f=>({id:f.querySelector('input,select')?.id,x:f.getBoundingClientRect().x,y:f.getBoundingClientRect().y,w:f.getBoundingClientRect().width,placement:getComputedStyle(f).gridColumn}));
     return {cols:s.gridTemplateColumns.split(' ').length,gap:s.rowGap,tracks:s.gridTemplateColumns,fields,hidden:getComputedStyle(e.querySelector('input[type=hidden]')).display};
   });
   assert.equal(formGrid.cols,mobile?1:2,'exact enquiry tracks '+JSON.stringify(formGrid));
   assert.equal(formGrid.gap,'14px','compact field row gap');
   assert.equal(formGrid.hidden,'none');
   assert.deepEqual(formGrid.fields.map(f=>f.id),['fullName','lastName','phone','email','team','interest']);
   assert.equal(await page.locator('#lastName').getAttribute('required'),null);
   for(const selector of ['#enquiry-form','#speak-form']){
     const controls=await page.locator(selector+' .we-field').evaluateAll(els=>els.map(el=>{const c=el.querySelector('input,select,textarea');return {id:c.id,tag:c.tagName,marker:getComputedStyle(el,'::after').display,bg:getComputedStyle(c).backgroundImage};}));
     for(const control of controls){assert.equal(control.marker,'none','no field-wrapper arrow '+control.id);assert.equal(control.bg!=='none',control.tag==='SELECT','dropdown marker only on select '+control.id);}
   }
   assert.equal(await page.locator('#why-us .metric .star').count(),0,'rating star removed');
   const compact=await page.locator('#enquiry-form').evaluate(e=>{
     const rects=[...e.querySelectorAll('.field-grid > .field')].map(f=>f.getBoundingClientRect());
     const cols=getComputedStyle(e.querySelector('.field-grid')).gridTemplateColumns.split(' ').length;
     const gaps=rects.slice(cols).map((r,i)=>r.top-rects[i].bottom);
     const panel=e.closest('#enquiry'),s=getComputedStyle(panel),nav=document.querySelector('.em-nav');
     return {gaps,position:s.position,top:parseFloat(s.top),navBottom:nav.getBoundingClientRect().bottom,panelHeight:panel.getBoundingClientRect().height};
   });
   assert.ok(compact.gaps.every(g=>Math.abs(g-14)<1),'actual compact field spacing '+JSON.stringify(compact));
   assert.equal(compact.position,mobile?'relative':'sticky','desktop section-bounded sticky form');
   if(!mobile){
     assert.ok(Math.abs(compact.top-compact.navBottom-20)<1,'sticky offset clears navigation');
     await page.locator('#why-us').scrollIntoViewIfNeeded();
     const geometry=await page.locator('#why-us .why-grid').evaluate(g=>{
       const r=g.getBoundingClientRect(),p=g.querySelector('#enquiry'),h=p.getBoundingClientRect().height,t=parseFloat(getComputedStyle(p).top);
       return {gridTop:r.top+scrollY,gridHeight:r.height,panelHeight:h,stickyTop:t,travel:r.height-h};
     });
     assert.ok(geometry.travel>8,'natural card height leaves useful sticky travel '+JSON.stringify(geometry));
     const target=geometry.gridTop-geometry.stickyTop+geometry.travel/2;
     await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),target);
     await page.waitForFunction(()=>{const p=document.querySelector('#enquiry');return Math.abs(p.getBoundingClientRect().top-parseFloat(getComputedStyle(p).top))<=2});
     await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),geometry.gridTop+geometry.gridHeight-geometry.stickyTop+30);
     await page.waitForFunction(()=>{const p=document.querySelector('#enquiry').getBoundingClientRect(),g=document.querySelector('#why-us .why-grid').getBoundingClientRect();return p.bottom<=g.bottom+2&&p.top<parseFloat(getComputedStyle(document.querySelector('#enquiry')).top)});
   }
   assert.equal(await page.locator('a,button').evaluateAll(els=>els.filter(e=>e.textContent.includes('↗')).length),0,'no legacy diagonal action arrow');
   assert.ok(mobile?formGrid.fields[1].y>formGrid.fields[0].y:Math.abs(formGrid.fields[1].y-formGrid.fields[0].y)<1&&formGrid.fields[1].x>formGrid.fields[0].x,'physical field arrangement '+JSON.stringify(formGrid));
   await page.evaluate(()=>window.scrollTo(0,0));
   const allCards=page.locator('#managedHl .we-hl__card');
   const titles=await allCards.locator('h3').allTextContents();
   assert.deepEqual(titles,['Offices in prime locations','Multiple pricing plans','Flexible commitments','Move-in immediately']);
   for(const card of await allCards.all()){
     assert.equal(await card.locator('.we-hl__art svg').count(),0,'no illustrations');
     assert.equal(await card.locator('.we-hl__art > h3').count(),1,'heading inside dotted panel');
     assert.equal(await card.locator('.we-hl__txt > p').count(),1,'description below panel');
     assert.equal(await card.locator('.we-hl__art').getAttribute('aria-hidden'),null,'heading is accessible');
     const v=await card.evaluate(el=>{
       const h=el.querySelector('h3'),p=el.querySelector('p'),a=el.querySelector('.we-hl__art');
       const hr=h.getBoundingClientRect(),ar=a.getBoundingClientRect(),pr=p.getBoundingClientRect();
       const s=getComputedStyle(a),m=getComputedStyle(a,'::after');
       return {heading:getComputedStyle(h).fontSize,weight:getComputedStyle(h).fontWeight,
         body:getComputedStyle(p).fontSize,panel:s.backgroundColor,texture:s.backgroundImage,
         height:ar.height,marker:m.width,markerBg:m.backgroundImage,
         fits:hr.left>=ar.left-.5&&hr.top>=ar.top-.5&&hr.bottom<=ar.bottom+.5&&hr.right<=ar.right-33+.5,
         descriptionBelow:pr.top>=ar.bottom-.5,headingColor:getComputedStyle(h).color,
         rects:{heading:hr.toJSON(),panel:ar.toJSON(),description:pr.toJSON()},padding:s.padding};
     });
     assert.deepEqual([v.heading,v.weight,v.body],['21px','600','14px'],'approved typography');
     assert.equal(v.panel,'rgb(247, 241, 236)','original neutral dotted panel');
     assert.ok(v.texture.includes('radial-gradient'),'dotted texture preserved');
     assert.ok(v.height>=96&&v.height<=130,'compact panel height');
     assert.equal(v.marker,'20px','original plus marker');
     assert.ok(v.markerBg.includes('linear-gradient'),'two-tone marker');
     assert.equal(v.headingColor,'rgb(22, 22, 22)','normal heading colour');
     assert.ok(v.fits&&v.descriptionBelow,'heading fits inside panel and description follows '+JSON.stringify(v));
   }
   const columns=await page.locator('#managedHl').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
   assert.equal(columns,mobile?1:4,'responsive card grid');
   if(!mobile){
     const firstCard=allCards.first();
     await firstCard.scrollIntoViewIfNeeded();
     await firstCard.hover();
     assert.ok((await firstCard.evaluate(el=>el.style.getPropertyValue('--mx'))).endsWith('px'),'liquid fill tracks cursor entry');
     assert.equal(await firstCard.locator('h3').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)','red-fill hover text is white');
     assert.ok(await firstCard.evaluate(el=>new DOMMatrix(getComputedStyle(el,'::before').transform).a>.95),'hover expands red liquid');
     assert.ok(await firstCard.locator('.we-hl__art').evaluate(el=>Math.abs(new DOMMatrix(getComputedStyle(el,'::after').transform).b)>.95),'plus rotates on hover');
     assert.ok(await firstCard.locator('p').evaluate(el=>/^rgba?\(255, 255, 255(?:, [\d.]+)?\)$/.test(getComputedStyle(el).color)),'description stays readable on hover');
     await page.mouse.move(0,0);
   }
   await page.screenshot({path:path.join(SHOTS,'managed-office-'+viewport.width+'-hero.png'),animations:'disabled'});
   // Check actual child icon contrast, not just the parent button role.
   const pills=page.locator('#other-solutions .other-pill');
   assert.equal(await pills.count(),10,'all service pills retained');
   await pills.first().scrollIntoViewIfNeeded();
   await page.mouse.move(0,0);
   for(const pill of await pills.all()){
     const style=await pill.evaluate(el=>{
       const ar=el.querySelector('.pill-arr'),label=el.querySelector('span:first-child');
       const s=getComputedStyle(el),a=getComputedStyle(ar),l=getComputedStyle(label);
       const r=el.getBoundingClientRect(),ir=ar.getBoundingClientRect(),lr=label.getBoundingClientRect();
       return {bg:s.backgroundColor,gradient:s.backgroundImage,blur:s.backdropFilter,highlight:getComputedStyle(el,'::before').backgroundImage,color:l.color,icon:a.color,iconBg:a.backgroundColor,
         iconWidth:ir.width,iconHeight:ir.height,radius:s.borderRadius,
         labelFit:lr.right<=ir.left+1,inside:ir.right<=r.right+1&&ir.left>=r.left-1};
     });
     assert.equal(style.bg,'rgba(0, 0, 0, 0)','no solid dark red fill');
     assert.ok(style.gradient.includes('rgba(255, 255, 255, 0.27)')&&style.gradient.includes('rgba(72, 0, 0, 0.16)'),'original light frosted gradient');
     assert.ok(style.blur.includes('blur(26px)'),'navigation-matched frosted blur');
     assert.ok(style.highlight.includes('linear-gradient'),'static glass reflection');
     assert.equal(style.color,'rgb(255, 255, 255)','white readable label');
     assert.equal(style.icon,'rgb(237, 32, 36)','visible red arrow');
     assert.equal(style.iconBg,'rgb(255, 255, 255)','white icon surface');
     assert.equal(style.radius,'999px','shared pill geometry');
     assert.ok(style.labelFit&&style.inside,'label and arrow fit without collision');
     assert.equal(style.iconWidth,30,'consistent icon width');
     assert.equal(style.iconHeight,30,'consistent icon height');
   }
   if(!mobile){
     await pills.first().hover();
     assert.ok((await pills.first().evaluate(el=>getComputedStyle(el).backgroundImage)).includes('rgba(255, 255, 255, 0.32)'),'glass hover brightens');
     assert.equal(await pills.first().evaluate(el=>getComputedStyle(el,'::after').animationName),'none','reduced-motion disables shine');
     await page.emulateMedia({reducedMotion:'no-preference'});
     assert.equal(await pills.first().evaluate(el=>getComputedStyle(el,'::after').animationName),'we-service-pill-shine','hover shine restored');
     await page.emulateMedia({reducedMotion:'reduce'});
     assert.equal(await pills.first().locator('.pill-arr').evaluate(el=>getComputedStyle(el).color),'rgb(237, 32, 36)','arrow stays visible on hover');
     await page.mouse.move(0,0);
   }
   await page.locator('#other-solutions').screenshot({path:path.join(SHOTS,'managed-office-'+viewport.width+'-other-solutions.png'),animations:'disabled'});
   await pills.first().click();
   assert.equal(await page.locator('#interest-detail').inputValue(),'Coworking dedicated desk','service preselection still works');
   assert.equal(await page.locator('#interest').inputValue(),'Other services','other service fallback retained');
   const consultation=page.locator('#office-checklist.consult-section');
   const seam=await consultation.evaluate(el=>{
      const section=getComputedStyle(el),card=getComputedStyle(el.querySelector('.consult-card'));
      return {background:section.backgroundImage,backgroundColor:section.backgroundColor,paddingTop:parseFloat(section.paddingTop),
        cardBackground:card.backgroundImage,cardShadow:card.boxShadow,cardBlur:card.backdropFilter,cardBorder:card.borderTopWidth};
   });
   assert.equal(seam.background,'none','consultation has no page gradient');
   assert.equal(seam.backgroundColor,'rgb(255, 255, 255)','consultation uses the unified white background');
   assert.equal(seam.cardBackground,'none','consultation sits flush on the page without a detached gradient panel');
   assert.equal(seam.cardShadow,'none','consultation has no floating-card shadow');
   assert.equal(seam.cardBlur,'none','consultation has no detached glass blur');
   assert.equal(seam.cardBorder,'0px','consultation has no detached panel border');
   assert.ok(seam.paddingTop>=38,'consultation gets enough separation from adjacent sections');
   const benefits=page.locator('#benefits');
   assert.equal(await benefits.locator('.bn-card').count(),4,'all four benefits preserved');
   assert.equal(await benefits.locator('.bn-head .eyebrow').evaluate(e=>getComputedStyle(e,'::before').display),'none','no benefits dash');
   if(!mobile){
     for(const card of await benefits.locator('.bn-card').all()){
       const p=await card.evaluate(e=>{const s=getComputedStyle(e.querySelector('.bn-body')),f=getComputedStyle(e.querySelector('.bn-photo')),h=getComputedStyle(e.querySelector('.bn-strip'));return {right:s.paddingRight,bottom:s.paddingBottom,top:parseFloat(f.marginTop)+parseFloat(h.height)}});
       assert.equal(p.right,'20px');assert.equal(p.bottom,'20px');assert.ok(Math.abs(p.top-20)<=1,'equal image inset '+JSON.stringify(p));
     }
   }
   if(!mobile){
     const expandedLayout=await benefits.evaluate(el=>({
       pinned:el.classList.contains('bn-live'),
       titleStrip:getComputedStyle(el.querySelector('.bn-stage')).getPropertyValue('--strip').trim(),
       height:parseFloat(getComputedStyle(el.querySelector('.bn-card')).height)
     }));
     assert.ok(expandedLayout.pinned,'desktop Benefits preserves pinned stacking');
     assert.equal(expandedLayout.titleStrip,'44px','shorter collapsed headings reserve space for expanded content');
     assert.ok(expandedLayout.height>=300,'Benefits panels are tall enough to show content comfortably');
   }
   for(const card of await benefits.locator('.bn-card').all()) {
      const styles=await card.evaluate(el=>{
        const title=el.querySelector('.bn-title'),content=el.querySelector('.bn-copy'),photo=el.querySelector('.bn-photo'),body=el.querySelector('.bn-body');
        return {heading:getComputedStyle(title).textAlign,
          columns:getComputedStyle(body).gridTemplateColumns,
          textColumn:getComputedStyle(content).gridColumnStart,
          imageColumn:getComputedStyle(photo).gridColumnStart,
          imageRow:getComputedStyle(photo).gridRowStart};
      });
      assert.equal(styles.heading,'left','all benefit headings left aligned');
      assert.equal(styles.textColumn,'1','benefits text first');
      assert.equal(styles.imageColumn,mobile?'1':'2','benefit image right on desktop, below on mobile');
      assert.equal(styles.imageRow,mobile?'2':'1','benefit photograph tracks respective text');
   }
   assert.ok(await benefits.locator('.bn-head').evaluate(el=>parseFloat(getComputedStyle(el).marginBottom))>=18,
      'visible gap between benefits heading and card stack');
   if(!mobile) {
      await benefits.scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(SHOTS,'managed-office-desktop-benefits.png'),animations:'disabled'});
   }
   assert.deepEqual(jsErrors,[],'no client-side exceptions');
   await page.close();
   console.log('MANAGED OFFICE DESIGN OK: '+viewport.width);
  }
 } finally { await browser.close(); }
})().catch(err=>{console.error(err);process.exit(1)});
