// Fixed-structure pages. Each function receives the page content (fields from src/content/schema.mjs) and
// reads services, areas, FAQ, reviews and business data from the build context C.
import { SITE } from '../site.config.mjs';
import {
  C, esc, t, md, paras, plain, titled, img, ico, ARROW, tel, address, instagramUrl, layout, pageHero, heroFrom, sectionHead, headFrom,
  ctaBand, faqList, checklist, badges, tiles, features, vsteps, bigSteps, svcCard, gallery, areasChips, reviewCard, estimateForm,
  breadcrumbSchema, faqSchema, servicePath, areaPath, BIZ_ID, URL_OF, abs, hasImage,
} from '../lib.mjs';

const crumbsLd = (...pairs) => breadcrumbSchema([['/', 'Home'], ...pairs]);
const faqsOf = (topic) => C.faqs.filter((f) => f.topic === topic);
const svcName = (s) => plain(s.data.name);
const serviceLd = (s, path) => ({
  '@type': 'Service', '@id': `${SITE.url}${path}#service`, name: svcName(s), serviceType: plain(s.data.seo_title).split(/ on Cape Cod| \|/)[0],
  url: abs(path), provider: { '@id': BIZ_ID() }, description: plain(s.data.lead),
});

/* ---------- Home ---------- */
export function home(c) {
  const b = C.business;
  const homeReviews = C.reviews.filter((r) => r.home).slice(0, 6);
  const homeFaqs = C.faqs.filter((f) => f.home);
  const body = `    <!-- Hero -->
    <section class="hero" aria-labelledby="hero-title">
      ${img(c.hero_image, c.hero_image_alt, { cls: 'hero__bg', sizes: '100vw', eager: true, priority: true })}
      <div class="hero__shade" aria-hidden="true"></div>
      <div class="container hero__inner">
        <div class="hero__copy">
          <p class="eyebrow eyebrow--light"><span class="eyebrow__line" aria-hidden="true"></span>${t(c.hero_eyebrow)}</p>
          <h1 id="hero-title" class="hero__title">
            ${t(c.hero_title)}
            ${c.hero_accent ? `<span class="hero__title-accent">${t(c.hero_accent)}</span>` : ''}
          </h1>
          <p class="hero__lead">${md(c.hero_lead)}</p>
          <div class="hero__ctas">
            <a class="btn btn--primary btn--lg" href="#estimate">Get a free estimate ${ARROW}</a>
            <a class="btn btn--ghost-light btn--lg" href="${tel()}">${ico('phone')}${t(b.phone)}</a>
          </div>
          <ul class="hero__trust">
            ${c.hero_trust.map((x) => `<li>${ico(x.icon || 'check')}${t(x.text)}</li>`).join('\n            ')}
            <li>${ico('star')}${t(b.rating)}★ · ${t(b.reviewCount)} Google reviews</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="stats" aria-label="Castro at a glance">
      <div class="container stats__grid">
        <div class="stat"><p class="stat__num">${t(c.years_num)}</p><p class="stat__label">${t(c.years_label)}</p></div>
        <div class="stat"><p class="stat__num">${t(b.reviewCount)}</p><p class="stat__label">Google reviews</p></div>
        <div class="stat"><p class="stat__num">${t(b.rating)}<span class="stat__star" aria-hidden="true">★</span></p><p class="stat__label">Average rating</p></div>
      </div>
    </section>

    <!-- The Castro Standard -->
    <section class="section standard" aria-labelledby="standard-title">
      <div class="container split">
        <div class="collage">
          ${img(c.standard_img1, c.standard_img1_alt, { cls: 'collage__a' })}
          ${img(c.standard_img2, c.standard_img2_alt, { cls: 'collage__b' })}
          ${img(c.standard_img3, c.standard_img3_alt, { cls: 'collage__c' })}
          <div class="collage__seal" aria-hidden="true"><img src="/assets/logos/logo-castro-azul-adesivo-400.png" alt="" width="120" height="121"></div>
        </div>
        <div class="split__copy">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>${t(c.standard_eyebrow)}</p>
          <h2 id="standard-title" class="h2">${titled(c.standard_title, c.standard_accent)}</h2>
          <p class="lead">${md(c.standard_lead)}</p>
          ${checklist(c.standard_points)}
          <a class="btn btn--primary" href="#estimate">Get a free estimate ${ARROW}</a>
        </div>
      </div>
    </section>

    <!-- Services -->
    <section class="section services" id="services" aria-labelledby="services-title">
      <div class="container">
${headFrom(c, 'services', { id: 'services-title' })}
        <div class="services__grid">
${C.services.filter((s) => s.data.home_card).map((s) => svcCard(s)).join('')}
          <article class="svc svc--cta">
            <div class="svc__body">
              <img src="/assets/logos/logo-castro-azul-adesivo-400.png" alt="" width="88" height="89" class="svc__seal">
              <h3 class="svc__title">${t(c.services_cta_title)}</h3>
              <p>${md(c.services_cta_text)}</p>
              <div class="svc__ctas">
                <a class="btn btn--light" href="/contact-us/">Request a visit</a>
                <a class="btn btn--ghost-light" href="${tel()}">Call us</a>
              </div>
            </div>
          </article>
        </div>
        <div class="center"><a class="btn btn--outline" href="/services/">View all services ${ARROW}</a></div>
      </div>
    </section>

    <!-- About / Owner -->
    <section class="section about" id="about" aria-labelledby="about-title">
      <div class="container split split--reverse">
        <div class="split__copy">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>${t(c.about_eyebrow)}</p>
          <h2 id="about-title" class="h2">${titled(c.about_title, c.about_accent)}</h2>
          ${paras(c.about_text)}
          ${c.about_quote ? `<blockquote class="quote">
            <p>“${t(c.about_quote)}”</p>
            <footer>${t(c.about_quote_by)}</footer>
          </blockquote>` : ''}
          <a class="btn btn--outline" href="/about-us/">Read our full story ${ARROW}</a>
        </div>
        <figure class="portrait">
          ${img(c.about_image, c.about_image_alt)}
          <figcaption class="portrait__tag"><strong>${t(c.about_tag_name)}</strong><span>${t(c.about_tag_role)}</span></figcaption>
        </figure>
      </div>
    </section>
${homeReviews.length ? `
    <!-- Reviews -->
    <section class="section reviews" id="reviews" aria-labelledby="reviews-title">
      <div class="container">
        <header class="section-head section-head--center">
          <p class="eyebrow eyebrow--center eyebrow--light"><span class="eyebrow__line" aria-hidden="true"></span>${t(c.reviews_eyebrow)}<span class="eyebrow__line" aria-hidden="true"></span></p>
          <h2 id="reviews-title" class="h2 h2--light">${titled(c.reviews_title, c.reviews_accent, 'accent accent--light')}</h2>
          <p class="rating"><span class="stars" aria-hidden="true">★★★★★</span> <strong>${t(b.rating)}</strong> on Google · ${t(b.reviewCount)} reviews</p>
        </header>

        <div class="reviews__grid">
${homeReviews.map((r) => reviewCard(r, false)).join('')}        </div>

        <div class="center">
          <a class="btn btn--light" href="/reviews/">See more reviews ${ARROW}</a>
        </div>
      </div>
    </section>
` : ''}
    <!-- Process -->
    <section class="section process" id="process" aria-labelledby="process-title">
      <div class="container">
${headFrom(c, 'process', { id: 'process-title' })}
        <ol class="steps">${bigSteps(c.process_steps)}</ol>

        <div class="center">
          <a class="btn btn--primary" href="/process/">See how we work ${ARROW}</a>
        </div>
      </div>
    </section>

    <!-- Financing + Trust -->
    <section class="section financing" id="financing" aria-labelledby="financing-title">
      <div class="container">
        <div class="finance-card">
          <div class="finance-card__copy">
            <p class="eyebrow eyebrow--light"><span class="eyebrow__line" aria-hidden="true"></span>${t(c.fin_eyebrow)}</p>
            <h2 id="financing-title" class="h2 h2--light">${titled(c.fin_title, c.fin_accent, 'accent accent--light')}</h2>
            ${checklist(c.fin_points, true)}
            <a class="btn btn--light" href="/financing-options/">Learn about financing ${ARROW}</a>
          </div>
          <div class="finance-card__media">
            ${img(c.fin_image, c.fin_image_alt)}
          </div>
        </div>

${badges()}      </div>
    </section>
${C.instagram ? `
    <!-- Instagram (filled from /instagram/feed.json by js/main.js) -->
    <section class="section section--warm ig" id="instagram" aria-labelledby="ig-title" hidden>
      <div class="container">
${sectionHead({ eyebrow: c.ig_eyebrow, title: c.ig_title, accent: c.ig_accent, id: 'ig-title' })}        <div class="ig__grid" data-ig-grid></div>
        ${b.instagram ? `<div class="center"><a class="btn btn--outline" href="${esc(instagramUrl())}" target="_blank" rel="noopener">Follow @${t(b.instagram)}</a></div>` : ''}
      </div>
    </section>
` : ''}
    <!-- Service areas -->
    <section class="section" aria-labelledby="areas-home-title">
      <div class="container">
${headFrom(c, 'areas', { id: 'areas-home-title' })}        ${areasChips()}
      </div>
    </section>
${homeFaqs.length ? `
    <section class="section faq" id="faq" aria-labelledby="faq-title">
      <div class="container faq__inner">
${headFrom(c, 'faq', { id: 'faq-title' })}
${faqList(homeFaqs)}        <div class="center"><a class="btn btn--outline" href="/faq/">See all questions ${ARROW}</a></div>
      </div>
    </section>
` : ''}
    <!-- Estimate -->
    <section class="estimate" id="estimate" aria-labelledby="estimate-title">
      <div class="container estimate__inner">
        <div class="estimate__copy">
          <p class="eyebrow eyebrow--light"><span class="eyebrow__line" aria-hidden="true"></span>${t(c.estimate_eyebrow)}</p>
          <h2 id="estimate-title" class="h2 h2--light">${titled(c.estimate_title, c.estimate_accent, 'accent accent--light')}</h2>
          <p class="lead lead--light">${md(c.estimate_lead)}</p>
          <ul class="contact-list">
            <li>${ico('phone')}<a href="${tel()}">${t(b.phone)}</a></li>
            <li>${ico('mail')}<a href="mailto:${t(b.email)}">${t(b.email)}</a></li>
            <li>${ico('pin')}<span>${t(c.estimate_area)}</span></li>
          </ul>
        </div>

        ${estimateForm({ formName: 'home' })}
      </div>
    </section>`;
  const website = { '@type': 'WebSite', '@id': `${SITE.url}/#website`, url: `${SITE.url}/`, name: SITE.name, publisher: { '@id': BIZ_ID() } };
  return layout({ path: '/', title: c.seo_title, description: c.seo_description, active: 'home', body, preload: c.hero_image, ogImg: c.hero_image, schema: [website, ...(homeFaqs.length ? [faqSchema(homeFaqs)] : [])] });
}

/* ---------- Service page (same template for every service) ---------- */
export function servicePage(s) {
  const d = s.data;
  const path = servicePath(s);
  const short = plain(d.short);
  const faqs = faqsOf(`service:${s.slug}`);
  const related = C.services.filter((x) => x.slug !== s.slug).slice(0, 3);
  const warning = d.warning_title || d.warning_text ? `        <aside class="note">
          ${ico('alert', 'note__ico')}
          <div><h3>${t(d.warning_title)}</h3><p>${md(d.warning_text)}</p></div>
        </aside>
` : '';
  let body = pageHero({ crumbs: [['/services/', 'Services'], [path, d.short]], eyebrow: `${short} · Cape Cod, MA`, title: d.h1, accent: d.h1_accent, lead: d.lead, image: d.image, alt: d.image_alt });
  body += `
    ${d.why_title || d.why ? `<section class="section" aria-labelledby="why-title">
      <div class="container split">
        <div class="split__copy">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Why it matters</p>
          <h2 id="why-title" class="h2">${titled(d.why_title, d.why_accent)}</h2>
          <div class="prose">${paras(d.why)}</div>
          ${checklist(d.points)}
        </div>
        ${hasImage(d.image2) ? `<figure class="stack-img">
          ${img(d.image2, d.image2_alt)}
        </figure>` : ''}
      </div>
    </section>` : ''}
${d.handle.length ? `
    <section class="section section--warm" aria-labelledby="handle-title">
      <div class="container">
${sectionHead({ eyebrow: 'Scope', title: d.handle_title, id: 'handle-title' })}        <ul class="tiles">${tiles(d.handle)}</ul>
      </div>
    </section>
` : ''}${d.diff.length || d.steps.length ? `
    <section class="section" aria-label="${esc(plain(d.diff_title))}">
      <div class="container split split--top">
        <div>
${sectionHead({ eyebrow: 'The Castro Standard', title: d.diff_title, center: false })}          <ul class="features">${features(d.diff)}</ul>
        </div>
        <div>
          <h2 class="h3">${t(d.steps_title)}</h2>
          <ol class="vsteps">${vsteps(d.steps)}</ol>
${warning}        </div>
      </div>
    </section>
` : ''}${faqs.length ? `
    <section class="section section--warm faq" aria-labelledby="faq-title">
      <div class="container faq__inner">
${sectionHead({ eyebrow: 'FAQ', title: short, accent: 'questions, answered.', id: 'faq-title' })}${faqList(faqs)}        <div class="center"><a class="btn btn--outline" href="/faq/">See all questions ${ARROW}</a></div>
      </div>
    </section>
` : ''}
${gallery(d.gallery, `Recent ${short.toLowerCase()}`, 'projects.')}
    <section class="section section--tight" aria-labelledby="areas-title">
      <div class="container">
        <h2 id="areas-title" class="h3">Where we do ${esc(short.toLowerCase())} work</h2>
        <p class="lead">${md(C.global.service_area_line)}</p>
        ${areasChips()}
      </div>
    </section>
${related.length ? `
    <section class="section" aria-labelledby="related-title">
      <div class="container">
${sectionHead({ eyebrow: 'More services', title: 'One team for', accent: 'the whole exterior.', id: 'related-title' })}        <div class="services__grid">
${related.map((r) => svcCard(r)).join('')}        </div>
      </div>
    </section>
` : ''}`;
  body += ctaBand(`Need ${short.toLowerCase()} work?`, 'Get a free on-site visit and a clear, itemized estimate with no surprises.');
  return layout({
    path, title: d.seo_title, description: d.seo_description, active: `service:${s.slug}`, body, preload: d.image, ogImg: d.image,
    schema: [{ ...serviceLd(s, path), areaServed: [{ '@type': 'Place', name: 'Cape Cod, MA' }] }, crumbsLd(['/services/', 'Services'], [path, d.short]), ...(faqs.length ? [faqSchema(faqs)] : [])],
  });
}

/* ---------- Services index ---------- */
export function servicesPage(c) {
  const rows = C.services.map((s, i) => `        <article class="svc-row${i % 2 ? ' svc-row--rev' : ''}" id="${esc(s.slug)}">
          <div class="svc-row__media">${img(s.data.image, s.data.image_alt)}</div>
          <div class="svc-row__copy">
            <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>${t(s.data.short)}</p>
            <h2 class="h2">${t(s.data.name)}</h2>
            <p class="lead">${md(s.data.summary)}</p>
            ${checklist(s.data.points.slice(0, 4))}
            <div class="row-btns">
              <a class="btn btn--primary" href="${servicePath(s)}">Explore ${esc(plain(s.data.short).toLowerCase())} ${ARROW}</a>
              <a class="btn btn--outline" href="/contact-us/">Get an estimate</a>
            </div>
          </div>
        </article>
`).join('');
  let body = heroFrom(c, [['/services/', 'Services']]);
  body += `
    <section class="section" aria-label="Our services">
      <div class="container svc-rows">
${rows}      </div>
    </section>

    <section class="section section--warm" aria-labelledby="how-title">
      <div class="container">
${headFrom(c, 'std', { id: 'how-title' })}        <ul class="features features--grid">${features(c.std_items)}</ul>
      </div>
    </section>
`;
  body += ctaBand();
  return layout({ path: '/services/', title: c.seo_title, description: c.seo_description, active: 'services', body, preload: c.hero_image, ogImg: c.hero_image, schema: [crumbsLd(['/services/', 'Services'])] });
}

/* ---------- About ---------- */
export function aboutPage(c) {
  const b = C.business;
  let body = heroFrom(c, [['/about-us/', 'About']], { ctas: false });
  body += `
    <section class="section" aria-labelledby="story-title">
      <div class="container split split--reverse">
        <div class="split__copy">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>${t(c.story_eyebrow)}</p>
          <h2 id="story-title" class="h2">${titled(c.story_title, c.story_accent)}</h2>
          <div class="prose">${paras(c.story_text)}</div>
          ${c.quote ? `<blockquote class="quote">
            <p>“${t(c.quote)}”</p>
            <footer>${t(c.quote_by)}</footer>
          </blockquote>` : ''}
        </div>
        <figure class="portrait">
          ${img(c.portrait, c.portrait_alt)}
          <figcaption class="portrait__tag"><strong>${t(c.portrait_name)}</strong><span>${t(c.portrait_role)}</span></figcaption>
        </figure>
      </div>
    </section>

    <section class="stats" aria-label="Castro at a glance">
      <div class="container stats__grid">
        <div class="stat"><p class="stat__num">${t(c.years_num)}</p><p class="stat__label">${t(c.years_label)}</p></div>
        <div class="stat"><p class="stat__num">${t(b.reviewCount)}</p><p class="stat__label">Google reviews</p></div>
        <div class="stat"><p class="stat__num">${t(b.rating)}<span class="stat__star" aria-hidden="true">★</span></p><p class="stat__label">Average rating</p></div>
      </div>
    </section>

    <section class="section section--warm" aria-labelledby="diff-title">
      <div class="container">
${headFrom(c, 'diff', { id: 'diff-title' })}        <ul class="tiles tiles--4">${tiles(c.diff_items)}</ul>
      </div>
    </section>

    <section class="section" aria-labelledby="approach-title">
      <div class="container split split--top">
        <div>
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>${t(c.approach_eyebrow)}</p>
          <h2 id="approach-title" class="h2">${titled(c.approach_title, c.approach_accent)}</h2>
          <p class="lead">${md(c.approach_lead)}</p>
          <div class="row-btns"><a class="btn btn--primary" href="/process/">See our process ${ARROW}</a></div>
        </div>
        <ol class="vsteps">${vsteps(c.approach_steps)}</ol>
      </div>
    </section>

    <section class="section section--warm" aria-label="Credentials">
      <div class="container">
${headFrom(c, 'cred')}${badges()}      </div>
    </section>
`;
  body += ctaBand(c.cta_title);
  return layout({ path: '/about-us/', title: c.seo_title, description: c.seo_description, active: 'about', body, preload: c.hero_image, ogImg: c.hero_image, schema: [crumbsLd(['/about-us/', 'About'])] });
}

/* ---------- Process ---------- */
export function processPage(c) {
  let body = heroFrom(c, [['/process/', 'Process']]);
  body += `
    <section class="section process" aria-labelledby="est-title">
      <div class="container">
${headFrom(c, 'steps', { id: 'est-title' })}        <ol class="steps">${bigSteps(c.steps)}</ol>
      </div>
    </section>

    <section class="section section--warm" aria-labelledby="receive-title">
      <div class="container split">
        <div class="split__copy">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>${t(c.receive_eyebrow)}</p>
          <h2 id="receive-title" class="h2">${titled(c.receive_title, c.receive_accent)}</h2>
          <p class="lead">${md(c.receive_lead)}</p>
          ${checklist(c.receive_points)}
        </div>
        <figure class="stack-img">${img(c.receive_image, c.receive_image_alt)}</figure>
      </div>
    </section>

    <section class="section" aria-labelledby="during-title">
      <div class="container">
${headFrom(c, 'during', { id: 'during-title' })}        <ul class="features features--grid">${features(c.during)}</ul>
      </div>
    </section>
`;
  body += ctaBand(c.cta_title, c.cta_text);
  return layout({ path: '/process/', title: c.seo_title, description: c.seo_description, active: 'process', body, preload: c.hero_image, ogImg: c.hero_image, schema: [crumbsLd(['/process/', 'Process'])] });
}

/* ---------- Reviews ---------- */
export function reviewsPage(c) {
  const b = C.business;
  let body = heroFrom(c, [['/reviews/', 'Reviews']], { ctas: false });
  body += `
    <section class="section" aria-labelledby="rev-title">
      <div class="container">
        <div class="rating-card">
          <div>
            <p class="rating-card__num">${t(b.rating)}</p>
            <p class="stars stars--lg" aria-label="${t(b.rating)} out of 5 stars">★★★★★</p>
            <p class="rating-card__sub">Based on ${t(b.reviewCount)} Google reviews</p>
          </div>
          <div class="rating-card__copy">
            <h2 id="rev-title" class="h3">${t(c.card_title)}</h2>
            <p>${md(c.card_text)}</p>
            <div class="row-btns">
              ${b.googleReviewsUrl ? `<a class="btn btn--primary" href="${esc(b.googleReviewsUrl)}" target="_blank" rel="noopener">Read all on Google ${ARROW}</a>` : ''}
              ${b.googleWriteReviewUrl ? `<a class="btn btn--outline" href="${esc(b.googleWriteReviewUrl)}" target="_blank" rel="noopener">Leave a review</a>` : ''}
            </div>
          </div>
        </div>

        <div class="reviews__grid reviews__grid--page">
${C.reviews.map((r) => reviewCard(r)).join('')}        </div>
      </div>
    </section>
`;
  body += ctaBand(c.cta_title);
  return layout({ path: '/reviews/', title: c.seo_title, description: c.seo_description, active: 'reviews', body, preload: c.hero_image, ogImg: c.hero_image, schema: [crumbsLd(['/reviews/', 'Reviews'])] });
}

/* ---------- Financing ---------- */
export function financingPage(c) {
  const b = C.business;
  const faqs = faqsOf('financing');
  let body = heroFrom(c, [['/financing-options/', 'Financing']]);
  body += `
    <section class="section" aria-labelledby="fin-title">
      <div class="container split">
        <div class="split__copy">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>${t(c.why_eyebrow)}</p>
          <h2 id="fin-title" class="h2">${titled(c.why_title, c.why_accent)}</h2>
          <div class="prose">${paras(c.why_text)}</div>
          ${checklist(c.why_points)}
          ${b.enhancifyPage ? `<div class="row-btns"><a class="btn btn--primary" href="#check-options">Check your options ${ARROW}</a></div>` : ''}
        </div>
        <figure class="stack-img">${img(c.why_image, c.why_image_alt)}</figure>
      </div>
    </section>
${b.enhancifyPage ? `
    <section class="section" id="check-options" aria-labelledby="fin-apply">
      <div class="container">
${headFrom(c, 'apply', { id: 'fin-apply' })}      </div>
      <!-- Enhancify's widget sizes itself to the whole viewport, so it sits outside .container -->
      <div class="finance-widget">
        <div id="fullpagewidget" data-color1="#004d93" data-color2="#00213f" data-coBrandedColor="#FFFFFF" data-page="${esc(b.enhancifyPage)}" data-hideLink="0"></div>
        <noscript><p>Turn on JavaScript to see financing options, or call us at <a href="${tel()}">${t(b.phone)}</a>.</p></noscript>
      </div>
      <script src="https://www.enhancify.com/fullpagewidget/" defer></script>
    </section>
` : ''}
    <section class="section section--warm process" aria-labelledby="fin-steps">
      <div class="container">
${headFrom(c, 'steps', { id: 'fin-steps' })}        <ol class="steps steps--3">${bigSteps(c.steps)}</ol>
      </div>
    </section>
${faqs.length ? `
    <section class="section faq" aria-labelledby="fin-faq">
      <div class="container faq__inner">
${sectionHead({ eyebrow: 'FAQ', title: c.faq_title, accent: c.faq_accent, id: 'fin-faq' })}${faqList(faqs)}      </div>
    </section>
` : ''}`;
  body += ctaBand(c.cta_title);
  return layout({ path: '/financing-options/', title: c.seo_title, description: c.seo_description, active: 'financing', body, preload: c.hero_image, ogImg: c.hero_image, schema: [crumbsLd(['/financing-options/', 'Financing']), ...(faqs.length ? [faqSchema(faqs)] : [])] });
}

/* ---------- FAQ ---------- */
export function faqPage(c) {
  const groups = [
    { key: 'general', label: 'General', items: faqsOf('general'), more: '' },
    ...C.services.map((s) => ({ key: s.slug, label: plain(s.data.short), items: faqsOf(`service:${s.slug}`), more: servicePath(s) })),
  ].filter((g) => g.items.length);
  const tabs = groups.map((g) => `<li><a href="#faq-${esc(g.key)}">${esc(g.label)}</a></li>`).join('');
  const blocks = groups.map((g) => `        <section class="faq-group" id="faq-${esc(g.key)}" aria-labelledby="faq-${esc(g.key)}-h">
          <div class="faq-group__head"><h2 id="faq-${esc(g.key)}-h" class="h3">${esc(g.label)}</h2>${g.more ? `<a class="faq-group__more" href="${g.more}">${esc(g.label)} services ${ARROW}</a>` : ''}</div>
${faqList(g.items, false)}        </section>
`).join('');
  let body = heroFrom(c, [['/faq/', 'FAQ']], { ctas: false });
  body += `
    <section class="section faq" aria-label="Frequently asked questions">
      <div class="container faq-layout">
        <nav class="faq-nav" aria-label="FAQ topics"><ul>${tabs}</ul></nav>
        <div class="faq-groups">
${blocks}        </div>
      </div>
    </section>
`;
  body += ctaBand(c.cta_title, c.cta_text);
  const all = groups.flatMap((g) => g.items);
  return layout({ path: '/faq/', title: c.seo_title, description: c.seo_description, active: 'faq', body, preload: c.hero_image, ogImg: c.hero_image, schema: [crumbsLd(['/faq/', 'FAQ']), ...(all.length ? [faqSchema(all)] : [])] });
}

/* ---------- Contact ---------- */
export function contactPage(c) {
  const b = C.business;
  const mapQ = encodeURIComponent(`${SITE.legalName}, ${address().replace(/,/g, '')}`);
  let body = heroFrom(c, [['/contact-us/', 'Contact']], { ctas: false });
  body += `
    <section class="section" aria-label="Contact form and details">
      <div class="container contact-layout">
        <div class="contact-side">
          <h2 class="h3">${t(c.side_title)}</h2>
          <ul class="contact-cards">
            <li><a class="contact-card" href="${tel()}">${ico('phone', 'contact-card__ico')}<span><strong>Call now</strong>${t(b.phone)}</span></a></li>
            <li><a class="contact-card" href="mailto:${t(b.email)}">${ico('mail', 'contact-card__ico')}<span><strong>Email us</strong>${t(b.email)}</span></a></li>
            <li><a class="contact-card" href="${esc(b.mapsUrl || '#')}" target="_blank" rel="noopener">${ico('pin', 'contact-card__ico')}<span><strong>Visit</strong>${t(address())}</span></a></li>
            ${b.instagram ? `<li><a class="contact-card" href="${esc(instagramUrl())}" target="_blank" rel="noopener">${ico('insta', 'contact-card__ico')}<span><strong>Instagram</strong>@${t(b.instagram)}</span></a></li>` : ''}
          </ul>
          <div class="mini-steps">
            <h2 class="h3">${t(c.next_title)}</h2>
            <ol class="vsteps vsteps--compact">${vsteps(c.next_steps)}</ol>
          </div>
        </div>
        <div class="contact-form">
          ${estimateForm({ formName: 'contact' })}
        </div>
      </div>
    </section>

    <section class="map" aria-label="Map">
      <iframe title="Map showing ${esc(SITE.name)} in ${t(b.city)}, ${t(b.state)}" src="https://www.google.com/maps?q=${mapQ}&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </section>
`;
  return layout({ path: '/contact-us/', title: c.seo_title, description: c.seo_description, active: 'contact', body, preload: c.hero_image, ogImg: c.hero_image, schema: [crumbsLd(['/contact-us/', 'Contact'])] });
}

/* ---------- Service areas ---------- */
export function areasPage(c) {
  const others = (C.global.other_towns || []).map((x) => `<span>${t(x.name)}</span>`).join('');
  const towns = C.areas.map((a) => `<li><a class="tile tile--link" href="${areaPath(a)}"><h3>${t(a.data.label)}</h3>
<p>${t(a.data.region)}. ${md(a.data.lead)}</p><span class="svc__link">${t(a.data.label)} page ${ARROW}</span></a></li>`).join('');
  let body = heroFrom(c, [['/service-areas/', 'Service areas']]);
  body += `
    <section class="section" aria-labelledby="towns-title">
      <div class="container">
${headFrom(c, 'towns', { id: 'towns-title' })}        <ul class="tiles">${towns}</ul>
      </div>
    </section>
${others ? `
    <section class="section section--warm section--tight" aria-labelledby="also-title">
      <div class="container">
        <h2 id="also-title" class="h3">${t(c.also_title)}</h2>
        <p class="lead">${md(c.also_text)}</p>
        <div class="chips">${others}</div>
      </div>
    </section>
` : ''}`;
  body += ctaBand();
  return layout({ path: '/service-areas/', title: c.seo_title, description: c.seo_description, active: 'areas', body, preload: c.hero_image, ogImg: c.hero_image, schema: [crumbsLd(['/service-areas/', 'Service areas'])] });
}

export function areaPage(a) {
  const d = a.data;
  const path = areaPath(a);
  const label = plain(d.label);
  const bySlug = Object.fromEntries(C.areas.map((x) => [x.slug, x]));
  const svcBySlug = Object.fromEntries(C.services.map((x) => [x.slug, x]));
  const faqs = faqsOf(`area:${a.slug}`);
  const review = C.reviews.find((r) => r.area === a.slug);
  const svcTiles = d.services.filter((x) => svcBySlug[x.service]).map((x) => {
    const s = svcBySlug[x.service];
    return `<li><a class="tile tile--link" href="${servicePath(s)}"><h3>${t(s.data.name)}</h3><p>${md(x.text)}</p><span class="svc__link">${t(s.data.short)} in ${esc(label)} ${ARROW}</span></a></li>`;
  }).join('');
  const nearby = d.nearby.filter((n) => bySlug[n.area]).map((n) => `<a href="${areaPath(bySlug[n.area])}">${t(bySlug[n.area].data.label)}</a>`).join('');
  let body = pageHero({ crumbs: [['/service-areas/', 'Service areas'], [path, d.label]], eyebrow: `${plain(d.region)} · ${plain(d.town)}, MA`, title: `${plain(d.h1)},`, accent: d.h1_accent, lead: d.lead, image: d.image, alt: d.image_alt, ctaHref: '#estimate' });
  body += `
    <section class="section" aria-labelledby="ctx-title">
      <div class="container split split--top">
        <div class="split__copy">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Working in ${t(d.town)}</p>
          <h2 id="ctx-title" class="h2">${titled(d.context_title, d.context_accent)}</h2>
          <div class="prose">${paras(d.context)}</div>
        </div>
        <div>
          ${d.watch.length ? `<h2 class="h3">What we check first on ${esc(label)} homes</h2>
          ${checklist(d.watch)}` : ''}
          ${d.note_title || d.note_text ? `<aside class="local-note"><h3>${t(d.note_title)}</h3><p>${md(d.note_text)}</p></aside>` : ''}
        </div>
      </div>
    </section>

${gallery(d.gallery, 'Our work', `in ${label}.`)}${svcTiles ? `
    <section class="section section--warm" aria-labelledby="svc-title">
      <div class="container">
${sectionHead({ eyebrow: 'Services', title: 'What we do', accent: `in ${label}.`, id: 'svc-title' })}        <ul class="tiles">${svcTiles}</ul>
      </div>
    </section>
` : ''}${d.logistics.length ? `
    <section class="section" aria-labelledby="logi-title">
      <div class="container">
${sectionHead({ eyebrow: 'How it works', title: `Jobs in ${label},`, accent: 'planned properly.', id: 'logi-title' })}        <ul class="features features--grid">${features(d.logistics)}</ul>
      </div>
    </section>
` : ''}${review ? `
    <section class="section section--tight" aria-label="Review from ${esc(label)}">
      <div class="container city-review">
${reviewCard(review)}      </div>
    </section>
` : ''}${faqs.length ? `
    <section class="section section--warm faq" aria-labelledby="faq-title">
      <div class="container faq__inner">
${sectionHead({ eyebrow: 'FAQ', title: label, accent: 'questions, answered.', id: 'faq-title' })}${faqList(faqs)}      </div>
    </section>
` : ''}
    <section class="section" aria-labelledby="est-title" id="estimate">
      <div class="container contact-layout">
        <div class="contact-side">
          <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Free estimate</p>
          <h2 id="est-title" class="h2">Planning a project <span class="accent">in ${esc(label)}?</span></h2>
          <p class="lead">Tell us what you need. We'll follow up quickly, set a visit and send an itemized estimate.</p>
          <ul class="contact-cards">
            <li><a class="contact-card" href="${tel()}">${ico('phone', 'contact-card__ico')}<span><strong>Call now</strong>${t(C.business.phone)}</span></a></li>
          </ul>
          ${nearby ? `<h2 class="h3" style="margin-top:32px">Nearby towns we serve</h2>
          <div class="chips">${nearby}<a href="/service-areas/">All service areas</a></div>` : ''}
        </div>
        <div class="contact-form">
          ${estimateForm({ title: `Free estimate in ${label}`, town: label, formName: `area:${a.slug}` })}
        </div>
      </div>
    </section>
`;
  const serviceLdArea = { '@type': 'Service', '@id': `${SITE.url}${path}#service`, name: `Carpentry and exterior repairs in ${plain(d.town)}, MA`, serviceType: 'Finish carpentry',
    provider: { '@id': BIZ_ID() }, url: abs(path), areaServed: plain(d.town).split(' and ').map((x) => ({ '@type': 'City', name: `${x.trim()}, MA` })) };
  return layout({ path, title: d.seo_title, description: d.seo_description, active: 'areas', body, preload: d.image, ogImg: d.image,
    schema: [serviceLdArea, crumbsLd(['/service-areas/', 'Service areas'], [path, d.label]), ...(faqs.length ? [faqSchema(faqs)] : [])] });
}

/* ---------- Legal, thank-you, 404 ---------- */
export function privacyPage(c, renderMarkdown) {
  let body = heroFrom(c, [[URL_OF.privacy, 'Privacy & terms']], { ctas: false });
  body += `
    <section class="section" aria-label="Privacy policy and terms">
      <div class="container legal prose">
        ${renderMarkdown(c.body)}
      </div>
    </section>
`;
  return layout({ path: URL_OF.privacy, title: c.seo_title, description: c.seo_description, active: 'privacy', body, schema: [crumbsLd([URL_OF.privacy, 'Privacy & terms'])] });
}

export function thanksPage(c) {
  const body = `    <section class="section" aria-labelledby="thanks-title">
      <div class="container" style="max-width:760px;text-align:center">
        <p class="eyebrow eyebrow--center"><span class="eyebrow__line" aria-hidden="true"></span>${t(c.eyebrow)}<span class="eyebrow__line" aria-hidden="true"></span></p>
        <h1 id="thanks-title" class="h2">${titled(c.title, c.accent)}</h1>
        <p class="lead">${md(c.lead)}</p>
        <div class="row-btns" style="justify-content:center">
          <a class="btn btn--primary btn--lg" href="${tel()}">${ico('phone')}${t(C.business.phone)}</a>
          <a class="btn btn--outline btn--lg" href="/reviews/">Read our reviews</a>
        </div>
      </div>
    </section>
`;
  return layout({ path: URL_OF.thanks, title: `Thank You | ${SITE.name}`, description: 'Your estimate request was received.', active: 'thanks', body, noindex: true });
}

export function notFoundPage() {
  const links = C.services.map((s) => `<a href="${servicePath(s)}">${t(s.data.short)}</a>`).join('');
  const body = `    <section class="section" aria-labelledby="nf-title">
      <div class="container" style="max-width:820px;text-align:center">
        <p class="eyebrow eyebrow--center"><span class="eyebrow__line" aria-hidden="true"></span>404<span class="eyebrow__line" aria-hidden="true"></span></p>
        <h1 id="nf-title" class="h2">This page <span class="accent">isn't here.</span></h1>
        <p class="lead">It may have moved when we rebuilt the site. Try one of these, or call us at <a href="${tel()}">${t(C.business.phone)}</a>.</p>
        <div class="chips" style="justify-content:center;margin-top:24px"><a href="/">Home</a>${links}<a href="/service-areas/">Service areas</a><a href="/contact-us/">Free estimate</a></div>
      </div>
    </section>
`;
  return layout({ path: '/404.html', title: `Page Not Found | ${SITE.name}`, description: 'This page could not be found.', active: '404', body, noindex: true });
}
