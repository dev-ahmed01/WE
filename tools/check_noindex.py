#!/usr/bin/env python3
"""Prevent accidentally making the .co.uk public preview indexable again.

Run against freshly built output, not hand-edited files:
    python3 tools/check_noindex.py <generated-site-directory>
"""
from pathlib import Path
import re
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else "public")
pages = [
    "index.html",
    "workspaces/index.html",
    "managed-office/south-bangalore/index.html",
    "managed-office/one-person-office/index.html",
    "404.html",
]
required = {"noindex", "nofollow", "noarchive", "nosnippet", "noimageindex"}
problems = []

for rel in pages:
    path = root / rel
    if not path.is_file():
        problems.append(f"Missing page: {path}")
        continue
    html = path.read_text(encoding="utf-8")
    matches = re.findall(
        r'<meta\s+name=["\']robots["\']\s+content=["\']([^"\']+)["\']\s*/?>',
        html, re.IGNORECASE
    )
    if len(matches) != 1:
        problems.append(f"{rel}: expected one robots meta tag, found {len(matches)}")
        continue
    directives = {x.strip().lower() for x in matches[0].split(",")}
    if not required <= directives or "index" in directives or "follow" in directives:
        problems.append(f"{rel}: indexing is not blocked: {matches[0]}")

robots = (root / "robots.txt")
if not robots.is_file():
    problems.append("robots.txt is missing")
else:
    txt = robots.read_text(encoding="utf-8")
    # Disallowing crawlers would prevent discovery of page-level noindex and
    # could leave URLs in Google's index as an uncrawled URL reference.
    if not re.search(r"(?im)^Allow:\s*/\s*$", txt):
        problems.append("robots.txt must allow search engines to see noindex")
    if re.search(r"(?im)^(Sitemap|Disallow):", txt):
        problems.append("robots.txt must not block deindexing or advertise a sitemap")
# The installed VPS release script requires sitemap.xml to exist. Keep
# an intentionally empty compatibility sitemap, with zero advertised URLs.
sitemap_path = root / "sitemap.xml"
if not sitemap_path.is_file():
    problems.append("empty compatibility sitemap.xml is missing")
else:
    sitemap = sitemap_path.read_text(encoding="utf-8")
    if re.search(r"<(?:url|loc)(?:\s|>)", sitemap):
        problems.append("noindex sitemap must contain zero URL/LOC entries")
    if "workspacebyemlen.co.uk" not in sitemap:
        problems.append("Contabo compatibility sitemap must reference the site in a comment")

nginx = (Path(__file__).resolve().parent.parent / "deploy/nginx.conf").read_text(encoding="utf-8")
header = 'add_header X-Robots-Tag "noindex, nofollow, noarchive, nosnippet, noimageindex" always;'
if nginx.count(header) != 4:
    problems.append("nginx must set the X-Robots-Tag in server, root, assets and config locations")

if problems:
    print("\n".join("FAIL: " + message for message in problems))
    raise SystemExit(1)
print("OK: sitewide noindex/nofollow, no sitemap URLs, and no advertised sitemap")
