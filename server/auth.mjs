// Senhas, sessões, tokens de convite/redefinição, CSRF e limite de tentativas de login.
import crypto from 'node:crypto';
import { db } from './db.mjs';

const SESSION_COOKIE = 'site_sid';
const SESSION_DAYS = 14;
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

/* ---------- Senhas ---------- */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const [alg, N, r, p, salt, hash] = String(stored).split('$');
  if (alg !== 'scrypt') return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(salt, 'base64'), expected.length, { N: +N, r: +r, p: +p });
  return crypto.timingSafeEqual(actual, expected);
}

// Hash fixo para comparar quando o e-mail não existe, e o tempo de resposta não denunciar quais contas existem.
const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString('hex'));
export const verifyDummy = (password) => verifyPassword(password, DUMMY_HASH);

export function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < 10) return 'A senha precisa ter pelo menos 10 caracteres.';
  if (password.length > 200) return 'A senha pode ter no máximo 200 caracteres.';
  return null;
}

/* ---------- Tokens aleatórios (guardamos só o hash) ---------- */
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('base64url');

/* ---------- Sessões ---------- */
export function createSession(res, member, req) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  db.prepare('INSERT INTO sessions (token_hash, member_id, csrf, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)')
    .run(sha256(token), member.id, randomToken(), expires.toISOString(), req.ip, String(req.get('user-agent') || '').slice(0, 300));
  db.prepare("UPDATE members SET last_login_at = datetime('now') WHERE id = ?").run(member.id);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/', expires,
    secure: process.env.NODE_ENV === 'production' || req.secure,
  });
}

export function destroySession(req, res) {
  const token = req.cookies[SESSION_COOKIE];
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

export const destroyOtherSessions = (memberId, keepReq) => {
  const keep = keepReq ? sha256(keepReq.cookies[SESSION_COOKIE] || '') : '';
  db.prepare('DELETE FROM sessions WHERE member_id = ? AND token_hash != ?').run(memberId, keep);
};

/* Carrega req.member e req.csrf a partir do cookie. */
export function loadSession(req, _res, next) {
  req.member = null;
  const token = req.cookies[SESSION_COOKIE];
  if (token) {
    const row = db.prepare(`SELECT s.csrf, s.expires_at, m.id, m.name, m.email, m.active, m.avatar, m.role
      FROM sessions s JOIN members m ON m.id = s.member_id WHERE s.token_hash = ?`).get(sha256(token));
    if (row && row.active && new Date(row.expires_at) > new Date()) {
      req.member = { id: row.id, name: row.name, email: row.email, avatar: row.avatar, role: row.role };
      req.csrf = row.csrf;
    }
  }
  next();
}

export function requireMember(req, res, next) {
  if (req.member) return next();
  const back = req.method === 'GET' ? `?voltar=${encodeURIComponent(req.originalUrl)}` : '';
  res.redirect(`/admin/entrar${back}`);
}

/* Roles: admin (everything) and editor (content, blog and leads; no users, integrations or AI tokens of others). */
export const ROLES = { admin: 'Administrador', editor: 'Editor' };
export const isAdmin = (m) => m?.role === 'admin';
export function requireAdmin(req, res, next) {
  if (isAdmin(req.member)) return next();
  res.status(403).send('Apenas administradores podem acessar esta área. Peça acesso a um administrador do painel.');
}

const PUBLIC_POSTS = /^\/(entrar|esqueci|convite\/[^/]+|redefinir\/[^/]+)$/;
const originHost = (o) => { try { return new URL(o).host; } catch { return null; } };

/* CSRF: token por sessão no campo _csrf + conferência de Origin. Vale para todo POST do painel. */
export function checkCsrf(req, res, next) {
  if (req.method !== 'POST') return next();
  const origin = req.get('origin');
  if (origin && originHost(origin) !== req.get('host')) return res.status(403).send('Origem não permitida.');
  // Telas públicas (entrar, esqueci, convite, redefinir) não têm token de sessão; nelas vale só a conferência de origem.
  if (req.member && !PUBLIC_POSTS.test(req.path)) {
    const sent = String(req.body?._csrf || '');
    if (sent.length !== req.csrf.length || !crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(req.csrf))) {
      return res.status(403).send('Sessão expirada. Volte, recarregue a página e tente de novo.');
    }
  }
  next();
}

/* ---------- Convites e redefinição de senha ---------- */
export function createToken(kind, { email, memberId = null, createdBy = null, hours, role = 'editor' }) {
  const token = randomToken();
  db.prepare('DELETE FROM tokens WHERE kind = ? AND email = ?').run(kind, email);
  db.prepare('INSERT INTO tokens (token_hash, kind, email, role, member_id, created_by, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(sha256(token), kind, email, ROLES[role] ? role : 'editor', memberId, createdBy, new Date(Date.now() + hours * 36e5).toISOString());
  return token;
}

export function findToken(kind, token) {
  const row = db.prepare('SELECT * FROM tokens WHERE token_hash = ? AND kind = ?').get(sha256(String(token)), kind);
  return row && new Date(row.expires_at) > new Date() ? row : null;
}

export const consumeToken = (token) => db.prepare('DELETE FROM tokens WHERE token_hash = ?').run(sha256(String(token)));

/* ---------- Limite de tentativas de login (memória) ---------- */
const attempts = new Map();
const WINDOW = 15 * 60e3;
const MAX = 8;

export function loginBlocked(...keys) {
  const now = Date.now();
  return keys.some((k) => {
    const a = attempts.get(k);
    return a && now - a.first < WINDOW && a.count >= MAX;
  });
}

export function loginFailed(...keys) {
  const now = Date.now();
  for (const k of keys) {
    const a = attempts.get(k);
    if (!a || now - a.first >= WINDOW) attempts.set(k, { first: now, count: 1 });
    else a.count++;
  }
}

export const loginSucceeded = (...keys) => keys.forEach((k) => attempts.delete(k));

setInterval(() => {
  const now = Date.now();
  for (const [k, a] of attempts) if (now - a.first >= WINDOW) attempts.delete(k);
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(new Date().toISOString());
  db.prepare("DELETE FROM tokens WHERE expires_at < ?").run(new Date().toISOString());
}, 30 * 60e3).unref();
