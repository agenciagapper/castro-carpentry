// Interações do painel: menu no celular, confirmação de ações destrutivas e botão de copiar.
document.addEventListener('click', (e) => {
  const menu = e.target.closest('[data-menu]');
  if (menu) {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  }
  const copy = e.target.closest('[data-copy]');
  if (copy) {
    const input = copy.parentElement.querySelector('input');
    input.select();
    navigator.clipboard?.writeText(input.value).then(() => {
      copy.textContent = 'Copiado';
      setTimeout(() => { copy.textContent = 'Copiar'; }, 2000);
    });
  }
});

document.addEventListener('submit', (e) => {
  const msg = e.target.dataset.confirm;
  if (msg && !confirm(msg)) e.preventDefault();
});

// Filtro de leads: mostra os campos de data só quando o período é "Escolher datas".
document.querySelector('[data-periodo]')?.addEventListener('change', (e) => {
  const custom = e.target.value === 'datas';
  document.querySelectorAll('[data-datas]').forEach((el) => { el.hidden = !custom; });
  if (!custom) document.querySelectorAll('[data-datas] input').forEach((i) => { i.value = ''; });
});

/* ---------- Editor de artigos ---------- */
const editor = document.querySelector('[data-editor]');
if (editor) {
  const body = editor.querySelector('[data-body]');
  const wrap = (before, after = before, placeholder = 'texto') => {
    const { selectionStart: a, selectionEnd: b, value } = body;
    const sel = value.slice(a, b) || placeholder;
    body.setRangeText(before + sel + after, a, b, 'end');
    body.setSelectionRange(a + before.length, a + before.length + sel.length);
    body.focus();
    body.dispatchEvent(new Event('input'));
  };
  const linePrefix = (prefix) => {
    const { selectionStart: a, value } = body;
    const start = value.lastIndexOf('\n', a - 1) + 1;
    body.setRangeText(prefix, start, start, 'end');
    body.focus();
    body.dispatchEvent(new Event('input'));
  };
  const insertBlock = (text) => {
    const { selectionStart: a, value } = body;
    const pre = a && value[a - 1] !== '\n' ? '\n\n' : '';
    body.setRangeText(`${pre}${text}\n`, a, body.selectionEnd, 'end');
    body.focus();
    body.dispatchEvent(new Event('input'));
  };
  const ACTIONS = {
    h2: () => linePrefix('## '),
    h3: () => linePrefix('### '),
    bold: () => wrap('**'),
    italic: () => wrap('*'),
    link: () => wrap('[', '](https://)', 'texto do link'),
    list: () => linePrefix('- '),
    quote: () => linePrefix('> '),
    image: () => insertBlock('![Descreva a imagem](/img/ID-DA-IMAGEM-1200.webp)\n\nCopie o código de uma imagem em Imagens.'),
    faq: () => insertBlock('## Frequently asked questions\n\n### First question?\n\nA direct answer in one or two paragraphs.\n\n### Second question?\n\nAnswer.'),
  };
  editor.querySelectorAll('[data-md]').forEach((b) => b.addEventListener('click', () => ACTIONS[b.dataset.md]()));

  // Contadores de caracteres
  editor.querySelectorAll('[data-count]').forEach((c) => {
    const input = editor.querySelector(`[name="${c.dataset.count}"]`);
    const min = Number(c.dataset.min || 0);
    const max = Number(c.dataset.max);
    const update = () => {
      const n = input.value.trim().length;
      c.textContent = min ? `${n} de ${min} a ${max}` : `${n} de ${max}`;
      c.classList.toggle('counter--bad', n > max || (n > 0 && n < min));
      c.classList.toggle('counter--ok', n >= min && n <= max && n > 0);
    };
    input.addEventListener('input', update);
    update();
  });

  // Palavras e tempo de leitura
  const words = editor.querySelector('[data-words]');
  const countWords = () => {
    if (!words) return;
    const n = body.value.replace(/[#*>\-[\]()!`]/g, ' ').split(/\s+/).filter(Boolean).length;
    words.textContent = `${n} palavras, cerca de ${Math.max(1, Math.round(n / 200))} min de leitura.`;
  };
  body.addEventListener('input', countWords);
  countWords();

  // Endereço automático a partir do título, enquanto o artigo é novo e o endereço não foi editado
  const slug = editor.querySelector('[data-slug]');
  const title = editor.querySelector('[data-title]');
  const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (slug?.hasAttribute('data-auto')) {
    slug.addEventListener('input', () => slug.removeAttribute('data-auto'));
    title.addEventListener('input', () => { if (slug.hasAttribute('data-auto')) slug.value = slugify(title.value); });
  }

  // Prévia da capa escolhida
  editor.querySelectorAll('input[name="cover"]').forEach((r) => r.addEventListener('change', () => {
    const preview = editor.querySelector('[data-cover-preview]');
    const img = document.createElement('img');
    img.className = 'cover-picker__current';
    img.dataset.coverPreview = '';
    img.src = `/img/${r.value}-480.webp`;
    img.alt = '';
    preview.replaceWith(img);
  }));

  // Aviso ao sair com alterações não salvas
  let dirty = false;
  editor.addEventListener('input', () => { dirty = true; });
  editor.addEventListener('submit', (e) => { if (!e.submitter?.formTarget) dirty = false; });
  window.addEventListener('beforeunload', (e) => { if (dirty) e.preventDefault(); });
}

/* Copiar texto (Markdown de imagens) */
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-copy-text]');
  if (!b) return;
  navigator.clipboard?.writeText(b.dataset.copyText).then(() => {
    const old = b.textContent;
    b.textContent = 'Copiado';
    setTimeout(() => { b.textContent = old; }, 2000);
  });
});

/* ---------- Content editor (pages, services, areas) ---------- */
// "Adicionar item" shows the next blank row of a list.
document.addEventListener('click', (e) => {
  const add = e.target.closest('[data-list-add]');
  if (!add) return;
  const list = add.parentElement.querySelector('[data-list]');
  const next = list.querySelector('li[hidden][data-blank]');
  if (next) { next.hidden = false; next.querySelector('input, textarea, select')?.focus(); }
  if (!list.querySelector('li[hidden][data-blank]')) add.hidden = true;
});

// Image picker preview
document.addEventListener('change', (e) => {
  const sel = e.target.closest('[data-img-select]');
  if (sel) {
    const old = sel.parentElement.querySelector('[data-img-preview]');
    let el;
    if (sel.value) { el = document.createElement('img'); el.className = 'img-pick__thumb'; el.src = `/img/${sel.value}-480.webp`; el.alt = ''; }
    else { el = document.createElement('span'); el.className = 'img-pick__thumb img-pick__empty'; el.textContent = 'Sem imagem'; }
    el.dataset.imgPreview = '';
    old.replaceWith(el);
  }
  if (e.target.matches('[data-autosubmit]')) e.target.form.submit();
});

// Character counters and unsaved-changes warning on content forms
document.querySelectorAll('[data-editor-form]').forEach((form) => {
  form.querySelectorAll('[data-count]').forEach((c) => {
    const input = form.querySelector(`[name="${c.dataset.count}"]`);
    if (!input) return;
    const max = Number(c.dataset.max);
    const update = () => { const n = input.value.trim().length; c.textContent = `${n} de ${max}`; c.classList.toggle('counter--bad', n > max); };
    input.addEventListener('input', update);
    update();
  });
  let dirty = false;
  form.addEventListener('input', () => { dirty = true; });
  form.addEventListener('submit', () => { dirty = false; });
  window.addEventListener('beforeunload', (e) => { if (dirty) e.preventDefault(); });
  // New service/area: address follows the name until edited
  const slug = form.querySelector('[name="slug"][data-auto]');
  const name = form.querySelector('[name="name"], [name="label"]');
  if (slug && name) {
    const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    slug.addEventListener('input', () => slug.removeAttribute('data-auto'));
    name.addEventListener('input', () => { if (slug.hasAttribute('data-auto')) slug.value = slugify(name.value); });
  }
});
