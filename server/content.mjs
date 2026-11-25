// Site content stored in the database: pages (fixed structure), services, service areas, FAQ, reviews and business data.
// Shared by the panel (server/admin.mjs) and the MCP (server/mcp.mjs). Every write goes through the validators below.
import { db, getSetting, setSetting } from './db.mjs';
import { PAGES, SERVICE_SCHEMA, AREA_SCHEMA, ICONS } from '../src/content/schema.mjs';
import { defaultsFor, readSeed } from '../src/content/defaults.mjs';
import { DEFAULT_BUSINESS, RESERVED_SLUGS } from '../src/site.config.mjs';
import { slugify } from '../src/lib.mjs';
import { imageExists } from './images.mjs';

const str = (v, max) => String(v ?? '').replace(/\r\n/g, '\n').trim().slice(0, max);
const MAX = { text: 300, textarea: 4000, markdown: 60000, image: 80, select: 40, service: 80, area: 80 };

/* ---------- Generic field validation (pages, services and areas share it) ---------- */
const allFields = (sections) => sections.flatMap((s) => s.fields);

/* Lists arrive from the panel as flat names (points.0.text, points.0._order, points.0._remove) or as arrays (MCP/JSON). */
function readList(field, input) {
  if (Array.isArray(input[field.name])) return input[field.name];
  const rows = {};
  const prefix = `${field.name}.`;
  for (const [k, v] of Object.entries(input)) {
    if (!k.startsWith(prefix)) continue;
    const [i, sub] = k.slice(prefix.length).split('.');
    (rows[i] ??= {})[sub] = v;
  }
  return Object.entries(rows)
    .filter(([, r]) => !r._remove)
    .map(([i, r]) => ({ r, order: Number.isFinite(+r._order) && r._order !== '' ? +r._order : +i }))
    .sort((a, b) => a.order - b.order)
    .map(({ r }) => r);
}

function checkValue(f, raw, errors, key, label) {
  if (f.type === 'checkbox') return raw === true || raw === 'on' || raw === '1' || raw === 1 ? '1' : '';
  const v = str(raw, f.max || MAX[f.type] || 300);
  if (!v) return '';
  if (f.type === 'image' && !imageExists(v)) errors[key] = `${label}: imagem "${v}" não existe na biblioteca.`;
  if (f.type === 'select' && !f.options.includes(v)) errors[key] = `${label}: opção inválida.`;
  if (f.type === 'service' && !db.prepare('SELECT 1 FROM services WHERE slug = ?').get(v)) errors[key] = `${label}: serviço "${v}" não existe.`;
  if (f.type === 'area' && !db.prepare('SELECT 1 FROM areas WHERE slug = ?').get(v)) errors[key] = `${label}: cidade "${v}" não existe.`;
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)) errors[key] = `${label}: caracteres inválidos.`;
  return v;
}

/* Returns { data, errors }. `base` keeps fields the input does not mention (partial edits from the MCP). */
export function validateFields(sections, input, base = {}) {
  const data = {};
  const errors = {};
  for (const f of allFields(sections)) {
    const present = f.type === 'list'
      ? Array.isArray(input[f.name]) || Object.keys(input).some((k) => k.startsWith(`${f.name}.`))
      : input[f.name] !== undefined;
    if (!present) { data[f.name] = structuredClone(base[f.name] ?? (f.type === 'list' ? [] : '')); }
    else if (f.type === 'list') {
      const rows = readList(f, input).slice(0, f.max || 40);
      data[f.name] = rows.map((r, i) => Object.fromEntries(f.fields.map((sf) => [sf.name, checkValue(sf, r?.[sf.name], errors, `${f.name}.${i}.${sf.name}`, `${f.label}, item ${i + 1}, ${sf.label}`)])))
        .filter((r) => Object.values(r).some(Boolean));
    } else data[f.name] = checkValue(f, input[f.name], errors, f.name, f.label);
    if (f.required && (f.type === 'list' ? !data[f.name].length : !data[f.name])) errors[f.name] ??= `Preencha: ${f.label}.`;
  }
  return { data, errors };
}

/* ---------- Pages ---------- */
export const PAGE_KEYS = Object.keys(PAGES);

export function getPage(key) {
  if (!PAGES[key]) return null;
  const row = db.prepare('SELECT data FROM pages WHERE key = ?').get(key);
  return { ...defaultsFor(key), ...(row ? JSON.parse(row.data) : {}) };
}

export const pageMeta = (key) => db.prepare('SELECT updated_at, updated_via FROM pages WHERE key = ?').get(key);

export function validatePage(key, input, { partial = false } = {}) {
  return validateFields(PAGES[key].sections, input, partial ? getPage(key) : {});
}

export function savePage(key, data, member, via = 'painel') {
  const before = getPage(key);
  db.prepare(`INSERT INTO pages (key, data, updated_by, updated_via) VALUES (?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = datetime('now'), updated_by = excluded.updated_by, updated_via = excluded.updated_via`)
    .run(key, JSON.stringify(data), member?.id ?? null, via);
  return Object.keys(data).filter((k) => JSON.stringify(data[k]) !== JSON.stringify(before[k]));
}

export const resetPage = (key) => db.prepare('DELETE FROM pages WHERE key = ?').run(key);

/* ---------- Services and areas (same engine, fixed page template) ---------- */
function collection(table, schema, base) {
  const parse = (r) => r && { ...r, data: JSON.parse(r.data), active: Boolean(r.active) };
  const c = {
    table, schema, base,
    list: ({ activeOnly = false } = {}) => db.prepare(`SELECT * FROM ${table} ${activeOnly ? 'WHERE active = 1' : ''} ORDER BY position, id`).all().map(parse),
    get: (idOrSlug) => parse(typeof idOrSlug === 'number' || /^\d+$/.test(String(idOrSlug))
      ? db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(Number(idOrSlug))
      : db.prepare(`SELECT * FROM ${table} WHERE slug = ?`).get(String(idOrSlug))),
    path: (slug) => `${base}${slug}/`,

    /* Validates slug + data. Returns { slug, data, errors }. */
    validate(input, { id = null, partial = false } = {}) {
      const current = id ? c.get(id) : null;
      const { data, errors } = validateFields(schema, input, partial && current ? current.data : {});
      const nameField = table === 'services' ? 'name' : 'label';
      let slug = slugify(str(input.slug, 80) || current?.slug || data[nameField] || '');
      if (!slug) errors.slug = 'Informe o endereço da página.';
      else if (RESERVED_SLUGS.includes(slug)) errors.slug = `O endereço "${slug}" é reservado pelo site. Escolha outro.`;
      else if (db.prepare(`SELECT 1 FROM ${table} WHERE slug = ? AND id IS NOT ?`).get(slug, id)) errors.slug = 'Já existe uma página com esse endereço.';
      return { slug, data, errors };
    },

    save({ id = null, slug, data, member, via = 'painel' }) {
      const current = id ? c.get(id) : null;
      db.exec('BEGIN');
      try {
        if (current) {
          if (current.slug !== slug) {
            db.prepare('INSERT OR REPLACE INTO path_redirects (old_path, new_path) VALUES (?, ?)').run(c.path(current.slug), c.path(slug));
            db.prepare('UPDATE path_redirects SET new_path = ? WHERE new_path = ?').run(c.path(slug), c.path(current.slug));
            if (table === 'services') {
              db.prepare('UPDATE posts SET service = ? WHERE service = ?').run(slug, current.slug);
              db.prepare("UPDATE faqs SET topic = ? WHERE topic = ?").run(`service:${slug}`, `service:${current.slug}`);
              for (const a of areas.list()) {
                const svc = a.data.services.map((s) => (s.service === current.slug ? { ...s, service: slug } : s));
                db.prepare('UPDATE areas SET data = ? WHERE id = ?').run(JSON.stringify({ ...a.data, services: svc }), a.id);
              }
            } else {
              db.prepare("UPDATE faqs SET topic = ? WHERE topic = ?").run(`area:${slug}`, `area:${current.slug}`);
              db.prepare('UPDATE reviews SET area = ? WHERE area = ?').run(slug, current.slug);
              for (const a of areas.list()) {
                const nb = a.data.nearby.map((n) => (n.area === current.slug ? { area: slug } : n));
                db.prepare('UPDATE areas SET data = ? WHERE id = ?').run(JSON.stringify({ ...a.data, nearby: nb }), a.id);
              }
            }
          }
          db.prepare('DELETE FROM path_redirects WHERE old_path = ?').run(c.path(slug));
          db.prepare(`UPDATE ${table} SET slug = ?, data = ?, updated_at = datetime('now'), updated_by = ?, updated_via = ? WHERE id = ?`)
            .run(slug, JSON.stringify(data), member?.id ?? null, via, id);
        } else {
          const pos = db.prepare(`SELECT COALESCE(MAX(position), 0) + 1 p FROM ${table}`).get().p;
          id = Number(db.prepare(`INSERT INTO ${table} (slug, data, position, updated_by, updated_via) VALUES (?, ?, ?, ?, ?)`)
            .run(slug, JSON.stringify(data), pos, member?.id ?? null, via).lastInsertRowid);
          db.prepare('DELETE FROM path_redirects WHERE old_path = ?').run(c.path(slug));
        }
        db.exec('COMMIT');
      } catch (err) { db.exec('ROLLBACK'); throw err; }
      return id;
    },

    setActive: (id, active) => db.prepare(`UPDATE ${table} SET active = ?, updated_at = datetime('now') WHERE id = ?`).run(active ? 1 : 0, id),
    move: (id, dir) => moveRow(table, id, dir),
    setOrder: (ids) => setOrder(table, ids),

    remove(id) {
      const row = c.get(id);
      if (!row) return null;
      db.exec('BEGIN');
      try {
        db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(row.id);
        if (table === 'services') {
          db.prepare("DELETE FROM faqs WHERE topic = ?").run(`service:${row.slug}`);
          db.prepare("UPDATE posts SET service = '' WHERE service = ?").run(row.slug);
          db.prepare('INSERT OR REPLACE INTO path_redirects (old_path, new_path) VALUES (?, ?)').run(c.path(row.slug), '/services/');
        } else {
          db.prepare("DELETE FROM faqs WHERE topic = ?").run(`area:${row.slug}`);
          db.prepare("UPDATE reviews SET area = '' WHERE area = ?").run(row.slug);
          db.prepare('INSERT OR REPLACE INTO path_redirects (old_path, new_path) VALUES (?, ?)').run(c.path(row.slug), '/service-areas/');
        }
        db.exec('COMMIT');
      } catch (err) { db.exec('ROLLBACK'); throw err; }
      return row;
    },
  };
  return c;
}

function moveRow(table, id, dir, scope = '', scopeArgs = []) {
  const rows = db.prepare(`SELECT id FROM ${table} ${scope} ORDER BY position, id`).all(...scopeArgs).map((r) => r.id);
  const i = rows.indexOf(Number(id));
  const j = dir === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return false;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  rows.forEach((rid, pos) => db.prepare(`UPDATE ${table} SET position = ? WHERE id = ?`).run(pos + 1, rid));
  return true;
}

function setOrder(table, ids) {
  ids.forEach((rid, pos) => db.prepare(`UPDATE ${table} SET position = ? WHERE id = ?`).run(pos + 1, Number(rid)));
}

export const services = collection('services', SERVICE_SCHEMA, '/');
export const areas = collection('areas', AREA_SCHEMA, '/service-areas/');

/* Old URL (renamed or removed service/area) -> new URL. */
export const pathRedirect = (p) => db.prepare('SELECT new_path FROM path_redirects WHERE old_path = ?').get(p)?.new_path;

/* ---------- FAQ ---------- */
export function faqTopics() {
  return [
    { key: 'general', label: 'Geral (página FAQ)' },
    { key: 'financing', label: 'Financiamento' },
    ...services.list().map((s) => ({ key: `service:${s.slug}`, label: `Serviço: ${s.data.short || s.data.name}` })),
    ...areas.list().map((a) => ({ key: `area:${a.slug}`, label: `Cidade: ${a.data.label}` })),
  ];
}

export const listFaqs = ({ topic = '', activeOnly = false, home = false } = {}) => {
  const where = [];
  const args = [];
  if (topic) { where.push('topic = ?'); args.push(topic); }
  if (activeOnly) where.push('active = 1');
  if (home) where.push('home = 1');
  return db.prepare(`SELECT * FROM faqs ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY topic, position, id`).all(...args);
};
export const getFaq = (id) => db.prepare('SELECT * FROM faqs WHERE id = ?').get(Number(id));

export function validateFaq(input, current = {}) {
  const pick = (k) => (input[k] !== undefined ? input[k] : current[k]);
  const bool = (k) => { const v = pick(k); return v === true || v === 'on' || v === 1 || v === '1' ? 1 : 0; };
  const d = {
    topic: str(pick('topic'), 100) || 'general',
    question: str(pick('question'), 300),
    answer: str(pick('answer'), 3000),
    active: input.active === undefined && current.active !== undefined ? current.active : bool('active'),
    home: bool('home'),
  };
  const errors = {};
  if (!faqTopics().some((t) => t.key === d.topic)) errors.topic = 'Tema inválido.';
  if (!d.question) errors.question = 'Escreva a pergunta.';
  if (!d.answer) errors.answer = 'Escreva a resposta.';
  return { data: d, errors };
}

export function saveFaq(id, d) {
  if (id) {
    const cur = getFaq(id);
    if (cur.topic !== d.topic) d.position = db.prepare('SELECT COALESCE(MAX(position), 0) + 1 p FROM faqs WHERE topic = ?').get(d.topic).p;
    db.prepare(`UPDATE faqs SET topic = ?, question = ?, answer = ?, active = ?, home = ?, position = COALESCE(?, position), updated_at = datetime('now') WHERE id = ?`)
      .run(d.topic, d.question, d.answer, d.active, d.home, d.position ?? null, id);
    return Number(id);
  }
  const pos = db.prepare('SELECT COALESCE(MAX(position), 0) + 1 p FROM faqs WHERE topic = ?').get(d.topic).p;
  return Number(db.prepare('INSERT INTO faqs (topic, question, answer, active, home, position) VALUES (?, ?, ?, ?, ?, ?)').run(d.topic, d.question, d.answer, d.active, d.home, pos).lastInsertRowid);
}
export const deleteFaq = (id) => db.prepare('DELETE FROM faqs WHERE id = ?').run(Number(id));
export const moveFaq = (id, dir) => { const f = getFaq(id); return f ? moveRow('faqs', id, dir, 'WHERE topic = ?', [f.topic]) : false; };

/* ---------- Reviews ---------- */
export const listReviews = ({ activeOnly = false } = {}) => db.prepare(`SELECT * FROM reviews ${activeOnly ? 'WHERE active = 1' : ''} ORDER BY position, id`).all();
export const getReview = (id) => db.prepare('SELECT * FROM reviews WHERE id = ?').get(Number(id));

export function validateReview(input, current = {}) {
  const pick = (k) => (input[k] !== undefined ? input[k] : current[k]);
  const bool = (k, dflt) => { const v = input[k] !== undefined ? input[k] : dflt; return v === true || v === 'on' || v === 1 || v === '1' ? 1 : 0; };
  const d = {
    name: str(pick('name'), 80),
    project: str(pick('project'), 120),
    text: str(pick('text'), 1500),
    rating: Math.min(5, Math.max(1, parseInt(pick('rating'), 10) || 5)),
    area: str(pick('area'), 80),
    home: bool('home', input.name !== undefined && input.home === undefined ? 0 : current.home),
    active: bool('active', current.active ?? 1),
  };
  const errors = {};
  if (!d.name) errors.name = 'Informe o nome de quem avaliou.';
  if (!d.text) errors.text = 'Escreva o texto da avaliação.';
  if (d.area && !areas.get(d.area)) errors.area = 'Cidade inválida.';
  return { data: d, errors };
}

export function saveReview(id, d) {
  if (id) {
    db.prepare(`UPDATE reviews SET name = ?, project = ?, text = ?, rating = ?, area = ?, home = ?, active = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(d.name, d.project, d.text, d.rating, d.area, d.home, d.active, id);
    return Number(id);
  }
  const pos = db.prepare('SELECT COALESCE(MAX(position), 0) + 1 p FROM reviews').get().p;
  return Number(db.prepare('INSERT INTO reviews (name, project, text, rating, area, home, active, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(d.name, d.project, d.text, d.rating, d.area, d.home, d.active, pos).lastInsertRowid);
}
export const deleteReview = (id) => db.prepare('DELETE FROM reviews WHERE id = ?').run(Number(id));
export const moveReview = (id, dir) => moveRow('reviews', id, dir);

/* ---------- Business data (contacts, address, Google rating) ---------- */
export const getBusiness = () => ({ ...DEFAULT_BUSINESS, ...getSetting('business', {}) });
const digits = (s) => String(s || '').replace(/\D/g, '');

export function validateBusiness(input, current = getBusiness()) {
  const v = Object.fromEntries(Object.keys(DEFAULT_BUSINESS).map((k) => [k, str(input[k] ?? current[k], 500)]));
  const errors = {};
  v.instagram = v.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/.*$/, '');
  v.state = v.state.toUpperCase();
  for (const [k, val] of Object.entries(v)) if (/[<>"`{}\\]|[\u0000-\u001f]/.test(val)) errors[k] = 'Use só letras, números e pontuação comum.';
  const d = digits(v.phone).replace(/^1(?=\d{10}$)/, '');
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(d)) errors.phone ??= 'Informe um telefone americano com 10 dígitos.';
  else v.phone = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v.email)) errors.email ??= 'E-mail inválido.';
  if (v.instagram && !/^[A-Za-z0-9._]{1,30}$/.test(v.instagram)) errors.instagram = 'Informe o usuário do Instagram, sem espaços.';
  if (!v.street) errors.street = 'Informe o endereço.';
  if (!v.city) errors.city = 'Informe a cidade.';
  if (!/^[A-Z]{2}$/.test(v.state)) errors.state = 'Use a sigla do estado, por exemplo MA.';
  if (!/^\d{5}$/.test(v.zip)) errors.zip = 'O ZIP tem 5 números.';
  for (const k of ['mapsUrl', 'googleReviewsUrl', 'googleWriteReviewUrl']) if (v[k] && !/^https:\/\/\S+$/.test(v[k])) errors[k] = 'O link precisa começar com https://.';
  if (!/^\d{1,5}$/.test(v.reviewCount)) errors.reviewCount = 'Só números.';
  if (!/^[1-5](\.\d)?$/.test(v.rating)) errors.rating = 'Use uma nota entre 1 e 5, por exemplo 5.0.';
  for (const k of ['lat', 'lng']) if (v[k] && !/^-?\d{1,3}\.\d{3,10}$/.test(v[k])) errors[k] = 'Coordenada inválida, por exemplo 41.7187514.';
  if (v.enhancifyPage && !/^\d{3,12}$/.test(v.enhancifyPage)) errors.enhancifyPage = 'O ID do Enhancify tem só números.';
  return Object.keys(errors).length ? { errors, data: v } : { data: v };
}

export function saveBusiness(data, memberId) {
  const before = getBusiness();
  setSetting('business', data, memberId);
  return Object.keys(data).filter((k) => data[k] !== before[k]);
}

/* ---------- First run: import the current site content ---------- */
export function seedContent() {
  if (getSetting('contentSeeded')) return false;
  db.exec('BEGIN');
  try {
    for (const s of readSeed('services.json')) db.prepare('INSERT OR IGNORE INTO services (slug, active, position, data, updated_via) VALUES (?, ?, ?, ?, ?)').run(s.slug, s.active, s.position, JSON.stringify(s.data), 'importação');
    for (const a of readSeed('areas.json')) db.prepare('INSERT OR IGNORE INTO areas (slug, active, position, data, updated_via) VALUES (?, ?, ?, ?, ?)').run(a.slug, a.active, a.position, JSON.stringify(a.data), 'importação');
    for (const f of readSeed('faqs.json')) db.prepare('INSERT INTO faqs (topic, question, answer, position, home) VALUES (?, ?, ?, ?, ?)').run(f.topic, f.question, f.answer, f.position, f.home || 0);
    for (const r of readSeed('reviews.json')) db.prepare('INSERT INTO reviews (name, project, text, rating, area, home, position) VALUES (?, ?, ?, ?, ?, ?, ?)').run(r.name, r.project, r.text, r.rating, r.area, r.home, r.position);
    db.exec('COMMIT');
  } catch (err) { db.exec('ROLLBACK'); throw err; }
  setSetting('contentSeeded', true);
  return true;
}

export { PAGES, SERVICE_SCHEMA, AREA_SCHEMA, ICONS };
