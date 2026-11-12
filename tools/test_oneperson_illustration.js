/* Section 7 One-Person Office: opacity is half of the former 0.30,
 * and the SVG path reveal/step cards remain unchanged. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const BASE=process.argv[2]||'http://127.0.0.1:8802';
const SHOTS=process.env.EMLEN_NAV_SCREENSHOTS||'/tmp/we-navigation-screenshots';
fs.mkdirSync(SHOTS,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
   for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
     const page=await browser.newPage({viewport,reducedMotion:'reduce'});
     await page.goto(BASE+'/managed-office/one-person-office/',{waitUntil:'domcontentloaded',timeout:45000});
     const stage=page.locator('#how-it-works .hs-stage');
     await stage.waitFor({state:'attached'});
     const props=await stage.evaluate(el=>({
       opacity:getComputedStyle(el).opacity,
       mask:getComputedStyle(el).maskImage,
       pathCount:el.querySelectorAll('svg .hs-draw').length,
       hasScene:!!el.querySelector('svg.hs-scene')
     }));
     assert.equal(props.opacity,'0.15','the office illustration should be half of its former 30% opacity');
     assert.ok(props.hasScene&&props.pathCount>30,'the original animated vector illustration is retained');
     assert.ok(props.mask.includes('gradient'),'original illustrator fade mask remains');
     assert.equal(await page.locator('#how-it-works .hs-step').count(),3,'all three steps retained');
     await stage.scrollIntoViewIfNeeded();
     await page.screenshot({path:path.join(SHOTS,'one-person-how-it-works-'+viewport.width+'.png'),animations:'disabled'});
     await page.close();
     console.log('ONE-PERSON ILLUSTRATION OK: '+viewport.width);
   }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
