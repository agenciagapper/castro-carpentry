(() => {
  // Mobile nav
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const setNav = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setNav(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); toggle.focus(); }
  });

  // Year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Reveal on scroll
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll('.section-head, .svc, .review, .step, .badge, .split > *, .finance-card, .qa, .tile, .feature, .vstep, .svc-row, .rating-card');
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 4) * 60}ms`;
      io.observe(el);
    });
  }

  // Attribution: keep UTMs / click IDs from the landing page until the form is sent
  const ATTR_KEY = 'castro_attr';
  const ATTR_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(ATTR_KEY)) || {}; } catch { return {}; } },
    set(v) { try { localStorage.setItem(ATTR_KEY, JSON.stringify(v)); } catch { /* storage blocked */ } },
  };
  (() => {
    const qs = new URLSearchParams(location.search);
    const fresh = {};
    ATTR_FIELDS.forEach((k) => { if (qs.get(k)) fresh[k] = qs.get(k); });
    const saved = store.get();
    const expired = !saved.ts || Date.now() - saved.ts > 90 * 864e5;
    if (Object.keys(fresh).length || expired) {
      const ref = document.referrer && !document.referrer.includes(location.hostname) ? document.referrer : '';
      store.set({ ...fresh, landing_page: location.pathname + location.search, referrer: ref, ts: Date.now() });
    }
  })();

  // Events for analytics (no-ops until tracking.js is configured)
  const track = (name, params = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...params });
    if (typeof window.castroTrack === 'function') window.castroTrack(name, params);
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="tel:"], a[href^="mailto:"]');
    if (a) track(a.href.startsWith('tel:') ? 'phone_click' : 'email_click', { page: location.pathname });
  });

  // Instagram feed (written by _build/instagram-sync.php on the server)
  const ig = document.getElementById('instagram');
  if (ig) {
    fetch('/instagram/feed.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const items = (data && data.items) || [];
        if (items.length < 4) return;
        const grid = ig.querySelector('[data-ig-grid]');
        items.slice(0, 8).forEach((it) => {
          const a = document.createElement('a');
          a.className = 'ig__item';
          a.href = it.permalink;
          a.target = '_blank';
          a.rel = 'noopener';
          const img = document.createElement('img');
          img.src = it.image;
          img.alt = it.caption || 'Castro Finish Carpentry on Instagram';
          img.loading = 'lazy';
          img.width = 600; img.height = 600;
          a.appendChild(img);
          grid.appendChild(a);
        });
        ig.hidden = false;
      })
      .catch(() => {});
  }

  // Estimate form
  const form = document.getElementById('estimate-form');
  if (!form) return;
  const fill = () => {
    const attr = store.get();
    const set = (n, v) => { if (form.elements[n]) form.elements[n].value = v || ''; };
    ATTR_FIELDS.concat(['landing_page', 'referrer']).forEach((k) => set(k, attr[k]));
    set('page_url', location.pathname);
  };
  fill();

  // Anti-spam: a signed token from the server plus a small proof-of-work,
  // both prepared in the background once a person starts using the form.
  const set = (n, v) => { if (form.elements[n]) form.elements[n].value = v; };
  try { set('tz', Intl.DateTimeFormat().resolvedOptions().timeZone || ''); } catch { /* old browser */ }
  set('lang', navigator.language || '');
  const sha256 = async (txt) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  };
  let guard = null;
  const prepare = () => {
    if (!guard) {
      guard = fetch('/api/lead.php', { headers: { Accept: 'application/json' } })
        .then((r) => r.json())
        .then(async ({ token }) => {
          let n = 0;
          while (!(await sha256(`${token}:${n}`)).startsWith('000')) n += 1;
          set('form_token', token);
          set('pow', String(n));
        })
        .catch(() => { guard = null; });
    }
    return guard;
  };
  ['focusin', 'pointerdown', 'keydown'].forEach((ev) => form.addEventListener(ev, prepare, { once: true }));

  const status = form.querySelector('.form__status');
  const btn = form.querySelector('button[type="submit"]');
  const rules = {
    name: (v) => v.trim().length >= 2 || 'Please enter your name.',
    phone: (v) => /^1?[2-9]\d{2}[2-9]\d{6}$/.test(v.replace(/\D/g, '')) || 'Please enter a 10-digit US phone number.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email.',
    town: (v) => v.trim().length >= 2 || 'Which town or ZIP is the project in?',
    service: (v) => v !== '' || 'Please choose a service.',
  };

  const check = (field) => {
    const rule = rules[field.name];
    if (!rule) return true;
    const res = rule(field.value);
    const wrap = field.closest('.field');
    const err = document.getElementById(`${field.id}-err`);
    const ok = res === true;
    wrap.classList.toggle('is-invalid', !ok);
    field.setAttribute('aria-invalid', String(!ok));
    if (err) {
      err.textContent = ok ? '' : res;
      if (!ok) field.setAttribute('aria-describedby', err.id); else field.removeAttribute('aria-describedby');
    }
    return ok;
  };

  Object.keys(rules).forEach((n) => {
    const f = form.elements[n];
    f.addEventListener('blur', () => { if (f.value) check(f); });
    f.addEventListener('input', () => { if (f.closest('.field').classList.contains('is-invalid')) check(f); });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form__status';
    status.textContent = '';

    const fields = Object.keys(rules).map((n) => form.elements[n]);
    const invalid = fields.filter((f) => !check(f));
    if (invalid.length) { invalid[0].focus(); return; }
    fill();

    const label = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      await prepare();
      if (!form.elements.form_token.value) throw new Error('');
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        (data.fields || []).forEach((n) => { const f = form.elements[n]; if (f) { f.closest('.field')?.classList.add('is-invalid'); f.setAttribute('aria-invalid', 'true'); } });
        throw new Error(data.message || '');
      }
      track('generate_lead', { lead_type: 'estimate', service: form.elements.service.value, town: form.elements.town.value, page: location.pathname });
      form.reset();
      status.classList.add('is-ok');
      status.textContent = 'Thanks, we got your request and will be in touch shortly.';
      setTimeout(() => { location.href = '/thank-you/'; }, 600);
    } catch (err) {
      status.classList.add('is-err');
      status.textContent = (err && err.message) || 'Something went wrong sending your request. Please call (508) 566-1618.';
      guard = null; set('form_token', ''); set('pow', ''); prepare();
    } finally {
      btn.disabled = false;
      btn.innerHTML = label;
    }
  });
})();
