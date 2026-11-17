/* Workspaces refinements: browser-level regression checks. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const BASE = process.argv[2] || 'http://127.0.0.1:8802';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1440, 1264, 1024, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(BASE + '/workspaces/', { waitUntil: 'domcontentloaded' });
      const directives = (await page.locator('meta[name="robots"]').getAttribute('content'))
        .split(',').map(x=>x.trim());
      assert.ok(directives.includes('noindex') && directives.includes('nofollow'),
        'Workspaces remains noindex and nofollow');
      assert.equal(await page.locator('#spaces').count(), 0, 'redundant office carousel removed');
      const hero=page.locator('#top.hp-b');
      assert.equal(await hero.locator('.hp-left .hp-sub').innerText(),'Flexible, Ready to Use Spaces for Teams of Any Size.');
      assert.equal(await hero.locator('.hp-eyebrow').count(),0,'removed hero eyebrow');
      assert.equal(await page.locator('.eyebrow-line').count(),0,'all decorative heading bars removed');
      assert.equal(await hero.locator('h1').innerText(),'Workspace for Every Business');
      await page.waitForFunction(()=>Math.abs(Number(document.querySelector('#top.hp-b').dataset.visibleNavGap)-80)<=1);
      const heading=await hero.locator('h1').evaluate(h=>{const r=h.getBoundingClientRect(),s=getComputedStyle(h),range=document.createRange();range.selectNodeContents(h);const rects=[...range.getClientRects()];return {height:r.height,line:parseFloat(s.lineHeight),font:s.fontFamily,weight:s.fontWeight,size:parseFloat(s.fontSize),fits:rects.every(x=>x.left>=r.left-1&&x.right<=r.right+1),accent:getComputedStyle(h.querySelector('em')).color,display:getComputedStyle(h.querySelector('em')).display};});
      assert.ok(heading.fits,'hero heading stays within its column '+JSON.stringify(heading));
      assert.ok(heading.font.includes('Bricolage Grotesque')&&heading.weight==='700','approved H1 typography');
      if(width>1100){assert.equal(heading.size,48);assert.ok(heading.height<=heading.line+1,'single-line desktop title');}
      assert.equal(heading.accent,'rgb(237, 32, 36)');assert.equal(heading.display,'inline');
      const layout=await hero.evaluate(e=>{
        const d=e.querySelector('.hp-desc'),g=e.querySelector('.hp-grid'),h=e.querySelector('h1'),sub=e.querySelector('.hp-sub');
        const s=getComputedStyle(d),b=getComputedStyle(e),r=h.getBoundingClientRect(),sr=sub.getBoundingClientRect();
        return {background:b.backgroundColor,gradient:b.backgroundImage,descBg:s.backgroundImage,shadow:s.boxShadow,blur:s.backdropFilter,leftBorder:s.borderLeftWidth,columns:getComputedStyle(g).gridTemplateColumns.split(' ').length,headingAboveSub:sr.top>=r.bottom,subSize:getComputedStyle(sub).fontSize,subWeight:getComputedStyle(sub).fontWeight};
      });
      assert.deepEqual(layout,{background:'rgb(255, 255, 255)',gradient:'none',descBg:'none',shadow:'none',blur:'none',leftBorder:'2px',columns:width>1100?2:1,headingAboveSub:true,subSize:'16px',subWeight:'600'},'approved plain editorial layout');
      assert.equal(await hero.locator('.we-pills').evaluate(e=>getComputedStyle(e).marginTop),width>1100?'72px':width>640?'56px':'48px','pills lowered 20px');
      await page.evaluate(()=>document.fonts.ready);
      const aligned=await page.evaluate(()=>{
        const a=document.querySelector('#top.hp-b .hp-desc'),b=document.querySelector('#photos .we-ph__head .right-copy');
        const metrics=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {x:r.left,left:s.borderLeftWidth,top:s.borderTopWidth,pad:s.paddingLeft,padTop:s.paddingTop,padBottom:s.paddingBottom,font:s.fontSize,line:s.lineHeight}};
        return [metrics(a),metrics(b)];
      });
      assert.ok(Math.abs(aligned[0].x-aligned[1].x)<=1,'shared editorial rule alignment '+JSON.stringify(aligned));
      for(const key of ['left','top','pad','padTop','padBottom','font','line'])assert.equal(aligned[0][key],aligned[1][key],'matching description '+key);
      const spacing=await page.evaluate(()=>{const h=document.querySelector('#top.hp-b'),p=document.querySelector('#photos');return parseFloat(getComputedStyle(h).paddingBottom)+parseFloat(getComputedStyle(p).paddingTop)});
      assert.equal(spacing,90,'90px between hero and gallery content areas');
      if(width>1100){
        const panel=page.locator('#enquiry .form-card');
        const geometry=await panel.evaluate(p=>{const g=p.closest('.enquiry-grid'),s=getComputedStyle(p),r=g.getBoundingClientRect();return {pos:s.position,top:parseFloat(s.top),height:p.getBoundingClientRect().height,gridTop:r.top+scrollY,gridHeight:r.height};});
        assert.equal(geometry.pos,'sticky','desktop enquiry sticky');
        assert.ok(geometry.gridHeight-geometry.height>=8,'sticky travel available '+JSON.stringify(geometry));
        await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),geometry.gridTop-geometry.top+(geometry.gridHeight-geometry.height)/2);
        await page.waitForFunction(()=>{const p=document.querySelector('#enquiry .form-card');return Math.abs(p.getBoundingClientRect().top-parseFloat(getComputedStyle(p).top))<=2});
        await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      }
      const pills=hero.locator('.we-pill');
      assert.deepEqual(await pills.locator('.hp-category-label').allTextContents(),['Private Office','Coworking','Meeting Rooms','Event Space','Day Pass','Virtual Office']);
      assert.equal(await pills.locator('svg.hp-category-icon').count(),6,'six category-specific icons');
      assert.equal(await hero.locator('.hp-deco').isVisible(),false,'no decorative background');
      await pills.nth(2).click();
      assert.equal(await pills.nth(2).getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('#type').inputValue(),'Meeting Rooms','existing category enquiry preselection works');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no horizontal overflow');
      assert.match(await page.locator('#locations h2').innerText(), /Jayanagar workspace/);
      assert.equal(await page.locator('#locations .we-lc__bar').isVisible(), false,
        'locations carousel not visible');
      assert.equal(await page.locator('#locationMap').count(), 1, 'neighbourhood map retained');
      assert.equal(await page.locator('#locations .we-lc__copy').count(),0,'location description removed');
      await page.locator('#weLcCard .we-lc__cta').waitFor({state:'attached'});
      const locationGlass=await page.locator('#weLcCard').evaluate(e=>{const n=document.querySelector('.em-nav'),a=getComputedStyle(e),b=getComputedStyle(n);return ['backgroundImage','backgroundColor','borderTopColor','boxShadow','backdropFilter'].map(k=>[k,a[k],b[k]])});
      assert.ok(locationGlass.every(([,a,b])=>a===b),'location card matches navigation material '+JSON.stringify(locationGlass));
      assert.ok((await page.locator('#weLcCard .we-lc__cta').getAttribute('href')),'directions action retained');

      if(width>1100){
        const panels=await page.locator('#weLc :is(.we-lc__photo,.we-lc__mapcard,.we-lc__near)').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}}));
        assert.equal(panels.length,3);assert.ok(panels.every(p=>Math.abs(p.top-panels[0].top)<=2&&Math.abs(p.bottom-panels[0].bottom)<=2),'three equally aligned panels '+JSON.stringify(panels));
        assert.ok(panels[0].height<=390,'compact location explorer');
      }
      const tile = page.locator('#weAm .we-am__item').first();
      await tile.scrollIntoViewIfNeeded();
      await tile.hover();
      assert.equal(await tile.evaluate(el => getComputedStyle(el, '::before').display), 'none',
        'no red fill pseudo-element on amenities');
      const tileText = tile.locator('h3');
      assert.equal(await tileText.evaluate(el => getComputedStyle(el).color), 'rgb(22, 22, 22)',
        'amenities remain dark on hover');

      await page.locator('#viewAmenities').click();
      await page.locator('#weAmPop.is-open').waitFor({ timeout: 8000 });
      const modalHeading=await page.locator('#amenityModalTitle').evaluate(e=>{const s=getComputedStyle(e);return [s.fontSize,s.fontWeight]});
      assert.deepEqual(modalHeading,['21px','600']);
      const groups = page.locator('#weAmPop .we-pop__column');
      assert.equal(await groups.count(), 4, 'four semantic amenity groups');
      assert.deepEqual(await groups.locator('.we-pop__category').allInnerTexts(),
        ['Work & technology','Comfort & convenience','Site services & security','Community & events']);
      assert.deepEqual(await groups.locator('.we-pop__tile').count(), 16);
      assert.deepEqual(await groups.evaluateAll(els => els.map(el=>el.querySelectorAll('.we-pop__tile').length)),
        [5,4,4,3], 'all amenities categorized by purpose');
      assert.equal(await page.locator('#weAmPop .we-pop__tile').first()
        .evaluate(el => getComputedStyle(el,'::before').display), 'none', 'no modal red fill');
      await page.locator('#closeAmenities').click();
      await page.locator('#weAmPop').waitFor({ state: 'hidden', timeout: 8000 });
      await page.close();
      console.log('WORKSPACES UI OK: width=' + width);
    }
    const response = await browser.newPage();
    const sitemap = await response.request.get(BASE + '/sitemap.xml');
    assert.equal(sitemap.status(), 200, 'empty deployment-compatibility sitemap is served');
    const sitemapText = await sitemap.text();
    assert.ok(!sitemapText.includes('<loc>') && !sitemapText.includes('<url>'),
      'the compatibility sitemap contains no public URLs');
    const robots = await (await response.request.get(BASE + '/robots.txt')).text();
    assert.ok(!robots.includes('Sitemap:'), 'no sitemap is advertised');
    for (const path of ['/', '/workspaces/', '/managed-office/south-bangalore/',
                        '/managed-office/one-person-office/']) {
      await response.goto(BASE + path);
      const flags = (await response.locator('meta[name="robots"]').getAttribute('content'))
        .split(',').map(x => x.trim());
      assert.ok(flags.includes('noindex') && flags.includes('nofollow'), path + ' excluded from indexes');
    }
    await response.goto(BASE+'/workspaces/');
    await response.locator('footer a[href="/legal/"]').click();
    await response.waitForURL('**/legal/');
    assert.equal(await response.locator('h1').innerText(),'Legal & policies');
    assert.equal(await response.locator('.legal-review').count(),0,'large draft banner removed');
    assert.equal(await response.locator('details.legal-policy').count(),6);
    assert.equal(await response.locator('.legal-breadcrumb').count(),0,'no visible breadcrumb');
    await response.waitForFunction(()=>Math.abs(Number(document.querySelector('.legal-main').dataset.visibleNavGap)-80)<=1);
    const legalLayout=await response.evaluate(()=>{
      const h=document.querySelector('.legal-intro h1').getBoundingClientRect(),m=document.querySelector('.legal-main').getBoundingClientRect(),a=document.querySelector('.legal-index'),ar=a.getBoundingClientRect(),r=document.querySelector('.legal-accordions').getBoundingClientRect();
      const s=getComputedStyle(a);
      return {left:Math.abs(h.left-m.left)<=1,aligned:Math.abs(ar.top-r.top)<=1,radius:s.borderRadius,sticky:s.position,links:[...a.querySelectorAll('a')].map(l=>l.hash),policies:[...document.querySelectorAll('.legal-policy')].map(p=>'#'+p.id)};
    });
    assert.ok(legalLayout.left&&legalLayout.aligned,'aligned legal heading and panels');
    assert.equal(legalLayout.radius,'24px');assert.equal(legalLayout.sticky,'sticky');
    assert.deepEqual(legalLayout.links,legalLayout.policies,'all policies indexed automatically');

    await response.locator('#privacy summary').click();
    assert.ok(await response.locator('#privacy').getAttribute('open')!==null,'native accordion opens');
    assert.ok((await response.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'));
    assert.equal(await response.locator('.em-nav__cta').getAttribute('href'),'/workspaces/#enquiry');
    await response.locator('.legal-index a[href="#cookies"]').click();
    await response.waitForFunction(()=>document.querySelector('#cookies').open);
    assert.equal(await response.locator('.legal-index a[href="#cookies"]').getAttribute('aria-current'),'location');
    await response.waitForFunction(()=>{const p=document.querySelector('#cookies'),nav=document.querySelector('.em-nav');return p.getBoundingClientRect().top>=nav.getBoundingClientRect().bottom;});
    await response.setViewportSize({width:390,height:844});
    await response.goto(BASE+'/legal/#contact');
    await response.waitForFunction(()=>document.querySelector('#contact').open);
    assert.equal(await response.locator('.legal-index').evaluate(e=>getComputedStyle(e).position),'static');
    assert.equal(await response.locator('.legal-index a[href="#contact"]').getAttribute('aria-current'),'location');
    assert.ok(await response.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'legal mobile without overflow');
    await response.close();
    console.log('WORKSPACES SEO OK');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
