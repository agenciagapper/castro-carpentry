// Factory content: page defaults (from schema.mjs) and the current site's services, areas, FAQ and reviews (seed/*.json).
// Used for the first import into the database and by `npm run build` (a build without the database).
import fs from 'node:fs';
import path from 'node:path';
import { PAGES, pageDefaults } from './schema.mjs';
import { DEFAULT_BUSINESS } from '../site.config.mjs';

const SEED = path.join(import.meta.dirname, 'seed');
export const readSeed = (f) => JSON.parse(fs.readFileSync(path.join(SEED, f), 'utf8'));

export function defaultsFor(key) {
  const d = pageDefaults(key);
  if (key === 'privacy' && !d.body) d.body = fs.readFileSync(path.join(SEED, 'privacy.md'), 'utf8');
  if (key === 'global' && !d.other_towns.length) d.other_towns = readSeed('misc.json').other_towns.map((name) => ({ name }));
  return d;
}

/* Build context with factory content only (no database). */
export function seedContext() {
  let id = 0;
  return {
    business: { ...DEFAULT_BUSINESS },
    pages: Object.fromEntries(Object.keys(PAGES).map((k) => [k, defaultsFor(k)])),
    services: readSeed('services.json').filter((s) => s.active),
    areas: readSeed('areas.json').filter((a) => a.active),
    faqs: readSeed('faqs.json').map((f) => ({ id: ++id, active: 1, home: 0, ...f })),
    reviews: readSeed('reviews.json').map((r) => ({ id: ++id, active: 1, ...r })),
    misc: readSeed('misc.json'),
    tracking: null,
    instagram: false,
  };
}
