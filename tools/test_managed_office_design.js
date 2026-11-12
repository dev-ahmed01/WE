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
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]) {
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
   assert.ok((await page.locator('.hero .illustration').getAttribute('viewBox'))?.includes('1590'),'original line illustration retained');
   const hero = await page.locator('.hero .illustration').evaluate(el=>({
      alpha:getComputedStyle(el).opacity,
      mask:getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage
   }));
   assert.equal(hero.alpha,'0.9','illustration opacity unchanged');
   if(!mobile) assert.ok(hero.mask.includes('linear-gradient'),'split illustration masks centre on desktop');
   for(const card of await page.locator('.hero .cards .card').all()) {
      assert.equal(await card.locator('p').evaluate(el=>getComputedStyle(el).display),'block','description visible');
      const border=await card.locator('p').evaluate(el=>getComputedStyle(el).borderTopWidth);
      assert.notEqual(border,'0px','visible dividing rule');
      assert.equal(await card.locator('.ic').count(),1,'plus icon retained');
      assert.ok((await card.evaluate(el=>getComputedStyle(el).backgroundImage)).includes('gradient'),'yellow gradient retained');
   }
   await page.screenshot({path:path.join(SHOTS,'managed-office-'+(mobile?'mobile':'desktop')+'-hero.png'),animations:'disabled'});
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
