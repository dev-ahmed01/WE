#!/usr/bin/env python3
"""Static check of the built site: every local href/src resolves, every #anchor exists, no duplicate ids."""
import re, sys
from pathlib import Path
from collections import Counter
from urllib.parse import urlparse, unquote
root = Path(sys.argv[1] if len(sys.argv) > 1 else "public")
pages = sorted(root.rglob("*.html"))
ids = {}
for p in pages:
    t = p.read_text(encoding="utf-8")
    ids[p] = set(re.findall(r'\sid="([^"]+)"', t))
bad = 0
def target(page, url):
    u = urlparse(url)
    path = unquote(u.path) or "/" + str(page.relative_to(root)).replace("index.html", "")
    if not path.startswith("/"):
        path = "/" + str(page.parent.relative_to(root)) + "/" + path
    f = root / path.lstrip("/")
    if f.is_dir(): f = f / "index.html"
    return f, u.fragment
for p in pages:
    t = p.read_text(encoding="utf-8")
    dup = [k for k, v in Counter(re.findall(r'\sid="([^"]+)"', t)).items() if v > 1]
    if dup: print(f"{p}: duplicate ids {dup}"); bad += 1
    for m in re.finditer(r'(?:href|src)="([^"]+)"', t):
        url = m.group(1)
        if re.match(r"(https?:|tel:|mailto:|data:|javascript:|//)", url) or "${" in url: continue
        if url.startswith("#"):
            if url != "#" and url[1:] not in ids[p]: print(f"{p}: missing anchor {url}"); bad += 1
            continue
        f, frag = target(p, url)
        if not f.exists(): print(f"{p}: broken link {url}"); bad += 1
        elif frag and f.suffix == ".html" and frag not in ids.get(f, set()): print(f"{p}: {url} -> missing #{frag}"); bad += 1
for css in root.rglob("*.css"):
    for u in re.findall(r"url\(\s*['\"]?(/[^)'\"]+)", css.read_text(encoding="utf-8")):
        if not (root / u.lstrip("/")).exists(): print(f"{css}: missing {u}"); bad += 1
for js in root.rglob("*.js"):
    for u in re.findall(r"['\"`](/assets/[^'\"`?#]+\.(?:jpg|png|webp|svg|pdf|css|js))", js.read_text(encoding="utf-8")):
        if not (root / u.lstrip("/")).exists(): print(f"{js}: missing {u}"); bad += 1
print("OK - no problems" if not bad else f"{bad} problem(s)")
sys.exit(1 if bad else 0)
