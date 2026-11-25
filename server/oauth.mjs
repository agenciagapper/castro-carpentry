// Autenticação do MCP: OAuth 2.1 (Claude, ChatGPT e outros conectores) e tokens pessoais (Claude Code, Cursor).
// O roteador do SDK cuida de registro de clientes, PKCE e respostas; aqui fica o armazenamento e o login dos membros.
import crypto from 'node:crypto';
import { InvalidTokenError, InvalidGrantError, InvalidRequestError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
import { db } from './db.mjs';
import { PUBLIC_URL } from './env.mjs';

export const publicUrl = () => PUBLIC_URL;
export const mcpResourceUrl = () => new URL(`${publicUrl()}/mcp`);

const ACCESS_TTL = 60 * 60; // 1 hora
const REFRESH_TTL = 60 * 24 * 3600; // 60 dias
const CODE_TTL = 10 * 60;
const PENDING_TTL = 15 * 60;
const PERSONAL_PREFIX = 'vpt_';

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const random = () => crypto.randomBytes(32).toString('base64url');
const inSeconds = (s) => new Date(Date.now() + s * 1000).toISOString();
const expired = (iso) => new Date(iso) <= new Date();

/* ---------- Clientes registrados (registro dinâmico) ---------- */
const clientsStore = {
  getClient(clientId) {
    const row = db.prepare('SELECT info FROM oauth_clients WHERE client_id = ?').get(String(clientId));
    return row ? JSON.parse(row.info) : undefined;
  },
  registerClient(client) {
    const full = { ...client, client_id: crypto.randomUUID(), client_id_issued_at: Math.floor(Date.now() / 1000) };
    db.prepare('INSERT INTO oauth_clients (client_id, info) VALUES (?, ?)').run(full.client_id, JSON.stringify(full));
    return full;
  },
};

export const clientName = (clientId) => clientsStore.getClient(clientId)?.client_name || 'Aplicativo sem nome';

/* ---------- Autorização: guarda o pedido e manda o membro para a tela de consentimento do painel ---------- */
function issueTokens(grantId, resource) {
  const access = random();
  const refresh = random();
  const insert = db.prepare('INSERT INTO oauth_tokens (token_hash, kind, grant_id, resource, expires_at) VALUES (?, ?, ?, ?, ?)');
  insert.run(sha256(access), 'access', grantId, resource || null, inSeconds(ACCESS_TTL));
  insert.run(sha256(refresh), 'refresh', grantId, resource || null, inSeconds(REFRESH_TTL));
  return { access_token: access, token_type: 'bearer', expires_in: ACCESS_TTL, refresh_token: refresh };
}

const checkResource = (resource) => {
  if (resource && resource.href.replace(/\/$/, '') !== mcpResourceUrl().href.replace(/\/$/, '')) {
    throw new InvalidRequestError('Recurso desconhecido.');
  }
};

export const provider = {
  get clientsStore() { return clientsStore; },

  async authorize(client, params, res) {
    checkResource(params.resource);
    const id = random();
    db.prepare('INSERT INTO oauth_pending (id, client_id, params, expires_at) VALUES (?, ?, ?, ?)').run(id, client.client_id, JSON.stringify({
      state: params.state, codeChallenge: params.codeChallenge, redirectUri: params.redirectUri, resource: params.resource?.href || null,
    }), inSeconds(PENDING_TTL));
    res.redirect(`/admin/conectar/${id}`);
  },

  async challengeForAuthorizationCode(client, code) {
    const row = db.prepare('SELECT c.*, g.client_id FROM oauth_codes c JOIN oauth_grants g ON g.id = c.grant_id WHERE c.code_hash = ?').get(sha256(code));
    if (!row || row.client_id !== client.client_id || expired(row.expires_at)) throw new InvalidGrantError('Código de autorização inválido ou expirado.');
    return row.code_challenge;
  },

  async exchangeAuthorizationCode(client, code, _verifier, redirectUri, resource) {
    const row = db.prepare('SELECT c.*, g.client_id FROM oauth_codes c JOIN oauth_grants g ON g.id = c.grant_id WHERE c.code_hash = ?').get(sha256(code));
    db.prepare('DELETE FROM oauth_codes WHERE code_hash = ?').run(sha256(code));
    if (!row || row.client_id !== client.client_id || expired(row.expires_at)) throw new InvalidGrantError('Código de autorização inválido ou expirado.');
    if (redirectUri && redirectUri !== row.redirect_uri) throw new InvalidGrantError('redirect_uri diferente do usado na autorização.');
    checkResource(resource);
    return issueTokens(row.grant_id, row.resource);
  },

  async exchangeRefreshToken(client, refreshToken) {
    const row = db.prepare(`SELECT t.*, g.client_id FROM oauth_tokens t JOIN oauth_grants g ON g.id = t.grant_id
      WHERE t.token_hash = ? AND t.kind = 'refresh'`).get(sha256(refreshToken));
    if (!row || row.client_id !== client.client_id || expired(row.expires_at)) throw new InvalidGrantError('Token de atualização inválido ou expirado.');
    db.prepare('DELETE FROM oauth_tokens WHERE token_hash = ?').run(row.token_hash); // rotação: cada refresh vale uma vez
    return issueTokens(row.grant_id, row.resource);
  },

  async verifyAccessToken(token) {
    const auth = verifyToken(token);
    if (!auth) throw new InvalidTokenError('Token inválido ou expirado.');
    return auth;
  },

  async revokeToken(client, { token }) {
    const row = db.prepare('SELECT t.token_hash, g.client_id FROM oauth_tokens t JOIN oauth_grants g ON g.id = t.grant_id WHERE t.token_hash = ?').get(sha256(token));
    if (row && row.client_id === client.client_id) db.prepare('DELETE FROM oauth_tokens WHERE token_hash = ?').run(row.token_hash);
  },
};

/* Tela de consentimento do painel */
export function getPending(id) {
  const row = db.prepare('SELECT * FROM oauth_pending WHERE id = ?').get(String(id));
  if (!row || expired(row.expires_at)) return null;
  const client = clientsStore.getClient(row.client_id);
  return client ? { ...row, params: JSON.parse(row.params), client } : null;
}

/* Membro aprovou: cria a concessão e devolve a URL de retorno com o código. */
export function approvePending(pending, memberId) {
  db.prepare('DELETE FROM oauth_pending WHERE id = ?').run(pending.id);
  const { lastInsertRowid } = db.prepare('INSERT INTO oauth_grants (client_id, member_id) VALUES (?, ?)').run(pending.client_id, memberId);
  const code = random();
  db.prepare('INSERT INTO oauth_codes (code_hash, grant_id, code_challenge, redirect_uri, resource, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(sha256(code), Number(lastInsertRowid), pending.params.codeChallenge, pending.params.redirectUri, pending.params.resource, inSeconds(CODE_TTL));
  const url = new URL(pending.params.redirectUri);
  url.searchParams.set('code', code);
  if (pending.params.state) url.searchParams.set('state', pending.params.state);
  return url.href;
}

export function denyPending(pending) {
  db.prepare('DELETE FROM oauth_pending WHERE id = ?').run(pending.id);
  const url = new URL(pending.params.redirectUri);
  url.searchParams.set('error', 'access_denied');
  url.searchParams.set('error_description', 'O membro recusou o acesso.');
  if (pending.params.state) url.searchParams.set('state', pending.params.state);
  return url.href;
}

/* ---------- Tokens pessoais ---------- */
export function createPersonalToken(memberId, name) {
  const token = PERSONAL_PREFIX + random();
  db.prepare('INSERT INTO api_tokens (member_id, name, token_hash, hint) VALUES (?, ?, ?, ?)').run(memberId, name, sha256(token), token.slice(-4));
  return token;
}

export const personalTokens = (memberId) => db.prepare('SELECT id, name, hint, created_at, last_used_at FROM api_tokens WHERE member_id = ? ORDER BY id DESC').all(memberId);
export const revokePersonalToken = (memberId, id) => db.prepare('DELETE FROM api_tokens WHERE id = ? AND member_id = ?').run(Number(id), memberId).changes > 0;

export const connectedApps = (memberId) => db.prepare(`SELECT g.id, g.client_id, g.created_at, g.last_used_at FROM oauth_grants g
  WHERE g.member_id = ? AND EXISTS (SELECT 1 FROM oauth_tokens t WHERE t.grant_id = g.id AND t.expires_at > ?) ORDER BY g.id DESC`)
  .all(memberId, new Date().toISOString()).map((g) => ({ ...g, name: clientName(g.client_id) }));
export const revokeGrant = (memberId, id) => db.prepare('DELETE FROM oauth_grants WHERE id = ? AND member_id = ?').run(Number(id), memberId).changes > 0;

/* ---------- Verificação de qualquer token aceito no /mcp ---------- */
function verifyToken(token) {
  const hash = sha256(token);
  const now = new Date().toISOString();
  if (String(token).startsWith(PERSONAL_PREFIX)) {
    const row = db.prepare('SELECT t.id, t.name, m.id member_id, m.name member_name, m.email, m.active, m.role FROM api_tokens t JOIN members m ON m.id = t.member_id WHERE t.token_hash = ?').get(hash);
    if (!row || !row.active) return null;
    db.prepare('UPDATE api_tokens SET last_used_at = ? WHERE id = ?').run(now, row.id);
    // Tokens pessoais valem até serem revogados; o SDK exige uma expiração, então informamos uma janela rolante.
    return { token, clientId: `token-pessoal-${row.id}`, scopes: [], expiresAt: Math.floor(Date.now() / 1000) + ACCESS_TTL, extra: { member: { id: row.member_id, name: row.member_name, email: row.email, role: row.role }, app: `token "${row.name}"` } };
  }
  const row = db.prepare(`SELECT t.expires_at, t.resource, g.id grant_id, g.client_id, m.id member_id, m.name member_name, m.email, m.active, m.role
    FROM oauth_tokens t JOIN oauth_grants g ON g.id = t.grant_id JOIN members m ON m.id = g.member_id
    WHERE t.token_hash = ? AND t.kind = 'access'`).get(hash);
  if (!row || !row.active || expired(row.expires_at)) return null;
  db.prepare('UPDATE oauth_grants SET last_used_at = ? WHERE id = ?').run(now, row.grant_id);
  return {
    token, clientId: row.client_id, scopes: [], expiresAt: Math.floor(new Date(row.expires_at) / 1000),
    resource: row.resource ? new URL(row.resource) : mcpResourceUrl(),
    extra: { member: { id: row.member_id, name: row.member_name, email: row.email, role: row.role }, app: clientName(row.client_id) },
  };
}

/* Limpeza periódica: pedidos, códigos e tokens vencidos; clientes registrados que nunca foram autorizados. */
setInterval(() => {
  const now = new Date().toISOString();
  db.prepare('DELETE FROM oauth_pending WHERE expires_at < ?').run(now);
  db.prepare('DELETE FROM oauth_codes WHERE expires_at < ?').run(now);
  db.prepare('DELETE FROM oauth_tokens WHERE expires_at < ?').run(now);
  db.prepare("DELETE FROM oauth_clients WHERE created_at < datetime('now', '-7 days') AND client_id NOT IN (SELECT client_id FROM oauth_grants)").run();
}, 60 * 60e3).unref();
