"""Shared card family presentation. Preserve content, links and all existing handlers."""
import re
from pathlib import Path
SRC = Path(__file__).resolve().parents[1] / "source"
HOME_ART = ["<svg aria-hidden=\"true\" viewBox=\"0 0 320 200\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><g class=\"outline\" stroke-width=\"2.15\"><rect class=\"paper\" x=\"104\" y=\"46\" width=\"92\" height=\"57\" rx=\"5\"/><path d=\"M150 103v15m-17 0h34M82 118h156M97 118v38m126-38v38\"/><path class=\"fine\" d=\"M119 60h61m-61 10h38\"/><path class=\"paper\" d=\"M173 156v-18a18 18 0 0 1 36-0v18\"/></g><circle class=\"accent-fill\" cx=\"206\" cy=\"55\" r=\"13\"/><path class=\"check\" stroke-width=\"2.45\" d=\"m200 55 4 4 8-9\"/></svg>","<svg aria-hidden=\"true\" viewBox=\"0 0 320 200\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><g class=\"outline\" stroke-width=\"2.15\"><rect class=\"paper\" x=\"103\" y=\"38\" width=\"114\" height=\"126\" rx=\"8\"/><rect class=\"paper\" x=\"140\" y=\"30\" width=\"40\" height=\"16\" rx=\"5\"/><path class=\"fine\" d=\"M143 70h53m-53 29h53m-53 29h41\"/><path d=\"M118 67v12h12m-12 17v12h12m-12 17v12h12\"/></g><g class=\"accent-stroke\" stroke-width=\"2.4\"><path d=\"m119 70 4 4 9-10m-13 35 4 4 9-10m-13 35 4 4 9-10\"/></g></svg>","<svg aria-hidden=\"true\" viewBox=\"0 0 320 200\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><g class=\"outline\" stroke-width=\"2.15\"><circle class=\"paper\" cx=\"160\" cy=\"100\" r=\"58\"/><circle class=\"fine\" cx=\"160\" cy=\"100\" r=\"38\"/><circle cx=\"160\" cy=\"100\" r=\"15\"/><path class=\"fine\" d=\"M160 29v17m0 108v17M89 100h17m108 0h17\"/></g><path class=\"accent-stroke\" stroke-width=\"2.7\" d=\"M160 100l44-44m-4-14 4 14 14 4\"/><circle class=\"accent-fill\" cx=\"160\" cy=\"100\" r=\"5\"/></svg>","<svg aria-hidden=\"true\" viewBox=\"0 0 320 200\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><g class=\"outline\" stroke-width=\"2.15\"><rect class=\"paper\" x=\"93\" y=\"77\" width=\"68\" height=\"75\" rx=\"5\"/><path class=\"fine\" d=\"M93 114h68m-34 0v38\"/><rect class=\"paper\" x=\"174\" y=\"43\" width=\"56\" height=\"109\" rx=\"5\"/><path class=\"fine\" d=\"M174 79h56m-56 36h56m-28-36v36\"/></g><path class=\"accent-stroke\" stroke-width=\"2.45\" d=\"M111 64q21-35 58-27m-10-10 10 10-14 6\"/><rect class=\"accent-fill\" x=\"183\" y=\"91\" width=\"13\" height=\"13\" rx=\"2\"/></svg>"]
def apply_shared_cards(body, key):
    if key != "home":
        return compact_highlights(body, key)
    # Preserve the existing Home reveal class/delay, titles and descriptions.
    body,n = re.subn(r'<div class="feat-g">', '<div class="feat-g we-hl" id="homeHighlights">', body, count=1)
    if n!=1:
        raise SystemExit("Home highlight grid marker changed")
    i=0
    def new_card(m):
        nonlocal i
        if i>=len(HOME_ART):
            raise SystemExit("Too many Home highlight cards")
        delay,heading,plus,description=m.groups()
        result=(f'<article class="cd rv we-hl__card" style="{delay};--i:{i}"><div class="we-hl__art" aria-hidden="true">'+HOME_ART[i]+
                '<span class="we-hl__plus">'+plus+'</span></div><div class="we-hl__txt"><h3>'+
                re.sub(r'<br\s*/?>',' ',heading)+f'</h3><p>{description}</p></div></article>')
        i+=1
        return result
    pattern=r'<article class="cd rv" style="([^"]+)"><div class="cd-h"><h3>(.*?)</h3>(<svg\b[^>]*class="pl"[^>]*>.*?</svg>)</div><p>(.*?)</p></article>'
    body,n=re.subn(pattern,new_card,body,flags=re.S)
    if n!=4:
        raise SystemExit("Expected four Home highlight cards, found "+str(n))
    return compact_highlights(body, key)+'\n<script>\n'+(SRC/"home-highlight-cards.js").read_text(encoding="utf-8")+'\n</script>\n'

def compact_highlights(body, key):
    """Move headings into the existing dotted frame; keep all original descriptions."""
    if key == "category":
        return body  # Already the reference markup.
    grid = "homeHighlights" if key == "home" else "weHl"
    body,n = re.subn(r'(<div\b[^>]*\bid="'+grid+r'"[^>]*)(>)',
                     r'\1 data-card-variant="text-heading"\2',body,count=1)
    if n != 1:
        raise SystemExit("Missing highlight grid: "+key)
    pattern = (r'(<article\b[^>]*class="[^"]*\bwe-hl__card\b[^"]*"[^>]*>)\s*'
               r'<div\b[^>]*class="[^"]*\bwe-hl__art\b[^"]*"[^>]*>[\s\S]*?</div>\s*'
               r'<div class="we-hl__txt">\s*<h3>([\s\S]*?)</h3>([\s\S]*?)</div>\s*</article>')
    body,n = re.subn(pattern,lambda m:m[1]+'<div class="we-hl__art"><h3>'+m[2]+
                     '</h3></div><div class="we-hl__txt">'+m[3]+'</div></article>',body)
    if n != 4:
        raise SystemExit("Expected four compact highlight cards: "+key+" ("+str(n)+")")
    return body
