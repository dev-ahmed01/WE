/* Workspace by Emlen | primary cross-page navigation
 * Four page routes, translucent liquid-glass surface, accessible mobile panel.
 * Keeps all original page sections, source markup and animation bindings intact.
 */
(function () {
  'use strict';

  var pages = [
    { path: '/', label: 'Home' },
    { path: '/workspaces/', label: 'Workspaces' },
    { path: '/managed-office/south-bangalore/', label: 'Managed Offices' },
    { path: '/managed-office/one-person-office/', label: 'One-Person Office' }
  ];

  var byPage = {
    '/': { original: 'header.nav', enquire: '#enquire' },
    '/workspaces/': { original: 'header.we-nav', enquire: '#enquiry' },
    '/managed-office/south-bangalore/': { original: 'nav.nav', enquire: '#enquiry' },
    '/managed-office/one-person-office/': { original: 'header.site-nav', enquire: '#enquiry' }
  };

  // Public contact number is already used by the site's existing Call now links.
  var phone = 'tel:+919814953954';
  var phoneIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.7 19.7 0 0 1 3 5.2 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.7l.5 2.9a2 2 0 0 1-.6 1.8L8.4 11a16 16 0 0 0 4.6 4.6l1.6-1.5a2 2 0 0 1 1.8-.6l2.9.5a2 2 0 0 1 1.7 2.9Z"/>' +
    '</svg>';

  function start() {
    var path = window.location.pathname.replace(/\/index\.html$/, '/');
    if (path !== '/' && !path.endsWith('/')) path += '/';
    var config = byPage[path];
    if (!config) return;

    var original = document.querySelector(config.original);
    var brand = original && original.querySelector('a img');
    if (!original || !brand || !brand.getAttribute('src')) return;

    function pageLinks(className) {
      return pages.map(function (page) {
        var current = page.path === path;
        return '<a class="' + className + (current ? ' is-current' : '') +
          '" href="' + page.path + '"' +
          (current ? ' aria-current="page"' : '') + '>' + page.label + '</a>';
      }).join('');
    }

    var header = document.createElement('header');
    header.className = 'em-nav';
    header.setAttribute('aria-label', 'Workspace by Emlen site navigation');
    header.innerHTML =
      '<a class="em-nav__brand" href="/" aria-label="Workspace by Emlen home">' +
        '<img alt="Workspace by Emlen" src="' + brand.getAttribute('src') + '">' +
      '</a>' +
      '<nav class="em-nav__links" aria-label="Explore pages">' +
        pageLinks('em-nav__link') +
      '</nav>' +
      '<div class="em-nav__actions">' +
        '<a class="em-nav__call" href="' + phone + '" aria-label="Call Workspace by Emlen">' +
          phoneIcon + '<span>Call now</span></a>' +
        '<a class="em-nav__cta" href="' + config.enquire + '">Enquire now</a>' +
        '<button type="button" class="em-nav__toggle" aria-controls="em-nav-mobile-panel"' +
          ' aria-expanded="false" aria-label="Open navigation">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
      '</div>' +
      '<div class="em-nav__mobile" id="em-nav-mobile-panel" hidden>' +
        '<span class="em-nav__eyebrow">EXPLORE WORKSPACE BY EMLEN</span>' +
        '<nav class="em-nav__mobile-pages" aria-label="Mobile page navigation">' +
          pageLinks('em-nav__mobile-link') +
        '</nav>' +
        '<div class="em-nav__mobile-actions">' +
          '<a class="em-nav__mobile-call" href="' + phone + '">' + phoneIcon + 'Call now</a>' +
          '<a class="em-nav__mobile-cta" href="' + config.enquire + '">Enquire now</a>' +
        '</div>' +
      '</div>';

    // Replace only the visual header once the shared header is ready.
    // Inert original stays in the DOM for legacy site-specific scripts.
    document.body.appendChild(header);
    original.setAttribute('inert', '');
    original.setAttribute('aria-hidden', 'true');
    original.classList.add('em-nav-replaced');
    document.documentElement.classList.add('em-site-navigation-ready');

    var toggle = header.querySelector('.em-nav__toggle');
    var panel = header.querySelector('.em-nav__mobile');
    function setMobile(open) {
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      header.classList.toggle('em-nav--open', open);
    }

    toggle.addEventListener('click', function () {
      setMobile(panel.hidden);
      if (!panel.hidden) {
        var first = panel.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      }
    });
    panel.addEventListener('click', function (event) {
      if (event.target.closest('a[href]')) setMobile(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) {
        setMobile(false);
        toggle.focus({ preventScroll: true });
      }
    });
    document.addEventListener('pointerdown', function (event) {
      if (!header.contains(event.target) && !panel.hidden) setMobile(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1180 && !panel.hidden) setMobile(false);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
