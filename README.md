# Workspace by Emlen: website

Four static pages, no server code, ready to upload. **Upload the contents of `public/` to your web root.**

| URL | Page | Source file |
|---|---|---|
| `/` | Home | `source/WE_Home_v28_Audited.html` |
| `/workspaces/` | Flexible workspace solutions | `source/WE_property_v6.html` |
| `/managed-office/south-bangalore/` | Managed offices category | `source/WE_Category.html` |
| `/managed-office/one-person-office/` | One Person Office | `source/WE_Solution.html` |

## Deploy
* **Apache / cPanel / shared hosting:** upload `public/` (it already contains `.htaccess`).
* **nginx / VPS:** copy `public/` to `/var/www/emlen`, use `deploy/nginx.conf`, then `certbot --nginx`.
* **Docker:** `docker build -f deploy/Dockerfile -t emlen-site .`
* **Netlify / Cloudflare Pages:** copy `deploy/netlify-cloudflare/_headers` and `_redirects` into `public/`, publish `public/`.
* **Vercel:** use `deploy/vercel.json`.

The site must be served from the **domain root** (asset paths start with `/assets/`).

## Before you go live
1. **Leads:** open `assets/js/config.js` on the server and set `leadEndpoint` to the URL of your CRM / backend / webhook.
   Every form then POSTs JSON `{name, phone, ..., source, page, message, submittedAt}` to it.
   While it is empty, every form opens WhatsApp (+91 98149 53954) with the enquiry pre-filled, so nothing is lost or faked.
2. **App buttons** (home page): set `appStoreUrl` / `playStoreUrl` in the same file. Empty = shown as "Coming soon".
3. **Domain:** canonical URLs, sitemap and social tags assume `https://workspacebyemlen.co.in`.
   Different domain? `EMLEN_SITE_URL=https://example.com python3 tools/build.py`.
4. **Icons:** `favicon.*` and `apple-touch-icon.png` are a placeholder "w" monogram. Replace with the real mark.
5. Submit `/sitemap.xml` in Google Search Console.

## Change something and rebuild
Edit `source/*.html` (or `tools/build.py` for cross-page wiring), then `python3 tools/build.py` (needs Python + Pillow).
The build rewrites `public/` completely; never hand-edit `public/`.

## Tests
`npm i` then `npm run serve` (terminal 1), `npm run audit` and `npm run flows` (terminal 2), `python3 tools/check_links.py public`.
`tools/serve.js` mimics production (clean URLs, 404 page, the same CSP/headers as the server configs).
