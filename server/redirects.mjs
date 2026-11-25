// What the old .htaccess did, now in Express: www -> bare domain, old WordPress and .html URLs (301),
// removed WordPress pages and probes (410), and bots posting to the API.
import { PUBLIC_URL } from './env.mjs';

const REDIRECTS_301 = [
  [/^\/home\/?$/, '/'],
  [/^\/sitemap_index\.xml$/, '/sitemap.xml'],
  [/^\/(page|post)-sitemap\.xml$/, '/sitemap.xml'],
  [/^\/contact\/?$/, '/contact-us/'],
  [/^\/about\/?$/, '/about-us/'],
  [/^\/financing\/?$/, '/financing-options/'],
  [/^\/decks\/?$/, '/decking/'],
  [/^\/windows-doors\/?$/, '/windows-and-doors/'],
  [/^\/privacy-policy\/?$/, '/terms-of-service-privacy-policy/'],
  [/^\/index\.html$/, '/'],
  [/^\/decks\.html$/, '/decking/'],
  [/^\/windows-doors\.html$/, '/windows-and-doors/'],
  [/^\/about\.html$/, '/about-us/'],
  [/^\/contact\.html$/, '/contact-us/'],
  [/^\/financing\.html$/, '/financing-options/'],
  [/^\/(services|trim|siding|roofing|process|reviews|faq|adu)\.html$/, '/$1/'],
];

const GONE_410 = [
  /^\/(wp-login\.php|wp-admin|wp-content|wp-includes|wp-config\.php|\.env|xmlrpc\.php)(\/|$)/,
  /^\/hello-world\/?$/, /^\/category\/.*$/, /^\/author\/.*$/, /^\/feed\/?$/, /^\/comments\/feed\/?$/, /^\/wp-json\/.*$/,
  /^\/(wpr_templates|category|author)-sitemap\.xml$/,
];

const BOT_UA = /^$|curl|python|wget|libwww|httpclient|go-http|java\/|scrapy/i;
const publicHost = (() => { try { return new URL(PUBLIC_URL).host; } catch { return ''; } })();

export function legacyRedirects(req, res, next) {
  const host = req.get('host') || '';
  if (publicHost && !publicHost.startsWith('www.') && host === `www.${publicHost}`) return res.redirect(301, `${PUBLIC_URL}${req.originalUrl}`);
  const p = req.path;
  if (req.method === 'POST' && p.startsWith('/api/') && BOT_UA.test(req.get('user-agent') || '')) return res.status(403).end();
  if (GONE_410.some((re) => re.test(p))) return res.status(410).type('text').send('Gone');
  if (p === '/' && /(^|&)(wpr_templates|p|page_id)=/i.test(String(req.originalUrl.split('?')[1] || ''))) return res.status(410).type('text').send('Gone');
  for (const [re, to] of REDIRECTS_301) if (re.test(p)) return res.redirect(301, p.replace(re, to));
  next();
}
