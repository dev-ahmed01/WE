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
   await page.locator('.hero .cards .card').first().waitFor();
   assert.equal(await page.locator('.hero .cards .card').count(),4,'original four feature cards retained');
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
   if(viewport.width===1535){
     const firstTitle=await page.locator('.hero .cards .card-title').first().boundingBox();
     const firstCard=await page.locator('.hero .cards .card').first().boundingBox();
     const artBox=await page.locator('.hero .hero-art').boundingBox();
     assert.ok(firstTitle.y+firstTitle.height < viewport.height-8,
        'feature-card headings visible at initial desktop fold');
     assert.ok(firstCard.y > viewport.height*0.68,
        'only the feature card header is introduced near first fold');
     assert.ok(artBox.y < firstCard.y,
        'illustrations remain above feature cards');
     console.log('HERO FOLD GEOMETRY',{
       viewport:viewport.height,
       artworkTop:Math.round(artBox.y),
       cardTop:Math.round(firstCard.y),
       headingBottom:Math.round(firstTitle.y+firstTitle.height)
     });
   }
   for(const card of await page.locator('.hero .cards .card').all()) {
      assert.equal(await card.locator('p').evaluate(el=>getComputedStyle(el).display),'block','description visible');
      const border=await card.locator('p').evaluate(el=>getComputedStyle(el).borderTopWidth);
      assert.notEqual(border,'0px','visible dividing rule');
      assert.equal(await card.locator('.ic').count(),1,'plus icon retained');
      assert.equal(await card.locator('.ic').evaluate(el=>getComputedStyle(el).position),
        'absolute','red/black plus mark remains in the top-right');
      assert.ok((await card.evaluate(el=>getComputedStyle(el).backgroundImage)).includes('gradient'),'yellow gradient retained');
   }
   if(!mobile){
     const firstCard=page.locator('.hero .cards .card').first();
     await firstCard.scrollIntoViewIfNeeded();
     await firstCard.hover();
     assert.ok((await firstCard.evaluate(el=>el.style.getPropertyValue('--spot-x'))).endsWith('%'),
       'yellow card spotlight tracks the pointer');
     assert.equal(await firstCard.evaluate(el=>getComputedStyle(el,'::after').opacity),'1',
       'yellow card hover reveal is enabled');
   }
   await page.screenshot({path:path.join(SHOTS,'managed-office-'+viewport.width+'-hero.png'),animations:'disabled'});
   const benefits=page.locator('#benefits');
   assert.equal(await benefits.locator('.bn-card').count(),4,'all four benefits preserved');
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
