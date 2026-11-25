// Connects the panel to the site: reads everything from the database and regenerates dist/.
import { buildSite } from '../src/build-site.mjs';
import { setSetting } from './db.mjs';
import { registerImages } from '../src/lib.mjs';
import { uploadedManifest } from './images.mjs';
import { publishedRawPosts } from './blog.mjs';
import { publicTracking, instagramReady } from './integrations.mjs';
import { getBusiness, getPage, PAGE_KEYS, services, areas, listFaqs, listReviews } from './content.mjs';
import { readSeed } from '../src/content/defaults.mjs';

/* Builds the site with the current database content. Synchronous, so two edits never build at the same time. */
export function rebuildSite() {
  const started = Date.now();
  registerImages(uploadedManifest());
  const result = buildSite({
    business: getBusiness(),
    pages: Object.fromEntries(PAGE_KEYS.map((k) => [k, getPage(k)])),
    services: services.list({ activeOnly: true }),
    areas: areas.list({ activeOnly: true }),
    faqs: listFaqs({ activeOnly: true }),
    reviews: listReviews({ activeOnly: true }),
    rawPosts: publishedRawPosts(),
    tracking: publicTracking(),
    instagram: instagramReady(),
    misc: readSeed('misc.json'),
  });
  return { ...result, ms: Date.now() - started };
}

/* Builds and records when (shown on the panel home). */
export function rebuildAndRecord() {
  const r = rebuildSite();
  setSetting('lastBuild', { pages: r.pages, posts: r.posts, ms: r.ms, at: new Date().toISOString() });
  return r;
}

/* Rebuild that never throws: returns an error message (or null) for the panel and the MCP. */
export function rebuildSafe() {
  try { rebuildAndRecord(); return null; } catch (err) {
    console.error('Falha ao gerar o site:', err);
    return `O conteúdo foi salvo, mas o site não pôde ser atualizado: ${err.message}`;
  }
}
