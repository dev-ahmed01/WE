/* Workspaces refinements: browser-level regression checks. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const BASE = process.argv[2] || 'http://127.0.0.1:8802';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(BASE + '/workspaces/', { waitUntil: 'domcontentloaded' });
      assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),
        'noindex, nofollow', 'Workspaces is noindex and nofollow');
      assert.equal(await page.locator('#spaces').count(), 0, 'redundant office carousel removed');
      assert.equal(await page.locator('.hp-sub').count(), 0, 'hero subheading removed');
      assert.match(await page.locator('#locations h2').innerText(), /Jayanagar workspace/);
      assert.equal(await page.locator('#locations .we-lc__bar').isVisible(), false,
        'locations carousel not visible');
      assert.equal(await page.locator('#locationMap').count(), 1, 'neighbourhood map retained');

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
      const groups = page.locator('#weAmPop .we-pop__column');
      assert.equal(await groups.count(), 3, 'three vertical amenity groups');
      assert.deepEqual(await groups.locator('.we-pop__category').allInnerTexts(),
        ['Work & productivity','Comfort & facilities','People & experience']);
      assert.deepEqual(await groups.locator('.we-pop__tile').count(), 16);
      assert.deepEqual(await groups.evaluateAll(els => els.map(el=>el.querySelectorAll('.we-pop__tile').length)),
        [5,6,5], 'amenity tiles are evenly grouped');
      assert.equal(await page.locator('#weAmPop .we-pop__tile').first()
        .evaluate(el => getComputedStyle(el,'::before').display), 'none', 'no modal red fill');
      await page.locator('#closeAmenities').click();
      await page.locator('#weAmPop[hidden]').waitFor({ timeout: 8000 });
      await page.close();
      console.log('WORKSPACES UI OK: width=' + width);
    }
    const response = await browser.newPage();
    const sitemap = await (await response.request.get(BASE + '/sitemap.xml')).text();
    assert.ok(!sitemap.includes('<loc>' + BASE + '/workspaces/</loc>'));
    assert.ok(!sitemap.includes('/workspaces/'), 'Workspaces excluded from sitemap');
    assert.ok(sitemap.includes('/managed-office/south-bangalore/'), 'other indexed pages retained');
    await response.close();
    console.log('WORKSPACES SEO OK');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
