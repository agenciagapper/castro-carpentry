// Servidor do site e do painel. Uso: npm start  →  http://localhost:3000 (ou PORT)
import './env.mjs';
import path from 'node:path';
import express from 'express';
import { db, DATA_DIR, logActivity } from './db.mjs';
import { hashPassword, loadSession, passwordProblem } from './auth.mjs';
import { router as admin } from './admin.mjs';
import { rebuildAndRecord } from './site.mjs';
import { api } from './leads.mjs';
import fs from 'node:fs';
import { seedPostsFromMarkdown, redirectFor } from './blog.mjs';
import { seedContent, pathRedirect, services, areas } from './content.mjs';
import { syncInstagram, INSTAGRAM_DIR } from './integrations.mjs';
import { legacyRedirects } from './redirects.mjs';
import { UPLOADS_IMG } from './images.mjs';
import { DIST } from '../src/build-site.mjs';
import { SITE } from '../src/site.config.mjs';
import { mcpAuthRouter, getOAuthProtectedResourceMetadataUrl } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { provider, publicUrl, mcpResourceUrl } from './oauth.mjs';
import { handleMcp } from './mcp.mjs';

const PORT = Number(process.env.PORT || 3000);
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

/* Primeiro acesso: cria o membro inicial a partir de ADMIN_EMAIL e ADMIN_PASSWORD, se o banco estiver vazio. */
if (!db.prepare('SELECT 1 FROM members LIMIT 1').get()) {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Administrador' } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD && !passwordProblem(ADMIN_PASSWORD)) {
    const { lastInsertRowid } = db.prepare("INSERT INTO members (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
      .run(ADMIN_NAME, ADMIN_EMAIL.trim().toLowerCase(), hashPassword(ADMIN_PASSWORD));
    logActivity({ id: Number(lastInsertRowid), name: ADMIN_NAME }, 'conta inicial criada pelas variáveis de ambiente');
    console.log(`Membro inicial criado: ${ADMIN_EMAIL}. Já pode remover ADMIN_PASSWORD das variáveis de ambiente.`);
  } else {
    console.warn('Nenhum membro cadastrado. Defina ADMIN_EMAIL e ADMIN_PASSWORD (10+ caracteres) ou rode npm run admin:criar.');
  }
}

if (seedContent()) console.log('Conteúdo: páginas, serviços, cidades, FAQ e avaliações do site atual importados para o banco.');
const seeded = seedPostsFromMarkdown();
if (seeded) console.log(`Blog: ${seeded} artigos importados de src/blog/posts para o banco.`);

const { pages, ms } = rebuildAndRecord();
console.log(`Site gerado: ${pages} páginas em ${ms} ms. Dados em ${DATA_DIR}`);

/* Cabeçalhos de segurança, os mesmos do vercel.json. */
app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    // CSP mínima para o site (o painel define a sua, mais restrita): sem <base> nem <object> injetados e sem ser embutido por outro domínio.
    // Scripts não são restringidos porque Pixel, Google e os scripts extras do painel vêm de domínios variados.
    'Content-Security-Policy': "base-uri 'self'; object-src 'none'; frame-ancestors 'self'",
  });
  if (process.env.NODE_ENV === 'production') res.set('Strict-Transport-Security', 'max-age=31536000');
  next();
});

/* Old URLs (WordPress, .html), www -> bare domain, WordPress probes: what .htaccess did on the old hosting. */
app.use(legacyRedirects);

/* Cookies sem dependência extra. */
app.use((req, _res, next) => {
  const decode = (v) => { try { return decodeURIComponent(v); } catch { return v; } };
  req.cookies = Object.fromEntries(String(req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter(([k, val]) => k && val).map(([k, ...val]) => [k, decode(val.join('='))]));
  next();
});

/* ---------- API do formulário ---------- */
app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, api);

/* ---------- MCP (IAs conectadas ao painel) ---------- */
// Endpoints OAuth na raiz (/.well-known/..., /authorize, /token, /register, /revoke), exigidos pelo protocolo.
// Se PUBLIC_URL estiver errado (sem https), o site continua no ar e só o OAuth fica desligado.
try {
  app.use(mcpAuthRouter({
    provider,
    issuerUrl: new URL(publicUrl()),
    resourceServerUrl: mcpResourceUrl(),
    resourceName: `Painel do site da ${SITE.name}`,
  }));
} catch (err) {
  console.error(`OAuth do MCP desligado: ${err.message}. Confira PUBLIC_URL (precisa ser https://seu-dominio). Tokens pessoais continuam funcionando.`);
}

const mcpHits = new Map();
app.use('/mcp', (req, res, next) => {
  // Autenticação por token no cabeçalho, sem cookies: liberar qualquer origem é seguro e permite clientes no navegador.
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id',
    'Access-Control-Expose-Headers': 'WWW-Authenticate, Mcp-Session-Id',
    'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
    'Cache-Control': 'no-store',
  });
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});
app.post('/mcp',
  express.json({ limit: '1mb' }),
  requireBearerAuth({ verifier: provider, resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpResourceUrl()) }),
  (req, res, next) => {
    // 120 chamadas por minuto por token
    const key = req.auth.token.slice(-16);
    const now = Date.now();
    const h = mcpHits.get(key);
    if (!h || now - h.first > 60e3) mcpHits.set(key, { first: now, count: 1 });
    else if (++h.count > 120) return res.status(429).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Muitas chamadas. Aguarde um minuto.' }, id: null });
    next();
  },
  handleMcp);
app.all('/mcp', (_req, res) => res.status(405).set('Allow', 'POST').json({ jsonrpc: '2.0', error: { code: -32000, message: 'Use POST.' }, id: null }));
setInterval(() => { const now = Date.now(); for (const [k, h] of mcpHits) if (now - h.first > 60e3) mcpHits.delete(k); }, 5 * 60e3).unref();

/* ---------- Painel ---------- */
app.use('/admin', (_req, res, next) => {
  res.set({
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  });
  next();
});
app.use('/admin/assets', express.static(path.join(import.meta.dirname, 'assets'), { maxAge: '1h' }));
app.use('/admin', loadSession, admin);

/* ---------- Site estático ---------- */
app.use(express.static(DIST, {
  extensions: ['html'],
  dotfiles: 'ignore',
  setHeaders(res, file) {
    const rel = path.relative(DIST, file).replaceAll(path.sep, '/');
    if (rel.startsWith('img/')) res.set('Cache-Control', 'public, max-age=31536000, immutable');
    else if (/^(css|js)\//.test(rel)) res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
    else res.set('Cache-Control', 'public, max-age=0, must-revalidate');
  },
}));

/* Instagram feed synced by the server (see server/integrations.mjs). */
app.use('/instagram', express.static(INSTAGRAM_DIR, { dotfiles: 'ignore', maxAge: '1h' }));

/* Imagens enviadas pelo painel (o nome de cada arquivo é único, então o cache pode ser longo). */
app.use('/img', express.static(UPLOADS_IMG, { dotfiles: 'ignore', maxAge: '365d', immutable: true }));

/* Artigo que mudou de endereço: redireciona o antigo para o novo. */
app.get(/^\/blog\/([^/]+)\/?$/, (req, res, next) => {
  const slug = redirectFor(req.params[0]);
  if (slug) return res.redirect(301, `/blog/${slug}/`);
  next();
});

/* Renamed or removed services and towns, inactive pages, and clean URLs without the trailing slash. */
app.get(/^\/.*$/, (req, res, next) => {
  const p = req.path.endsWith('/') ? req.path : `${req.path}/`;
  const moved = pathRedirect(p);
  if (moved) return res.redirect(301, moved);
  const seg = p.split('/').filter(Boolean);
  if (seg.length === 1 && services.get(seg[0]) && !services.get(seg[0]).active) return res.redirect(302, '/services/');
  if (seg.length === 2 && seg[0] === 'service-areas' && areas.get(seg[1]) && !areas.get(seg[1]).active) return res.redirect(302, '/service-areas/');
  if (!req.path.endsWith('/') && !path.extname(req.path) && fs.existsSync(path.join(DIST, req.path, 'index.html'))) {
    const q = req.originalUrl.slice(req.path.length);
    return res.redirect(301, `${req.path}/${q}`);
  }
  next();
});

app.use((_req, res) => res.status(404).sendFile(path.join(DIST, '404.html')));

app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).send(status >= 500 ? 'Erro interno. Tente de novo em instantes.' : 'Requisição inválida.');
});

app.listen(PORT, () => console.log(`Site em http://localhost:${PORT} (painel em /admin)`));

/* Instagram: hourly sync when a token is set in the panel. The section appears on the site after the first sync. */
const igTick = () => syncInstagram().then((r) => { if (r.firstTime) rebuildAndRecord(); }).catch((err) => console.error('Instagram:', err.message));
setTimeout(igTick, 15e3).unref();
setInterval(igTick, 60 * 60e3).unref();
