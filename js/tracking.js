// Loads GA4, Google Ads and Meta Pixel only on production hosts.
// IDs come from TRACKING in _build/build.py (rendered as window.CASTRO_TRACKING).
(() => {
  const cfg = window.CASTRO_TRACKING || {};
  if (!(cfg.prod_hosts || []).includes(location.hostname)) return;

  const load = (src) => { const s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); };
  const gtagId = cfg.ga4 || cfg.ads;
  if (gtagId) {
    load(`https://www.googletagmanager.com/gtag/js?id=${gtagId}`);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    if (cfg.ga4) window.gtag('config', cfg.ga4);
    if (cfg.ads) window.gtag('config', cfg.ads);
  }
  if (cfg.meta_pixel) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', cfg.meta_pixel);
    window.fbq('track', 'PageView');
  }

  // Called by main.js for phone_click, email_click and generate_lead
  window.castroTrack = (name, params) => {
    if (window.gtag) {
      window.gtag('event', name, params);
      if (name === 'generate_lead' && cfg.ads && cfg.ads_lead_label) {
        window.gtag('event', 'conversion', { send_to: `${cfg.ads}/${cfg.ads_lead_label}` });
      }
    }
    if (window.fbq) {
      if (name === 'generate_lead') window.fbq('track', 'Lead', { content_name: params.service });
      if (name === 'phone_click') window.fbq('track', 'Contact');
    }
  };
})();
