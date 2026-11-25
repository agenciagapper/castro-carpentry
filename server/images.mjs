// Imagens enviadas pelo painel (capas e imagens dos artigos) e fotos de perfil. Ficam em DATA_DIR/uploads.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { db, DATA_DIR } from './db.mjs';
import { slugify, builtinImageIds } from '../src/lib.mjs';

export const UPLOADS_IMG = path.join(DATA_DIR, 'uploads/img');
export const UPLOADS_ORIG = path.join(DATA_DIR, 'uploads/originais');
export const AVATARS = path.join(DATA_DIR, 'uploads/avatares');
for (const dir of [UPLOADS_IMG, UPLOADS_ORIG, AVATARS]) fs.mkdirSync(dir, { recursive: true });

const WIDTHS = [480, 800, 1200, 1600];
const FORMATS = ['jpeg', 'png', 'webp', 'avif'];
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MIN_WIDTH = 800;

/* Mesmo padrão do scripts/images.mjs: WebP em várias larguras e um JPG 1200x630 para redes sociais. */
export async function saveImage(buffer, originalName, member) {
  let meta;
  try { meta = await sharp(buffer).metadata(); } catch { throw new Error('Arquivo de imagem inválido.'); }
  if (!FORMATS.includes(meta.format)) throw new Error('Envie uma imagem JPG, PNG, WebP ou AVIF.');
  const rotated = sharp(buffer).rotate();
  const { width: w, height: h } = await rotated.clone().metadata().then((m) => (m.orientation >= 5 ? { width: m.height, height: m.width } : m));
  if (w < MIN_WIDTH) throw new Error(`A imagem precisa ter pelo menos ${MIN_WIDTH} px de largura. Esta tem ${w} px.`);

  const base = slugify(path.parse(originalName || 'imagem').name).slice(0, 40) || 'imagem';
  const id = `up-${base}-${crypto.randomBytes(3).toString('hex')}`;
  const widths = WIDTHS.filter((x) => x <= w);
  if (widths.at(-1) < w && w < 1600) widths.push(w);

  for (const width of widths) {
    await rotated.clone().resize(width).webp({ quality: width >= 1600 ? 68 : 74 }).toFile(path.join(UPLOADS_IMG, `${id}-${width}.webp`));
  }
  await rotated.clone().resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(UPLOADS_IMG, `${id}-og.jpg`));
  fs.writeFileSync(path.join(UPLOADS_ORIG, `${id}.${meta.format === 'jpeg' ? 'jpg' : meta.format}`), buffer);

  db.prepare('INSERT INTO images (id, original_name, w, h, widths, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, String(originalName || '').slice(0, 200), w, h, JSON.stringify(widths), member?.id ?? null);
  return id;
}

/* Entradas no formato do src/img-manifest.json, para registrar antes do build. */
export const uploadedManifest = () => Object.fromEntries(
  db.prepare('SELECT id, w, h, widths FROM images').all().map((r) => [r.id, { w: r.w, h: r.h, widths: JSON.parse(r.widths) }]),
);

/* Where an image is used: blog posts, pages, services and service areas (content is JSON, so the quoted id is searched). */
export const usage = (id) => {
  const q = `"${id}"`;
  return [
    ...db.prepare("SELECT id, title FROM posts WHERE cover = ? OR instr(body, ?) > 0").all(id, `/img/${id}-`).map((r) => ({ title: `Artigo: ${r.title}` })),
    ...db.prepare('SELECT key FROM pages WHERE instr(data, ?) > 0').all(q).map((r) => ({ title: `Página: ${r.key}` })),
    ...db.prepare('SELECT slug FROM services WHERE instr(data, ?) > 0').all(q).map((r) => ({ title: `Serviço: ${r.slug}` })),
    ...db.prepare('SELECT slug FROM areas WHERE instr(data, ?) > 0').all(q).map((r) => ({ title: `Cidade: ${r.slug}` })),
  ];
};

/* Biblioteca: imagens enviadas primeiro, depois as que vieram com o site. */
export function listImages() {
  const uploaded = db.prepare('SELECT * FROM images ORDER BY created_at DESC').all()
    .map((r) => ({ id: r.id, uploaded: true, name: r.original_name, w: r.w, h: r.h, widths: JSON.parse(r.widths), usedBy: usage(r.id) }));
  const builtin = builtinImageIds.map((id) => ({ id, uploaded: false, name: id, usedBy: usage(id) }));
  return [...uploaded, ...builtin];
}

export const imageExists = (id) => builtinImageIds.includes(id) || Boolean(db.prepare('SELECT 1 FROM images WHERE id = ?').get(id));

export function deleteImage(id) {
  const row = db.prepare('SELECT * FROM images WHERE id = ?').get(id);
  if (!row) throw new Error('Só é possível excluir imagens enviadas pelo painel.');
  const used = usage(id);
  if (used.length) throw new Error(`Esta imagem está em uso em: ${used.map((p) => p.title).join(', ')}.`);
  for (const f of fs.readdirSync(UPLOADS_IMG)) if (f.startsWith(`${id}-`)) fs.rmSync(path.join(UPLOADS_IMG, f));
  for (const f of fs.readdirSync(UPLOADS_ORIG)) if (f.startsWith(`${id}.`)) fs.rmSync(path.join(UPLOADS_ORIG, f));
  db.prepare('DELETE FROM images WHERE id = ?').run(id);
}

/* ---------- Fotos de perfil ---------- */
export async function saveAvatar(buffer, memberId) {
  let meta;
  try { meta = await sharp(buffer).metadata(); } catch { throw new Error('Arquivo de imagem inválido.'); }
  if (!FORMATS.includes(meta.format)) throw new Error('Envie uma imagem JPG, PNG, WebP ou AVIF.');
  const file = `${memberId}-${crypto.randomBytes(4).toString('hex')}.webp`;
  await sharp(buffer).rotate().resize(256, 256, { fit: 'cover' }).webp({ quality: 80 }).toFile(path.join(AVATARS, file));
  removeAvatar(memberId);
  db.prepare('UPDATE members SET avatar = ? WHERE id = ?').run(file, memberId);
  return file;
}

export function removeAvatar(memberId) {
  const row = db.prepare('SELECT avatar FROM members WHERE id = ?').get(memberId);
  if (row?.avatar) fs.rmSync(path.join(AVATARS, path.basename(row.avatar)), { force: true });
  db.prepare('UPDATE members SET avatar = NULL WHERE id = ?').run(memberId);
}
