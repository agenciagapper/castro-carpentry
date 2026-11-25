// Gera as imagens do site em public/img e o manifesto src/img-manifest.json. Uso: npm run images
// Cada arquivo em src/img-src (jpg, png ou webp) vira um id (o nome do arquivo sem extensão), em WebP de 480 a 2400 px
// e um JPG 1200x630 para redes sociais. Ícones e og-padrao.jpg saem de src/img-src/icone.png e src/img-src/og-padrao.jpg, se existirem.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { THEME } from '../src/site.config.mjs';
// Castro: photos max out at 1600 px (the old site used 800 and 1600).

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src/img-src');
const OUT = path.join(ROOT, 'public/img');
const MANIFEST = path.join(ROOT, 'src/img-manifest.json');
const WIDTHS = [480, 800, 1200, 1600];
const SPECIAL = ['icone', 'og-padrao'];

fs.mkdirSync(OUT, { recursive: true });
const manifest = {};

for (const file of fs.readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()) {
  const id = path.parse(file).name;
  if (SPECIAL.includes(id)) continue;
  const src = path.join(SRC, file);
  const meta = await sharp(src).metadata();
  const widths = WIDTHS.filter((w) => w <= meta.width);
  if (!widths.length || (widths.at(-1) < meta.width && meta.width < 2400)) widths.push(meta.width);
  for (const w of widths) {
    const out = path.join(OUT, `${id}-${w}.webp`);
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(src).mtimeMs) continue;
    await sharp(src).resize(w).webp({ quality: w >= 1600 ? 68 : 74 }).toFile(out);
  }
  await sharp(src).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(OUT, `${id}-og.jpg`));
  manifest[id] = { w: meta.width, h: meta.height, widths };
  console.log(id, widths.join(','));
}
fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

/* Imagem padrão de compartilhamento */
const ogSrc = fs.existsSync(path.join(SRC, 'og-padrao.jpg')) ? path.join(SRC, 'og-padrao.jpg') : null;
const og = ogSrc ? sharp(ogSrc) : sharp({ create: { width: 1200, height: 630, channels: 3, background: THEME.primary } });
await og.resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, 'og-padrao.jpg'));

/* Ícones: src/img-src/icone.png (quadrado) ou um quadrado na cor principal */
const iconSrc = path.join(SRC, 'icone.png');
for (const size of [32, 180, 192, 512]) {
  const base = fs.existsSync(iconSrc) ? sharp(iconSrc) : sharp({ create: { width: size, height: size, channels: 4, background: THEME.primary } });
  const name = size === 180 ? 'apple-touch-icon.png' : size === 32 ? 'favicon-32.png' : `icon-${size}.png`;
  await base.resize(size, size, { fit: 'cover' }).png().toFile(path.join(OUT, name));
}
console.log(`Manifesto: ${Object.keys(manifest).length} imagens → src/img-manifest.json`);
