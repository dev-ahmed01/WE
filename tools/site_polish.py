"""Propagate approved Managed Offices refinements without replacing page-specific functionality."""
import re
from pathlib import Path
from managed_review import ARROW, DIALOG, SCRIPT

SRC = Path(__file__).resolve().parents[1] / "source"

def once(body, old, new, label):
    if body.count(old) != 1:
        raise SystemExit("Cross-page polish: " + label + " marker changed")
    return body.replace(old, new, 1)

def insert_after_field(form, field_id, extra):
    pattern = r'(<div class="[^"]*\bwe-field\b[^"]*">\s*<label\b[^>]*\bfor="' + re.escape(field_id) + r'"[^>]*>[\s\S]*?</label>\s*<input\b[^>]*>(?:\s*<div class="er">[\s\S]*?</div>)?\s*</div>)'
    form, n = re.subn(pattern, lambda m: m[0] + extra, form, count=1)
    if n != 1:
        raise SystemExit("Cross-page polish: field not found: " + field_id)
    return form

def optional_field(field_id, text, kind, autocomplete, name):
    return ('<div class="field we-field"><label for="'+field_id+'">'+text+
            '</label><input id="'+field_id+'" name="'+name+'" type="'+kind+
            '" autocomplete="'+autocomplete+'" placeholder=" "></div>')

def patch_form(body, key):
    ids = {"home":("eqForm","eqN","eqP","eqLast","eqEmail"),
           "workspaces":("enquiryForm","name","phone","wsLast","wsEmail"),
           "one-person":("officeEnquiry","fullName","phone","opLast","email")}
    fid, first, phone, last, email = ids[key]
    regex = r'<form\b[^>]*\bid="'+fid+r'"[^>]*>[\s\S]*?</form>'
    match = re.search(regex,body)
    if not match: raise SystemExit("Cross-page polish: missing "+fid)
    form = match[0]
    form, n = re.subn(r'(<label\b[^>]*\bfor="'+first+r'"[^>]*>)[\s\S]*?(</label>)',r'\1First name\2',form,count=1)
    if n != 1: raise SystemExit("Cross-page polish: first name label")
    form, n = re.subn(r'(<input\b(?=[^>]*\bid="'+first+r'")[^>]*\bautocomplete=")name(")',r'\1given-name\2',form,count=1)
    if n != 1: raise SystemExit("Cross-page polish: autocomplete")
    form = insert_after_field(form, first, optional_field(last,"Last name (optional)","text","family-name","lastName"))
    if key != "one-person":
        form = insert_after_field(form, phone, optional_field(email,"Work email (optional)","email","email","email"))
    body = body[:match.start()]+form+body[match.end():]
    if key == "home":
        body = once(body,"var d={name:n.value.trim(),phone:p.value.trim(),",
                    "var email=document.getElementById('eqEmail');if(!email.checkValidity()){email.reportValidity();return;}var d={name:[n.value.trim(),document.getElementById('eqLast').value.trim()].filter(Boolean).join(' '),email:email.value.trim(),phone:p.value.trim(),","home lead fields")
    elif key == "workspaces":
        body = once(body,"const msg=['Hello Workspace by Emlen, I would like a callback about workspace options.','Name: '+name.value.trim(),'Phone: '+phone.value.trim(),",
                    "const email=$('#wsEmail');if(!email.checkValidity()){email.reportValidity();return;}const fullName=[name.value.trim(),$('#wsLast').value.trim()].filter(Boolean).join(' ');const msg=['Hello Workspace by Emlen, I would like a callback about workspace options.','Name: '+fullName,'Phone: '+phone.value.trim(),'Work email: '+(email.value.trim()||'Not provided'),","workspace message")
        body = once(body,"source:'workspaces',name:name.value.trim(),phone:phone.value.trim(),",
                    "source:'workspaces',name:fullName,email:email.value.trim(),phone:phone.value.trim(),","workspace payload")
    else:
        body = once(body,"name=document.getElementById('fullName').value.trim(),phone=",
                    "firstName=document.getElementById('fullName').value.trim(),name=[firstName,document.getElementById('opLast').value.trim()].filter(Boolean).join(' '),phone=","one-person full name")
        body = once(body,"error.textContent='';if(!name){","error.textContent='';if(!firstName){","one-person first name validation")
    return body

def apply_site_polish(body, key):
    if key != "category":
        body = patch_form(body,key)
        # Remove only decorative stars adjacent to numeric Google ratings.
        body = re.sub(r'(4\.9)\s*<span class="star">\s*★\s*</span>',r'\1',body)
        if key == "home":
            body = re.sub(r'(4\.9)<em>★</em>',r'\1',body)
            body = re.sub(r'(<div class="eq-c eq-s"><b>4\.9)<svg\b[\s\S]*?</svg>',r'\1',body,count=1)
        if key == "one-person":
            # Keep the reflection layers separate from the moving shine.
            for cls in ("sol-glass", "location-label"):
                body, count = re.subn(r'(<(?:div|span) class="'+cls+r'">)(?=\s*<h3\b[^>]*>[^<\s])', r'\1<span class="we-office-shine" aria-hidden="true"></span>',body)
                if count != 4: raise SystemExit("Expected four " + cls + " shine layers, got " + str(count))
            # Keep the approved heading wording and preserve a literal space
            # between both individually animated Benefits heading spans.
            body = once(body,'A workspace that</span><span class="bn-heading-line bn-heading-line--accent">','A workspace that</span> <span class="bn-heading-line bn-heading-line--accent">',"benefits title spacing")
            body,n = re.subn(r'(<div class="hs-cta">[\s\S]*?<a\b[^>]*href="tel:[^"]+"[^>]*>)Call now(</a>)',r'\1Talk with us\2',body,count=1)
            if n!=1: raise SystemExit("One-person process CTA marker changed")
            body = once(body,'<p class="hs-cta-line">Start with a quick call.</p>', '', "remove process CTA caption")
            # Keep the original offer ticket, text and plan choices, but use the
            # same consultation dialog, callback integration and one CTA as category.
            body,n = re.subn(r'<a class="lm-cta"[^>]*>[\s\S]*?</a>',
                '<button class="lm-cta" id="open-speak" type="button" aria-haspopup="dialog">Talk with us</button>',body,count=1)
            if n!=1: raise SystemExit("Cross-page polish: consultation CTA changed")
            body += '\n'+DIALOG+'\n<script>'+SCRIPT.replace("category-consultation","one-person-consultation")+'</script>\n'
    body += '\n<script>\n'+(SRC/"site-polish.js").read_text(encoding="utf-8")+'\n</script>\n'
    return body
