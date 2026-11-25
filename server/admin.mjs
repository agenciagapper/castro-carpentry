// Rotas do painel em /admin.
import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import multer from 'multer';
import { esc, slugify } from '../src/lib.mjs';
import { SITE } from '../src/site.config.mjs';
import { PUBLIC_URL } from './env.mjs';
import { db, getSetting, setSetting, logActivity } from './db.mjs';
import {
  hashPassword, verifyPassword, verifyDummy, passwordProblem,
  createSession, destroySession, destroyOtherSessions, requireMember, checkCsrf,
  createToken, findToken, consumeToken, loginBlocked, loginFailed, loginSucceeded,
} from './auth.mjs';
import { mailEnabled, sendMail } from './mail.mjs';
import { rebuildAndRecord, rebuildSafe } from './site.mjs';
import { STATUS, parseFilters, listLeads, getLead, leadNotes, newLeadsCount, leadStats, leadsCsv, setLeadStatus, addLeadNote, leadPages, leadServices } from './leads.mjs';
import { POST_STATUS, listPosts, getPost, validatePost, savePost, deletePost, categories, rowToRaw } from './blog.mjs';
import { saveImage, listImages, deleteImage, saveAvatar, removeAvatar, AVATARS, MAX_UPLOAD_BYTES } from './images.mjs';
import { preparePost } from '../src/build-site.mjs';
import { blogPost } from '../src/pages/blog.mjs';
import { getIntegrations, validateIntegrations, saveIntegrations, regenerateWebhookSecret, recentLog, runTest, ACTIONS, META_EVENTS } from './integrations.mjs';
import {
  PAGES, PAGE_KEYS, getPage, pageMeta, validatePage, savePage, resetPage, services, areas, getBusiness, validateBusiness, saveBusiness,
  faqTopics, listFaqs, getFaq, validateFaq, saveFaq, deleteFaq, moveFaq, listReviews, getReview, validateReview, saveReview, deleteReview, moveReview,
} from './content.mjs';
import { ROLES, requireAdmin, isAdmin } from './auth.mjs';
import { getPending, approvePending, denyPending, createPersonalToken, personalTokens, revokePersonalToken, connectedApps, revokeGrant, mcpResourceUrl } from './oauth.mjs';
import * as v from './views.mjs';

export const router = express.Router();

const INVITE_HOURS = 72;
const RESET_HOURS = 1;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Links enviados por e-mail usam PUBLIC_URL (ou o domínio do site), nunca o Host da requisição. */
const baseUrl = () => PUBLIC_URL;
const cleanEmail = (s) => String(s || '').trim().toLowerCase();
const activeAdmins = () => db.prepare("SELECT COUNT(*) n FROM members WHERE active = 1 AND role = 'admin'").get().n;


const pageOpts = (req) => ({ member: req.member, csrf: req.csrf, msg: req.query.msg, badges: { leads: newLeadsCount() } });
const renderReq = (req, res, opts, status = 200) => res.status(status).send(v.page({ ...pageOpts(req), ...opts }));
const render = (res, opts) => res.send(v.page({ ...pageOpts(res.req), ...opts }));

router.use(express.urlencoded({ extended: false, limit: '200kb' }));

/* Uploads (multipart): lidos antes do CSRF porque o token vem no corpo. Só para quem já está logado. */
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: 2, fieldSize: 200 * 1024 } })
  .fields([{ name: 'file', maxCount: 1 }, { name: 'cover_file', maxCount: 1 }]);
router.use((req, res, next) => {
  if (req.method !== 'POST' || !req.is('multipart/form-data')) return next();
  if (!req.member) return res.status(401).send('Entre no painel para enviar arquivos.');
  upload(req, res, (err) => {
    if (err) req.uploadError = err.code === 'LIMIT_FILE_SIZE' ? `O arquivo passa de ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` : 'Não foi possível ler o arquivo enviado.';
    req.body ??= {};
    next();
  });
});
const uploaded = (req, name) => req.files?.[name]?.[0];

router.use(checkCsrf);

/* ---------- Entrar e sair ---------- */
router.get('/entrar', (req, res) => {
  if (req.member) return res.redirect('/admin');
  res.send(v.loginView({ msg: req.query.msg, back: req.query.voltar }));
});

router.post('/entrar', (req, res) => {
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || '');
  const keys = [`ip:${req.ip}`, `email:${email}`];
  if (loginBlocked(...keys)) {
    return res.status(429).send(v.loginView({ email, error: 'Muitas tentativas. Aguarde 15 minutos e tente de novo.' }));
  }
  const m = db.prepare('SELECT * FROM members WHERE email = ? AND active = 1').get(email);
  const ok = m ? verifyPassword(password, m.password_hash) : verifyDummy(password);
  if (!ok) {
    loginFailed(...keys);
    return res.status(401).send(v.loginView({ email, back: req.body.voltar, error: 'E-mail ou senha incorretos.' }));
  }
  loginSucceeded(...keys);
  createSession(res, m, req);
  logActivity(m, 'entrou no painel');
  const back = String(req.body.voltar || '');
  res.redirect(/^\/admin(\/|$)/.test(back) ? back : '/admin');
});

router.post('/sair', (req, res) => {
  destroySession(req, res);
  res.redirect('/admin/entrar?msg=saiu');
});

/* ---------- Esqueci a senha ---------- */
router.get('/esqueci', (_req, res) => res.send(v.forgotView({ mailEnabled })));

router.post('/esqueci', async (req, res) => {
  const email = cleanEmail(req.body.email);
  const keys = [`forgot-ip:${req.ip}`, `forgot:${email}`];
  if (mailEnabled && EMAIL_RE.test(email) && !loginBlocked(...keys)) {
    loginFailed(...keys);
    const m = db.prepare('SELECT * FROM members WHERE email = ? AND active = 1').get(email);
    if (m) {
      const token = createToken('reset', { email: m.email, memberId: m.id, hours: RESET_HOURS });
      await sendMail({
        to: m.email,
        subject: `Nova senha do painel do site ${SITE.name}`,
        text: `Olá, ${m.name}.\n\nRecebemos um pedido para criar uma nova senha no painel do site ${SITE.name}. Use o link abaixo, que vale por 1 hora:\n\n${baseUrl()}/admin/redefinir/${token}\n\nSe você não fez esse pedido, ignore este e-mail. A sua senha atual continua valendo.`,
      }).catch((err) => console.error('Falha ao enviar e-mail de redefinição:', err.message));
    }
  }
  res.send(v.forgotView({ sent: true, mailEnabled }));
});

router.get('/redefinir/:token', (req, res) => {
  const t = findToken('reset', req.params.token);
  if (!t) return res.status(404).send(v.invalidLinkView());
  res.send(v.resetView({ token: req.params.token, email: t.email }));
});

router.post('/redefinir/:token', (req, res) => {
  const t = findToken('reset', req.params.token);
  if (!t) return res.status(404).send(v.invalidLinkView());
  const { password, password2 } = req.body;
  const error = passwordProblem(password) || (password !== password2 ? 'As senhas não conferem.' : null);
  if (error) return res.status(400).send(v.resetView({ token: req.params.token, email: t.email, error }));
  db.prepare('UPDATE members SET password_hash = ? WHERE id = ?').run(hashPassword(password), t.member_id);
  consumeToken(req.params.token);
  destroyOtherSessions(t.member_id);
  const m = db.prepare('SELECT id, name FROM members WHERE id = ?').get(t.member_id);
  logActivity(m, 'redefiniu a senha por link');
  res.redirect('/admin/entrar?msg=senha-redefinida');
});

/* ---------- Aceitar convite ---------- */
router.get('/convite/:token', (req, res) => {
  const t = findToken('invite', req.params.token);
  if (!t) return res.status(404).send(v.invalidLinkView());
  res.send(v.inviteView({ token: req.params.token, email: t.email }));
});

router.post('/convite/:token', (req, res) => {
  const t = findToken('invite', req.params.token);
  if (!t) return res.status(404).send(v.invalidLinkView());
  const name = String(req.body.name || '').trim().slice(0, 80);
  const { password, password2 } = req.body;
  const error = (!name ? 'Informe o seu nome.' : null) || passwordProblem(password) || (password !== password2 ? 'As senhas não conferem.' : null);
  if (error) return res.status(400).send(v.inviteView({ token: req.params.token, email: t.email, name, error }));
  if (db.prepare('SELECT 1 FROM members WHERE email = ?').get(t.email)) {
    consumeToken(req.params.token);
    return res.redirect('/admin/entrar');
  }
  const { lastInsertRowid: id } = db.prepare('INSERT INTO members (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(name, t.email, hashPassword(password), ROLES[t.role] ? t.role : 'editor');
  consumeToken(req.params.token);
  const m = { id: Number(id), name, email: t.email };
  logActivity(m, 'aceitou o convite e criou a conta');
  createSession(res, m, req);
  res.redirect('/admin?msg=conta-criada');
});

/* ---------- Daqui para baixo, só membros ---------- */
router.use(requireMember);

const imageOpts = () => ({ images: listImages(), services: services.list(), areas: areas.list() });
const afterSave = (req, res, url, action, detail) => {
  logActivity(req.member, action, detail);
  const err = rebuildSafe();
  if (err) return renderReq(req, res, { title: 'Erro ao atualizar o site', active: 'inicio', body: `<p class="flash flash--erro">${esc(err)}</p><p><a href="${url}">Voltar</a></p>` }, 500);
  res.redirect(url);
};

router.get('/', (req, res) => {
  const c = getIntegrations();
  const stats = leadStats(30);
  render(res, {
    title: 'Início', active: 'inicio',
    body: v.dashboardView({
      business: getBusiness(),
      lastBuild: getSetting('lastBuild'),
      leads: { total: stats.total, novos: newLeadsCount(), suspeitos: db.prepare("SELECT COUNT(*) n FROM leads WHERE status = 'suspeito'").get().n, byPage: stats.byPage.filter((r) => r.page_path) },
      content: { services: services.list({ activeOnly: true }).length, areas: areas.list({ activeOnly: true }).length },
      blog: db.prepare("SELECT COALESCE(SUM(status = 'publicado'), 0) published, COALESCE(SUM(status = 'rascunho'), 0) drafts FROM posts").get(),
      integrations: {
        active: [c.metaPixelId, c.metaCapiToken, c.ga4Id, c.googleAdsId, c.gtmId, c.webhookUrls, c.notifyEmails, c.instagramToken].filter(Boolean).length,
        failures: db.prepare("SELECT COUNT(*) n FROM integration_log WHERE ok = 0 AND test = 0 AND created_at >= datetime('now', '-1 day')").get().n,
      },
      isAdmin: isAdmin(req.member),
      activity: db.prepare('SELECT * FROM activity ORDER BY id DESC LIMIT 8').all(),
    }),
  });
});

/* ---------- Dados da empresa ---------- */
router.get('/contatos', (_req, res) => res.redirect('/admin/empresa'));
router.get('/empresa', (req, res) => render(res, { title: 'Dados da empresa', active: 'empresa', body: v.businessView({ csrf: req.csrf, data: getBusiness() }) }));
router.post('/empresa', (req, res) => {
  const { data, errors } = validateBusiness(req.body);
  if (errors) return renderReq(req, res, { title: 'Dados da empresa', active: 'empresa', body: v.businessView({ csrf: req.csrf, data, errors }) }, 400);
  const changed = saveBusiness(data, req.member.id);
  afterSave(req, res, '/admin/empresa?msg=contatos', 'editou os dados da empresa', changed.length ? `campos: ${changed.join(', ')}` : 'sem mudanças');
});

/* ---------- Páginas (estrutura fixa, só conteúdo) ---------- */
router.get('/paginas', (req, res) => render(res, {
  title: 'Páginas', active: 'paginas',
  body: v.pagesListView({ pages: PAGE_KEYS.map((key) => ({ key, label: PAGES[key].label, path: PAGES[key].path, meta: pageMeta(key) })) }),
}));

const pageEdit = (req, res, key, { data = getPage(key), errors = {}, status = 200 } = {}) => renderReq(req, res, {
  title: PAGES[key].label, active: 'paginas',
  body: v.pageEditView({ csrf: req.csrf, key, def: PAGES[key], data, errors, opts: imageOpts(), edited: Boolean(pageMeta(key)) }),
}, status);

router.get('/paginas/:key', (req, res, next) => (PAGES[req.params.key] ? pageEdit(req, res, req.params.key) : next()));
router.post('/paginas/:key', (req, res, next) => {
  const { key } = req.params;
  if (!PAGES[key]) return next();
  const { data, errors } = validatePage(key, req.body);
  if (Object.keys(errors).length) return pageEdit(req, res, key, { data, errors, status: 400 });
  const changed = savePage(key, data, req.member);
  afterSave(req, res, `/admin/paginas/${key}?msg=pagina`, 'editou a página', `${PAGES[key].label}${changed.length ? ` (${changed.length} campo${changed.length > 1 ? 's' : ''})` : ', sem mudanças'}`);
});
router.post('/paginas/:key/restaurar', (req, res, next) => {
  const { key } = req.params;
  if (!PAGES[key]) return next();
  resetPage(key);
  afterSave(req, res, `/admin/paginas/${key}?msg=pagina-restaurada`, 'restaurou os textos originais da página', PAGES[key].label);
});

/* ---------- Serviços e Áreas atendidas (mesmo modelo de página para todos) ---------- */
function registerCollection(path, col, kind) {
  const k = { ...kind, base: `/admin/${path}`, schema: col.schema, sitePath: col.path };
  const list = (req, res) => render(res, { title: kind.title, active: path, body: v.collectionListView({ csrf: req.csrf, kind: k, rows: col.list() }) });
  const edit = (req, res, row, { slug = row?.slug || '', data = row?.data || {}, errors = {}, status = 200 } = {}) => renderReq(req, res, {
    title: row ? kind.labelOf(row) : kind.nounNew, active: path,
    body: v.collectionEditView({ csrf: req.csrf, kind: k, row, slug, data, errors, opts: imageOpts(), faqs: row ? listFaqs({ topic: kind.faqTopic(row.slug) }) : [] }),
  }, status);

  router.get(`/${path}`, list);
  router.get(`/${path}/novo`, (req, res) => edit(req, res, null));
  router.post(`/${path}/novo`, (req, res) => {
    const { slug, data, errors } = col.validate(req.body);
    if (Object.keys(errors).length) return edit(req, res, null, { slug, data, errors, status: 400 });
    const id = col.save({ slug, data, member: req.member });
    afterSave(req, res, `/admin/${path}/${id}?msg=${kind.msg}-${kind.created}`, `criou ${kind.article} ${kind.noun.toLowerCase()}`, kind.labelOf({ data }));
  });
  router.get(`/${path}/:id`, (req, res, next) => {
    const row = /^\d+$/.test(req.params.id) && col.get(req.params.id);
    return row ? edit(req, res, row) : next();
  });
  router.post(`/${path}/:id`, (req, res, next) => {
    const row = /^\d+$/.test(req.params.id) && col.get(req.params.id);
    if (!row) return next();
    const { slug, data, errors } = col.validate(req.body, { id: row.id });
    if (Object.keys(errors).length) return edit(req, res, row, { slug, data, errors, status: 400 });
    col.save({ id: row.id, slug, data, member: req.member });
    afterSave(req, res, `/admin/${path}/${row.id}?msg=${kind.msg}`, `editou ${kind.article} ${kind.noun.toLowerCase()}`, kind.labelOf({ data }));
  });
  router.post(`/${path}/:id/:acao`, (req, res, next) => {
    const row = /^\d+$/.test(req.params.id) && col.get(req.params.id);
    if (!row) return next();
    const { acao } = req.params;
    if (acao === 'ativar' || acao === 'desativar') {
      col.setActive(row.id, acao === 'ativar');
      return afterSave(req, res, `/admin/${path}?msg=${kind.msg}-${acao === 'ativar' ? kind.activated : kind.deactivated}`, `${acao === 'ativar' ? 'ativou' : 'desativou'} ${kind.article} ${kind.noun.toLowerCase()}`, kind.labelOf(row));
    }
    if (acao === 'mover') {
      col.move(row.id, req.body.dir === 'up' ? 'up' : 'down');
      return afterSave(req, res, `/admin/${path}?msg=ordem`, `reordenou ${kind.plural}`, kind.labelOf(row));
    }
    if (acao === 'excluir') {
      col.remove(row.id);
      return afterSave(req, res, `/admin/${path}?msg=${kind.msg}-${kind.deleted}`, `excluiu ${kind.article} ${kind.noun.toLowerCase()}`, kind.labelOf(row));
    }
    next();
  });
}

registerCollection('servicos', services, {
  title: 'Serviços', noun: 'Serviço', nounNew: 'Novo serviço', article: 'o', plural: 'os serviços', msg: 'servico', created: 'criado', activated: 'ativado', deactivated: 'desativado', deleted: 'excluido',
  labelOf: (r) => r.data.name, faqTopic: (slug) => `service:${slug}`,
  intro: 'Todos os serviços usam o mesmo modelo de página. Serviços ativos aparecem no menu, no rodapé, na página de serviços e nas opções do formulário.',
});
registerCollection('cidades', areas, {
  title: 'Áreas atendidas', noun: 'Cidade', nounNew: 'Nova cidade', article: 'a', plural: 'as cidades', msg: 'cidade', created: 'criada', activated: 'ativada', deactivated: 'desativada', deleted: 'excluida',
  labelOf: (r) => r.data.label, faqTopic: (slug) => `area:${slug}`,
  intro: 'Uma página por cidade, todas no mesmo modelo. Escreva conteúdo próprio de cada cidade: páginas copiadas trocando só o nome são punidas pelo Google.',
});

/* ---------- FAQ ---------- */
router.get('/faq', (req, res) => {
  const topics = faqTopics();
  const topic = topics.some((t) => t.key === req.query.topic) ? req.query.topic : '';
  render(res, { title: 'FAQ', active: 'faq', body: v.faqListView({ csrf: req.csrf, topics, faqs: listFaqs(), topic }) });
});
const faqEdit = (req, res, faq, data, errors = {}, status = 200) => renderReq(req, res, { title: faq ? 'Editar pergunta' : 'Nova pergunta', active: 'faq', body: v.faqEditView({ csrf: req.csrf, faq, data, errors, topics: faqTopics() }) }, status);
router.get('/faq/nova', (req, res) => faqEdit(req, res, null, { topic: String(req.query.topic || 'general'), question: '', answer: '', active: 1, home: 0 }));
const faqForm = (b) => ({ ...b, active: b.active || 'off', home: b.home || 'off' });
router.post('/faq/nova', (req, res) => {
  const { data, errors } = validateFaq(faqForm(req.body));
  if (Object.keys(errors).length) return faqEdit(req, res, null, data, errors, 400);
  saveFaq(null, data);
  afterSave(req, res, `/admin/faq?topic=${encodeURIComponent(data.topic)}&msg=faq`, 'criou uma pergunta no FAQ', data.question);
});
router.get('/faq/:id', (req, res, next) => { const f = getFaq(req.params.id); return f ? faqEdit(req, res, f, f) : next(); });
router.post('/faq/:id', (req, res, next) => {
  const f = getFaq(req.params.id);
  if (!f) return next();
  const { data, errors } = validateFaq(faqForm(req.body), f);
  if (Object.keys(errors).length) return faqEdit(req, res, f, data, errors, 400);
  saveFaq(f.id, data);
  afterSave(req, res, `/admin/faq?topic=${encodeURIComponent(data.topic)}&msg=faq`, 'editou uma pergunta do FAQ', data.question);
});
router.post('/faq/:id/mover', (req, res, next) => {
  const f = getFaq(req.params.id);
  if (!f) return next();
  moveFaq(f.id, req.body.dir === 'up' ? 'up' : 'down');
  afterSave(req, res, `/admin/faq?topic=${encodeURIComponent(f.topic)}&msg=ordem`, 'reordenou o FAQ', f.question);
});
router.post('/faq/:id/excluir', (req, res, next) => {
  const f = getFaq(req.params.id);
  if (!f) return next();
  deleteFaq(f.id);
  afterSave(req, res, `/admin/faq?topic=${encodeURIComponent(f.topic)}&msg=faq-excluida`, 'excluiu uma pergunta do FAQ', f.question);
});

/* ---------- Avaliações ---------- */
router.get('/avaliacoes', (req, res) => render(res, { title: 'Avaliações', active: 'avaliacoes', body: v.reviewsListView({ csrf: req.csrf, reviews: listReviews(), areas: areas.list() }) }));
const reviewEdit = (req, res, review, data, errors = {}, status = 200) => renderReq(req, res, { title: review ? review.name : 'Nova avaliação', active: 'avaliacoes', body: v.reviewEditView({ csrf: req.csrf, review, data, errors, areas: areas.list() }) }, status);
const reviewForm = (b) => ({ ...b, active: b.active || 'off', home: b.home || 'off' });
router.get('/avaliacoes/nova', (req, res) => reviewEdit(req, res, null, { name: '', project: '', text: '', rating: 5, area: '', active: 1, home: 0 }));
router.post('/avaliacoes/nova', (req, res) => {
  const { data, errors } = validateReview(reviewForm(req.body));
  if (Object.keys(errors).length) return reviewEdit(req, res, null, data, errors, 400);
  saveReview(null, data);
  afterSave(req, res, '/admin/avaliacoes?msg=avaliacao', 'cadastrou uma avaliação', data.name);
});
router.get('/avaliacoes/:id', (req, res, next) => { const r = getReview(req.params.id); return r ? reviewEdit(req, res, r, r) : next(); });
router.post('/avaliacoes/:id', (req, res, next) => {
  const r = getReview(req.params.id);
  if (!r) return next();
  const { data, errors } = validateReview(reviewForm(req.body), r);
  if (Object.keys(errors).length) return reviewEdit(req, res, r, data, errors, 400);
  saveReview(r.id, data);
  afterSave(req, res, '/admin/avaliacoes?msg=avaliacao', 'editou uma avaliação', data.name);
});
router.post('/avaliacoes/:id/mover', (req, res, next) => {
  const r = getReview(req.params.id);
  if (!r) return next();
  moveReview(r.id, req.body.dir === 'up' ? 'up' : 'down');
  afterSave(req, res, '/admin/avaliacoes?msg=ordem', 'reordenou as avaliações', r.name);
});
router.post('/avaliacoes/:id/excluir', (req, res, next) => {
  const r = getReview(req.params.id);
  if (!r) return next();
  deleteReview(r.id);
  afterSave(req, res, '/admin/avaliacoes?msg=avaliacao-excluida', 'excluiu uma avaliação', r.name);
});

/* ---------- Usuários ---------- */
function membersPage(req, res, extra = {}) {
  render(res, {
    title: 'Usuários', active: 'membros', msg: extra.msg ?? req.query.msg,
    body: v.membersView({
      csrf: req.csrf, me: req.member, mailEnabled,
      members: db.prepare('SELECT id, name, email, role, active, last_login_at, avatar FROM members ORDER BY active DESC, role, name').all(),
      invites: db.prepare("SELECT email, role, expires_at FROM tokens WHERE kind = 'invite' AND expires_at > ? ORDER BY created_at DESC").all(new Date().toISOString()),
      ...extra,
    }),
  });
}

router.get('/membros', membersPage);

router.post('/membros/convidar', requireAdmin, async (req, res) => {
  const email = cleanEmail(req.body.email);
  const role = ROLES[req.body.role] ? req.body.role : 'editor';
  if (!EMAIL_RE.test(email)) return res.redirect('/admin/membros?msg=email-invalido');
  if (db.prepare('SELECT 1 FROM members WHERE email = ?').get(email)) return res.redirect('/admin/membros?msg=ja-membro');
  const token = createToken('invite', { email, createdBy: req.member.id, hours: INVITE_HOURS, role });
  const url = `${baseUrl()}/admin/convite/${token}`;
  logActivity(req.member, 'convidou um usuário', `${email} (${ROLES[role]})`);
  if (mailEnabled) {
    const sent = await sendMail({
      to: email,
      subject: `Convite para o painel do site ${SITE.name}`,
      text: `Olá.\n\n${req.member.name} convidou você para o painel do site ${SITE.name}, como ${ROLES[role]}. Para criar a sua conta, use o link abaixo, que vale por ${INVITE_HOURS} horas:\n\n${url}`,
    }).catch((err) => { console.error('Falha ao enviar convite:', err.message); return false; });
    if (sent) return res.redirect('/admin/membros?msg=convite-email');
  }
  membersPage(req, res, { msg: 'convite', newLink: { label: 'Link de convite criado.', email, url, hours: INVITE_HOURS } });
});

router.post('/membros/convites/cancelar', requireAdmin, (req, res) => {
  const email = cleanEmail(req.body.email);
  db.prepare("DELETE FROM tokens WHERE kind = 'invite' AND email = ?").run(email);
  logActivity(req.member, 'cancelou um convite', email);
  res.redirect('/admin/membros?msg=convite-cancelado');
});

router.post('/membros/:id/:acao', requireAdmin, async (req, res, next) => {
  const target = db.prepare('SELECT * FROM members WHERE id = ?').get(Number(req.params.id));
  if (!target) return next();
  const { acao } = req.params;
  if (target.id === req.member.id) return res.redirect('/admin/membros?msg=proprio-membro');
  const lastAdmin = target.active && target.role === 'admin' && activeAdmins() <= 1;

  if (acao === 'papel') {
    const role = ROLES[req.body.role] ? req.body.role : target.role;
    if (role !== 'admin' && lastAdmin) return res.redirect('/admin/membros?msg=ultimo-membro');
    db.prepare('UPDATE members SET role = ? WHERE id = ?').run(role, target.id);
    logActivity(req.member, 'mudou o papel de um usuário', `${target.name}: ${ROLES[role]}`);
    return res.redirect('/admin/membros?msg=papel');
  }
  if (acao === 'redefinir') {
    const token = createToken('reset', { email: target.email, memberId: target.id, createdBy: req.member.id, hours: 24 });
    logActivity(req.member, 'gerou link de nova senha', target.name);
    return membersPage(req, res, { msg: '', newLink: { label: `Link de nova senha para ${target.name}.`, email: target.email, url: `${baseUrl()}/admin/redefinir/${token}`, hours: 24 } });
  }
  if (acao === 'ativar') {
    db.prepare('UPDATE members SET active = 1 WHERE id = ?').run(target.id);
    logActivity(req.member, 'reativou um usuário', target.name);
    return res.redirect('/admin/membros?msg=ativado');
  }
  if (acao === 'desativar' || acao === 'remover') {
    if (lastAdmin) return res.redirect('/admin/membros?msg=ultimo-membro');
    if (acao === 'desativar') {
      db.prepare('UPDATE members SET active = 0 WHERE id = ?').run(target.id);
      db.prepare('DELETE FROM sessions WHERE member_id = ?').run(target.id);
      logActivity(req.member, 'desativou um usuário', target.name);
      return res.redirect('/admin/membros?msg=desativado');
    }
    db.prepare('DELETE FROM members WHERE id = ?').run(target.id);
    logActivity(req.member, 'removeu um usuário', `${target.name} (${target.email})`);
    return res.redirect('/admin/membros?msg=removido');
  }
  next();
});

/* ---------- Meu perfil ---------- */
const profilePage = (req, res, { status = 200, errors, values } = {}) => res.status(status).send(v.page({
  ...pageOpts(req), title: 'Meu perfil', active: 'perfil',
  body: v.profileView({ csrf: req.csrf, member: req.member, errors, values }),
}));

router.get('/perfil', (req, res) => profilePage(req, res));

router.post('/perfil', (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 80);
  if (!name) return profilePage(req, res, { status: 400, errors: { name: 'Informe o seu nome.' }, values: { name } });
  db.prepare('UPDATE members SET name = ? WHERE id = ?').run(name, req.member.id);
  logActivity({ ...req.member, name }, 'atualizou o perfil');
  res.redirect('/admin/perfil?msg=perfil');
});

router.post('/perfil/email', (req, res) => {
  const email = cleanEmail(req.body.email);
  const me = db.prepare('SELECT * FROM members WHERE id = ?').get(req.member.id);
  const errors = {};
  if (!EMAIL_RE.test(email)) errors.email = 'Informe um e-mail válido.';
  else if (db.prepare('SELECT 1 FROM members WHERE email = ? AND id != ?').get(email, me.id)) errors.email = 'Esse e-mail já pertence a outro usuário.';
  if (!verifyPassword(String(req.body.current || ''), me.password_hash)) errors.emailCurrent = 'Senha atual incorreta.';
  if (Object.keys(errors).length) return profilePage(req, res, { status: 400, errors, values: { email } });
  db.prepare('UPDATE members SET email = ? WHERE id = ?').run(email, me.id);
  db.prepare('DELETE FROM tokens WHERE member_id = ?').run(me.id);
  logActivity(req.member, 'alterou o e-mail de acesso', `${me.email} para ${email}`);
  res.redirect('/admin/perfil?msg=email');
});

router.post('/perfil/senha', (req, res) => {
  const { current, password, password2 } = req.body;
  const me = db.prepare('SELECT * FROM members WHERE id = ?').get(req.member.id);
  const errors = {};
  if (!verifyPassword(String(current || ''), me.password_hash)) errors.current = 'Senha atual incorreta.';
  const problem = passwordProblem(password);
  if (problem) errors.password = problem;
  else if (password !== password2) errors.password2 = 'As senhas não conferem.';
  if (Object.keys(errors).length) return profilePage(req, res, { status: 400, errors });
  db.prepare('UPDATE members SET password_hash = ? WHERE id = ?').run(hashPassword(password), me.id);
  destroyOtherSessions(me.id, req);
  logActivity(req.member, 'alterou a senha');
  res.redirect('/admin/perfil?msg=senha');
});

router.post('/perfil/foto', async (req, res) => {
  const file = uploaded(req, 'file');
  let error = req.uploadError || (!file ? 'Escolha uma imagem.' : null);
  if (!error) {
    try { await saveAvatar(file.buffer, req.member.id); } catch (err) { error = err.message; }
  }
  if (error) return profilePage(req, res, { status: 400, errors: { photo: error } });
  logActivity(req.member, 'atualizou a foto de perfil');
  res.redirect('/admin/perfil?msg=foto');
});

router.post('/perfil/foto/remover', (req, res) => {
  removeAvatar(req.member.id);
  res.redirect('/admin/perfil?msg=foto-removida');
});

router.get('/avatares/:file', (req, res) => {
  res.set('Cache-Control', 'private, max-age=86400');
  res.sendFile(path.join(AVATARS, path.basename(req.params.file)), (err) => err && res.status(404).end());
});

/* ---------- Atividades ---------- */
router.get('/atividades', (req, res) => render(res, {
  title: 'Atividades', active: 'atividades',
  body: v.activityView({ rows: db.prepare('SELECT * FROM activity ORDER BY id DESC LIMIT 200').all() }),
}));

/* ---------- Leads ---------- */
router.get('/leads', (req, res) => {
  const f = parseFilters(req.query);
  render(res, { title: 'Leads', active: 'leads', body: v.leadsView({ f, ...listLeads(f), pages: leadPages(), services: leadServices() }) });
});

router.get('/leads/exportar', (req, res) => {
  const f = parseFilters(req.query);
  const { rows } = listLeads(f, { all: true });
  logActivity(req.member, 'exportou leads em CSV', `${rows.length} registros`);
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="leads-castro-${new Date().toISOString().slice(0, 10)}.csv"`,
  });
  res.send(leadsCsv(rows));
});

router.get('/leads/:id', (req, res, next) => {
  const lead = getLead(req.params.id);
  if (!lead) return next();
  render(res, { title: lead.name, active: 'leads', body: v.leadView({ csrf: req.csrf, lead, notes: leadNotes(lead.id) }) });
});

router.post('/leads/:id/status', (req, res, next) => {
  const lead = getLead(req.params.id);
  if (!lead) return next();
  const status = String(req.body.status || '');
  if (!STATUS[status]) return res.redirect(`/admin/leads/${lead.id}`);
  if (setLeadStatus(lead, status)) {
    logActivity(req.member, 'mudou o status de um lead', `${lead.name}: ${STATUS[lead.status]} para ${STATUS[status]}`);
  }
  res.redirect(`/admin/leads/${lead.id}?msg=lead-status`);
});

router.post('/leads/:id/notas', (req, res, next) => {
  const lead = getLead(req.params.id);
  if (!lead) return next();
  const text = String(req.body.text || '').trim().slice(0, 3000);
  if (text) {
    addLeadNote(lead, req.member, text);
    logActivity(req.member, 'anotou em um lead', lead.name);
  }
  res.redirect(`/admin/leads/${lead.id}?msg=lead-nota`);
});

router.post('/leads/:id/excluir', (req, res, next) => {
  const lead = getLead(req.params.id);
  if (!lead) return next();
  db.prepare('DELETE FROM leads WHERE id = ?').run(lead.id);
  // Removes the lead's name from the activity log, so no personal data stays after deletion.
  db.prepare('UPDATE activity SET detail = replace(detail, ?, ?) WHERE instr(detail, ?) > 0').run(lead.name, `lead nº ${lead.id}`, lead.name);
  logActivity(req.member, 'excluiu um lead', `lead nº ${lead.id}`);
  res.redirect('/admin/leads?msg=lead-excluido');
});

/* ---------- Blog ---------- */
const editorPage = (req, res, { status = 200, post = null, data, errors, warnings }) => res.status(status).send(v.page({
  ...pageOpts(req), title: post ? post.title : 'Novo artigo', active: 'blog',
  body: v.postEditView({ csrf: req.csrf, post, data, errors, warnings, images: listImages(), categories: categories(), services: services.list() }),
}));

router.get('/blog', (req, res) => {
  const status = POST_STATUS[req.query.status] ? req.query.status : '';
  render(res, { title: 'Blog', active: 'blog', body: v.blogListView({ posts: listPosts({ status }), status }) });
});

router.get('/blog/novo', (req, res) => editorPage(req, res, { data: { title: '', slug: '', body: '', featured: 0, service: '' } }));

/* Pré-visualização com o mesmo template do site, sem salvar nada. */
router.post('/blog/previa', async (req, res) => {
  const { data } = validatePost(req.body);
  const raw = rowToRaw({ ...data, published_date: null, updated_date: null });
  try {
    const html = blogPost({ post: preparePost(raw), posts: [] })
      .replace('<head>', '<head><meta name="robots" content="noindex">')
      .replace('<body', '<body data-preview');
    const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/(ld\+)?json)[^>]*>([\s\S]*?)<\/script>/g)]
      .map((m) => `'sha256-${crypto.createHash('sha256').update(m[2]).digest('base64')}'`).join(' ');
    res.set('Content-Security-Policy', `default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; script-src 'self' ${hashes}; frame-ancestors 'none'`);
    res.send(html.replace('</body>', '<div style="position:fixed;bottom:16px;left:16px;z-index:99;background:#00213f;color:#fff;padding:8px 14px;border-radius:999px;font:14px sans-serif">Pré-visualização, não publicada</div></body>'));
  } catch (err) {
    res.status(400).send(`Não foi possível pré-visualizar: ${esc(err.message)}`);
  }
});

async function handleSave(req, res, post) {
  const acao = String(req.body.acao || 'salvar');
  const publish = acao === 'publicar' ? true : acao === 'despublicar' ? false : undefined;
  const input = { ...req.body };
  const file = uploaded(req, 'cover_file');
  const errors0 = {};
  if (req.uploadError) errors0.cover = req.uploadError;
  else if (file) {
    try { input.cover = await saveImage(file.buffer, file.originalname, req.member); } catch (err) { errors0.cover = err.message; }
  }
  const { data, errors, warnings } = validatePost(input, { id: post?.id ?? null, publishing: publish === true || (publish === undefined && post?.status === 'publicado') });
  Object.assign(errors, errors0);
  if (Object.keys(errors).length) return editorPage(req, res, { status: 400, post, data, errors, warnings });

  const { id, status, changedPublic } = savePost({ id: post?.id ?? null, data, member: req.member, publish });
  const verb = !post ? 'criou o artigo' : publish === true && post.status !== 'publicado' ? 'publicou o artigo' : publish === false ? 'despublicou o artigo' : 'editou o artigo';
  logActivity(req.member, publish === true && !post ? 'criou e publicou o artigo' : verb, data.title);
  const buildError = changedPublic ? rebuildSafe() : null;
  if (buildError) return editorPage(req, res, { status: 500, post: getPost(id), data, errors: { build: buildError }, warnings });
  const msg = publish === false ? 'post-despublicado' : status === 'publicado' ? (post?.status === 'publicado' ? 'post-atualizado' : 'post-publicado') : 'post-salvo';
  res.redirect(`/admin/blog/${id}?msg=${msg}`);
}

router.post('/blog/novo', (req, res) => handleSave(req, res, null));

router.get('/blog/imagens', (_req, res) => res.redirect('/admin/imagens'));

router.get('/blog/:id', (req, res, next) => {
  const post = getPost(req.params.id);
  if (!post) return next();
  const { warnings } = validatePost(post, { id: post.id, publishing: post.status === 'publicado' });
  editorPage(req, res, { post, data: post, warnings });
});

router.post('/blog/:id', (req, res, next) => {
  const post = getPost(req.params.id);
  if (!post) return next();
  handleSave(req, res, post);
});

router.post('/blog/:id/excluir', (req, res, next) => {
  const post = getPost(req.params.id);
  if (!post) return next();
  deletePost(post.id);
  logActivity(req.member, 'excluiu o artigo', post.title);
  if (post.status === 'publicado') rebuildSafe();
  res.redirect('/admin/blog?msg=post-excluido');
});

/* ---------- Imagens ---------- */
const imagesPage = (req, res, error, status = 200) => renderReq(req, res, { title: 'Imagens', active: 'imagens', body: v.imagesView({ csrf: req.csrf, images: listImages(), error }) }, status);
router.get('/imagens', (req, res) => imagesPage(req, res));
router.post('/imagens', async (req, res) => {
  const file = uploaded(req, 'file');
  let error = req.uploadError || (!file ? 'Escolha uma imagem.' : null);
  if (!error) {
    try {
      const id = await saveImage(file.buffer, file.originalname, req.member);
      logActivity(req.member, 'enviou uma imagem', id);
      rebuildSafe();
      return res.redirect('/admin/imagens?msg=imagem-enviada');
    } catch (err) { error = err.message; }
  }
  imagesPage(req, res, error, 400);
});
router.post('/imagens/:id/excluir', (req, res) => {
  try {
    deleteImage(req.params.id);
    logActivity(req.member, 'excluiu uma imagem', req.params.id);
    res.redirect('/admin/imagens?msg=imagem-excluida');
  } catch (err) {
    imagesPage(req, res, err.message, 400);
  }
});

/* ---------- Integrações (só administradores) ---------- */
const integrationsPage = (req, res, { status = 200, c = getIntegrations(), errors, testResult } = {}) => res.status(status).send(v.page({
  ...pageOpts(req), title: 'Integrações', active: 'integracoes',
  body: v.integrationsView({ csrf: req.csrf, c, errors, log: recentLog(), mailEnabled, testResult, actions: ACTIONS, metaEvents: META_EVENTS, instagram: { lastSync: getSetting('instagramLastSync', 0) } }),
}));

router.get('/integracoes', requireAdmin, (req, res) => integrationsPage(req, res));

router.post('/integracoes', requireAdmin, (req, res) => {
  const before = getIntegrations();
  const { data, errors } = validateIntegrations({ cookieBanner: 'off', onlyProdHosts: 'off', ...req.body }, before);
  if (Object.keys(errors).length) return integrationsPage(req, res, { status: 400, c: { ...data, metaCapiToken: before.metaCapiToken, instagramToken: before.instagramToken }, errors });
  saveIntegrations(data, req.member.id);
  const SECRET = { metaCapiToken: 'token da Conversions API', instagramToken: 'token do Instagram' };
  const changed = Object.keys(data).filter((k) => JSON.stringify(data[k]) !== JSON.stringify(before[k])).map((k) => SECRET[k] || k);
  afterSave(req, res, '/admin/integracoes?msg=integracoes', 'editou Integrações', changed.length ? `campos: ${changed.join(', ')}` : 'sem mudanças');
});

router.post('/integracoes/segredo', requireAdmin, (req, res) => {
  regenerateWebhookSecret(req.member.id);
  logActivity(req.member, 'gerou um novo segredo do webhook');
  res.redirect('/admin/integracoes?msg=segredo');
});

router.post('/integracoes/testar/:kind', requireAdmin, async (req, res) => {
  const kind = req.params.kind;
  if (!['meta_capi', 'webhook', 'email', 'instagram'].includes(kind)) return res.redirect('/admin/integracoes');
  const r = await runTest(kind);
  logActivity(req.member, 'testou uma integração', kind);
  if (kind === 'instagram' && r?.ok) rebuildSafe();
  const testResult = r?.error ? { ok: false, text: r.error } : r ? { ok: Boolean(r.ok), text: `Teste: ${r.detail}` } : { ok: false, text: 'Nada para testar: a integração não está configurada.' };
  integrationsPage(req, res, { testResult });
});

/* ---------- Conectar IA (MCP) ---------- */
router.get('/conectar/:id', (req, res) => {
  const pending = getPending(req.params.id);
  if (pending) {
    const target = new URL(pending.params.redirectUri);
    const allowed = /^https?:$/.test(target.protocol) ? target.origin : target.protocol;
    res.set('Content-Security-Policy', res.get('Content-Security-Policy').replace("form-action 'self'", `form-action 'self' ${allowed}`));
  }
  render(res, { title: 'Conectar aplicativo', active: 'ia', body: pending ? v.consentView({ csrf: req.csrf, pending, member: req.member }) : v.consentInvalidView() });
});

router.post('/conectar/:id', (req, res) => {
  const pending = getPending(req.params.id);
  if (!pending) return render(res, { title: 'Conectar aplicativo', active: 'ia', body: v.consentInvalidView() });
  const name = pending.client.client_name || 'aplicativo sem nome';
  if (req.body.decisao === 'permitir') {
    logActivity(req.member, 'conectou um aplicativo de IA', name);
    return res.redirect(approvePending(pending, req.member.id));
  }
  logActivity(req.member, 'negou acesso a um aplicativo de IA', name);
  res.redirect(denyPending(pending));
});

const iaPage = (req, res, extra = {}) => render(res, {
  title: 'Conectar IA (MCP)', active: 'ia',
  body: v.iaView({ csrf: req.csrf, mcpUrl: mcpResourceUrl().href, tokens: personalTokens(req.member.id), apps: connectedApps(req.member.id), ...extra }),
});

router.get('/ia', (req, res) => iaPage(req, res));

router.post('/ia/tokens', (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 60) || 'Token sem nome';
  const token = createPersonalToken(req.member.id, name);
  logActivity(req.member, 'gerou um token de acesso para IA', name);
  iaPage(req, res, { newToken: token });
});

router.post('/ia/tokens/:id/revogar', (req, res) => {
  if (revokePersonalToken(req.member.id, req.params.id)) logActivity(req.member, 'revogou um token de acesso para IA');
  res.redirect('/admin/ia?msg=token-revogado');
});

router.post('/ia/apps/:id/desconectar', (req, res) => {
  if (revokeGrant(req.member.id, req.params.id)) logActivity(req.member, 'desconectou um aplicativo de IA');
  res.redirect('/admin/ia?msg=app-desconectado');
});
