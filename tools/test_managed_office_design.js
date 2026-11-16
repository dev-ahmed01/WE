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
     assert.equal(computed.opacity,'0.9','art kept at 90% opacity');
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
      'secondary CTA not red filled');
   assert.ok((await call.evaluate(el=>getComputedStyle(el).backgroundImage)).includes('gradient'),
      'secondary CTA uses subtle frosted glass');
   if(!mobile){
     const artL=await left.boundingBox(),artR=await right.boundingBox();
     const first=await page.locator('.hero .actions .button').first().boundingBox();
     const second=await call.boundingBox();
     assert.ok(artL.x+artL.width<=first.x+12,'left illustration clears the main CTA');
     assert.ok(artR.x>=second.x+second.width-12,'right illustration clears secondary CTA');
   }
   const allCards=page.locator('#managedHl .we-hl__card');
   const titles=await allCards.locator('h3').allTextContents();
   assert.deepEqual(titles,['Offices in prime locations','Multiple pricing plans','Flexible commitments','Move-in immediately']);
   for(const card of await allCards.all()){
     assert.equal(await card.locator('.we-hl__art svg').count(),1,'each card has one approved illustration');
     assert.equal(await card.locator('.we-hl__art svg .outline').first().getAttribute('stroke-width'),'2.15','sharper illustration stroke');
     assert.equal(await card.locator('.ic').count(),0,'old plus marker replaced');
     const v=await card.evaluate(el=>{const h=el.querySelector('h3'),p=el.querySelector('p'),a=el.querySelector('.we-hl__art');return {heading:getComputedStyle(h).fontSize,weight:getComputedStyle(h).fontWeight,body:getComputedStyle(p).fontSize,panel:getComputedStyle(a).backgroundColor,svg:getComputedStyle(a.querySelector('svg')).shapeRendering,artTop:a.getBoundingClientRect().top,titleTop:h.getBoundingClientRect().top};});
     assert.deepEqual([v.heading,v.weight,v.body],['21px','600','14px'],'approved typography');
     assert.equal(v.panel,'rgb(247, 241, 236)','neutral illustration panel');
     assert.equal(v.svg.toLowerCase(),'geometricprecision','crisp SVG');
     assert.ok(v.artTop<v.titleTop,'illustration above title');
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
     assert.ok(style.blur.includes('blur(22px)'),'original frosted blur');
     assert.ok(style.highlight.includes('linear-gradient'),'static glass reflection');
     assert.equal(style.color,'rgb(255, 255, 255)','white readable label');
     assert.equal(style.icon,'rgb(173, 20, 25)','visible red arrow');
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
     assert.equal(await pills.first().locator('.pill-arr').evaluate(el=>getComputedStyle(el).color),'rgb(173, 20, 25)','arrow stays visible on hover');
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
