/* Shared behaviour for every page: lead delivery + small progressive fixes. */
(function () {
  'use strict';
  var C = window.EMLEN_CONFIG || {};
  var LABELS = { name: 'Name', phone: 'Phone', email: 'Email', teamSize: 'Team size', workspaceType: 'Workspace type',
    requirements: 'Requirements', recommendation: 'Recommended', alternative: 'Alternative', location: 'Location',
    office: 'Office', timeline: 'Move-in', priority: 'Priority', moveIn: 'Move-in', interest: 'Interested in', detail: 'Selected option' };

  function waUrl(text) { return 'https://wa.me/' + (C.whatsappNumber || '919814953954') + '?text=' + encodeURIComponent(text); }

  function format(payload, intro) {
    var lines = [intro || 'Hello Workspace by Emlen, I would like a callback.'];
    function add(k, v) { if (v !== undefined && v !== null && String(v).trim() !== '') lines.push((LABELS[k] || k) + ': ' + v); }
    Object.keys(payload).forEach(function (k) {
      if (k === 'source' || k === 'page' || k === 'message' || k === 'submittedAt') return;
      var v = payload[k];
      if (v && typeof v === 'object') Object.keys(v).forEach(function (s) { add(s, v[s]); }); else add(k, v);
    });
    return lines.join('\n');
  }

  function post(data) {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 12000) : null;
    return fetch(C.leadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); })
      .then(function () { if (timer) clearTimeout(timer); }, function (e) { if (timer) clearTimeout(timer); throw e; });
  }

  /* deliver(message, payload, statusEl) -> Promise<{mode:'api'|'whatsapp'}>
     MUST be called synchronously from the submit handler: the WhatsApp fallback opens a window,
     which browsers only allow inside a user gesture. */
  function deliver(message, payload, statusEl) {
    var data = Object.assign({ page: location.pathname, message: message, submittedAt: new Date().toISOString() }, payload || {});
    function say(t) { if (statusEl) { statusEl.hidden = false; statusEl.textContent = t; } }
    if (C.leadEndpoint) {
      say('Sending…');
      return post(data).then(function () {
        say('Thanks, we have your request. Our team will get back to you shortly.');
        return { mode: 'api' };
      }, function (e) {
        say('We could not send your request. Please try again, or call ' + '+91 98149 53954' + '.');
        throw e;
      });
    }
    /* no "noopener" feature: it makes window.open() return null, which looks exactly like a blocked popup */
    var w = window.open(waUrl(message), '_blank');
    if (!w) {
      say('Your browser blocked WhatsApp from opening. Please allow pop-ups and submit again, or call +91 98149 53954.');
      return Promise.reject(new Error('popup-blocked'));
    }
    try { w.opener = null; } catch (e) { /* cross-origin already */ }
    say('WhatsApp opened with your details. Please press Send there to complete your request.');
    return Promise.resolve({ mode: 'whatsapp' });
  }

  window.EmlenLead = {
    deliver: deliver,
    submit: function (payload, opts) { return deliver(format(payload, opts && opts.intro), payload, null); },
    format: format, waUrl: waUrl, hasEndpoint: function () { return !!C.leadEndpoint; }
  };

  document.addEventListener('DOMContentLoaded', function () {
    /* App store buttons: link if configured, otherwise honest "coming soon" instead of a dead '#' link */
    document.querySelectorAll('.ap-bt a').forEach(function (a) {
      var ios = /iOS/i.test(a.textContent), url = ios ? C.appStoreUrl : C.playStoreUrl;
      if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; return; }
      a.removeAttribute('href'); a.setAttribute('role', 'link'); a.setAttribute('aria-disabled', 'true');
      a.setAttribute('data-soon', 'Coming soon');
    });
    /* Any other external link opened in a new tab must not get window.opener */
    document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
      var rel = (a.getAttribute('rel') || '').split(/\s+/);
      ['noopener', 'noreferrer'].forEach(function (r) { if (rel.indexOf(r) < 0) rel.push(r); });
      a.setAttribute('rel', rel.join(' ').trim());
    });
  });
})();
