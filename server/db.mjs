// Banco SQLite do painel. Fica em DATA_DIR, fora da pasta do app, para sobreviver aos deploys.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const ROOT = path.resolve(import.meta.dirname, '..');
export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'site.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

/* Migrações em ordem. Nunca editar uma já publicada: acrescentar a próxima. */
const MIGRATIONS = [
  `CREATE TABLE members (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
    active INTEGER NOT NULL DEFAULT 1,
    avatar TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT
  );
  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    csrf TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT
  );
  CREATE TABLE tokens (
    token_hash TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('invite', 'reset')),
    email TEXT NOT NULL COLLATE NOCASE,
    role TEXT NOT NULL DEFAULT 'editor',
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_by INTEGER REFERENCES members(id) ON DELETE SET NULL
  );
  CREATE TABLE activity (
    id INTEGER PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    member_name TEXT,
    action TEXT NOT NULL,
    detail TEXT,
    via TEXT NOT NULL DEFAULT 'painel',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX activity_created ON activity(created_at);`,

  `CREATE TABLE leads (
    id INTEGER PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_contato', 'orcamento', 'cliente', 'descartado', 'suspeito')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    town TEXT,
    service TEXT,
    timeframe TEXT,
    message TEXT,
    form TEXT,
    page_url TEXT,
    page_path TEXT,
    source TEXT NOT NULL,
    landing_page TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    fbclid TEXT,
    gclid TEXT,
    fbp TEXT,
    fbc TEXT,
    event_id TEXT,
    user_agent TEXT,
    spam_reason TEXT
  );
  CREATE INDEX leads_created ON leads(created_at);
  CREATE INDEX leads_status ON leads(status);
  CREATE INDEX leads_source ON leads(source);
  CREATE INDEX leads_page ON leads(page_path);
  CREATE TABLE lead_notes (
    id INTEGER PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    member_name TEXT,
    text TEXT NOT NULL,
    via TEXT NOT NULL DEFAULT 'painel',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX lead_notes_lead ON lead_notes(lead_id);
  CREATE TABLE spam_guard (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );`,

  `CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado')),
    title TEXT NOT NULL,
    seo_title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    keyword TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    service TEXT NOT NULL DEFAULT '',
    cover TEXT NOT NULL DEFAULT '',
    cover_alt TEXT NOT NULL DEFAULT '',
    featured INTEGER NOT NULL DEFAULT 0,
    body TEXT NOT NULL DEFAULT '',
    published_date TEXT,
    updated_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
    updated_via TEXT NOT NULL DEFAULT 'painel'
  );
  CREATE TABLE post_redirects (
    old_slug TEXT PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE
  );
  CREATE TABLE images (
    id TEXT PRIMARY KEY,
    original_name TEXT,
    w INTEGER NOT NULL,
    h INTEGER NOT NULL,
    widths TEXT NOT NULL,
    alt TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by INTEGER REFERENCES members(id) ON DELETE SET NULL
  );`,

  `CREATE TABLE integration_log (
    id INTEGER PRIMARY KEY,
    kind TEXT NOT NULL,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    ok INTEGER NOT NULL,
    detail TEXT,
    test INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX integration_log_created ON integration_log(created_at);`,

  `CREATE TABLE oauth_clients (
    client_id TEXT PRIMARY KEY,
    info TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE oauth_pending (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
    params TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
  CREATE TABLE oauth_grants (
    id INTEGER PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_used_at TEXT
  );
  CREATE TABLE oauth_codes (
    code_hash TEXT PRIMARY KEY,
    grant_id INTEGER NOT NULL REFERENCES oauth_grants(id) ON DELETE CASCADE,
    code_challenge TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    resource TEXT,
    expires_at TEXT NOT NULL
  );
  CREATE TABLE oauth_tokens (
    token_hash TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('access', 'refresh')),
    grant_id INTEGER NOT NULL REFERENCES oauth_grants(id) ON DELETE CASCADE,
    resource TEXT,
    expires_at TEXT NOT NULL
  );
  CREATE TABLE api_tokens (
    id INTEGER PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    hint TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_used_at TEXT
  );`,

  /* Site content: fixed-structure pages, services, service areas, FAQ and reviews. */
  `CREATE TABLE pages (
    key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
    updated_via TEXT NOT NULL DEFAULT 'painel'
  );
  CREATE TABLE services (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    active INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
    updated_via TEXT NOT NULL DEFAULT 'painel'
  );
  CREATE TABLE areas (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    active INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
    updated_via TEXT NOT NULL DEFAULT 'painel'
  );
  CREATE TABLE path_redirects (
    old_path TEXT PRIMARY KEY,
    new_path TEXT NOT NULL
  );
  CREATE TABLE faqs (
    id INTEGER PRIMARY KEY,
    topic TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    home INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX faqs_topic ON faqs(topic, position);
  CREATE TABLE reviews (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    project TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 5,
    area TEXT NOT NULL DEFAULT '',
    home INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
];

const { user_version: version } = db.prepare('PRAGMA user_version').get();
for (let i = version; i < MIGRATIONS.length; i++) {
  db.exec('BEGIN');
  try {
    db.exec(MIGRATIONS[i]);
    db.exec(`PRAGMA user_version = ${i + 1}`);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export const getSetting = (key, fallback = null) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : fallback;
};

export const setSetting = (key, value, memberId = null) => {
  db.prepare(`INSERT INTO settings (key, value, updated_by) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now'), updated_by = excluded.updated_by`)
    .run(key, JSON.stringify(value), memberId);
};

export const logActivity = (member, action, detail = '', via = 'painel') => {
  db.prepare('INSERT INTO activity (member_id, member_name, action, detail, via) VALUES (?, ?, ?, ?, ?)')
    .run(member?.id ?? null, member?.name ?? null, action, detail, via);
};
