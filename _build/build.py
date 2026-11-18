#!/usr/bin/env python3
"""
Castro Finish Carpentry — static site builder.

Every page shares one header, footer and icon set, defined here once.
Edit content in this file (or in _build/pages/home.html for the homepage),
then run:

    python3 _build/build.py

It writes plain .html files to the project root. Upload the root folder
(everything except _build/ and .claude/) to any static host.
"""
import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = Path(__file__).resolve().parent / "pages"

PHONE = "(508) 566-1618"
TEL = "tel:+15085661618"
EMAIL = "ecastrocarpentry@gmail.com"
ADDRESS = "15 Jan Sebastian Dr, Unit 4, Sandwich, MA 02563"
MAPS = "https://www.google.com/maps/search/?api=1&amp;query=Castro+Finish+Carpentry+Cape+Cod+MA"
INSTAGRAM = "https://www.instagram.com/castrocarpentry2024/"
GOOGLE_REVIEWS = "https://www.google.com/search?q=Castro+Finish+Carpentry+Inc#lrd=0x88a81f1d101b294d:0x9cced1d130698f39,1"
GOOGLE_WRITE = "https://www.google.com/search?q=Castro+Finish+Carpentry+Inc#lrd=0x88a81f1d101b294d:0x9cced1d130698f39,3"

ARROW = '<svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg>'
CHECK = '<svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>'


def ico(name, cls="ico"):
    return f'<svg class="{cls}" aria-hidden="true"><use href="#i-{name}"/></svg>'


# --------------------------------------------------------------------------
# Services data (feeds the service pages, the Services page, nav and footer)
# --------------------------------------------------------------------------
SERVICES = [
    {
        "slug": "trim",
        "name": "Trim & finish carpentry",
        "short": "Trim",
        "title": "Exterior Trim Repair & Replacement on Cape Cod",
        "h1": "Exterior trim, <span class=\"page-hero__accent\">done right at the edges.</span>",
        "lead": "Rot repair, fascia and soffits, corner boards and window trim — with clean lines, tight joints, and a clear estimate. Free on-site visit.",
        "img": "siding-cedar-balcony.jpg",
        "img_alt": "Cedar shingle wall with balcony and fresh exterior trim",
        "img2": "siding-white-colonial.jpg",
        "img2_alt": "White colonial with crisp window trim and black shutters",
        "summary": "Replacement, repairs, and detailed finishing inside and out — straight lines, tight joints, clean transitions, and hidden rot fixed before we close up.",
        "why_title": "Trim is your home's <span class=\"accent\">first line of defense.</span>",
        "why": [
            "On a Cape Cod house, trim takes the first hit from wind-driven rain and salt air. Leaks start at the corners, seams, and transitions — and once moisture gets behind a board, it quietly softens the framing underneath.",
            "That's why we don't just nail new boards over old problems. We open it up, fix what's underneath, and then install trim that's fitted, fastened, and sealed to last.",
        ],
        "points": [
            "Stops water at corners, seams and transitions",
            "Prevents hidden rot from reaching the framing",
            "Protects fascia and soffits from constant moisture",
            "Closes gaps that let insects and animals in",
            "Helps paint and siding last longer",
        ],
        "handle_title": "What we handle",
        "handle": [
            ("Fascia", "Rotted or soft fascia boards replaced and properly backed."),
            ("Soffits & vents", "Damaged soffits repaired with vent paths kept clear."),
            ("Window & door trim", "Casings, sills and head trim fitted tight around openings."),
            ("Corner boards", "Vertical seams and corners rebuilt square and sealed."),
            ("Frieze & rake boards", "Top edges and roofline transitions made weather-tight."),
            ("Interior finish trim", "Baseboards, casings and detailed interior finishing."),
        ],
        "diff_title": "The Castro difference",
        "diff": [
            ("Finish-carpentry detail", "Straight alignment, tight joints and clean transitions you can see from the street."),
            ("Rot-first repairs", "Hidden damage is addressed before anything gets closed up — no covering problems."),
            ("Coastal-ready protection", "Detailing for wind-driven rain and moisture, with materials chosen for salt air."),
            ("Material guidance", "Wood or PVC, recommended for your exposure, budget and the look of your home."),
        ],
        "steps_title": "The 6 areas we inspect first",
        "steps": [
            ("Fascia integrity", "Soft spots, rot and backing behind the gutter line."),
            ("Soffits & vent paths", "Damage, gaps and airflow."),
            ("Frieze boards & top edges", "Where wall meets roofline."),
            ("Window trim & head flashing", "The most common leak points on a wall."),
            ("Corner boards & vertical seams", "Open joints and splitting."),
            ("Roofline transitions & returns", "Where water likes to sneak in."),
        ],
        "warning": ("Trim problems spread fast", "Watch for peeling paint, dark staining, soft spots, and gaps at corners or rooflines. Catching it early usually means a smaller, simpler repair."),
        "faq": [
            ("Do you offer free on-site trim estimates?", "Yes. We visit, inspect fascia, soffits, corners and windows, and give you an itemized scope and estimate."),
            ("Do you do repairs, or only full replacement?", "Both. We repair what's still sound and replace when that's the safer long-term fix — and we'll explain why."),
            ("What trim materials do you use?", "Common exterior materials used on the Cape, including wood and PVC. We recommend based on exposure, budget and look."),
            ("Do you repair fascia and soffits too?", "Yes. They're some of the most common failure points in coastal weather."),
            ("How long does a trim project take?", "It depends on how many areas need work and whether there's hidden rot. You'll get a timeline after the visit."),
        ],
    },
    {
        "slug": "siding",
        "name": "Siding repair & installation",
        "short": "Siding",
        "title": "Siding Repair & Replacement on Cape Cod",
        "h1": "Siding built for <span class=\"page-hero__accent\">Cape Cod weather.</span>",
        "lead": "Cedar shingle, vinyl and fiber cement — repaired or replaced as a full wall system, with rot fixed properly and a clean finish. Free on-site estimate.",
        "img": "siding-cedar-gable.jpg",
        "img_alt": "New cedar shingle siding on a gable end",
        "img2": "siding-cedar-balcony.jpg",
        "img2_alt": "Cedar shingle siding around a balcony and windows",
        "summary": "Cracked, loose, or warped sections replaced with proper flashing and sealing — plus rot repair around trim and corners for real curb appeal.",
        "why_title": "Siding is a system. <span class=\"accent\">Every layer matters.</span>",
        "why": [
            "Good siding isn't just what you see. It's solid backing, insulation where it applies, a weather-resistive barrier, and clean transitions at every window, door, corner and trim line.",
            "We repair the weak points, rebuild the transitions, and seal the details — so water stays out and the wall looks sharp for years.",
        ],
        "points": [
            "Stops water intrusion at the source",
            "Rot repaired before it spreads — not patched over",
            "Straight lines, aligned courses, clean trim details",
            "Daily cleanup and a protected job site",
        ],
        "handle_title": "Ideal for Cape Cod homes that need…",
        "handle": [
            ("Cedar shingle siding", "Repairs, re-shingling and new cedar on classic Cape homes."),
            ("Vinyl siding", "Section repairs and full replacements."),
            ("Fiber cement upgrades", "Durable, low-maintenance siding with a crisp finish."),
            ("Rot around trim & corners", "Soft backing and sheathing found, documented and repaired."),
            ("Water intrusion", "Wind-driven rain issues traced and fixed at the source."),
            ("Fascia, soffit & trim", "Exterior trim repairs done alongside your siding."),
        ],
        "diff_title": "What you get with Castro siding work",
        "diff": [
            ("Water protection built in", "Weak points repaired, barrier reinforced where needed, transitions rebuilt."),
            ("Rot addressed the right way", "Compromised backing or sheathing is repaired — not hidden under new siding."),
            ("A finish you'll notice", "Aligned courses and clean edges around every window, door and corner."),
            ("Clear, itemized estimate", "You see the scope and price before work starts."),
        ],
        "steps_title": "How a siding project works",
        "steps": [
            ("On-site evaluation", "We look at the siding, trim, transitions and any signs of water."),
            ("Itemized estimate", "Repair vs. replacement options, explained clearly."),
            ("Repair what's underneath", "Backing, sheathing and barrier fixed where needed."),
            ("Install & detail", "Siding, trim, corners and edges rebuilt clean."),
            ("Cleanup & walkthrough", "Daily cleanup and a final walkthrough with you."),
        ],
        "warning": None,
        "faq": [
            ("What types of siding do you work with?", "Cedar shingle, vinyl and fiber cement — plus the trim, fascia and soffits around them."),
            ("Can you match my existing siding?", "When possible. If it's discontinued or has aged, we'll show you the closest option."),
            ("Can you repair one section instead of replacing everything?", "Often, yes. Many homes need a targeted repair. We'll explain when replacement is the better long-term choice."),
            ("What if there's hidden rot behind the siding?", "We document it and repair the compromised backing or sheathing before closing up."),
            ("How long do siding repairs take?", "It depends on scope and weather. You'll get a timeline after the evaluation, before work starts."),
        ],
    },
    {
        "slug": "decks",
        "name": "Decks, repairs & upgrades",
        "short": "Decks",
        "title": "Deck Building, Repairs & Upgrades on Cape Cod",
        "h1": "Decks that feel solid <span class=\"page-hero__accent\">and look finished.</span>",
        "lead": "New builds, rebuilds, board replacement, railings, stairs and refinishing — in wood or composite, framed accurately and fastened tight.",
        "img": "deck-cable-railing.jpg",
        "img_alt": "Composite deck with black cable railing in the pines",
        "img2": "deck-black-railing.jpg",
        "img2_alt": "Grey deck with black railing and new stairs",
        "summary": "New builds, rebuilds, board replacement, railings, stairs, and refinishing — in wood or composite, framed square and fastened tight.",
        "why_title": "Built right from <span class=\"accent\">the framing up.</span>",
        "why": [
            "A great deck starts underneath. We focus on framing accuracy, water management and proper fastening, so the surface stays flat and tight — no wobble, bounce or squeaks.",
            "Safety comes first: railings and stairs are built solid, and any safety issue we find gets addressed before anything cosmetic.",
        ],
        "points": [
            "Accurate framing and layout",
            "Safe, solid railings and stairs",
            "Water management to protect the structure",
            "Wood and composite options",
            "Workmanship warranty, explained in writing",
        ],
        "handle_title": "What we handle",
        "handle": [
            ("New deck builds", "Designed for your yard, your home and how you use it."),
            ("Full rebuilds", "Tear-off and rebuild when the structure has reached its limit."),
            ("Repairs & board replacement", "Boards swapped without a rebuild when the framing is solid."),
            ("Railings", "Wood, composite, black metal or cable — built safe and straight."),
            ("Stairs", "New or rebuilt stairs with proper rise, run and support."),
            ("Refinishing", "Cleaning, repairs and refinishing to bring a tired deck back."),
        ],
        "diff_title": "Our deck process",
        "diff": [
            ("On-site assessment", "We check the structure, the boards, railings and stairs."),
            ("Measurements & layout", "Planned around your space, access and drainage."),
            ("Material guidance", "Wood vs. composite — look, maintenance and budget compared."),
            ("Final walkthrough", "We review the finished deck with you and leave the site clean."),
        ],
        "steps_title": "Step by step",
        "steps": [
            ("Assessment", "Structure, boards, railings and stairs checked."),
            ("Measurements & layout", "Planned for your space and drainage."),
            ("Framing check", "Ledger, joists and footings verified."),
            ("Safety details", "Railings, stairs and connections done right."),
            ("Fastening & finish", "Tight, squeak-resistant surface."),
            ("Walkthrough & cleanup", "Reviewed together, site left clean."),
        ],
        "warning": None,
        "faq": [
            ("Do you build new decks or only repair?", "Both — new builds, full rebuilds, repairs and upgrades."),
            ("Can you replace boards without rebuilding the frame?", "Sometimes. If the framing is solid, we can replace boards only. We'll check and tell you honestly."),
            ("Wood or composite?", "We build with both and will walk you through the trade-offs in look, maintenance and budget."),
            ("How do you prevent wobble, bounce and squeaks?", "Careful layout, accurate framing and proper fastening."),
            ("Do you build stairs and railings?", "Yes — new and replacement stairs and railings, built safe and straight."),
        ],
    },
    {
        "slug": "windows-doors",
        "name": "Windows & doors",
        "short": "Windows & Doors",
        "title": "Window & Door Installation and Replacement on Cape Cod",
        "h1": "Windows & doors, <span class=\"page-hero__accent\">installed as a system.</span>",
        "lead": "Installation and replacement with tight seals, smooth operation and water protection at every edge — finished with clean trim.",
        "img": "siding-white-colonial.jpg",
        "img_alt": "Colonial home with new windows and black shutters",
        "img2": "siding-cedar-gable.jpg",
        "img2_alt": "Cedar gable with new windows and trim",
        "summary": "Installation and replacement installed as a system — flashing, sealing, and square, level framing to stop drafts and leaks, finished with clean trim.",
        "why_title": "A window is only as good <span class=\"accent\">as its install.</span>",
        "why": [
            "Most drafts and leaks around windows and doors come from the installation, not the unit. We treat every opening as a system: framing checks, flashing, sealing and insulation, then clean trim transitions.",
            "The result is a window that opens smoothly, a door that closes square, and an opening that stays dry.",
        ],
        "points": [
            "Tight seals that stop drafts",
            "Square, level and smooth operation",
            "Water protection at sills, heads and transitions",
            "Trim finishing included in the job",
        ],
        "handle_title": "What we install",
        "handle": [
            ("Double-hung windows", "The classic Cape Cod window, replaced or newly installed."),
            ("Casement windows", "Crank-out windows sealed tight."),
            ("Sliders & picture windows", "Large openings framed and flashed properly."),
            ("Entry doors", "Hung square with tight weatherstripping."),
            ("Sliding patio doors", "Smooth operation and a dry sill."),
            ("Single-unit replacement", "Matched to your existing style and size."),
        ],
        "diff_title": "What makes our installs last",
        "diff": [
            ("Framing checks", "Rough openings checked for square, level and rot before install."),
            ("Flashing & sealing", "Water managed at the sill, top edge and every transition."),
            ("Insulation", "Gaps filled to stop air leaks around the unit."),
            ("Clean trim", "Interior and exterior trim finished as part of the job."),
        ],
        "steps_title": "How it works",
        "steps": [
            ("Free on-site estimate", "We measure and look at the openings."),
            ("Repair or replace?", "Honest recommendation for each unit."),
            ("Install as a system", "Framing, flashing, sealing, insulation."),
            ("Trim & walkthrough", "Clean finish and a final check with you."),
        ],
        "warning": None,
        "faq": [
            ("Do you repair windows and doors or only replace them?", "Both — whichever makes the most sense for each unit."),
            ("Can you replace a single window or door?", "Yes, and we can match the existing style and size."),
            ("What types do you install?", "Double-hung, casement, sliders, picture windows, entry doors and sliding patio doors."),
            ("I have drafts or water around a window. Can you fix it?", "Yes. We install as a system — flashing, sealing, insulation and clean trim transitions."),
            ("Do you repair the trim around windows?", "Yes, trim repair and finishing are part of what we do."),
        ],
    },
    {
        "slug": "roofing",
        "name": "Roofing repairs",
        "short": "Roofing",
        "title": "Roof Repairs on Cape Cod",
        "h1": "Roof repairs that stop leaks <span class=\"page-hero__accent\">at the source.</span>",
        "lead": "Leak detection, chimney and skylight flashing, storm damage and shingle repairs — with photos, clear options and an itemized estimate.",
        "img": "roofing-drone.jpg",
        "img_alt": "Aerial view of a Cape Cod home with a new roof",
        "img2": "roofing-install-aerial.jpg",
        "img2_alt": "Castro crew installing new shingles",
        "summary": "Leaks stopped at the source — damaged shingles, flashing at chimneys, skylights, and valleys, storm repairs, and preventive fixes.",
        "why_title": "A quick patch vs. <span class=\"accent\">a proper repair.</span>",
        "why": [
            "Most leaks start at flashing, valleys, edges and tie-ins — not in the middle of the roof. A quick patch covers the symptom. We trace where the water gets in and rebuild the detail that failed.",
            "You get photos of what we found, clear options, and an itemized estimate before any work starts.",
        ],
        "points": [
            "Leak entry point traced, not guessed",
            "Flashing rebuilt where leaks start",
            "Itemized estimate before work",
            "Protected job site, photos and next steps",
        ],
        "handle_title": "What we repair",
        "handle": [
            ("Leak detection", "Water paths traced to the real entry point."),
            ("Chimney & skylight flashing", "Custom-fitted flashing instead of relying on sealant."),
            ("Storm damage", "Missing, lifted or cracked shingles repaired."),
            ("Valleys, eaves & edges", "Ice & water membrane and drip edges done right."),
            ("Vent boots & penetrations", "Failed boots and nail pops fixed."),
            ("Trim integration", "Fascia, soffits and drip edges aligned with the roof."),
        ],
        "diff_title": "Built for the coast",
        "diff": [
            ("Leak-proof flashing", "Custom-fitted at chimneys, skylights and walls."),
            ("Ice & water shield", "Self-adhering membrane on eaves and valleys as a second line of defense."),
            ("High-wind fastening", "A 6-nail fastening pattern with straight, aligned rows."),
            ("Documentation", "Photos and notes you can use with your insurer after a storm."),
        ],
        "steps_title": "What we inspect on-site",
        "steps": [
            ("Leak entry points", "And the path the water takes."),
            ("Chimney & skylight flashing", "The most common leak sources."),
            ("Valleys, eaves & edges", "Where water concentrates."),
            ("Shingles", "Missing, lifted or cracked."),
            ("Fasteners", "Nail pops and fastener issues."),
            ("Vents & penetrations", "Boots and seals."),
            ("Soft spots", "Early signs of rot in the deck."),
            ("Gutters & drainage", "Overflow and trouble spots."),
        ],
        "warning": ("After the visit, you receive", "Photos and a clear explanation, repair options (best fix vs. budget fix), an itemized estimate for labor and materials, and a timeline for install day."),
        "faq": [
            ("Should I repair or replace my roof?", "Many leaks come from flashing, valleys, edges or a small damaged area. We'll tell you honestly whether a targeted repair makes sense."),
            ("What are the most common roof repairs on Cape Cod?", "Storm damage, missing or lifted shingles, chimney and skylight flashing, valley leaks, nail pops, vent boots and edge problems."),
            ("How fast can you respond to an active leak?", "We prioritize active leaks when we can. Timing depends on weather and schedule — we'll set the soonest available visit."),
            ("Will the repair match my existing shingles?", "When possible. Otherwise we'll show you the closest option."),
            ("Can you help with an insurance claim?", "We provide photos and documentation. You work with your insurer on approvals and coverage."),
        ],
    },
]
SVC = {s["slug"]: s for s in SERVICES}


# --------------------------------------------------------------------------
# Layout
# --------------------------------------------------------------------------
NAV = [
    ("services.html", "Services", "services"),
    ("about.html", "About", "about"),
    ("process.html", "Process", "process"),
    ("reviews.html", "Reviews", "reviews"),
    ("financing.html", "Financing", "financing"),
    ("faq.html", "FAQ", "faq"),
    ("contact.html", "Contact", "contact"),
]


def header(active):
    items = []
    for href, label, key in NAV:
        cur = ' aria-current="page"' if key == active else ""
        if key == "services":
            cur_attr = ' aria-current="page"'
            sub = "".join(
                f'<li><a href="{s["slug"]}.html"{cur_attr if active == s["slug"] else ""}>{s["short"]}</a></li>'
                for s in SERVICES
            )
            is_cur = ' aria-current="page"' if active == "services" else ""
            in_sec = " is-section" if active in SVC else ""
            items.append(
                f'<li class="has-sub"><a href="{href}" class="{in_sec.strip()}"{is_cur}>{label}'
                f'<svg class="ico chev" aria-hidden="true"><use href="#i-chev"/></svg></a>'
                f'<ul class="sub" aria-label="Services">{sub}</ul></li>'
            )
        else:
            items.append(f'<li><a href="{href}"{cur}>{label}</a></li>')
    nav = "\n          ".join(items)
    return f'''  <a class="skip-link" href="#main">Skip to content</a>

  <div class="topbar">
    <div class="container topbar__inner">
      <p class="topbar__msg">Free on-site estimates across Cape Cod <span aria-hidden="true">·</span> Financing available</p>
      <div class="topbar__links">
        <a href="{TEL}">{ico("phone")}{PHONE}</a>
        <a href="mailto:{EMAIL}" class="hide-sm">{ico("mail")}{EMAIL}</a>
      </div>
    </div>
  </div>

  <header class="header" id="top">
    <div class="container header__inner">
      <a href="index.html" class="brand" aria-label="Castro Finish Carpentry, home">
        <img src="assets/logos/logo-castro-azul-400.png" alt="" width="56" height="56">
        <span class="brand__text"><strong>Castro</strong><span>Finish Carpentry</span></span>
      </a>

      <nav class="nav" id="site-nav" aria-label="Main">
        <ul>
          {nav}
        </ul>
        <a class="btn btn--primary nav__cta-mobile" href="contact.html">Get a free estimate</a>
      </nav>

      <div class="header__actions">
        <a class="header__phone" href="{TEL}">
          <span class="header__phone-label">Call now</span>
          <span class="header__phone-num">{PHONE}</span>
        </a>
        <a class="btn btn--primary hide-md" href="contact.html">Free estimate</a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>
'''


def footer():
    svc_links = "\n          ".join(f'<li><a href="{s["slug"]}.html">{s["name"]}</a></li>' for s in SERVICES)
    return f'''
  <footer class="footer">
    <div class="container footer__grid">
      <div class="footer__brand">
        <img src="assets/logos/logo-castro-azul-adesivo-400.png" alt="Castro Carpentry logo" width="96" height="97">
        <p class="footer__quote">“We don't just build with wood. We build with values.”</p>
        <p class="footer__sig">— Estevam Castro</p>
      </div>
      <nav aria-label="Services">
        <h2 class="footer__h">Services</h2>
        <ul>
          {svc_links}
        </ul>
      </nav>
      <nav aria-label="Company">
        <h2 class="footer__h">Company</h2>
        <ul>
          <li><a href="about.html">About us</a></li>
          <li><a href="process.html">How it works</a></li>
          <li><a href="reviews.html">Reviews</a></li>
          <li><a href="financing.html">Financing</a></li>
          <li><a href="faq.html">FAQ</a></li>
          <li><a href="contact.html">Contact</a></li>
        </ul>
      </nav>
      <div>
        <h2 class="footer__h">Contact</h2>
        <ul class="footer__contact">
          <li>{ico("phone")}<a href="{TEL}">{PHONE}</a></li>
          <li>{ico("mail")}<a href="mailto:{EMAIL}">{EMAIL}</a></li>
          <li>{ico("pin")}<a href="{MAPS}" target="_blank" rel="noopener">{ADDRESS}</a></li>
          <li>{ico("insta")}<a href="{INSTAGRAM}" target="_blank" rel="noopener">@castrocarpentry2024</a></li>
        </ul>
      </div>
    </div>
    <div class="container footer__bottom">
      <p>© <span id="year">2026</span> Castro Finish Carpentry · Licensed &amp; insured in MA · BBB accredited</p>
      <a href="#top">Back to top ↑</a>
    </div>
  </footer>

  <div class="callbar">
    <a class="btn btn--light" href="{TEL}">{ico("phone")}Call</a>
    <a class="btn btn--primary" href="contact.html">Free estimate</a>
  </div>
'''


SPRITE = '''
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <defs>
      <symbol id="i-phone" viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></symbol>
      <symbol id="i-mail" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></symbol>
      <symbol id="i-pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></symbol>
      <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
      <symbol id="i-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
      <symbol id="i-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></symbol>
      <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></symbol>
      <symbol id="i-award" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/></symbol>
      <symbol id="i-star" viewBox="0 0 24 24"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></symbol>
      <symbol id="i-doc" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></symbol>
      <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
      <symbol id="i-insta" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></symbol>
      <symbol id="i-alert" viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></symbol>
      <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></symbol>
      <symbol id="i-home" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></symbol>
      <symbol id="i-chat" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></symbol>
      <symbol id="i-tool" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/></symbol>
      <symbol id="i-wave" viewBox="0 0 24 24"><path d="M2 6c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2M2 12c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2M2 18c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2"/></symbol>
      <symbol id="i-heart" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></symbol>
    </defs>
  </svg>
'''

JSON_LD = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "name": "Castro Finish Carpentry",
    "url": "https://castrocarpentryinc.com/",
    "telephone": "+1-508-566-1618",
    "email": EMAIL,
    "address": {"@type": "PostalAddress", "streetAddress": "15 Jan Sebastian Dr, Unit 4", "addressLocality": "Sandwich",
                "addressRegion": "MA", "postalCode": "02563", "addressCountry": "US"},
    "areaServed": "Cape Cod, MA",
    "founder": "Estevam Castro",
    "foundingDate": "2013",
    "aggregateRating": {"@type": "AggregateRating", "ratingValue": "5.0", "reviewCount": "61"},
    "sameAs": [INSTAGRAM],
}


def layout(filename, title, description, active, body, preload=None):
    pre = f'\n  <link rel="preload" href="assets/img/{preload}" as="image">' if preload else ""
    ld = ""
    if filename == "index.html":
        ld = '\n  <script type="application/ld+json">' + json.dumps(JSON_LD) + "</script>"
    return f'''<!DOCTYPE html>
<!-- Generated by _build/build.py: edit content there (homepage body: _build/pages/home.html), then run: python3 _build/build.py -->
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{escape(description)}">
  <meta name="theme-color" content="#004d93">
  <meta property="og:title" content="{escape(title)}">
  <meta property="og:description" content="{escape(description)}">
  <meta property="og:type" content="website">
  <link rel="icon" type="image/png" href="assets/logos/logo-castro-azul-400.png">
  <link rel="preload" href="assets/fonts/Jost-Variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/Poppins-Regular.woff2" as="font" type="font/woff2" crossorigin>{pre}
  <link rel="stylesheet" href="css/styles.css">{ld}
</head>
<body>
{header(active)}
  <main id="main">
{body}
  </main>
{footer()}{SPRITE}
  <script src="js/main.js" defer></script>
</body>
</html>
'''


# --------------------------------------------------------------------------
# Shared blocks
# --------------------------------------------------------------------------
def page_hero(crumbs, eyebrow, h1, lead, img, img_alt, ctas=True):
    trail = ['<li><a href="index.html">Home</a></li>']
    for href, label in crumbs[:-1]:
        trail.append(f'<li><a href="{href}">{label}</a></li>')
    trail.append(f'<li aria-current="page">{crumbs[-1][1]}</li>')
    buttons = f'''
          <div class="hero__ctas">
            <a class="btn btn--primary btn--lg" href="contact.html">Get a free estimate {ARROW}</a>
            <a class="btn btn--ghost-light btn--lg" href="{TEL}">{ico("phone")}{PHONE}</a>
          </div>''' if ctas else ""
    return f'''    <section class="page-hero" aria-labelledby="page-title">
      <img class="page-hero__bg" src="assets/img/{img}" alt="{escape(img_alt)}" width="1400" height="1050" fetchpriority="high">
      <div class="page-hero__shade" aria-hidden="true"></div>
      <div class="container page-hero__inner">
        <nav aria-label="Breadcrumb"><ol class="crumbs">{"".join(trail)}</ol></nav>
        <p class="eyebrow eyebrow--light"><span class="eyebrow__line" aria-hidden="true"></span>{eyebrow}</p>
        <h1 id="page-title" class="page-hero__title">{h1}</h1>
        <p class="page-hero__lead">{lead}</p>{buttons}
      </div>
    </section>
'''


def section_head(eyebrow, title, lead="", center=True, light=False):
    c = " section-head--center" if center else ""
    ec = " eyebrow--center" if center else ""
    el = " eyebrow--light" if light else ""
    tail = '<span class="eyebrow__line" aria-hidden="true"></span>' if center else ""
    h2l = " h2--light" if light else ""
    lead_html = f'\n          <p class="lead{" lead--light" if light else ""}">{lead}</p>' if lead else ""
    return f'''        <header class="section-head{c}">
          <p class="eyebrow{ec}{el}"><span class="eyebrow__line" aria-hidden="true"></span>{eyebrow}{tail}</p>
          <h2 class="h2{h2l}">{title}</h2>{lead_html}
        </header>
'''


def cta_band(title="Ready to start your project?", text="Tell us what you need and where the project is. We'll follow up quickly with a free, itemized estimate."):
    return f'''    <section class="cta-band" aria-label="Get a free estimate">
      <div class="container cta-band__inner">
        <img src="assets/logos/logo-castro-azul-adesivo-400.png" alt="" width="96" height="97" class="cta-band__seal">
        <div class="cta-band__copy">
          <h2 class="h2 h2--light">{title}</h2>
          <p>{text}</p>
        </div>
        <div class="cta-band__btns">
          <a class="btn btn--light btn--lg" href="contact.html">Get a free estimate {ARROW}</a>
          <a class="btn btn--ghost-light btn--lg" href="{TEL}">{ico("phone")}{PHONE}</a>
        </div>
      </div>
    </section>
'''


def faq_list(items, first_open=True):
    out = []
    for i, (q, a) in enumerate(items):
        op = " open" if first_open and i == 0 else ""
        out.append(f'''          <details class="qa"{op}>
            <summary>{q}{ico("plus")}</summary>
            <p>{a}</p>
          </details>''')
    return '        <div class="faq__list">\n' + "\n".join(out) + "\n        </div>\n"


def checklist(items, light=False):
    cls = " checklist--light" if light else ""
    lis = "".join(f"<li>{CHECK}<span>{t}</span></li>" for t in items)
    return f'<ul class="checklist{cls}">{lis}</ul>'


def badges():
    return f'''        <ul class="badges" aria-label="Credentials">
          <li class="badge">{ico("shield", "badge__ico")}<div><h3>Licensed &amp; insured</h3><p>Massachusetts HIC/CSL licensed. Certificate of insurance on request.</p></div></li>
          <li class="badge">{ico("award", "badge__ico")}<div><h3>BBB accredited</h3><p>A Better Business Bureau accredited business.</p></div></li>
          <li class="badge">{ico("doc", "badge__ico")}<div><h3>Workmanship warranty</h3><p>Terms depend on scope and materials and are explained in writing.</p></div></li>
        </ul>
'''


def svc_card(s, link_label="Learn more"):
    return f'''          <article class="svc">
            <div class="svc__media"><img src="assets/img/{s["img"]}" alt="{escape(s["img_alt"])}" width="1120" height="1400" loading="lazy"></div>
            <div class="svc__body">
              <h3 class="svc__title">{s["name"]}</h3>
              <p>{s["summary"]}</p>
              <a class="svc__link" href="{s["slug"]}.html">{link_label} {ARROW}</a>
            </div>
          </article>
'''


# --------------------------------------------------------------------------
# Pages
# --------------------------------------------------------------------------
def service_page(s):
    handle = "".join(
        f'<li class="tile"><h3>{t}</h3><p>{d}</p></li>' for t, d in s["handle"]
    )
    diff = "".join(
        f'<li class="feature"><span class="feature__ico">{ico("check")}</span><div><h3>{t}</h3><p>{d}</p></div></li>'
        for t, d in s["diff"]
    )
    steps = "".join(
        f'<li class="vstep"><span class="vstep__num">{i:02d}</span><div><h3>{t}</h3><p>{d}</p></div></li>'
        for i, (t, d) in enumerate(s["steps"], 1)
    )
    warning = ""
    if s["warning"]:
        wt, wd = s["warning"]
        warning = f'''        <aside class="note">
          {ico("alert", "note__ico")}
          <div><h3>{wt}</h3><p>{wd}</p></div>
        </aside>
'''
    related = "".join(svc_card(r) for r in [x for x in SERVICES if x["slug"] != s["slug"]][:3])
    why = "".join(f"<p>{p}</p>" for p in s["why"])
    body = page_hero(
        [("services.html", "Services"), (f'{s["slug"]}.html', s["short"])],
        f'{s["short"]} · Cape Cod, MA', s["h1"], s["lead"], s["img"], s["img_alt"],
    )
    body += f'''
    <section class="section" aria-labelledby="why-title">
      <div class="container split">
        <div class="split__copy">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Why it matters</p>
          <h2 id="why-title" class="h2">{s["why_title"]}</h2>
          <div class="prose">{why}</div>
          {checklist(s["points"])}
        </div>
        <figure class="stack-img">
          <img src="assets/img/{s["img2"]}" alt="{escape(s["img2_alt"])}" width="1120" height="1400" loading="lazy">
        </figure>
      </div>
    </section>

    <section class="section section--warm" aria-labelledby="handle-title">
      <div class="container">
{section_head("Scope", s["handle_title"])}        <ul class="tiles">{handle}</ul>
      </div>
    </section>

    <section class="section" aria-label="{escape(s["diff_title"])}">
      <div class="container split split--top">
        <div>
{section_head("The Castro Standard", s["diff_title"], center=False)}          <ul class="features">{diff}</ul>
        </div>
        <div>
          <h2 class="h3">{s["steps_title"]}</h2>
          <ol class="vsteps">{steps}</ol>
{warning}        </div>
      </div>
    </section>

    <section class="section section--warm faq" aria-labelledby="faq-title">
      <div class="container faq__inner">
        <header class="section-head section-head--center">
          <p class="eyebrow eyebrow--center"><span class="eyebrow__line" aria-hidden="true"></span>FAQ<span class="eyebrow__line" aria-hidden="true"></span></p>
          <h2 id="faq-title" class="h2">{s["short"]} <span class="accent">questions, answered.</span></h2>
        </header>
{faq_list(s["faq"])}        <div class="center"><a class="btn btn--outline" href="faq.html">See all questions {ARROW}</a></div>
      </div>
    </section>

    <section class="section" aria-labelledby="related-title">
      <div class="container">
        <header class="section-head section-head--center">
          <p class="eyebrow eyebrow--center"><span class="eyebrow__line" aria-hidden="true"></span>More services<span class="eyebrow__line" aria-hidden="true"></span></p>
          <h2 id="related-title" class="h2">One team for <span class="accent">the whole exterior.</span></h2>
        </header>
        <div class="services__grid">
{related}        </div>
      </div>
    </section>
'''
    body += cta_band(f'Need {s["short"].lower()} work?', "Get a free on-site visit and a clear, itemized estimate — no surprises.")
    return layout(
        f'{s["slug"]}.html',
        f'{s["title"]} | Castro Finish Carpentry',
        f'{s["lead"]} Call {PHONE}.',
        s["slug"], body, preload=s["img"],
    )


def services_page():
    rows = []
    for i, s in enumerate(SERVICES):
        rev = " svc-row--rev" if i % 2 else ""
        bullets = checklist(s["points"][:4])
        rows.append(f'''        <article class="svc-row{rev}" id="{s["slug"]}">
          <div class="svc-row__media"><img src="assets/img/{s["img"]}" alt="{escape(s["img_alt"])}" width="1120" height="1400" loading="lazy"></div>
          <div class="svc-row__copy">
            <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>{s["short"]}</p>
            <h2 class="h2">{s["name"]}</h2>
            <p class="lead">{s["summary"]}</p>
            {bullets}
            <div class="row-btns">
              <a class="btn btn--primary" href="{s["slug"]}.html">Explore {s["short"].lower()} {ARROW}</a>
              <a class="btn btn--outline" href="contact.html">Get an estimate</a>
            </div>
          </div>
        </article>
''')
    body = page_hero([("services.html", "Services")], "What we do",
                     'Full-service finish carpentry <span class="page-hero__accent">&amp; repairs, all in one place.</span>',
                     "From one rotted trim board to a full deck rebuild — one accountable team, built for Cape Cod homes and coastal weather.",
                     "hero-cape-house.jpg", "Cape Cod home with new roof and porch")
    body += f'''
    <section class="section" aria-label="Our services">
      <div class="container svc-rows">
{"".join(rows)}      </div>
    </section>

    <section class="section section--warm" aria-labelledby="how-title">
      <div class="container">
{section_head("Every project", 'Same standard, <span class="accent">whatever the job.</span>')}        <ul class="features features--grid">
          <li class="feature"><span class="feature__ico">{ico("doc")}</span><div><h3>Clear, itemized estimates</h3><p>Scope and price in writing before we start.</p></div></li>
          <li class="feature"><span class="feature__ico">{ico("clock")}</span><div><h3>Reliable schedule</h3><p>We show up when we say and follow through.</p></div></li>
          <li class="feature"><span class="feature__ico">{ico("home")}</span><div><h3>Protected home, daily cleanup</h3><p>Your property and routine are respected.</p></div></li>
          <li class="feature"><span class="feature__ico">{ico("chat")}</span><div><h3>Fast communication</h3><p>Updates you don't have to chase.</p></div></li>
          <li class="feature"><span class="feature__ico">{ico("tool")}</span><div><h3>Root problem solved</h3><p>Rot and water issues fixed, not covered.</p></div></li>
          <li class="feature"><span class="feature__ico">{ico("shield")}</span><div><h3>Licensed &amp; insured</h3><p>MA HIC/CSL licensed, BBB accredited.</p></div></li>
        </ul>
      </div>
    </section>
'''
    body += cta_band()
    return layout("services.html", "Services | Castro Finish Carpentry — Cape Cod",
                  "Trim, siding, decks, windows and doors, and roofing repairs across Cape Cod. One accountable team, clear itemized estimates.",
                  "services", body, preload="hero-cape-house.jpg")


def about_page():
    different = [
        ("Built for Cape Cod homes", "Cedar shingle, salt air and Nor'easters — we know what these houses need."),
        ("Craftsmanship you can see", "Straight lines, tight joints and clean transitions."),
        ("Clear estimates, no surprises", "Itemized scope and pricing before we start."),
        ("Clean, organized job sites", "Your home protected and cleaned up daily."),
        ("Reliable timeline", "We keep the schedule and follow through."),
        ("Fast, clear communication", "You always know what's next."),
        ("Licensed &amp; insured", "Massachusetts HIC/CSL licensed and fully insured."),
        ("BBB accredited", "A business you can check on."),
    ]
    approach = [
        ("Guidance first", "We explain your options before recommending anything."),
        ("We solve the root problem", "Rot and water are fixed at the source, not covered up."),
        ("Respect for your home &amp; routine", "Protected surfaces, tidy site, considerate crew."),
        ("Built for durability", "Materials and details chosen to last on the coast."),
        ("Pride in the final look", "We're not done until it looks right."),
    ]
    diff_html = "".join(f'<li class="tile"><h3>{t}</h3><p>{d}</p></li>' for t, d in different)
    appr_html = "".join(
        f'<li class="vstep"><span class="vstep__num">{i:02d}</span><div><h3>{t}</h3><p>{d}</p></div></li>'
        for i, (t, d) in enumerate(approach, 1))
    body = page_hero([("about.html", "About")], "Our story",
                     'Built on values. <span class="page-hero__accent">Led by Estevam Castro.</span>',
                     "A Cape Cod family business since 2013 — built day by day with hard work, faith and dedication.",
                     "roofing-porch-aerial.jpg", "Aerial view of a finished roof over a porch", ctas=False)
    body += f'''
    <section class="section" aria-labelledby="story-title">
      <div class="container split split--reverse">
        <div class="split__copy">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Since 2013</p>
          <h2 id="story-title" class="h2">Born from a dream. <span class="accent">Built day by day.</span></h2>
          <div class="prose">
            <p>Castro Carpentry Inc. started in 2013 as a small family business. Over more than twelve years, the team has grown — but the way we work hasn't changed.</p>
            <p>Estevam Castro, our founder, is a husband, a father of two, and someone who genuinely loves the work. To him, carpentry is about discipline, purpose and leaving something that lasts.</p>
            <p>Today Castro is a solid, reliable and respected name across Cape Cod — known for transparency, reliability and precision. No shortcuts, no hidden costs, and work delivered on schedule.</p>
          </div>
          <blockquote class="quote">
            <p>“We don't just build with wood. We build with values.”</p>
            <footer>— Estevam Castro, founder</footer>
          </blockquote>
        </div>
        <figure class="portrait">
          <!-- TODO: replace with a photo of Estevam on a job site (portrait, ~1100×1400) -->
          <img src="assets/img/roofing-install-aerial.jpg" alt="Castro crew installing a new roof on Cape Cod" width="1120" height="1400" loading="lazy">
          <figcaption class="portrait__tag"><strong>Estevam Castro</strong><span>Founder · Since 2013</span></figcaption>
        </figure>
      </div>
    </section>

    <section class="stats" aria-label="Castro at a glance">
      <div class="container stats__grid">
        <div class="stat"><p class="stat__num">12+</p><p class="stat__label">Years on Cape Cod</p></div>
        <div class="stat"><p class="stat__num">61</p><p class="stat__label">Google reviews</p></div>
        <div class="stat"><p class="stat__num">5.0<span class="stat__star" aria-hidden="true">★</span></p><p class="stat__label">Average rating</p></div>
      </div>
    </section>

    <section class="section section--warm" aria-labelledby="diff-title">
      <div class="container">
{section_head("The Castro Standard", 'What makes Castro <span class="accent">different.</span>')}        <ul class="tiles tiles--4">{diff_html}</ul>
      </div>
    </section>

    <section class="section" aria-labelledby="approach-title">
      <div class="container split split--top">
        <div>
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Our approach</p>
          <h2 id="approach-title" class="h2">How we work <span class="accent">on every job.</span></h2>
          <p class="lead">Transparency, reliability and precision — from the first conversation to the final walkthrough.</p>
          <div class="row-btns"><a class="btn btn--primary" href="process.html">See our process {ARROW}</a></div>
        </div>
        <ol class="vsteps">{appr_html}</ol>
      </div>
    </section>

    <section class="section section--warm" aria-label="Credentials">
      <div class="container">
{section_head("Trusted experts", 'In professional hands, <span class="accent">start to finish.</span>')}{badges()}      </div>
    </section>
'''
    body += cta_band("Let's talk about your project.")
    return layout("about.html", "About Us | Castro Finish Carpentry — Cape Cod",
                  "Castro Carpentry started in 2013 as a family business led by Estevam Castro. Licensed, insured and BBB accredited finish carpentry on Cape Cod.",
                  "about", body, preload="roofing-porch-aerial.jpg")


def process_page():
    steps = [
        ("Tell us what you need", "Share the project and the town it's in — by the form, phone or email. Photos help us understand it faster."),
        ("Quick follow-up", "We get back to you fast to ask the right questions and set a time to come out."),
        ("On-site check", "When needed, we visit to measure, check framing and hidden damage, and talk through materials."),
        ("Clear quote &amp; next steps", "You get an itemized estimate in writing, repair options where they apply, and a realistic timeline."),
    ]
    big = "".join(
        f'<li class="step"><span class="step__num">{i:02d}</span><h3 class="step__title">{t}</h3><p>{d}</p></li>'
        for i, (t, d) in enumerate(steps, 1))
    during = [
        ("Protected home", "Surfaces covered, access planned and your routine respected."),
        ("Daily cleanup", "The site is left organized at the end of every day."),
        ("Clear updates", "You'll know what's happening and what's next — without chasing us."),
        ("Root problems fixed", "If we find hidden rot or water damage, we show you and explain options before moving on."),
        ("Detail-driven finish", "Tight joints, straight lines and clean transitions."),
        ("Final walkthrough", "We review the finished work together before we call it done."),
    ]
    during_html = "".join(f'<li class="feature"><span class="feature__ico">{ico("check")}</span><div><h3>{t}</h3><p>{d}</p></div></li>' for t, d in during)
    body = page_hero([("process.html", "Process")], "How it works",
                     'A predictable path <span class="page-hero__accent">from first call to final walkthrough.</span>',
                     "No guesswork, no surprises. Here's exactly what working with Castro looks like.",
                     "deck-cable-railing.jpg", "Finished composite deck with cable railing")
    body += f'''
    <section class="section process" aria-labelledby="est-title">
      <div class="container">
{section_head("Free estimates", 'Four steps to <span class="accent">a clear quote.</span>')}        <ol class="steps">{big}</ol>
      </div>
    </section>

    <section class="section section--warm" aria-labelledby="receive-title">
      <div class="container split">
        <div class="split__copy">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Your estimate</p>
          <h2 id="receive-title" class="h2">What you receive <span class="accent">after the visit.</span></h2>
          <p class="lead">Everything you need to make a confident decision — and plan timing and budget.</p>
          {checklist(["Photos and a clear explanation of what we found", "Repair options where they apply — the best fix vs. a budget fix", "An itemized estimate for labor and materials", "A realistic timeline and what to expect on install day"])}
        </div>
        <figure class="stack-img"><img src="assets/img/roofing-new-shingles-aerial.jpg" alt="Aerial view of a newly shingled roof" width="1120" height="1400" loading="lazy"></figure>
      </div>
    </section>

    <section class="section" aria-labelledby="during-title">
      <div class="container">
{section_head("During the project", 'Professional work. <span class="accent">Clean results. Zero stress.</span>')}        <ul class="features features--grid">{during_html}</ul>
      </div>
    </section>
'''
    body += cta_band("Start with step one.", "Tell us what you need — it takes two minutes.")
    return layout("process.html", "How It Works | Castro Finish Carpentry — Cape Cod",
                  "How Castro's free estimates and projects work: quick follow-up, on-site check, itemized quote, protected home, daily cleanup and a final walkthrough.",
                  "process", body, preload="deck-cable-railing.jpg")


REVIEWS = [
    # (name, initials, project, short excerpt from their Google review)
    ("David DiCicco", "DD", "Roof, roof deck &amp; bathroom", "Attention to detail at its finest! … Their work is second to none."),
    ("Susan Savage", "SS", "Bay window &amp; siding", "The Castro crew is punctual, clean and respectful to both home and home owner."),
    ("Samantha Keller", "SK", "Exterior &amp; interior project · Provincetown", "Start to finish - they were simply fantastic!!"),
    ("R P", "RP", "Home renovation", "Extremely professional, honest and did excellent work at a fair price."),
    ("Katherine Dow", "KD", "Deck", "Great focus on detail and beautiful finish work."),
    ("Kathi DelloRusso", "KD", "Porch enclosure", "…so happy with the workmanship and the final result of the porch enclosure."),
    ("Dan DePompei", "DP", "Interior staircase", "Estevam and his staff are creative, communicative and competitive."),
    ("Barbara Walsh", "BW", "Google review", "Steven and his team are true professionals."),
    ("Scott Lysko", "SL", "Google review", "Professional and courteous every step of the way."),
    ("Diana Daley", "DD", "Basement refinish", "Their customer service is exceptional."),
    ("Kate Tracey", "KT", "Inside &amp; outside renovation", "The experience was outstanding."),
    ("Kara Jordan", "KJ", "Custom woodworking", "I couldn't be more pleased with the results."),
]


def review_card(name, ini, meta, text):
    t = f'<blockquote class="review__text"><p>“{text}”</p></blockquote>'
    return f'''          <figure class="review review--bordered">
            <div class="review__top"><span class="avatar" aria-hidden="true">{ini}</span><div><p class="review__name">{name}</p><p class="review__meta">{meta}</p></div></div>
            <p class="stars" aria-label="5 out of 5 stars">★★★★★</p>
            {t}
          </figure>
'''


def reviews_page():
    cards = "".join(review_card(*r) for r in REVIEWS)
    body = page_hero([("reviews.html", "Reviews")], "Reviews",
                     'What Cape Cod homeowners <span class="page-hero__accent">are saying.</span>',
                     "5.0 stars across 61 Google reviews — from single repairs to full exterior projects.",
                     "siding-white-colonial.jpg", "White shingle colonial with black shutters", ctas=False)
    body += f'''
    <section class="section" aria-labelledby="rev-title">
      <div class="container">
        <div class="rating-card">
          <div>
            <p class="rating-card__num">5.0</p>
            <p class="stars stars--lg" aria-label="5 out of 5 stars">★★★★★</p>
            <p class="rating-card__sub">Based on 61 Google reviews</p>
          </div>
          <div class="rating-card__copy">
            <h2 id="rev-title" class="h3">Real projects. Real neighbors.</h2>
            <p>Every review comes from a homeowner we've worked with. Read them all on Google, or leave one if we've worked together.</p>
            <div class="row-btns">
              <a class="btn btn--primary" href="{GOOGLE_REVIEWS}" target="_blank" rel="noopener">Read all on Google {ARROW}</a>
              <a class="btn btn--outline" href="{GOOGLE_WRITE}" target="_blank" rel="noopener">Leave a review</a>
            </div>
          </div>
        </div>

        <div class="reviews__grid reviews__grid--page">
{cards}        </div>
      </div>
    </section>
'''
    body += cta_band("Join our happy homeowners.")
    return layout("reviews.html", "Reviews | Castro Finish Carpentry — 5.0 on Google",
                  "Castro Finish Carpentry is rated 5.0 stars across 61 Google reviews by Cape Cod homeowners.",
                  "reviews", body, preload="siding-white-colonial.jpg")


def financing_page():
    body = page_hero([("financing.html", "Financing")], "Project financing available",
                     'Get it done now. <span class="page-hero__accent">Pay over time.</span>',
                     "Don't put off the repair or upgrade your home needs. Ask about affordable monthly plans when you request your estimate.",
                     "roofing-drone.jpg", "Aerial view of a Cape Cod home with a new roof")
    body += f'''
    <section class="section" aria-labelledby="fin-title">
      <div class="container split">
        <div class="split__copy">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Why finance</p>
          <h2 id="fin-title" class="h2">Fix it before <span class="accent">it gets worse.</span></h2>
          <div class="prose">
            <p>Rot, leaks and storm damage don't wait for the right time — they only get worse. Financing lets you take care of the work now and spread the cost into predictable monthly payments.</p>
          </div>
          {checklist(["Check your options without affecting your credit score", "Fast approval — funds available in as little as 24 hours", "Affordable monthly payments", "No prepayment penalties"])}
          <!-- TODO: add lender name, application link and required disclosures -->
        </div>
        <figure class="stack-img"><img src="assets/img/deck-black-railing.jpg" alt="Grey deck with black railing and new stairs" width="1050" height="1400" loading="lazy"></figure>
      </div>
    </section>

    <section class="section section--warm process" aria-labelledby="fin-steps">
      <div class="container">
{section_head("How it works", 'Simple from <span class="accent">start to finish.</span>')}        <ol class="steps steps--3">
          <li class="step"><span class="step__num">01</span><h3 class="step__title">Get your estimate</h3><p>We visit and give you a clear, itemized quote.</p></li>
          <li class="step"><span class="step__num">02</span><h3 class="step__title">Check your options</h3><p>Ask us about financing and see what plans are available to you.</p></li>
          <li class="step"><span class="step__num">03</span><h3 class="step__title">Start your project</h3><p>Once approved, we get you on the schedule.</p></li>
        </ol>
      </div>
    </section>

    <section class="section faq" aria-labelledby="fin-faq">
      <div class="container faq__inner">
        <header class="section-head section-head--center">
          <p class="eyebrow eyebrow--center"><span class="eyebrow__line" aria-hidden="true"></span>FAQ<span class="eyebrow__line" aria-hidden="true"></span></p>
          <h2 id="fin-faq" class="h2">Financing <span class="accent">questions.</span></h2>
        </header>
{faq_list([
    ("Will checking my options affect my credit score?", "No — you can check your options without affecting your credit score."),
    ("How fast is approval?", "Approval is fast, and funds can be available in as little as 24 hours."),
    ("Can I pay it off early?", "Yes. There are no prepayment penalties."),
    ("How do I get started?", "Request a free estimate and mention you're interested in financing. We'll walk you through the next steps."),
])}      </div>
    </section>
'''
    body += cta_band("Ask about financing with your free estimate.")
    return layout("financing.html", "Financing | Castro Finish Carpentry — Cape Cod",
                  "Project financing for trim, siding, deck, window and roofing work on Cape Cod. Check options without affecting your credit, fast approval, no prepayment penalties.",
                  "financing", body, preload="roofing-drone.jpg")


def faq_page():
    general = [
        ("Do you offer free estimates?", "Yes. We provide free on-site estimates, and every quote is itemized so you can see exactly what's included."),
        ("Which towns do you serve?", "We're based in Sandwich, MA and work across Cape Cod — from the Upper Cape to Provincetown. Tell us your town or ZIP and we'll confirm."),
        ("Are you licensed and insured?", "Yes — licensed (HIC/CSL) and insured in Massachusetts, and BBB accredited. A certificate of insurance is available on request."),
        ("Do you repair, or only replace?", "Both. If a repair will hold up, we'll recommend it. If replacement is the safer long-term fix, we'll explain why."),
        ("How long will my project take?", "It depends on scope. After the site visit you'll get a realistic timeline in writing."),
        ("Do you offer financing?", "Yes. Ask about it with your estimate, or see our <a href=\"financing.html\">financing page</a>."),
        ("Do you offer a warranty?", "Yes, a workmanship warranty. Terms depend on scope and materials and are explained in writing."),
    ]
    groups = [("general", "General", general)] + [(s["slug"], s["short"], s["faq"]) for s in SERVICES]
    tabs = "".join(f'<li><a href="#faq-{k}">{label}</a></li>' for k, label, _ in groups)
    blocks = ""
    for k, label, items in groups:
        more = "" if k == "general" else f'<a class="faq-group__more" href="{k}.html">{label} services {ARROW}</a>'
        blocks += f'''        <section class="faq-group" id="faq-{k}" aria-labelledby="faq-{k}-h">
          <div class="faq-group__head"><h2 id="faq-{k}-h" class="h3">{label}</h2>{more}</div>
{faq_list(items, first_open=False)}        </section>
'''
    body = page_hero([("faq.html", "FAQ")], "FAQ",
                     'Common questions <span class="page-hero__accent">before you call.</span>',
                     "Straight answers about estimates, scheduling, materials and each of our services.",
                     "siding-cedar-gable.jpg", "New cedar shingle siding on a gable", ctas=False)
    body += f'''
    <section class="section faq" aria-label="Frequently asked questions">
      <div class="container faq-layout">
        <nav class="faq-nav" aria-label="FAQ topics"><ul>{tabs}</ul></nav>
        <div class="faq-groups">
{blocks}        </div>
      </div>
    </section>
'''
    body += cta_band("Still have a question?", "Call us or send a message — we'll get back to you quickly.")
    return layout("faq.html", "FAQ | Castro Finish Carpentry — Cape Cod",
                  "Answers about free estimates, service area, licensing, financing, and our trim, siding, deck, window, door and roofing work on Cape Cod.",
                  "faq", body, preload="siding-cedar-gable.jpg")


def contact_page(form_html):
    body = page_hero([("contact.html", "Contact")], "Free estimate",
                     'Tell us about <span class="page-hero__accent">your project.</span>',
                     "Share what you need and where the project is located. We'll follow up quickly with next steps.",
                     "hero-cape-house.jpg", "Cape Cod home with a new roof and porch", ctas=False)
    body += f'''
    <section class="section" aria-label="Contact form and details">
      <div class="container contact-layout">
        <div class="contact-side">
          <h2 class="h3">Prefer to talk?</h2>
          <ul class="contact-cards">
            <li><a class="contact-card" href="{TEL}">{ico("phone", "contact-card__ico")}<span><strong>Call now</strong>{PHONE}</span></a></li>
            <li><a class="contact-card" href="mailto:{EMAIL}">{ico("mail", "contact-card__ico")}<span><strong>Email us</strong>{EMAIL}</span></a></li>
            <li><a class="contact-card" href="{MAPS}" target="_blank" rel="noopener">{ico("pin", "contact-card__ico")}<span><strong>Visit</strong>{ADDRESS}</span></a></li>
            <li><a class="contact-card" href="{INSTAGRAM}" target="_blank" rel="noopener">{ico("insta", "contact-card__ico")}<span><strong>Instagram</strong>@castrocarpentry2024</span></a></li>
          </ul>
          <div class="mini-steps">
            <h2 class="h3">What happens next</h2>
            <ol class="vsteps vsteps--compact">
              <li class="vstep"><span class="vstep__num">01</span><div><h3>Quick follow-up</h3><p>We reach out to ask the right questions.</p></div></li>
              <li class="vstep"><span class="vstep__num">02</span><div><h3>On-site check</h3><p>When needed, we come take a look.</p></div></li>
              <li class="vstep"><span class="vstep__num">03</span><div><h3>Clear quote</h3><p>Itemized estimate and next steps.</p></div></li>
            </ol>
          </div>
        </div>
        <div class="contact-form">
{form_html}
        </div>
      </div>
    </section>

    <section class="map" aria-label="Map">
      <iframe title="Map showing Castro Finish Carpentry in Sandwich, MA" src="https://www.google.com/maps?q=Castro+Finish+Carpentry+Inc,+15+Jan+Sebastian+Dr+Unit+4,+Sandwich,+MA+02563&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </section>
'''
    return layout("contact.html", "Contact & Free Estimate | Castro Finish Carpentry — Cape Cod",
                  f"Request a free estimate for trim, siding, decks, windows and doors, or roofing repairs on Cape Cod. Call {PHONE}.",
                  "contact", body, preload="hero-cape-house.jpg")


def home_page():
    body = (PAGES / "home.html").read_text()
    return layout("index.html", "Castro Finish Carpentry | Finish Carpentry & Home Repairs on Cape Cod",
                  "Trim, siding, decks, windows and doors, and roofing repairs across Cape Cod. Clear itemized estimates, clean job sites, fast communication. Licensed & insured in MA.",
                  "home", body, preload="hero-cape-house.jpg")


def main():
    home = (PAGES / "home.html").read_text()
    form = re.search(r'<form class="form".*?</form>', home, re.S).group(0)
    out = {
        "index.html": home_page(),
        "services.html": services_page(),
        "about.html": about_page(),
        "process.html": process_page(),
        "reviews.html": reviews_page(),
        "financing.html": financing_page(),
        "faq.html": faq_page(),
        "contact.html": contact_page("          " + form),
    }
    for s in SERVICES:
        out[f'{s["slug"]}.html'] = service_page(s)
    for name, html in out.items():
        (ROOT / name).write_text(html)
    print(f"Built {len(out)} pages: " + ", ".join(out))


if __name__ == "__main__":
    main()
