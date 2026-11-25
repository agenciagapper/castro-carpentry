// Testes de ponta a ponta do site e do painel. Uso: npm test
// Sobe o servidor num banco temporário e numa porta livre, com um servidor falso no lugar do Meta e do webhook,
// e confere os fluxos principais e as proteções de segurança. Não precisa de navegador.
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = 3900 + Math.floor(Math.random() * 90);
const MOCK_PORT = PORT + 100;
const B = `http://localhost:${PORT}`;
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'castro-teste-'));
const ADMIN = { email: 'teste@exemplo.com', password: 'senhaforte123' };
const sha = (v) => crypto.createHash('sha256').update(v).digest('hex');

let failures = 0;
let count = 0;
const ok = (cond, msg) => { count++; if (!cond) failures++; console.log(`${cond ? 'OK  ' : 'FAIL'} ${msg}`); };
const section = (t) => console.log(`\n# ${t}`);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- Servidor falso (Meta e webhook) ---------- */
const received = [];
const mock = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => { received.push({ url: req.url, headers: req.headers, body }); res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"events_received":1}'); });
}).listen(MOCK_PORT);

/* ---------- Servidor do site ---------- */
const server = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'server/index.mjs'], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(PORT), DATA_DIR: DATA, PUBLIC_URL: B, ADMIN_EMAIL: ADMIN.email, ADMIN_PASSWORD: ADMIN.password, ADMIN_NAME: 'Ana Teste', META_GRAPH_BASE: `http://localhost:${MOCK_PORT}`, WEBHOOK_ALLOW_PRIVATE: '1', NODE_ENV: 'test' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (d) => { serverLog += d; });
server.stderr.on('data', (d) => { serverLog += d; });
for (let i = 0; i < 50 && !serverLog.includes('Site em http'); i++) await wait(200);
if (!serverLog.includes('Site em http')) { console.error(serverLog); process.exit(1); }

/* Cliente HTTP com cookies, para simular um navegador */
function client() {
  const jar = {};
  return async (p, { method = 'GET', form, json, multipart, headers = {} } = {}) => {
    const h = { ...headers, cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ') };
    let body;
    if (form) { body = new URLSearchParams(form).toString(); h['content-type'] = 'application/x-www-form-urlencoded'; }
    if (json) { body = JSON.stringify(json); h['content-type'] = 'application/json'; }
    if (multipart) body = multipart;
    const r = await fetch(p.startsWith('http') ? p : B + p, { method, headers: h, body, redirect: 'manual' });
    for (const c of r.headers.getSetCookie()) {
      const [kv] = c.split(';');
      const [k, v] = kv.split('=');
      if (c.includes('Expires=Thu, 01 Jan 1970')) delete jar[k]; else jar[k] = v;
    }
    const text = await r.text();
    return { status: r.status, loc: r.headers.get('location'), headers: r.headers, text, csrf: (text.match(/name="_csrf" value="([^"]+)"/) || [])[1] };
  };
}
const login = async (c, email = ADMIN.email, password = ADMIN.password) => {
  await c('/admin/entrar', { method: 'POST', form: { email, password } });
  return (await c('/admin')).csrf;
};
const ip = (n) => ({ 'x-forwarded-for': `10.0.0.${n}`, 'user-agent': 'Mozilla/5.0 Test' });
const fetchText = async (p) => (await fetch(B + p)).text();

/* Lead form helpers: real token from the server, backdated with the secret (so tests don't wait 4 s), plus proof-of-work. */
let dbh;
const openDb = async () => { if (!dbh) { const { DatabaseSync } = await import('node:sqlite'); dbh = new DatabaseSync(path.join(DATA, 'site.db')); } return dbh; };
async function formToken({ age = 30 } = {}) {
  await fetch(`${B}/api/leads/token`);
  const d = await openDb();
  const secret = JSON.parse(d.prepare("SELECT value FROM settings WHERE key = 'antispamSecret'").get().value);
  const payload = `${Math.floor(Date.now() / 1000) - age}.${crypto.randomBytes(8).toString('hex')}`;
  const token = `${payload}.${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
  let n = 0;
  while (!sha(`${token}:${n}`).startsWith('000')) n++;
  return { form_token: token, pow: String(n) };
}
const leadForm = async (extra = {}, tokenOpts) => ({
  name: 'Paula Reis', phone: '(508) 555-0142', email: 'paula@example.com', town: 'Sandwich', service: 'Siding repair & installation', timeframe: 'Just planning',
  message: 'Rotted trim around two windows.', page_url: '/siding/', landing_page: '/siding/?utm_source=facebook', tz: 'America/New_York', lang: 'en-US', form: 'contact',
  ...(await formToken(tokenOpts)), ...extra,
});
const postLead = (body, headers = {}) => fetch(B + '/api/leads', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers }, body: new URLSearchParams(body) });
const leadCount = async () => (await openDb()).prepare('SELECT COUNT(*) n FROM leads').get().n;

try {
  /* ---------- Site ---------- */
  section('Site');
  const PAGES = ['/', '/services/', '/trim/', '/siding/', '/decking/', '/windows-and-doors/', '/roofing/', '/adu/', '/about-us/', '/contact-us/', '/financing-options/',
    '/process/', '/reviews/', '/faq/', '/service-areas/', '/service-areas/chatham-ma/', '/service-areas/plymouth-ma/', '/blog/', '/blog/building-an-adu-on-cape-cod/',
    '/terms-of-service-privacy-policy/', '/thank-you/', '/sitemap.xml', '/robots.txt', '/llms.txt', '/blog/feed.xml'];
  let bad = [];
  for (const p of PAGES) if ((await fetch(B + p)).status !== 200) bad.push(p);
  ok(!bad.length, `todas as páginas do site respondem 200${bad.length ? ` (falharam: ${bad.join(', ')})` : ''}`);
  ok((await fetch(B + '/nao-existe')).status === 404, 'página inexistente responde 404');
  for (const p of ['/data/site.db', '/server/db.mjs', '/.env', '/package.json', '/img/..%2f..%2fpackage.json']) ok([404, 410].includes((await fetch(B + p)).status), `${p} não fica exposto`);
  const home = await fetch(B + '/');
  const homeHtml = await home.text();
  ok(home.headers.get('x-content-type-options') === 'nosniff', 'cabeçalhos de segurança no site');
  ok(homeHtml.includes('Cape Cod finish carpentry, done right.') && homeHtml.includes('David DiCicco') && homeHtml.includes('(508) 566-1618'), 'conteúdo atual do site migrado (início, avaliações, telefone)');
  ok((await fetchText('/trim/')).includes('Trim is your home&#39;s') || (await fetchText('/trim/')).includes("Trim is your home's"), 'página de serviço migrada');
  ok((await fetchText('/robots.txt')).includes('ClaudeBot') && (await fetchText('/llms.txt')).includes('## Services'), 'robots.txt e llms.txt para IAs');
  const rd = (p, h = {}) => fetch(B + p, { redirect: 'manual', headers: h });
  {
    let r = await rd('/home/');
    ok(r.status === 301 && r.headers.get('location') === '/', 'URL antiga do WordPress redireciona (301)');
    r = await rd('/decks');
    ok(r.status === 301 && r.headers.get('location') === '/decking/', '/decks leva a /decking/');
    r = await rd('/trim.html');
    ok(r.status === 301 && r.headers.get('location') === '/trim/', '.html antigo redireciona');
    r = await rd('/trim');
    ok(r.status === 301 && r.headers.get('location').startsWith('/trim/'), 'sem barra final redireciona');
    ok((await rd('/wp-login.php')).status === 410, 'sondas de WordPress recebem 410');
    const www = await new Promise((resolve) => http.get({ host: 'localhost', port: PORT, path: '/trim/', headers: { host: `www.localhost:${PORT}` } }, (res) => { res.resume(); resolve(res); }));
    ok(www.statusCode === 301 && www.headers.location === `${B}/trim/`, 'www leva ao domínio sem www');
  }

  /* ---------- Login, papéis e usuários ---------- */
  section('Login, papéis e usuários');
  const a = client();
  let r = await a('/admin/entrar', { method: 'POST', form: { email: ADMIN.email, password: 'errada123456' } });
  ok(r.status === 401, 'senha errada recusada');
  r = await a('/admin/entrar', { method: 'POST', form: { email: ADMIN.email.toUpperCase(), password: ADMIN.password, voltar: 'https://evil.example.com' } });
  ok(r.status === 302 && r.loc === '/admin', 'login funciona e ignora redirecionamento externo');
  r = await a('/admin');
  const csrf = r.csrf;
  ok(r.status === 200 && Boolean(csrf), 'painel abre logado');
  ok((await a('/admin/empresa', { method: 'POST', form: { phone: 'x' } })).status === 403, 'POST sem token CSRF recusado');
  ok((await a('/admin/empresa', { method: 'POST', form: { _csrf: csrf }, headers: { origin: 'https://evil.example.com' } })).status === 403, 'POST de outra origem recusado');

  r = await a('/admin/membros/convidar', { method: 'POST', form: { _csrf: csrf, email: 'editor@exemplo.com', role: 'editor' } });
  const invite = (r.text.match(/value="(http[^"]+\/admin\/convite\/[^"]+)"/) || [])[1];
  ok(Boolean(invite), 'convite de editor gera link');
  const e = client();
  r = await e(new URL(invite).pathname, { method: 'POST', form: { name: 'Edna Editora', password: 'outrasenha123', password2: 'outrasenha123' } });
  ok(r.loc === '/admin?msg=conta-criada', 'conta criada pelo convite');
  ok((await e(new URL(invite).pathname)).status === 404, 'convite não pode ser reutilizado');
  const csrfE = (await e('/admin')).csrf;
  ok((await e('/admin/integracoes')).status === 403, 'editor não acessa Integrações');
  ok(!(await e('/admin')).text.includes('/admin/integracoes"'), 'menu do editor sem Integrações');
  ok((await e('/admin/membros/convidar', { method: 'POST', form: { _csrf: csrfE, email: 'x@exemplo.com', role: 'admin' } })).status === 403, 'editor não convida usuários');
  const edId = ((await a('/admin/membros')).text.match(/membros\/(\d+)\/desativar/) || [])[1];
  ok((await a('/admin/membros/1/papel', { method: 'POST', form: { _csrf: csrf, role: 'editor' } })).loc?.includes('proprio-membro'), 'ninguém muda o próprio papel');
  await a(`/admin/membros/${edId}/desativar`, { method: 'POST', form: { _csrf: csrf } });
  ok((await e('/admin')).status === 302, 'usuário desativado perde a sessão');
  await a(`/admin/membros/${edId}/ativar`, { method: 'POST', form: { _csrf: csrf } });
  await login(e, 'editor@exemplo.com', 'outrasenha123');
  const csrfE2 = (await e('/admin')).csrf;

  /* ---------- Dados da empresa ---------- */
  section('Dados da empresa');
  const biz = (await (await openDb()).prepare('SELECT 1').get(), {
    _csrf: csrf, phone: '508-555-0199', email: 'office@castro.test', street: '15 Jan Sebastian Dr, Unit 4', city: 'Sandwich', state: 'MA', zip: '02563',
    mapsUrl: 'https://maps.app.goo.gl/x', lat: '41.7187514', lng: '-70.4833347', instagram: '@castrocarpentry2024', googleReviewsUrl: 'https://g.co/r', googleWriteReviewUrl: 'https://g.co/w',
    reviewCount: '75', rating: '5.0', enhancifyPage: '9933241',
  });
  ok((await a('/admin/empresa', { method: 'POST', form: { ...biz, street: 'Rua <img src=x onerror=alert(1)>' } })).status === 400, 'HTML nos dados da empresa recusado');
  ok((await a('/admin/empresa', { method: 'POST', form: { ...biz, phone: '12345' } })).status === 400, 'telefone fora do padrão americano recusado');
  r = await a('/admin/empresa', { method: 'POST', form: biz });
  ok(r.loc === '/admin/empresa?msg=contatos', 'dados da empresa salvos');
  const ctc = await fetchText('/contact-us/');
  ok(ctc.includes('(508) 555-0199') && ctc.includes('tel:+15085550199') && ctc.includes('office@castro.test'), 'site atualizado com o novo telefone e e-mail');
  ok((await fetchText('/reviews/')).includes('75 Google reviews'), 'total de avaliações do Google aplicado nos textos ({{reviews}})');

  /* ---------- Páginas (só conteúdo) ---------- */
  section('Páginas');
  r = await e('/admin/paginas/home');
  ok(r.status === 200 && r.text.includes('name="hero_title"') && r.text.includes('name="standard_points.0.text"'), 'editor abre a página Início com os campos do esquema');
  const form0 = Object.fromEntries([...r.text.matchAll(/<(?:input|textarea|select)[^>]*name="([^"]+)"[^>]*?(?:value="([^"]*)")?[^>]*>(?:([^<]*)<\/textarea>)?/g)].map((m) => [m[1], (m[2] ?? m[3] ?? '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')]));
  // selects keep their selected option
  for (const m of r.text.matchAll(/<select[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) { const sel = m[2].match(/<option value="([^"]*)" selected|<option selected>([^<]*)</); form0[m[1]] = sel ? (sel[1] ?? sel[2]) : ''; }
  delete form0._csrf;
  const edited = { ...form0, _csrf: csrfE2, hero_title: 'Cape Cod carpentry <script>alert(1)</script>', 'standard_points.0._remove': 'on', 'standard_points.3._order': '0', 'standard_points.4.text': 'New point added by the client.' };
  r = await e('/admin/paginas/home', { method: 'POST', form: edited });
  ok(r.loc === '/admin/paginas/home?msg=pagina', 'editor salva a página Início');
  const h2 = await fetchText('/');
  ok(h2.includes('Cape Cod carpentry &lt;script&gt;') && !h2.includes('<script>alert(1)'), 'texto editado aparece no site, escapado (sem XSS)');
  const pts = [...h2.matchAll(/<li><svg class="ico" aria-hidden="true"><use href="#i-check"\/><\/svg><span>([\s\S]*?)<\/span><\/li>/g)].map((m) => m[1]);
  ok(pts[0]?.includes('Reliable schedule') && !pts.some((x) => x.includes('Done right the first time')) && pts.some((x) => x.includes('New point added')), 'lista: remover, reordenar e adicionar itens');
  ok(h2.includes('class="hero__title"') && h2.includes('id="services"'), 'estrutura da página continua a mesma');
  r = await e('/admin/paginas/home', { method: 'POST', form: { ...edited, hero_title: '', hero_image: 'nao-existe' } });
  ok(r.status === 400 && r.text.includes('Preencha: Título') && r.text.includes('não existe na biblioteca'), 'campo obrigatório e imagem inexistente recusados');
  await e('/admin/paginas/home/restaurar', { method: 'POST', form: { _csrf: csrfE2 } });
  ok((await fetchText('/')).includes('Cape Cod finish carpentry, done right.'), 'restaurar textos originais');

  /* ---------- Serviços ---------- */
  section('Serviços');
  const svc = { _csrf: csrfE2, slug: '', name: 'Interior painting', short: 'Painting', seo_title: 'Interior Painting on Cape Cod | Castro Carpentry', seo_description: 'Interior painting on Cape Cod.', summary: 'Clean, careful interior painting.',
    h1: 'Interior painting,', h1_accent: 'clean lines.', lead: 'Walls, trim and ceilings.', image: 'cottage-interior-finish', image_alt: 'Painted cottage interior', home_card: 'on',
    'handle.0.title': 'Walls', 'handle.0.text': 'Prep, prime and paint.' };
  ok((await e('/admin/servicos/novo', { method: 'POST', form: { ...svc, slug: 'blog' } })).status === 400, 'endereço reservado recusado');
  r = await e('/admin/servicos/novo', { method: 'POST', form: svc });
  ok(r.loc?.includes('msg=servico-criado'), 'serviço criado no modelo fixo');
  const newId = r.loc.match(/servicos\/(\d+)/)[1];
  const pPage = await fetchText('/interior-painting/');
  ok(pPage.includes('Interior painting,') && pPage.includes('Prep, prime and paint.'), 'página do novo serviço gerada');
  ok((await fetchText('/')).includes('href="/interior-painting/"') && (await fetchText('/contact-us/')).includes('<option>Interior painting</option>'), 'novo serviço no menu e no formulário');
  r = await e(`/admin/servicos/${newId}`, { method: 'POST', form: { ...svc, slug: 'painting' } });
  r = await rd('/interior-painting/');
  ok(r.status === 301 && r.headers.get('location') === '/painting/', 'endereço alterado redireciona (301)');
  await e(`/admin/servicos/${newId}/mover`, { method: 'POST', form: { _csrf: csrfE2, dir: 'up' } });
  const nav = await fetchText('/services/');
  ok(nav.indexOf('id="painting"') < nav.indexOf('id="adu"'), 'reordenar serviços');
  await e(`/admin/servicos/${newId}/desativar`, { method: 'POST', form: { _csrf: csrfE2 } });
  r = await rd('/painting/');
  ok(r.status === 302 && r.headers.get('location') === '/services/' && !(await fetchText('/')).includes('/painting/'), 'serviço desativado sai do site e do menu');
  await e(`/admin/servicos/${newId}/excluir`, { method: 'POST', form: { _csrf: csrfE2 } });
  ok((await rd('/painting/')).status === 301, 'serviço excluído leva à página de serviços');

  /* ---------- Cidades ---------- */
  section('Áreas atendidas');
  const chathamId = ((await e('/admin/cidades')).text.match(/href="\/admin\/cidades\/(\d+)">Chatham/) || [])[1];
  await e(`/admin/cidades/${chathamId}/desativar`, { method: 'POST', form: { _csrf: csrfE2 } });
  ok((await rd('/service-areas/chatham-ma/')).status === 302 && !(await fetchText('/service-areas/')).includes('chatham-ma'), 'cidade desativada sai do site');
  await e(`/admin/cidades/${chathamId}/ativar`, { method: 'POST', form: { _csrf: csrfE2 } });
  ok((await fetch(B + '/service-areas/chatham-ma/')).status === 200, 'cidade reativada');

  /* ---------- FAQ e avaliações ---------- */
  section('FAQ e avaliações');
  r = await e('/admin/faq/nova', { method: 'POST', form: { _csrf: csrfE2, topic: 'general', question: 'Do you work in winter?', answer: 'Yes, interior work all year.', active: 'on', home: 'on' } });
  ok(r.loc?.includes('msg=faq'), 'pergunta criada');
  ok((await fetchText('/faq/')).includes('Do you work in winter?') && (await fetchText('/')).includes('Do you work in winter?'), 'pergunta no FAQ e na página inicial');
  const faqId = (await openDb()).prepare("SELECT id FROM faqs WHERE question = 'Do you work in winter?'").get().id;
  await e(`/admin/faq/${faqId}/mover`, { method: 'POST', form: { _csrf: csrfE2, dir: 'up' } });
  ok((await openDb()).prepare('SELECT position FROM faqs WHERE id = ?').get(faqId).position === 7, 'reordenar pergunta');
  await e(`/admin/faq/${faqId}/excluir`, { method: 'POST', form: { _csrf: csrfE2 } });
  ok(!(await fetchText('/faq/')).includes('Do you work in winter?'), 'pergunta excluída');
  r = await e('/admin/avaliacoes/nova', { method: 'POST', form: { _csrf: csrfE2, name: 'Maria Lopes', project: 'Deck · Dennis', text: 'Great crew, great deck.', rating: '5', area: 'dennis-ma', active: 'on' } });
  ok(r.loc?.includes('msg=avaliacao'), 'avaliação cadastrada');
  ok((await fetchText('/reviews/')).includes('Great crew, great deck.') && (await fetchText('/service-areas/dennis-ma/')).includes('Maria Lopes'), 'avaliação na página Reviews e na cidade');
  const revId = (await openDb()).prepare("SELECT id FROM reviews WHERE name = 'Maria Lopes'").get().id;
  await e(`/admin/avaliacoes/${revId}`, { method: 'POST', form: { _csrf: csrfE2, name: 'Maria Lopes', project: 'Deck', text: 'Great crew, great deck.', rating: '5', area: '' } });
  ok(!(await fetchText('/reviews/')).includes('Great crew, great deck.'), 'avaliação oculta sai do site');

  /* ---------- Leads ---------- */
  section('Leads e antispam');
  let before = await leadCount();
  r = await postLead(await leadForm(), ip(1));
  ok(r.status === 200 && (await leadCount()) === before + 1, 'lead válido gravado (token, prova de trabalho e tempo mínimo)');
  before = await leadCount();
  await postLead(await leadForm({ website: 'spam.com' }), ip(2));
  await postLead({ ...(await leadForm()), form_token: 'x.y.z' }, ip(2));
  await postLead(await leadForm({ email: 'fast@example.com' }, { age: 0 }), ip(2));
  await postLead({ ...(await leadForm({ email: 'pow@example.com' })), pow: '1' }, ip(2));
  ok((await leadCount()) === before, 'campo invisível, token inválido, envio rápido e sem prova de trabalho: descartados');
  const replay = await leadForm({ email: 'replay@example.com', phone: '5085550111' });
  await postLead(replay, ip(3));
  before = await leadCount();
  await postLead(replay, ip(4));
  ok((await leadCount()) === before, 'token não pode ser reutilizado');
  r = await postLead(await leadForm({ phone: '123' }), ip(5));
  ok(r.status === 422 && (await r.json()).fields.includes('phone'), 'telefone inválido devolve erro para corrigir');
  r = await postLead(await leadForm({ name: 'SEO Expert', message: 'We offer SEO and backlinks for your website', phone: '5085550122' }), ip(6));
  ok(r.status === 200 && (await openDb()).prepare("SELECT status FROM leads WHERE name = 'SEO Expert'").get()?.status === 'suspeito', 'oferta de SEO vai para a quarentena');
  ok((await postLead(await leadForm(), { ...ip(7), origin: 'https://evil.example.com' })).status === 403, 'envio de outra origem recusado');
  ok((await postLead(await leadForm(), { 'x-forwarded-for': '10.0.0.8', 'user-agent': 'curl/8.0' })).status === 403, 'robô (curl) recusado');
  let last;
  for (let i = 0; i < 4; i++) last = await postLead(await leadForm({ email: `n${i}@example.com`, phone: `50855501${30 + i}` }), ip(9));
  ok(last.status === 429, 'limite de envios por conexão');

  r = await e('/admin/leads?pagina_site=%2Fsiding%2F');
  ok(r.text.includes('Paula Reis') && !r.text.includes('SEO Expert'), 'filtro por página e quarentena fora da lista');
  ok((await e('/admin/leads?status=suspeito')).text.includes('SEO Expert'), 'aba de quarentena');
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  ok((await e(`/admin/leads?de=${today}&ate=${today}`)).text.includes('Paula Reis') && !(await e('/admin/leads?de=2020-01-01&ate=2020-01-02')).text.includes('Paula Reis'), 'filtro por datas');
  const csv = await e(`/admin/leads/exportar?pagina_site=%2Fsiding%2F&de=${today}`);
  ok(csv.headers.get('content-type').includes('text/csv') && csv.text.includes('Paula Reis') && !csv.text.includes('SEO Expert'), 'CSV exportado com os filtros');
  const leadId = (r.text.match(/\/admin\/leads\/(\d+)"/) || [])[1];
  await e(`/admin/leads/${leadId}/status`, { method: 'POST', form: { _csrf: csrfE2, status: 'orcamento' } });
  await e(`/admin/leads/${leadId}/notas`, { method: 'POST', form: { _csrf: csrfE2, text: 'Visita marcada.' } });
  r = await e(`/admin/leads/${leadId}`);
  ok(r.text.includes('Orçamento enviado') && r.text.includes('Visita marcada.'), 'status e anotação do lead');

  /* ---------- Blog ---------- */
  section('Blog');
  ok((await e('/admin/blog')).text.includes('Building an ADU on Cape Cod'), 'artigos atuais importados');
  const body = `Cedar shingles on Cape Cod test keyword appear in the first paragraph, to check the panel flow end to end.\n\n## First section\n\n${'Helpful text with short paragraphs and useful information for homeowners. '.repeat(8)}\n\n## Frequently asked questions\n\n### Does it work?\n\nYes, it works.`;
  const fd = new FormData();
  Object.entries({ _csrf: csrfE2, title: 'Test article about cedar', body, seo_title: 'Test article about cedar | Castro', description: 'A test description for the cedar article, long enough to pass the limits the panel checks for Google search results.', keyword: 'cedar', category: 'Siding', service: 'siding', cover: 'siding-cedar-gable', cover_alt: 'Cedar gable', slug: 'test-article', acao: 'publicar' }).forEach(([k, v]) => fd.set(k, v));
  r = await e('/admin/blog/novo', { method: 'POST', multipart: fd });
  ok(r.loc?.includes('msg=post-publicado'), 'artigo publicado pelo editor');
  const live = await fetchText('/blog/test-article/');
  ok(live.includes('Test article about cedar') && live.includes('FAQPage') && live.includes('href="/siding/"'), 'artigo no site com FAQ e serviço relacionado');
  const fd2 = new FormData();
  Object.entries({ _csrf: csrfE2, title: 'Bad — dash', body, acao: 'publicar' }).forEach(([k, v]) => fd2.set(k, v));
  ok((await e('/admin/blog/novo', { method: 'POST', multipart: fd2 })).text.includes('travessão'), 'travessão bloqueia publicação');

  /* ---------- Integrações ---------- */
  section('Integrações');
  r = await a('/admin/integracoes', { method: 'POST', form: { _csrf: csrf, metaPixelId: '123456789012345', metaCapiToken: 'EAAtokenSecreto987XYZ', ga4Id: 'G-AB12CD34EF', googleAdsId: 'AW-123456789', gtmId: 'GTM-AB12CD3',
    ev_lead_meta: 'Lead', ev_lead_ga4: 'generate_lead', ev_lead_adsLabel: 'LeadLabel_1', ev_phone_meta: 'Contact', ev_phone_ga4: 'phone_click', ev_phone_adsLabel: 'PhoneLabel_2',
    ev_email_meta: '', ev_email_ga4: 'email_click', ev_financing_meta: 'SubmitApplication', ev_financing_ga4: 'financing_click', webhookUrls: 'https://exemplo.com/hook', onlyProdHosts: 'on' } });
  ok(r.loc?.includes('msg=integracoes'), 'integrações e eventos salvos');
  ok((await a('/admin/integracoes', { method: 'POST', form: { _csrf: csrf, ev_lead_ga4: 'Generate Lead' } })).status === 400, 'evento inválido recusado');
  const site = await fetchText('/');
  ok(site.includes('123456789012345') && site.includes('PhoneLabel_2') && site.includes('SubmitApplication') && site.includes('GTM-AB12CD3'), 'Pixel, Google Ads, GTM e eventos no site');
  ok(!site.includes('EAAtokenSecreto') && !site.includes('exemplo.com/hook'), 'token e webhook fora do site');
  const d = await openDb();
  const cfg = JSON.parse(d.prepare("SELECT value FROM settings WHERE key = 'integrations'").get().value);
  cfg.webhookUrls = `http://localhost:${MOCK_PORT}/hook1\nhttp://localhost:${MOCK_PORT}/hook2`;
  d.prepare("UPDATE settings SET value = ? WHERE key = 'integrations'").run(JSON.stringify(cfg));
  received.length = 0;
  await postLead(await leadForm({ name: 'Carlos Souza', email: 'carlos@example.com', phone: '5085550177', event_id: 'evt-teste-1' }), ip(30));
  await postLead(await leadForm({ name: 'SEO Bot', message: 'cheap backlinks and SEO', phone: '5085550178' }), ip(31));
  await wait(1500);
  const capi = received.find((x) => x.url.includes('/events'));
  const ev = capi && JSON.parse(capi.body).data[0];
  ok(ev?.event_id === 'evt-teste-1' && ev?.event_name === 'Lead', 'Conversions API recebe o lead com o mesmo event_id');
  ok(ev?.user_data.em[0] === sha('carlos@example.com') && ev?.user_data.ph[0] === sha('15085550177'), 'e-mail e telefone (+1) enviados com SHA-256');
  const hooks = received.filter((x) => x.url.startsWith('/hook'));
  ok(hooks.length === 2 && hooks[0].headers['x-signature-256'] === `sha256=${crypto.createHmac('sha256', cfg.webhookSecret).update(hooks[0].body).digest('hex')}`, 'lead entregue aos dois webhooks, assinado com HMAC');
  ok(JSON.parse(hooks[0].body).lead.service === 'Siding repair & installation' && !received.some((x) => x.body.includes('SEO Bot')), 'webhook com os campos do formulário; quarentena não é enviada');

  /* ---------- MCP ---------- */
  section('MCP');
  r = await a('/admin/ia/tokens', { method: 'POST', form: { _csrf: csrf, name: 'Teste' } });
  const token = (r.text.match(/value="(vpt_[^"]+)"/) || [])[1];
  ok(Boolean(token), 'token pessoal gerado');
  ok((await fetch(B + '/mcp', { method: 'POST' })).status === 401, '/mcp sem token recusado');
  const mcp = new Client({ name: 'teste', version: '1' });
  await mcp.connect(new StreamableHTTPClientTransport(new URL(B + '/mcp'), { requestInit: { headers: { Authorization: `Bearer ${token}` } } }));
  const names = (await mcp.listTools()).tools.map((x) => x.name);
  const expected = ['listar_leads', 'exportar_leads_csv', 'editar_pagina', 'criar_servico', 'ativar_servico', 'reordenar_servicos', 'excluir_servico', 'editar_cidade', 'criar_pergunta', 'excluir_pergunta',
    'criar_avaliacao', 'reordenar_avaliacoes', 'criar_artigo', 'publicar_artigo', 'excluir_artigo', 'enviar_imagem', 'editar_dados_empresa', 'editar_integracoes', 'listar_usuarios'];
  ok(expected.every((n) => names.includes(n)), `ferramentas de todas as áreas (${names.length})`);
  ok(!names.some((n) => /excluir_lead|convidar|webhook/.test(n)), 'sem exclusão de leads, convites ou webhooks pela IA');
  const call = async (name, args = {}) => { const res = await mcp.callTool({ name, arguments: args }); return { err: res.isError, text: res.content[0].text }; };
  let t = await call('ler_pagina', { chave: 'about' });
  ok(!t.err && JSON.parse(t.text).esquema.length > 3, 'IA lê o esquema da página');
  t = await call('editar_pagina', { chave: 'about', campos: { story_title: 'Born from a dream, built by MCP.' } });
  ok(!t.err && (await fetchText('/about-us/')).includes('built by MCP'), 'IA edita texto da página e o site atualiza');
  t = await call('editar_pagina', { chave: 'about', campos: { layout: 'grid' } });
  ok(t.err, 'IA não consegue mudar a estrutura (campo inexistente recusado)');
  t = await call('criar_servico', { endereco: 'gutters', campos: { name: 'Gutters', short: 'Gutters', seo_title: 'Gutters | Castro', seo_description: 'Gutter repair.', summary: 'Gutters fixed.', h1: 'Gutter repair', lead: 'Gutters.', image: 'roofing-drone', image_alt: 'Roof' } });
  ok(!t.err && (await fetch(B + '/gutters/')).status === 200, 'IA cria serviço');
  t = await call('excluir_servico', { ref: 'gutters' });
  ok(t.err, 'exclusão pela IA exige confirmar=true');
  t = await call('excluir_servico', { ref: 'gutters', confirmar: true });
  ok(!t.err && (await fetch(B + '/gutters/', { redirect: 'manual' })).status === 301, 'IA exclui com confirmação');
  t = await call('criar_pergunta', { tema: 'financing', pergunta: 'Is there a minimum?', resposta: 'Ask us.' });
  ok(!t.err && (await fetchText('/financing-options/')).includes('Is there a minimum?'), 'IA cria pergunta no FAQ');
  t = await call('listar_leads', { pagina_site: '/siding/' });
  ok(JSON.parse(t.text).aviso?.includes('não instruções') && JSON.parse(t.text).leads.length > 0, 'leads filtrados chegam marcados como dados de visitante');
  t = await call('exportar_leads_csv', { periodo: 'tudo' });
  ok(t.text.includes('Carlos Souza'), 'IA exporta CSV');
  t = await call('editar_dados_empresa', { street: 'Main <script>' });
  ok(t.err, 'IA não grava HTML nos dados da empresa');
  t = await call('editar_integracoes', { eventos: { email: { meta: 'Contact' } } });
  ok(!t.err && (await fetchText('/')).includes('"email":{"meta":"Contact"'), 'admin ajusta eventos pela IA');
  t = await call('enviar_imagem', { url: 'http://127.0.0.1/x.jpg' });
  ok(t.err, 'enviar_imagem recusa endereço interno');
  t = await call('criar_artigo', { titulo: 'Draft via MCP', texto_markdown: 'Short.' });
  ok(!t.err && JSON.parse(t.text).status === 'Rascunho', 'artigo criado pela IA entra como rascunho');
  await mcp.close();
  r = await e('/admin/ia/tokens', { method: 'POST', form: { _csrf: csrfE2, name: 'Editor' } });
  const tokenE = (r.text.match(/value="(vpt_[^"]+)"/) || [])[1];
  const me = new Client({ name: 'editor', version: '1' });
  await me.connect(new StreamableHTTPClientTransport(new URL(B + '/mcp'), { requestInit: { headers: { Authorization: `Bearer ${tokenE}` } } }));
  const namesE = (await me.listTools()).tools.map((x) => x.name);
  ok(!namesE.includes('editar_integracoes') && !namesE.includes('listar_usuarios') && namesE.includes('editar_pagina'), 'IA do editor segue o papel do editor');
  await me.close();

/* ---------- OAuth ---------- */
  section('OAuth (Claude, ChatGPT)');
  const CB = 'https://app-de-teste.example/callback';
  const reg = await (await fetch(B + '/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ client_name: 'Claude', redirect_uris: [CB], token_endpoint_auth_method: 'none' }) })).json();
  ok(Boolean(reg.client_id), 'registro dinâmico de cliente');
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  r = await a(`/authorize?${new URLSearchParams({ response_type: 'code', client_id: reg.client_id, redirect_uri: CB, code_challenge: challenge, code_challenge_method: 'S256', state: 'xyz', resource: `${B}/mcp` })}`);
  ok(r.loc?.startsWith('/admin/conectar/'), '/authorize leva à tela de consentimento');
  r = await a(r.loc);
  ok(r.text.includes('Claude quer acessar') && r.text.includes('consent__target--warn'), 'consentimento alerta destino desconhecido');
  const consentUrl = r.text.match(/action="(\/admin\/conectar\/[^"]+)"/)[1];
  r = await a(consentUrl, { method: 'POST', form: { _csrf: r.csrf, decisao: 'permitir' } });
  const code = new URL(r.loc).searchParams.get('code');
  ok(Boolean(code) && new URL(r.loc).searchParams.get('state') === 'xyz', 'permitir devolve o código ao app');
  const tok = await (await fetch(B + '/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, code_verifier: verifier, client_id: reg.client_id, redirect_uri: CB, resource: `${B}/mcp` }) })).json();
  ok(Boolean(tok.access_token && tok.refresh_token), 'troca do código por tokens (PKCE)');
  const m2 = new Client({ name: 'oauth', version: '1' });
  await m2.connect(new StreamableHTTPClientTransport(new URL(B + '/mcp'), { requestInit: { headers: { Authorization: `Bearer ${tok.access_token}` } } }));
  ok(!(await m2.callTool({ name: 'resumo_painel', arguments: {} })).isError, 'token OAuth funciona no MCP');
  await m2.close();
  const refresh = (rt) => fetch(B + '/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: rt, client_id: reg.client_id }) });
  ok((await refresh(tok.refresh_token)).status === 200, 'renovação do token');
  ok((await refresh(tok.refresh_token)).status === 400, 'refresh antigo não vale de novo (rotação)');
} catch (err) {
  failures++;
  console.error('\nErro inesperado no teste:', err);
} finally {
  server.kill();
  mock.close();
  fs.rmSync(DATA, { recursive: true, force: true });
  console.log(`\n${count - failures} de ${count} verificações passaram.`);
  if (failures) console.log('\nLog do servidor:\n' + serverLog.slice(-3000));
  process.exit(failures ? 1 : 0);
}
