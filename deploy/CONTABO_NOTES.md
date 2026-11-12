# Contabo isolated public website handoff

- Production public domain: `https://workspacebyemlen.co.uk`.
- CMS admin domain: `https://admin.workspacebyemlen.co.uk`.
- Four public HTML pages under `public/`. These are static and are **not** automatically published by the CMS.
- Built via `EMLEN_SITE_URL=https://workspacebyemlen.co.uk python3 tools/build.py`.
- The output pages, sitemap and robots are rebuilt with `.co.uk` canonical links. `deploy/nginx.conf` has `.co.uk` server names.
- Lead endpoint in `public/assets/js/config.js` is currently blank, so enquiry forms offer WhatsApp fallback rather than a CRM submission. Validate the business phone number and form journey before cutover.
- The optional `deploy/compose.contabo.yaml` creates a standalone Nginx container on existing `emlen_ingress` with alias `we-public-web` and **no public ports**. It does not modify the CMS or Caddy.
- Launch staging only after extracting the archive to `/opt/apps/Workspace-Public-Site`:
  `sudo docker compose -f deploy/compose.contabo.yaml up -d --build`.
- Verify staging internally before any public Caddy route changes:
  `sudo docker exec emlen-central-ingress-caddy-1 wget -S -O /dev/null -T 10 http://we-public-web:80/`.
- Do not change Caddy routing for `workspacebyemlen.co.uk` until admin CMS login, templates and editing work at the new admin domain.
- The existing CMS API production `PUBLIC_SITE_URL` and `CORS_ORIGIN` were handled separately on the VPS.
