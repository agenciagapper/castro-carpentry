// Builds dist/ with the factory content (src/content/seed and src/blog/posts), without the database. Usage: npm run build
// On the server the site is rebuilt from the database at startup and after every edit in the panel.
import { buildSite } from '../src/build-site.mjs';
import { seedContext } from '../src/content/defaults.mjs';

const { pages, posts } = buildSite(seedContext());
console.log(`Build ok: ${pages} páginas, ${posts} artigos → dist/`);
