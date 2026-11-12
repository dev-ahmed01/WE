/* Build-time audit for the shared page navigation; no browser dependency. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(process.argv[2] || 'public');
const nav = fs.readFileSync(path.resolve('source/site-navigation.js'), 'utf8');
const routes = ['/', '/workspaces/', '/managed-office/south-bangalore/', '/managed-office/one-person-office/'];

function matchOne(pattern, label) {
  const found = nav.match(pattern);
  if (!found) throw new Error('Cannot extract ' + label + ' from site-navigation.js');
  return found[1];
}

const pages = vm.runInNewContext('(' + matchOne(/var pages = (\[[\s\S]*?\]);\s*var byPage/, 'page list') + ')');
const pageConfig = vm.runInNewContext('(' + matchOne(/var byPage = (\{[\s\S]*?\});\s*\/\/ Public contact/, 'page config') + ')');

for (const route of routes) {
  const htmlPath = path.join(root, route === '/' ? 'index.html' : route.slice(1) + 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const cfg = pageConfig[route];
  if (!cfg) throw new Error(route + ': missing navigation configuration');
  if (!pages.some(p => p.path === route)) throw new Error(route + ': missing global navigation route');
  if (!/href="\/assets\/css\/site-navigation\.[a-f0-9]{10}\.css"/.test(html)) throw new Error(route + ': versioned navigation CSS missing');
  if (!/src="\/assets\/js\/site-navigation\.[a-f0-9]{10}\.js"/.test(html)) throw new Error(route + ': versioned navigation JS missing');
  if (!html.includes('id="' + cfg.enquire.slice(1) + '"')) throw new Error(route + ': enquiry anchor missing');
  if (!nav.includes("var phone = 'tel:+919814953954'")) {
    throw new Error(route + ': phone number missing in global nav');
  }
  if (nav.includes('On this page') || nav.includes('em-nav__sections')) {
    throw new Error(route + ': section dropdown must be removed');
  }
  console.log('NAVIGATION OK: ' + route + ' (four pages, Call now + Enquire now)');
}

for (const page of pages) {
  if (!routes.includes(page.path)) throw new Error('Unexpected page route: ' + page.path);
}

const category = fs.readFileSync(path.join(root, 'managed-office/south-bangalore/index.html'), 'utf8');
const onePersonCard = category.match(/<a\b[^>]*id="one-person-office"[^>]*>/);
if (!onePersonCard ||
    !onePersonCard[0].includes('href="/managed-office/one-person-office/"') ||
    onePersonCard[0].includes('data-office=')) {
  throw new Error('One-Person Office card must open its detail page');
}
console.log('NAVIGATION OK: category office card links to its detail page');
