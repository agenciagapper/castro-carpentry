#!/usr/bin/env python3
"""
Castro Finish Carpentry: static site builder.

Every page shares one header, footer and icon set, defined here once.
Edit content in this file (or in _build/pages/home.html for the homepage),
then run:

    python3 _build/build.py

It writes clean-URL pages (folder/index.html) to the project root, plus
sitemap.xml, robots.txt, 404.html and .htaccess. The repo root is what
Hostinger serves; _build/ is blocked by .htaccess.
"""
import json
import sys
import re
import shutil
from datetime import date
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
BUILD = Path(__file__).resolve().parent
PAGES = BUILD / "pages"
IMG_SRC = BUILD / "img-src"
IMG_OUT = ROOT / "assets" / "img"

SITE = "https://castrocarpentryinc.com"   # canonical: https, no www, trailing slash
BUSINESS = "Castro Finish Carpentry"
PHONE = "(508) 566-1618"
TEL = "tel:+15085661618"
EMAIL = "ecastrocarpentry@gmail.com"
# NAP matches the Google Business Profile (pin: 41.7187514, -70.4833347, Sandwich Industrial Park).
STREET = "15 Jan Sebastian Dr, Unit 4"
CITY = "Sandwich"
ZIP = "02563"
ADDRESS = f"{STREET}, {CITY}, MA {ZIP}"
REVIEW_COUNT = 61          # keep in sync with the Google Business Profile
RATING = "5.0"
MAPS = "https://maps.app.goo.gl/t4gNrfsZBs1kw5et7"  # Google Business Profile
GEO = (41.7187514, -70.4833347)
ENHANCIFY_PAGE = "9933241"  # financing widget id (from the old site)
MAP_Q = "Castro+Finish+Carpentry+Inc,+" + ADDRESS.replace(",", "").replace(" ", "+")

# Tracking — leave empty until the IDs exist. Tags load only on PROD_HOSTS.
TRACKING = {
    "ga4": "",            # e.g. G-XXXXXXX
    "ads": "",            # e.g. AW-123456789
    "ads_lead_label": "", # Google Ads conversion label for the estimate form
    "meta_pixel": "",     # e.g. 1234567890
    "prod_hosts": ["castrocarpentryinc.com", "www.castrocarpentryinc.com"],
}

# Clean URLs. Old WordPress slugs are kept so existing links and rankings carry over.
URLS = {
    "index": "/",
    "services": "/services/",
    "trim": "/trim/",
    "siding": "/siding/",
    "decks": "/decking/",
    "windows-doors": "/windows-and-doors/",
    "roofing": "/roofing/",
    "adu": "/adu/",
    "about": "/about-us/",
    "contact": "/contact-us/",
    "financing": "/financing-options/",
    "process": "/process/",
    "reviews": "/reviews/",
    "faq": "/faq/",
    "areas": "/service-areas/",
    "blog": "/blog/",
    "privacy": "/terms-of-service-privacy-policy/",
    "thanks": "/thank-you/",
}


def url(key):
    return URLS[key]
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
        "title": "Exterior Trim Repair on Cape Cod",
        "h1": "Exterior trim repair, <span class=\"page-hero__accent\">done right at the edges.</span>",
        "lead": "Rot repair, fascia and soffits, corner boards and window trim, with clean lines, tight joints and a clear estimate. Free on-site visit.",
        "img": "siding-cedar-balcony.jpg",
        "img_alt": "Cedar shingle wall with balcony and fresh exterior trim",
        "img2": "siding-white-colonial.jpg",
        "img2_alt": "White colonial with crisp window trim and black shutters",
        "summary": "Repairs, replacement and detailed finishing inside and out. Straight lines, tight joints, clean transitions, and hidden rot fixed before we close up.",
        "why_title": "Trim is your home's <span class=\"accent\">first line of defense.</span>",
        "why": [
            "On a Cape Cod house, trim takes the first hit from wind-driven rain and salt air. Leaks start at the corners, seams and transitions. Once moisture gets behind a board, it slowly softens the wood and framing underneath.",
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
            ("Rot-first repairs", "We fix hidden damage before anything gets closed up."),
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
        "gallery": [
            ("plymouth-church-siding-gable.jpg", "Rake and corner trim on new siding, Plymouth"),
            ("truro-door-casing.jpg", "New door casing in a Truro renovation"),
            ("truro-built-in-shelves.jpg", "Interior finish carpentry: built-in shelving, Truro"),
        ],
        "warning": ("Trim problems spread fast", "Watch for peeling paint, dark staining, soft spots, and gaps at corners or rooflines. Catching it early usually means a smaller, simpler repair."),
        "faq": [
            ("Do you offer free on-site trim estimates?", "Yes. We visit, inspect fascia, soffits, corners and windows, and give you an itemized scope and estimate."),
            ("Do you do repairs, or only full replacement?", "Both. We repair what's still sound and replace when that's the safer long-term fix. Either way, we'll explain why."),
            ("What trim materials do you use?", "Common exterior materials used on the Cape, including wood and PVC. We recommend based on exposure, budget and look."),
            ("Do you repair fascia and soffits too?", "Yes. They're some of the most common failure points in coastal weather."),
            ("How long does a trim project take?", "It depends on how many areas need work and whether there's hidden rot. You'll get a timeline after the visit."),
        ],
    },
    {
        "slug": "siding",
        "name": "Siding repair & installation",
        "short": "Siding",
        "title": "Siding Contractor on Cape Cod, MA",
        "h1": "Siding repair &amp; installation <span class=\"page-hero__accent\">built for Cape Cod weather.</span>",
        "lead": "Cedar shingle, vinyl and fiber cement siding, repaired or replaced as a full wall system with rot fixed properly and a clean finish. Free on-site estimate.",
        "img": "siding-cedar-gable.jpg",
        "img_alt": "New cedar shingle siding on a gable end",
        "img2": "siding-cedar-balcony.jpg",
        "img2_alt": "Cedar shingle siding around a balcony and windows",
        "gallery": [
            ("plymouth-church-siding-gable.jpg", "New siding on a church gable, Plymouth"),
            ("plymouth-church-siding-corner.jpg", "Siding and corner details going on, Plymouth"),
            ("plymouth-church-gable-housewrap.jpg", "Housewrap installed before the new siding"),
            ("cedar-cottage-exterior.jpg", "Cedar shingle cottage on Cape Cod"),
        ],
        "summary": "Cracked, loose or warped sections replaced with proper flashing and sealing, plus rot repair around trim and corners.",
        "why_title": "Siding is a system. <span class=\"accent\">Every layer matters.</span>",
        "why": [
            "Behind every good siding job is solid backing, insulation where it applies, a weather-resistive barrier, and clean transitions at every window, door, corner and trim line.",
            "We repair the weak points, rebuild the transitions, and seal the details, so water stays out and the wall looks sharp for years.",
        ],
        "points": [
            "Stops water intrusion at the source",
            "Rot repaired properly before it spreads",
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
            ("Rot addressed the right way", "Soft backing or sheathing is repaired before new siding goes on."),
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
            ("What types of siding do you work with?", "Cedar shingle, vinyl and fiber cement, plus the trim, fascia and soffits around them."),
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
        "title": "Deck Builder on Cape Cod, MA",
        "h1": "Cape Cod deck builder: <span class=\"page-hero__accent\">solid, safe and finished.</span>",
        "lead": "New builds, rebuilds, board replacement, railings, stairs and refinishing in wood or composite, framed accurately and fastened tight.",
        "img": "deck-cable-railing.jpg",
        "img_alt": "Composite deck with black cable railing in the pines",
        "img2": "deck-black-railing.jpg",
        "img2_alt": "Grey deck with black railing and new stairs",
        "gallery": [
            ("chatham-deck-railing.jpg", "Second-floor deck and railing, Chatham"),
            ("deck-cable-railing.jpg", "Composite deck with black cable railing"),
            ("deck-black-railing.jpg", "Grey deck with black railing and new stairs"),
        ],
        "summary": "New builds, rebuilds, board replacement, railings, stairs and refinishing in wood or composite, framed square and fastened tight.",
        "why_title": "Built right from <span class=\"accent\">the framing up.</span>",
        "why": [
            "A great deck starts underneath. We focus on framing accuracy, water management and proper fastening, so the surface stays flat and tight without wobble, bounce or squeaks.",
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
            ("Railings", "Wood, composite, black metal or cable, built safe and straight."),
            ("Stairs", "New or rebuilt stairs with proper rise, run and support."),
            ("Refinishing", "Cleaning, repairs and refinishing to bring a tired deck back."),
        ],
        "diff_title": "Our deck process",
        "diff": [
            ("On-site assessment", "We check the structure, the boards, railings and stairs."),
            ("Measurements & layout", "Planned around your space, access and drainage."),
            ("Material guidance", "Wood vs. composite: look, maintenance and budget compared."),
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
            ("Do you build new decks or only repair?", "Both. We do new builds, full rebuilds, repairs and upgrades."),
            ("Can you replace boards without rebuilding the frame?", "Sometimes. If the framing is solid, we can replace boards only. We'll check and tell you honestly."),
            ("Wood or composite?", "We build with both and will walk you through the trade-offs in look, maintenance and budget."),
            ("How do you prevent wobble, bounce and squeaks?", "Careful layout, accurate framing and proper fastening."),
            ("Do you build stairs and railings?", "Yes, new and replacement stairs and railings, built safe and straight."),
        ],
    },
    {
        "slug": "windows-doors",
        "name": "Windows & doors",
        "short": "Windows & Doors",
        "title": "Window & Door Replacement on Cape Cod",
        "h1": "Window &amp; door installation, <span class=\"page-hero__accent\">done as a system.</span>",
        "lead": "Installation and replacement with tight seals, smooth operation and water protection at every edge, finished with clean trim.",
        "img": "siding-white-colonial.jpg",
        "img_alt": "Colonial home with new windows and black shutters",
        "img2": "siding-cedar-gable.jpg",
        "img2_alt": "Cedar gable with new windows and trim",
        "gallery": [
            ("plymouth-church-window-trim.jpg", "New window with trim and flashing, Plymouth"),
            ("plymouth-church-gable-housewrap.jpg", "Windows installed and wrapped before siding"),
            ("truro-door-casing.jpg", "Interior door opening and casing, Truro"),
        ],
        "summary": "Windows and doors installed as a system: flashing, sealing, and square, level framing to stop drafts and leaks, finished with clean trim.",
        "why_title": "A window is only as good <span class=\"accent\">as its install.</span>",
        "why": [
            "Most drafts and leaks around windows and doors come from how they were installed. We treat every opening as a system: framing checks, flashing, sealing and insulation, then clean trim transitions.",
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
            ("Do you repair windows and doors or only replace them?", "Both, whichever makes the most sense for each unit."),
            ("Can you replace a single window or door?", "Yes, and we can match the existing style and size."),
            ("What types do you install?", "Double-hung, casement, sliders, picture windows, entry doors and sliding patio doors."),
            ("I have drafts or water around a window. Can you fix it?", "Yes. We install every opening as a system: flashing, sealing, insulation and clean trim transitions."),
            ("Do you repair the trim around windows?", "Yes, trim repair and finishing are part of what we do."),
        ],
    },
    {
        "slug": "roofing",
        "name": "Roofing repairs",
        "short": "Roofing",
        "title": "Roof Repair on Cape Cod, MA",
        "h1": "Roof repair that stops leaks <span class=\"page-hero__accent\">at the source.</span>",
        "lead": "Leak detection, chimney and skylight flashing, storm damage and shingle repairs, with photos, clear options and an itemized estimate.",
        "img": "roofing-drone.jpg",
        "img_alt": "Aerial view of a Cape Cod home with a new roof",
        "img2": "roofing-install-aerial.jpg",
        "img2_alt": "Castro crew installing new shingles",
        "gallery": [
            ("plymouth-church-roofing.jpg", "Roofing crew at work, Plymouth"),
            ("plymouth-church-ice-water-shield.jpg", "Ice and water membrane at the eaves before shingles"),
            ("aerial-roof-chimney.jpg", "Finished roof with chimney and skylight"),
            ("roofing-new-shingles-aerial.jpg", "New architectural shingles from above"),
        ],
        "summary": "Leaks stopped at the source: damaged shingles, flashing at chimneys, skylights and valleys, storm repairs and preventive fixes.",
        "why_title": "A quick patch vs. <span class=\"accent\">a proper repair.</span>",
        "why": [
            "Most leaks start at flashing, valleys, edges and tie-ins, rarely in the middle of the roof. A quick patch covers the symptom. We trace where the water gets in and rebuild the detail that failed.",
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
            ("How fast can you respond to an active leak?", "We prioritize active leaks when we can. Timing depends on weather and schedule, and we'll set the soonest available visit."),
            ("Will the repair match my existing shingles?", "When possible. Otherwise we'll show you the closest option."),
            ("Can you help with an insurance claim?", "We provide photos and documentation. You work with your insurer on approvals and coverage."),
        ],
    },
    {
        "slug": "adu",
        "name": "ADUs &amp; garage conversions",
        "short": "ADUs",
        "title": "ADU Builder on Cape Cod, MA",
        "h1": "ADU construction &amp; garage conversions <span class=\"page-hero__accent\">on Cape Cod.</span>",
        "lead": "Turn unused space into a fully independent living unit: garage conversions, in-law suites and backyard cottages, with a clear estimate and a finish you'll be proud of.",
        "img": "cedar-cottage-exterior.jpg",
        "img_alt": "Small cedar shingle cottage on Cape Cod",
        "img2": "cottage-interior-finish.jpg",
        "img2_alt": "Cottage interior with new windows and finished walls",
        "gallery": [
            ("cedar-cottage-exterior.jpg", "Cedar shingle cottage on Cape Cod"),
            ("cottage-interior-finish.jpg", "Interior finish work inside the cottage"),
            ("cottage-bathroom.jpg", "New bathroom with vanity in the cottage"),
        ],
        "summary": "Garage conversions, in-law suites, attached additions and backyard cottages, now allowed by right in most Massachusetts single-family zones.",
        "why_title": "What is an ADU, <span class=\"accent\">and why now?</span>",
        "why": [
            "An Accessory Dwelling Unit (ADU) is a small, independent home on the same lot as your main house, with its own kitchen, bathroom and entrance. It works for aging parents, adult children, guests or long-term rental income.",
            "Since February 2025, Massachusetts law allows one ADU by right in single-family zoning districts. A building permit and code compliance are still required, and towns can set local rules on things like setbacks and parking.",
        ],
        "points": [
            "Up to 900 sq ft, or half the size of the main home, whichever is smaller",
            "No special permit required in single-family zones",
            "No owner-occupancy requirement under state law",
            "Building permit and code compliance still required",
        ],
        "handle_title": "ADU options we build",
        "handle": [
            ("Garage conversions", "Your garage already has a foundation, walls and a roof. We turn it into warm living space: insulation, framing, windows, doors, flooring and interior finish."),
            ("In-law suites", "A private space inside your existing home, including basement or attic units, for family who want to stay close."),
            ("Attached additions", "A connected unit with its own entrance, built to match your home's style."),
            ("Detached backyard cottages", "A standalone home on your lot, designed to fit the Cape Cod look and handle Cape Cod weather."),
        ],
        "diff_title": "The Castro Standard for ADUs",
        "diff": [
            ("Finish-carpentry detail", "Solid framing, proper flashing and sealing, tight trim lines and openings set square."),
            ("Licensed trades coordinated", "Plumbing, electrical and HVAC handled by licensed trades, coordinated by us."),
            ("One team, start to finish", "One point of contact managing the job, with a clean site and fast communication."),
            ("Rental income or family space", "Planned around how you'll use it: renting, family close by, or more room for your own home."),
        ],
        "steps_title": "How an ADU project works",
        "steps": [
            ("Free consultation", "We visit, look at your space and talk through the options."),
            ("Clear, itemized estimate", "Straightforward scope and pricing, so you know what to expect."),
            ("Permits & planning", "We help you through the building permit process with your town."),
            ("Construction", "Organized job site, daily cleanup and regular updates."),
            ("Final walkthrough", "We don't finish until every detail looks right."),
        ],
        "warning": ("Septic comes up early on the Cape", "Many Cape Cod homes use septic systems, and adding a bedroom may require a septic review or upgrade. We talk this through at the first visit, so there are no surprises."),
        "faq": [
            ("Do I need a special permit to build an ADU in Massachusetts?", "In most single-family zoning districts, no. ADUs up to 900 sq ft are allowed by right. You'll still need a building permit, and your town may have local rules on things like setbacks and parking."),
            ("How big can my ADU be?", "Up to 900 sq ft or half the size of your main home, whichever is smaller."),
            ("Can I rent out my ADU?", "In general, yes. State law doesn't require the owner to live on the property. Some towns limit short-term rentals, so check your town's rules."),
            ("What about septic on Cape Cod?", "Adding a bedroom may require a septic review or upgrade. We'll talk through this early, so there are no surprises."),
            ("How long does an ADU project take?", "It depends on the type of ADU and the permit timeline in your town. You'll get a clear schedule with your estimate."),
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
    ("reviews.html", "Reviews", "reviews"),
    ("financing.html", "Financing", "financing"),
    ("faq.html", "FAQ", "faq"),
    ("blog.html", "Blog", "blog"),
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
    from cities import CITIES
    svc_links = "\n          ".join(f'<li><a href="{s["slug"]}.html">{s["name"]}</a></li>' for s in SERVICES)
    area_links = " ".join(f'<a href="{city_path(c)}">{c["label"]}</a>' for c in CITIES)
    return f'''
  <footer class="footer">
    <div class="container footer__grid">
      <div class="footer__brand">
        <img src="assets/logos/logo-castro-azul-adesivo-400.png" alt="Castro Carpentry logo" width="96" height="97">
        <p class="footer__quote">“We don't just build with wood. We build with values.”</p>
        <p class="footer__sig">Estevam Castro, founder</p>
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
          <li><a href="areas.html">Service areas</a></li>
          <li><a href="blog.html">Blog</a></li>
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
    <nav class="container footer__areas" aria-label="Service areas">
      <a href="areas.html"><strong>Service areas:</strong></a>
      {area_links}
    </nav>
    <div class="container footer__bottom">
      <p>© <span id="year">2026</span> Castro Finish Carpentry Inc · Licensed &amp; insured in MA · BBB accredited · <a href="privacy.html">Privacy &amp; terms</a></p>
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

BIZ_ID = f"{SITE}/#business"
TOWNS_SERVED = ["Sandwich", "Bourne", "Falmouth", "Mashpee", "Barnstable", "Yarmouth", "Dennis", "Brewster",
                "Harwich", "Chatham", "Orleans", "Eastham", "Wellfleet", "Truro", "Provincetown", "Plymouth"]

BUSINESS_LD = {
    "@type": "HomeAndConstructionBusiness",
    "@id": BIZ_ID,
    "name": BUSINESS,
    "legalName": "Castro Finish Carpentry Inc",
    "url": f"{SITE}/",
    "logo": f"{SITE}/assets/logos/logo-castro-azul-400.png",
    "image": f"{SITE}/assets/img/og-image.jpg",
    "telephone": "+1-508-566-1618",
    "email": EMAIL,
    "address": {"@type": "PostalAddress", "streetAddress": STREET, "addressLocality": CITY,
                "addressRegion": "MA", "postalCode": ZIP, "addressCountry": "US"},
    "areaServed": [{"@type": "City", "name": f"{t}, MA"} for t in TOWNS_SERVED]
                  + [{"@type": "Place", "name": "Cape Cod, MA"}],
    "geo": {"@type": "GeoCoordinates", "latitude": GEO[0], "longitude": GEO[1]},
    "hasMap": MAPS,
    "founder": {"@type": "Person", "name": "Estevam Castro"},
    "foundingDate": "2013",
    "sameAs": [INSTAGRAM],
}

LEAD_HTML = f'''<!-- Generated by _build/build.py: edit content there (homepage body: _build/pages/home.html), then run: python3 _build/build.py -->'''


def breadcrumb_ld(crumbs):
    """crumbs: list of (path, name), home first."""
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i, "name": re.sub("<[^>]+>", "", n).replace("&amp;", "&"), "item": SITE + p}
        for i, (p, n) in enumerate(crumbs, 1)]}


def faq_ld(items):
    clean = lambda t: re.sub(r"<[^>]+>", "", t).replace("&amp;", "&")
    return {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": clean(q), "acceptedAnswer": {"@type": "Answer", "text": clean(a)}}
        for q, a in items]}


def tracking_head():
    t = TRACKING
    if not (t["ga4"] or t["ads"] or t["meta_pixel"]):
        return ""
    cfg = json.dumps({k: t[k] for k in ("ga4", "ads", "ads_lead_label", "meta_pixel", "prod_hosts")})
    return f'''
  <script>window.CASTRO_TRACKING={cfg};</script>
  <script src="/js/tracking.js" defer></script>'''


def layout(path, title, description, active, body, preload=None, schema=None, noindex=False, og_type="website"):
    """path: the page's clean URL ("/trim/"). schema: list of JSON-LD nodes for this page."""
    canonical = SITE + path
    pre = ""
    if preload:
        stem = Path(preload).stem
        pre = (f'\n  <link rel="preload" as="image" href="/assets/img/{stem}.webp" '
               f'imagesrcset="/assets/img/{stem}-800.webp 800w, /assets/img/{stem}.webp 1600w" imagesizes="100vw" fetchpriority="high">')
    graph = [BUSINESS_LD] + (schema or [])
    ld = '\n  <script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False) + "</script>"
    robots = '\n  <meta name="robots" content="noindex, follow">' if noindex else ""
    canon = "" if noindex else f'\n  <link rel="canonical" href="{canonical}">'
    t, d = escape(title, quote=True), escape(description, quote=True)
    html = f'''<!DOCTYPE html>
{LEAD_HTML}
<html lang="en-US">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{t}</title>
  <meta name="description" content="{d}">{robots}{canon}
  <meta name="theme-color" content="#004d93">
  <meta property="og:site_name" content="{BUSINESS}">
  <meta property="og:locale" content="en_US">
  <meta property="og:type" content="{og_type}">
  <meta property="og:title" content="{t}">
  <meta property="og:description" content="{d}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{SITE}/assets/img/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/logos/icon-192.png">
  <link rel="apple-touch-icon" href="/assets/logos/apple-touch-icon.png">
  <link rel="preload" href="/assets/fonts/Jost-Variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/Poppins-Regular.woff2" as="font" type="font/woff2" crossorigin>{pre}
  <link rel="stylesheet" href="/css/styles.css">{ld}{tracking_head()}
</head>
<body>
{header(active)}
  <main id="main">
{body}
  </main>
{footer()}{SPRITE}
  <script src="/js/main.js" defer></script>
</body>
</html>
'''
    return finalize(html)


# --------------------------------------------------------------------------
# Post-processing: clean links, absolute asset paths, responsive WebP images
# --------------------------------------------------------------------------
IMG_SIZES = {}  # stem -> (w, h) of the 1600px version, filled by build_images()


def _img(m):
    tag = m.group(0)
    src = re.search(r'src="/assets/img/([\w-]+)\.jpg"', tag)
    if not src:
        return tag
    stem = src.group(1)
    big = "hero__bg" in tag or "page-hero__bg" in tag
    sizes = "100vw" if big else "(max-width: 760px) 100vw, 50vw"
    new = (f'src="/assets/img/{stem}.webp" srcset="/assets/img/{stem}-800.webp 800w, '
           f'/assets/img/{stem}.webp 1600w" sizes="{sizes}"')
    tag = tag.replace(src.group(0), new)
    if stem in IMG_SIZES:  # true intrinsic size keeps the aspect ratio honest (no CLS)
        w, h = IMG_SIZES[stem]
        tag = re.sub(r'width="\d+"', f'width="{w}"', tag)
        tag = re.sub(r'height="\d+"', f'height="{h}"', tag)
    return tag


def finalize(html):
    keys = "|".join(sorted((re.escape(k) for k in URLS), key=len, reverse=True))
    html = re.sub(rf'href="({keys})\.html(#[^"]*)?"', lambda m: f'href="{URLS[m.group(1)]}{m.group(2) or ""}"', html)
    html = re.sub(r'(src|href)="(assets|css|js)/', r'\1="/\2/', html)
    html = re.sub(r"<img\b[^>]*>", _img, html)
    return html


# --------------------------------------------------------------------------
# Shared blocks
# --------------------------------------------------------------------------
def page_hero(crumbs, eyebrow, h1, lead, img, img_alt, ctas=True, cta_href="contact.html"):
    trail = ['<li><a href="index.html">Home</a></li>']
    for href, label in crumbs[:-1]:
        trail.append(f'<li><a href="{href}">{label}</a></li>')
    trail.append(f'<li aria-current="page">{crumbs[-1][1]}</li>')
    buttons = f'''
          <div class="hero__ctas">
            <a class="btn btn--primary btn--lg" href="{cta_href}">Get a free estimate {ARROW}</a>
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
SERVICE_DESC = {
    "trim": f"Exterior trim repair on Cape Cod: rotted fascia, soffits, corner boards and window trim fixed with tight joints. Free on-site estimate: {PHONE}.",
    "siding": f"Cedar shingle, vinyl and fiber cement siding repaired or replaced on Cape Cod, with hidden rot fixed properly. Free itemized estimate: {PHONE}.",
    "decks": f"Cape Cod deck builder: new decks, rebuilds, board replacement, railings and stairs in wood or composite. Free on-site estimate: {PHONE}.",
    "windows-doors": f"Window and door installation and replacement on Cape Cod, flashed and sealed as a system with clean trim. Free estimate: {PHONE}.",
    "roofing": f"Roof repair on Cape Cod: leaks traced to the source, chimney and skylight flashing, storm damage and shingles. Free estimate: {PHONE}.",
    "adu": f"ADU builder on Cape Cod: garage conversions, in-law suites and backyard cottages, now allowed by right in Massachusetts. Free estimate: {PHONE}.",
}


def city_path(c):
    return f'{url("areas")}{c["slug"]}/'


def gallery(items, title, eyebrow="Recent work"):
    if not items:
        return ""
    figs = "".join(
        f'<figure class="gallery__item"><img src="assets/img/{img}" alt="{escape(cap)}" width="1120" height="1400" loading="lazy">'
        f'<figcaption>{cap}</figcaption></figure>' for img, cap in items)
    return f'''
    <section class="section section--tight" aria-label="{escape(re.sub("<[^>]+>", "", title))}">
      <div class="container">
{section_head(eyebrow, title)}        <div class="gallery">{figs}</div>
      </div>
    </section>
'''


def areas_chips():
    from cities import CITIES
    links = "".join(f'<a href="{city_path(c)}">{c["label"]}</a>' for c in CITIES)
    return f'<div class="chips">{links}<a href="areas.html">All service areas →</a></div>'


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

{gallery(s.get("gallery"), f'Recent {s["short"].lower()} <span class="accent">projects.</span>')}
    <section class="section section--tight" aria-labelledby="areas-title">
      <div class="container">
        <h2 id="areas-title" class="h3">Where we do {s["short"].lower()} work</h2>
        <p class="lead">Based in Sandwich, serving all of Cape Cod and Plymouth.</p>
        {areas_chips()}
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
    body += cta_band(f'Need {s["short"].lower()} work?', "Get a free on-site visit and a clear, itemized estimate with no surprises.")
    path = url(s["slug"])
    service_ld = {
        "@type": "Service", "@id": f"{SITE}{path}#service", "name": re.sub("<[^>]+>", "", s["name"]).replace("&amp;", "&"),
        "serviceType": s["title"].split(" on Cape Cod")[0], "url": SITE + path, "provider": {"@id": BIZ_ID},
        "areaServed": BUSINESS_LD["areaServed"], "description": s["lead"],
    }
    crumbs = [("/", "Home"), (url("services"), "Services"), (path, s["short"])]
    full_title = f'{s["title"]} | {BUSINESS}'
    if len(full_title) > 60:
        full_title = f'{s["title"]} | Castro Carpentry'
    return layout(
        path, full_title, SERVICE_DESC[s["slug"]], s["slug"], body, preload=s["img"],
        schema=[service_ld, breadcrumb_ld(crumbs), faq_ld(s["faq"])],
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
                     "From one rotted trim board to a full deck rebuild, one accountable team that knows Cape Cod homes and coastal weather.",
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
    return layout(url("services"), f"Carpentry Services on Cape Cod | {BUSINESS}",
                  "Trim, siding, decks, windows and doors, roof repairs and ADUs across Cape Cod. One accountable team and clear, itemized estimates.",
                  "services", body, preload="hero-cape-house.jpg",
                  schema=[breadcrumb_ld([("/", "Home"), (url("services"), "Services")])])


def about_page():
    different = [
        ("Built for Cape Cod homes", "Cedar shingle, salt air and nor'easters. We know what these houses need."),
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
        ("We solve the root problem", "We trace rot and water damage to the source and fix it there."),
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
                     "A Cape Cod family business since 2013, built day by day with hard work, faith and dedication.",
                     "roofing-porch-aerial.jpg", "Aerial view of a finished roof over a porch", ctas=False)
    body += f'''
    <section class="section" aria-labelledby="story-title">
      <div class="container split split--reverse">
        <div class="split__copy">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Since 2013</p>
          <h2 id="story-title" class="h2">Born from a dream. <span class="accent">Built day by day.</span></h2>
          <div class="prose">
            <p>Castro Carpentry Inc. started in 2013 as a small family business. Over more than twelve years, the team has grown, but the way we work hasn't changed.</p>
            <p>Estevam Castro, our founder, is a husband, a father of two, and someone who genuinely loves the work. To him, carpentry is about discipline, purpose and leaving something that lasts.</p>
            <p>Today Castro is a solid, reliable and respected name across Cape Cod, known for transparency, reliability and precision. No shortcuts, no hidden costs, and work delivered on schedule.</p>
          </div>
          <blockquote class="quote">
            <p>“We don't just build with wood. We build with values.”</p>
            <footer>Estevam Castro, founder</footer>
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
        <div class="stat"><p class="stat__num">{REVIEW_COUNT}</p><p class="stat__label">Google reviews</p></div>
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
          <p class="lead">Transparency, reliability and precision, from the first conversation to the final walkthrough.</p>
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
    return layout(url("about"), f"About Us | {BUSINESS}, Sandwich MA",
                  "Castro Carpentry started in 2013 as a family business led by Estevam Castro. Licensed, insured and BBB accredited finish carpentry on Cape Cod.",
                  "about", body, preload="roofing-porch-aerial.jpg",
                  schema=[breadcrumb_ld([("/", "Home"), (url("about"), "About")])])


def process_page():
    steps = [
        ("Tell us what you need", "Share the project and the town it's in by form, phone or email. Photos help us understand it faster."),
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
        ("Clear updates", "You'll know what's happening and what's next without having to chase us."),
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
          <p class="lead">Everything you need to make a confident decision and plan timing and budget.</p>
          {checklist(["Photos and a clear explanation of what we found", "Repair options where they apply: the best fix and a budget fix", "An itemized estimate for labor and materials", "A realistic timeline and what to expect on install day"])}
        </div>
        <figure class="stack-img"><img src="assets/img/roofing-new-shingles-aerial.jpg" alt="Aerial view of a newly shingled roof" width="1120" height="1400" loading="lazy"></figure>
      </div>
    </section>

    <section class="section" aria-labelledby="during-title">
      <div class="container">
{section_head("During the project", 'Professional work, <span class="accent">clean site, clear updates.</span>')}        <ul class="features features--grid">{during_html}</ul>
      </div>
    </section>
'''
    body += cta_band("Start with step one.", "Tell us what you need. It takes about two minutes.")
    return layout(url("process"), f"How Our Free Estimates Work | {BUSINESS}",
                  "How Castro's free estimates and projects work: quick follow-up, on-site check, itemized quote, protected home, daily cleanup and a final walkthrough.",
                  "process", body, preload="deck-cable-railing.jpg",
                  schema=[breadcrumb_ld([("/", "Home"), (url("process"), "Process")])])


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
                     f"{RATING} stars across {REVIEW_COUNT} Google reviews, from single repairs to full exterior projects.",
                     "siding-white-colonial.jpg", "White shingle colonial with black shutters", ctas=False)
    body += f'''
    <section class="section" aria-labelledby="rev-title">
      <div class="container">
        <div class="rating-card">
          <div>
            <p class="rating-card__num">5.0</p>
            <p class="stars stars--lg" aria-label="5 out of 5 stars">★★★★★</p>
            <p class="rating-card__sub">Based on {REVIEW_COUNT} Google reviews</p>
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
    return layout(url("reviews"), f"Reviews: {RATING} Stars on Google | {BUSINESS}",
                  f"{BUSINESS} is rated {RATING} stars across {REVIEW_COUNT} Google reviews from Cape Cod homeowners. Read what they say about trim, siding, deck and window work.",
                  "reviews", body, preload="siding-white-colonial.jpg",
                  schema=[breadcrumb_ld([("/", "Home"), (url("reviews"), "Reviews")])])


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
            <p>Rot, leaks and storm damage don't wait for the right time. They only get worse. Financing lets you take care of the work now and spread the cost into predictable monthly payments.</p>
          </div>
          {checklist(["Check your options without affecting your credit score", "Fast approval, with funds available in as little as 24 hours", "Affordable monthly payments", "No prepayment penalties"])}
          <div class="row-btns"><a class="btn btn--primary" href="#check-options">Check your options {ARROW}</a></div>
        </div>
        <figure class="stack-img"><img src="assets/img/deck-black-railing.jpg" alt="Grey deck with black railing and new stairs" width="1050" height="1400" loading="lazy"></figure>
      </div>
    </section>

    <section class="section" id="check-options" aria-labelledby="fin-apply">
      <div class="container">
{section_head("Check your options", 'See what you qualify for <span class="accent">in minutes.</span>', "Checking your options won't affect your credit score. Financing is provided through our partner Enhancify and its lenders, subject to approval.")}        <div class="finance-widget">
          <div id="fullpagewidget" data-color1="#004d93" data-color2="#00213f" data-coBrandedColor="#FFFFFF" data-page="{ENHANCIFY_PAGE}" data-hideLink="0"></div>
          <noscript><p>Turn on JavaScript to see financing options, or call us at <a href="{TEL}">{PHONE}</a>.</p></noscript>
        </div>
        <script src="https://www.enhancify.com/fullpagewidget/" defer></script>
      </div>
    </section>

    <section class="section section--warm process" aria-labelledby="fin-steps">
      <div class="container">
{section_head("How it works", 'Simple from <span class="accent">start to finish.</span>')}        <ol class="steps steps--3">
          <li class="step"><span class="step__num">01</span><h3 class="step__title">Get your estimate</h3><p>We visit and give you a clear, itemized quote.</p></li>
          <li class="step"><span class="step__num">02</span><h3 class="step__title">Check your options</h3><p>Use the form above or ask us about financing to see what plans are available to you.</p></li>
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
    ("Will checking my options affect my credit score?", "No. You can check your options without affecting your credit score."),
    ("How fast is approval?", "Approval is fast, and funds can be available in as little as 24 hours."),
    ("Can I pay it off early?", "Yes. There are no prepayment penalties."),
    ("How do I get started?", "Request a free estimate and mention you're interested in financing. We'll walk you through the next steps."),
])}      </div>
    </section>
'''
    body += cta_band("Ask about financing with your free estimate.")
    return layout(url("financing"), f"Home Improvement Financing | {BUSINESS}",
                  "Finance trim, siding, deck, window and roof work on Cape Cod. Check options without affecting your credit, fast approval, no prepayment penalties.",
                  "financing", body, preload="roofing-drone.jpg",
                  schema=[breadcrumb_ld([("/", "Home"), (url("financing"), "Financing")])])


def faq_page():
    general = [
        ("Do you offer free estimates?", "Yes. We provide free on-site estimates, and every quote is itemized so you can see exactly what's included."),
        ("Which towns do you serve?", "We're based in Sandwich, MA and work across Cape Cod, from the Upper Cape to Provincetown, plus Plymouth. See our <a href=\"areas.html\">service areas</a>, or tell us your town or ZIP and we'll confirm."),
        ("Are you licensed and insured?", "Yes. We're licensed (HIC/CSL) and insured in Massachusetts, and BBB accredited. A certificate of insurance is available on request."),
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
    body += cta_band("Still have a question?", "Call us or send a message, and we'll get back to you quickly.")
    all_items = [q for _, _, items in groups for q in items]
    return layout(url("faq"), f"FAQ: Estimates, Towns & Services | {BUSINESS}",
                  "Answers about free estimates, the towns we serve, licensing, financing, and our trim, siding, deck, window, roofing and ADU work on Cape Cod.",
                  "faq", body, preload="siding-cedar-gable.jpg",
                  schema=[breadcrumb_ld([("/", "Home"), (url("faq"), "FAQ")]), faq_ld(all_items)])


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
      <iframe title="Map showing Castro Finish Carpentry in Sandwich, MA" src="https://www.google.com/maps?q={MAP_Q}&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </section>
'''
    return layout(url("contact"), f"Free Estimate & Contact | {BUSINESS}",
                  f"Request a free on-site estimate for trim, siding, decks, windows and doors, roof repairs or an ADU anywhere on Cape Cod. Call {PHONE}.",
                  "contact", body, preload="hero-cape-house.jpg",
                  schema=[breadcrumb_ld([("/", "Home"), (url("contact"), "Contact")])])


def home_page():
    body = (PAGES / "home.html").read_text()
    body = (body.replace("{{REVIEW_COUNT}}", str(REVIEW_COUNT)).replace("{{RATING}}", RATING)
                .replace("{{AREAS_CHIPS}}", areas_chips()))
    website = {"@type": "WebSite", "@id": f"{SITE}/#website", "url": f"{SITE}/", "name": BUSINESS, "publisher": {"@id": BIZ_ID}}
    return layout("/", f"Finish Carpenter on Cape Cod, MA | {BUSINESS}",
                  "Cape Cod finish carpentry: trim, siding, decks, windows and doors, roof repairs and ADUs. Itemized estimates, clean job sites. Licensed & insured in MA.",
                  "home", body, preload="hero-cape-house.jpg", schema=[website])


def city_page(c, form_html):
    from cities import CITIES
    by_slug = {x["slug"]: x for x in CITIES}
    path = city_path(c)
    town = c["town"]
    context = "".join(f"<p>{p}</p>" for p in c["context"])
    note = ""
    if c["note"]:
        nt, nd = c["note"]
        note = f'<aside class="local-note"><h3>{nt}</h3><p>{nd}</p></aside>'
    svc_tiles = "".join(
        f'<li><a class="tile tile--link" href="{slug}.html"><h3>{SVC[slug]["name"]}</h3><p>{line}</p>'
        f'<span class="svc__link">{SVC[slug]["short"]} in {c["label"]} {ARROW}</span></a></li>'
        for slug, line in c["services"])
    logi = "".join(f'<li class="feature"><span class="feature__ico">{ico("check")}</span><div><h3>{t}</h3><p>{d}</p></div></li>'
                   for t, d in c["logistics"])
    review = ""
    if c["review"]:
        review = (f'\n    <section class="section section--tight" aria-label="Review from {c["label"]}">\n'
                  f'      <div class="container city-review">\n{review_card(*c["review"])}      </div>\n    </section>\n')
    nearby = "".join(f'<a href="{city_path(by_slug[n])}">{by_slug[n]["label"]}</a>' for n in c["nearby"])
    town_form = form_html.replace('name="town" type="text"', f'name="town" type="text" value="{c["label"]}"', 1)
    town_form = town_form.replace('<h3 class="form__title">Get your free estimate</h3>',
                                  f'<h3 class="form__title">Free estimate in {c["label"]}</h3>', 1)
    body = page_hero([("areas.html", "Service areas"), (path, c["label"])], f'{c["region"]} · {town}, MA',
                     f'{c["h1"]}, <span class="page-hero__accent">{c["h1_accent"]}</span>', c["lead"], c["img"], c["img_alt"],
                     cta_href="#estimate")
    body += f"""
    <section class="section" aria-labelledby="ctx-title">
      <div class="container split split--top">
        <div class="split__copy">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Working in {town}</p>
          <h2 id="ctx-title" class="h2">{c["context_title"]}</h2>
          <div class="prose">{context}</div>
        </div>
        <div>
          <h2 class="h3">What we check first on {c["label"]} homes</h2>
          {checklist(c["watch"])}
          {note}
        </div>
      </div>
    </section>

{gallery(c.get("projects"), f'Our work <span class="accent">in {c["label"]}.</span>')}
    <section class="section section--warm" aria-labelledby="svc-title">
      <div class="container">
{section_head("Services", f'What we do <span class="accent">in {c["label"]}.</span>')}        <ul class="tiles">{svc_tiles}</ul>
      </div>
    </section>

    <section class="section" aria-labelledby="logi-title">
      <div class="container">
{section_head("How it works", f'Jobs in {c["label"]}, <span class="accent">planned properly.</span>')}        <ul class="features features--grid">{logi}</ul>
      </div>
    </section>
{review}
    <section class="section section--warm faq" aria-labelledby="faq-title">
      <div class="container faq__inner">
        <header class="section-head section-head--center">
          <p class="eyebrow eyebrow--center"><span class="eyebrow__line" aria-hidden="true"></span>FAQ<span class="eyebrow__line" aria-hidden="true"></span></p>
          <h2 id="faq-title" class="h2">{c["label"]} <span class="accent">questions, answered.</span></h2>
        </header>
{faq_list(c["faq"])}      </div>
    </section>

    <section class="section" aria-labelledby="est-title" id="estimate">
      <div class="container contact-layout">
        <div class="contact-side">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Free estimate</p>
          <h2 id="est-title" class="h2">Planning a project <span class="accent">in {c["label"]}?</span></h2>
          <p class="lead">Tell us what you need. We'll follow up quickly, set a visit and send an itemized estimate.</p>
          <ul class="contact-cards">
            <li><a class="contact-card" href="{TEL}">{ico("phone", "contact-card__ico")}<span><strong>Call now</strong>{PHONE}</span></a></li>
          </ul>
          <h2 class="h3" style="margin-top:32px">Nearby towns we serve</h2>
          <div class="chips">{nearby}<a href="areas.html">All service areas</a></div>
        </div>
        <div class="contact-form">
{town_form}
        </div>
      </div>
    </section>
"""
    service_ld = {"@type": "Service", "@id": f"{SITE}{path}#service",
                  "name": f"Carpentry and exterior repairs in {town}, MA", "serviceType": "Finish carpentry",
                  "provider": {"@id": BIZ_ID}, "url": SITE + path,
                  "areaServed": [{"@type": "City", "name": f"{t.strip()}, MA"} for t in town.split(" and ")]}
    crumbs = [("/", "Home"), (url("areas"), "Service areas"), (path, c["label"])]
    return layout(path, c["title"], c["desc"], "areas", body, preload=c["img"],
                  schema=[service_ld, breadcrumb_ld(crumbs), faq_ld(c["faq"])])


def areas_page():
    from cities import CITIES, OTHER_TOWNS
    tiles = "".join(
        f'<li><a class="tile tile--link" href="{city_path(c)}"><h3>{c["label"]}</h3>'
        f'<p>{c["region"]}. {c["lead"]}</p><span class="svc__link">{c["label"]} page {ARROW}</span></a></li>'
        for c in CITIES)
    others = "".join(f"<span>{t}</span>" for t in OTHER_TOWNS)
    body = page_hero([("areas.html", "Service areas")], "Service areas",
                     'Cape Cod carpentry, <span class="page-hero__accent">from Sandwich to Provincetown.</span>',
                     "Our shop is in Sandwich. We work across the Upper, Mid, Lower and Outer Cape, and over the bridge in Plymouth.",
                     "aerial-home-in-pines.jpg", "Aerial view of a renovated Cape Cod home among pine trees")
    body += f"""
    <section class="section" aria-labelledby="towns-title">
      <div class="container">
{section_head("Town by town", 'Where we <span class="accent">work most.</span>', "Each page covers the homes, weather and local rules we plan around in that town.")}        <ul class="tiles">{tiles}</ul>
      </div>
    </section>

    <section class="section section--warm section--tight" aria-labelledby="also-title">
      <div class="container">
        <h2 id="also-title" class="h3">We also serve</h2>
        <p class="lead">Not on the list? Tell us your town or ZIP and we'll confirm.</p>
        <div class="chips">{others}</div>
      </div>
    </section>
"""
    body += cta_band()
    return layout(url("areas"), f"Service Areas: Cape Cod & Plymouth | {BUSINESS}",
                  "Castro Finish Carpentry serves all of Cape Cod from Sandwich to Provincetown, plus Plymouth. Find your town: Dennis, Orleans, Chatham, Truro and more.",
                  "areas", body, preload="aerial-home-in-pines.jpg",
                  schema=[breadcrumb_ld([("/", "Home"), (url("areas"), "Service areas")])])


def privacy_page():
    def sec(t, items):
        return f'<h3 class="h3">{t}</h3>' + "".join(items)

    def P(t):
        return f"<p>{t}</p>"

    def L(*xs):
        return "<ul>" + "".join(f"<li>{x}</li>" for x in xs) + "</ul>"

    privacy = "".join([
        P(f"{BUSINESS} (“we,” “us,” “our”) respects your privacy. This policy explains how we collect, use, share and protect information when you visit our website, contact us or request an estimate."),
        sec("1. Information we collect", [
            P("<strong>Information you provide.</strong> When you fill out a form, call or email us, you may provide your name, phone number, email, town/ZIP or address, and project details."),
            P("<strong>Information collected automatically.</strong> When you browse the site we may collect your IP address, device and browser type, pages visited, referral source, campaign parameters (such as UTM tags or ad click IDs), and cookies or similar technologies.")]),
        sec("2. How we use it", [L("Respond to requests and provide estimates", "Communicate about your project, scheduling and next steps",
                                   "Understand which pages and ads bring people to us, and improve the website",
                                   "Protect against spam, fraud and misuse", "Comply with legal obligations")]),
        sec("3. How we share it", [P("We do not sell your personal information. We share it only with service providers that help run our website and communications (hosting, form delivery, email, analytics and advertising measurement), when required by law, or in a business transfer where permitted by law.")]),
        sec("4. Cookies, analytics and advertising", [P("We may use Google Analytics, Google Ads and Meta (Facebook) pixels to measure visits and the results of our advertising. These services may set cookies and collect information under their own privacy policies. You can control cookies in your browser settings and opt out of personalized ads in your Google and Meta account settings.")]),
        sec("5. Data retention", [P("We keep personal information only as long as reasonably necessary to respond to your request, provide services, keep business records and meet legal, accounting or tax requirements.")]),
        sec("6. Your choices", [P("You may ask to access, correct or delete the information we hold about you, or opt out of non-essential communications, by contacting us below.")]),
        sec("7. Security", [P("We take reasonable steps to protect your information, but no transmission or storage system is 100% secure.")]),
        sec("8. Children", [P("This website is not intended for children under 13, and we do not knowingly collect their information.")]),
    ])
    terms = "".join([
        sec("Services and estimates", [P("Information on this website is general. Form, phone or email requests are requests for contact or estimates and do not create a binding agreement. Scope, timeline and price are confirmed in writing before a project begins.")]),
        sec("No professional advice", [P("Website content is not legal, financial or engineering advice. Every project depends on site conditions and local requirements.")]),
        sec("Communications", [P("By submitting your contact information, you authorize us to contact you by phone, text or email about your request. Carrier rates may apply. You can opt out of non-essential messages at any time.")]),
        sec("Intellectual property", [P(f"Website text, design, logos and images are owned by or licensed to {BUSINESS} and may not be copied without written permission.")]),
        sec("Third-party links", [P("We are not responsible for the content or privacy practices of third-party sites such as maps or review platforms.")]),
        sec("Disclaimer and liability", [P(f"The website is provided “as is.” To the extent permitted by law, {BUSINESS} is not liable for indirect, incidental or consequential damages arising from use of the website.")]),
        sec("Changes and contact", [P(f'We may update these policies; the date below reflects the latest version. Questions: <a href="mailto:{EMAIL}">{EMAIL}</a> · <a href="{TEL}">{PHONE}</a>.'),
                                    P(f"<em>Last updated: {date.today():%B %Y}</em>")]),
    ])
    body = page_hero([("privacy.html", "Privacy &amp; terms")], "Legal", 'Privacy policy <span class="page-hero__accent">&amp; terms of service.</span>',
                     "How we handle your information, and the terms for using this website.", "siding-cedar-gable.jpg", "Cedar shingle gable", ctas=False)
    body += f"""
    <section class="section" aria-label="Privacy policy and terms">
      <div class="container legal prose">
        <h2 class="h2">Privacy policy</h2>
        {privacy}
        <h2 class="h2" style="margin-top:56px">Terms of service</h2>
        {terms}
      </div>
    </section>
"""
    return layout(url("privacy"), f"Privacy Policy & Terms | {BUSINESS}",
                  f"How {BUSINESS} collects, uses and protects information from website visitors and estimate requests, and the terms for using this website.",
                  "privacy", body, schema=[breadcrumb_ld([("/", "Home"), (url("privacy"), "Privacy & terms")])])


def thanks_page():
    body = f"""    <section class="section" aria-labelledby="thanks-title">
      <div class="container" style="max-width:760px;text-align:center">
        <p class="eyebrow eyebrow--center"><span class="eyebrow__line" aria-hidden="true"></span>Request received<span class="eyebrow__line" aria-hidden="true"></span></p>
        <h1 id="thanks-title" class="h2">Thanks, <span class="accent">we got your request.</span></h1>
        <p class="lead">We'll be in touch shortly to ask a few questions and set up your free estimate. If it's urgent, give us a call.</p>
        <div class="row-btns" style="justify-content:center">
          <a class="btn btn--primary btn--lg" href="{TEL}">{ico("phone")}{PHONE}</a>
          <a class="btn btn--outline btn--lg" href="reviews.html">Read our reviews</a>
        </div>
      </div>
    </section>
"""
    return layout(url("thanks"), f"Thank You | {BUSINESS}", "Your estimate request was received.", "thanks", body, noindex=True)


def notfound_page():
    links = "".join(f'<a href="{s["slug"]}.html">{s["short"]}</a>' for s in SERVICES)
    body = f"""    <section class="section" aria-labelledby="nf-title">
      <div class="container" style="max-width:820px;text-align:center">
        <p class="eyebrow eyebrow--center"><span class="eyebrow__line" aria-hidden="true"></span>404<span class="eyebrow__line" aria-hidden="true"></span></p>
        <h1 id="nf-title" class="h2">This page <span class="accent">isn't here.</span></h1>
        <p class="lead">It may have moved when we rebuilt the site. Try one of these, or call us at <a href="{TEL}">{PHONE}</a>.</p>
        <div class="chips" style="justify-content:center;margin-top:24px"><a href="index.html">Home</a>{links}<a href="areas.html">Service areas</a><a href="contact.html">Free estimate</a></div>
      </div>
    </section>
"""
    return layout("/404.html", f"Page Not Found | {BUSINESS}", "This page could not be found.", "404", body, noindex=True)


# --------------------------------------------------------------------------
# Blog (_build/posts/*.md)
# --------------------------------------------------------------------------
POSTS_DIR = BUILD / "posts"


def _inline(t):
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', t)
    return t


def md_to_html(text):
    """Small Markdown subset: ## / ### headings, paragraphs, - and 1. lists, **bold**, [links](url)."""
    out, para, items, kind = [], [], [], None

    def flush():
        nonlocal para, items, kind
        if para:
            out.append(f"<p>{_inline(' '.join(para))}</p>")
            para = []
        if items:
            out.append(f"<{kind}>" + "".join(f"<li>{_inline(i)}</li>" for i in items) + f"</{kind}>")
            items, kind = [], None

    for line in text.splitlines():
        s = line.strip()
        if not s:
            flush()
        elif s.startswith("### "):
            flush(); out.append(f"<h3>{_inline(s[4:])}</h3>")
        elif s.startswith("## "):
            flush(); out.append(f"<h2>{_inline(s[3:])}</h2>")
        elif s.startswith("- "):
            if para or kind == "ol":
                flush()
            kind = "ul"; items.append(s[2:])
        elif re.match(r"\d+\. ", s):
            if para or kind == "ul":
                flush()
            kind = "ol"; items.append(re.sub(r"^\d+\. ", "", s))
        else:
            if items:
                flush()
            para.append(s)
    flush()
    return "\n".join(out)


def load_posts():
    posts = []
    for f in sorted(POSTS_DIR.glob("*.md")):
        raw = f.read_text()
        _, front, body = raw.split("---", 2)
        meta = {}
        for line in front.strip().splitlines():
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip().strip('"')
        meta["slug"] = f.stem
        meta["path"] = f'{url("blog")}{f.stem}/'
        meta["html"] = md_to_html(body)
        meta["words"] = len(re.sub(r"[#*\[\]()-]", " ", body).split())
        posts.append(meta)
    return sorted(posts, key=lambda p: (p["date"], p["title"]), reverse=True)


def _post_date(p):
    return date.fromisoformat(p["date"]).strftime("%B %-d, %Y")


def post_card(p):
    return f'''          <article class="svc">
            <div class="svc__media"><img src="assets/img/{p["img"]}" alt="{escape(p["img_alt"])}" width="1120" height="1400" loading="lazy"></div>
            <div class="svc__body">
              <p class="post-meta">{p["category"]} · {_post_date(p)}</p>
              <h3 class="svc__title"><a class="post-card__link" href="{p["path"]}">{p["title"]}</a></h3>
              <p>{p["description"]}</p>
              <a class="svc__link" href="{p["path"]}" aria-hidden="true" tabindex="-1">Read article {ARROW}</a>
            </div>
          </article>
'''


def post_page(p, posts):
    s = SVC[p["service"]]
    minutes = max(2, round(p["words"] / 220))
    related = [x for x in posts if x["slug"] != p["slug"]][:3]
    body = page_hero([("blog.html", "Blog"), (p["path"], p["category"])], f'{p["category"]} · {_post_date(p)} · {minutes} min read',
                     p["title"], p["description"], p["img"], p["img_alt"], ctas=False)
    body += f'''
    <section class="section" aria-label="Article">
      <div class="container article-layout">
        <article class="article prose">
{p["html"]}
          <p class="post-byline">By the {BUSINESS} team · Sandwich, MA · Published {_post_date(p)}</p>
        </article>
        <aside class="article-aside">
          <div class="aside-card">
            <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Free estimate</p>
            <h2 class="h3">Need {s["short"].lower()} work?</h2>
            <p>We'll come out, look at it with you and send a clear, itemized estimate.</p>
            <a class="btn btn--primary btn--block" href="contact.html">Get a free estimate {ARROW}</a>
            <a class="btn btn--outline btn--block" href="{TEL}">{ico("phone")}{PHONE}</a>
            <a class="aside-card__link" href="{s["slug"]}.html">About our {s["name"].lower()} work {ARROW}</a>
          </div>
        </aside>
      </div>
    </section>

    <section class="section section--warm" aria-labelledby="more-title">
      <div class="container">
        <header class="section-head section-head--center">
          <p class="eyebrow eyebrow--center"><span class="eyebrow__line" aria-hidden="true"></span>Keep reading<span class="eyebrow__line" aria-hidden="true"></span></p>
          <h2 id="more-title" class="h2">More from <span class="accent">the blog.</span></h2>
        </header>
        <div class="services__grid">
{"".join(post_card(r) for r in related)}        </div>
      </div>
    </section>
'''
    body += cta_band()
    article_ld = {
        "@type": "BlogPosting", "@id": f"{SITE}{p['path']}#article", "headline": p["title"],
        "description": p["description"], "datePublished": p["date"], "dateModified": p.get("updated", p["date"]),
        "image": f"{SITE}/assets/img/{Path(p['img']).stem}.webp", "url": SITE + p["path"],
        "mainEntityOfPage": SITE + p["path"], "author": {"@id": BIZ_ID}, "publisher": {"@id": BIZ_ID},
        "about": {"@id": f'{SITE}{url(p["service"])}#service'}, "wordCount": p["words"],
    }
    crumbs = [("/", "Home"), (url("blog"), "Blog"), (p["path"], p["title"])]
    return layout(p["path"], p["seo_title"], p["description"], "blog", body, preload=p["img"],
                  schema=[article_ld, breadcrumb_ld(crumbs)], og_type="article")


def blog_page(posts):
    cards = "".join(post_card(p) for p in posts)
    body = page_hero([("blog.html", "Blog")], "Blog",
                     'Cape Cod home repair, <span class="page-hero__accent">explained.</span>',
                     "Practical advice on trim, siding, decks, windows, roofs and ADUs for Cape Cod homes, from the team at Castro Finish Carpentry.",
                     "siding-white-colonial.jpg", "White shingle colonial with black shutters", ctas=False)
    body += f'''
    <section class="section" aria-label="Articles">
      <div class="container">
        <div class="services__grid">
{cards}        </div>
      </div>
    </section>
'''
    body += cta_band()
    blog_ld = {"@type": "Blog", "@id": f"{SITE}{url('blog')}#blog", "name": f"{BUSINESS} Blog", "url": SITE + url("blog"),
               "publisher": {"@id": BIZ_ID},
               "blogPost": [{"@id": f"{SITE}{p['path']}#article"} for p in posts]}
    return layout(url("blog"), f"Cape Cod Home Repair Blog | {BUSINESS}",
                  "Practical advice for Cape Cod homeowners on exterior trim, cedar siding, decks, windows, roof repairs and ADUs, from a Sandwich, MA finish carpenter.",
                  "blog", body, preload="siding-white-colonial.jpg",
                  schema=[blog_ld, breadcrumb_ld([("/", "Home"), (url("blog"), "Blog")])])


# --------------------------------------------------------------------------
# Site files
# --------------------------------------------------------------------------
def build_images():
    """_build/img-src/*.jpg -> assets/img/<name>.webp (max 1600w) + <name>-800.webp; og-image.jpg; favicons."""
    try:
        from PIL import Image
    except ImportError:
        print("Pillow not installed: images not regenerated (pip install pillow)")
        return
    IMG_OUT.mkdir(parents=True, exist_ok=True)
    for src in sorted(IMG_SRC.glob("*.jpg")):
        im = Image.open(src).convert("RGB")
        for width, name, q in ((1600, src.stem, 72), (800, f"{src.stem}-800", 70)):
            w = min(width, im.width)
            h = round(im.height * w / im.width)
            if width == 1600:
                IMG_SIZES[src.stem] = (w, h)
            out = IMG_OUT / f"{name}.webp"
            if not out.exists() or out.stat().st_mtime < src.stat().st_mtime:
                im.resize((w, h), Image.LANCZOS).save(out, "WEBP", quality=q, method=6)
    og = IMG_OUT / "og-image.jpg"
    if not og.exists():
        im = Image.open(IMG_SRC / "hero-cape-house.jpg").convert("RGB")
        tw, th = 1200, 630
        scale = max(tw / im.width, th / im.height)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        left, top = (im.width - tw) // 2, (im.height - th) // 2
        im.crop((left, top, left + tw, top + th)).save(og, "JPEG", quality=82, optimize=True)
    logos = ROOT / "assets" / "logos"
    if not (ROOT / "favicon.ico").exists():
        logo = Image.open(logos / "logo-castro-azul-400.png").convert("RGBA")
        logo.save(ROOT / "favicon.ico", sizes=[(32, 32), (16, 16)])
        logo.resize((192, 192), Image.LANCZOS).save(logos / "icon-192.png")
        bg = Image.new("RGBA", (180, 180), (255, 255, 255, 255))
        bg.alpha_composite(logo.resize((160, 160), Image.LANCZOS), (10, 10))
        bg.convert("RGB").save(logos / "apple-touch-icon.png")


def sitemap(paths):
    today = date.today().isoformat()
    rows = "\n".join(f"  <url><loc>{SITE}{p}</loc><lastmod>{today}</lastmod></url>" for p in paths)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{rows}\n</urlset>\n'


# Search engines and AI assistants are welcome. Each named group repeats the
# rules because a crawler follows only the most specific group that matches it.
AI_CRAWLERS = [
    "Googlebot", "Bingbot", "Applebot", "DuckDuckBot",
    "GPTBot", "OAI-SearchBot", "ChatGPT-User",                  # OpenAI
    "ClaudeBot", "Claude-SearchBot", "Claude-User",             # Anthropic
    "PerplexityBot", "Perplexity-User",                         # Perplexity
    "Google-Extended", "Applebot-Extended",                     # Gemini / Apple Intelligence
    "Amazonbot", "Meta-ExternalAgent", "DuckAssistBot", "MistralAI-User", "CCBot",
]
_RULES = "Allow: /\nDisallow: /thank-you/\nDisallow: /api/\n"
ROBOTS = ("# castrocarpentryinc.com: open to search engines and AI assistants.\n"
          "# Summary for language models: /llms.txt\n\n"
          + "".join(f"User-agent: {b}\n" for b in AI_CRAWLERS) + _RULES
          + "\nUser-agent: *\n" + _RULES + f"\nSitemap: {SITE}/sitemap.xml\n")


def llms_txt(posts):
    from cities import CITIES, OTHER_TOWNS
    strip = lambda t: re.sub(r"<[^>]+>", "", t).replace("&amp;", "&")
    lines = [
        f"# {BUSINESS}",
        "",
        f"> Finish carpentry and exterior repair contractor based in {CITY}, Massachusetts, serving all of Cape Cod "
        f"(from Sandwich to Provincetown) and Plymouth since 2013. Licensed (HIC/CSL) and insured in MA, BBB accredited, "
        f"rated {RATING} stars on Google ({REVIEW_COUNT} reviews). Free on-site estimates.",
        "",
        f"- Phone: {PHONE}",
        f"- Email: {EMAIL}",
        f"- Address: {ADDRESS}",
        f"- Founder: Estevam Castro",
        f"- Free estimate: {SITE}{url('contact')}",
        "",
        "## Services",
        "",
    ]
    lines += [f"- [{strip(s['name'])}]({SITE}{url(s['slug'])}): {strip(s['summary'])}" for s in SERVICES]
    lines += ["", "## Service areas", ""]
    lines += [f"- [{c['label']}, MA]({SITE}{city_path(c)}): {c['lead']}" for c in CITIES]
    lines += [f"- Also serving: {', '.join(strip(t) for t in OTHER_TOWNS)}."]
    lines += ["", "## Guides", ""]
    lines += [f"- [{p['title']}]({SITE}{p['path']}): {p['description']}" for p in posts]
    lines += ["", "## Company", "",
              f"- [About]({SITE}{url('about')})", f"- [How estimates work]({SITE}{url('process')})",
              f"- [Reviews]({SITE}{url('reviews')})", f"- [Financing]({SITE}{url('financing')})",
              f"- [FAQ]({SITE}{url('faq')})", ""]
    return "\n".join(lines)

# Old WordPress URLs. Pages with a real equivalent keep their URL (no redirect needed).
REDIRECTS_301 = [
    (r"home/?", "/"),
    (r"sitemap_index\.xml", "/sitemap.xml"),
    (r"(page|post)-sitemap\.xml", "/sitemap.xml"),
    (r"contact/?", "/contact-us/"),
    (r"about/?", "/about-us/"),
    (r"financing/?", "/financing-options/"),
    (r"decks/?", "/decking/"),
    (r"windows-doors/?", "/windows-and-doors/"),
    (r"privacy-policy/?", "/terms-of-service-privacy-policy/"),
    # .html links from the pre-launch static build
    (r"index\.html", "/"),
    (r"decks\.html", "/decking/"),
    (r"windows-doors\.html", "/windows-and-doors/"),
    (r"about\.html", "/about-us/"),
    (r"contact\.html", "/contact-us/"),
    (r"financing\.html", "/financing-options/"),
    (r"(services|trim|siding|roofing|process|reviews|faq|adu)\.html", "/$1/"),
]
GONE_410 = [
    r"hello-world/?", r"category/.*", r"author/.*", r"feed/?", r"comments/feed/?", r"wp-json/.*",
    r"(wpr_templates|category|author)-sitemap\.xml", r"xmlrpc\.php",
]


def htaccess():
    r301 = "\n".join(f"RewriteRule ^{src}$ {dst} [R=301,L]" for src, dst in REDIRECTS_301)
    r410 = "\n".join(f"RewriteRule ^{src}$ - [G,L]" for src in GONE_410)
    return HTACCESS.replace("{{R301}}", r301).replace("{{R410}}", r410)


HTACCESS = r"""# Generated by _build/build.py: edit REDIRECTS_301 / GONE_410 there.
# HTTPS is forced in hPanel (Hostinger), not here, to avoid redirect loops behind the CDN.
Options -Indexes
DirectorySlash On
ErrorDocument 404 /404.html
ErrorDocument 410 /404.html

<IfModule mod_rewrite.c>
RewriteEngine On

# www -> bare domain, one hop
RewriteCond %{HTTP_HOST} ^www\.castrocarpentryinc\.com$ [NC]
RewriteRule ^(.*)$ https://castrocarpentryinc.com/$1 [R=301,L]

# The form endpoint: only browsers may post to it
RewriteCond %{REQUEST_METHOD} POST
RewriteCond %{HTTP_USER_AGENT} ^$ [OR]
RewriteCond %{HTTP_USER_AGENT} (curl|python|wget|libwww|httpclient|go-http|java/|scrapy) [NC]
RewriteRule ^api/ - [F,L]
RewriteRule ^api/(?!lead\.php$) - [F,L]

# WordPress probes (the old site is gone): answer 410 and move on
RewriteRule ^(wp-login\.php|wp-admin|wp-content|wp-includes|wp-config\.php|\.env)(/|$) - [G,L]

# Build sources and repo files are never public
RewriteRule ^(_build|\.git)(/|$) - [F,L]
RewriteRule ^(README\.md|\.gitignore)$ - [F,L]

# WordPress query URLs (?wpr_templates=..., ?p=..., ?page_id=...)
RewriteCond %{QUERY_STRING} (^|&)(wpr_templates|p|page_id)= [NC]
RewriteRule ^$ - [G,L]

# Old WordPress URLs
{{R301}}
{{R410}}

# Clean URLs always end in a slash (/trim -> /trim/)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME}/index.html -f
RewriteRule ^(.*[^/])$ /$1/ [R=301,L]
</IfModule>

<IfModule mod_headers.c>
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Strict-Transport-Security "max-age=31536000"
<FilesMatch "\.(woff2|webp|jpg|png|ico|svg)$">
Header set Cache-Control "public, max-age=2592000"
</FilesMatch>
<FilesMatch "\.(css|js)$">
Header set Cache-Control "public, max-age=604800"
</FilesMatch>
<FilesMatch "\.html$">
Header set Cache-Control "public, max-age=0, must-revalidate"
</FilesMatch>
</IfModule>

<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml application/xml text/plain
</IfModule>
"""


def write(path, html):
    """Write a page at its clean URL: "/trim/" -> trim/index.html, "/" -> index.html."""
    if path == "/":
        target = ROOT / "index.html"
    elif path.endswith(".html"):
        target = ROOT / path.lstrip("/")
    else:
        target = ROOT / path.strip("/") / "index.html"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(html)


def main():
    from cities import CITIES
    build_images()
    # Remove previously generated pages so renamed or removed pages don't linger.
    for old in ROOT.glob("*.html"):
        old.unlink()
    for path in URLS.values():
        if path != "/":
            shutil.rmtree(ROOT / path.strip("/").split("/")[0], ignore_errors=True)

    home = (PAGES / "home.html").read_text()
    form = re.search(r'<form class="form".*?</form>', home, re.S).group(0)
    pages = {
        "/": home_page(),
        url("services"): services_page(),
        url("about"): about_page(),
        url("process"): process_page(),
        url("reviews"): reviews_page(),
        url("financing"): financing_page(),
        url("faq"): faq_page(),
        url("contact"): contact_page("          " + form),
        url("areas"): areas_page(),
        url("privacy"): privacy_page(),
    }
    for s in SERVICES:
        pages[url(s["slug"])] = service_page(s)
    for c in CITIES:
        pages[city_path(c)] = city_page(c, "          " + form)
    posts = load_posts()
    pages[url("blog")] = blog_page(posts)
    for post in posts:
        pages[post["path"]] = post_page(post, posts)
    indexable = list(pages)
    pages[url("thanks")] = thanks_page()
    pages["/404.html"] = notfound_page()

    for path, html in pages.items():
        write(path, html)
    (ROOT / "sitemap.xml").write_text(sitemap(indexable))
    (ROOT / "robots.txt").write_text(ROBOTS)
    (ROOT / "llms.txt").write_text(llms_txt(posts))
    (ROOT / ".htaccess").write_text(htaccess())
    print(f"Built {len(pages)} pages ({len(indexable)} in sitemap)")


if __name__ == "__main__":
    main()
