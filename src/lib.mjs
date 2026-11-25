// Layout and building blocks of the public site (ported from the old _build/build.py).
// The server relies on these exports: esc, slugify, registerImages, hasImage, builtinImageIds, layout.
// Everything that comes from the database goes through esc() / md() before it reaches the HTML.
import fs from 'node:fs';
import path from 'node:path';
import { SITE } from './site.config.mjs';

const manifest = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'img-manifest.json'), 'utf8'));

export const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const abs = (p) => SITE.url + p;
export const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/<[^>]+>/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const fmtDate = (d) => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`));
/* JSON inside <script>: escapes < > & and line separators so no text can close the tag. */
export const jsonForScript = (v) => JSON.stringify(v).replace(/[<>&\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

/* ---------- Build context (business data, global texts) set once per build ---------- */
export const C = { business: {}, global: {}, services: [], areas: [], tracking: null, instagram: false };
export const setContext = (ctx) => Object.assign(C, ctx);

const digits = (s) => String(s || '').replace(/\D/g, '');
export const tel = () => `tel:+1${digits(C.business.phone).slice(-10)}`;
export const address = () => `${C.business.street}, ${C.business.city}, ${C.business.state} ${C.business.zip}`;
export const instagramUrl = () => (C.business.instagram ? `https://www.instagram.com/${C.business.instagram}/` : '');

/* {{phone}}, {{email}}, {{rating}}, {{reviews}}, {{business}} in any editable text. */
export const tokens = (t) => String(t ?? '').replace(/\{\{(phone|email|rating|reviews|business)\}\}/g, (_, k) => ({
  phone: C.business.phone, email: C.business.email, rating: C.business.rating, reviews: C.business.reviewCount, business: SITE.name,
}[k]));

/* Plain text from the database, escaped. */
export const t = (s) => esc(tokens(s));
/* Short Markdown: **bold**, *italic* and [text](url) with safe URLs only. */
const safeHref = (u) => (/^(https?:|mailto:|tel:|\/|#)/i.test(u) ? u : '#');
export const md = (s) => esc(tokens(s))
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*])\*([^*\n]+?)\*/g, '$1<em>$2</em>')
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const h = safeHref(href.replace(/&amp;/g, '&'));
    const ext = /^https?:/i.test(h) ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${esc(h)}"${ext}>${label}</a>`;
  });
/* Paragraphs separated by blank lines. */
export const paras = (s) => String(s || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${md(p).replace(/\n/g, '<br>')}</p>`).join('');
/* Title + italic accent line. */
export const titled = (title, accent, cls = 'accent') => `${t(title)}${accent ? ` <span class="${cls}">${t(accent)}</span>` : ''}`;
export const plain = (s) => tokens(s).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

/* ---------- Images (manifest from npm run images; panel uploads are registered before each build) ---------- */
export const registerImages = (entries) => Object.assign(manifest, entries);
export const hasImage = (id) => Boolean(manifest[id]);
export const builtinImageIds = Object.keys(manifest);

export function imgSrc(id, w = 1200) {
  const m = manifest[id];
  if (!m) return '/img/og-padrao.jpg';
  const best = m.widths.find((x) => x >= w) || m.widths.at(-1);
  return `/img/${id}-${best}.webp`;
}
export const imgSet = (id) => manifest[id].widths.map((w) => `/img/${id}-${w}.webp ${w}w`).join(', ');
export const ogImage = (id) => (manifest[id] ? `/img/${id}-og.jpg` : '/img/og-padrao.jpg');

export function img(id, alt, { sizes = '(max-width: 760px) 100vw, 50vw', cls = '', eager = false, priority = false } = {}) {
  const m = manifest[id];
  if (!m) return '';
  return `<img${cls ? ` class="${cls}"` : ''} src="${imgSrc(id, 1200)}" srcset="${imgSet(id)}" sizes="${sizes}" width="${m.w}" height="${m.h}" alt="${t(alt)}"${eager ? '' : ' loading="lazy"'} decoding="async"${priority ? ' fetchpriority="high"' : ''}>`;
}

/* ---------- Icons ---------- */
export const ico = (name, cls = 'ico') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
export const ARROW = ico('arrow');

const SPRITE = `
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
</svg>`;

/* ---------- URLs ---------- */
export const URL_OF = {
  home: '/', services: '/services/', about: '/about-us/', contact: '/contact-us/', financing: '/financing-options/', process: '/process/',
  reviews: '/reviews/', faq: '/faq/', areas: '/service-areas/', blog: '/blog/', privacy: '/terms-of-service-privacy-policy/', thanks: '/thank-you/',
};
export const servicePath = (s) => `/${s.slug}/`;
export const areaPath = (a) => `/service-areas/${a.slug}/`;

/* ---------- Schema.org ---------- */
export const BIZ_ID = () => `${SITE.url}/#business`;
export function businessSchema() {
  const b = C.business;
  const towns = C.misc?.towns_served || [];
  return {
    '@type': SITE.schemaType, '@id': BIZ_ID(), name: SITE.name, legalName: SITE.legalName, url: `${SITE.url}/`,
    logo: `${SITE.url}/assets/logos/logo-castro-azul-400.png`, image: `${SITE.url}/img/og-padrao.jpg`,
    telephone: `+1-${digits(b.phone).slice(-10).replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')}`, email: b.email,
    address: { '@type': 'PostalAddress', streetAddress: b.street, addressLocality: b.city, addressRegion: b.state, postalCode: b.zip, addressCountry: 'US' },
    areaServed: [...towns.map((n) => ({ '@type': 'City', name: `${n}, MA` })), { '@type': 'Place', name: 'Cape Cod, MA' }],
    ...(b.lat && b.lng && { geo: { '@type': 'GeoCoordinates', latitude: +b.lat, longitude: +b.lng } }),
    ...(b.mapsUrl && { hasMap: b.mapsUrl }),
    founder: { '@type': 'Person', name: SITE.founder }, foundingDate: SITE.foundingDate,
    sameAs: [instagramUrl()].filter(Boolean),
  };
}
export const breadcrumbSchema = (crumbs) => ({
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map(([p, name], i) => ({ '@type': 'ListItem', position: i + 1, name: plain(name), item: abs(p) })),
});
export const faqSchema = (items) => ({
  '@type': 'FAQPage',
  mainEntity: items.map((f) => ({ '@type': 'Question', name: plain(f.question), acceptedAnswer: { '@type': 'Answer', text: plain(f.answer) } })),
});

/* ---------- Header and footer ---------- */
const NAV = [['services', 'Services'], ['about', 'About'], ['reviews', 'Reviews'], ['financing', 'Financing'], ['faq', 'FAQ'], ['blog', 'Blog'], ['contact', 'Contact']];

function header(active) {
  const b = C.business;
  const items = NAV.map(([key, label]) => {
    const cur = key === active ? ' aria-current="page"' : '';
    if (key !== 'services') return `<li><a href="${URL_OF[key]}"${cur}>${label}</a></li>`;
    const sub = C.services.map((s) => `<li><a href="${servicePath(s)}"${active === `service:${s.slug}` ? ' aria-current="page"' : ''}>${t(s.data.short)}</a></li>`).join('');
    const inSec = active?.startsWith('service:') ? 'is-section' : '';
    return `<li class="has-sub"><a href="/services/" class="${inSec}"${cur}>${label}${ico('chev', 'ico chev')}</a><ul class="sub" aria-label="Services">${sub}</ul></li>`;
  }).join('\n          ');
  return `  <a class="skip-link" href="#main">Skip to content</a>

  <div class="topbar">
    <div class="container topbar__inner">
      <p class="topbar__msg">${t(C.global.topbar)}</p>
      <div class="topbar__links">
        <a href="${tel()}">${ico('phone')}${t(b.phone)}</a>
        <a href="mailto:${t(b.email)}" class="hide-sm">${ico('mail')}${t(b.email)}</a>
      </div>
    </div>
  </div>

  <header class="header" id="top">
    <div class="container header__inner">
      <a href="/" class="brand" aria-label="${esc(SITE.name)}, home">
        <img src="/assets/logos/logo-castro-azul-400.png" alt="" width="56" height="56">
        <span class="brand__text"><strong>Castro</strong><span>Finish Carpentry</span></span>
      </a>

      <nav class="nav" id="site-nav" aria-label="Main">
        <ul>
          ${items}
        </ul>
        <a class="btn btn--primary nav__cta-mobile" href="/contact-us/">Get a free estimate</a>
      </nav>

      <div class="header__actions">
        <a class="header__phone" href="${tel()}">
          <span class="header__phone-label">Call now</span>
          <span class="header__phone-num">${t(b.phone)}</span>
        </a>
        <a class="btn btn--primary hide-md" href="/contact-us/">${t(C.global.cta_label)}</a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>
`;
}

function footer() {
  const b = C.business;
  const g = C.global;
  const svc = C.services.map((s) => `<li><a href="${servicePath(s)}">${t(s.data.name)}</a></li>`).join('\n          ');
  const areaLinks = C.areas.map((a) => `<a href="${areaPath(a)}">${t(a.data.label)}</a>`).join(' ');
  return `
  <footer class="footer">
    <div class="container footer__grid">
      <div class="footer__brand">
        <img src="/assets/logos/logo-castro-azul-adesivo-400.png" alt="Castro Carpentry logo" width="96" height="97">
        <p class="footer__quote">“${t(g.footer_quote)}”</p>
        <p class="footer__sig">${t(g.footer_signature)}</p>
      </div>
      <nav aria-label="Services">
        <h2 class="footer__h">Services</h2>
        <ul>
          ${svc}
        </ul>
      </nav>
      <nav aria-label="Company">
        <h2 class="footer__h">Company</h2>
        <ul>
          <li><a href="/about-us/">About us</a></li>
          <li><a href="/process/">How it works</a></li>
          <li><a href="/reviews/">Reviews</a></li>
          <li><a href="/financing-options/">Financing</a></li>
          <li><a href="/faq/">FAQ</a></li>
          <li><a href="/service-areas/">Service areas</a></li>
          <li><a href="/blog/">Blog</a></li>
          <li><a href="/contact-us/">Contact</a></li>
        </ul>
      </nav>
      <div>
        <h2 class="footer__h">Contact</h2>
        <ul class="footer__contact">
          <li>${ico('phone')}<a href="${tel()}">${t(b.phone)}</a></li>
          <li>${ico('mail')}<a href="mailto:${t(b.email)}">${t(b.email)}</a></li>
          <li>${ico('pin')}${b.mapsUrl ? `<a href="${esc(b.mapsUrl)}" target="_blank" rel="noopener">${t(address())}</a>` : t(address())}</li>
          ${b.instagram ? `<li>${ico('insta')}<a href="${esc(instagramUrl())}" target="_blank" rel="noopener">@${t(b.instagram)}</a></li>` : ''}
        </ul>
      </div>
    </div>
    <nav class="container footer__areas" aria-label="Service areas">
      <a href="/service-areas/"><strong>Service areas:</strong></a>
      ${areaLinks}
    </nav>
    <div class="container footer__bottom">
      <p>© <span id="year">${SITE.year}</span> ${esc(SITE.legalName)} · ${t(g.footer_legal)} · <a href="${URL_OF.privacy}">Privacy &amp; terms</a>${C.tracking?.consent ? ' · <button class="link-plain" type="button" data-cookie-prefs>Cookie preferences</button>' : ''}</p>
      <a href="#top">Back to top ↑</a>
    </div>
  </footer>

  <div class="callbar">
    <a class="btn btn--light" href="${tel()}">${ico('phone')}Call</a>
    <a class="btn btn--primary" href="/contact-us/">Free estimate</a>
  </div>
`;
}

/* ---------- Tracking (configured in the panel; C.tracking holds only public IDs) ---------- */
function trackingHead() {
  const tr = C.tracking;
  if (!tr) return '';
  const { headScripts, bodyScripts, ...ids } = tr;
  const extra = headScripts ? (tr.consent ? `<template data-consent-scripts="head">${headScripts}</template>` : headScripts) : '';
  return `
  <script type="application/json" id="site-tracking">${jsonForScript(ids)}</script>
  <script src="/js/tracking.js?v=${C.assetVersion || ''}"></script>
  ${extra}`;
}

function trackingBody() {
  const tr = C.tracking;
  if (!tr) return '';
  const extra = tr.bodyScripts ? (tr.consent ? `<template data-consent-scripts="body">${tr.bodyScripts}</template>` : tr.bodyScripts) : '';
  const banner = tr.consent ? `<div class="cookie-banner" data-cookie-banner role="dialog" aria-label="Cookie notice" hidden>
    <p>We use cookies to measure visits and the results of our ads. You can accept or decline. More in our <a href="${URL_OF.privacy}">privacy policy</a>.</p>
    <div class="cookie-banner__actions"><button class="btn btn--primary" type="button" data-consent="granted">Accept</button><button class="btn btn--outline" type="button" data-consent="denied">Decline</button></div>
  </div>` : '';
  return `${extra}\n${banner}`;
}

/* ---------- Page layout ---------- */
export function layout({ path: p, title, description, active, body, preload = '', schema = [], noindex = false, ogType = 'website', ogImg = '' }) {
  const canonical = abs(p);
  const pre = preload && manifest[preload]
    ? `\n  <link rel="preload" as="image" href="${imgSrc(preload, 1200)}" imagesrcset="${imgSet(preload)}" imagesizes="100vw" fetchpriority="high">` : '';
  const graph = { '@context': 'https://schema.org', '@graph': [businessSchema(), ...schema] };
  const T = t(title);
  const D = t(description);
  const v = C.assetVersion || '';
  return `<!DOCTYPE html>
<html lang="${SITE.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${T}</title>
  <meta name="description" content="${D}">${noindex ? '\n  <meta name="robots" content="noindex, follow">' : `\n  <link rel="canonical" href="${canonical}">`}
  <meta name="theme-color" content="#004d93">
  <meta property="og:site_name" content="${esc(SITE.name)}">
  <meta property="og:locale" content="${SITE.locale}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:title" content="${T}">
  <meta property="og:description" content="${D}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${abs(ogImg ? ogImage(ogImg) : '/img/og-padrao.jpg')}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/logos/icon-192.png">
  <link rel="apple-touch-icon" href="/assets/logos/apple-touch-icon.png">
  <link rel="alternate" type="application/rss+xml" title="Blog" href="/blog/feed.xml">
  <link rel="preload" href="/assets/fonts/Jost-Variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/Poppins-Regular.woff2" as="font" type="font/woff2" crossorigin>${pre}
  <link rel="stylesheet" href="/css/styles.css?v=${v}">
  <script type="application/ld+json">${jsonForScript(graph)}</script>${trackingHead()}
</head>
<body>
${header(active)}
  <main id="main">
${body}
  </main>
${footer()}${SPRITE}
  <script src="/js/main.js?v=${v}" defer></script>
${trackingBody()}
</body>
</html>
`;
}

/* ---------- Shared blocks ---------- */
export function pageHero({ crumbs, eyebrow, title, accent, lead, image, alt, ctas = true, ctaHref = '/contact-us/' }) {
  const trail = ['<li><a href="/">Home</a></li>', ...crumbs.slice(0, -1).map(([href, label]) => `<li><a href="${href}">${t(label)}</a></li>`),
    `<li aria-current="page">${t(crumbs.at(-1)[1])}</li>`].join('');
  const buttons = ctas ? `
          <div class="hero__ctas">
            <a class="btn btn--primary btn--lg" href="${ctaHref}">Get a free estimate ${ARROW}</a>
            <a class="btn btn--ghost-light btn--lg" href="${tel()}">${ico('phone')}${t(C.business.phone)}</a>
          </div>` : '';
  return `    <section class="page-hero" aria-labelledby="page-title">
      ${img(image, alt, { cls: 'page-hero__bg', sizes: '100vw', eager: true, priority: true })}
      <div class="page-hero__shade" aria-hidden="true"></div>
      <div class="container page-hero__inner">
        <nav aria-label="Breadcrumb"><ol class="crumbs">${trail}</ol></nav>
        <p class="eyebrow eyebrow--light"><span class="eyebrow__line" aria-hidden="true"></span>${t(eyebrow)}</p>
        <h1 id="page-title" class="page-hero__title">${titled(title, accent, 'page-hero__accent')}</h1>
        ${lead ? `<p class="page-hero__lead">${md(lead)}</p>` : ''}${buttons}
      </div>
    </section>
`;
}

/* Hero from a page's standard hero_* fields. */
export const heroFrom = (c, crumbs, o = {}) => pageHero({ crumbs, eyebrow: c.hero_eyebrow, title: c.hero_title, accent: c.hero_accent, lead: c.hero_lead, image: c.hero_image, alt: c.hero_image_alt, ...o });

export function sectionHead({ eyebrow, title, accent, lead = '', center = true, light = false, id = '' }) {
  const c = center ? ' section-head--center' : '';
  const ec = center ? ' eyebrow--center' : '';
  const el = light ? ' eyebrow--light' : '';
  const tail = center ? '<span class="eyebrow__line" aria-hidden="true"></span>' : '';
  return `        <header class="section-head${c}">
          ${eyebrow ? `<p class="eyebrow${ec}${el}"><span class="eyebrow__line" aria-hidden="true"></span>${t(eyebrow)}${tail}</p>` : ''}
          <h2${id ? ` id="${id}"` : ''} class="h2${light ? ' h2--light' : ''}">${titled(title, accent, light ? 'accent accent--light' : 'accent')}</h2>${lead ? `\n          <p class="lead${light ? ' lead--light' : ''}">${md(lead)}</p>` : ''}
        </header>
`;
}
/* Section head from prefixed fields: { x_eyebrow, x_title, x_accent, x_lead }. */
export const headFrom = (c, prefix, o = {}) => sectionHead({ eyebrow: c[`${prefix}_eyebrow`], title: c[`${prefix}_title`], accent: c[`${prefix}_accent`], lead: c[`${prefix}_lead`], ...o });

export function ctaBand(title = C.global.cta_title, text = C.global.cta_text) {
  return `    <section class="cta-band" aria-label="Get a free estimate">
      <div class="container cta-band__inner">
        <img src="/assets/logos/logo-castro-azul-adesivo-400.png" alt="" width="96" height="97" class="cta-band__seal">
        <div class="cta-band__copy">
          <h2 class="h2 h2--light">${t(title || C.global.cta_title)}</h2>
          <p>${md(text || C.global.cta_text)}</p>
        </div>
        <div class="cta-band__btns">
          <a class="btn btn--light btn--lg" href="/contact-us/">Get a free estimate ${ARROW}</a>
          <a class="btn btn--ghost-light btn--lg" href="${tel()}">${ico('phone')}${t(C.business.phone)}</a>
        </div>
      </div>
    </section>
`;
}

export function faqList(items, firstOpen = true) {
  if (!items.length) return '';
  return `        <div class="faq__list">\n${items.map((f, i) => `          <details class="qa"${firstOpen && i === 0 ? ' open' : ''}>
            <summary>${t(f.question)}${ico('plus')}</summary>
            ${paras(f.answer)}
          </details>`).join('\n')}\n        </div>\n`;
}

export const checklist = (rows, light = false) => (rows?.length
  ? `<ul class="checklist${light ? ' checklist--light' : ''}">${rows.map((r) => `<li>${ico('check')}<span>${md(r.text)}</span></li>`).join('')}</ul>` : '');

export const badges = () => `        <ul class="badges" aria-label="Credentials">
${(C.global.badges || []).map((b) => `          <li class="badge">${ico(b.icon || 'check', 'badge__ico')}<div><h3>${t(b.title)}</h3><p>${md(b.text)}</p></div></li>`).join('\n')}
        </ul>
`;

export const tiles = (rows) => rows.map((r) => `<li class="tile"><h3>${t(r.title)}</h3><p>${md(r.text)}</p></li>`).join('');
export const features = (rows, icon = 'check') => rows.map((r) => `<li class="feature"><span class="feature__ico">${ico(r.icon || icon)}</span><div><h3>${t(r.title)}</h3><p>${md(r.text)}</p></div></li>`).join('');
export const vsteps = (rows) => rows.map((r, i) => `<li class="vstep"><span class="vstep__num">${String(i + 1).padStart(2, '0')}</span><div><h3>${t(r.title)}</h3><p>${md(r.text)}</p></div></li>`).join('');
export const bigSteps = (rows) => rows.map((r, i) => `<li class="step"><span class="step__num">${String(i + 1).padStart(2, '0')}</span><h3 class="step__title">${t(r.title)}</h3><p>${md(r.text)}</p></li>`).join('');

export function svcCard(s, linkLabel = 'Learn more') {
  return `          <article class="svc">
            <div class="svc__media">${img(s.data.image, s.data.image_alt, { sizes: '(max-width: 760px) 100vw, 33vw' })}</div>
            <div class="svc__body">
              <h3 class="svc__title">${t(s.data.name)}</h3>
              <p>${md(s.data.summary)}</p>
              <a class="svc__link" href="${servicePath(s)}">${linkLabel} ${ARROW}</a>
            </div>
          </article>
`;
}

export function gallery(rows, title, accent, eyebrow = 'Recent work') {
  const items = (rows || []).filter((r) => hasImage(r.image));
  if (!items.length) return '';
  const figs = items.map((r) => `<figure class="gallery__item">${img(r.image, r.caption, { sizes: '(max-width: 760px) 100vw, 33vw' })}<figcaption>${t(r.caption)}</figcaption></figure>`).join('');
  return `
    <section class="section section--tight" aria-label="${esc(plain(`${title} ${accent}`))}">
      <div class="container">
${sectionHead({ eyebrow, title, accent })}        <div class="gallery">${figs}</div>
      </div>
    </section>
`;
}

export const areasChips = () => `<div class="chips">${C.areas.map((a) => `<a href="${areaPath(a)}">${t(a.data.label)}</a>`).join('')}<a href="/service-areas/">All service areas →</a></div>`;

const initials = (name) => String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
export function reviewCard(r, bordered = true) {
  const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
  return `          <figure class="review${bordered ? ' review--bordered' : ''}">
            <div class="review__top"><span class="avatar" aria-hidden="true">${esc(initials(r.name))}</span><div><p class="review__name">${t(r.name)}</p><p class="review__meta">${t(r.project)}</p></div></div>
            <p class="stars" aria-label="${r.rating || 5} out of 5 stars">${stars}</p>
            <blockquote class="review__text"><p>“${t(r.text)}”</p></blockquote>
          </figure>
`;
}

export function postCard(p) {
  return `          <article class="svc">
            <div class="svc__media">${img(p.cover, p.coverAlt, { sizes: '(max-width: 760px) 100vw, 33vw' })}</div>
            <div class="svc__body">
              <p class="post-meta">${esc(p.category)} · ${fmtDate(p.date)}</p>
              <h3 class="svc__title"><a class="post-card__link" href="/blog/${esc(p.slug)}/">${esc(p.title)}</a></h3>
              <p>${esc(p.description)}</p>
              <a class="svc__link" href="/blog/${esc(p.slug)}/" aria-hidden="true" tabindex="-1">Read article ${ARROW}</a>
            </div>
          </article>
`;
}

/* ---------- Estimate form ----------
   Posts to /api/leads. Field names are the contract with server/leads.mjs:
   name, phone, email, town, service, timeframe, message, page/attribution fields, honeypots, form_token, pow, tz, lang. */
export function estimateForm({ title, button, note, town = '', formName = 'estimate' } = {}) {
  const home = C.pages?.home || {};
  const opts = (arr) => arr.map((o) => `<option>${esc(o)}</option>`).join('');
  const hidden = ['form_token', 'pow', 'tz', 'lang', 'page_url', 'landing_page', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'fbp', 'fbc', 'event_id', 'consent']
    .map((n) => `<input type="hidden" name="${n}" value="">`).join('\n          ');
  return `<form class="form" id="estimate-form" action="/api/leads" method="POST" novalidate>
          <!-- Anti-spam: honeypots (people never see or fill these), signed token, proof-of-work. See server/leads.mjs -->
          <div class="hp" aria-hidden="true" style="position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden">
            <label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label>
            <label>Company <input type="text" name="company" tabindex="-1" autocomplete="off"></label>
            <label>Fax <input type="text" name="fax" tabindex="-1" autocomplete="off"></label>
            <label><input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off"> I am a robot</label>
          </div>
          <input type="hidden" name="form" value="${esc(formName)}">
          ${hidden}

          <h3 class="form__title">${t(title || home.form_title)}</h3>

          <div class="form__row">
            <div class="field">
              <label for="f-name">Full name</label>
              <input id="f-name" name="name" type="text" autocomplete="name" required>
              <p class="field__err" id="f-name-err"></p>
            </div>
            <div class="field">
              <label for="f-phone">Phone</label>
              <input id="f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required>
              <p class="field__err" id="f-phone-err"></p>
            </div>
          </div>
          <div class="form__row">
            <div class="field">
              <label for="f-email">Email</label>
              <input id="f-email" name="email" type="email" autocomplete="email" required>
              <p class="field__err" id="f-email-err"></p>
            </div>
            <div class="field">
              <label for="f-town">Town or ZIP</label>
              <input id="f-town" name="town" type="text" autocomplete="postal-code" required${town ? ` value="${t(town)}"` : ''}>
              <p class="field__err" id="f-town-err"></p>
            </div>
          </div>
          <div class="form__row">
            <div class="field">
              <label for="f-service">Service</label>
              <select id="f-service" name="service" required>
                <option value="">Choose a service</option>
                ${opts(C.serviceOptions || [])}
              </select>
              <p class="field__err" id="f-service-err"></p>
            </div>
            <div class="field">
              <label for="f-time">Timeframe <span class="opt">(optional)</span></label>
              <select id="f-time" name="timeframe">
                <option value="">Select</option>
                ${opts(C.timeframes || [])}
              </select>
            </div>
          </div>
          <div class="field">
            <label for="f-msg">Project details <span class="opt">(optional)</span></label>
            <textarea id="f-msg" name="message" rows="4" placeholder="e.g. Rotted trim around two windows, about 20 ft of fascia"></textarea>
          </div>

          <button class="btn btn--primary btn--lg btn--block" type="submit">${t(button || home.form_button)} ${ARROW}</button>
          <p class="form__status" role="status" aria-live="polite"></p>
          <p class="form__note">${md(note || home.form_note)}</p>
        </form>`;
}
