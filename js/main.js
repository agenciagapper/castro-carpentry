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

  // Estimate form
  const form = document.getElementById('estimate-form');
  if (!form) return;
  const status = form.querySelector('.form__status');
  const btn = form.querySelector('button[type="submit"]');
  const rules = {
    name: (v) => v.trim().length >= 2 || 'Please enter your name.',
    phone: (v) => v.replace(/\D/g, '').length >= 10 || 'Please enter a 10-digit phone number.',
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

    if (form.elements.access_key.value === 'YOUR_WEB3FORMS_ACCESS_KEY') {
      status.classList.add('is-err');
      status.textContent = 'Online requests are being set up. Please call (508) 566-1618 or email ecastrocarpentry@gmail.com.';
      return;
    }

    const label = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || 'Request failed');
      form.reset();
      status.classList.add('is-ok');
      status.textContent = 'Thanks — we got your request and will be in touch shortly.';
    } catch {
      status.classList.add('is-err');
      status.textContent = 'Something went wrong sending your request. Please call (508) 566-1618.';
    } finally {
      btn.disabled = false;
      btn.innerHTML = label;
    }
  });
})();
