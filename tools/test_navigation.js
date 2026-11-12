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

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await desktop.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await desktop.locator('.em-nav').waitFor({ timeout: 15000 });
      const state = await desktop.evaluate(() => {
        const nav = document.querySelector('.em-nav');
        const box = nav.getBoundingClientRect();
        const old = document.querySelector('.em-nav-replaced');
        return {
          routes: [...nav.querySelectorAll('.em-nav__links a')].map(a => a.getAttribute('href')),
          selected: [...nav.querySelectorAll('.em-nav__links [aria-current="page"]')].map(a => a.getAttribute('href')),
          originalHidden: !!old && old.hasAttribute('inert') && old.getAttribute('aria-hidden') === 'true',
          withinViewport: box.left >= 0 && box.right <= window.innerWidth + 2,
          sections: nav.querySelectorAll('.em-nav__section-link').length
        };
      });
      assert.deepEqual(state.routes, routes, route + ': links to all four pages');
      assert.deepEqual(state.selected, [route], route + ': active page highlighted');
      assert.ok(state.originalHidden, route + ': inaccessible duplicate header');
      assert.ok(state.withinViewport, route + ': header fits viewport');
      assert.ok(state.sections >= 4, route + ': on-page section choices');

      if (route === '/') {
        await desktop.screenshot({ path: path.join(SHOTS, 'home-desktop.png'), animations: 'disabled' });
      }
      if (route === '/managed-office/south-bangalore/') {
        await desktop.screenshot({ path: path.join(SHOTS, 'managed-office-desktop.png'), animations: 'disabled' });
      }

      const details = desktop.locator('.em-nav__sections');
      await details.locator('summary').click();
      assert.equal(await details.getAttribute('open'), '', route + ': section menu expands');
      const firstHash = await details.locator('a[href^="#"]').first().getAttribute('href');
      await details.locator('a[href^="#"]').first().click();
      await desktop.waitForTimeout(100);
      assert.equal(new URL(desktop.url()).hash, firstHash, route + ': section link jumps locally');
      assert.equal(await details.getAttribute('open'), null, route + ': dropdown closes after selection');

      await desktop.close();

      const mobile = await browser.newPage({
        viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true
      });
      await mobile.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
      const toggle = mobile.locator('.em-nav__toggle');
      await toggle.waitFor({ state: 'visible', timeout: 15000 });
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true', route + ': hamburger opens');
      assert.equal(await mobile.locator('.em-nav__mobile').isVisible(), true, route + ': mobile panel visible');

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
