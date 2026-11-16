"""Approved One Person Office components; leave all unrelated source markup intact."""
import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "source"

def replace_once(text, old, new, label):
    if text.count(old) != 1:
        raise SystemExit(f"one-person approved sections: {label} changed")
    return text.replace(old, new, 1)

def apply_approved_sections(body):
    cards = (SRC / "one-person-approved-cards.html").read_text(encoding="utf-8").strip()
    card_pattern = r'<div class="values-grid">\s*(?:<article class="value-card">[\s\S]*?</article>\s*){4}</div>'
    body, n = re.subn(card_pattern, lambda _: cards, body, count=1)
    if n != 1:
        raise SystemExit("one-person approved sections: original values card marker changed")

    # Only the Benefits row numbers and decorative accents are removed. Retain original media.
    beg = body.index('<section aria-labelledby="benefits-title"')
    end = body.index('</section>', beg) + len('</section>')
    benefit = body[beg:end]
    benefit, n = re.subn(r'<div class="bn-row-num" aria-hidden="true"><span>\d+</span></div>', "", benefit)
    if n != 4:
        raise SystemExit("one-person approved sections: expected four original numerals")
    benefit = re.sub(r' data-accent="(?:red|yellow)"', "", benefit)
    body = body[:beg] + benefit + body[end:]

    # Retain the original form controls, IDs, options, validation, and lead delivery.
    start = body.index('<div class="form-shell" id="enquiry">')
    stop = body.index('</form>', start) + len('</form>')
    form = body[start:stop]
    form, n = re.subn(r'(<(?:input|textarea)\b[^>]*?)placeholder="[^"]*"', r'\1placeholder=" "', form)
    if n != 4:
        raise SystemExit("one-person approved sections: expected four input placeholders")
    form = replace_once(form, '<option value="">Select location</option>', '<option value=""></option>', "location placeholder")
    form = replace_once(form, '<option value="">Select timeline</option>', '<option value=""></option>', "timeline placeholder")
    form = replace_once(form, "Office option / I'm interested in", "Office option", "office label")
    # Preserve the live form itself; the glass surround is purely presentational.
    tail = '</div>'
    if not body[stop:].startswith(tail):
        raise SystemExit("one-person approved sections: form closing marker changed")
    body = body[:start] + '<div class="glass-area">' + form + tail + '</div>' + body[stop+len(tail):]

    # Replace only the original benefits reveal IIFE with the approved animation.
    old_motion = r'/\* Section 6: benefits\.[^\n]*\*/\s*\(\(\)=>\{[\s\S]*?\n\}\)\(\);'
    body, n = re.subn(old_motion, lambda _: "/* Approved benefits reveal */\n" + (SRC / "one-person-approved-benefits.js").read_text(encoding="utf-8"), body, count=1)
    if n != 1:
        raise SystemExit("one-person approved sections: benefits animation marker changed")
    # Existing values animation has no legacy cards to animate; keep its other effects intact.
    body += '\n<script>\n' + (SRC / "one-person-approved-cards.js").read_text(encoding="utf-8") + '\n</script>\n'
    return body
