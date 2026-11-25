// Leads: the estimate form endpoint (/api/leads) with the anti-spam layers ported from the old api/lead.php,
// source classification, and the queries used by the panel, the CSV export and the MCP.
//
// Layers (cheapest first): honeypots, signed time token (min fill time, max age, single use), proof-of-work,
// per-IP rate limit, strict field validation (US phone), content filters, foreign-traffic signals, duplicate phone.
// Obvious bots get a fake success ("shadow drop") and are never stored. Borderline leads are stored with status
// "suspeito" (quarantine): visible in the panel, but not sent to the webhook, e-mail or Meta.
import crypto from 'node:crypto';
import express from 'express';
import { db, getSetting, setSetting } from './db.mjs';
import { SITE, FORM, ANTISPAM as AS } from '../src/site.config.mjs';
import { onLeadCreated } from './integrations.mjs';
import { services } from './content.mjs';

export const STATUS = {
  novo: 'Novo',
  em_contato: 'Em contato',
  orcamento: 'Orçamento enviado',
  cliente: 'Cliente',
  descartado: 'Descartado',
  suspeito: 'Suspeito (quarentena)',
};

export const SOURCES = {
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  outros_anuncios: 'Outros anúncios',
  redes_sociais: 'Redes sociais',
  busca_organica: 'Busca orgânica',
  campanha: 'Campanha (UTM)',
  outros_sites: 'Outros sites',
  direto: 'Direto',
};

const PAID = /^(cpc|ppc|paid|ads?|paidsocial|paid_social|paid-social|cpm|display|social_paid)$/i;
const META = /^(facebook|fb|instagram|ig|meta|messenger|audience_network|an)$/i;
const SEARCH_HOSTS = /(^|\.)(google|bing|yahoo|duckduckgo|ecosia|yandex|baidu)\./i;
const SOCIAL_HOSTS = /(^|\.)(facebook|fb|instagram|linkedin|lnkd|t|x|twitter|youtube|tiktok|whatsapp|pinterest|threads|nextdoor)\.(com|co|me|net|in)$/i;

/* Order: Google paid click, paid UTM, fbclid, plain UTM, referring site, direct. */
export function classifySource(l) {
  if (l.gclid) return 'google_ads';
  const src = (l.utm_source || '').trim();
  if (src && PAID.test(l.utm_medium || '')) {
    if (/^(google|adwords|youtube)$/i.test(src)) return 'google_ads';
    return META.test(src) ? 'meta_ads' : 'outros_anuncios';
  }
  if (l.fbclid) return 'meta_ads';
  if (src) return META.test(src) || /^(linkedin|tiktok|youtube|twitter|x|nextdoor)$/i.test(src) ? 'redes_sociais' : 'campanha';
  let host = '';
  try { host = l.referrer ? new URL(l.referrer).hostname : ''; } catch { /* invalid referrer */ }
  if (host) {
    if (SEARCH_HOSTS.test(host)) return 'busca_organica';
    if (SOCIAL_HOSTS.test(host) || host === 'l.instagram.com' || host === 'lm.facebook.com') return 'redes_sociais';
    return 'outros_sites';
  }
  return 'direto';
}

const str = (v, max) => String(v ?? '').replace(/[\r\n\t]+/g, (m) => (max > 400 ? m : ' ')).trim().slice(0, max);
const short = (v, max) => String(v ?? '').trim().slice(0, max);
/* Path of a page URL or path: "https://site/trim/?x=1" -> "/trim/". */
export const pathOf = (v) => {
  const s = String(v || '').trim();
  if (!s) return '';
  try { return new URL(s, SITE.url).pathname.slice(0, 200); } catch { return ''; }
};
export const serviceOptions = () => [...services.list({ activeOnly: true }).map((s) => s.data.name.replace(/\*\*/g, '')), ...FORM.extraServices];

/* ---------- Anti-spam secret, tokens and counters (stored in the database, no raw IPs) ---------- */
function secret() {
  let s = getSetting('antispamSecret');
  if (!s) { s = crypto.randomBytes(32).toString('hex'); setSetting('antispamSecret', s); }
  return s;
}
const hmac = (v) => crypto.createHmac('sha256', secret()).update(v).digest('hex');
const now = () => Math.floor(Date.now() / 1000);
const guard = {
  get: (k) => db.prepare('SELECT value FROM spam_guard WHERE key = ? AND expires_at > ?').get(k, now())?.value,
  set: (k, v, ttl) => db.prepare('INSERT OR REPLACE INTO spam_guard (key, value, expires_at) VALUES (?, ?, ?)').run(k, String(v), now() + ttl),
};
setInterval(() => db.prepare('DELETE FROM spam_guard WHERE expires_at < ?').run(now()), 30 * 60e3).unref();

export function issueToken() {
  const payload = `${now()}.${crypto.randomBytes(8).toString('hex')}`;
  return `${payload}.${hmac(payload)}`;
}

const sha = (v) => crypto.createHash('sha256').update(v).digest('hex');

/* ---------- Validation ---------- */
export function validateLead(b) {
  const digits = String(b.phone || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  const lead = {
    name: str(b.name, 80),
    email: short(b.email, 120).toLowerCase(),
    phone: digits,
    town: str(b.town, 60),
    service: short(b.service, 120),
    timeframe: FORM.timeframes.includes(b.timeframe) ? b.timeframe : '',
    message: short(b.message, 2000),
    form: short(b.form, 60) || 'estimate',
    page_url: short(b.page_url, 300),
    landing_page: short(b.landing_page, 300),
    referrer: short(b.referrer, 300),
    utm_source: short(b.utm_source, 200),
    utm_medium: short(b.utm_medium, 200),
    utm_campaign: short(b.utm_campaign, 300),
    utm_term: short(b.utm_term, 300),
    utm_content: short(b.utm_content, 300),
    gclid: short(b.gclid, 500),
    fbclid: short(b.fbclid, 500),
    fbp: short(b.fbp, 200),
    fbc: short(b.fbc, 600),
    event_id: short(b.event_id, 80),
  };
  const fields = [];
  if (lead.name.length < 2) fields.push('name');
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) fields.push('phone');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) fields.push('email');
  if (lead.town.length < 2) fields.push('town');
  if (!serviceOptions().includes(lead.service)) fields.push('service');
  if (String(b.message || '').length > 2000) fields.push('message');
  lead.page_path = pathOf(lead.page_url);
  lead.source = classifySource(lead);
  return { lead, fields };
}

/* Content filters and foreign-traffic signals. Returns a reason (quarantine) or ''. */
function spamSignals(lead, b, req) {
  const all = `${lead.name} ${lead.email} ${lead.town} ${lead.message}`;
  if (/[\p{Script=Cyrillic}\p{Script=Han}\p{Script=Arabic}\p{Script=Hangul}\p{Script=Thai}\p{Script=Hebrew}\p{Script=Devanagari}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(all)) return 'content:script';
  if ((all.match(/(https?:\/\/|www\.|\.(ru|cn|top|xyz|click|link|shop)\b)/gi) || []).length > 1) return 'content:links';
  if (/https?:\/\/|www\./i.test(lead.name + lead.town)) return 'content:url-in-name';
  if (/\b(seo|backlinks?|guest post|rank(ing)? (your|on)|web ?design|website redesign|crypto|bitcoin|casino|viagra|cialis|loan offer|marketing services|lead generation|virtual assistant|outsourc)/i.test(all)) return 'content:pitch';
  if (/\d{3,}/.test(lead.name)) return 'content:digits-in-name';
  const country = String(req.get('cf-ipcountry') || req.get('x-country-code') || '').toUpperCase();
  if (country && country !== 'XX' && !AS.allowedCountries.includes(country)) return `geo:${country}`;
  let score = 0;
  const why = [];
  const tz = String(b.tz || '');
  if (!tz.startsWith('America/')) { score++; why.push(`tz:${tz}`); }
  const lang = String(b.lang || req.get('accept-language') || '').slice(0, 2).toLowerCase();
  if (!AS.allowedLangs.includes(lang)) { score++; why.push(`lang:${lang}`); }
  if (/^\d{5}$/.test(lead.town) && !lead.town.startsWith(AS.zipPrefix)) { score++; why.push('zip-out-of-area'); }
  const ua = req.get('user-agent') || '';
  if (!ua || /curl|python|wget|httpclient|java\/|go-http|headless/i.test(ua)) { score += 2; why.push('ua'); }
  return score >= 2 ? `signals:${why.join(',')}` : '';
}

const COLUMNS = ['status', 'name', 'email', 'phone', 'town', 'service', 'timeframe', 'message', 'form', 'page_url', 'page_path', 'source', 'landing_page', 'referrer',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'fbp', 'fbc', 'event_id', 'user_agent', 'spam_reason'];

export function insertLead(lead) {
  const { lastInsertRowid } = db.prepare(`INSERT INTO leads (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map(() => '?').join(', ')})`)
    .run(...COLUMNS.map((c) => lead[c] ?? (c === 'status' ? 'novo' : '')));
  return Number(lastInsertRowid);
}

/* ---------- Public API ---------- */
export const api = express.Router();
const ok = (res) => res.json({ success: true, ok: true });
const rejected = (reason) => console.log(`[lead] rejeitado: ${reason}`);

const tokenRoute = (_req, res) => res.json({ token: issueToken() });
api.get('/leads/token', tokenRoute);
api.get('/lead.php', tokenRoute); // pages cached from the old site

const handleLead = (req, res) => {
  const origin = req.get('origin');
  if (origin) {
    let host = null;
    try { host = new URL(origin).host; } catch { /* invalid origin */ }
    if (host !== req.get('host')) return res.status(403).json({ success: false });
  }
  const b = req.body || {};

  // 1. Honeypots
  for (const hp of ['website', 'company', 'fax', 'botcheck']) if (b[hp]) { rejected(`honeypot:${hp}`); return ok(res); }

  // 2. Signed token: proves the page was loaded and JS ran; enforces fill time; single use.
  const token = String(b.form_token || '');
  const parts = token.split('.');
  const valid = parts.length === 3 && parts[2].length === 64
    && crypto.timingSafeEqual(Buffer.from(hmac(`${parts[0]}.${parts[1]}`)), Buffer.from(parts[2]));
  if (!valid) { rejected('token:invalid'); return ok(res); }
  const age = now() - Number(parts[0]);
  if (age < AS.minSeconds) { rejected('token:too-fast'); return ok(res); }
  if (age > AS.maxSeconds) return res.status(400).json({ success: false, message: 'This form expired. Please refresh the page and try again.' });
  const tokenKey = `used:${sha(token).slice(0, 32)}`;
  if (guard.get(tokenKey)) { rejected('token:replay'); return ok(res); }

  // 3. Proof-of-work computed in the browser.
  if (!sha(`${token}:${String(b.pow || '')}`).startsWith(AS.powPrefix)) { rejected('pow'); return ok(res); }

  // 4. Rate limit per IP (stored as a hash).
  const ipKey = `rate:${hmac(req.ip || '').slice(0, 32)}`;
  const hits = JSON.parse(guard.get(ipKey) || '[]').filter((t) => t > now() - 86400);
  if (hits.filter((t) => t > now() - 3600).length >= AS.rateHour || hits.length >= AS.rateDay) {
    rejected('rate-limit');
    return res.status(429).json({ success: false, message: 'We already received several requests from this connection. Please give us a call.' });
  }

  // 5. Field validation (real people get a clear error to fix).
  const { lead, fields } = validateLead(b);
  if (fields.length) return res.status(422).json({ success: false, fields, message: 'Please check the highlighted fields. We need a 10-digit US phone number.' });
  lead.user_agent = short(req.get('user-agent'), 300);

  // 6 and 7. Content filters and foreign signals: kept in quarantine instead of lost.
  const reason = spamSignals(lead, b, req);

  // 8. Duplicate (same phone in 15 minutes): accept quietly, don't store twice.
  const dupKey = `dup:${hmac(lead.phone).slice(0, 32)}`;
  if (!reason && guard.get(dupKey)) return ok(res);

  guard.set(tokenKey, 1, AS.maxSeconds + 60);
  guard.set(ipKey, JSON.stringify([...hits, now()]), 86400);
  if (!reason) guard.set(dupKey, 1, 900);
  if (reason) { lead.status = 'suspeito'; lead.spam_reason = reason; }
  const id = insertLead(lead);
  ok(res);
  if (!reason) onLeadCreated({ ...lead, id, created_at: new Date().toISOString() }, { ip: req.ip, consent: b.consent === 'granted' ? 'granted' : b.consent === 'denied' ? 'denied' : '' });
};

const bodyParsers = [express.urlencoded({ extended: false, limit: '20kb' }), express.json({ limit: '20kb' })];
api.post('/leads', ...bodyParsers, handleLead);
api.post('/lead.php', ...bodyParsers, handleLead);

/* ---------- Panel queries ---------- */
const PERIODS = { 7: '-7 days', 30: '-30 days', 90: '-90 days', 365: '-365 days' };

/* Typed dates are in the business time zone (with daylight saving); the database stores UTC. */
export function localDayToUtc(day, plusDays = 0) {
  const [y, m, d] = day.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d + plusDays, 12);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: SITE.timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
  const offset = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute) - guess;
  return new Date(Date.UTC(y, m - 1, d + plusDays) - offset).toISOString().slice(0, 19).replace('T', ' ');
}

export function parseFilters(q) {
  const f = {
    periodo: ['7', '30', '90', '365', 'tudo', 'datas'].includes(q.periodo) ? q.periodo : '30',
    de: /^\d{4}-\d{2}-\d{2}$/.test(q.de || '') ? q.de : '',
    ate: /^\d{4}-\d{2}-\d{2}$/.test(q.ate || '') ? q.ate : '',
    status: STATUS[q.status] ? q.status : '',
    origem: SOURCES[q.origem] ? q.origem : '',
    pagina_site: short(q.pagina_site, 200),
    entrada: short(q.entrada, 200),
    servico: short(q.servico, 120),
    busca: short(q.busca, 100),
    pagina: Math.max(1, parseInt(q.pagina, 10) || 1),
  };
  if (f.de || f.ate) f.periodo = 'datas';
  return f;
}

function where(f, { ignoreStatus = false } = {}) {
  const sql = [];
  const args = [];
  if (PERIODS[f.periodo]) { sql.push("created_at >= datetime('now', ?)"); args.push(PERIODS[f.periodo]); }
  if (f.periodo === 'datas') {
    if (f.de) { sql.push('created_at >= ?'); args.push(localDayToUtc(f.de)); }
    if (f.ate) { sql.push('created_at < ?'); args.push(localDayToUtc(f.ate, 1)); }
  }
  if (f.status && !ignoreStatus) { sql.push('status = ?'); args.push(f.status); }
  else if (!ignoreStatus) sql.push("status != 'suspeito'");
  if (f.origem) { sql.push('source = ?'); args.push(f.origem); }
  if (f.pagina_site) { sql.push('page_path = ?'); args.push(f.pagina_site); }
  if (f.entrada) { sql.push('landing_page LIKE ?'); args.push(`%${f.entrada.replace(/[%_\\]/g, '')}%`); }
  if (f.servico) { sql.push('service = ?'); args.push(f.servico); }
  if (f.busca) {
    const like = `%${f.busca.replace(/[%_\\]/g, '\\$&')}%`;
    const digits = f.busca.replace(/\D/g, '');
    sql.push(`(name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR town LIKE ? ESCAPE '\\'${digits.length >= 4 ? ' OR phone LIKE ?' : ''})`);
    args.push(like, like, like);
    if (digits.length >= 4) args.push(`%${digits}%`);
  }
  return { sql: sql.length ? `WHERE ${sql.join(' AND ')}` : '', args };
}

export const PAGE_SIZE = 50;

export function listLeads(f, { all = false } = {}) {
  const w = where(f);
  const total = db.prepare(`SELECT COUNT(*) n FROM leads ${w.sql}`).get(...w.args).n;
  const limit = all ? '' : `LIMIT ${PAGE_SIZE} OFFSET ${(f.pagina - 1) * PAGE_SIZE}`;
  const rows = db.prepare(`SELECT * FROM leads ${w.sql} ORDER BY id DESC ${limit}`).all(...w.args);
  const ws = where(f, { ignoreStatus: true });
  const byStatus = Object.fromEntries(db.prepare(`SELECT status, COUNT(*) n FROM leads ${ws.sql} GROUP BY status`).all(...ws.args).map((r) => [r.status, r.n]));
  return { total, rows, byStatus };
}

/* Pages that generated leads (for the filter), with counts. */
export const leadPages = () => db.prepare("SELECT page_path, COUNT(*) n FROM leads WHERE page_path != '' GROUP BY page_path ORDER BY n DESC").all();
export const leadServices = () => db.prepare("SELECT service, COUNT(*) n FROM leads WHERE service != '' GROUP BY service ORDER BY n DESC").all();

export function setLeadStatus(lead, status) {
  if (!STATUS[status] || status === lead.status) return false;
  db.prepare("UPDATE leads SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, lead.id);
  return true;
}

export function addLeadNote(lead, member, text, via = 'painel') {
  db.prepare('INSERT INTO lead_notes (lead_id, member_id, member_name, text, via) VALUES (?, ?, ?, ?, ?)').run(lead.id, member.id, member.name, text, via);
  db.prepare("UPDATE leads SET updated_at = datetime('now') WHERE id = ?").run(lead.id);
}

export const getLead = (id) => db.prepare('SELECT * FROM leads WHERE id = ?').get(Number(id));
export const leadNotes = (id) => db.prepare('SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY id DESC').all(Number(id));
export const newLeadsCount = () => db.prepare("SELECT COUNT(*) n FROM leads WHERE status = 'novo'").get().n;

export function leadStats(days = 30) {
  const since = `-${days} days`;
  const base = "created_at >= datetime('now', ?) AND status != 'suspeito'";
  return {
    total: db.prepare(`SELECT COUNT(*) n FROM leads WHERE ${base}`).get(since).n,
    bySource: db.prepare(`SELECT source, COUNT(*) n FROM leads WHERE ${base} GROUP BY source ORDER BY n DESC`).all(since),
    byPage: db.prepare(`SELECT page_path, COUNT(*) n FROM leads WHERE ${base} GROUP BY page_path ORDER BY n DESC LIMIT 10`).all(since),
    byService: db.prepare(`SELECT service, COUNT(*) n FROM leads WHERE ${base} GROUP BY service ORDER BY n DESC`).all(since),
  };
}

/* ---------- CSV (comma-separated, UTF-8 with BOM; opens in Excel and Google Sheets) ---------- */
const fmtLocal = (sqlite) => new Date(`${sqlite.replace(' ', 'T')}Z`).toLocaleString('sv-SE', { timeZone: SITE.timeZone }).slice(0, 16);
const CSV_FIELDS = [
  ['id', 'ID'], ['created_at', `Data (${SITE.timeZone})`], ['status', 'Status'], ['name', 'Nome'], ['phone', 'Telefone'], ['email', 'E-mail'],
  ['town', 'Cidade/ZIP'], ['service', 'Serviço'], ['timeframe', 'Prazo'], ['message', 'Mensagem'], ['source', 'Origem'],
  ['page_path', 'Página do envio'], ['landing_page', 'Página de entrada'], ['referrer', 'Veio de'],
  ['utm_source', 'utm_source'], ['utm_medium', 'utm_medium'], ['utm_campaign', 'utm_campaign'], ['utm_term', 'utm_term'], ['utm_content', 'utm_content'],
  ['gclid', 'gclid'], ['fbclid', 'fbclid'], ['form', 'Formulário'],
];

const csvCell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // no formulas in Excel
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function leadsCsv(rows) {
  const lines = [CSV_FIELDS.map(([, label]) => csvCell(label)).join(',')];
  for (const r of rows) {
    lines.push(CSV_FIELDS.map(([k]) => csvCell(k === 'status' ? STATUS[r.status] : k === 'source' ? SOURCES[r.source] : k === 'created_at' ? fmtLocal(r.created_at) : r[k])).join(','));
  }
  return `﻿${lines.join('\r\n')}\r\n`;
}
