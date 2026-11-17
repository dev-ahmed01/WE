/* Cross-page navigation E2E smoke test at desktop and mobile viewport. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const BASE = process.argv[2] || 'http://127.0.0.1:8802';
const SHOTS = process.env.EMLEN_NAV_SCREENSHOTS || '/tmp/we-navigation-screenshots';
fs.mkdirSync(SHOTS, { recursive: true });

const routes = [
  '/',
  '/workspaces/',
  '/managed-office/south-bangalore/',
  '/managed-office/one-person-office/'
];


/* Every major page background must be white at both tested breakpoints.
   Nested component backgrounds are intentionally not included in this assertion. */
async function checkPageBackground(page,route){
  const state = await page.evaluate(() => {
    const selectors = 'html,body,body > main,body > section,body > main > section,body > footer';
    return [...document.querySelectorAll(selectors)].map(el => {
      const style=getComputedStyle(el);
      return {element:el.tagName+'#'+el.id+'.'+el.className, color:style.backgroundColor,image:style.backgroundImage,hero:el.matches('section.hero,section.hero-section,section.we-hero.hp.hp-b'),role:style.getPropertyValue('--we-section-family').trim()};
    });
  });
  assert.ok(state.length>=8,route+': main sections found');
  for(const surface of state){
    assert.equal(surface.color,'rgb(255, 255, 255)',route+': white '+surface.element);
    if(surface.hero){
      assert.equal(surface.role,'hero',route+': documented hero family');
      if(route==='/workspaces/'){
        assert.equal(surface.image,'none','approved plain property hero');
        continue;
      }
      // Chromium serializes alpha channels with rounding. Check both colors and
      // their numerical opacity, not the exact decimal string.
      const colors=[...surface.image.matchAll(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/g)].map(m=>m.slice(1).map(Number));
      assert.equal((surface.image.match(/radial-gradient\(/g)||[]).length,2,route+': two hero washes '+surface.image);
      assert.ok(colors.some(([r,g,b,a])=>r===255&&g===185&&b===0&&Math.abs(a-.065)<.006),route+': restrained yellow wash '+surface.image);
      assert.ok(colors.some(([r,g,b,a])=>r===237&&g===32&&b===36&&Math.abs(a-.055)<.006),route+': restrained red wash '+surface.image);
    }else{
      assert.equal(surface.image,'none',route+': white section without competing gradient '+surface.element);
      if(surface.element.startsWith('SECTION'))assert.ok(['cards','lead-magnet','subsection'].includes(surface.role),route+': section family '+surface.element);
    }
  }
}


/* Nine typography roles from WE Design System. Check real computed CSS, not token names alone. */
async function checkTypography(page,route,mobile){
  const main = await page.locator('h1').first().evaluate(el => {
    const s=getComputedStyle(el);return {size:parseFloat(s.fontSize),weight:s.fontWeight,family:s.fontFamily};
  });
  assert.equal(main.weight,'700',route+': main heading weight');
  assert.ok(main.family.includes('Bricolage Grotesque'),route+': main heading face');
  if(mobile) assert.ok(main.size>=32 && main.size<=38,route+': responsive main heading');
  else assert.equal(main.size,48,route+': main heading size');
  const roles = await page.evaluate(() => {
    const pick = selector => {
      const el=document.querySelector(selector);if(!el)return null;
      const s=getComputedStyle(el); return {size:parseFloat(s.fontSize),weight:s.fontWeight,family:s.fontFamily};
    };
    return {
      section:pick('section h2:not(.enquiry-panel h2)'),
      card:pick('.cd h3,.we-hl__art h3,.we-hl__txt h3,.hero .card-title'),
      body:pick('.desc,.hp-b .hp-desc p,.solutions-desc,.hero .copy p:not(.eyebrow),.hero-intro'),
      action:pick('.em-nav__cta'),
      anchor:pick('.em-nav__link')
    };
  });
  for(const [role,value] of Object.entries(roles)){
    assert.ok(value,route+': '+role+' present');
    const heading=role==='section'||role==='card';
    assert.ok(value.family.includes(heading?'Bricolage Grotesque':'Poppins'),route+': '+role+' face');
    const weights={section:'700',card:'600',body:'400',action:'600',anchor:'600'};
    assert.equal(value.weight,weights[role],route+': '+role+' weight');
    if(role==='section'&&mobile) assert.ok(value.size>=27 && value.size<=32,route+': responsive section heading');
    else assert.equal(value.size,{section:36,card:21,body:14,action:13,anchor:16}[role],route+': '+role+' size');
  }
}



/* Verify every section heading, rather than only the first sample. Check the
   specific component roles where legacy selectors previously beat the tokens. */
async function checkTypographyCoverage(page,route,mobile){
  const rows=await page.evaluate(()=>{
    const roles=[
      ['section','section h2:not(.enquiry-panel h2,.we-form-panel h2)'],
      ['form title','.we-form-panel h2,.we-form-panel h3'],
      ['card','.we-hl__art h3,.we-hl__txt h3,.cd h3,.benefit-card h3,.bn-row-heading,.bn-title,.sol-name,.office-glass strong'],
      ['highlight','.we-form-panel .we-form-kicker,.we-form-panel .form-kicker,.metric>span:not(.star),.stat-card>span:not(.star),.stat-card.glass p,.eq-s>span'],
      ['subheading','.faq-item summary,button.faq-toggle,.faq-q span:first-child,.ql h4,.cz-label'],
      ['bullet','.bn-points li,.bn-row-points li,.consult-points li,.lm-points li,.ap-ls li'],
      ['body','.bn-text,.bn-row-desc,.we-hl__txt p,.we-form-intro,.form-subtitle,.section-note'],
      ['button','.we-form-main button[type=submit],.em-nav__cta,.em-nav__call,.sol-link,.consult-call,.consult-call strong,.lm-cta-main,.lm-cta-num'],
      ['anchor','.em-nav__link']
    ];
    return roles.flatMap(([role,sel])=>[...document.querySelectorAll(sel)].map(e=>{
      const s=getComputedStyle(e);
      return {role,text:e.textContent.trim().slice(0,70),size:parseFloat(s.fontSize),weight:s.fontWeight,family:s.fontFamily,option:e.matches('#offices .office-glass strong')};
    }));
  });
  assert.ok(rows.filter(x=>x.role==='section').length>=4,route+': section coverage');
  for(const r of rows){
    const label=route+' '+r.role+' '+r.text;
    const head=['section','card','form title'].includes(r.role);
    const size={'section':36,'card':21,'form title':21,'highlight':16,'subheading':16,'bullet':16,'body':14,'button':13,'anchor':16}[r.role];
    const weight={'section':'700','card':'600','form title':'600','highlight':'600','subheading':'600','bullet':'400','body':'400','button':'600','anchor':'600'}[r.role];
    assert.ok(r.family.includes(head?'Bricolage Grotesque':'Poppins'),label+' font');
    assert.equal(r.weight,r.option?'500':weight,label+' weight');
    if(mobile&&r.role==='section')assert.ok(r.size>=27 && r.size<=32,label+' responsive size');
    else assert.equal(r.size,r.option?18:size,label+' size');
  }
  console.log('TYPOGRAPHY COVERAGE OK: '+route+' '+(mobile?'mobile':'desktop')+' ('+rows.length+' elements)');
}


async function checkButtons(page,route,mobile){
  const items=await page.evaluate(()=>[...document.querySelectorAll('button,a')].filter(e=>!e.closest('[inert],.em-nav-replaced')&&e.getClientRects().length&&getComputedStyle(e).visibility==='visible').map(e=>{
    const s=getComputedStyle(e);
    return {navLink:e.matches('.em-nav__link,.em-nav__mobile-link'),role:s.getPropertyValue('--we-control-role').trim(),text:e.textContent.trim().slice(0,65),font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,radius:s.borderRadius,border:s.borderTopWidth,bg:s.backgroundColor,img:s.backgroundImage,borderColor:s.borderTopColor,color:s.color,secondaryHero:e.matches('#top.hero .actions .button:nth-child(2)')};
  }).filter(x=>x.role));
  assert.ok(items.length>=5,route+': shared button roles applied');
  for(const i of items){
    const label=route+' '+i.role+' '+i.text;
    assert.ok(i.font.includes('Poppins'),label+' font');
    if(i.role!=='icon'){assert.equal(i.size,i.navLink?'16px':'13px',label+' size');assert.equal(i.weight,i.role==='anchor'&&!i.navLink?'400':'600',label+' weight');}
    if(i.role==='main'){assert.equal(i.radius,'13px',label+' radius');assert.equal(i.border,'0px',label+' border');assert.ok(['rgb(237, 32, 36)','rgb(255, 185, 0)','rgb(22, 22, 22)'].includes(i.bg),label+' approved solid color '+i.bg);}
    if(i.role==='secondary')assert.equal(i.radius,'13px',label+' radius');
    if(i.role==='hero-action'){
      assert.equal(i.radius,'13px',label+' radius');
      assert.equal(i.border,'1px',label+' outline');
      if(i.secondaryHero){
        assert.notEqual(i.borderColor,'rgb(237, 32, 36)',label+' neutral border until hover');
        assert.equal(i.color,'rgb(22, 22, 22)',label+' neutral text');
        assert.ok(i.img.includes('gradient')&&!i.img.includes('rgb(237, 32, 36)'),label+' neutral frosted surface');
      }else assert.ok(i.img.includes('rgb(237, 32, 36)'),label+' directional brand fill');
    }
    if(i.role.startsWith('pill'))assert.equal(i.radius,'999px',label+' pill radius');
  }
  assert.equal(await page.locator('.em-nav__cta').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 185, 0)',route+': yellow enquiry navigation CTA');
  const c=page.locator('.we-form-main button[type=submit]');
  assert.equal(await c.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(237, 32, 36)',route+': primary callback red');
  console.log('BUTTON SYSTEM OK: '+route+' '+(mobile?'mobile':'desktop')+' ('+items.length+' controls)');
}


/* Verify the actual card surfaces and role coverage at both breakpoints.
   Existing interaction tests remain responsible for navigation and animations. */
async function checkCardFamilies(page,route,mobile){
  const data=await page.evaluate(()=>{
    const families={
      'highlight-illustration':'.we-hl__card',
      'benefit-a':'.eq-c:not(.eq-s),.benefit-card',
      'highlight-point':'#weAm .we-am__item,.eq-c.eq-s,.metric,.stat-card',
      'process':'#how-it-works .hs-card',
      'benefit-b':'#benefits .bn-card,#benefits .bn-row',
      'accordion':'.faq-item',
      'testimonial':'.tq,.t-card,.testimonial',
      'option-a':'#weGal .we-tile',
      'option-b':'.lk,.office-tile,.sol-card,.location-card.choose-location,.we-lc__photo'
    };
    return Object.entries(families).flatMap(([family,sel])=>[...document.querySelectorAll(sel)].filter(e=>e.getClientRects().length).map(e=>{
      const s=getComputedStyle(e);
      return {family,role:s.getPropertyValue('--we-card-family').trim(),cls:e.className,
        radius:s.borderRadius,bg:s.backgroundColor,bgImage:s.backgroundImage,shadow:s.boxShadow,
        photo:!!e.querySelector('img'),art:e.querySelectorAll('.we-hl__art svg').length,titlePanel:!!e.querySelector('.we-hl__art > h3')};
    }));
  });
  assert.equal(data.filter(c=>c.family==='highlight-illustration').length,4,route+': four shared illustration cards');
  for(const c of data){
    const label=route+' '+c.family+' '+c.cls;
    assert.equal(c.role,c.family,label+' shared family');
    const radii={'highlight-illustration':mobile?'26px':'30px','highlight-point':mobile?'16px':'18px',
      'accordion':mobile?'16px':'18px','option-a':mobile?'18px':'20px'};
    assert.equal(c.radius,radii[c.family]||(mobile?'22px':'24px'),label+' shared radius');
    if(['highlight-illustration','benefit-a','highlight-point','process','accordion','testimonial'].includes(c.family)){
      assert.equal(c.bg,'rgb(255, 255, 255)',label+' white surface');
      assert.equal(c.bgImage,'none',label+' no competing fill');
    }
    if(c.family==='highlight-illustration'){
      assert.equal(c.art,0,label+' no legacy artwork');assert.ok(c.titlePanel,label+' heading in dotted panel');
    }
  }
  const panels=await page.locator('.we-hl__card').evaluateAll(els=>els.map(el=>{
    const a=el.querySelector('.we-hl__art'),h=a.querySelector('h3'),p=el.querySelector('.we-hl__txt p'),ar=a.getBoundingClientRect(),hr=h.getBoundingClientRect(),pr=p.getBoundingClientRect();
    return {aria:a.getAttribute('aria-hidden'),heading:getComputedStyle(h).fontSize,height:ar.height,texture:getComputedStyle(a).backgroundImage,fit:hr.right<=ar.right-33+.5&&hr.bottom<=ar.bottom+.5,desc:pr.top>=ar.bottom-.5};
  }));
  for(const p of panels){assert.equal(p.aria,null,route+': accessible heading');assert.equal(p.heading,'21px');assert.ok(p.height>=(mobile?95:103),route+': compact panel');assert.ok(p.texture.includes('radial-gradient'));assert.ok(p.fit&&p.desc,route+': title and description fit '+JSON.stringify(p));}
  console.log('CARD SYSTEM OK: '+route+' '+(mobile?'mobile':'desktop')+' ('+data.length+' cards)');
}


async function checkSectionPanels(page,route,mobile){
  const items=await page.evaluate(()=>Array.from(document.querySelectorAll('#find-fit .qb,.ap .dp,#other-solutions,.cz-panel,.we-gal__shell,.we-lc__mapcard,.we-form-panel:not(#speak-dialog *)')).map(el=>{
    const s=getComputedStyle(el);return {cls:el.className,role:s.getPropertyValue('--we-section-panel').trim(),radius:s.borderRadius,bg:s.backgroundImage};
  }));
  for(const item of items){
    assert.ok(['lead-magnet','subsection'].includes(item.role),route+': panel role '+item.cls);
    assert.equal(item.radius,mobile?'25px':'30px',route+': shared panel radius '+item.cls);
    assert.ok(item.bg.includes('linear-gradient'),route+': retained glass or brand surface '+item.cls);
  }
  if(route==='/workspaces/'){
    const tiles=page.locator('#weGal .we-tile');
    assert.ok(await tiles.count()>=5,'gallery tiles retained');
    for(const tile of await tiles.all()){
      assert.equal(await tile.evaluate(e=>getComputedStyle(e,'::before').content),'none','no View photo overlay');
    }
  }
}


async function checkFaqIndicators(page,route){
  if(route==='/')return;
  const questions=page.locator('.faq-item');
  assert.ok(await questions.count()>0,route+': FAQ questions retained');
  const button=questions.first().locator('summary,button.faq-q,button.faq-toggle').first();
  const icon=button.locator('.plus,.faq-sign,span.faq-toggle').first();
  const state=()=>icon.evaluate(e=>{const p=getComputedStyle(e,'::before'),s=getComputedStyle(e);return {symbol:p.content,transform:s.transform,w:s.width,h:s.height};});
  const expanded=()=>button.evaluate(e=>e.tagName==='SUMMARY'?e.parentElement.open:e.getAttribute('aria-expanded')==='true');
  if(await expanded())await button.click();
  assert.equal((await state()).symbol,'"+"',route+': collapsed plus');
  await button.scrollIntoViewIfNeeded();
  await button.click();
  assert.equal(await expanded(),true,route+': FAQ expanded');
  assert.deepEqual(await state(),{symbol:'"−"',transform:'none',w:'30px',h:'30px'},route+': expanded minus, not rotated cross');
  await button.click();
  assert.equal(await expanded(),false,route+': FAQ collapsed');
  assert.equal((await state()).symbol,'"+"',route+': plus restored');
}


async function checkFinalConsistency(page,route,mobile){
  const state=await page.evaluate(()=>{
    const footer=document.querySelector('footer.we-universal-footer');
    const marker=[...document.querySelectorAll('.we-hl__art')].map(e=>({width:getComputedStyle(e,'::after').width,bg:getComputedStyle(e,'::after').backgroundImage,stroke:e.querySelector('svg[stroke-width],svg [stroke-width]')?getComputedStyle(e.querySelector('svg[stroke-width],svg [stroke-width]')).strokeWidth:null}));
    const sections=[...document.querySelectorAll('body > section,body > main > section')].filter(e=>!e.matches('.hero,.hero-section,.we-hero,#how-it-works,.benefits-section')).map(e=>({id:e.id||e.className,top:getComputedStyle(e).paddingTop,bottom:getComputedStyle(e).paddingBottom}));
    const faq=[...document.querySelectorAll('.faq-item summary,.faq-item button.faq-q,.faq-item button.faq-toggle')].map(e=>getComputedStyle(e).padding);
    return {footer:!!footer,footerLinks:[...footer.querySelectorAll('nav a')].map(e=>e.getAttribute('href')),marker,sections,faq,scrollWidth:document.documentElement.scrollWidth,width:innerWidth};
  });
  assert.ok(state.footer,route+': common footer');
  assert.deepEqual(state.footerLinks,['/','/workspaces/','/managed-office/south-bangalore/','/managed-office/one-person-office/'],route+': common footer links');
  assert.equal(state.marker.length,4,route+': four matching markers');
  for(const m of state.marker){assert.equal(m.width,'20px');assert.ok(m.bg.includes('linear-gradient'));assert.equal(m.stroke,null,route+': no legacy SVG artwork');}
  for(const s of state.sections){assert.equal(s.top,route==='/workspaces/'?'45px':mobile?'44px':'60px',route+': spacing '+s.id);assert.equal(s.bottom,s.top,route+': balanced spacing '+s.id);}
  for(const f of state.faq)assert.equal(f,mobile?'16px 18px':'20px 24px',route+': common FAQ padding');
  assert.ok(state.scrollWidth<=state.width+2,route+': no horizontal overflow');
  if(route.includes('/managed-office/')){
    const panel=page.locator('#office-checklist .consult-card,#consultation .lm-banner');
    const v=await panel.evaluate(e=>({bg:getComputedStyle(e).backgroundImage,border:getComputedStyle(e).borderTopWidth,shadow:getComputedStyle(e).boxShadow,blur:getComputedStyle(e).backdropFilter}));
    assert.deepEqual(v,{bg:'none',border:'0px',shadow:'none',blur:'none'},route+': common flat consultation');
  }
}

/* Actual form controls must share the approved visual system; never submit personal data. */
async function checkSharedForm(page,route,mobile){
  const form=page.locator('.we-form-main');
  assert.equal(await form.count(),1,route+': one main enquiry form');
  const panel=page.locator('.we-form-panel:not(#speak-dialog *)');
  assert.equal(await panel.count(),1,route+': one glass enclosure');
  const box=await panel.evaluate(el=>{const s=getComputedStyle(el);return {blur:s.backdropFilter,radius:s.borderRadius,title:getComputedStyle(el.querySelector('h2,h3')).fontSize};});
  assert.ok(box.blur.includes('blur(26px)'),route+': common glass blur');
  assert.equal(box.radius,mobile?'25px':'30px',route+': common enclosure radius');
  assert.equal(box.title,'21px',route+': common form heading');
  const fields=await form.locator('.we-field').evaluateAll(els=>els.map(el=>{
    const c=el.querySelector('input,select,textarea'),label=el.querySelector('label,span');
    return {id:c.id,kind:c.tagName, height:getComputedStyle(c).height,radius:getComputedStyle(c).borderRadius,
      label:getComputedStyle(label).position,placeholder:c.getAttribute('placeholder'),marker:getComputedStyle(el,'::after').display,backgroundImage:getComputedStyle(c).backgroundImage};
  }));
  assert.ok(fields.length>=5,route+': existing form fields preserved');
  for(const f of fields){
    assert.equal(f.radius,'13px',route+': '+f.id+' common field radius');
    assert.equal(f.height,f.kind==='TEXTAREA'?(route==='/workspaces/'?'80px':'108px'):'54px',route+': '+f.id+' common field height');
    assert.equal(f.label,'absolute',route+': '+f.id+' internal label');
    assert.equal(f.marker,'none',route+': '+f.id+' no wrapper disclosure arrow');
    assert.equal(f.backgroundImage!=='none',f.kind==='SELECT',route+': '+f.id+' disclosure indicator only on select');
    if(f.kind!=='SELECT')assert.equal(f.placeholder,' ',route+': '+f.id+' no conflicting placeholder');
  }
  const first=await form.locator('input[autocomplete=given-name]').count();
  const last=await form.locator('input[autocomplete=family-name]').count();
  const email=await form.locator('input[type=email]').count();
  assert.equal(first,1,route+': first name');assert.equal(last,1,route+': optional last name');assert.equal(email,1,route+': optional work email');
  assert.equal(await form.locator('input[autocomplete=family-name]').getAttribute('required'),null);
  assert.equal(await form.locator('input[type=email]').getAttribute('required'),null);
  await form.locator('button[type=submit] svg.we-action-chevron').waitFor({state:'attached'});
  assert.equal(await form.locator('button[type=submit] svg.we-action-chevron path').getAttribute('d'),'M9 5l7 7-7 7');
  if(route==='/workspaces/'){
    await page.waitForFunction(()=>Math.abs(Number(document.querySelector('#top.hp-b').dataset.visibleNavGap)-80)<=1);
  }
  if(route==='/managed-office/one-person-office/'){
    assert.equal(await page.locator('#consultation #open-speak').innerText(),'Book a consultation');
    assert.equal(await page.locator('#speak-dialog').count(),1);
  }
  const submit=await form.locator('button[type=submit]').evaluate(el=>{const s=getComputedStyle(el);return {size:s.fontSize,weight:s.fontWeight,radius:s.borderRadius};});
  assert.deepEqual(submit,{size:'13px',weight:'600',radius:'13px'},route+': common CTA typography');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await desktop.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await desktop.locator('.em-nav').waitFor({ timeout: 15000 });
      await checkPageBackground(desktop,route);
      await checkTypography(desktop,route,false);
      if(route==='/managed-office/one-person-office/'){
        const title=desktop.locator('#heroTitle');
        assert.equal(await title.innerText(),'One Person Office');
        assert.equal(await title.locator('span.red').innerText(),'One Person');
        assert.equal(await title.locator('span.red').evaluate(e=>getComputedStyle(e).color),'rgb(237, 32, 36)');
      }
      await checkTypographyCoverage(desktop,route,false);
      await checkSharedForm(desktop,route,false);
      await checkButtons(desktop,route,false);
      await checkCardFamilies(desktop,route,false);
      await checkSectionPanels(desktop,route,false);
      await checkFaqIndicators(desktop,route);
      await checkFinalConsistency(desktop,route,false);
      const state = await desktop.evaluate(() => {
        const nav = document.querySelector('.em-nav');
        const box = nav.getBoundingClientRect();
        const old = document.querySelector('.em-nav-replaced');
        return {
          routes: [...nav.querySelectorAll('.em-nav__links a')].map(a => a.getAttribute('href')),
          selected: [...nav.querySelectorAll('.em-nav__links [aria-current="page"]')].map(a => a.getAttribute('href')),
          originalHidden: !!old && old.hasAttribute('inert') && old.getAttribute('aria-hidden') === 'true',
          withinViewport: box.left >= 0 && box.right <= window.innerWidth + 2,
          callHref: nav.querySelector('.em-nav__call')?.getAttribute('href'),
          callText: nav.querySelector('.em-nav__call')?.textContent.trim(),
          enquireHref: nav.querySelector('.em-nav__cta')?.getAttribute('href'),
          oldSectionsRemoved: !nav.querySelector('.em-nav__sections'),
          glassBackdrop: getComputedStyle(nav).backdropFilter || getComputedStyle(nav).webkitBackdropFilter,
          translucentSurface: getComputedStyle(nav).backgroundImage,
          navFont: getComputedStyle(nav.querySelector('.em-nav__link')).fontFamily
        };
      });
      assert.deepEqual(state.routes, routes, route + ': links to all four pages');
      assert.deepEqual(state.selected, [route], route + ': active page highlighted');
      assert.ok(state.originalHidden, route + ': inaccessible duplicate header');
      assert.ok(state.withinViewport, route + ': header fits viewport');
      assert.equal(state.callHref, 'tel:+919814953954', route + ': Call now dials existing business number');
      assert.equal(state.callText, 'Call now', route + ': Call now visible');
      assert.ok(state.enquireHref.startsWith('#'), route + ': enquiry CTA preserved');
      assert.ok(state.oldSectionsRemoved, route + ': obsolete On this page dropdown removed');
      assert.ok(state.glassBackdrop.includes('blur('), route + ': liquid glass blur enabled');
      assert.ok(state.translucentSurface.includes('linear-gradient('), route + ': translucent glass surface');
      assert.ok(state.navFont.includes('Poppins'), route + ': original navigation typography');
      for(const width of [1440,1264,1181]){
        await desktop.setViewportSize({width,height:900});
        await desktop.evaluate(()=>document.fonts.ready);
        const metrics=await desktop.locator('.em-nav').evaluate(nav=>{
          const links=[...nav.querySelectorAll('.em-nav__link')],brand=nav.querySelector('.em-nav__brand').getBoundingClientRect(),actions=nav.querySelector('.em-nav__actions').getBoundingClientRect();
          return {types:links.map(a=>{const s=getComputedStyle(a);return [s.fontSize,s.fontWeight]}),fit:links[0].getBoundingClientRect().left>=brand.right-1&&links.at(-1).getBoundingClientRect().right<=actions.left+1};
        });
        assert.deepEqual(metrics.types,Array(4).fill(['16px','600']),route+': navigation font '+width);
        assert.ok(metrics.fit,route+': navigation labels fit '+width);
      }
      await desktop.setViewportSize({width:1440,height:900});

      const call=desktop.locator('.em-nav__call');await call.hover();
      await desktop.waitForFunction(()=>getComputedStyle(document.querySelector('.em-nav__call')).backgroundColor==='rgb(237, 32, 36)');
      assert.equal(await call.evaluate(e=>getComputedStyle(e).color),'rgb(255, 255, 255)');
      await desktop.mouse.move(2,130);
      assert.equal(await desktop.locator('footer a[href="/legal/"]').count(),1);
      if (route === '/') {
        await desktop.screenshot({ path: path.join(SHOTS, 'home-desktop.png'), animations: 'disabled' });
      }
      if (route === '/managed-office/south-bangalore/') {
        await desktop.screenshot({ path: path.join(SHOTS, 'managed-office-desktop.png'), animations: 'disabled' });
      }

      // Existing enquiry link remains a local section jump, not a cross-page redirect.
      const enquire = desktop.locator('.em-nav__cta');
      assert.ok((await enquire.getAttribute('href')).startsWith('#'));

      await desktop.close();

      const mobile = await browser.newPage({
        viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true
      });
      await mobile.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await checkPageBackground(mobile,route);
      const toggle = mobile.locator('.em-nav__toggle');
      await toggle.waitFor({ state: 'visible', timeout: 15000 });
      await checkTypography(mobile,route,true);
      await checkTypographyCoverage(mobile,route,true);
      await checkSharedForm(mobile,route,true);
      await checkButtons(mobile,route,true);
      await checkCardFamilies(mobile,route,true);
      await checkSectionPanels(mobile,route,true);
      await checkFaqIndicators(mobile,route);
      await checkFinalConsistency(mobile,route,true);
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true', route + ': hamburger opens');
      assert.equal(await mobile.locator('.em-nav__mobile').isVisible(), true, route + ': mobile panel visible');
      assert.equal(await mobile.locator('.em-nav__mobile-call').getAttribute('href'), 'tel:+919814953954', route + ': mobile Call now');
      assert.equal(await mobile.locator('.em-nav__mobile-cta').getAttribute('href'),
        route === '/' ? '#enquire' : '#enquiry', route + ': mobile enquiry link');

      if (route === '/managed-office/south-bangalore/') {
        await mobile.screenshot({ path: path.join(SHOTS, 'managed-office-mobile-menu.png'), animations: 'disabled' });
      }
      const destination = routes[(i + 1) % routes.length];
      const mobileFonts=await mobile.locator('.em-nav__mobile-link').evaluateAll(links=>links.map(a=>{const s=getComputedStyle(a);return [s.fontSize,s.fontWeight]}));
      assert.deepEqual(mobileFonts,Array(4).fill(['16px','600']),route+': mobile navigation font');
      await mobile.locator('.em-nav__mobile-link[href="' + destination + '"]').click();
      await mobile.waitForURL('**' + destination, { timeout: 15000 });
      assert.equal(new URL(mobile.url()).pathname, destination, route + ': mobile cross-page link works');
      await mobile.close();
      console.log('BROWSER NAVIGATION OK: ' + route);
    }

    // The category's One-Person Office card must open the page, not the enquiry form.
    const category = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await category.goto(BASE + '/managed-office/south-bangalore/', { waitUntil: 'domcontentloaded' });
    const card = category.locator('#one-person-office');
    assert.equal(await card.getAttribute('href'), '/managed-office/one-person-office/');
    await card.click({ timeout: 20000 });
    await category.waitForURL('**/managed-office/one-person-office/', { timeout: 20000 });
    console.log('BROWSER NAVIGATION OK: One-Person Office card opens detail page');
    await category.close();
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
