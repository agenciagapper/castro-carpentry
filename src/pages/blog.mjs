// Blog index and article pages. Posts come prepared by preparePost() in src/build-site.mjs.
import { SITE } from '../site.config.mjs';
import { C, esc, t, ico, ARROW, tel, layout, heroFrom, pageHero, sectionHead, ctaBand, postCard, breadcrumbSchema, faqSchema, servicePath, BIZ_ID, abs, imgSrc, fmtDate, plain } from '../lib.mjs';

export function blogIndex(c, posts) {
  let body = heroFrom(c, [['/blog/', 'Blog']], { ctas: false });
  body += `
    <section class="section" aria-label="Articles">
      <div class="container">
        ${posts.length ? `<div class="services__grid">
${posts.map(postCard).join('')}        </div>` : '<p class="lead">New articles are on the way.</p>'}
      </div>
    </section>
`;
  body += ctaBand();
  const blogLd = { '@type': 'Blog', '@id': `${SITE.url}/blog/#blog`, name: `${SITE.name} Blog`, url: abs('/blog/'), publisher: { '@id': BIZ_ID() },
    blogPost: posts.map((p) => ({ '@id': `${SITE.url}/blog/${p.slug}/#article` })) };
  return layout({ path: '/blog/', title: c.seo_title, description: c.seo_description, active: 'blog', body, preload: c.hero_image, ogImg: c.hero_image,
    schema: [blogLd, breadcrumbSchema([['/', 'Home'], ['/blog/', 'Blog']])] });
}

export function blogPost({ post: p, posts }) {
  const s = C.services.find((x) => x.slug === p.service);
  const path = `/blog/${p.slug}/`;
  const related = posts.filter((x) => x.slug !== p.slug).slice(0, 3);
  const date = fmtDate(p.date);
  let body = pageHero({ crumbs: [['/blog/', 'Blog'], [path, p.category || 'Article']], eyebrow: `${p.category ? `${p.category} · ` : ''}${date} · ${p.readingTime} min read`,
    title: p.title, accent: '', lead: p.description, image: p.cover, alt: p.coverAlt, ctas: false });
  body += `
    <section class="section" aria-label="Article">
      <div class="container article-layout">
        <article class="article prose">
${p.html}
          <p class="post-byline">By the ${esc(SITE.name)} team · ${t(C.business.city)}, ${t(C.business.state)} · Published ${date}${p.updated ? ` · Updated ${fmtDate(p.updated)}` : ''}</p>
        </article>
        <aside class="article-aside">
          <div class="aside-card">
            <p class="eyebrow"><span class="eyebrow__line" aria-hidden="true"></span>Free estimate</p>
            <h2 class="h3">${s ? `Need ${esc(plain(s.data.short).toLowerCase())} work?` : 'Planning a project?'}</h2>
            <p>We'll come out, look at it with you and send a clear, itemized estimate.</p>
            <a class="btn btn--primary btn--block" href="/contact-us/">Get a free estimate ${ARROW}</a>
            <a class="btn btn--outline btn--block" href="${tel()}">${ico('phone')}${t(C.business.phone)}</a>
            ${s ? `<a class="aside-card__link" href="${servicePath(s)}">About our ${esc(plain(s.data.name).toLowerCase())} work ${ARROW}</a>` : ''}
          </div>
        </aside>
      </div>
    </section>
${related.length ? `
    <section class="section section--warm" aria-labelledby="more-title">
      <div class="container">
${sectionHead({ eyebrow: 'Keep reading', title: 'More from', accent: 'the blog.', id: 'more-title' })}        <div class="services__grid">
${related.map(postCard).join('')}        </div>
      </div>
    </section>
` : ''}`;
  body += ctaBand();
  const articleLd = {
    '@type': 'BlogPosting', '@id': `${SITE.url}${path}#article`, headline: p.title, description: p.description, datePublished: p.date,
    dateModified: p.updated || p.date, image: abs(imgSrc(p.cover, 1600)), url: abs(path), mainEntityOfPage: abs(path),
    author: { '@id': BIZ_ID() }, publisher: { '@id': BIZ_ID() }, wordCount: p.words,
    ...(s && { about: { '@id': `${SITE.url}${servicePath(s)}#service` } }),
  };
  return layout({ path, title: p.seoTitle || `${p.title} | ${SITE.name}`, description: p.description, active: 'blog', body, preload: p.cover, ogImg: p.cover, ogType: 'article',
    schema: [articleLd, breadcrumbSchema([['/', 'Home'], ['/blog/', 'Blog'], [path, p.title]]), ...(p.faq.length ? [faqSchema(p.faq.map(([question, answer]) => ({ question, answer })))] : [])] });
}
