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
if (root / "sitemap.xml").exists():
    problems.append("noindex site must not publish sitemap.xml")

nginx = Path("deploy/nginx.conf").read_text(encoding="utf-8")
header = 'add_header X-Robots-Tag "noindex, nofollow, noarchive, nosnippet, noimageindex" always;'
if nginx.count(header) != 4:
    problems.append("nginx must set the X-Robots-Tag in server, root, assets and config locations")

if problems:
    print("\n".join("FAIL: " + message for message in problems))
    raise SystemExit(1)
print("OK: all pages and server routes are set to noindex/nofollow, and no sitemap is published")
