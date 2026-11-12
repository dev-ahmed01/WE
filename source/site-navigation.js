/* Workspace by Emlen | shared cross-page navigation
 * One consistent navigation layer for all four existing page templates.
 * Leaves their section markup, forms and animation scripts intact.
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
    '/': {
      original: 'header.nav',
      enquire: '#enquire',
      sections: [
        ['Solutions', '#why'],
        ['Find your fit', '#find-fit'],
        ['Locations', '#locations'],
        ['Testimonials', '#stories'],
        ['The Emlen App', '#app']
      ]
    },
    '/workspaces/': {
      original: 'header.we-nav',
      enquire: '#enquiry',
      sections: [
        ['Gallery', '#photos'],
        ['Amenities', '#amenities'],
        ['Workspace options', '#spaces'],
        ['Locations', '#locations'],
        ['Testimonials', '#testimonials'],
        ['FAQs', '#faqs']
      ]
    },
    '/managed-office/south-bangalore/': {
      original: 'nav.nav',
      enquire: '#enquiry',
      sections: [
        ['Office options', '#offices'],
        ['Other solutions', '#other-solutions'],
        ['Benefits', '#benefits'],
        ['Why Emlen', '#why-us'],
        ['FAQs', '#faq']
      ]
    },
    '/managed-office/one-person-office/': {
      original: 'header.site-nav',
      enquire: '#enquiry',
      sections: [
        ['Office options', '#options'],
        ['Customisation', '#customise'],
        ['Benefits', '#benefits'],
        ['How it works', '#how-it-works'],
        ['Locations', '#locations'],
        ['FAQs', '#faqs']
      ]
    }
  };

  function start() {
    var path = window.location.pathname.replace(/\/index\.html$/, '/');
    if (path !== '/' && !path.endsWith('/')) path += '/';
    var config = byPage[path];
    if (!config) return;

    var original = document.querySelector(config.original);
    var brand = original && original.querySelector('a img');
    if (!original || !brand || !brand.getAttribute('src')) return;

    var sections = config.sections.filter(function (entry) {
      return document.getElementById(entry[1].slice(1));
    });

    function pageLinks(className) {
      return pages.map(function (page) {
        var current = page.path === path;
        return '<a class="' + className + (current ? ' is-current' : '') +
          '" href="' + page.path + '"' +
          (current ? ' aria-current="page"' : '') + '>' + page.label + '</a>';
      }).join('');
    }

    function sectionLinks(className) {
      return sections.map(function (entry) {
        return '<a class="' + className + '" href="' + entry[1] + '">' + entry[0] + '</a>';
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
        (sections.length ?
          '<details class="em-nav__sections">' +
            '<summary>On this page<span class="em-nav__chevron" aria-hidden="true"></span></summary>' +
            '<div class="em-nav__sections-panel">' +
              '<span class="em-nav__eyebrow">JUMP TO SECTION</span>' +
              sectionLinks('em-nav__section-link') +
            '</div>' +
          '</details>' : '') +
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
        (sections.length ?
          '<div class="em-nav__mobile-sections">' +
            '<span class="em-nav__eyebrow">ON THIS PAGE</span>' +
            sectionLinks('em-nav__mobile-section-link') +
          '</div>' : '') +
        '<a class="em-nav__mobile-cta" href="' + config.enquire + '">Enquire now</a>' +
      '</div>';

    // Only replace the old visual header after the new one is ready.
    // Keep it in the document, so existing page-specific JS can still find it.
    document.body.appendChild(header);
    original.setAttribute('inert', '');
    original.setAttribute('aria-hidden', 'true');
    original.classList.add('em-nav-replaced');
    document.documentElement.classList.add('em-site-navigation-ready');

    var toggle = header.querySelector('.em-nav__toggle');
    var panel = header.querySelector('.em-nav__mobile');
    var details = header.querySelector('.em-nav__sections');

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

    if (details) {
      details.addEventListener('click', function (event) {
        if (event.target.closest('a[href]')) details.open = false;
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (details) details.open = false;
        if (!panel.hidden) {
          setMobile(false);
          toggle.focus({ preventScroll: true });
        }
      }
    });

    document.addEventListener('pointerdown', function (event) {
      if (!header.contains(event.target)) {
        if (details) details.open = false;
        if (!panel.hidden) setMobile(false);
      }
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
