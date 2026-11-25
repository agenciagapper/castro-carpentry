/* Meta Pixel, GA4, Google Ads and Tag Manager, plus the optional cookie notice.
   Configuration comes from the panel (Integrações) as JSON in #site-tracking. Events per action are configurable there. */
(() => {
  const el = document.getElementById('site-tracking');
  const cfg = el ? JSON.parse(el.textContent) : null;
  const KEY = 'site_consent';
  const getConsent = () => { try { return localStorage.getItem(KEY); } catch (_) { return null; } };
  const setConsent = (v) => { try { localStorage.setItem(KEY, v); } catch (_) { /* private browsing */ } };
  let loaded = false;
  const queue = [];

  window.siteConsentState = () => (cfg && cfg.consent ? getConsent() || '' : 'granted');
  window.siteTrack = (action, data) => { if (!cfg) return; const fn = () => send(action, data || {}); if (loaded) fn(); else queue.push(fn); };
  if (!cfg) return;
  // Tags only run on the production domain, so tests and previews never count as visits or conversions.
  if (cfg.prodHosts && cfg.prodHosts.length && !cfg.prodHosts.includes(location.hostname)) return;

  const addScript = (src) => { const s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); };

  /* Extra scripts stored in <template> only run after consent. */
  const runTemplates = () => document.querySelectorAll('template[data-consent-scripts]').forEach((tpl) => {
    const frag = tpl.content.cloneNode(true);
    frag.querySelectorAll('script').forEach((old) => {
      const s = document.createElement('script');
      [...old.attributes].forEach((a) => s.setAttribute(a.name, a.value));
      s.textContent = old.textContent;
      old.replaceWith(s);
    });
    (tpl.dataset.consentScripts === 'head' ? document.head : document.body).appendChild(frag);
  });

  function load() {
    if (loaded) return;
    loaded = true;
    if (cfg.metaPixelId) {
      /* eslint-disable */
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      window.fbq('init', cfg.metaPixelId);
      window.fbq('track', 'PageView');
    }
    window.dataLayer = window.dataLayer || [];
    if (cfg.ga4Id || cfg.googleAdsId) {
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      if (cfg.ga4Id) window.gtag('config', cfg.ga4Id);
      if (cfg.googleAdsId) window.gtag('config', cfg.googleAdsId);
      addScript(`https://www.googletagmanager.com/gtag/js?id=${cfg.ga4Id || cfg.googleAdsId}`);
    }
    if (cfg.gtmId) {
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      addScript(`https://www.googletagmanager.com/gtm.js?id=${cfg.gtmId}`);
    }
    if (cfg.consent) runTemplates();
    queue.splice(0).forEach((fn) => fn());
  }

  /* action: lead | phone | email | financing. Each one has its Meta event, GA4 event and Google Ads conversion label. */
  function send(action, data) {
    const ev = (cfg.events || {})[action] || {};
    const opts = data.event_id ? { eventID: data.event_id } : undefined;
    if (ev.meta && window.fbq) {
      const standard = ['Lead', 'Contact', 'Schedule', 'SubmitApplication', 'CompleteRegistration', 'FindLocation', 'CustomizeProduct'].includes(ev.meta);
      window.fbq(standard ? 'track' : 'trackCustom', ev.meta, data.service ? { content_name: data.service } : {}, opts);
    }
    if (ev.ga4 && window.gtag) window.gtag('event', ev.ga4, { page: location.pathname, ...(data.service && { service: data.service }) });
    if (ev.adsLabel && cfg.googleAdsId && window.gtag) window.gtag('event', 'conversion', { send_to: `${cfg.googleAdsId}/${ev.adsLabel}`, ...(data.event_id && { transaction_id: data.event_id }) });
  }

  if (!cfg.consent) { load(); return; }

  /* Cookie notice */
  const ready = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());
  ready(() => {
    const banner = document.querySelector('[data-cookie-banner]');
    const choice = getConsent();
    if (choice === 'granted') load();
    else if (!choice && banner) banner.hidden = false;
    banner?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-consent]');
      if (!b) return;
      const before = getConsent();
      setConsent(b.dataset.consent);
      banner.hidden = true;
      if (b.dataset.consent === 'granted') load();
      else if (before === 'granted') location.reload();
    });
    document.querySelectorAll('[data-cookie-prefs]').forEach((b) => b.addEventListener('click', () => { if (banner) banner.hidden = false; }));
  });
})();
