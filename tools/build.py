#!/usr/bin/env python3
"""
Build the Workspace by Emlen static site from the four hand-off HTML pages.

  python3 tools/build.py            -> reads ./source, writes ./public

What it does (all reproducible, nothing hand-edited in the output):
  * pulls every base64 image / PDF out of HTML, CSS and JS into /assets (deduplicated by content hash)
  * pulls all <style> and <script> blocks into fingerprinted files (immutable-cache friendly)
  * shares one copy of GSAP / ScrollTrigger between pages
  * rewrites <head> (title, description, canonical, robots, Open Graph, icons, fonts, JSON-LD)
  * wires the four pages together (nav, brand -> home, footers, office tiles)
  * replaces the three different form handlers with one (API endpoint if configured, WhatsApp otherwise)
  * generates 404.html, robots.txt, sitemap.xml, manifest, favicons, OG image
Every string patch is asserted to match exactly once, so the build fails loudly if a source page changes.
"""
import base64, hashlib, html, io, json, os, re, shutil, sys, datetime
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(os.environ.get("EMLEN_SRC", ROOT / "source"))
OUT = Path(os.environ.get("EMLEN_OUT", ROOT / "public"))
SITE_URL = os.environ.get("EMLEN_SITE_URL", "https://workspacebyemlen.co.in")
TODAY = datetime.date.today().isoformat()
PHONE_TEL = "+919814953954"
PHONE_PRETTY = "+91 98149 53954"
BRAND_RED = "#ED2024"
NAV_SCRIPT = (ROOT / "source/site-navigation.js").read_text(encoding="utf-8")
NAV_STYLE = (ROOT / "source/site-navigation.css").read_text(encoding="utf-8")

PAGES = [
    dict(key="home", src="WE_Home_v28_Audited.html", out="index.html", url="/"),
    dict(key="workspaces", src="WE_property_v6.html", out="workspaces/index.html", url="/workspaces/"),
    dict(key="category", src="WE_Category.html", out="managed-office/south-bangalore/index.html",
         url="/managed-office/south-bangalore/"),
    dict(key="one-person", src="WE_Solution.html", out="managed-office/one-person-office/index.html",
         url="/managed-office/one-person-office/"),
]
HOME_DESCRIPTION = ("Flexible, fully managed workspaces in South Bengaluru: private offices, coworking and team "
                    "offices in Jayanagar, JP Nagar, Bannerghatta Road and Arekere.")

# ----------------------------------------------------------------------------------------------- helpers
def rep(text, old, new, count=1, label=""):
    n = text.count(old)
    if n != count:
        raise SystemExit(f"PATCH FAILED ({label or old[:60]!r}): expected {count} match(es), found {n}")
    return text.replace(old, new)

def sha(b):
    return hashlib.sha256(b if isinstance(b, bytes) else b.encode()).hexdigest()[:10]

def slug(s):
    s = re.sub(r"[^a-z0-9]+", "-", html.unescape(s).lower()).strip("-")
    return s[:48] or "image"

def write(path, data):
    path = OUT / path
    path.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(data, str):
        data = data.encode("utf-8")
    path.write_bytes(data)

# ----------------------------------------------------------------------------------------------- assets
IMG_NAMES = {}   # hash -> public path
EXT = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif",
       "image/svg+xml": "svg", "application/pdf": "pdf"}
DATA_RE = re.compile(r"data:([a-z]+/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]{300,})")

def label_for(text, m):
    """Best human label for a data URI from its surrounding markup (alt text / JS tuple label)."""
    before = text[max(0, m.start() - 400):m.start()]
    after = text[m.end():m.end() + 400]
    tag = re.search(r"<img[^>]*$", before)
    if tag:
        a = re.search(r'alt="([^"]+)"', before[tag.start():] + after.split(">")[0])
        if a:
            return a.group(1)
    j = re.match(r"['\"],\s*['\"]([^'\"]{3,40})['\"]", after)
    if j:
        return j.group(1)
    n = re.search(r"name:\s*'([^']+)',\s*img:\s*['\"]$", before)
    if n:
        return n.group(1)
    if "application/pdf" in m.group(1):
        return "office-decision-checklist"
    return ""

def extract_data_uris(text):
    def sub(m):
        mime, b64 = m.group(1), m.group(2)
        raw = base64.b64decode(b64)
        h = sha(raw)
        if h not in IMG_NAMES:
            ext = EXT.get(mime, "bin")
            folder = "files" if ext == "pdf" else "img"
            name = f"{slug(label_for(text, m)) if label_for(text, m) else 'img'}-{h[:8]}.{ext}"
            IMG_NAMES[h] = f"/assets/{folder}/{name}"
            write(IMG_NAMES[h].lstrip("/"), raw)
        return IMG_NAMES[h]
    return DATA_RE.sub(sub, text)

def asset(kind, stem, content):
    """Write a fingerprinted css/js asset, return its public path."""
    name = f"{stem}.{sha(content)}.{kind}"
    folder = "css" if kind == "css" else "js"
    path = f"/assets/{folder}/{name}"
    write(path.lstrip("/"), content)
    return path

# ----------------------------------------------------------------------------------------------- html parsing
STYLE_RE = re.compile(r"<style([^>]*)>(.*?)</style>", re.S)
SCRIPT_RE = re.compile(r"<script([^>]*)>(.*?)</script>", re.S)
FONT_RE = re.compile(r"https://fonts\.googleapis\.com/css2\?[^\"')\s]+")

def split_head_body(text):
    m = re.search(r"<body[^>]*>", text)
    return text[:m.start()], m.group(0), text[m.end():].replace("</body>", "").replace("</html>", "").rstrip() + "\n"

def collect_meta(head):
    metas = {}
    for m in re.finditer(r"<meta\b([^>]*?)/?>", head):
        attrs = dict(re.findall(r'([\w:-]+)="([^"]*)"', m.group(1)))
        key = attrs.get("name") or attrs.get("property")
        if key and "content" in attrs:
            metas[key] = html.unescape(attrs["content"])
    return metas

def build_css(head, key):
    parts, font_url = [], None
    for m in STYLE_RE.finditer(head):
        css = m.group(2)
        sid = re.search(r'id="([^"]+)"', m.group(1))
        imp = re.search(r"@import\s+url\((['\"]?)(https://fonts\.googleapis\.com[^)'\"]+)\1\)\s*;?", css)
        if imp:
            font_url = html.unescape(imp.group(2))
            css = css.replace(imp.group(0), "")
        parts.append(f"/* ---- {sid.group(1) if sid else 'base'} ---- */\n{css.strip()}\n")
    css = "\n".join(parts)
    return css, font_url

def extract_scripts(body, key):
    """Replace every <script> in the body with deferred external references; returns new body."""
    pos, out, n = 0, [], 0
    pending = []        # consecutive inline scripts get merged into one file

    def flush():
        nonlocal n
        if pending:
            n += 1
            out.append(f'<script src="{asset("js", f"{key}-{n}", chr(10).join(pending))}" defer></script>')
            pending.clear()

    for m in SCRIPT_RE.finditer(body):
        between = body[pos:m.start()]
        attrs, code = m.group(1), m.group(2)
        if between.strip():
            flush()
        out.append(between if between.strip() else "")
        pos = m.end()
        if "src=" in attrs:
            raise SystemExit("unexpected external script in source")
        if "ld+json" in attrs:
            flush(); out.append(m.group(0)); continue
        vendor = re.match(r"\s*/\*!\s*\n\s*\*\s*(GSAP|ScrollTrigger)\s+([\d.]+)", code)
        if vendor:
            flush()
            out.append(f'<script src="{asset("js", f"vendor/{vendor.group(1).lower()}-{vendor.group(2)}", code)}" defer></script>')
            continue
        pending.append(code.strip() + ";")
    flush()
    out.append(body[pos:])
    return "".join(out)

# ----------------------------------------------------------------------------------------------- head
def make_head(page, metas, css_path, font_url, title, extra_css=()):
    url = SITE_URL + page["url"]
    desc = metas.get("description") or HOME_DESCRIPTION
    og_title = metas.get("og:title") or title
    og_desc = metas.get("og:description") or desc
    parts = [
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
        f"<title>{html.escape(title)}</title>",
        f'<meta name="description" content="{html.escape(desc, quote=True)}">',
        '<meta name="robots" content="index, follow, max-image-preview:large">',
        f'<link rel="canonical" href="{url}">',
        f'<meta name="theme-color" content="{metas.get("theme-color", "#ffffff")}">',
        '<meta name="format-detection" content="telephone=no">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="Workspace by Emlen">',
        '<meta property="og:locale" content="en_IN">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:title" content="{html.escape(og_title, quote=True)}">',
        f'<meta property="og:description" content="{html.escape(og_desc, quote=True)}">',
        f'<meta property="og:image" content="{SITE_URL}/assets/img/og-image.jpg">',
        '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
        '<link rel="icon" href="/favicon.ico" sizes="32x32">',
        '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
        '<link rel="manifest" href="/site.webmanifest">',
        '<link rel="preconnect" href="https://fonts.googleapis.com">',
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    ]
    if font_url:
        parts.append(f'<link rel="stylesheet" href="{html.escape(font_url, quote=True)}">')
    parts.append(f'<link rel="stylesheet" href="{css_path}">')
    parts.append('<link rel="stylesheet" href="/assets/css/site.css">')
    parts.append(f'<link rel="stylesheet" href="/assets/css/site-navigation.{sha(NAV_STYLE)}.css">')
    parts.append('<script src="/assets/js/config.js"></script>')
    parts.append('<script src="/assets/js/site.js" defer></script>')
    parts.append(f'<script src="/assets/js/site-navigation.{sha(NAV_SCRIPT)}.js" defer></script>')
    return "\n".join(parts)

def json_ld(page):
    crumbs = {"home": [("Home", "/")],
              "workspaces": [("Home", "/"), ("Workspaces", "/workspaces/")],
              "category": [("Home", "/"), ("Managed offices in South Bangalore", page["url"])],
              "one-person": [("Home", "/"), ("Managed offices in South Bangalore",
                                             "/managed-office/south-bangalore/"),
                             ("One Person Office", page["url"])]}[page["key"]]
    graph = []
    if page["key"] == "home":
        graph.append({
            "@type": "Organization", "@id": SITE_URL + "/#org", "name": "Workspace by Emlen", "url": SITE_URL + "/",
            "logo": SITE_URL + "/assets/img/og-image.jpg", "telephone": PHONE_TEL,
            "areaServed": ["Jayanagar", "JP Nagar", "Bannerghatta Road", "Arekere", "Bengaluru"],
            "contactPoint": {"@type": "ContactPoint", "telephone": PHONE_TEL, "contactType": "sales",
                             "areaServed": "IN", "availableLanguage": ["en"]}})
    if len(crumbs) > 1:
        graph.append({"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE_URL + u}
            for i, (n, u) in enumerate(crumbs)]})
    if not graph:
        return ""
    return '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph},
                                                             ensure_ascii=False) + "</script>"

# ----------------------------------------------------------------------------------------------- shared files
CONFIG_JS = """/* Edit this file on the server after deploy - it is deliberately NOT fingerprinted or cached.
 *
 * leadEndpoint  URL that accepts a JSON POST for every enquiry (your CRM / backend / Zapier / Make webhook).
 *               While it is empty, every form hands the enquiry to WhatsApp instead, so no lead is lost.
 * appStoreUrl / playStoreUrl  Real store links for the "Download for iOS / Android" buttons on the home page.
 *               While empty, those buttons are shown as "coming soon" and are not clickable.
 */
window.EMLEN_CONFIG = {
  leadEndpoint: '',
  whatsappNumber: '919814953954',
  appStoreUrl: '',
  playStoreUrl: ''
};
"""

SITE_JS = r"""/* Shared behaviour for every page: lead delivery + small progressive fixes. */
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
"""

SITE_CSS = """/* Shared, low-specificity additions loaded after each page's own stylesheet. */
html{-webkit-text-size-adjust:100%;text-size-adjust:100%;scroll-padding-top:84px}
@media (max-width:760px){html{scroll-padding-top:72px}}
body{-webkit-tap-highlight-color:transparent}
.ap-bt a[aria-disabled="true"]{cursor:default;opacity:.62;position:relative;pointer-events:none}
.ap-bt a[aria-disabled="true"]::after{content:attr(data-soon);display:block;font-size:.68em;font-weight:500;letter-spacing:.04em;opacity:.8}

/* header fit: the original home header wrapped "About Us" / the buttons onto two lines around 1024px, and the
   extra "All offices" link pushed the one-person-office CTA off-screen. Keep labels on one line, drop the least
   important items first (they stay reachable from the footer and mobile menu). */
header.nav .nav-links a,header.nav .nav-cta .btn{white-space:nowrap}
@media (max-width:1180px){header.nav .nav-cta .btn-line{display:none}}
@media (max-width:1240px){.navlinks .nav-extra{display:none}}

/* comfortable touch targets for the cross-page footer links */
@media (pointer:coarse){.sl-row a,.site-footer li a,.footer-links a,.footer-inner nav a{display:inline-flex;align-items:center;min-height:44px}}

/* cross-page link rows (footers) */
.sl-row{display:flex;flex-wrap:wrap;gap:6px 22px;margin:0;padding:0;list-style:none}
.sl-row a{color:inherit;text-decoration:none;opacity:.86;padding:6px 0;display:inline-block}
.sl-row a:hover,.sl-row a:focus-visible{opacity:1;text-decoration:underline;text-underline-offset:3px}
.sl-footer{background:#161616;color:#fff;padding:44px 20px calc(30px + env(safe-area-inset-bottom));font:500 15px/1.5 var(--body,'Poppins',system-ui,sans-serif)}
.sl-footer .sl-in{max-width:1180px;margin:0 auto;display:grid;gap:26px}
.sl-footer .sl-brand{display:block;width:170px;max-width:60%;filter:brightness(0) invert(1)}
.sl-footer p{margin:0;opacity:.72;max-width:46ch}
.sl-footer small{opacity:.55;display:block;font-size:13px}
.sl-footer h4{margin:0 0 6px;font:600 12px/1 var(--body,'Poppins',system-ui,sans-serif);letter-spacing:.12em;text-transform:uppercase;opacity:.55}
@media (min-width:860px){.sl-footer .sl-in{grid-template-columns:1.3fr 1fr 1fr;gap:48px}}
.sl-more{margin:22px 0 0;text-align:center}
.sl-more a{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 22px;border-radius:999px;border:1px solid currentColor;color:inherit;font-weight:600;text-decoration:none}
.sl-more a:hover,.sl-more a:focus-visible{background:rgba(237,32,36,.08)}
"""

NOT_FOUND = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found | Workspace by Emlen</title><meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
:root{--red:#ED2024;--ink:#161616}*{box-sizing:border-box}
body{margin:0;min-height:100vh;min-height:100dvh;display:grid;place-items:center;padding:28px;background:#fff;color:var(--ink);font:500 17px/1.55 Poppins,system-ui,-apple-system,Segoe UI,sans-serif;text-align:center}
main{max-width:520px}h1{font-size:clamp(34px,7vw,56px);line-height:1.05;margin:0 0 14px;letter-spacing:-.02em}
h1 span{color:var(--red)}p{margin:0 0 26px;opacity:.75}
.row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
a.b{display:inline-flex;align-items:center;min-height:48px;padding:0 26px;border-radius:999px;background:var(--red);color:#fff;font-weight:600;text-decoration:none}
a.l{background:transparent;color:var(--ink);border:1.5px solid var(--ink)}
a:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
</style></head><body><main>
<h1>This page has <span>moved out.</span></h1>
<p>We could not find the page you were looking for. Try one of these instead.</p>
<div class="row"><a class="b" href="/">Go to home</a><a class="b l" href="/workspaces/">Browse workspaces</a><a class="b l" href="/managed-office/south-bangalore/">Managed offices</a></div>
</main></body></html>
"""

# ----------------------------------------------------------------------------------------------- icons / og
def _font(size):
    from PIL import ImageFont
    for f in ("/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"):
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()

def make_icons():
    """Placeholder monogram (white 'w' on brand red). Swap favicon.svg / favicon.ico / icons for the real mark."""
    size = 512
    tile = Image.new("RGB", (size, size), BRAND_RED)
    d = ImageDraw.Draw(tile)
    f = _font(400)
    l, t, r, b = d.textbbox((0, 0), "w", font=f)
    d.text(((size - (r - l)) / 2 - l, (size - (b - t)) / 2 - t - 6), "w", font=f, fill="white")
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=112, fill=255)
    rounded = Image.new("RGBA", (size, size), (0, 0, 0, 0)); rounded.paste(tile, (0, 0), mask)
    write("apple-touch-icon.png", _png(tile.resize((180, 180), Image.LANCZOS)))
    write("assets/icons/icon-192.png", _png(tile.resize((192, 192), Image.LANCZOS)))
    write("assets/icons/icon-512.png", _png(tile))
    buf = io.BytesIO(); rounded.resize((48, 48), Image.LANCZOS).save(buf, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    write("favicon.ico", buf.getvalue())
    b64 = base64.b64encode(_png(rounded.resize((128, 128), Image.LANCZOS))).decode()
    write("favicon.svg", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><image href="data:image/png;base64,{b64}" width="128" height="128"/></svg>')

def _png(im):
    b = io.BytesIO(); im.save(b, format="PNG", optimize=True); return b.getvalue()

def make_og():
    im = Image.open(next((OUT / "assets/img").glob("img-2444ee6e.jpg"))).convert("RGB")  # bright private-office photo
    W, H = 1200, 630
    r = max(W / im.width, H / im.height)
    im = im.resize((int(im.width * r) + 1, int(im.height * r) + 1), Image.LANCZOS)
    l, t = (im.width - W) // 2, (im.height - H) // 2
    im = im.crop((l, t, l + W, t + H))
    # brand strip with the real wordmark
    logo = next(p for p in (OUT / "assets/img").glob("workspace-by-emlen-*.png") if Image.open(p).size == (640, 85))
    lg = Image.open(logo).convert("RGBA")
    strip = Image.new("RGBA", (W, 150), (255, 255, 255, 235))
    lg = lg.resize((int(lg.width * 0.78), int(lg.height * 0.78)), Image.LANCZOS)
    strip.alpha_composite(lg, (56, (150 - lg.height) // 2))
    base = im.convert("RGBA"); base.alpha_composite(strip, (0, H - 150))
    b = io.BytesIO(); base.convert("RGB").save(b, format="JPEG", quality=84, optimize=True, progressive=True)
    write("assets/img/og-image.jpg", b.getvalue())

# ----------------------------------------------------------------------------------------------- per-page patches
LINKS_HTML = ('<li><a href="/">Home</a></li><li><a href="/workspaces/">Workspaces</a></li>'
              '<li><a href="/managed-office/south-bangalore/">Managed offices</a></li>'
              '<li><a href="/managed-office/one-person-office/">One Person Office</a></li>')

def patch_home(b):
    b = rep(b, '<a class="brand" href="#"><img', '<a class="brand" href="/" aria-label="Workspace by Emlen home"><img', label="home brand")
    b = rep(b, '<a href="#why">Solutions</a><a href="#locations">Locations</a><a href="#">Resources</a><a href="#">About Us</a>',
            '<a href="/workspaces/">Solutions</a><a href="#locations">Locations</a><a href="/workspaces/#faqs">Resources</a><a href="#why">About Us</a>',
            label="home nav")
    # lead handling
    b = rep(b, "var send=CONFIG.leadEndpoint?fetch(CONFIG.leadEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){if(!r.ok)throw new Error('bad')}):new Promise(function(r){setTimeout(r,600)});",
            "var send=EmlenLead.submit(payload,{intro:'Hello Workspace by Emlen, I would like help finding a workspace.'});", label="home send")
    b = rep(b, " send.then(function(){$('dname').textContent=",
            " send.then(function(res){if(res&&res.mode==='whatsapp'){var dm=document.querySelector('#mdone .mp');if(dm)dm.textContent='WhatsApp has opened with your details. Please press Send there so our team receives them.'}$('dname').textContent=",
            label="home then")
    b = rep(b, "if(CFG.leadEndpoint){fetch(CFG.leadEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(function(r){if(!r.ok)throw 0;done()}).catch(function(){alert('Something went wrong. Please try again.')})}else done()",
            "var sb=f.querySelector('button[type=submit]'),lbl=sb.textContent;sb.disabled=true;sb.textContent='Sending\\u2026';"
            "EmlenLead.submit(d,{intro:'Hello Workspace by Emlen, I would like a callback about a workspace.'}).then(function(res){sb.disabled=false;sb.textContent=lbl;"
            "if(res&&res.mode==='whatsapp'){var op=box.querySelector('.ok p');if(op)op.textContent='WhatsApp has opened with your details. Please press Send there so our team receives them.'}done()})"
            ".catch(function(){sb.disabled=false;sb.textContent='Could not send. Try again';setTimeout(function(){sb.textContent=lbl},3500)})",
            label="home eqForm")
    footer = (
        '<footer class="sl-footer"><div class="sl-in">'
        '<div><img class="sl-brand" src="LOGO" alt="Workspace by Emlen" width="640" height="85">'
        '<p style="margin-top:14px">Managed private offices and flexible workspaces across South Bengaluru.</p></div>'
        f'<nav aria-label="Site"><h4>Explore</h4><ul class="sl-row">{LINKS_HTML}</ul></nav>'
        f'<div><h4>Contact</h4><ul class="sl-row"><li><a href="tel:{PHONE_TEL}">{PHONE_PRETTY}</a></li><li><a href="#enquire">Enquire now</a></li></ul>'
        '<small style="margin-top:16px">&copy; Workspace by Emlen. All rights reserved.</small></div>'
        '</div></footer>\n')
    return b + footer

def patch_workspaces(b):
    b = rep(b, '<a class="we-brand" href="#top" aria-label="Workspace by Emlen home">', '<a class="we-brand" href="/" aria-label="Workspace by Emlen home">', label="ws brand")
    b = rep(b, '<a href="#locations">Locations</a><a href="#faqs">Resources</a><a href="#enquiry">About Us</a>',
            '<a href="/managed-office/south-bangalore/">Managed offices</a><a href="#locations">Locations</a><a href="#faqs">Resources</a><a href="/#why">About Us</a>', label="ws nav")
    # scroll-spy used every nav href as a CSS selector; cross-page links ("/#why", "/managed-office/...") threw and
    # aborted the rest of the script (liquid nav highlight, pills, ...). Only observe in-page "#" links.
    b = rep(b, "const links=[...nav.querySelectorAll('.we-nav__links a')];\n    const io=",
            "const links=[...nav.querySelectorAll('.we-nav__links a')].filter(a=>(a.getAttribute('href')||'').charAt(0)==='#');\n    const io=", label="ws spy")
    b = rep(b, "status.hidden=false;status.textContent='Preview only: the form looks ready, but no enquiry has been sent. Connect a CRM or email service before publishing.';status.scrollIntoView({block:'nearest',behavior:'smooth'});",
            "const msg=['Hello Workspace by Emlen, I would like a callback about workspace options.','Name: '+name.value.trim(),'Phone: '+phone.value.trim(),'Team size: '+($('#team').value||'Not specified'),'Workspace type: '+($('#type').value||'Not specified'),'Requirements: '+($('#message').value.trim()||'None')].join('\\n');"
            "EmlenLead.deliver(msg,{source:'workspaces',name:name.value.trim(),phone:phone.value.trim(),teamSize:$('#team').value,workspaceType:$('#type').value,requirements:$('#message').value.trim()},status).then(()=>{status.scrollIntoView({block:'nearest',behavior:'smooth'})}).catch(()=>{status.scrollIntoView({block:'nearest',behavior:'smooth'})});",
            label="ws form")
    b = rep(b, "<footer>\n<div class=\"container footer-inner\"><span>© Workspace by Emlen. Flexible workspace solutions.</span><a href=\"#top\">Back to top</a></div>\n</footer>",
            f"<footer>\n<div class=\"container footer-inner\"><span>© Workspace by Emlen. Flexible workspace solutions.</span>"
            f"<nav aria-label=\"Site\"><ul class=\"sl-row\">{LINKS_HTML}</ul></nav><a href=\"#top\">Back to top</a></div>\n</footer>", label="ws footer")
    return b

def patch_category(b):
    # The existing One-Person Office card used to open the enquiry form, despite a full
    # destination page being available. Preserve the card's visuals and fix its route.
    b = rep(b,
            '<a aria-label="Enquire about One-Person Office" class="office-tile tile-1" data-anchor="one-person-office" data-office="One-Person Office" href="#enquiry" id="one-person-office">',
            '<a aria-label="Explore One-Person Office" class="office-tile tile-1" data-anchor="one-person-office" href="/managed-office/one-person-office/" id="one-person-office">',
            label="cat one-person card link")
    b = rep(b, '<a class="brand" href="#top" aria-label="Workspace by Emlen">', '<a class="brand" href="/" aria-label="Workspace by Emlen home">', label="cat brand")
    # browsers compile pattern="" with the `v` flag, where ( ) and a bare - inside [...] are syntax errors -> validation silently dropped
    b = rep(b, r'pattern="[0-9+()\s-]{8,20}"', r'pattern="[0-9+\s\-\(\)]{8,20}"', count=2, label="cat pattern")
    b = rep(b, "const sendWhatsApp=(msg,status)=>{const url='https://wa.me/919814953954?text='+encodeURIComponent(msg);const opened=window.open(url,'_blank','noopener,noreferrer');if(!opened){status.textContent='WhatsApp popup was blocked. Please allow popups and submit again.';}else{status.textContent='WhatsApp opened with your details. Please press Send there to complete your request.';} };",
            "const sendWhatsApp=(msg,status,payload)=>EmlenLead.deliver(msg,payload||{},status).catch(()=>{});", label="cat sendWA")
    b = rep(b, "sendWhatsApp(msg,$('#enquiry-status'));",
            "sendWhatsApp(msg,$('#enquiry-status'),{source:'category-south-bangalore',name:f.elements.namedItem('fullName').value,phone:f.elements.namedItem('phone').value,email:f.elements.namedItem('email').value,teamSize:f.elements.namedItem('team').value,interest:f.elements.namedItem('interest').value,detail:f.elements.namedItem('detail').value});", label="cat enquiry")
    b = rep(b, "sendWhatsApp(msg,status);",
            "sendWhatsApp(msg,status,{source:'category-checklist',name:f.elements.name.value,phone:f.elements.phone.value,teamSize:f.elements.team.value});", label="cat checklist")
    # placeholder / "preview" copy that must not ship
    b = rep(b, "Description pending final approved copy.", "Tell us what your team needs and we will help you shape the office around it.", label="cat pending copy")
    b = rep(b, "Submitting opens WhatsApp with your enquiry ready to send; no data is stored on this preview page.", "We use your details only to get back to you about this enquiry.", label="cat form note")
    b = rep(b, "The PDF downloads to your device. This preview does not store your details; WhatsApp opens only if you opt in.", "The PDF downloads to your device. We only contact you if you opt in above.", label="cat checklist note")
    b = rep(b, "status.textContent='Your office checklist is downloading. This static page does not store contact details.';",
            "status.textContent='Your office checklist is downloading.';", label="cat dl text")
    b = rep(b, '<li><a href="#faq">FAQs</a></li></ul></div><div><h4>Contact</h4>',
            '<li><a href="#faq">FAQs</a></li></ul></div><div><h4>More from Emlen</h4><ul><li><a href="/">Home</a></li><li><a href="/workspaces/">Workspaces</a></li>'
            '<li><a href="/managed-office/one-person-office/">One Person Office</a></li></ul></div><div><h4>Contact</h4>', label="cat footer")
    return b

def patch_one_person(b):
    b = rep(b, '<a aria-label="Workspace by Emlen home" class="brand" href="#home">', '<a aria-label="Workspace by Emlen home" class="brand" href="/">', label="sol brand")
    nav_old = '<a href="#locations">Locations</a><a href="#options">Workspaces</a><a href="#benefits">Benefits</a><a href="#why-us">Why us</a><a href="#faqs">FAQs</a>'
    nav_new = '<a class="nav-extra" href="/managed-office/south-bangalore/">All offices</a>' + nav_old
    b = rep(b, nav_old, nav_new, count=2, label="sol nav")
    b = rep(b, 'where=locationField.value;error.textContent=\'\';if(!name){', 'where=locationField.value;error.style.color=\'\';error.textContent=\'\';if(!name){', label="sol err reset")
    b = rep(b, r"const url='https://wa.me/919814953954?text='+encodeURIComponent(fields.join('\n'));window.open(url,'_blank','noopener,noreferrer');});",
            r"EmlenLead.deliver(fields.join('\n'),{source:'one-person-office',name:name,phone:phone,email:email,location:where,office:office.value,timeline:document.getElementById('timeline').value,requirements:other.value.trim()},null)"
            r".then(function(r){if(r.mode==='api'){error.style.color='#0a7a3b';error.textContent='Thanks, we have your request. Our team will call you shortly.'}})"
            r".catch(function(){error.style.color='';error.textContent='We could not send your request. Please try again or call +91 98149 53954.'});});", label="sol deliver")
    b = rep(b, '<div class="footer-links"><a href="#options">Office options</a>',
            '<div class="footer-links"><a href="/">Home</a><a href="/workspaces/">Workspaces</a><a href="/managed-office/south-bangalore/">All managed offices</a><a href="#options">Office options</a>', label="sol footer")
    return b

PATCHES = dict(home=patch_home, workspaces=patch_workspaces, category=patch_category)
PATCHES["one-person"] = patch_one_person

# ----------------------------------------------------------------------------------------------- main
def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    write("assets/js/config.js", CONFIG_JS)
    write("assets/js/site.js", SITE_JS)
    write("assets/css/site.css", SITE_CSS)
    # Keep the cross-page navigation editable independently of the large hand-off pages.
    # Fingerprint navigation assets: nginx caches /assets/ as immutable for a year.
    asset("js", "site-navigation", NAV_SCRIPT)
    asset("css", "site-navigation", NAV_STYLE)
    write("404.html", NOT_FOUND)

    for page in PAGES:
        raw = (SRC / page["src"]).read_text(encoding="utf-8")
        raw = extract_data_uris(raw)
        head, body_tag, body = split_head_body(raw)
        metas = collect_meta(head)
        title = re.search(r"<title>(.*?)</title>", head, re.S).group(1).strip()
        title = html.unescape(title).replace(" — Animated Blueprint Hero", "")
        css, font_url = build_css(head, page["key"])
        if not font_url:
            m = FONT_RE.search(head)
            font_url = html.unescape(m.group(0)) if m else None
        css_path = asset("css", page["key"], css)
        body = PATCHES[page["key"]](body)
        body = extract_scripts(body, page["key"])
        if page["key"] == "home":
            logo = re.search(r'<img src="(/assets/img/workspace-by-emlen-[^"]+)"', body).group(1)
            body = body.replace('src="LOGO"', f'src="{logo}"')
        # head-only inline script (reduced-motion class) is part of the head in the workspaces page
        head_scripts = "".join(f'<script src="{asset("js", page["key"] + "-head", m.group(2).strip() + ";")}"></script>'
                               for m in SCRIPT_RE.finditer(head))
        new_head = make_head(page, metas, css_path, font_url, title) + head_scripts + json_ld(page)
        lang = "en"
        out = f'<!doctype html>\n<html lang="{lang}">\n<head>\n{new_head}\n</head>\n{body_tag}\n{body}</body>\n</html>\n'
        write(page["out"], out)
        print(f"  {page['out']:<52} {len(out)/1024:7.1f} KB  (css {len(css)/1024:.0f} KB)")

    htaccess = ROOT / "deploy" / ".htaccess"
    if htaccess.exists():
        write(".htaccess", htaccess.read_bytes())
    make_icons(); make_og()
    write("site.webmanifest", json.dumps({
        "name": "Workspace by Emlen", "short_name": "Emlen", "start_url": "/", "display": "browser",
        "background_color": "#ffffff", "theme_color": BRAND_RED,
        "icons": [{"src": "/assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
                  {"src": "/assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png"}]}, indent=2))
    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n")
    urls = "".join(f"  <url><loc>{SITE_URL}{p['url']}</loc><lastmod>{TODAY}</lastmod></url>\n" for p in PAGES)
    write("sitemap.xml", f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    print(f"  {len(IMG_NAMES)} unique media files extracted")

if __name__ == "__main__":
    main()
