const { chromium } = require('playwright');
const [base, pagePath, name, mode] = process.argv.slice(2);
(async()=>{
  const b = await chromium.launch(); const mobile = mode==='m';
  const ctx = await b.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}});
  const p = await ctx.newPage(); await p.goto(base+pagePath,{waitUntil:'load'}); await p.waitForTimeout(1800);
  const H = await p.evaluate(()=>document.documentElement.scrollHeight); const vh = mobile?844:900;
  const n = Math.min(+process.argv[7]||8, Math.ceil(H/vh)); const step = (H-vh)/(Math.max(1,n-1));
  for(let i=0;i<n;i++){ await p.evaluate(y=>scrollTo(0,y), Math.round(i*step)); await p.waitForTimeout(700); await p.screenshot({path:`/tmp/shots/${name}-${mode}-${i}.png`}); }
  await b.close(); console.log(name, mode, 'H', H, 'shots', n);
})();
