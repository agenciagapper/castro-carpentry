// Telas do painel. HTML gerado no servidor, no mesmo estilo de src/lib.mjs.
import { esc, slugify } from '../src/lib.mjs';
import { SITE } from '../src/site.config.mjs';
import { STATUS, SOURCES, PAGE_SIZE } from './leads.mjs';
import { POST_STATUS, LIMITS } from './blog.mjs';
import { ROLES } from './auth.mjs';

export const fmtDate = (sqlite) => {
  if (!sqlite) return 'nunca';
  const d = new Date(sqlite.includes('T') ? sqlite : `${sqlite.replace(' ', 'T')}Z`);
  return d.toLocaleString('pt-BR', { timeZone: SITE.timeZone, dateStyle: 'short', timeStyle: 'short' });
};

const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
export const avatar = (m, cls = '') => (m.avatar
  ? `<img class="avatar ${cls}" src="/admin/avatares/${esc(m.avatar)}" alt="" width="34" height="34">`
  : `<span class="avatar ${cls}" aria-hidden="true">${esc(initials(m.name))}</span>`);

/* Mensagens fixas mostradas após um redirecionamento (?msg=). Nada do que o usuário digita volta na URL. */
const MESSAGES = {
  contatos: ['ok', 'Dados da empresa salvos. O site já foi atualizado.'],
  pagina: ['ok', 'Página salva. O site já foi atualizado.'],
  'pagina-restaurada': ['ok', 'Textos originais restaurados. O site já foi atualizado.'],
  servico: ['ok', 'Serviço salvo. O site já foi atualizado.'],
  'servico-criado': ['ok', 'Serviço criado. Ele já está no site, no menu e no formulário.'],
  'servico-ativado': ['ok', 'Serviço ativado. Ele voltou para o site.'],
  'servico-desativado': ['ok', 'Serviço desativado. A página saiu do site e o endereço leva para a página de serviços.'],
  'servico-excluido': ['ok', 'Serviço excluído. O endereço antigo leva para a página de serviços.'],
  cidade: ['ok', 'Cidade salva. O site já foi atualizado.'],
  'cidade-criada': ['ok', 'Cidade criada. A página já está no site.'],
  'cidade-ativada': ['ok', 'Cidade ativada.'],
  'cidade-desativada': ['ok', 'Cidade desativada. A página saiu do site.'],
  'cidade-excluida': ['ok', 'Cidade excluída.'],
  ordem: ['ok', 'Ordem atualizada. O site já foi atualizado.'],
  faq: ['ok', 'Pergunta salva. O site já foi atualizado.'],
  'faq-excluida': ['ok', 'Pergunta excluída.'],
  avaliacao: ['ok', 'Avaliação salva. O site já foi atualizado.'],
  'avaliacao-excluida': ['ok', 'Avaliação excluída.'],
  papel: ['ok', 'Papel do usuário alterado.'],
  'so-admin': ['erro', 'Só administradores podem fazer isso.'],
  instagram: ['ok', 'Instagram sincronizado.'],
  perfil: ['ok', 'Perfil atualizado.'],
  email: ['ok', 'E-mail atualizado.'],
  senha: ['ok', 'Senha alterada. As outras sessões abertas com a sua conta foram encerradas.'],
  convite: ['ok', 'Convite criado.'],
  'convite-email': ['ok', 'Convite enviado por e-mail.'],
  'convite-cancelado': ['ok', 'Convite cancelado.'],
  desativado: ['ok', 'Membro desativado. As sessões abertas com essa conta foram encerradas.'],
  ativado: ['ok', 'Membro reativado.'],
  removido: ['ok', 'Membro removido.'],
  'ultimo-membro': ['erro', 'É preciso manter pelo menos um administrador ativo.'],
  'proprio-membro': ['erro', 'Para desativar ou remover a sua própria conta, peça a outro membro.'],
  'ja-membro': ['erro', 'Já existe um membro com esse e-mail.'],
  'email-invalido': ['erro', 'Informe um e-mail válido.'],
  'senha-redefinida': ['ok', 'Senha redefinida. Entre com a nova senha.'],
  'conta-criada': ['ok', 'Conta criada. O painel já está liberado para você.'],
  saiu: ['ok', 'Você saiu do painel.'],
  'lead-status': ['ok', 'Status do lead atualizado.'],
  'lead-nota': ['ok', 'Anotação adicionada.'],
  'lead-excluido': ['ok', 'Lead excluído definitivamente.'],
  'post-salvo': ['ok', 'Rascunho salvo.'],
  'post-publicado': ['ok', 'Artigo publicado. O site já foi atualizado.'],
  'post-atualizado': ['ok', 'Artigo atualizado no site.'],
  'post-despublicado': ['ok', 'Artigo despublicado. Ele saiu do site e voltou a ser rascunho.'],
  'post-excluido': ['ok', 'Artigo excluído.'],
  'imagem-enviada': ['ok', 'Imagem enviada.'],
  'imagem-excluida': ['ok', 'Imagem excluída.'],
  foto: ['ok', 'Foto de perfil atualizada.'],
  integracoes: ['ok', 'Integrações salvas. O site já foi atualizado.'],
  'token-revogado': ['ok', 'Token revogado. Quem usava esse token perdeu o acesso.'],
  'app-desconectado': ['ok', 'Aplicativo desconectado.'],
  'ia-conectada': ['ok', 'Aplicativo conectado. Volte para a janela da IA para continuar.'],
  segredo: ['ok', 'Novo segredo do webhook gerado. Atualize-o no sistema que recebe os leads.'],
  'foto-removida': ['ok', 'Foto de perfil removida.'],
};

const flash = (msg) => {
  const m = MESSAGES[msg];
  return m ? `<p class="flash flash--${m[0]}" role="status">${m[1]}</p>` : '';
};

export const csrfField = (csrf) => `<input type="hidden" name="_csrf" value="${esc(csrf)}">`;

export function field({ name, label, value = '', type = 'text', error, hint, autocomplete, required = false, attrs = '', id = `f-${name}` }) {
  return `<div class="field${error ? ' field--error' : ''}">
    <label for="${id}">${label}</label>
    <input id="${id}" name="${name}" type="${type}" value="${type === 'password' ? '' : esc(value)}"${autocomplete ? ` autocomplete="${autocomplete}"` : ''}${required ? ' required' : ''} ${attrs}${error ? ` aria-invalid="true" aria-describedby="${id}-err"` : hint ? ` aria-describedby="${id}-hint"` : ''}>
    ${error ? `<p class="field__error" id="${id}-err">${esc(error)}</p>` : hint ? `<p class="field__hint" id="${id}-hint">${hint}</p>` : ''}
  </div>`;
}

const head = (title) => `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)} · Painel ${esc(SITE.shortName)}</title>
<link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="/css/theme.css">
<link rel="stylesheet" href="/admin/assets/admin.css">
<script src="/admin/assets/admin.js" defer></script>
</head>`;

const NAV = [
  { key: 'inicio', label: 'Início', href: '/admin' },
  { key: 'leads', label: 'Leads', href: '/admin/leads' },
  { group: 'Conteúdo do site' },
  { key: 'paginas', label: 'Páginas', href: '/admin/paginas' },
  { key: 'servicos', label: 'Serviços', href: '/admin/servicos' },
  { key: 'cidades', label: 'Áreas atendidas', href: '/admin/cidades' },
  { key: 'faq', label: 'FAQ', href: '/admin/faq' },
  { key: 'avaliacoes', label: 'Avaliações', href: '/admin/avaliacoes' },
  { key: 'blog', label: 'Blog', href: '/admin/blog' },
  { key: 'imagens', label: 'Imagens', href: '/admin/imagens' },
  { key: 'empresa', label: 'Dados da empresa', href: '/admin/empresa' },
  { group: 'Configurações' },
  { key: 'integracoes', label: 'Integrações', href: '/admin/integracoes', admin: true },
  { key: 'ia', label: 'Conectar IA (MCP)', href: '/admin/ia' },
  { key: 'membros', label: 'Usuários', href: '/admin/membros' },
  { key: 'atividades', label: 'Atividades', href: '/admin/atividades' },
];

/* Layout do painel com menu lateral. */
export function page({ title, member, csrf, active, msg, body, badges = {} }) {
  const items = NAV.filter((n) => !n.admin || member.role === 'admin').map((n) => (n.group
    ? `<li class="nav-group">${n.group}</li>`
    : `<li><a href="${n.href}"${n.key === active ? ' aria-current="page"' : ''}>${n.label}${badges[n.key] ? `<span class="badge" aria-label="${badges[n.key]} novos">${badges[n.key]}</span>` : ''}</a></li>`)).join('');
  return `${head(title)}
<body class="admin">
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
<header class="topbar">
  <a class="brand" href="/admin">${esc(SITE.shortName)} <span>Painel</span></a>
  <button class="topbar__menu" type="button" aria-expanded="false" aria-controls="menu" data-menu>Menu</button>
</header>
<div class="shell">
  <nav class="sidebar" id="menu" aria-label="Painel" data-brand="${esc(SITE.shortName)}">
    <ul>${items}</ul>
    <div class="sidebar__foot">
      <a class="me${active === 'perfil' ? ' me--active' : ''}" href="/admin/perfil">${avatar(member)}<span>${esc(member.name)}<small>${ROLES[member.role] || ''} · Meu perfil</small></span></a>
      <a class="sidebar__site" href="/" target="_blank" rel="noopener">Ver o site</a>
      <form method="post" action="/admin/sair">${csrfField(csrf)}<button class="link" type="submit">Sair</button></form>
    </div>
  </nav>
  <main class="main" id="conteudo">
    <h1>${esc(title)}</h1>
    ${flash(msg)}
    ${body}
  </main>
</div>
</body>
</html>`;
}

/* Telas sem login: entrar, esqueci a senha, convite. */
export function authPage({ title, msg, body }) {
  return `${head(title)}
<body class="auth">
<main class="auth__card">
  <p class="brand brand--dark">${esc(SITE.shortName)} <span>Painel</span></p>
  <h1>${esc(title)}</h1>
  ${flash(msg)}
  ${body}
</main>
</body>
</html>`;
}

const errorBox = (error) => (error ? `<p class="flash flash--erro" role="alert">${esc(error)}</p>` : '');

export const loginView = ({ email = '', error, msg, back = '' }) => authPage({ title: 'Entrar', msg, body: `
  ${errorBox(error)}
  <form method="post" action="/admin/entrar" class="stack">
    <input type="hidden" name="voltar" value="${esc(back)}">
    ${field({ name: 'email', label: 'E-mail', type: 'email', value: email, autocomplete: 'username', required: true, attrs: 'autofocus' })}
    ${field({ name: 'password', label: 'Senha', type: 'password', autocomplete: 'current-password', required: true })}
    <button class="btn" type="submit">Entrar</button>
  </form>
  <p class="auth__alt"><a href="/admin/esqueci">Esqueci a senha</a></p>` });

export const forgotView = ({ sent, mailEnabled }) => authPage({ title: 'Esqueci a senha', body: sent
  ? `<p>Se esse e-mail pertence a um membro ativo, enviamos um link para criar uma nova senha. Ele vale por 1 hora.</p><p class="auth__alt"><a href="/admin/entrar">Voltar para o login</a></p>`
  : mailEnabled
    ? `<p>Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.</p>
      <form method="post" action="/admin/esqueci" class="stack">
        ${field({ name: 'email', label: 'E-mail', type: 'email', autocomplete: 'username', required: true, attrs: 'autofocus' })}
        <button class="btn" type="submit">Enviar link</button>
      </form>
      <p class="auth__alt"><a href="/admin/entrar">Voltar para o login</a></p>`
    : `<p>O envio de e-mail ainda não foi configurado. Peça a outro membro para gerar um link de redefinição na página Membros.</p><p class="auth__alt"><a href="/admin/entrar">Voltar para o login</a></p>` });

export const resetView = ({ token, email, error }) => authPage({ title: 'Nova senha', body: `
  ${errorBox(error)}
  <form method="post" action="/admin/redefinir/${esc(token)}" class="stack">
    <input type="email" name="email" value="${esc(email)}" autocomplete="username" hidden>
    ${field({ name: 'password', label: 'Nova senha', type: 'password', autocomplete: 'new-password', required: true, hint: 'Pelo menos 10 caracteres.' })}
    ${field({ name: 'password2', label: 'Repita a nova senha', type: 'password', autocomplete: 'new-password', required: true })}
    <button class="btn" type="submit">Salvar nova senha</button>
  </form>` });

export const inviteView = ({ token, email, name = '', error }) => authPage({ title: 'Criar sua conta', body: `
  <p>Este convite dá acesso ao painel do site da ${esc(SITE.name)} com o e-mail <strong>${esc(email)}</strong>.</p>
  ${errorBox(error)}
  <form method="post" action="/admin/convite/${esc(token)}" class="stack">
    <input type="email" name="email" value="${esc(email)}" autocomplete="username" hidden>
    ${field({ name: 'name', label: 'Seu nome', value: name, autocomplete: 'name', required: true, attrs: 'autofocus maxlength="80"' })}
    ${field({ name: 'password', label: 'Senha', type: 'password', autocomplete: 'new-password', required: true, hint: 'Pelo menos 10 caracteres.' })}
    ${field({ name: 'password2', label: 'Repita a senha', type: 'password', autocomplete: 'new-password', required: true })}
    <button class="btn" type="submit">Criar conta</button>
  </form>` });

export const invalidLinkView = () => authPage({ title: 'Link inválido', body: `<p>Este link expirou ou já foi usado. Peça um novo a um membro do painel.</p><p class="auth__alt"><a href="/admin/entrar">Ir para o login</a></p>` });

/* ---------- Telas internas ---------- */
const activityList = (rows) => rows.length
  ? `<ul class="activity">${rows.map((a) => `<li><time>${fmtDate(a.created_at)}</time><span><strong>${esc(a.member_name || 'Sistema')}</strong> ${esc(a.action)}${a.detail ? `: ${esc(a.detail)}` : ''}</span>${a.via !== 'painel' ? `<span class="tag">via ${esc(a.via)}</span>` : ''}</li>`).join('')}</ul>`
  : '<p class="muted">Nenhuma atividade registrada ainda.</p>';

export const dashboardView = ({ activity, business, lastBuild, leads, content, blog, integrations, isAdmin }) => `
  <div class="cards">
    <a class="card" href="/admin/leads"><span class="card__label">Leads nos últimos 30 dias</span><strong>${leads.total}</strong><span class="muted">${leads.novos ? `${leads.novos} aguardando contato` : 'Nenhum aguardando contato'}${leads.suspeitos ? ` · ${leads.suspeitos} em quarentena` : ''}</span></a>
    <a class="card" href="/admin/servicos"><span class="card__label">Serviços</span><strong>${content.services} ativos</strong><span class="muted">${content.areas} cidades com página</span></a>
    <a class="card" href="/admin/blog"><span class="card__label">Blog</span><strong>${blog.published} publicados</strong><span class="muted">${blog.drafts ? `${blog.drafts} rascunho${blog.drafts > 1 ? 's' : ''}` : 'Nenhum rascunho'}</span></a>
    <a class="card" href="/admin/empresa"><span class="card__label">Dados da empresa</span><strong>${esc(business.phone)}</strong><span class="muted">${esc(business.email)}</span></a>
    ${isAdmin ? `<a class="card" href="/admin/integracoes"><span class="card__label">Integrações</span><strong>${integrations.active ? `${integrations.active} ativa${integrations.active > 1 ? 's' : ''}` : 'Nenhuma ativa'}</strong><span class="muted">${integrations.failures ? `${integrations.failures} falha${integrations.failures > 1 ? 's' : ''} nas últimas 24 h` : 'Sem falhas recentes'}</span></a>` : ''}
  </div>
  ${leads.byPage.length ? `<h2>Páginas que mais geraram leads (30 dias)</h2>
  <ul class="list">${leads.byPage.map((r) => `<li><span><a href="/admin/leads?pagina_site=${encodeURIComponent(r.page_path)}">${esc(r.page_path || '(sem página)')}</a></span><strong>${r.n}</strong></li>`).join('')}</ul>` : ''}
  <p class="muted">Última geração do site: ${lastBuild ? `${fmtDate(lastBuild.at)}, ${lastBuild.pages} páginas em ${lastBuild.ms} ms` : 'ainda não registrada'}.</p>
  <h2>Atividade recente</h2>
  ${activityList(activity)}`;

export const businessView = ({ csrf, data, errors = {} }) => `
  <p class="lead">Estes dados aparecem no topo, no rodapé, na página de contato, nos botões de ligar e nos dados estruturados para o Google. Ao salvar, o site é atualizado na hora.</p>
  ${Object.keys(errors).length ? '<p class="flash flash--erro" role="alert">Confira os campos destacados.</p>' : ''}
  <form method="post" action="/admin/empresa" class="form">
    ${csrfField(csrf)}
    <fieldset><legend>Contato</legend>
      <div class="grid">
        ${field({ name: 'phone', label: 'Telefone', value: data.phone, error: errors.phone, hint: 'Telefone americano, por exemplo (508) 566-1618.', autocomplete: 'off' })}
        ${field({ name: 'email', label: 'E-mail', type: 'email', value: data.email, error: errors.email, autocomplete: 'off' })}
        ${field({ name: 'instagram', label: 'Instagram', value: data.instagram, error: errors.instagram, hint: 'Usuário sem o @, ou o link do perfil. Vazio para não exibir.', autocomplete: 'off' })}
      </div>
    </fieldset>
    <fieldset><legend>Endereço (igual ao Perfil da Empresa no Google)</legend>
      <div class="grid">
        ${field({ name: 'street', label: 'Endereço', value: data.street, error: errors.street, autocomplete: 'off' })}
        ${field({ name: 'city', label: 'Cidade', value: data.city, error: errors.city, autocomplete: 'off' })}
        ${field({ name: 'state', label: 'Estado', value: data.state, error: errors.state, autocomplete: 'off', attrs: 'maxlength="2"' })}
        ${field({ name: 'zip', label: 'ZIP', value: data.zip, error: errors.zip, autocomplete: 'off' })}
        ${field({ name: 'mapsUrl', label: 'Link do Google Maps', value: data.mapsUrl, error: errors.mapsUrl, autocomplete: 'off' })}
        ${field({ name: 'lat', label: 'Latitude', value: data.lat, error: errors.lat, autocomplete: 'off' })}
        ${field({ name: 'lng', label: 'Longitude', value: data.lng, error: errors.lng, autocomplete: 'off' })}
      </div>
    </fieldset>
    <fieldset><legend>Avaliações no Google</legend>
      <div class="grid">
        ${field({ name: 'rating', label: 'Nota média', value: data.rating, error: errors.rating, hint: 'Ex.: 5.0', autocomplete: 'off' })}
        ${field({ name: 'reviewCount', label: 'Número de avaliações', value: data.reviewCount, error: errors.reviewCount, hint: 'Atualize quando o número mudar no Google.', autocomplete: 'off' })}
        ${field({ name: 'googleReviewsUrl', label: 'Link "ler todas no Google"', value: data.googleReviewsUrl, error: errors.googleReviewsUrl, autocomplete: 'off' })}
        ${field({ name: 'googleWriteReviewUrl', label: 'Link "deixar avaliação"', value: data.googleWriteReviewUrl, error: errors.googleWriteReviewUrl, autocomplete: 'off' })}
      </div>
    </fieldset>
    <fieldset><legend>Financiamento</legend>
      <div class="grid">
        ${field({ name: 'enhancifyPage', label: 'ID da página no Enhancify', value: data.enhancifyPage, error: errors.enhancifyPage, hint: 'Vazio esconde o simulador da página de financiamento.', autocomplete: 'off' })}
      </div>
    </fieldset>
    <button class="btn" type="submit">Salvar e atualizar o site</button>
  </form>`;

export const membersView = ({ csrf, me, members, invites, newLink, mailEnabled }) => {
  const admin = me.role === 'admin';
  const roleSelect = (name, current, id) => `<select name="${name}" id="${id}">${Object.entries(ROLES).map(([k, l]) => `<option value="${k}"${k === current ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
  return `
  ${newLink ? `<div class="notice"><p><strong>${esc(newLink.label)}</strong> Envie este link para ${esc(newLink.email)}. Ele vale por ${newLink.hours} horas e só pode ser usado uma vez.</p><div class="copy"><input type="text" value="${esc(newLink.url)}" readonly aria-label="Link"><button class="btn btn--small" type="button" data-copy>Copiar</button></div></div>` : ''}
  <p class="lead"><strong>Administrador</strong>: tudo, inclusive usuários e integrações. <strong>Editor</strong>: conteúdo do site, blog, imagens e leads.</p>
  <div class="table-wrap"><table class="table">
    <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Situação</th><th>Último acesso</th>${admin ? '<th><span class="sr">Ações</span></th>' : ''}</tr></thead>
    <tbody>${members.map((m) => `<tr>
      <td><span class="member-name">${avatar(m)}${esc(m.name)}${m.id === me.id ? ' <span class="tag">você</span>' : ''}</span></td>
      <td>${esc(m.email)}</td>
      <td>${admin && m.id !== me.id ? `<form method="post" action="/admin/membros/${m.id}/papel" class="inline-mini">${csrfField(csrf)}${roleSelect('role', m.role, `role-${m.id}`)}<button class="link" type="submit">Mudar</button></form>` : esc(ROLES[m.role] || m.role)}</td>
      <td>${m.active ? 'Ativo' : '<span class="muted">Desativado</span>'}</td>
      <td>${fmtDate(m.last_login_at)}</td>
      ${admin ? `<td class="actions">${m.id === me.id ? '' : `
        ${m.active ? `<form method="post" action="/admin/membros/${m.id}/redefinir">${csrfField(csrf)}<button class="link" type="submit">Link de nova senha</button></form>` : ''}
        <form method="post" action="/admin/membros/${m.id}/${m.active ? 'desativar' : 'ativar'}">${csrfField(csrf)}<button class="link" type="submit">${m.active ? 'Desativar' : 'Reativar'}</button></form>
        <form method="post" action="/admin/membros/${m.id}/remover" data-confirm="Remover ${esc(m.name)} do painel? Essa ação não pode ser desfeita.">${csrfField(csrf)}<button class="link link--danger" type="submit">Remover</button></form>`}
      </td>` : ''}</tr>`).join('')}
    </tbody>
  </table></div>

  ${admin ? `<h2>Convidar usuário</h2>
  <form method="post" action="/admin/membros/convidar" class="inline-form">
    ${csrfField(csrf)}
    ${field({ name: 'email', label: 'E-mail', type: 'email', required: true, autocomplete: 'off' })}
    <div class="field"><label for="f-role">Papel</label>${roleSelect('role', 'editor', 'f-role')}</div>
    <button class="btn" type="submit">${mailEnabled ? 'Enviar convite' : 'Gerar link de convite'}</button>
  </form>
  ${mailEnabled ? '' : '<p class="muted">O envio de e-mail não está configurado, então o painel gera um link para você enviar por WhatsApp ou e-mail.</p>'}

  ${invites.length ? `<h2>Convites pendentes</h2>
  <ul class="list">${invites.map((i) => `<li><span>${esc(i.email)} <span class="tag">${esc(ROLES[i.role] || i.role)}</span> <span class="muted">expira em ${fmtDate(i.expires_at)}</span></span>
    <form method="post" action="/admin/membros/convites/cancelar">${csrfField(csrf)}<input type="hidden" name="email" value="${esc(i.email)}"><button class="link link--danger" type="submit">Cancelar</button></form></li>`).join('')}</ul>` : ''}` : '<p class="muted">Só administradores convidam, desativam ou removem usuários.</p>'}`;
};

export const profileView = ({ csrf, member, errors = {}, values = {} }) => `
  <section class="panel">
    <h2>Foto</h2>
    <div class="avatar-row">
      ${avatar(member, 'avatar--lg')}
      <form method="post" action="/admin/perfil/foto" enctype="multipart/form-data" class="stack">
        ${csrfField(csrf)}
        <div class="field${errors.photo ? ' field--error' : ''}"><label for="f-photo">Nova foto</label><input id="f-photo" type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" required>${errors.photo ? `<p class="field__error">${esc(errors.photo)}</p>` : '<p class="field__hint">JPG, PNG ou WebP. Ela é recortada em formato quadrado.</p>'}</div>
        <button class="btn btn--small" type="submit">Enviar foto</button>
      </form>
    </div>
    ${member.avatar ? `<form method="post" action="/admin/perfil/foto/remover">${csrfField(csrf)}<button class="link link--danger" type="submit">Remover foto</button></form>` : ''}
  </section>
  <section class="panel">
    <h2>Dados do perfil</h2>
    <form method="post" action="/admin/perfil" class="stack">
      ${csrfField(csrf)}
      ${field({ name: 'name', label: 'Nome', value: values.name ?? member.name, error: errors.name, autocomplete: 'name', required: true, attrs: 'maxlength="80"' })}
      <button class="btn" type="submit">Salvar</button>
    </form>
  </section>
  <section class="panel">
    <h2>E-mail de acesso</h2>
    <form method="post" action="/admin/perfil/email" class="stack">
      ${csrfField(csrf)}
      ${field({ name: 'email', label: 'Novo e-mail', type: 'email', value: values.email ?? member.email, error: errors.email, autocomplete: 'email', required: true })}
      ${field({ name: 'current', label: 'Senha atual', type: 'password', error: errors.emailCurrent, autocomplete: 'current-password', required: true, id: 'f-current-email' })}
      <button class="btn" type="submit">Alterar e-mail</button>
    </form>
  </section>
  <section class="panel">
    <h2>Senha</h2>
    <form method="post" action="/admin/perfil/senha" class="stack">
      ${csrfField(csrf)}
      <input type="email" name="username" value="${esc(member.email)}" autocomplete="username" hidden>
      ${field({ name: 'current', label: 'Senha atual', type: 'password', error: errors.current, autocomplete: 'current-password', required: true })}
      ${field({ name: 'password', label: 'Nova senha', type: 'password', error: errors.password, autocomplete: 'new-password', required: true, hint: 'Pelo menos 10 caracteres.' })}
      ${field({ name: 'password2', label: 'Repita a nova senha', type: 'password', error: errors.password2, autocomplete: 'new-password', required: true })}
      <button class="btn" type="submit">Alterar senha</button>
    </form>
  </section>`;

export const activityView = ({ rows }) => `<p class="lead">As 200 ações mais recentes no painel.</p>${activityList(rows)}`;

/* ---------- Leads ---------- */
const formLabel = (f) => (f === 'home' ? 'da página inicial' : f === 'contact' ? 'da página de contato' : f?.startsWith('area:') ? `da página da cidade ${f.slice(5)}` : `do site (${f || 'estimate'})`);
const statusTag = (st) => `<span class="status status--${st}">${STATUS[st]}</span>`;
const FILTER_KEYS = ['periodo', 'de', 'ate', 'status', 'origem', 'pagina_site', 'entrada', 'servico', 'busca', 'pagina'];
const qs = (f, extra = {}) => {
  const p = new URLSearchParams();
  const all = { ...f, ...extra };
  for (const k of FILTER_KEYS) {
    const val = all[k];
    if (val && !(k === 'pagina' && +val === 1) && !(k === 'periodo' && (val === '30' || val === 'datas'))) p.set(k, val);
  }
  const s = p.toString();
  return s ? `?${s}` : '';
};
const option = (value, label, current) => `<option value="${esc(value)}"${value === current ? ' selected' : ''}>${esc(label)}</option>`;
const sourceDetail = (l) => [l.utm_source, l.utm_medium, l.utm_campaign].filter(Boolean).join(' / ');
const fmtPhone = (p) => (/^\d{10}$/.test(p) ? `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}` : p);

export const leadsView = ({ f, total, rows, byStatus, pages: sitePages, services }) => {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const statusTotal = Object.entries(byStatus).filter(([k]) => k !== 'suspeito').reduce((a, [, b]) => a + b, 0);
  return `
  <form class="filters" method="get" action="/admin/leads">
    ${f.status ? `<input type="hidden" name="status" value="${esc(f.status)}">` : ''}
    <div class="field"><label for="f-periodo">Período</label>
      <select id="f-periodo" name="periodo" data-periodo>
        ${option('7', 'Últimos 7 dias', f.periodo)}${option('30', 'Últimos 30 dias', f.periodo)}${option('90', 'Últimos 90 dias', f.periodo)}${option('365', 'Últimos 12 meses', f.periodo)}${option('tudo', 'Desde o início', f.periodo)}${option('datas', 'Escolher datas', f.periodo)}
      </select></div>
    <div class="field field--dates"${f.periodo === 'datas' ? '' : ' hidden'} data-datas><label for="f-de">De</label><input id="f-de" type="date" name="de" value="${esc(f.de)}"></div>
    <div class="field field--dates"${f.periodo === 'datas' ? '' : ' hidden'} data-datas><label for="f-ate">Até</label><input id="f-ate" type="date" name="ate" value="${esc(f.ate)}"></div>
    <div class="field"><label for="f-pagina_site">Página do envio</label>
      <select id="f-pagina_site" name="pagina_site">${option('', 'Todas', f.pagina_site)}${sitePages.map((r) => option(r.page_path, `${r.page_path} (${r.n})`, f.pagina_site)).join('')}</select></div>
    <div class="field"><label for="f-servico">Serviço</label>
      <select id="f-servico" name="servico">${option('', 'Todos', f.servico)}${services.map((r) => option(r.service, `${r.service} (${r.n})`, f.servico)).join('')}</select></div>
    <div class="field"><label for="f-origem">Origem</label>
      <select id="f-origem" name="origem">${option('', 'Todas', f.origem)}${Object.entries(SOURCES).map(([k, label]) => option(k, label, f.origem)).join('')}</select></div>
    <div class="field"><label for="f-entrada">Página de entrada contém</label><input id="f-entrada" type="search" name="entrada" value="${esc(f.entrada)}" placeholder="ex.: /decking/ ou utm_campaign"></div>
    <div class="field field--grow"><label for="f-busca">Buscar</label><input id="f-busca" type="search" name="busca" value="${esc(f.busca)}" placeholder="Nome, e-mail, telefone ou cidade"></div>
    <button class="btn" type="submit">Filtrar</button>
    <a class="btn btn--ghost" href="/admin/leads">Limpar</a>
  </form>

  <nav class="tabs" aria-label="Status">
    <a href="/admin/leads${qs(f, { status: '', pagina: 1 })}"${!f.status ? ' aria-current="page"' : ''}>Todos <span>${statusTotal}</span></a>
    ${Object.entries(STATUS).map(([k, label]) => `<a href="/admin/leads${qs(f, { status: k, pagina: 1 })}"${f.status === k ? ' aria-current="page"' : ''}>${label} <span>${byStatus[k] || 0}</span></a>`).join('')}
  </nav>
  ${f.status === 'suspeito' ? '<p class="notice notice--warn">Quarentena: pedidos que passaram pelas travas básicas, mas têm sinais de spam (texto, links, país, fuso ou idioma). Não foram enviados ao webhook, e-mail nem Meta. Se algum for real, mude o status para Novo.</p>' : ''}

  <div class="toolbar">
    <p class="muted">${total === 1 ? '1 lead' : `${total} leads`}${pages > 1 ? `, página ${f.pagina} de ${pages}` : ''}</p>
    ${total ? `<a class="btn btn--small btn--ghost" href="/admin/leads/exportar${qs(f, { pagina: 1 })}">Exportar CSV (com estes filtros)</a>` : ''}
  </div>

  ${rows.length ? `<div class="table-wrap"><table class="table table--leads">
    <thead><tr><th>Data</th><th>Nome</th><th>Telefone</th><th>Serviço</th><th>Cidade</th><th>Página</th><th>Origem</th><th>Status</th></tr></thead>
    <tbody>${rows.map((l) => `<tr>
      <td>${fmtDate(l.created_at)}</td>
      <td><a href="/admin/leads/${l.id}">${esc(l.name)}</a><br><span class="muted small">${esc(l.email)}</span></td>
      <td>${esc(fmtPhone(l.phone))}</td>
      <td>${esc(l.service || '')}</td>
      <td>${esc(l.town || '')}</td>
      <td>${esc(l.page_path || '')}</td>
      <td>${SOURCES[l.source] || esc(l.source)}${sourceDetail(l) ? `<br><span class="muted small">${esc(sourceDetail(l))}</span>` : ''}</td>
      <td>${statusTag(l.status)}</td>
    </tr>`).join('')}</tbody>
  </table></div>` : '<p class="empty">Nenhum lead encontrado com esses filtros.</p>'}

  ${pages > 1 ? `<nav class="pager" aria-label="Páginas">
    ${f.pagina > 1 ? `<a href="/admin/leads${qs(f, { pagina: f.pagina - 1 })}">Anterior</a>` : '<span></span>'}
    ${f.pagina < pages ? `<a href="/admin/leads${qs(f, { pagina: f.pagina + 1 })}">Próxima</a>` : ''}
  </nav>` : ''}`;
};

const dl = (items) => `<dl class="dl">${items.filter(([, val]) => val).map(([k, val]) => `<dt>${k}</dt><dd>${val}</dd>`).join('')}</dl>`;
const linkOrText = (u) => (u ? (/^https?:/i.test(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u.length > 90 ? `${u.slice(0, 90)}...` : u)}</a>` : esc(u)) : '');

export const leadView = ({ csrf, lead: l, notes }) => `
  <p class="back"><a href="/admin/leads">Voltar para os leads</a></p>
  <div class="lead-head">
    <div>${statusTag(l.status)} <span class="muted">recebido em ${fmtDate(l.created_at)} pelo formulário ${esc(formLabel(l.form))}</span></div>
    <div class="lead-actions">
      <a class="btn btn--small" href="tel:+1${esc(l.phone)}">Ligar</a>
      <a class="btn btn--small btn--ghost" href="sms:+1${esc(l.phone)}">SMS</a>
      <a class="btn btn--small btn--ghost" href="mailto:${esc(l.email)}">Enviar e-mail</a>
    </div>
  </div>
  ${l.status === 'suspeito' ? `<p class="notice notice--warn">Em quarentena: ${esc(l.spam_reason || 'sinais de spam')}. Este lead não foi enviado ao webhook, e-mail nem Meta.</p>` : ''}

  <div class="lead-grid">
    <section class="panel">
      <h2>Pedido</h2>
      ${dl([
        ['Telefone', esc(fmtPhone(l.phone))], ['E-mail', esc(l.email)], ['Cidade ou ZIP', esc(l.town)], ['Serviço', esc(l.service)],
        ['Prazo', esc(l.timeframe)], ['Detalhes', l.message ? `<span class="pre">${esc(l.message)}</span>` : ''],
      ])}
    </section>

    <section class="panel">
      <h2>Origem</h2>
      ${dl([
        ['Origem', `<strong>${SOURCES[l.source] || esc(l.source)}</strong>`],
        ['utm_source', esc(l.utm_source)], ['utm_medium', esc(l.utm_medium)], ['utm_campaign', esc(l.utm_campaign)],
        ['utm_term', esc(l.utm_term)], ['utm_content', esc(l.utm_content)],
        ['Clique de anúncio', l.gclid ? 'Google (gclid)' : l.fbclid ? 'Meta (fbclid)' : ''],
        ['Veio de', linkOrText(l.referrer)], ['Página de entrada', linkOrText(l.landing_page)], ['Página do envio', linkOrText(l.page_url)],
      ])}
    </section>

    <section class="panel">
      <h2>Status</h2>
      <form method="post" action="/admin/leads/${l.id}/status" class="inline-form">
        ${csrfField(csrf)}
        <div class="field"><label for="f-status">Situação</label><select id="f-status" name="status">${Object.entries(STATUS).map(([k, label]) => option(k, label, l.status)).join('')}</select></div>
        <button class="btn" type="submit">Salvar</button>
      </form>
    </section>

    <section class="panel">
      <h2>Anotações</h2>
      <form method="post" action="/admin/leads/${l.id}/notas" class="stack">
        ${csrfField(csrf)}
        <div class="field"><label for="f-nota">Nova anotação</label><textarea id="f-nota" name="text" rows="3" maxlength="3000" required placeholder="Ex.: visita marcada para quinta às 10h."></textarea></div>
        <button class="btn" type="submit">Adicionar</button>
      </form>
      ${notes.length ? `<ul class="notes">${notes.map((n) => `<li><p class="pre">${esc(n.text)}</p><span class="muted small">${esc(n.member_name || 'Usuário removido')}, ${fmtDate(n.created_at)}${n.via !== 'painel' ? ` <span class="tag">via ${esc(n.via)}</span>` : ''}</span></li>`).join('')}</ul>` : ''}
    </section>
  </div>

  <section class="danger-zone">
    <h2>Excluir lead</h2>
    <p class="muted">Use quando a pessoa pedir a exclusão dos dados, ou para apagar spam. A exclusão é definitiva e remove também as anotações.</p>
    <form method="post" action="/admin/leads/${l.id}/excluir" data-confirm="Excluir definitivamente o lead ${esc(l.name)}? Essa ação não pode ser desfeita.">${csrfField(csrf)}<button class="btn btn--danger" type="submit">Excluir definitivamente</button></form>
  </section>`;

/* ---------- Blog ---------- */
const postStatusTag = (st) => `<span class="status status--${st === 'publicado' ? 'cliente' : 'descartado'}">${POST_STATUS[st]}</span>`;
const thumb = (id) => `/img/${esc(id)}-480.webp`;
const fmtDay = (d) => (d ? d.split('-').reverse().join('/') : '');

export const blogListView = ({ posts, status }) => `
  <div class="toolbar">
    <nav class="tabs" aria-label="Status">
      <a href="/admin/blog"${!status ? ' aria-current="page"' : ''}>Todos</a>
      ${Object.entries(POST_STATUS).map(([k, label]) => `<a href="/admin/blog?status=${k}"${status === k ? ' aria-current="page"' : ''}>${label}s</a>`).join('')}
    </nav>
    <div class="lead-actions"><a class="btn btn--small btn--ghost" href="/admin/imagens">Imagens</a><a class="btn btn--small" href="/admin/blog/novo">Novo artigo</a></div>
  </div>
  ${posts.length ? `<div class="table-wrap"><table class="table table--leads">
    <thead><tr><th>Artigo</th><th>Categoria</th><th>Publicado em</th><th>Status</th></tr></thead>
    <tbody>${posts.map((p) => `<tr>
      <td><span class="post-row">${p.cover ? `<img src="${thumb(p.cover)}" alt="" width="64" height="40" loading="lazy">` : '<span class="post-row__empty"></span>'}<span><a href="/admin/blog/${p.id}">${esc(p.title)}</a>${p.featured ? ' <span class="tag">destaque</span>' : ''}<br><span class="muted small">/blog/${esc(p.slug)}/</span></span></span></td>
      <td>${esc(p.category)}</td>
      <td>${fmtDay(p.published_date)}</td>
      <td>${postStatusTag(p.status)}${p.updated_via && p.updated_via !== 'painel' && p.updated_via !== 'importação' ? ` <span class="tag">via ${esc(p.updated_via)}</span>` : ''}</td>
    </tr>`).join('')}</tbody>
  </table></div>` : '<p class="empty">Nenhum artigo aqui ainda.</p>'}`;

const counter = (name, min, max) => `<span class="counter" data-count="${name}"${min ? ` data-min="${min}"` : ''} data-max="${max}"></span>`;

export const postEditView = ({ csrf, post, data, errors = {}, warnings = [], images, categories, services = [] }) => {
  const isNew = !post;
  const published = post?.status === 'publicado';
  const errList = Object.values(errors);
  return `
  <p class="back"><a href="/admin/blog">Voltar para o blog</a></p>
  ${errList.length ? `<div class="flash flash--erro" role="alert"><strong>Não foi possível salvar.</strong><ul>${errList.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
  ${warnings.length ? `<div class="notice notice--warn"><strong>Sugestões de revisão</strong><ul>${warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
  <form method="post" action="${isNew ? '/admin/blog/novo' : `/admin/blog/${post.id}`}" enctype="multipart/form-data" class="editor" data-editor>
    ${csrfField(csrf)}
    <div class="editor__main">
      ${field({ name: 'title', label: 'Título do artigo', value: data.title, error: errors.title, required: true, attrs: `maxlength="${LIMITS.title}" data-title` })}
      <div class="field${errors.body ? ' field--error' : ''}">
        <label for="f-body">Texto (Markdown)</label>
        <div class="md-toolbar" role="toolbar" aria-label="Formatação">
          <button type="button" data-md="h2" title="Subtítulo">Subtítulo</button>
          <button type="button" data-md="h3" title="Subtítulo menor">Subtítulo menor</button>
          <button type="button" data-md="bold" title="Negrito"><strong>N</strong></button>
          <button type="button" data-md="italic" title="Itálico"><em>I</em></button>
          <button type="button" data-md="link">Link</button>
          <button type="button" data-md="list">Lista</button>
          <button type="button" data-md="quote">Citação</button>
          <button type="button" data-md="image">Imagem</button>
          <button type="button" data-md="faq">FAQ (Frequently asked questions)</button>
        </div>
        <textarea id="f-body" name="body" rows="28" spellcheck="true" data-body>${esc(data.body)}</textarea>
        ${errors.body ? `<p class="field__error">${esc(errors.body)}</p>` : '<p class="field__hint">## para subtítulo, ### para subtítulo menor, **negrito**, [texto](https://link). Uma seção "## Frequently asked questions" com perguntas em ### vira resultado rico no Google. <span data-words></span></p>'}
      </div>
    </div>

    <aside class="editor__side">
      <section class="panel">
        <h2>Publicação</h2>
        <p>${post ? postStatusTag(post.status) : postStatusTag('rascunho')}${post?.published_date ? ` <span class="muted small">desde ${fmtDay(post.published_date)}</span>` : ''}</p>
        <div class="editor__actions">
          ${published
            ? '<button class="btn" type="submit" name="acao" value="publicar">Atualizar no site</button><button class="btn btn--ghost" type="submit" name="acao" value="despublicar">Despublicar</button>'
            : '<button class="btn" type="submit" name="acao" value="publicar">Publicar</button><button class="btn btn--ghost" type="submit" name="acao" value="salvar">Salvar rascunho</button>'}
          <button class="btn btn--ghost" type="submit" formaction="/admin/blog/previa" formtarget="_blank" formnovalidate>Pré-visualizar</button>
        </div>
        ${post ? `<p class="muted small">Última edição em ${fmtDate(post.updated_at)}${post.updated_via !== 'painel' ? ` via ${esc(post.updated_via)}` : ''}.</p>` : ''}
      </section>

      <section class="panel">
        <h2>Capa</h2>
        ${errors.cover ? `<p class="field__error">${esc(errors.cover)}</p>` : ''}
        <div class="cover-picker">
          ${data.cover ? `<img class="cover-picker__current" src="${thumb(data.cover)}" alt="" data-cover-preview>` : '<div class="cover-picker__current cover-picker__empty" data-cover-preview>Sem capa</div>'}
          <details>
            <summary>Escolher da biblioteca</summary>
            <div class="cover-grid">${images.map((im) => `<label class="cover-option"><input type="radio" name="cover" value="${esc(im.id)}"${im.id === data.cover ? ' checked' : ''}><img src="${thumb(im.id)}" alt="${esc(im.name)}" loading="lazy"></label>`).join('')}</div>
          </details>
          <div class="field"><label for="f-cover-file">Ou envie uma nova imagem</label><input id="f-cover-file" type="file" name="cover_file" accept="image/jpeg,image/png,image/webp,image/avif"><p class="field__hint">Horizontal, com pelo menos 1600 px de largura. Ela vira capa ao salvar.</p></div>
        </div>
        ${field({ name: 'cover_alt', label: 'Descrição da imagem', value: data.cover_alt, error: errors.cover_alt, hint: 'O que aparece na imagem, para leitores de tela e para o Google.' })}
      </section>

      <section class="panel">
        <h2>SEO</h2>
        <div class="field${errors.seo_title ? ' field--error' : ''}"><label for="f-seo_title">Título para o Google ${counter('seo_title', 0, LIMITS.seoTitle)}</label><input id="f-seo_title" name="seo_title" value="${esc(data.seo_title)}" maxlength="120">${errors.seo_title ? `<p class="field__error">${esc(errors.seo_title)}</p>` : ''}</div>
        <div class="field${errors.description ? ' field--error' : ''}"><label for="f-description">Descrição ${counter('description', LIMITS.descMin, LIMITS.descMax)}</label><textarea id="f-description" name="description" rows="4" maxlength="400">${esc(data.description)}</textarea>${errors.description ? `<p class="field__error">${esc(errors.description)}</p>` : '<p class="field__hint">Aparece abaixo do título no Google.</p>'}</div>
        ${field({ name: 'keyword', label: 'Palavra-chave principal', value: data.keyword, hint: 'O termo que a pessoa digita no Google.' })}
        <div class="field${errors.slug ? ' field--error' : ''}"><label for="f-slug">Endereço</label><div class="slug"><span>/blog/</span><input id="f-slug" name="slug" value="${esc(data.slug)}" data-slug${isNew ? ' data-auto' : ''}></div>${errors.slug ? `<p class="field__error">${esc(errors.slug)}</p>` : published ? '<p class="field__hint">Se mudar o endereço, o antigo redireciona para o novo.</p>' : ''}</div>
      </section>

      <section class="panel">
        <h2>Organização</h2>
        <div class="field${errors.category ? ' field--error' : ''}"><label for="f-category">Categoria</label><input id="f-category" name="category" value="${esc(data.category)}" list="categorias" maxlength="60">${errors.category ? `<p class="field__error">${esc(errors.category)}</p>` : ''}<datalist id="categorias">${categories.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></div>
        <div class="field${errors.service ? ' field--error' : ''}"><label for="f-service">Serviço relacionado</label><select id="f-service" name="service"><option value="">Nenhum</option>${services.map((sv) => `<option value="${esc(sv.slug)}"${sv.slug === data.service ? ' selected' : ''}>${esc(sv.data.name)}</option>`).join('')}</select><p class="field__hint">Aparece no quadro lateral do artigo, com link para a página do serviço.</p></div>
      </section>
    </aside>
  </form>
  ${post ? `<section class="danger-zone">
    <h2>Excluir artigo</h2>
    <p class="muted">${published ? 'O artigo sai do site e é apagado. Se só quiser tirá-lo do ar, use Despublicar.' : 'O rascunho é apagado definitivamente.'}</p>
    <form method="post" action="/admin/blog/${post.id}/excluir" data-confirm="Excluir definitivamente o artigo ${esc(post.title)}?">${csrfField(csrf)}<button class="btn btn--danger" type="submit">Excluir artigo</button></form>
  </section>` : ''}`;
};

export const imagesView = ({ csrf, images, error }) => `
  <p class="lead">Biblioteca usada pelas páginas, serviços, cidades e blog. Imagens em uso não podem ser excluídas.</p>
  <section class="panel panel--wide">
    <h2>Enviar imagem</h2>
    ${error ? `<p class="flash flash--erro" role="alert">${esc(error)}</p>` : ''}
    <form method="post" action="/admin/imagens" enctype="multipart/form-data" class="inline-form">
      ${csrfField(csrf)}
      <div class="field"><label for="f-file">Arquivo</label><input id="f-file" type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" required></div>
      <button class="btn" type="submit">Enviar</button>
    </form>
    <p class="muted small">O painel gera versões em WebP de vários tamanhos e uma versão para compartilhamento em redes sociais. Use fotos reais de obras, na horizontal, com pelo menos 800 px de largura e sem texto na imagem.</p>
  </section>
  <div class="image-grid">${images.map((im) => `<figure class="image-card">
    <img src="${thumb(im.id)}" alt="" loading="lazy">
    <figcaption>
      <span class="small">${esc(im.uploaded ? im.name || im.id : im.id)}${im.uploaded ? '' : ' <span class="tag">do site</span>'}</span>
      ${im.usedBy.length ? `<span class="muted small">Em uso: ${im.usedBy.map((p) => esc(p.title)).join(', ')}</span>` : '<span class="muted small">Sem uso</span>'}
      <span class="image-card__actions">
        <button class="link" type="button" data-copy-text="![Descreva a imagem](/img/${esc(im.id)}-1200.webp)">Copiar Markdown</button>
        ${im.uploaded && !im.usedBy.length ? `<form method="post" action="/admin/imagens/${esc(im.id)}/excluir" data-confirm="Excluir esta imagem?">${csrfField(csrf)}<button class="link link--danger" type="submit">Excluir</button></form>` : ''}
      </span>
    </figcaption>
  </figure>`).join('')}</div>`;

/* ---------- Integrações ---------- */
const KIND_LABEL = { meta_capi: 'Conversions API', webhook: 'Webhook', email: 'E-mail', instagram: 'Instagram' };
const mask = (v) => (v ? `configurado, termina em ${esc(v.slice(-4))}` : '');
const area = ({ name, label, value, hint, rows = 5, error }) => `<div class="field${error ? ' field--error' : ''}"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}" rows="${rows}" spellcheck="false" class="mono">${esc(value)}</textarea>${error ? `<p class="field__error">${esc(error)}</p>` : hint ? `<p class="field__hint">${hint}</p>` : ''}</div>`;

export const integrationsView = ({ csrf, c, errors = {}, log, mailEnabled, testResult, actions, metaEvents, instagram }) => `
  <p class="lead">Tudo o que for salvo aqui entra no site na hora. Tokens e segredos ficam só no servidor e nunca vão para o navegador.</p>
  ${Object.keys(errors).length ? `<div class="flash flash--erro" role="alert"><strong>Confira os campos:</strong><ul>${Object.values(errors).map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
  ${testResult ? `<p class="flash flash--${testResult.ok ? 'ok' : 'erro'}" role="status">${esc(testResult.text)}</p>` : ''}
  <form method="post" action="/admin/integracoes" class="form">
    ${csrfField(csrf)}
    <fieldset><legend>Meta (Facebook e Instagram)</legend>
      <div class="grid">
        ${field({ name: 'metaPixelId', label: 'ID do Pixel', value: c.metaPixelId, error: errors.metaPixelId, hint: 'Gerenciador de Eventos > Fontes de dados. Só números.', autocomplete: 'off' })}
        ${field({ name: 'metaTestEventCode', label: 'Código de evento de teste', value: c.metaTestEventCode, hint: 'Opcional. Use enquanto testa e apague depois, senão os eventos não contam nas campanhas.', autocomplete: 'off' })}
        <div class="field${errors.metaCapiToken ? ' field--error' : ''}"><label for="f-metaCapiToken">Token da Conversions API</label><input id="f-metaCapiToken" name="metaCapiToken" type="password" autocomplete="off" placeholder="${c.metaCapiToken ? 'Deixe vazio para manter o atual' : 'Cole o token gerado no Gerenciador de Eventos'}">${errors.metaCapiToken ? `<p class="field__error">${esc(errors.metaCapiToken)}</p>` : `<p class="field__hint">${c.metaCapiToken ? `Token ${mask(c.metaCapiToken)}. <label class="inline-check"><input type="checkbox" name="removeCapiToken"> remover</label>` : 'Envia o lead também pelo servidor, o que melhora a atribuição. O evento usa o mesmo ID do navegador, então o Meta não conta duas vezes.'}</p>`}</div>
      </div>
    </fieldset>

    <fieldset><legend>Google</legend>
      <div class="grid">
        ${field({ name: 'ga4Id', label: 'Google Analytics 4', value: c.ga4Id, error: errors.ga4Id, hint: 'Começa com G-.', autocomplete: 'off' })}
        ${field({ name: 'googleAdsId', label: 'Google Ads (tag de conversão)', value: c.googleAdsId, error: errors.googleAdsId, hint: 'Começa com AW-. Os rótulos de cada conversão ficam em Eventos, abaixo.', autocomplete: 'off' })}
        ${field({ name: 'gtmId', label: 'Google Tag Manager', value: c.gtmId, error: errors.gtmId, hint: 'Começa com GTM-. Todo evento também vai para o dataLayer (generate_lead, phone_click, email_click, financing_click).', autocomplete: 'off' })}
      </div>
    </fieldset>

    <fieldset><legend>Eventos e conversões</legend>
      <p class="field__hint">O que cada ação do visitante dispara. Deixe vazio para não disparar. No Meta, eventos fora da lista padrão viram evento personalizado.</p>
      <div class="table-wrap"><table class="table events-table">
        <thead><tr><th>Ação no site</th><th>Evento do Meta (Pixel e CAPI)</th><th>Evento do GA4</th><th>Rótulo de conversão do Google Ads</th></tr></thead>
        <tbody>${Object.entries(actions).map(([k, a]) => `<tr>
          <td>${esc(a.label)}</td>
          <td><input name="ev_${k}_meta" value="${esc(c.events[k].meta)}" list="meta-events" aria-label="Evento do Meta: ${esc(a.label)}"${errors[`ev_${k}_meta`] ? ' aria-invalid="true"' : ''}></td>
          <td><input name="ev_${k}_ga4" value="${esc(c.events[k].ga4)}" aria-label="Evento do GA4: ${esc(a.label)}"${errors[`ev_${k}_ga4`] ? ' aria-invalid="true"' : ''}></td>
          <td><input name="ev_${k}_adsLabel" value="${esc(c.events[k].adsLabel)}" placeholder="ex.: AbC-D_efG123" aria-label="Rótulo do Google Ads: ${esc(a.label)}"${errors[`ev_${k}_adsLabel`] ? ' aria-invalid="true"' : ''}></td>
        </tr>`).join('')}</tbody>
      </table></div>
      <datalist id="meta-events">${metaEvents.filter(Boolean).map((e) => `<option value="${e}">`).join('')}</datalist>
    </fieldset>

    <fieldset><legend>Novo lead</legend>
      <div class="grid">
        ${field({ name: 'notifyEmails', label: 'Avisar por e-mail', value: c.notifyEmails, error: errors.notifyEmails, hint: mailEnabled ? 'Um ou mais e-mails, separados por vírgula.' : 'O envio de e-mail (SMTP) ainda não está configurado no servidor, então o aviso não sai.', autocomplete: 'off' })}
        ${area({ name: 'webhookUrls', label: 'Webhooks (um por linha, até 5)', value: c.webhookUrls, rows: 3, error: errors.webhookUrls, hint: 'Cada lead é enviado em JSON, por POST, para todos os endereços (n8n, Make, Zapier, CRM).' })}
      </div>
    </fieldset>

    <fieldset><legend>Instagram (feed na página inicial)</legend>
      <div class="field"><label for="f-instagramToken">Token de longa duração</label><input id="f-instagramToken" name="instagramToken" type="password" autocomplete="off" placeholder="${c.instagramToken ? 'Deixe vazio para manter o atual' : 'Cole o token da API do Instagram'}">
      <p class="field__hint">${c.instagramToken ? `Token ${mask(c.instagramToken)}. ${instagram.lastSync ? `Última sincronização: ${fmtDate(new Date(instagram.lastSync).toISOString())}.` : 'Ainda não sincronizado.'} <label class="inline-check"><input type="checkbox" name="removeInstagramToken"> remover</label>` : 'Conta Business ou Creator; app com o produto "Instagram API with Instagram Login". O servidor busca as 8 últimas publicações a cada hora e renova o token sozinho.'}</p></div>
    </fieldset>

    <fieldset><legend>Privacidade e ambiente</legend>
      <label class="check-admin"><input type="checkbox" name="onlyProdHosts"${c.onlyProdHosts ? ' checked' : ''}> Carregar as tags só no domínio oficial (testes e pré-visualizações não contam visitas)</label>
      <label class="check-admin"><input type="checkbox" name="cookieBanner"${c.cookieBanner ? ' checked' : ''}> Mostrar aviso de cookies e só carregar as tags depois do aceite</label>
    </fieldset>

    <fieldset><legend>Scripts extras</legend>
      <p class="field__hint">Para ferramentas que não estão acima (por exemplo, TikTok, Nextdoor ou Microsoft Ads). Cole o código exatamente como a ferramenta fornece. Código errado aqui pode quebrar o site, então teste depois de salvar.</p>
      <div class="grid">
        ${area({ name: 'headScripts', label: 'No &lt;head&gt;', value: c.headScripts })}
        ${area({ name: 'bodyScripts', label: 'No fim do &lt;body&gt;', value: c.bodyScripts })}
      </div>
    </fieldset>
    <button class="btn" type="submit">Salvar e atualizar o site</button>
  </form>

  <h2>Testar</h2>
  <div class="test-row">
    <form method="post" action="/admin/integracoes/testar/meta_capi">${csrfField(csrf)}<button class="btn btn--small btn--ghost" type="submit"${c.metaPixelId && c.metaCapiToken ? '' : ' disabled'}>Testar Conversions API</button></form>
    <form method="post" action="/admin/integracoes/testar/webhook">${csrfField(csrf)}<button class="btn btn--small btn--ghost" type="submit"${c.webhookUrls ? '' : ' disabled'}>Testar webhooks</button></form>
    <form method="post" action="/admin/integracoes/testar/email">${csrfField(csrf)}<button class="btn btn--small btn--ghost" type="submit"${c.notifyEmails ? '' : ' disabled'}>Testar e-mail</button></form>
    <form method="post" action="/admin/integracoes/testar/instagram">${csrfField(csrf)}<button class="btn btn--small btn--ghost" type="submit"${c.instagramToken ? '' : ' disabled'}>Sincronizar Instagram agora</button></form>
  </div>
  <p class="muted small">Os testes usam um lead fictício e não entram na lista de leads.</p>

  ${c.webhookUrls ? `<h2>Segurança do webhook</h2>
  <div class="notice">
    <p>Cada envio leva o cabeçalho <code>X-Signature-256: sha256=...</code> (e <code>X-Painel-Assinatura</code>, igual), um HMAC SHA-256 do corpo com o segredo abaixo. Confira no destino para aceitar só envios do site.</p>
    <div class="copy"><input type="text" value="${esc(c.webhookSecret)}" readonly aria-label="Segredo do webhook"><button class="btn btn--small" type="button" data-copy>Copiar</button></div>
    <form method="post" action="/admin/integracoes/segredo" data-confirm="Gerar um novo segredo? O sistema que recebe o webhook vai precisar do novo valor.">${csrfField(csrf)}<button class="link" type="submit">Gerar novo segredo</button></form>
  </div>` : ''}

  <h2>Últimos envios</h2>
  ${log.length ? `<ul class="activity">${log.map((l) => `<li><time>${fmtDate(l.created_at)}</time><span><span class="status status--${l.ok ? 'cliente' : 'descartado'}">${l.ok ? 'ok' : 'falhou'}</span> <strong>${KIND_LABEL[l.kind] || esc(l.kind)}</strong>${l.lead_id ? ` <a href="/admin/leads/${l.lead_id}">lead nº ${l.lead_id}</a>` : ''}${l.test ? ' <span class="tag">teste</span>' : ''}: ${esc(l.detail)}</span></li>`).join('')}</ul>` : '<p class="muted">Nenhum envio registrado ainda.</p>'}`;

/* ---------- Conectar IA (MCP) ---------- */
/* Destinos de retorno conhecidos. Fora desta lista, a tela alerta: o nome do app é escolhido por quem o registrou. */
const KNOWN_HOSTS = /(^|\.)(claude\.ai|claude\.com|anthropic\.com|chatgpt\.com|openai\.com)$|^(localhost|127\.0\.0\.1)$/;

export const consentView = ({ csrf, pending, member }) => {
  const target = (() => { try { return new URL(pending.params.redirectUri); } catch { return null; } })();
  const host = target ? (/^https?:$/.test(target.protocol) ? target.hostname : target.protocol.replace(':', '')) : '';
  const known = target && (/^https?:$/.test(target.protocol) ? KNOWN_HOSTS.test(target.hostname) : /^(cursor|vscode|vscode-insiders|windsurf)$/.test(host));
  return `
  <section class="panel consent">
    <h2>${esc(pending.client.client_name || 'Um aplicativo')} quer acessar o painel</h2>
    <p class="consent__target${known ? '' : ' consent__target--warn'}">O acesso será entregue a <strong>${esc(host || 'destino desconhecido')}</strong>${known ? '.' : '. Este não é um endereço conhecido do Claude ou do ChatGPT. Só permita se foi você quem iniciou esta conexão agora e reconhece esse endereço.'}</p>
    <p>Ao permitir, esse aplicativo de IA poderá agir <strong>em seu nome (${esc(member.name)})</strong> no painel do site da ${esc(SITE.name)}:</p>
    <ul>
      <li>consultar e filtrar leads, mudar o status e fazer anotações;</li>
      <li>editar os textos das páginas, serviços, cidades, FAQ e avaliações;</li>
      <li>criar, editar, publicar e excluir artigos do blog e enviar imagens;</li>
      <li>ler e editar os dados da empresa;</li>
      <li>${member.role === 'admin' ? 'ver e ajustar IDs e eventos de Integrações (sem tokens, segredos, webhooks ou scripts)' : 'ver o que está configurado em Integrações, sem tokens nem segredos'}.</li>
    </ul>
    <p class="muted small">Exclusões pedem confirmação explícita e leads nunca podem ser excluídos pela IA. Tudo o que ela fizer aparece em Atividades com a marca "via mcp". Você pode desconectar quando quiser, em Conectar IA. Se você não pediu esta conexão, clique em Negar.</p>
    <div class="consent__actions">
      <form method="post" action="/admin/conectar/${esc(pending.id)}">${csrfField(csrf)}<input type="hidden" name="decisao" value="permitir"><button class="btn" type="submit">Permitir acesso</button></form>
      <form method="post" action="/admin/conectar/${esc(pending.id)}">${csrfField(csrf)}<input type="hidden" name="decisao" value="negar"><button class="btn btn--ghost" type="submit">Negar</button></form>
    </div>
  </section>`;
};

export const consentInvalidView = () => '<p>Este pedido de conexão expirou ou já foi respondido. Volte para o aplicativo de IA e tente conectar de novo.</p>';

export const iaView = ({ csrf, mcpUrl, tokens, apps, newToken }) => `
  <p class="lead">Conecte o Claude, o ChatGPT ou outra IA ao painel para fazer pelo chat tudo o que o painel faz: leads, textos das páginas, serviços, cidades, FAQ, avaliações, blog, imagens e dados da empresa. A IA age em seu nome, com as mesmas permissões do seu papel, e tudo fica em Atividades com a marca "via mcp".</p>

  <section class="panel panel--wide">
    <h2>Endereço do servidor MCP</h2>
    <div class="copy"><input type="text" value="${esc(mcpUrl)}" readonly aria-label="Endereço do MCP"><button class="btn btn--small" type="button" data-copy>Copiar</button></div>
    <details class="howto"><summary>Claude (claude.ai ou app)</summary><ol><li>Configurações > Conectores > Adicionar conector personalizado.</li><li>Cole o endereço acima e confirme.</li><li>Uma janela do painel abre: entre com seu e-mail e senha e clique em Permitir acesso.</li></ol></details>
    <details class="howto"><summary>ChatGPT</summary><ol><li>Configurações > Conectores (ou Apps) > Criar, no modo desenvolvedor.</li><li>Cole o endereço acima, escolha autenticação OAuth e salve.</li><li>Entre no painel na janela que abrir e permita o acesso.</li></ol></details>
    <details class="howto"><summary>Claude Code, Cursor e outros (token pessoal)</summary>
      <p>Gere um token abaixo e use no cabeçalho <code>Authorization: Bearer SEU_TOKEN</code>. No Claude Code:</p>
      <pre class="mono">claude mcp add --transport http ${esc(slugify(SITE.shortName))} ${esc(mcpUrl)} --header "Authorization: Bearer SEU_TOKEN"</pre>
    </details>
  </section>

  <section class="panel panel--wide">
    <h2>Seus tokens pessoais</h2>
    ${newToken ? `<div class="notice"><p><strong>Copie o token agora.</strong> Por segurança, ele não aparece de novo.</p><div class="copy"><input type="text" value="${esc(newToken)}" readonly aria-label="Novo token"><button class="btn btn--small" type="button" data-copy>Copiar</button></div></div>` : ''}
    <form method="post" action="/admin/ia/tokens" class="inline-form">
      ${csrfField(csrf)}
      ${field({ name: 'name', label: 'Nome do token', required: true, hint: 'Para lembrar onde ele é usado, por exemplo "Claude Code no notebook".', attrs: 'maxlength="60"' })}
      <button class="btn" type="submit">Gerar token</button>
    </form>
    ${tokens.length ? `<ul class="list">${tokens.map((t) => `<li><span><strong>${esc(t.name)}</strong> <span class="muted small">termina em ${esc(t.hint)}, criado em ${fmtDate(t.created_at)}, último uso: ${fmtDate(t.last_used_at)}</span></span>
      <form method="post" action="/admin/ia/tokens/${t.id}/revogar" data-confirm="Revogar o token ${esc(t.name)}?">${csrfField(csrf)}<button class="link link--danger" type="submit">Revogar</button></form></li>`).join('')}</ul>` : '<p class="muted">Nenhum token criado.</p>'}
  </section>

  <section class="panel panel--wide">
    <h2>Aplicativos conectados com a sua conta</h2>
    ${apps.length ? `<ul class="list">${apps.map((a) => `<li><span><strong>${esc(a.name)}</strong> <span class="muted small">conectado em ${fmtDate(a.created_at)}, último uso: ${fmtDate(a.last_used_at)}</span></span>
      <form method="post" action="/admin/ia/apps/${a.id}/desconectar" data-confirm="Desconectar ${esc(a.name)}?">${csrfField(csrf)}<button class="link link--danger" type="submit">Desconectar</button></form></li>`).join('')}</ul>` : '<p class="muted">Nenhum aplicativo conectado.</p>'}
  </section>`;

/* ---------- Content editor (generated from src/content/schema.mjs) ----------
   The client edits values only: the sections, their order and the layout are fixed in the site code. */
const BLANK_ROWS = 6;
const imgThumb = (id) => (id ? `<img class="img-pick__thumb" src="/img/${esc(id)}-480.webp" alt="" data-img-preview>` : '<span class="img-pick__thumb img-pick__empty" data-img-preview>Sem imagem</span>');

function inputFor(f, name, value, opts, error) {
  const id = `f-${name.replace(/\./g, '-')}`;
  const inv = error ? ' aria-invalid="true"' : '';
  const maxAttr = f.max ? ` maxlength="${f.max}"` : '';
  switch (f.type) {
    case 'textarea': return `<textarea id="${id}" name="${name}" rows="${String(value).length > 220 ? 6 : 3}"${maxAttr}${inv}>${esc(value)}</textarea>`;
    case 'markdown': return `<textarea id="${id}" name="${name}" rows="24" class="mono"${inv}>${esc(value)}</textarea>`;
    case 'checkbox': return `<label class="check-admin"><input type="checkbox" id="${id}" name="${name}"${value ? ' checked' : ''}> ${esc(f.label)}</label>`;
    case 'select': return `<select id="${id}" name="${name}"${inv}>${f.options.map((o) => `<option${o === value ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    case 'service': return `<select id="${id}" name="${name}"${inv}><option value="">Escolha</option>${opts.services.map((s) => `<option value="${esc(s.slug)}"${s.slug === value ? ' selected' : ''}>${esc(s.data.name)}${s.active ? '' : ' (desativado)'}</option>`).join('')}</select>`;
    case 'area': return `<select id="${id}" name="${name}"${inv}><option value="">Escolha</option>${opts.areas.map((a) => `<option value="${esc(a.slug)}"${a.slug === value ? ' selected' : ''}>${esc(a.data.label)}${a.active ? '' : ' (desativada)'}</option>`).join('')}</select>`;
    case 'image': return `<div class="img-pick">${imgThumb(value)}<select id="${id}" name="${name}" data-img-select${inv}><option value="">Sem imagem</option>${opts.images.map((im) => `<option value="${esc(im.id)}"${im.id === value ? ' selected' : ''}>${esc(im.uploaded ? `${im.name || im.id}` : im.id)}</option>`).join('')}</select></div>`;
    default: return `<input id="${id}" name="${name}" value="${esc(value)}"${maxAttr}${inv}>`;
  }
}

function fieldBlock(f, name, value, opts, errors) {
  const error = errors[name];
  const id = `f-${name.replace(/\./g, '-')}`;
  if (f.type === 'checkbox') return `<div class="field">${inputFor(f, name, value, opts)}</div>`;
  const count = f.max && (f.type === 'text' || f.type === 'textarea') ? ` <span class="counter" data-count="${name}" data-max="${f.max}"></span>` : '';
  return `<div class="field${error ? ' field--error' : ''}${f.type === 'markdown' ? ' field--wide' : ''}">
    <label for="${id}">${esc(f.label)}${f.required ? ' <span class="req">*</span>' : ''}${count}</label>
    ${inputFor(f, name, value ?? '', opts, error)}
    ${error ? `<p class="field__error">${esc(error)}</p>` : f.hint ? `<p class="field__hint">${esc(f.hint)}</p>` : ''}
  </div>`;
}

function listBlock(f, rows, opts, errors) {
  const max = f.max || 40;
  const blanks = Math.min(BLANK_ROWS, Math.max(0, max - rows.length));
  const row = (r, i, blank) => `<li class="list-row"${blank && i > rows.length ? ' hidden data-blank' : ''}>
      <div class="list-row__tools">
        <label class="list-row__order">Ordem <input type="number" name="${f.name}.${i}._order" value="${blank ? '' : i + 1}" min="1" step="1" aria-label="Posição"></label>
        ${blank ? '<span class="muted small">novo item</span>' : `<label class="inline-check"><input type="checkbox" name="${f.name}.${i}._remove"> remover</label>`}
      </div>
      <div class="list-row__fields">${f.fields.map((sf) => fieldBlock(sf, `${f.name}.${i}.${sf.name}`, r[sf.name] ?? '', opts, errors)).join('')}</div>
    </li>`;
  return `<div class="list-field">
    <p class="list-field__label">${esc(f.label)} <span class="muted small">(${rows.length}${f.max ? ` de no máximo ${f.max}` : ''})</span></p>
    <ol class="list-rows" data-list>
      ${rows.map((r, i) => row(r, i, false)).join('')}
      ${Array.from({ length: blanks }, (_, k) => row({}, rows.length + k, true)).join('')}
    </ol>
    ${blanks > 1 ? '<button class="btn btn--small btn--ghost" type="button" data-list-add>Adicionar mais um item</button>' : ''}
    <p class="field__hint">Para reordenar, troque os números de ordem. Para remover, marque "remover". Itens vazios são ignorados.</p>
  </div>`;
}

export function contentForm({ sections, data, errors = {}, opts }) {
  return sections.map((sec) => `<fieldset class="content-section"><legend>${esc(sec.label)}</legend>
    <div class="grid">${sec.fields.map((f) => (f.type === 'list' ? listBlock(f, data[f.name] || [], opts, errors) : fieldBlock(f, f.name, data[f.name], opts, errors))).join('')}</div>
  </fieldset>`).join('');
}

const errorSummary = (errors) => {
  const list = Object.values(errors);
  return list.length ? `<div class="flash flash--erro" role="alert"><strong>Não foi possível salvar.</strong><ul>${list.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>` : '';
};
const tokensHint = '<p class="muted small">Dica: nos textos, <code>**negrito**</code> e <code>[link](/contact-us/)</code> funcionam; <code>{{phone}}</code>, <code>{{email}}</code>, <code>{{rating}}</code> e <code>{{reviews}}</code> viram os dados atuais da empresa. Linha em branco separa parágrafos.</p>';

export const pagesListView = ({ pages }) => `
  <p class="lead">Edite os textos, listas e fotos de cada página. A estrutura (seções, ordem e visual) é fixa, para o site continuar consistente e bom para o Google.</p>
  <div class="table-wrap"><table class="table">
    <thead><tr><th>Página</th><th>Endereço</th><th>Última edição</th></tr></thead>
    <tbody>${pages.map((p) => `<tr><td><a href="/admin/paginas/${p.key}">${esc(p.label)}</a></td><td><a href="${esc(p.path)}" target="_blank" rel="noopener" class="muted small">${esc(p.path)}</a></td><td>${p.meta ? `${fmtDate(p.meta.updated_at)}${p.meta.updated_via !== 'painel' ? ` <span class="tag">via ${esc(p.meta.updated_via)}</span>` : ''}` : '<span class="muted">texto original</span>'}</td></tr>`).join('')}</tbody>
  </table></div>
  <p class="muted">Serviços, cidades, FAQ, avaliações e blog têm telas próprias no menu.</p>`;

export const pageEditView = ({ csrf, key, def, data, errors, opts, edited }) => `
  <p class="back"><a href="/admin/paginas">Voltar para as páginas</a> · <a href="${esc(def.path)}" target="_blank" rel="noopener">Ver no site</a></p>
  ${errorSummary(errors)}
  ${tokensHint}
  <form method="post" action="/admin/paginas/${key}" class="form content-form" data-editor-form>
    ${csrfField(csrf)}
    ${contentForm({ sections: def.sections, data, errors, opts })}
    <div class="sticky-actions"><button class="btn" type="submit">Salvar e atualizar o site</button></div>
  </form>
  ${edited ? `<section class="danger-zone"><h2>Restaurar textos originais</h2><p class="muted">Volta esta página ao conteúdo de fábrica (o do lançamento do site).</p>
  <form method="post" action="/admin/paginas/${key}/restaurar" data-confirm="Restaurar os textos originais desta página? As edições feitas serão perdidas.">${csrfField(csrf)}<button class="btn btn--danger" type="submit">Restaurar</button></form></section>` : ''}`;

/* Services and service areas share these screens. kind: { base: '/admin/servicos', noun, nounNew, sitePath(slug), labelOf(row) } */
const activeTag = (a) => `<span class="status status--${a ? 'cliente' : 'descartado'}">${a ? 'Ativo' : 'Desativado'}</span>`;

export const collectionListView = ({ csrf, kind, rows }) => `
  <div class="toolbar"><p class="lead">${kind.intro}</p><a class="btn btn--small" href="${kind.base}/novo">${esc(kind.nounNew)}</a></div>
  <div class="table-wrap"><table class="table">
    <thead><tr><th>Ordem</th><th>${esc(kind.noun)}</th><th>Endereço</th><th>Situação</th><th><span class="sr">Ações</span></th></tr></thead>
    <tbody>${rows.map((r, i) => `<tr>
      <td class="order-cell">
        <form method="post" action="${kind.base}/${r.id}/mover">${csrfField(csrf)}<input type="hidden" name="dir" value="up"><button class="link" type="submit"${i === 0 ? ' disabled' : ''} aria-label="Subir">↑</button></form>
        <form method="post" action="${kind.base}/${r.id}/mover">${csrfField(csrf)}<input type="hidden" name="dir" value="down"><button class="link" type="submit"${i === rows.length - 1 ? ' disabled' : ''} aria-label="Descer">↓</button></form>
      </td>
      <td><span class="post-row">${r.data.image ? `<img src="/img/${esc(r.data.image)}-480.webp" alt="" width="64" height="40" loading="lazy">` : '<span class="post-row__empty"></span>'}<a href="${kind.base}/${r.id}">${esc(kind.labelOf(r))}</a></span></td>
      <td><a class="muted small" href="${esc(kind.sitePath(r.slug))}" target="_blank" rel="noopener">${esc(kind.sitePath(r.slug))}</a></td>
      <td>${activeTag(r.active)}</td>
      <td class="actions"><form method="post" action="${kind.base}/${r.id}/${r.active ? 'desativar' : 'ativar'}">${csrfField(csrf)}<button class="link" type="submit">${r.active ? 'Desativar' : 'Ativar'}</button></form></td>
    </tr>`).join('')}</tbody>
  </table></div>`;

export const collectionEditView = ({ csrf, kind, row, slug, data, errors = {}, opts, faqs = [] }) => `
  <p class="back"><a href="${kind.base}">Voltar</a>${row ? ` · <a href="${esc(kind.sitePath(row.slug))}" target="_blank" rel="noopener">Ver no site</a>` : ''}</p>
  ${errorSummary(errors)}
  ${row && !row.active ? '<p class="notice notice--warn">Desativado: esta página não está no site. Ative na lista para publicá-la de novo.</p>' : ''}
  ${tokensHint}
  <form method="post" action="${row ? `${kind.base}/${row.id}` : `${kind.base}/novo`}" class="form content-form" data-editor-form>
    ${csrfField(csrf)}
    <fieldset class="content-section"><legend>Endereço</legend>
      <div class="field${errors.slug ? ' field--error' : ''}"><label for="f-slug">Endereço da página</label><div class="slug"><span>${esc(kind.sitePath('').replace(/\/$/, ''))}/</span><input id="f-slug" name="slug" value="${esc(slug)}"${row ? '' : ' data-auto'}></div>
      ${errors.slug ? `<p class="field__error">${esc(errors.slug)}</p>` : `<p class="field__hint">${row ? 'Se mudar, o endereço antigo redireciona para o novo (sem perder posição no Google).' : 'Gerado a partir do nome. Use palavras que as pessoas buscam.'}</p>`}</div>
    </fieldset>
    ${contentForm({ sections: kind.schema, data, errors, opts })}
    <div class="sticky-actions"><button class="btn" type="submit">${row ? 'Salvar e atualizar o site' : `Criar ${esc(kind.noun.toLowerCase())}`}</button></div>
  </form>
  ${row ? `<section class="panel panel--wide"><h2>Perguntas desta página</h2>
    ${faqs.length ? `<ul class="list">${faqs.map((f) => `<li><span>${esc(f.question)}${f.active ? '' : ' <span class="tag">oculta</span>'}</span><a href="/admin/faq/${f.id}">Editar</a></li>`).join('')}</ul>` : '<p class="muted">Nenhuma pergunta.</p>'}
    <p><a class="btn btn--small btn--ghost" href="/admin/faq/nova?topic=${encodeURIComponent(kind.faqTopic(row.slug))}">Adicionar pergunta</a></p></section>
  <section class="danger-zone"><h2>Excluir</h2><p class="muted">Apaga a página e as perguntas dela. O endereço antigo passa a levar para a página geral. Para só tirar do ar, use Desativar na lista.</p>
  <form method="post" action="${kind.base}/${row.id}/excluir" data-confirm="Excluir definitivamente ${esc(kind.labelOf(row))}?">${csrfField(csrf)}<button class="btn btn--danger" type="submit">Excluir</button></form></section>` : ''}`;

/* ---------- FAQ ---------- */
export const faqListView = ({ csrf, topics, faqs, topic }) => {
  const byTopic = topics.map((t) => ({ ...t, items: faqs.filter((f) => f.topic === t.key) })).filter((t) => !topic || t.key === topic);
  return `
  <div class="toolbar">
    <form method="get" action="/admin/faq" class="inline-form"><div class="field"><label for="f-topic">Tema</label><select id="f-topic" name="topic" data-autosubmit><option value="">Todos</option>${topics.map((t) => `<option value="${esc(t.key)}"${t.key === topic ? ' selected' : ''}>${esc(t.label)}</option>`).join('')}</select></div><button class="btn btn--small btn--ghost" type="submit">Ver</button></form>
    <a class="btn btn--small" href="/admin/faq/nova${topic ? `?topic=${encodeURIComponent(topic)}` : ''}">Nova pergunta</a>
  </div>
  <p class="muted">Geral e serviços aparecem na página FAQ; cada serviço e cidade mostra as suas; "início" marca as que aparecem na página inicial.</p>
  ${byTopic.map((t) => `<h2>${esc(t.label)} <span class="muted small">${t.items.length}</span></h2>
  ${t.items.length ? `<ul class="sortable">${t.items.map((f, i) => `<li>
    <span class="order-cell">
      <form method="post" action="/admin/faq/${f.id}/mover">${csrfField(csrf)}<input type="hidden" name="dir" value="up"><button class="link" type="submit"${i === 0 ? ' disabled' : ''} aria-label="Subir">↑</button></form>
      <form method="post" action="/admin/faq/${f.id}/mover">${csrfField(csrf)}<input type="hidden" name="dir" value="down"><button class="link" type="submit"${i === t.items.length - 1 ? ' disabled' : ''} aria-label="Descer">↓</button></form>
    </span>
    <a href="/admin/faq/${f.id}">${esc(f.question)}</a>
    ${f.home ? '<span class="tag">início</span>' : ''}${f.active ? '' : '<span class="tag">oculta</span>'}
  </li>`).join('')}</ul>` : '<p class="muted small">Nenhuma pergunta neste tema.</p>'}`).join('')}`;
};

export const faqEditView = ({ csrf, faq, data, errors = {}, topics }) => `
  <p class="back"><a href="/admin/faq">Voltar para o FAQ</a></p>
  ${errorSummary(errors)}
  <form method="post" action="${faq ? `/admin/faq/${faq.id}` : '/admin/faq/nova'}" class="form stack">
    ${csrfField(csrf)}
    <div class="field"><label for="f-topic">Tema</label><select id="f-topic" name="topic">${topics.map((t) => `<option value="${esc(t.key)}"${t.key === data.topic ? ' selected' : ''}>${esc(t.label)}</option>`).join('')}</select></div>
    ${field({ name: 'question', label: 'Pergunta', value: data.question, error: errors.question, required: true, attrs: 'maxlength="300"' })}
    <div class="field${errors.answer ? ' field--error' : ''}"><label for="f-answer">Resposta</label><textarea id="f-answer" name="answer" rows="5" maxlength="3000">${esc(data.answer)}</textarea>${errors.answer ? `<p class="field__error">${esc(errors.answer)}</p>` : '<p class="field__hint">Direta, em inglês. Links: [service areas](/service-areas/).</p>'}</div>
    <label class="check-admin"><input type="checkbox" name="active"${data.active ? ' checked' : ''}> Visível no site</label>
    <label class="check-admin"><input type="checkbox" name="home"${data.home ? ' checked' : ''}> Mostrar também na página inicial</label>
    <button class="btn" type="submit">Salvar e atualizar o site</button>
  </form>
  ${faq ? `<section class="danger-zone"><h2>Excluir pergunta</h2><form method="post" action="/admin/faq/${faq.id}/excluir" data-confirm="Excluir esta pergunta?">${csrfField(csrf)}<button class="btn btn--danger" type="submit">Excluir</button></form></section>` : ''}`;

/* ---------- Reviews ---------- */
export const reviewsListView = ({ csrf, reviews, areas }) => `
  <div class="toolbar"><p class="lead">Avaliações exibidas na página Reviews, na página inicial (as marcadas) e nas páginas de cidade (as ligadas a uma cidade). A nota e o total do Google ficam em Dados da empresa.</p><a class="btn btn--small" href="/admin/avaliacoes/nova">Nova avaliação</a></div>
  ${reviews.length ? `<ul class="sortable">${reviews.map((r, i) => `<li>
    <span class="order-cell">
      <form method="post" action="/admin/avaliacoes/${r.id}/mover">${csrfField(csrf)}<input type="hidden" name="dir" value="up"><button class="link" type="submit"${i === 0 ? ' disabled' : ''} aria-label="Subir">↑</button></form>
      <form method="post" action="/admin/avaliacoes/${r.id}/mover">${csrfField(csrf)}<input type="hidden" name="dir" value="down"><button class="link" type="submit"${i === reviews.length - 1 ? ' disabled' : ''} aria-label="Descer">↓</button></form>
    </span>
    <span><a href="/admin/avaliacoes/${r.id}"><strong>${esc(r.name)}</strong></a> <span class="muted small">${'★'.repeat(r.rating)} · ${esc(r.project)}</span><br><span class="small">“${esc(r.text.length > 140 ? `${r.text.slice(0, 140)}...` : r.text)}”</span></span>
    ${r.home ? '<span class="tag">início</span>' : ''}${r.area ? `<span class="tag">${esc(areas.find((a) => a.slug === r.area)?.data.label || r.area)}</span>` : ''}${r.active ? '' : '<span class="tag">oculta</span>'}
  </li>`).join('')}</ul>` : '<p class="empty">Nenhuma avaliação cadastrada.</p>'}`;

export const reviewEditView = ({ csrf, review, data, errors = {}, areas }) => `
  <p class="back"><a href="/admin/avaliacoes">Voltar para as avaliações</a></p>
  ${errorSummary(errors)}
  <form method="post" action="${review ? `/admin/avaliacoes/${review.id}` : '/admin/avaliacoes/nova'}" class="form stack">
    ${csrfField(csrf)}
    ${field({ name: 'name', label: 'Nome de quem avaliou', value: data.name, error: errors.name, required: true, attrs: 'maxlength="80"' })}
    ${field({ name: 'project', label: 'Projeto (aparece abaixo do nome)', value: data.project, hint: 'Ex.: Deck · Chatham', attrs: 'maxlength="120"' })}
    <div class="field${errors.text ? ' field--error' : ''}"><label for="f-text">Trecho da avaliação</label><textarea id="f-text" name="text" rows="4" maxlength="1500">${esc(data.text)}</textarea>${errors.text ? `<p class="field__error">${esc(errors.text)}</p>` : '<p class="field__hint">Copie o texto real do Google, sem alterar o sentido.</p>'}</div>
    <div class="field"><label for="f-rating">Estrelas</label><select id="f-rating" name="rating">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}"${n === Number(data.rating) ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="field"><label for="f-area">Cidade (opcional)</label><select id="f-area" name="area"><option value="">Nenhuma</option>${areas.map((a) => `<option value="${esc(a.slug)}"${a.slug === data.area ? ' selected' : ''}>${esc(a.data.label)}</option>`).join('')}</select><p class="field__hint">A primeira avaliação ligada a uma cidade aparece na página dela.</p></div>
    <label class="check-admin"><input type="checkbox" name="active"${data.active ? ' checked' : ''}> Visível no site</label>
    <label class="check-admin"><input type="checkbox" name="home"${data.home ? ' checked' : ''}> Mostrar na página inicial</label>
    <button class="btn" type="submit">Salvar e atualizar o site</button>
  </form>
  ${review ? `<section class="danger-zone"><h2>Excluir avaliação</h2><form method="post" action="/admin/avaliacoes/${review.id}/excluir" data-confirm="Excluir esta avaliação?">${csrfField(csrf)}<button class="btn btn--danger" type="submit">Excluir</button></form></section>` : ''}`;
