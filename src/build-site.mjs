// Generates the static site in dist/. Used by `npm run build` (factory content) and by the server after every edit in the panel.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Marked } from 'marked';
import { SITE, FORM, CONTENT_RULES } from './site.config.mjs';
import { slugify, abs, esc, imgSrc, setContext, C, tokens, plain, servicePath, areaPath } from './lib.mjs';
import * as P from './pages/main.mjs';
import { blogIndex, blogPost } from './pages/blog.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
export const DIST = path.join(ROOT, 'dist');
const POSTS_DIR = path.join(ROOT, 'src/blog/posts');

/* Markdown without raw HTML and with safe links only: articles can come from the panel or from an AI. */
const md = new Marked({
  renderer: {
    html: ({ text }) => esc(text),
    link({ href, title, tokens: tk }) {
      const safe = /^(https?:|mailto:|tel:|\/|#)/i.test(href) ? href : '#';
      return `<a href="${esc(safe)}"${title ? ` title="${esc(title)}"` : ''}>${this.parser.parseInline(tk)}</a>`;
    },
    image({ href, title, text }) {
      if (!/^(https:|\/)/i.test(href)) return esc(text);
      return `<img src="${esc(href)}" alt="${esc(text)}"${title ? ` title="${esc(title)}"` : ''} loading="lazy" decoding="async">`;
    },
  },
});
export const renderMarkdown = (src) => md.parse(tokens(src || ''));

function parseFrontMatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('Front matter ausente');
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (/^".*"$/.test(val)) val = JSON.parse(val);
    else if (/^'.*'$/.test(val)) val = val.slice(1, -1);
    if (val === 'true') val = true;
    if (val === 'false') val = false;
    data[key] = val;
  }
  return { data, body: m[2] };
}

/* Posts from the .md files (imported into the database on the first start). */
export function loadMarkdownPosts() {
  return fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md')).map((f) => {
    const { data, body } = parseFrontMatter(fs.readFileSync(path.join(POSTS_DIR, f), 'utf8'));
    return { ...data, slug: f.replace(/\.md$/, ''), body };
  });
}

const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const FAQ_ID = slugify(CONTENT_RULES.faqHeading);

/* Turns a raw post ({ slug, title, date, body, ... }) into what the pages use. */
export function preparePost(raw) {
  let html = md.parse(raw.body || '');
  const toc = [];
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, lvl, inner) => {
    const id = slugify(strip(inner));
    if (lvl === '2') toc.push({ id, text: strip(inner) });
    return `<h${lvl} id="${id}">${inner}</h${lvl}>`;
  });
  html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener"');
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  // "## Frequently asked questions" with ### questions -> FAQPage schema
  const faq = [];
  const faqStart = html.search(new RegExp(`<h2 id="(${FAQ_ID}|faq|frequently-asked-questions)">`));
  if (faqStart >= 0) {
    const seg = html.slice(faqStart).replace(/^<h2[^>]*>.*?<\/h2>/, '');
    const end = seg.search(/<h2/);
    const block = end >= 0 ? seg.slice(0, end) : seg;
    for (const m of block.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3|$)/g)) faq.push([strip(m[1]), strip(m[2])]);
  }
  const { body, ...data } = raw;
  const words = strip(html).split(/\s+/).length;
  return { ...data, html, toc, faq, words, readingTime: Math.max(2, Math.round(words / 220)) };
}

const AI_CRAWLERS = ['Googlebot', 'Bingbot', 'Applebot', 'DuckDuckBot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Amazonbot', 'Meta-ExternalAgent', 'DuckAssistBot', 'MistralAI-User', 'CCBot'];

function robots() {
  const rules = 'Allow: /\nDisallow: /thank-you/\nDisallow: /api/\nDisallow: /admin/\nDisallow: /mcp\n';
  return `# ${new URL(SITE.url).host}: open to search engines and AI assistants.\n# Summary for language models: /llms.txt\n\n${
    AI_CRAWLERS.map((b) => `User-agent: ${b}\n`).join('')}${rules}\nUser-agent: *\n${rules}\nSitemap: ${abs('/sitemap.xml')}\n`;
}

function llms(posts) {
  const b = C.business;
  return [
    `# ${SITE.name}`, '',
    `> Finish carpentry and exterior repair contractor based in ${b.city}, Massachusetts, serving all of Cape Cod (from Sandwich to Provincetown) and Plymouth since ${SITE.foundingDate}. Licensed (HIC/CSL) and insured in MA, BBB accredited, rated ${b.rating} stars on Google (${b.reviewCount} reviews). Free on-site estimates.`, '',
    `- Phone: ${b.phone}`, `- Email: ${b.email}`, `- Address: ${b.street}, ${b.city}, ${b.state} ${b.zip}`, `- Founder: ${SITE.founder}`, `- Free estimate: ${abs('/contact-us/')}`, '',
    '## Services', '',
    ...C.services.map((s) => `- [${plain(s.data.name)}](${abs(servicePath(s))}): ${plain(s.data.summary)}`), '',
    '## Service areas', '',
    ...C.areas.map((a) => `- [${plain(a.data.label)}, MA](${abs(areaPath(a))}): ${plain(a.data.lead)}`),
    ...((C.global.other_towns || []).length ? [`- Also serving: ${C.global.other_towns.map((x) => plain(x.name)).join(', ')}.`] : []), '',
    '## Guides', '',
    ...posts.map((p) => `- [${p.title}](${abs(`/blog/${p.slug}/`)}): ${p.description}`), '',
    '## Company', '',
    `- [About](${abs('/about-us/')})`, `- [How estimates work](${abs('/process/')})`, `- [Reviews](${abs('/reviews/')})`, `- [Financing](${abs('/financing-options/')})`, `- [FAQ](${abs('/faq/')})`, '',
  ].join('\n');
}

const hash = (files) => crypto.createHash('sha256').update(files.map((f) => fs.readFileSync(f)).join('')).digest('hex').slice(0, 10);

/* Builds into a temporary folder and swaps it in at the end, so the site is never served half-built.
   ctx: { business, pages, services, areas, faqs, reviews, rawPosts, tracking, instagram, misc } */
export function buildSite(ctx) {
  const OUT = `${DIST}.tmp`;
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const write = (rel, content) => {
    const file = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };

  const posts = (ctx.rawPosts || loadMarkdownPosts()).map(preparePost).sort((a, b) => b.date.localeCompare(a.date) || b.title.localeCompare(a.title));
  setContext({
    ...ctx,
    global: ctx.pages.global,
    faqs: ctx.faqs.filter((f) => f.active),
    reviews: ctx.reviews.filter((r) => r.active),
    serviceOptions: [...ctx.services.map((s) => plain(s.data.name)), ...FORM.extraServices],
    timeframes: FORM.timeframes,
    assetVersion: hash([path.join(ROOT, 'src/css/styles.css'), path.join(ROOT, 'src/js/main.js'), path.join(ROOT, 'src/js/tracking.js')]),
  });
  const pg = ctx.pages;

  const pages = {
    '/': P.home(pg.home),
    '/services/': P.servicesPage(pg.services),
    '/about-us/': P.aboutPage(pg.about),
    '/process/': P.processPage(pg.process),
    '/reviews/': P.reviewsPage(pg.reviews),
    '/financing-options/': P.financingPage(pg.financing),
    '/faq/': P.faqPage(pg.faq),
    '/contact-us/': P.contactPage(pg.contact),
    '/service-areas/': P.areasPage(pg.areas),
    '/terms-of-service-privacy-policy/': P.privacyPage(pg.privacy, renderMarkdown),
  };
  for (const s of C.services) pages[servicePath(s)] = P.servicePage(s);
  for (const a of C.areas) pages[areaPath(a)] = P.areaPage(a);
  pages['/blog/'] = blogIndex(pg.blog, posts);
  for (const p of posts) pages[`/blog/${p.slug}/`] = blogPost({ post: p, posts });
  const indexable = Object.keys(pages);
  pages['/thank-you/'] = P.thanksPage(pg.thanks);

  for (const [p, html] of Object.entries(pages)) write(p === '/' ? 'index.html' : `${p.replace(/^\/|\/$/g, '')}/index.html`, html);
  write('404.html', P.notFoundPage());

  const today = new Date().toISOString().slice(0, 10);
  const lastmod = (p) => (p.startsWith('/blog/') && p !== '/blog/' ? (posts.find((x) => `/blog/${x.slug}/` === p)?.updated || posts.find((x) => `/blog/${x.slug}/` === p)?.date) : today);
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map((p) => `  <url><loc>${abs(p)}</loc><lastmod>${lastmod(p)}</lastmod></url>`).join('\n')}
</urlset>
`);
  write('robots.txt', robots());
  write('llms.txt', llms(posts));
  write('blog/feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(SITE.name)} Blog</title>
<link>${abs('/blog/')}</link>
<atom:link href="${abs('/blog/feed.xml')}" rel="self" type="application/rss+xml"/>
<description>${esc(SITE.description)}</description>
<language>en-us</language>
${posts.map((p) => `<item><title>${esc(p.title)}</title><link>${abs(`/blog/${p.slug}/`)}</link><guid>${abs(`/blog/${p.slug}/`)}</guid><pubDate>${new Date(`${p.date}T12:00:00-05:00`).toUTCString()}</pubDate><category>${esc(p.category)}</category><description>${esc(p.description)}</description></item>`).join('\n')}
</channel>
</rss>
`);

  /* Static files */
  fs.cpSync(path.join(ROOT, 'public'), OUT, { recursive: true });
  fs.cpSync(path.join(ROOT, 'src/css'), path.join(OUT, 'css'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'src/js'), path.join(OUT, 'js'), { recursive: true });
  write('css/theme.css', ':root { --primary: #004d93; --accent: #00305c; }\n');

  const OLD = `${DIST}.old`;
  fs.rmSync(OLD, { recursive: true, force: true });
  if (fs.existsSync(DIST)) fs.renameSync(DIST, OLD);
  fs.renameSync(OUT, DIST);
  fs.rmSync(OLD, { recursive: true, force: true });

  return { pages: Object.keys(pages).length + 1, posts: posts.length, paths: indexable };
}

export { imgSrc };
