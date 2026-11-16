"""One universal footer. Retain valid page routes, enquiry jumps and contact details."""
import re
def apply_shared_footer(body,key):
    enquiry = "#enquire" if key == "home" else "#enquiry"
    logo = "/assets/img/workspace-by-emlen-d50fe795.png"
    footer = f'''<footer class="we-universal-footer">
      <div class="we-footer-inner">
        <div class="we-footer-grid">
          <div class="we-footer-brand"><a href="/" aria-label="Workspace by Emlen home"><img src="{logo}" alt="Workspace by Emlen" width="640" height="85" loading="lazy"></a><p>Managed private offices and flexible workspaces across South Bengaluru.</p></div>
          <nav aria-label="Footer navigation"><h4>Explore</h4><ul><li><a href="/">Home</a></li><li><a href="/workspaces/">Workspaces</a></li><li><a href="/managed-office/south-bangalore/">Managed Offices</a></li><li><a href="/managed-office/one-person-office/">One Person Office</a></li></ul></nav>
          <div><h4>Locations</h4><ul><li><a href="/workspaces/#locations">Jayanagar</a></li><li><a href="/managed-office/one-person-office/#locations">JP Nagar</a></li><li><a href="/managed-office/one-person-office/#locations">Bannerghatta Road</a></li><li><a href="/managed-office/one-person-office/#locations">Arekere</a></li></ul></div>
          <div><h4>Contact</h4><ul><li><a href="tel:+919814953954">+91 98149 53954</a></li><li><a href="{enquiry}">Enquire now</a></li><li><a href="/workspaces/#faqs">FAQs</a></li></ul></div>
        </div>
        <div class="we-footer-bottom"><small>© Workspace by Emlen. All rights reserved.</small></div>
      </div>
    </footer>'''
    body,n=re.subn(r'<footer\b[^>]*>[\s\S]*?</footer>',lambda _:footer,body,count=1)
    if n!=1:raise SystemExit("Expected one existing footer: "+key)
    return body
