// Artigos do blog no banco. Regras compartilhadas pelo painel e, depois, pelo MCP.
import { db, getSetting, setSetting } from './db.mjs';
import { slugify } from '../src/lib.mjs';
import { CONTENT_RULES, SITE } from '../src/site.config.mjs';
import { loadMarkdownPosts } from '../src/build-site.mjs';
import { imageExists } from './images.mjs';

export const POST_STATUS = { rascunho: 'Rascunho', publicado: 'Publicado' };
export const LIMITS = { title: 120, seoTitle: 60, descMin: 140, descMax: 160, bodyMin: 600 };

/* Today's date in the business time zone. */
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: SITE.timeZone }).format(new Date());

/* Converte a linha do banco no formato cru usado por preparePost(). */
export const rowToRaw = (r) => ({
  slug: r.slug, title: r.title, seoTitle: r.seo_title, description: r.description, keyword: r.keyword,
  date: r.published_date || today(), updated: r.updated_date || undefined, category: r.category, service: r.service,
  cover: r.cover, coverAlt: r.cover_alt, featured: Boolean(r.featured), body: r.body,
});

export const publishedRawPosts = () => db.prepare("SELECT * FROM posts WHERE status = 'publicado' ORDER BY published_date DESC").all().map(rowToRaw);
export const getPost = (id) => db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(id));
export const getPostBySlug = (slug) => db.prepare('SELECT * FROM posts WHERE slug = ?').get(String(slug));
export const categories = () => db.prepare("SELECT DISTINCT category FROM posts WHERE category != '' ORDER BY category").all().map((r) => r.category);

export function listPosts({ status = '' } = {}) {
  const rows = status
    ? db.prepare('SELECT * FROM posts WHERE status = ? ORDER BY COALESCE(published_date, updated_at) DESC').all(status)
    : db.prepare("SELECT * FROM posts ORDER BY status = 'publicado', COALESCE(published_date, updated_at) DESC").all();
  return rows;
}

export const redirectFor = (oldSlug) => db.prepare(
  "SELECT p.slug FROM post_redirects r JOIN posts p ON p.id = r.post_id WHERE r.old_slug = ? AND p.status = 'publicado'",
).get(String(oldSlug))?.slug;

/* Primeira execução: importa os artigos .md do repositório como publicados. */
export function seedPostsFromMarkdown() {
  if (getSetting('postsSeeded')) return 0;
  const insert = db.prepare(`INSERT OR IGNORE INTO posts (slug, status, title, seo_title, description, keyword, category, service, cover, cover_alt, featured, body, published_date, updated_date, updated_via)
    VALUES (?, 'publicado', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'importação')`);
  const posts = loadMarkdownPosts();
  for (const p of posts) {
    insert.run(p.slug, p.title, p.seoTitle || '', p.description || '', p.keyword || '', p.category || '', p.service || '', p.cover || '', p.coverAlt || '', p.featured ? 1 : 0, p.body.trim(), p.date, p.updated || null);
  }
  setSetting('postsSeeded', true);
  return posts.length;
}

/* ---------- Regras de conteúdo (CONTENT_RULES no site.config) ---------- */
/* Travessão bloqueia a publicação; o resto vira aviso. */
export function styleIssues(text) {
  const t = String(text || '');
  const errors = [];
  const warnings = [];
  const dashes = (t.match(/[—–]/g) || []).length;
  if (CONTENT_RULES.blockDashes && dashes) errors.push(`O texto tem ${dashes} travessão${dashes > 1 ? 'ões' : ''} (— ou –). Troque por vírgula, ponto ou dois-pontos.`);
  const bangs = (t.replace(/!\[/g, '').match(/!/g) || []).length;
  if (CONTENT_RULES.warnExclamation && bangs) warnings.push(`O texto tem ${bangs} ponto${bangs > 1 ? 's' : ''} de exclamação. Prefira um tom sereno.`);
  const pra = t.match(/\b(pra|pras|pro|pros)\b/gi);
  if (CONTENT_RULES.warnPraPro && pra) warnings.push(`Encontramos "${[...new Set(pra.map((w) => w.toLowerCase()))].join('", "')}". Prefira "para", "para o", "para a".`);
  if (CONTENT_RULES.warnAntithesis && /\bnão é\b[^.?!\n]{1,80}[,;]\s*(é|mas sim)\b/i.test(t)) warnings.push('Há uma construção do tipo "não é X, é Y". Prefira afirmar diretamente.');
  return { errors, warnings };
}

const str = (v, max) => String(v ?? '').trim().slice(0, max);

/* Confere os campos. Rascunho só exige título; publicar exige tudo o que o site usa. */
export function validatePost(input, { id = null, publishing = false } = {}) {
  const data = {
    title: str(input.title, LIMITS.title),
    slug: slugify(str(input.slug, 120) || str(input.title, 120)),
    seo_title: str(input.seo_title, 120),
    description: str(input.description, 400),
    keyword: str(input.keyword, 120),
    category: str(input.category, 60),
    service: str(input.service, 80),
    cover: str(input.cover, 80),
    cover_alt: str(input.cover_alt, 200),
    featured: input.featured === 'on' || input.featured === true || input.featured === 1 ? 1 : 0,
    body: String(input.body ?? '').replace(/\r\n/g, '\n').trim().slice(0, 100000),
  };
  const errors = {};
  const warnings = [];
  if (!data.title) errors.title = 'Informe o título.';
  if (!data.slug) errors.slug = 'Informe o endereço do artigo.';
  else if (db.prepare('SELECT 1 FROM posts WHERE slug = ? AND id IS NOT ?').get(data.slug, id)) errors.slug = 'Já existe um artigo com esse endereço.';
  if (data.cover && !imageExists(data.cover)) errors.cover = 'Imagem de capa não encontrada.';
  if (data.service && !db.prepare('SELECT 1 FROM services WHERE slug = ?').get(data.service)) errors.service = 'Serviço relacionado não encontrado.';

  if (publishing) {
    if (!data.seo_title) errors.seo_title = 'Informe o título para o Google.';
    if (!data.description) errors.description = 'Informe a descrição.';
    if (!data.category) errors.category = 'Informe a categoria.';
    if (!data.cover) errors.cover = 'Escolha uma imagem de capa.';
    if (data.cover && !data.cover_alt) errors.cover_alt = 'Descreva a imagem de capa para acessibilidade e SEO.';
    if (data.body.length < LIMITS.bodyMin) errors.body = `O texto está curto demais para publicar (mínimo de ${LIMITS.bodyMin} caracteres).`;
  }
  if (data.seo_title.length > LIMITS.seoTitle) warnings.push(`O título para o Google tem ${data.seo_title.length} caracteres. Acima de ${LIMITS.seoTitle}, ele costuma aparecer cortado.`);
  if (data.description && (data.description.length < LIMITS.descMin || data.description.length > LIMITS.descMax)) {
    warnings.push(`A descrição tem ${data.description.length} caracteres. O ideal é entre ${LIMITS.descMin} e ${LIMITS.descMax}.`);
  }
  if (data.keyword) {
    const k = data.keyword.toLowerCase();
    const firstParagraph = data.body.split(/\n\s*\n/)[0].toLowerCase();
    if (!data.title.toLowerCase().includes(k) && !data.seo_title.toLowerCase().includes(k)) warnings.push('A palavra-chave não aparece no título.');
    if (!data.description.toLowerCase().includes(k)) warnings.push('A palavra-chave não aparece na descrição.');
    if (!firstParagraph.includes(k)) warnings.push('A palavra-chave não aparece no primeiro parágrafo.');
  }
  if (data.body && !/^##\s/m.test(data.body)) warnings.push('O texto não tem subtítulos (##). Eles ajudam a leitura e o sumário do artigo.');
  if (data.body && !new RegExp(`^##\\s+${CONTENT_RULES.faqHeading}`, 'im').test(data.body)) warnings.push(`Sem a seção "## ${CONTENT_RULES.faqHeading}". Com perguntas em ###, ela vira resultado rico no Google.`);

  const style = styleIssues([data.title, data.seo_title, data.description, data.cover_alt, data.body].join('\n'));
  if (publishing && style.errors.length) errors.style = style.errors.join(' ');
  warnings.push(...style.errors.filter(() => !publishing), ...style.warnings);
  return { data, errors, warnings };
}

/* Cria ou atualiza. Devolve o id. `publish`: true publica, false despublica, undefined mantém. */
export function savePost({ id = null, data, member, via = 'painel', publish }) {
  const current = id ? getPost(id) : null;
  const status = publish === true ? 'publicado' : publish === false ? 'rascunho' : current?.status || 'rascunho';
  const wasPublished = current?.status === 'publicado';
  let publishedDate = current?.published_date || null;
  let updatedDate = current?.updated_date || null;
  if (status === 'publicado' && !publishedDate) publishedDate = today();
  else if (status === 'publicado' && wasPublished && current.body !== data.body) updatedDate = today();

  db.exec('BEGIN');
  try {
    if (data.featured) db.prepare('UPDATE posts SET featured = 0 WHERE id IS NOT ?').run(id);
    if (current) {
      if (wasPublished && current.slug !== data.slug) {
        db.prepare('INSERT OR REPLACE INTO post_redirects (old_slug, post_id) VALUES (?, ?)').run(current.slug, id);
      }
      db.prepare('DELETE FROM post_redirects WHERE old_slug = ?').run(data.slug);
      db.prepare(`UPDATE posts SET slug = ?, status = ?, title = ?, seo_title = ?, description = ?, keyword = ?, category = ?, service = ?, cover = ?, cover_alt = ?,
        featured = ?, body = ?, published_date = ?, updated_date = ?, updated_at = datetime('now'), updated_by = ?, updated_via = ? WHERE id = ?`)
        .run(data.slug, status, data.title, data.seo_title, data.description, data.keyword, data.category, data.service, data.cover, data.cover_alt,
          data.featured, data.body, publishedDate, updatedDate, member?.id ?? null, via, id);
    } else {
      const r = db.prepare(`INSERT INTO posts (slug, status, title, seo_title, description, keyword, category, service, cover, cover_alt, featured, body, published_date, created_by, updated_by, updated_via)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(data.slug, status, data.title, data.seo_title, data.description, data.keyword, data.category, data.service, data.cover, data.cover_alt,
          data.featured, data.body, publishedDate, member?.id ?? null, member?.id ?? null, via);
      id = Number(r.lastInsertRowid);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return { id, status, changedPublic: wasPublished || status === 'publicado' };
}

export const deletePost = (id) => db.prepare('DELETE FROM posts WHERE id = ?').run(Number(id));
