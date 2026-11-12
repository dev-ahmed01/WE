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
const pageConfig = vm.runInNewContext('(' + matchOne(/var byPage = (\{[\s\S]*?\});\s*function start/, 'page config') + ')');

for (const route of routes) {
  const htmlPath = path.join(root, route === '/' ? 'index.html' : route.slice(1) + 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const cfg = pageConfig[route];
  if (!cfg) throw new Error(route + ': missing navigation configuration');
  if (!pages.some(p => p.path === route)) throw new Error(route + ': missing global navigation route');
  if (!html.includes('href="/assets/css/site-navigation.css"')) throw new Error(route + ': navigation CSS missing');
  if (!html.includes('src="/assets/js/site-navigation.js"')) throw new Error(route + ': navigation JS missing');
  if (!html.includes('id="' + cfg.enquire.slice(1) + '"')) throw new Error(route + ': enquiry anchor missing');
  for (const [name, hash] of cfg.sections) {
    if (!html.includes('id="' + hash.slice(1) + '"')) {
      throw new Error(route + ': missing section ' + name + ' ' + hash);
    }
  }
  console.log('NAVIGATION OK: ' + route + ' (' + cfg.sections.length + ' section links)');
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
