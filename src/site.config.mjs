// Fixed configuration of the site. Everything the client edits (contacts, page text, services, FAQ,
// reviews, blog) lives in the database and is edited in the panel; the values here are factory defaults.
export const SITE = {
  url: 'https://castrocarpentryinc.com', // On the server, PUBLIC_URL wins over this value.
  name: 'Castro Finish Carpentry',
  shortName: 'Castro',
  legalName: 'Castro Finish Carpentry Inc',
  description: 'Finish carpentry and exterior repairs on Cape Cod, MA: trim, siding, decks, windows and doors, roof repairs and ADUs.',
  locale: 'en_US',
  lang: 'en-US',
  timeZone: 'America/New_York', // used by the panel for dates and lead filters
  schemaType: 'HomeAndConstructionBusiness',
  founder: 'Estevam Castro',
  foundingDate: '2013',
  // Production hostnames: tracking tags only load on these.
  prodHosts: ['castrocarpentryinc.com', 'www.castrocarpentryinc.com'],
  formEndpoint: '/api/leads',
  year: new Date().getFullYear(),
};

/* Business data editable in the panel ("Dados da empresa"). These are the factory values. */
export const DEFAULT_BUSINESS = {
  phone: '(508) 566-1618',
  email: 'ecastrocarpentry@gmail.com',
  street: '15 Jan Sebastian Dr, Unit 4',
  city: 'Sandwich',
  state: 'MA',
  zip: '02563',
  mapsUrl: 'https://maps.app.goo.gl/t4gNrfsZBs1kw5et7',
  lat: '41.7187514',
  lng: '-70.4833347',
  instagram: 'castrocarpentry2024',
  googleReviewsUrl: 'https://www.google.com/search?q=Castro+Finish+Carpentry+Inc#lrd=0x88a81f1d101b294d:0x9cced1d130698f39,1',
  googleWriteReviewUrl: 'https://www.google.com/search?q=Castro+Finish+Carpentry+Inc#lrd=0x88a81f1d101b294d:0x9cced1d130698f39,3',
  reviewCount: '61',
  rating: '5.0',
  enhancifyPage: '9933241',
};

/* Lead form. Service options come from the active services (plus the extra options below). */
export const FORM = {
  extraServices: ['Other / not sure'],
  timeframes: ['As soon as possible', 'Within 1 to 3 months', '3+ months', 'Just planning'],
};

/* Anti-spam for the lead form (ported from the old api/lead.php). */
export const ANTISPAM = {
  minSeconds: 4,
  maxSeconds: 7200,
  powPrefix: '000',
  rateHour: 3,
  rateDay: 6,
  allowedCountries: ['US', 'CA'],
  allowedLangs: ['en', 'pt', 'es'],
  zipPrefix: '02', // ZIPs outside Massachusetts count as a foreign signal
};

/* Blog rules, applied in the panel and in the MCP. The writing guide for AIs is src/guia-de-estilo.md. */
export const CONTENT_RULES = {
  blockDashes: true, // an em or en dash blocks publishing
  warnExclamation: true,
  warnPraPro: false,
  warnAntithesis: false,
  faqHeading: 'Frequently asked questions',
};

/* Panel colors. */
export const THEME = {
  primary: '#004d93',
  accent: '#00305c',
  surface: '#f4f2ee',
  ink: '#1e1e1e',
};

/* Paths that services and areas can never use, because the site or server already owns them. */
export const RESERVED_SLUGS = ['admin', 'api', 'mcp', 'img', 'css', 'js', 'assets', 'blog', 'services', 'service-areas', 'about-us',
  'contact-us', 'financing-options', 'process', 'reviews', 'faq', 'terms-of-service-privacy-policy', 'thank-you', 'instagram',
  'authorize', 'token', 'register', 'revoke', 'home', 'index', 'sitemap', 'robots', 'llms', 'wp-admin', 'wp-content', 'well-known'];
