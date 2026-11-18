"""
Service-area (city) pages.

Each town page must stand on its own: local context, the homes and weather
there, which services matter most, and town-specific questions. Do not clone
a page and swap the town name; Google treats that as a doorway page.

When the client sends real projects or reviews from a town, add them under
"projects" / "review". That is the strongest signal these pages can carry.

Fields
  slug, label        URL slug (/service-areas/<slug>/) and short link text
  town               name used in copy ("Chatham")
  region             Upper / Mid / Lower / Outer Cape, or South Shore
  title, desc        <title> (<= 60 chars) and meta description (<= 160)
  h1, h1_accent      hero heading (keyword first) and its italic second line
  lead               hero paragraph
  img, img_alt       hero photo (from _build/img-src)
  context_title      H2 of the local-context section
  context            paragraphs about working in this town
  watch              checklist: what we look at first on homes here
  note               optional (title, text) callout, e.g. historic review
  services           ordered list of (service slug, town-specific line)
  logistics          (title, text) pairs: how a job runs in this town
  review             optional (name, initials, project, quote) from this town
  faq                town-specific questions
  nearby             slugs of other town pages to link
"""

CITIES = [
    {
        "slug": "sandwich-ma",
        "label": "Sandwich",
        "town": "Sandwich",
        "region": "Upper Cape",
        "title": "Finish Carpenter in Sandwich, MA | Castro Finish Carpentry",
        "desc": "Sandwich-based finish carpenter since 2013: exterior trim, cedar siding, decks, windows and doors, roof repairs and ADUs. Free on-site estimate: (508) 566-1618.",
        "h1": "Finish carpenter in Sandwich, MA",
        "h1_accent": "your neighbors since 2013.",
        "lead": "Our shop is here in Sandwich. Trim, siding, decks, windows and doors, roof repairs and ADUs for homes in Sandwich Village, East Sandwich, Forestdale and South Sandwich.",
        "img": "hero-cape-house.jpg",
        "img_alt": "Cape Cod house with a new roof and front porch",
        "context_title": "Working on <span class=\"accent\">Sandwich homes.</span>",
        "context": [
            "Sandwich is the oldest town on Cape Cod, and it shows in the houses. Along Route 6A and around the village you'll find antique capes and colonials with original trim profiles worth keeping. In Forestdale and South Sandwich, most homes are newer capes, colonials and ranches where the work is usually decks, siding sections, windows and doors.",
            "Houses near Town Neck, Scorton and the bay side take salt wind off Cape Cod Bay. That's where we see fascia, corner boards and window trim fail first, often with soft sheathing behind them that only shows up once the old board comes off.",
            "Because we're based in town, Sandwich is where small jobs make the most sense for us too: one rotted sill, a door that won't close, a few courses of cedar shingle.",
        ],
        "watch": [
            "Original trim on older village homes: repair and match before replacing",
            "Bay-facing walls: fascia, corner boards and window heads",
            "Deck ledgers and stairs on homes built in the 1980s and 90s",
            "Doors and windows that drag or leak after years of seasonal movement",
        ],
        "note": ("Old King's Highway historic district", "Much of Sandwich north of Route 6 sits in the Old King's Highway Regional Historic District, where exterior changes visible from a public way generally need approval from the town's historic committee before work starts. We'll flag it at the estimate and plan materials and timing around it."),
        "services": [
            ("trim", "Exterior and interior trim, including matching profiles on older village homes."),
            ("siding", "Cedar shingle repairs and re-shingling, plus vinyl and fiber cement."),
            ("decks", "New decks, rebuilds, railings and stairs for Forestdale and South Sandwich homes."),
            ("windows-doors", "Replacement windows and doors, flashed and trimmed as one job."),
            ("roofing", "Leak repairs, flashing and storm damage."),
            ("adu", "Garage conversions and in-law suites under the new state ADU rules."),
        ],
        "logistics": [
            ("Small jobs welcome", "Sandwich is home base, so single repairs and short jobs are easy to fit in."),
            ("Fast site visits", "We can usually get out to see a Sandwich project sooner than one at the far end of the Cape."),
            ("Itemized estimate", "Scope and price in writing before anything starts."),
        ],
        "review": None,
        "faq": [
            ("Where is Castro Finish Carpentry located?", "Our shop is in Sandwich, MA. We serve all of Sandwich, including the village, East Sandwich, Forestdale and South Sandwich, and the rest of Cape Cod."),
            ("Do you take small repair jobs in Sandwich?", "Yes. A rotted sill, a sticking door or a few courses of shingle are all worth a call. Being local makes small jobs practical."),
            ("Do you work on antique homes in Sandwich Village?", "Yes. On older homes we repair and match original trim where it's sound, and replace only what has failed."),
            ("Does my project need historic district approval?", "If the home is in the Old King's Highway district and the change is visible from a public way, it usually does. We'll tell you at the estimate and plan around the review."),
        ],
        "nearby": ["dennis-ma", "plymouth-ma"],
    },
    {
        "slug": "dennis-ma",
        "label": "Dennis",
        "town": "Dennis",
        "region": "Mid Cape",
        "title": "Finish Carpenter in Dennis, MA | Castro Finish Carpentry",
        "desc": "Finish carpenter and deck builder in Dennis, MA, from Dennis Port to East Dennis. Trim, decks, siding and windows. Free estimate: (508) 566-1618.",
        "h1": "Finish carpenter &amp; deck builder in Dennis, MA",
        "h1_accent": "from bay side to sound side.",
        "lead": "Decks, exterior trim, siding, windows and doors for homes in Dennis Village, East Dennis, South Dennis, West Dennis and Dennis Port, with a clear, itemized estimate.",
        "img": "deck-cable-railing.jpg",
        "img_alt": "Composite deck with black cable railing",
        "context_title": "Two coasts, <span class=\"accent\">one town.</span>",
        "context": [
            "Dennis runs from Cape Cod Bay to Nantucket Sound, and the homes on each side need different things. North of Route 6, around Dennis Village, East Dennis and Sesuit Harbor, many homes sit along Route 6A in the Old King's Highway historic district, with cedar shingle, traditional trim and older windows.",
            "On the south side, Dennis Port and West Dennis have tighter neighborhoods of capes and cottages, many of them rented in summer. Decks, stairs, railings and porch trim there take heavy use every season, and repairs need to fit between guests.",
            "Either way, the common problems are the same ones we fix across the Mid Cape: soft fascia and corner boards, deck boards and stairs past their life, and windows that leak at the head trim.",
        ],
        "watch": [
            "Deck stairs, railings and ledger connections on rental cottages",
            "Porch trim and columns on south-side homes",
            "Cedar shingle and window trim on 6A homes in the historic district",
            "Fascia and soffits behind gutters",
        ],
        "note": ("Route 6A homes", "Dennis is part of the Old King's Highway Regional Historic District. If your home is on or near 6A, visible exterior changes may need committee approval first. We'll tell you at the estimate."),
        "services": [
            ("decks", "Rebuilds, board replacement, railings and stairs, including rental cottages."),
            ("trim", "Fascia, soffits, corner boards and porch trim."),
            ("windows-doors", "Window and door replacement with flashing and clean trim."),
            ("siding", "Cedar shingle repairs and full re-siding."),
            ("roofing", "Leak and flashing repairs after storms."),
            ("adu", "Garage conversions and in-law suites."),
        ],
        "logistics": [
            ("Rental-friendly scheduling", "For summer rentals we plan around your booking calendar, aiming for the off-season or gaps between guests."),
            ("Mid Cape, easy to reach", "Dennis is a straight run down Route 6 from our Sandwich shop."),
            ("Photos with your estimate", "You'll see what we found and why we recommend each repair."),
        ],
        "review": None,
        "faq": [
            ("Do you work in Dennis Port and West Dennis?", "Yes, all of Dennis: Dennis Village, East Dennis, South Dennis, West Dennis and Dennis Port."),
            ("Can you repair a rental property's deck before the summer season?", "Yes. Tell us your booking dates when you request the estimate, and we'll plan the work around them."),
            ("Do you build new decks in Dennis or only repair them?", "Both. New decks, full rebuilds, board replacement, railings and stairs, in wood or composite."),
            ("My home is on Route 6A. Is that a problem?", "Not a problem, just a step. Visible exterior changes in the Old King's Highway district may need committee approval, and we'll plan the timeline around it."),
        ],
        "nearby": ["sandwich-ma", "orleans-ma", "chatham-ma"],
    },
    {
        "slug": "orleans-ma",
        "label": "Orleans",
        "town": "Orleans",
        "region": "Lower Cape",
        "title": "Carpenter in Orleans, MA | Castro Finish Carpentry",
        "desc": "Carpenter in Orleans, MA: exterior trim, decks, cedar siding and windows for East Orleans, South Orleans and the village. Free estimate: (508) 566-1618.",
        "h1": "Carpenter in Orleans, MA",
        "h1_accent": "built for Atlantic weather.",
        "lead": "Exterior trim, decks, cedar shingle siding, windows and doors for homes in Orleans village, East Orleans and South Orleans, from Nauset to Pleasant Bay.",
        "img": "siding-cedar-gable.jpg",
        "img_alt": "New cedar shingle siding on a gable end",
        "context_title": "Where the Cape <span class=\"accent\">takes the weather.</span>",
        "context": [
            "Orleans sits where the Cape turns north, with Cape Cod Bay at Rock Harbor on one side and the Atlantic at Nauset on the other. Homes in East Orleans and around Pleasant Bay take wind-driven rain and salt straight off the ocean, and it shows first on the east and north walls.",
            "The houses are mostly cedar-shingled capes, half-capes and shingle-style homes, many of them second homes. Typical work here is trim that has opened up at the corners, shingles that have cupped or split, deck boards and railings worn by salt air, and windows that let water in at the head.",
            "On exposed elevations we often suggest PVC or cellular trim instead of wood, and stainless or coated fasteners. We'll walk you through the trade-offs in look and cost.",
        ],
        "watch": [
            "East- and north-facing walls: trim joints, shingles, window heads",
            "Deck railings and fasteners exposed to salt air",
            "Corner boards and rake trim on shingle-style homes",
            "Sliding doors and sills facing the water",
        ],
        "note": ("Historic review on 6A", "Orleans is part of the Old King's Highway Regional Historic District. Visible exterior changes in the district may need approval before work starts. We'll check at the estimate."),
        "services": [
            ("trim", "Rot repair and PVC or wood trim on exposed elevations."),
            ("decks", "Decks, railings and stairs built for salt air."),
            ("siding", "Cedar shingle repairs and re-shingling."),
            ("windows-doors", "Windows and sliders flashed for wind-driven rain."),
            ("roofing", "Flashing and storm repairs."),
            ("adu", "In-law suites and garage conversions."),
        ],
        "logistics": [
            ("Second homes", "If you're not on the Cape full-time, we agree the scope in writing and send photo updates as the job goes."),
            ("Weather-aware schedule", "Exterior work on the Lower Cape is planned around wind and rain, and you'll hear from us if a day moves."),
            ("Material guidance", "Wood vs. PVC trim and fastener choices explained for your exposure."),
        ],
        "review": None,
        "faq": [
            ("Do you work in East Orleans and South Orleans?", "Yes, all of Orleans, including the village, East Orleans and South Orleans."),
            ("What trim holds up best near Nauset or Pleasant Bay?", "On exposed walls we often recommend PVC or cellular trim with stainless or coated fasteners. Wood still works where it's protected. We'll go through options at the estimate."),
            ("I don't live in Orleans year-round. Can you still do the work?", "Yes. We agree the scope and price in writing and keep you updated with photos, so you don't need to be on site."),
            ("Do you replace cedar shingles or only repair them?", "Both. Sometimes a few courses are enough. When the wall has reached its limit, we re-shingle with proper flashing at every window and corner."),
        ],
        "nearby": ["chatham-ma", "dennis-ma", "provincetown-truro-ma"],
    },
    {
        "slug": "chatham-ma",
        "label": "Chatham",
        "town": "Chatham",
        "region": "Lower Cape",
        "title": "Finish Carpenter in Chatham, MA | Castro Finish Carpentry",
        "desc": "Finish carpenter in Chatham, MA: exterior trim, decks, windows, doors and cedar siding. Second homes welcome, photo updates. Free estimate: (508) 566-1618.",
        "h1": "Finish carpenter in Chatham, MA",
        "h1_accent": "with an eye for coastal detail.",
        "lead": "Exterior trim, decks, windows and doors, and cedar shingle siding for homes in Chatham, North Chatham, South Chatham, West Chatham and Chathamport.",
        "img": "siding-white-colonial.jpg",
        "img_alt": "White shingle colonial with black shutters and crisp trim",
        "context_title": "Chatham homes <span class=\"accent\">show every detail.</span>",
        "context": [
            "Chatham sits at the elbow of the Cape, with the Atlantic on the east, Nantucket Sound to the south and Pleasant Bay to the north. Few towns get as much salt and wind from as many directions, and white trim against weathered cedar makes every open joint and every soft board easy to see.",
            "Much of the work here is finish work: crisp window and door casings, corner boards and rakes, porch details, and decks that look as good as the house. Many homes are second homes, so the owner often isn't there while the work happens.",
            "We handle that with a clear written scope, photos of anything hidden we find once a board comes off, and updates as the job moves, so you know what's happening without having to drive down.",
        ],
        "watch": [
            "Window and door casings, sills and head flashing",
            "Corner boards, rakes and returns on shingle-style homes",
            "Porch columns, rails and decking",
            "Salt-air wear on fasteners and railing hardware",
        ],
        "note": ("Local review in Chatham", "Some parts of Chatham have their own historic or design review for exterior changes. We'll check what applies to your street before the estimate is final."),
        "services": [
            ("trim", "Finish-grade exterior trim, casings and porch details."),
            ("decks", "Decks and railings that match the house, in wood or composite."),
            ("windows-doors", "Window and door replacement with clean interior and exterior trim."),
            ("siding", "Cedar shingle repairs and re-shingling."),
            ("roofing", "Leak tracing and flashing at chimneys and skylights."),
            ("adu", "Guest suites and garage conversions."),
        ],
        "logistics": [
            ("Owners away? No problem", "Written scope, photo updates and a clear point of contact for second-home owners."),
            ("Off-season scheduling", "Much exterior work in Chatham is easiest to plan between fall and spring."),
            ("Clean, protected site", "Landscaping and finished surfaces protected, daily cleanup."),
        ],
        "review": None,
        "projects": [
            ("chatham-deck-railing.jpg", "Second-floor deck and white railing on a Chatham home"),
        ],
        "faq": [
            ("Do you work in North Chatham, South Chatham and Chathamport?", "Yes, all of Chatham, including North, South and West Chatham and Chathamport."),
            ("I'm not in Chatham full-time. Can you manage the job while I'm away?", "Yes. We agree the scope in writing, send photos when we find something hidden, and keep you updated through the job."),
            ("Can you match existing trim profiles and details?", "Usually, yes. Finish detail is our specialty. If a profile is no longer made, we'll show you the closest match before installing."),
            ("Wood or composite for a Chatham deck?", "Both work. Composite needs less upkeep in salt air; wood can suit a traditional home. We'll compare look, maintenance and budget."),
        ],
        "nearby": ["orleans-ma", "dennis-ma", "provincetown-truro-ma"],
    },
    {
        "slug": "provincetown-truro-ma",
        "label": "Provincetown & Truro",
        "town": "Provincetown and Truro",
        "region": "Outer Cape",
        "title": "Carpenter in Provincetown & Truro, MA | Castro Carpentry",
        "desc": "Carpenter for Provincetown and Truro: trim, decks, siding, windows and doors on the Outer Cape, with staging planned for tight lots. Call (508) 566-1618.",
        "h1": "Carpenter in Provincetown &amp; Truro",
        "h1_accent": "with every job planned for the Outer Cape.",
        "lead": "Exterior trim, decks, cedar shingle siding, windows and doors for homes and rentals in Provincetown and Truro, including North Truro.",
        "img": "siding-cedar-balcony.jpg",
        "img_alt": "Cedar shingle wall with a balcony and new exterior trim",
        "context_title": "The Outer Cape <span class=\"accent\">needs a plan.</span>",
        "context": [
            "Working at the end of the Cape is different. In Provincetown, many homes sit close together along narrow streets with little room for a dumpster or a lumber delivery, so staging, parking and delivery times are planned before the first day.",
            "Much of Provincetown is under local historic district review, and many Truro properties sit near or inside the Cape Cod National Seashore, where building rules are stricter. Before we price a job, we check what review it is likely to need.",
            "Homes here, from Provincetown's East and West End to Truro's bluffs and dunes, take wind, sand and salt year-round. Trim, decks, balconies and window flashing wear fastest, and rentals put extra traffic on stairs and railings.",
        ],
        "watch": [
            "Balconies, decks and exterior stairs on rentals",
            "Window and door flashing on exposed walls",
            "Cedar shingle and trim worn by wind and sand",
            "Access and staging on tight lots",
        ],
        "note": ("Historic and Seashore rules", "Exterior changes in much of Provincetown go through the local historic district commission, and parts of Truro have additional Seashore-area rules. We'll tell you what to expect before the estimate is final."),
        "services": [
            ("decks", "Decks, balconies, railings and stairs for homes and rentals."),
            ("trim", "Trim and rot repair on exposed walls."),
            ("siding", "Cedar shingle repairs and re-shingling."),
            ("windows-doors", "Windows and doors flashed for wind-driven rain."),
            ("roofing", "Leak and flashing repairs."),
            ("adu", "In-law units and conversions where town rules allow."),
        ],
        "logistics": [
            ("Staging planned upfront", "Deliveries, parking and material storage worked out before the job starts."),
            ("Off-season for rentals", "We aim to finish rental work outside peak season, around your booking calendar."),
            ("Photo updates", "Useful if you're off-Cape while the work happens."),
        ],
        "projects": [
            ("truro-interior-framing.jpg", "New interior walls framed during a whole-house renovation in Truro"),
            ("truro-door-casing.jpg", "Cedar-lined closet with new door casing, Truro"),
            ("truro-built-in-shelves.jpg", "Built-in shelving added during the Truro renovation"),
            ("truro-fireplace.jpg", "Living room and fireplace wall, Truro renovation"),
        ],
        "review": ("Samantha Keller", "SK", "Exterior &amp; interior project · Provincetown", "Start to finish - they were simply fantastic!!"),
        "faq": [
            ("Do you really come out to Provincetown and Truro?", "Yes. We've worked in Provincetown, and we serve the whole Outer Cape, including Truro and North Truro."),
            ("Will my project need historic district approval?", "In much of Provincetown, visible exterior changes go through the historic district commission. We'll tell you what's likely needed before you commit."),
            ("How do you handle tight lots and parking in Provincetown?", "We plan deliveries, staging and parking with you before the job starts, so the street and your neighbors aren't an afterthought."),
            ("Can you work on my rental between bookings?", "Yes. Share your booking calendar with the estimate request and we'll plan around it, ideally in the off-season."),
        ],
        "nearby": ["orleans-ma", "chatham-ma"],
    },
    {
        "slug": "plymouth-ma",
        "label": "Plymouth",
        "town": "Plymouth",
        "region": "South Shore",
        "title": "Carpenter in Plymouth, MA | Castro Finish Carpentry",
        "desc": "Carpenter and deck builder in Plymouth, MA: decks, PVC trim, windows, doors and siding in Manomet, the Pinehills and downtown. Call (508) 566-1618.",
        "h1": "Carpenter &amp; deck builder in Plymouth, MA",
        "h1_accent": "just over the bridge.",
        "lead": "Decks, exterior trim, windows and doors, and siding for homes in downtown Plymouth, North Plymouth, Manomet, Cedarville, White Horse Beach and the Pinehills.",
        "img": "deck-black-railing.jpg",
        "img_alt": "Grey deck with black railing and new stairs",
        "context_title": "A big town <span class=\"accent\">with every kind of house.</span>",
        "context": [
            "Plymouth is the largest town in Massachusetts by land area, and the housing covers everything: historic homes near downtown and the waterfront, beach cottages in Manomet and White Horse Beach, and newer neighborhoods like the Pinehills and the developments off Route 3.",
            "On newer homes, the work is usually decks, composite and PVC trim, and door and window upgrades. On older and waterfront homes, it's rot repair behind trim and siding, and flashing at windows that face the water.",
            "Our shop in Sandwich is a short drive over the Sagamore Bridge, so Plymouth is a regular part of our service area. Recent work here includes new siding, roofing and window trim on a church.",
        ],
        "watch": [
            "Deck framing, stairs and railings on homes built in the last 20 to 30 years",
            "PVC and composite trim joints that have opened up",
            "Window and door flashing on waterfront homes in Manomet and White Horse Beach",
            "Rot behind trim on older homes near downtown",
        ],
        "note": None,
        "services": [
            ("decks", "New decks, rebuilds, composite upgrades, railings and stairs."),
            ("trim", "PVC and wood trim, fascia and soffits."),
            ("windows-doors", "Entry doors, patio doors and window replacement."),
            ("siding", "Vinyl, fiber cement and cedar repairs and replacement."),
            ("roofing", "Leak and flashing repairs."),
            ("adu", "Garage conversions and in-law suites."),
        ],
        "logistics": [
            ("Close to our shop", "Plymouth is just over the Sagamore Bridge from Sandwich."),
            ("Newer-home upgrades", "Composite decking, PVC trim and door upgrades are routine work for us."),
            ("Itemized estimate", "Scope and price in writing before work starts."),
        ],
        "projects": [
            ("plymouth-church-gable-housewrap.jpg", "Housewrap and new windows going in on a church in Plymouth"),
            ("plymouth-church-siding-gable.jpg", "New siding and rake trim on the same Plymouth church"),
            ("plymouth-church-window-trim.jpg", "Window trim and flashing detail, Plymouth"),
            ("plymouth-church-roofing.jpg", "Roofing work on the Plymouth church project"),
        ],
        "review": None,
        "faq": [
            ("Have you worked in Plymouth before?", "Yes. Recent work includes new siding, roofing and window trim on a church in Plymouth, shown above."),
            ("Do you work in Plymouth even though it's off-Cape?", "Yes. Plymouth is part of our regular service area, a short drive over the Sagamore Bridge from our Sandwich shop."),
            ("Do you work in the Pinehills and Manomet?", "Yes, all of Plymouth, including downtown, North Plymouth, Manomet, Cedarville, White Horse Beach and the Pinehills."),
            ("Can you replace my deck boards with composite?", "Often, yes, if the framing is solid. We check the structure first and tell you honestly whether boards alone make sense."),
            ("Do you fix PVC trim that has separated?", "Yes. Open joints in PVC trim usually come from expansion and fastening; we re-fasten, re-join and seal them properly."),
        ],
        "nearby": ["sandwich-ma", "dennis-ma"],
    },
]

OTHER_TOWNS = ["Bourne", "Falmouth", "Mashpee", "Barnstable &amp; Hyannis", "Yarmouth", "Brewster", "Harwich", "Eastham", "Wellfleet"]
