// Integrations: site tags (Meta Pixel, GA4, Google Ads, Tag Manager) with configurable events, Meta Conversions API,
// webhooks, new-lead e-mail and the Instagram feed. Secrets (CAPI token, webhook secret, Instagram token) never reach the browser.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import { db, getSetting, setSetting, DATA_DIR } from './db.mjs';
import { mailEnabled, sendMail } from './mail.mjs';
import { SITE } from '../src/site.config.mjs';
import { PUBLIC_URL } from './env.mjs';

const GRAPH_VERSION = 'v23.0';
const GRAPH_BASE = process.env.META_GRAPH_BASE || 'https://graph.facebook.com'; // replaced only in tests
const IG_BASE = process.env.INSTAGRAM_GRAPH_BASE || 'https://graph.instagram.com';
const TIMEOUT_MS = 8000;
const SOURCES_LABEL = { meta_ads: 'Meta Ads', google_ads: 'Google Ads', outros_anuncios: 'Outros anúncios', redes_sociais: 'Redes sociais', busca_organica: 'Busca orgânica', campanha: 'Campanha (UTM)', outros_sites: 'Outros sites', direto: 'Direto' };

/* Site actions that can fire tracking events, and the standard Meta events available for each. */
export const ACTIONS = {
  lead: { label: 'Envio do formulário de orçamento', meta: 'Lead', ga4: 'generate_lead' },
  phone: { label: 'Clique no telefone', meta: 'Contact', ga4: 'phone_click' },
  email: { label: 'Clique no e-mail', meta: 'Contact', ga4: 'email_click' },
  financing: { label: 'Clique em "Check your options" (financiamento)', meta: '', ga4: 'financing_click' },
};
export const META_EVENTS = ['', 'Lead', 'Contact', 'Schedule', 'SubmitApplication', 'CompleteRegistration', 'FindLocation', 'CustomizeProduct'];

const defaultEvents = () => Object.fromEntries(Object.entries(ACTIONS).map(([k, a]) => [k, { meta: a.meta, ga4: a.ga4, adsLabel: '' }]));

export const DEFAULT_INTEGRATIONS = Object.freeze({
  cookieBanner: false, // US site: no consent banner by default (turn on if needed)
  onlyProdHosts: true,
  metaPixelId: '',
  metaCapiToken: '',
  metaTestEventCode: '',
  ga4Id: '',
  gtmId: '',
  googleAdsId: '',
  events: defaultEvents(),
  webhookUrls: '',
  webhookSecret: '',
  notifyEmails: '',
  headScripts: '',
  bodyScripts: '',
  instagramToken: '',
  instagramRefreshedAt: 0,
});

export const getIntegrations = () => {
  const c = { ...DEFAULT_INTEGRATIONS, ...getSetting('integrations', {}) };
  c.events = { ...defaultEvents(), ...c.events };
  return c;
};
export const webhookList = (c = getIntegrations()) => c.webhookUrls.split(/\s+/).filter(Boolean);

/* Only what may go to the browser. */
export function publicTracking(c = getIntegrations()) {
  const any = c.metaPixelId || c.ga4Id || c.gtmId || c.googleAdsId || c.headScripts || c.bodyScripts;
  if (!any) return null;
  return {
    consent: c.cookieBanner,
    prodHosts: c.onlyProdHosts ? [...SITE.prodHosts, new URL(PUBLIC_URL).hostname].filter((v, i, a) => a.indexOf(v) === i) : [],
    metaPixelId: c.metaPixelId,
    ga4Id: c.ga4Id,
    gtmId: c.gtmId,
    googleAdsId: c.googleAdsId,
    events: c.events,
    headScripts: c.headScripts,
    bodyScripts: c.bodyScripts,
  };
}

const str = (v, max) => String(v ?? '').trim().slice(0, max);

/* Validates the form. Empty secret fields keep the current value (the panel never shows a secret). */
export function validateIntegrations(input, current = getIntegrations(), { allowSensitive = true } = {}) {
  const pick = (k, max) => (input[k] !== undefined ? str(input[k], max) : current[k]);
  const bool = (k) => (input[k] !== undefined ? input[k] === 'on' || input[k] === true : current[k]);
  const events = {};
  for (const k of Object.keys(ACTIONS)) {
    const cur = current.events[k] || {};
    const inp = input.events?.[k] || {};
    const flat = (f) => input[`ev_${k}_${f}`];
    const val = (f) => str(inp[f] ?? flat(f) ?? cur[f] ?? '', 80);
    events[k] = { meta: val('meta'), ga4: val('ga4'), adsLabel: val('adsLabel') };
  }
  const d = {
    cookieBanner: bool('cookieBanner'),
    onlyProdHosts: bool('onlyProdHosts'),
    metaPixelId: pick('metaPixelId', 30).replace(/\s/g, ''),
    metaCapiToken: input.removeCapiToken === 'on' ? '' : (allowSensitive && str(input.metaCapiToken, 500)) || current.metaCapiToken,
    metaTestEventCode: pick('metaTestEventCode', 40),
    ga4Id: pick('ga4Id', 30).toUpperCase(),
    gtmId: pick('gtmId', 30).toUpperCase(),
    googleAdsId: pick('googleAdsId', 30).toUpperCase(),
    events,
    webhookUrls: allowSensitive ? pick('webhookUrls', 2000).split(/\s+/).filter(Boolean).slice(0, 5).join('\n') : current.webhookUrls,
    webhookSecret: current.webhookSecret || crypto.randomBytes(24).toString('base64url'),
    notifyEmails: pick('notifyEmails', 500).split(/[\s,;]+/).filter(Boolean).join(', '),
    headScripts: allowSensitive ? (input.headScripts !== undefined ? String(input.headScripts).trim().slice(0, 20000) : current.headScripts) : current.headScripts,
    bodyScripts: allowSensitive ? (input.bodyScripts !== undefined ? String(input.bodyScripts).trim().slice(0, 20000) : current.bodyScripts) : current.bodyScripts,
    instagramToken: input.removeInstagramToken === 'on' ? '' : (allowSensitive && str(input.instagramToken, 600)) || current.instagramToken,
    instagramRefreshedAt: current.instagramRefreshedAt,
  };
  if (d.instagramToken !== current.instagramToken) d.instagramRefreshedAt = 0;
  const errors = {};
  if (d.metaPixelId && !/^\d{10,20}$/.test(d.metaPixelId)) errors.metaPixelId = 'O ID do Pixel tem só números (de 10 a 20 dígitos).';
  if (d.metaCapiToken && !d.metaPixelId) errors.metaCapiToken = 'Informe também o ID do Pixel.';
  if (d.ga4Id && !/^G-[A-Z0-9]{4,15}$/.test(d.ga4Id)) errors.ga4Id = 'O ID do GA4 começa com G-, por exemplo G-AB12CD34EF.';
  if (d.gtmId && !/^GTM-[A-Z0-9]{4,12}$/.test(d.gtmId)) errors.gtmId = 'O ID do Tag Manager começa com GTM-, por exemplo GTM-AB12CD3.';
  if (d.googleAdsId && !/^AW-\d{6,15}$/.test(d.googleAdsId)) errors.googleAdsId = 'O ID do Google Ads começa com AW-, por exemplo AW-123456789.';
  for (const [k, e] of Object.entries(events)) {
    if (e.meta && !/^[A-Za-z][A-Za-z0-9_]{1,39}$/.test(e.meta)) errors[`ev_${k}_meta`] = `${ACTIONS[k].label}: nome de evento do Meta inválido.`;
    if (e.ga4 && !/^[a-z][a-z0-9_]{1,39}$/.test(e.ga4)) errors[`ev_${k}_ga4`] = `${ACTIONS[k].label}: evento do GA4 em minúsculas, com _ (ex.: generate_lead).`;
    if (e.adsLabel && !/^[A-Za-z0-9_-]{4,60}$/.test(e.adsLabel)) errors[`ev_${k}_adsLabel`] = `${ACTIONS[k].label}: rótulo de conversão inválido.`;
    if (e.adsLabel && !d.googleAdsId) errors[`ev_${k}_adsLabel`] = 'Informe também o ID do Google Ads.';
  }
  const badHook = d.webhookUrls !== current.webhookUrls && webhookList(d).find((u) => !/^https:\/\/[^\s]+$/i.test(u));
  if (badHook) errors.webhookUrls = `Webhook inválido (precisa começar com https://): ${badHook}`;
  const bad = d.notifyEmails.split(', ').filter((e) => e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  if (bad.length) errors.notifyEmails = `E-mail inválido: ${bad.join(', ')}.`;
  return { data: d, errors };
}

export const saveIntegrations = (data, memberId) => setSetting('integrations', data, memberId);
export const regenerateWebhookSecret = (memberId) => saveIntegrations({ ...getIntegrations(), webhookSecret: crypto.randomBytes(24).toString('base64url') }, memberId);

/* ---------- Delivery log ---------- */
const log = (kind, leadId, ok, detail, test = false) => db.prepare('INSERT INTO integration_log (kind, lead_id, ok, detail, test) VALUES (?, ?, ?, ?, ?)')
  .run(kind, leadId ?? null, ok ? 1 : 0, String(detail || '').slice(0, 500), test ? 1 : 0);
export const recentLog = (limit = 30) => db.prepare('SELECT * FROM integration_log ORDER BY id DESC LIMIT ?').all(limit);

async function post(url, { headers = {}, body }) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body, redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
  const text = await res.text().catch(() => '');
  return { ok: res.ok, status: res.status, text: text.slice(0, 300) };
}

/* ---------- Meta Conversions API ---------- */
const sha = (v) => crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');
const ascii = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

export function capiPayload(lead, ctx, c) {
  const [first, ...rest] = String(lead.name).trim().split(/\s+/);
  const user = {
    em: [sha(lead.email)],
    ph: [sha(`1${String(lead.phone).replace(/\D/g, '').slice(-10)}`)],
    fn: [sha(ascii(first))],
    ct: lead.town && !/^\d+$/.test(lead.town) ? [sha(ascii(lead.town).replace(/[^a-z]/gi, ''))] : undefined,
    zp: /^\d{5}$/.test(lead.town || '') ? [sha(lead.town)] : undefined,
    st: [sha('ma')],
    country: [sha('us')],
    client_ip_address: ctx.ip || undefined,
    client_user_agent: lead.user_agent || undefined,
    fbp: lead.fbp || undefined,
    fbc: lead.fbc || undefined,
  };
  if (rest.length) user.ln = [sha(ascii(rest.at(-1)))];
  const body = {
    data: [{
      event_name: c.events.lead.meta || 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: lead.event_id || `lead-${lead.id}`,
      action_source: 'website',
      event_source_url: lead.page_url ? new URL(lead.page_url, SITE.url).href : `${SITE.url}/`,
      user_data: user,
      custom_data: { lead_source: lead.source, content_name: lead.service || lead.form || 'estimate' },
    }],
  };
  if (c.metaTestEventCode) body.test_event_code = c.metaTestEventCode;
  return body;
}

async function sendCapi(lead, ctx, c, test) {
  if (!c.metaPixelId || !c.metaCapiToken || !c.events.lead.meta) return;
  if (c.cookieBanner && ctx.consent !== 'granted' && !test) return log('meta_capi', lead.id, true, 'Não enviado: a pessoa não aceitou os cookies de medição.');
  try {
    const r = await post(`${GRAPH_BASE}/${GRAPH_VERSION}/${c.metaPixelId}/events?access_token=${encodeURIComponent(c.metaCapiToken)}`, { body: JSON.stringify(capiPayload(lead, ctx, c)) });
    log('meta_capi', lead.id, r.ok, r.ok ? `Evento ${c.events.lead.meta} recebido pelo Meta${c.metaTestEventCode ? ' (modo de teste)' : ''}.` : `Meta respondeu ${r.status}: ${r.text}`, test);
  } catch (err) {
    log('meta_capi', lead.id, false, `Falha de conexão com o Meta: ${err.message}`, test);
  }
}

/* ---------- Webhooks ---------- */
/* Blocks internal destinations (local network, loopback, cloud metadata): a webhook must not become a door into the server's network. */
function isPrivateIp(ip) {
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    const mapped = v.match(/^::ffff:(.+)$/);
    if (mapped) {
      if (net.isIPv4(mapped[1])) return isPrivateIp(mapped[1]);
      const [hi, lo] = mapped[1].split(':').map((h) => parseInt(h, 16));
      return isPrivateIp([hi >> 8, hi & 255, lo >> 8, lo & 255].join('.'));
    }
    return v === '::1' || v === '::' || /^f[cd]/.test(v) || /^fe[89ab]/.test(v);
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

export async function checkPublicUrl(url) {
  const u = new URL(url);
  if (process.env.WEBHOOK_ALLOW_PRIVATE === '1' && u.hostname === 'localhost') return; // tests only
  if (u.protocol !== 'https:') throw new Error('o endereço precisa usar https');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (addrs.some((a) => isPrivateIp(a.address))) throw new Error('o endereço aponta para uma rede interna');
}

/* Same keys as the old api/lead.php webhook, plus status links. */
export const webhookLeadData = (lead) => ({
  id: lead.id, received_at: lead.created_at, lead_type: lead.form || 'estimate', name: lead.name, phone: lead.phone, email: lead.email,
  town: lead.town, service: lead.service, timeframe: lead.timeframe, message: lead.message,
  source: lead.source, source_label: SOURCES_LABEL[lead.source] || lead.source, page_url: lead.page_url, landing_page: lead.landing_page, referrer: lead.referrer,
  utm_source: lead.utm_source, utm_medium: lead.utm_medium, utm_campaign: lead.utm_campaign, utm_term: lead.utm_term, utm_content: lead.utm_content,
  gclid: lead.gclid, fbclid: lead.fbclid, panel_url: `${PUBLIC_URL}/admin/leads/${lead.id}`,
});

async function sendWebhooks(lead, c, test) {
  const body = JSON.stringify({ event: test ? 'test' : 'lead.created', lead: webhookLeadData(lead) });
  const signature = crypto.createHmac('sha256', c.webhookSecret).update(body).digest('hex');
  for (const url of webhookList(c)) {
    const host = (() => { try { return new URL(url).host; } catch { return url; } })();
    try {
      await checkPublicUrl(url);
      const r = await post(url, { headers: { 'X-Painel-Assinatura': `sha256=${signature}`, 'X-Signature-256': `sha256=${signature}`, 'User-Agent': 'Castro-Site/1.0' }, body });
      // Only the HTTP status is logged: the destination's response body is never stored or shown.
      log('webhook', lead.id, r.ok, r.ok ? `${host}: entregue (HTTP ${r.status}).` : `${host}: respondeu HTTP ${r.status}.`, test);
    } catch (err) {
      log('webhook', lead.id, false, `${host}: não enviado (${err.message}).`, test);
    }
  }
}

/* ---------- New-lead e-mail ---------- */
async function sendNotify(lead, c, test) {
  if (!c.notifyEmails) return;
  if (!mailEnabled) return log('email', lead.id, false, 'O envio de e-mail (SMTP) não está configurado no servidor.', test);
  const opt = (label, v) => (v ? [`${label}: ${v}`] : []);
  const lines = [
    `${test ? '[TEST] ' : ''}New estimate request from ${SITE.name} website.`, '',
    `Name: ${lead.name}`, `Phone: ${lead.phone}`, `Email: ${lead.email}`, `Town/ZIP: ${lead.town}`, `Service: ${lead.service}`,
    ...opt('Timeframe', lead.timeframe), ...(lead.message ? ['', 'Message:', lead.message] : []), '',
    `Source: ${SOURCES_LABEL[lead.source] || lead.source}${lead.utm_campaign ? ` (campaign ${lead.utm_campaign})` : ''}`, ...opt('Page', lead.page_url), '',
    `Open in the panel: ${PUBLIC_URL}/admin/leads/${lead.id}`,
  ];
  try {
    await sendMail({ to: c.notifyEmails, subject: `${test ? '[Test] ' : ''}New estimate request: ${lead.name} (${lead.town})`, text: lines.join('\n'), replyTo: lead.email });
    log('email', lead.id, true, `Enviado para ${c.notifyEmails}.`, test);
  } catch (err) {
    log('email', lead.id, false, `Falha no envio: ${err.message}`, test);
  }
}

/* Called after a lead is saved. Never blocks the visitor's response. */
export function onLeadCreated(lead, ctx) {
  const c = getIntegrations();
  setImmediate(() => {
    Promise.allSettled([sendCapi(lead, ctx, c, false), sendWebhooks(lead, c, false), sendNotify(lead, c, false)])
      .catch((err) => console.error('Integrações:', err));
  });
}

const TEST_LEAD = {
  id: null, name: 'Test Lead', email: 'test@example.com', phone: '5085550100', town: 'Sandwich', service: 'Trim & finish carpentry', timeframe: 'Just planning',
  message: 'Test sent from the panel.', source: 'direto', form: 'test', page_url: '/contact-us/', event_id: '', fbp: '', fbc: '', user_agent: 'Castro-Site/1.0',
};

export async function runTest(kind) {
  const c = getIntegrations();
  const lead = { ...TEST_LEAD, created_at: new Date().toISOString(), event_id: `test-${Date.now()}` };
  if (kind === 'webhook') { if (!webhookList(c).length) return null; await sendWebhooks(lead, c, true); }
  else if (kind === 'email') await sendNotify(lead, c, true);
  else if (kind === 'meta_capi') {
    if (!c.metaTestEventCode) return { error: 'Para testar sem afetar as campanhas, preencha o código de evento de teste (Gerenciador de Eventos > Testar eventos).' };
    await sendCapi(lead, { ip: '', consent: 'granted' }, c, true);
  } else if (kind === 'instagram') {
    const r = await syncInstagram({ force: true });
    return { ok: r.ok, detail: r.detail };
  }
  return recentLog(1)[0];
}

/* ---------- Instagram feed (replaces the old PHP cron) ---------- */
export const INSTAGRAM_DIR = path.join(DATA_DIR, 'instagram');
fs.mkdirSync(INSTAGRAM_DIR, { recursive: true });
const FEED = path.join(INSTAGRAM_DIR, 'feed.json');
export const instagramReady = () => Boolean(getIntegrations().instagramToken) && fs.existsSync(FEED);

export async function syncInstagram({ force = false } = {}) {
  const c = getIntegrations();
  if (!c.instagramToken) return { ok: false, detail: 'Sem token do Instagram.' };
  const last = getSetting('instagramLastSync', 0);
  if (!force && Date.now() - last < 55 * 60e3) return { ok: true, detail: 'Atualizado recentemente.' };
  const getJson = async (url) => { const r = await fetch(url, { signal: AbortSignal.timeout(20000) }); return r.json().catch(() => ({})); };
  try {
    // The long-lived token expires after 60 days without a refresh: refresh weekly.
    if (Date.now() - (c.instagramRefreshedAt || 0) > 7 * 864e5) {
      const r = await getJson(`${IG_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(c.instagramToken)}`);
      if (r.access_token) saveIntegrations({ ...getIntegrations(), instagramToken: r.access_token, instagramRefreshedAt: Date.now() });
    }
    const token = getIntegrations().instagramToken;
    const r = await getJson(`${IG_BASE}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=8&access_token=${encodeURIComponent(token)}`);
    if (!Array.isArray(r.data) || !r.data.length) throw new Error(r.error?.message || 'nenhuma publicação retornada');
    const items = [];
    const keep = new Set(['feed.json']);
    for (const m of r.data) {
      const src = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url;
      if (!src || !/^https:\/\//.test(src) || !/^\d+$/.test(m.id)) continue;
      const file = `${m.id}.jpg`;
      keep.add(file);
      const dest = path.join(INSTAGRAM_DIR, file);
      if (!fs.existsSync(dest)) {
        const img = await fetch(src, { signal: AbortSignal.timeout(20000) });
        if (!img.ok) continue;
        fs.writeFileSync(dest, Buffer.from(await img.arrayBuffer()));
      }
      items.push({ image: `/instagram/${file}`, permalink: /^https:\/\/(www\.)?instagram\.com\//.test(m.permalink) ? m.permalink : '', caption: String(m.caption || '').slice(0, 140), at: m.timestamp });
    }
    for (const f of fs.readdirSync(INSTAGRAM_DIR)) if (!keep.has(f)) fs.rmSync(path.join(INSTAGRAM_DIR, f), { force: true });
    const had = fs.existsSync(FEED);
    fs.writeFileSync(FEED, JSON.stringify({ updated: new Date().toISOString(), items }));
    setSetting('instagramLastSync', Date.now());
    log('instagram', null, true, `${items.length} publicações sincronizadas.`);
    return { ok: true, detail: `${items.length} publicações sincronizadas.`, firstTime: !had };
  } catch (err) {
    log('instagram', null, false, `Falha ao sincronizar: ${err.message}`);
    return { ok: false, detail: `Falha ao sincronizar: ${err.message}` };
  }
}
