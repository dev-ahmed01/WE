// Usage: node audit.js <baseUrl> <path1> <path2> ...
const { chromium } = require('playwright');
(async () => {
  const [base, ...paths] = process.argv.slice(2);
  const browser = await chromium.launch();
  const out = [];
  for (const p of paths) {
    for (const vp of [{n:'mobile',w:375,h:812,mobile:true},{n:'tablet',w:820,h:1180,mobile:true},{n:'desktop',w:1440,h:900,mobile:false}]) {
      const ctx = await browser.newContext({viewport:{width:vp.w,height:vp.h}, isMobile:vp.mobile, hasTouch:vp.mobile, deviceScaleFactor:1});
      const page = await ctx.newPage();
      const errs=[], failed=[];
      page.on('console', m => { if (m.type()==='error') errs.push(m.text().slice(0,200)); });
      page.on('pageerror', e => errs.push('PAGEERROR '+e.message.slice(0,200)));
      page.on('requestfailed', r => failed.push(r.url().slice(0,120)+' '+(r.failure()||{}).errorText));
      page.on('response', r => { if (r.status()>=400) failed.push(r.status()+' '+r.url().slice(0,120)); });
      await page.goto(base+p, {waitUntil:'load', timeout:60000}).catch(e=>errs.push('GOTO '+e.message));
      await page.waitForTimeout(1500);
      // scroll through to trigger lazy/scroll animations
      await page.evaluate(async()=>{const h=document.documentElement.scrollHeight;for(let y=0;y<h;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,40));}window.scrollTo(0,0);});
      await page.waitForTimeout(500);
      const info = await page.evaluate(() => {
        const de=document.documentElement, vw=de.clientWidth;
        const over=[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>vw+1)&&getComputedStyle(el).position!=='fixed'}).slice(0,8).map(el=>(el.tagName+'.'+(el.className&&el.className.baseVal===undefined?String(el.className):'')+'#'+el.id).slice(0,70)+' r='+Math.round(el.getBoundingClientRect().right));
        const ids=new Set([...document.querySelectorAll('[id]')].map(e=>e.id));
        const badAnch=[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!ids.has(decodeURIComponent(h.slice(1))));
        const deadHash=[...document.querySelectorAll('a[href="#"]')].length;
        const small=[...document.querySelectorAll('a,button,input,select,textarea')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.height<32||r.width<32)&&getComputedStyle(e).visibility!=='hidden'&&e.type!=='hidden'}).length;
        return {scrollW:de.scrollWidth, vw, over, badAnch:[...new Set(badAnch)], deadHash, small, h:de.scrollHeight};
      });
      out.push({p, vp:vp.n, errs:[...new Set(errs)].slice(0,6), failed:[...new Set(failed)].slice(0,6), ...info});
      await ctx.close();
    }
  }
  await browser.close();
  for (const o of out) console.log(JSON.stringify(o));
})();
