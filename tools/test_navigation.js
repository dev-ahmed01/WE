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
      return {element:el.tagName+'#'+el.id+'.'+el.className, color:style.backgroundColor,image:style.backgroundImage};
    });
  });
  assert.ok(state.length>=8,route+': main sections found');
  for(const surface of state){
    assert.equal(surface.color,'rgb(255, 255, 255)',route+': white '+surface.element);
    assert.equal(surface.image,'none',route+': no page gradient '+surface.element);
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
      card:pick('.cd h3,.we-hl__txt h3,.hero .card-title'),
      body:pick('.desc,.hp-b .hp-desc p,.hero .copy p:not(.eyebrow),.hero-intro'),
      action:pick('.em-nav__cta'),
      anchor:pick('.em-nav__link')
    };
  });
  for(const [role,value] of Object.entries(roles)){
    assert.ok(value,route+': '+role+' present');
    const heading=role==='section'||role==='card';
    assert.ok(value.family.includes(heading?'Bricolage Grotesque':'Poppins'),route+': '+role+' face');
    const weights={section:'700',card:'600',body:'400',action:'600',anchor:'400'};
    assert.equal(value.weight,weights[role],route+': '+role+' weight');
    if(role==='section'&&mobile) assert.ok(value.size>=27 && value.size<=32,route+': responsive section heading');
    else assert.equal(value.size,{section:36,card:21,body:14,action:13,anchor:13}[role],route+': '+role+' size');
  }
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
