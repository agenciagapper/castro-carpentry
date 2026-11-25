// Lê as variáveis de ambiente uma vez, tolerando erros comuns, e avisa no log o que estiver faltando.
// Importado antes de tudo no server/index.mjs.
import { SITE } from '../src/site.config.mjs';

/* PUBLIC_URL: aceita sem https://, com aspas ou com barra no fim. Inválido = usa o domínio padrão e avisa. */
function resolvePublicUrl() {
  let raw = String(process.env.PUBLIC_URL || '').trim().replace(/^['"]|['"]$/g, '').trim();
  if (!raw) return SITE.url;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const u = new URL(raw);
    if (!u.hostname.includes('.') && u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') throw new Error('domínio incompleto');
    return u.origin;
  } catch (err) {
    console.error(`PUBLIC_URL inválido ("${process.env.PUBLIC_URL}"): ${err.message}. Usando ${SITE.url}. Corrija para algo como https://www.dominio-do-cliente.com.br.`);
    return SITE.url;
  }
}

export const PUBLIC_URL = resolvePublicUrl();
// O endereço público vale também para links canônicos, sitemap, Open Graph e dados estruturados.
SITE.url = PUBLIC_URL;

if (process.env.NODE_ENV === 'production') {
  if (!process.env.PUBLIC_URL) console.warn(`PUBLIC_URL não definido: usando ${SITE.url}. Defina o domínio real do site.`);
  if (!process.env.DATA_DIR) console.warn('DATA_DIR não definido: o banco e as imagens ficam dentro da pasta do app e podem ser apagados no próximo deploy.');
}
