// Interaction smoke tests: forms, menus, modals, carousels on mobile + desktop. Usage: node flows.js <base>
const { chromium } = require('playwright');
const base = process.argv[2];
const results = [];
const ok = (n, c, extra='') => { results.push((c ? 'PASS ' : 'FAIL ') + n + (extra ? '  ' + extra : '')); };
async function newPage(browser, mobile) {
  const ctx = await browser.newContext(mobile ? { viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2 } : { viewport:{width:1440,height:900} });
  const page = await ctx.newPage();
  page.errs = [];
  page.on('pageerror', e => page.errs.push(e.message.slice(0,160)));
  page.on('console', m => { if (m.type()==='error' && !/ERR_TUNNEL|ERR_NAME|net::/.test(m.text())) page.errs.push(m.text().slice(0,160)); });
  // capture window.open instead of really opening WhatsApp
  await page.addInitScript(() => { window.__opened = []; window.open = (u, t, f) => { window.__opened.push(u); return {}; }; });
  return page;
}
const opened = p => p.evaluate(() => window.__opened);
(async () => {
  const browser = await chromium.launch();
  for (const mobile of [false, true]) {
    const tag = mobile ? '[m]' : '[d]';
    // ---------------- HOME
    let page = await newPage(browser, mobile);
    await page.goto(base + '/', { waitUntil: 'load' }); await page.waitForTimeout(800);
    const nav = await page.$$eval('header.nav a', as => as.map(a => a.getAttribute('href')));
    ok(tag + ' home nav links', nav.includes('/workspaces/') && nav.includes('/'), nav.join(' '));
    // matchmaker: answer the three questions
    for (const sel of ['.qb[data-q="size"] button', '.qb[data-q="need"] button', '.qb[data-q="when"] button']) {
      await page.locator(sel).first().scrollIntoViewIfNeeded(); await page.locator(sel).first().click();
    }
    await page.waitForTimeout(400);
    const openBtn = page.locator('#open'); ok(tag + ' home matchmaker shows offer button', await openBtn.count() === 1);
    await openBtn.click(); await page.waitForTimeout(300);
    ok(tag + ' home modal opens', await page.locator('#md.on').count() === 1);
    await page.fill('#fn', 'Test User'); await page.fill('#fp', '9876543210'); await page.click('#msub'); await page.waitForTimeout(500);
    const o1 = await opened(page);
    ok(tag + ' home modal -> WhatsApp handoff', o1.length === 1 && o1[0].startsWith('https://wa.me/919814953954?text='), decodeURIComponent((o1[0]||'').split('text=')[1]||'').replace(/\n/g,' | ').slice(0,170));
    ok(tag + ' home modal success state', await page.locator('#mdone:not([hidden])').count() === 1);
    await page.click('#dclose');
    // enquiry form
    await page.locator('#eqForm').scrollIntoViewIfNeeded();
    await page.fill('#eqN', 'A'); await page.fill('#eqP', '123'); await page.click('#eqForm button[type=submit]');
    ok(tag + ' home enquiry validates', (await opened(page)).length === 1 && await page.locator('#eqN.bad').count() === 1);
    await page.fill('#eqN', 'Test User'); await page.fill('#eqP', '+91 98765 43210'); await page.click('#eqForm button[type=submit]'); await page.waitForTimeout(400);
    ok(tag + ' home enquiry -> WhatsApp + done', (await opened(page)).length === 2 && await page.locator('#eqFm.done').count() === 1);
    const appDead = await page.$$eval('.ap-bt a', as => as.map(a => a.hasAttribute('href')));
    ok(tag + ' home app buttons not dead links', appDead.every(x => !x));
    ok(tag + ' home no errors', page.errs.length === 0, page.errs.join(' ; '));
    await page.context().close();

    // ---------------- WORKSPACES
    page = await newPage(browser, mobile);
    await page.goto(base + '/workspaces/', { waitUntil: 'load' }); await page.waitForTimeout(1500);
    ok(tag + ' ws no load errors', page.errs.length === 0, page.errs.join(' ; '));
    await page.locator('#enquiryForm').scrollIntoViewIfNeeded();
    await page.click('#enquiryForm button[type=submit]'); await page.waitForTimeout(200);
    ok(tag + ' ws empty submit blocked', (await opened(page)).length === 0);
    await page.fill('#name', 'Test User'); await page.fill('#phone', '+91 98765 43210'); await page.selectOption('#team', { index: 2 });
    await page.click('#enquiryForm button[type=submit]'); await page.waitForTimeout(400);
    const w = await opened(page);
    ok(tag + ' ws form -> WhatsApp', w.length === 1, decodeURIComponent((w[0]||'').split('text=')[1]||'').replace(/\n/g,' | ').slice(0,150));
    ok(tag + ' ws status text', /WhatsApp opened/.test(await page.textContent('#formStatus')));
    await page.locator('#faqList .faq-q').first().scrollIntoViewIfNeeded(); await page.locator('#faqList .faq-q').first().click();
    ok(tag + ' ws faq opens', await page.locator('#faqList .faq-item.open').count() === 1);
    const photo = page.locator('#weGalGrid button, #weGalGrid a, #weGalGrid img').first();
    if (await photo.count()) { await photo.scrollIntoViewIfNeeded(); await photo.click({ force: true }).catch(()=>{}); await page.waitForTimeout(500);
      ok(tag + ' ws lightbox opens', await page.locator('#lightbox:not([hidden])').count() === 1);
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      ok(tag + ' ws lightbox closes', await page.locator('#lightbox[hidden]').count() === 1 || (await page.locator('#lightbox').getAttribute('aria-hidden')) === 'true'); }
    ok(tag + ' ws no errors after use', page.errs.length === 0, page.errs.join(' ; '));
    await page.context().close();

    // ---------------- CATEGORY
    page = await newPage(browser, mobile);
    await page.goto(base + '/managed-office/south-bangalore/', { waitUntil: 'load' }); await page.waitForTimeout(1200);
    const brand = await page.getAttribute('.nav .brand', 'href'); ok(tag + ' cat brand -> home', brand === '/');
    ok(tag + ' cat link to one-person page', await page.locator('a[href="/managed-office/one-person-office/"]').count() >= 2);
    await page.locator('#enquiry-form').scrollIntoViewIfNeeded();
    await page.fill('#fullName', 'Test User'); await page.fill('#phone', '+91 98765 43210'); await page.selectOption('#team', { index: 1 });
    await page.click('#enquiry-form button[type=submit]'); await page.waitForTimeout(400);
    const c = await opened(page);
    ok(tag + ' cat enquiry -> WhatsApp', c.length === 1, decodeURIComponent((c[0]||'').split('text=')[1]||'').replace(/\n/g,' | ').slice(0,150));
    const st = await page.textContent('#enquiry-status'); ok(tag + ' cat status says opened (not "blocked")', /WhatsApp opened/.test(st), st.slice(0,80));
    if (mobile) { await page.evaluate(() => scrollTo(0,0)); await page.click('.mobile-menu'); await page.waitForTimeout(300);
      ok(tag + ' cat mobile menu expands', (await page.getAttribute('.mobile-menu','aria-expanded')) === 'true'); }
    ok(tag + ' cat no errors', page.errs.length === 0, page.errs.join(' ; '));
    await page.context().close();

    // ---------------- ONE PERSON
    page = await newPage(browser, mobile);
    await page.goto(base + '/managed-office/one-person-office/', { waitUntil: 'load' }); await page.waitForTimeout(1200);
    ok(tag + ' sol brand -> home', (await page.getAttribute('.site-nav .brand', 'href')) === '/');
    if (mobile) { await page.click('#mobileMenu'); await page.waitForTimeout(300); ok(tag + ' sol mobile menu opens', (await page.getAttribute('#mobileMenu','aria-expanded')) === 'true');
      await page.click('#mobileMenu'); }
    await page.locator('#officeEnquiry').scrollIntoViewIfNeeded();
    await page.fill('#fullName', 'Test User'); await page.fill('#phone', '+91 98765 43210'); await page.selectOption('#locationSelect', { index: 1 });
    await page.click('#officeEnquiry button[type=submit]'); await page.waitForTimeout(400);
    const s = await opened(page);
    ok(tag + ' sol form -> WhatsApp', s.length === 1, decodeURIComponent((s[0]||'').split('text=')[1]||'').replace(/\n/g,' | ').slice(0,150));
    ok(tag + ' sol no errors', page.errs.length === 0, page.errs.join(' ; '));
    await page.context().close();
  }
  await browser.close();
  console.log(results.join('\n'));
})();
