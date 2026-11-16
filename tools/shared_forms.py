"""Shared form presentation only. Retain field IDs, values, validators and handlers."""
import re

MAIN_IDS = {"home":"eqForm","workspaces":"enquiryForm","category":"enquiry-form","one-person":"officeEnquiry"}
PANEL_CLASSES = {"home":"fm","workspaces":"form-card","category":"enquiry-panel","one-person":"form-shell"}

def add_class(tag, value):
    m = re.search(r'\bclass="([^"]*)"', tag)
    if m:
        return tag[:m.start(1)]+m.group(1)+" "+value+tag[m.end(1):]
    return tag[:-1]+' class="'+value+'">'

def apply_shared_forms(body, key):
    main_id = MAIN_IDS[key]
    panel = PANEL_CLASSES[key]
    pattern = r'<div\b[^>]*\bclass="[^"]*\b'+re.escape(panel)+r'\b[^"]*"[^>]*>'
    body, n = re.subn(pattern, lambda m: add_class(m.group(), "we-form-panel"), body, count=1)
    if n != 1:
        raise SystemExit("Shared form panel not found: "+key)
    # Home and Workspaces use the same heading hierarchy and introductory copy as the other two.
    if key in ("home", "workspaces"):
        pattern = r'(<div\b[^>]*class="[^"]*\bwe-form-panel\b[^"]*"[^>]*>\s*)(<h3>Enquire about a workspace</h3>)'
        body,n = re.subn(pattern, lambda m:m.group(1)+'<p class="we-form-kicker">Let\'s talk</p>'+m.group(2)+'<p class="we-form-intro">Tell us what you need and our team will get in touch shortly.</p>', body, count=1)
        if n!=1:
            raise SystemExit("Missing shared enquiry heading: "+key)

    def update(m):
        form = m.group()
        tag = re.match(r'<form\b[^>]*>', form).group()
        id_match = re.search(r'\bid="([^"]+)"', tag)
        fid = id_match.group(1) if id_match else ""
        if fid not in (main_id, "mform", "subscribe-form"):
            return form
        form = add_class(tag, "we-form we-form-main" if fid == main_id else "we-form we-form-modal") + form[len(tag):]
        # Home main form has standalone labels. Group each label/control/error,
        # keeping the original input + error sibling relationship.
        if fid=="eqForm":
            pattern = r'(<label\b[^>]*>[\s\S]*?</label>\s*(?:<input\b[^>]*>|<select\b[^>]*>[\s\S]*?</select>|<textarea\b[^>]*>[\s\S]*?</textarea>)(?:\s*<div class="er">[\s\S]*?</div>)?)'
            form,n=re.subn(pattern,lambda p:'<div class="we-field">'+p.group(1)+'</div>',form,count=5)
            if n != 5: raise SystemExit("Unexpected home enquiry controls")
        else:
            form=re.sub(r'<div class="field([^"]*)">',lambda p:'<div class="field'+p.group(1)+' we-field">',form)
            form=re.sub(r'<label class="fld">','<label class="fld we-field">',form)
        # Empty placeholders become internal labels. Never modify select values,
        # nonempty default selections, hidden inputs, checkbox or consent copy.
        form=re.sub(r'(<(?:input|textarea)\b[^>]*?)placeholder="[^"]*"',
                    lambda p:p.group(1)+'placeholder=" "',form)
        form=re.sub(r'(<option\b[^>]*\bvalue=""[^>]*>)[^<]*(</option>)',r'\1\2',form)
        return form
    body=re.sub(r'<form\b[\s\S]*?</form>',update,body)
    if 'we-form we-form-main' not in body:
        raise SystemExit("Missing main enquiry form: "+key)
    return body
