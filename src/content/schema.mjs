// Content schema: which fields the client can edit on each page, service and service area.
// The layout (sections, order, styling) is fixed in src/pages/*.mjs; the panel only edits the values below.
// Text can use {{phone}}, {{email}}, {{rating}} and {{reviews}}: they are replaced by the current business data.
// Field types: text, textarea (short "inline" Markdown: **bold** and [link](/url); blank line = new paragraph),
// markdown (full Markdown), image (id from the image library), select, service, area, list (repeatable items).

const T = (name, label, def = '', o = {}) => ({ type: 'text', name, label, default: def, ...o });
const A = (name, label, def = '', o = {}) => ({ type: 'textarea', name, label, default: def, ...o });
const I = (name, label, def = '', o = {}) => ({ type: 'image', name, label, default: def, ...o });
const L = (name, label, fields, def = [], o = {}) => ({ type: 'list', name, label, fields, default: def, ...o });
const S = (name, label, options, def = '', o = {}) => ({ type: 'select', name, label, options, default: def, ...o });

export const ICONS = ['shield', 'award', 'doc', 'clock', 'home', 'chat', 'tool', 'check', 'star', 'heart', 'wave', 'phone', 'mail', 'pin'];

const seo = (title, description) => ({ label: 'SEO (Google)', fields: [
  T('seo_title', 'Título para o Google', title, { max: 70, hint: 'Ideal até 60 caracteres.' }),
  A('seo_description', 'Descrição para o Google', description, { max: 200, hint: 'Ideal entre 140 e 160 caracteres.', plain: true }),
] });
const hero = (eyebrow, title, accent, lead, image, alt) => ({ label: 'Topo da página', fields: [
  T('hero_eyebrow', 'Linha acima do título', eyebrow),
  T('hero_title', 'Título', title, { required: true }),
  T('hero_accent', 'Destaque do título (2ª linha em itálico)', accent),
  A('hero_lead', 'Texto de apoio', lead),
  I('hero_image', 'Foto de fundo', image),
  T('hero_image_alt', 'Descrição da foto', alt),
] });
const head = (prefix, label, eyebrow, title, accent, lead) => ({ label, fields: [
  T(`${prefix}_eyebrow`, 'Linha acima do título', eyebrow),
  T(`${prefix}_title`, 'Título', title),
  T(`${prefix}_accent`, 'Destaque do título', accent),
  ...(lead !== undefined ? [A(`${prefix}_lead`, 'Texto de apoio', lead)] : []),
] });
const items = (rows) => rows.map(([title, text]) => ({ title, text }));
const checks = (rows) => rows.map((text) => ({ text }));
const TT = [{ type: 'text', name: 'title', label: 'Título' }, { type: 'textarea', name: 'text', label: 'Texto' }];
const TX = [{ type: 'textarea', name: 'text', label: 'Texto' }];

export const PAGES = {
  global: {
    label: 'Topo e rodapé (todas as páginas)', path: '/',
    sections: [
      { label: 'Barra superior e cabeçalho', fields: [
        T('topbar', 'Mensagem da barra superior', 'Free on-site estimates across Cape Cod · Financing available'),
        T('cta_label', 'Botão do cabeçalho', 'Free estimate'),
      ] },
      { label: 'Rodapé', fields: [
        T('footer_quote', 'Frase do rodapé', 'We don\'t just build with wood. We build with values.'),
        T('footer_signature', 'Assinatura da frase', 'Estevam Castro, founder'),
        T('footer_legal', 'Linha legal', 'Licensed & insured in MA · BBB accredited'),
      ] },
      { label: 'Faixa de chamada (fim das páginas)', fields: [
        T('cta_title', 'Título padrão', 'Ready to start your project?'),
        A('cta_text', 'Texto padrão', 'Tell us what you need and where the project is. We\'ll follow up quickly with a free, itemized estimate.'),
      ] },
      { label: 'Selos de confiança (início e Sobre)', fields: [
        L('badges', 'Selos', [S('icon', 'Ícone', ICONS), ...TT], [
          { icon: 'shield', title: 'Licensed & insured', text: 'Massachusetts HIC/CSL licensed. Certificate of insurance on request.' },
          { icon: 'award', title: 'BBB accredited', text: 'A Better Business Bureau accredited business.' },
          { icon: 'doc', title: 'Workmanship warranty', text: 'Terms depend on scope and materials and are explained in writing.' },
        ], { max: 6 }),
      ] },
      { label: 'Áreas atendidas (texto geral)', fields: [
        A('service_area_line', 'Frase sobre a região', 'Based in Sandwich, serving all of Cape Cod and Plymouth.'),
        L('other_towns', 'Outras cidades atendidas (sem página própria)', [T('name', 'Cidade')], []),
      ] },
    ],
  },

  home: {
    label: 'Início', path: '/',
    sections: [
      seo('Finish Carpenter on Cape Cod, MA | Castro Finish Carpentry', 'Cape Cod finish carpentry: trim, siding, decks, windows and doors, roof repairs and ADUs. Itemized estimates, clean job sites. Licensed & insured in MA.'),
      { label: 'Topo da página', fields: [
        T('hero_eyebrow', 'Linha acima do título', 'Finish carpentry & home repairs · Cape Cod, MA'),
        T('hero_title', 'Título', 'Cape Cod finish carpentry, done right.', { required: true }),
        T('hero_accent', 'Destaque do título', 'No stress. No surprises.'),
        A('hero_lead', 'Texto de apoio', 'Trim, siding, decks, windows and doors, and roofing repairs, with clear itemized estimates, a clean job site, and fast communication from start to finish.'),
        I('hero_image', 'Foto de fundo', 'hero-cape-house'),
        T('hero_image_alt', 'Descrição da foto', 'Cape Cod home with a new roof and front porch finished by Castro Finish Carpentry'),
        L('hero_trust', 'Selos abaixo dos botões (a nota do Google entra sozinha)', [S('icon', 'Ícone', ICONS), T('text', 'Texto')], [
          { icon: 'shield', text: 'Licensed & insured in MA' }, { icon: 'award', text: 'BBB accredited' },
        ], { max: 3 }),
      ] },
      { label: 'Números', fields: [
        T('years_num', 'Anos de empresa', '12+'),
        T('years_label', 'Legenda', 'Years on Cape Cod'),
      ] },
      { label: 'Seção "The Castro Standard"', fields: [
        T('standard_eyebrow', 'Linha acima do título', 'The Castro Standard'),
        T('standard_title', 'Título', 'One team for the details.'),
        T('standard_accent', 'Destaque do título', 'Your whole project handled.'),
        A('standard_lead', 'Texto', 'We\'re the go-to team for finish carpentry, exterior upgrades, and home repairs across Cape Cod. From a single rotted trim board to a full deck rebuild, the work is done carefully, the site stays protected, and you always know what\'s next.'),
        L('standard_points', 'Lista', TX, checks([
          '**Done right the first time.** Detail-driven work that looks great and holds up to salt air and Cape weather.',
          '**Clear estimates, no surprises.** Itemized scope and pricing before we start.',
          '**Clean work, fast communication.** Your home protected, daily cleanup, and updates you don\'t have to chase.',
          '**Reliable schedule.** We show up when we say and follow through to the final walkthrough.',
        ])),
        I('standard_img1', 'Foto 1', 'deck-cable-railing'), T('standard_img1_alt', 'Descrição da foto 1', 'Composite deck with black cable railing'),
        I('standard_img2', 'Foto 2', 'siding-white-colonial'), T('standard_img2_alt', 'Descrição da foto 2', 'White shingle colonial with black shutters'),
        I('standard_img3', 'Foto 3', 'roofing-porch-aerial'), T('standard_img3_alt', 'Descrição da foto 3', 'Aerial view of a finished roof over a porch'),
      ] },
      { label: 'Seção de serviços (os cards vêm de Serviços)', fields: [
        T('services_eyebrow', 'Linha acima do título', 'What we do'),
        T('services_title', 'Título', 'Full-service finish carpentry'),
        T('services_accent', 'Destaque do título', '& repairs, all in one place.'),
        A('services_lead', 'Texto', 'Small repairs to full upgrades, handled by one accountable team that knows Cape Cod homes.'),
        T('services_cta_title', 'Card final: título', 'Not sure what you need?'),
        A('services_cta_text', 'Card final: texto', 'Tell us what\'s going on and where the project is. We\'ll come take a look and give you a clear, itemized quote for free.'),
      ] },
      { label: 'Seção "Nossa história"', fields: [
        T('about_eyebrow', 'Linha acima do título', 'Our story'),
        T('about_title', 'Título', 'Built on values.'),
        T('about_accent', 'Destaque do título', 'Led by Estevam Castro.'),
        A('about_text', 'Texto', 'Castro Carpentry started in 2013 as a small family business, built day by day with hard work, faith, and dedication. Estevam is a husband, a father of two, and someone who genuinely loves the work.\n\nTo him, carpentry is about discipline and purpose: doing the job the right way and leaving something that lasts. That\'s why we solve the root problem instead of covering it up, respect your home and your routine, and take pride in the final look.'),
        T('about_quote', 'Citação', 'We don\'t just build with wood. We build with values.'),
        T('about_quote_by', 'Autor da citação', 'Estevam Castro, founder'),
        I('about_image', 'Foto', 'roofing-install-aerial'), T('about_image_alt', 'Descrição da foto', 'Castro crew installing a new roof on Cape Cod'),
        T('about_tag_name', 'Etiqueta da foto: nome', 'Estevam Castro'), T('about_tag_role', 'Etiqueta da foto: cargo', 'Founder · Since 2013'),
      ] },
      { label: 'Seção de avaliações (marque "mostrar no início" em Avaliações)', fields: [
        T('reviews_eyebrow', 'Linha acima do título', 'Reviews'),
        T('reviews_title', 'Título', 'What Cape Cod homeowners'),
        T('reviews_accent', 'Destaque do título', 'are saying.'),
      ] },
      { label: 'Seção "Como funciona"', fields: [
        T('process_eyebrow', 'Linha acima do título', 'How free estimates work'),
        T('process_title', 'Título', 'A predictable path'),
        T('process_accent', 'Destaque do título', 'from first call to final walkthrough.'),
        L('process_steps', 'Etapas', TT, items([
          ['Tell us what you need', 'Share the project and the town it\'s in by form, phone or email. Photos help.'],
          ['Quick follow-up', 'We get back to you fast to ask the right questions and set a time.'],
          ['On-site check', 'When needed, we visit to measure, check framing and hidden damage, and talk materials.'],
          ['Clear quote & next steps', 'An itemized estimate in writing, a realistic timeline, and no surprises once we start.'],
        ]), { max: 6 }),
      ] },
      { label: 'Seção de financiamento', fields: [
        T('fin_eyebrow', 'Linha acima do título', 'Project financing available'),
        T('fin_title', 'Título', 'Get it done now.'),
        T('fin_accent', 'Destaque do título', 'Pay over time.'),
        L('fin_points', 'Lista', TX, checks([
          'Check your options without affecting your credit score',
          'Fast approval, with funds in as little as 24 hours',
          'Affordable monthly payments, no prepayment penalties',
        ])),
        I('fin_image', 'Foto', 'roofing-drone'), T('fin_image_alt', 'Descrição da foto', 'Aerial view of a Cape Cod home with a new roof'),
      ] },
      { label: 'Seção do Instagram (aparece quando o Instagram está conectado em Integrações)', fields: [
        T('ig_eyebrow', 'Linha acima do título', 'On Instagram'),
        T('ig_title', 'Título', 'Fresh from'),
        T('ig_accent', 'Destaque do título', 'the job site.'),
      ] },
      head('areas', 'Seção de áreas atendidas', 'Where we work', 'From Sandwich', 'to Provincetown.', 'Our shop is in Sandwich, and we work across the Upper, Mid, Lower and Outer Cape, plus Plymouth.'),
      { label: 'Seção de perguntas (marque "mostrar no início" no FAQ)', fields: [
        T('faq_eyebrow', 'Linha acima do título', 'FAQ'),
        T('faq_title', 'Título', 'Common questions'),
        T('faq_accent', 'Destaque do título', 'before you call.'),
      ] },
      { label: 'Formulário de orçamento', fields: [
        T('estimate_eyebrow', 'Linha acima do título', 'Free estimate'),
        T('estimate_title', 'Título', 'Tell us about'),
        T('estimate_accent', 'Destaque do título', 'your project.'),
        A('estimate_lead', 'Texto', 'Share what you need and where the project is located. We\'ll follow up quickly with next steps.'),
        T('estimate_area', 'Linha de localização', 'Sandwich, MA · Serving all of Cape Cod'),
        T('form_title', 'Título do formulário', 'Get your free estimate'),
        T('form_button', 'Botão do formulário', 'Get my free estimate'),
        T('form_note', 'Nota abaixo do botão', 'No spam. We only use your info to respond to your request.'),
      ] },
    ],
  },

  services: {
    label: 'Serviços (página geral)', path: '/services/',
    sections: [
      seo('Carpentry Services on Cape Cod | Castro Finish Carpentry', 'Trim, siding, decks, windows and doors, roof repairs and ADUs across Cape Cod. One accountable team and clear, itemized estimates.'),
      hero('What we do', 'Full-service finish carpentry', '& repairs, all in one place.', 'From one rotted trim board to a full deck rebuild, one accountable team that knows Cape Cod homes and coastal weather.', 'hero-cape-house', 'Cape Cod home with new roof and porch'),
      { label: 'Seção "Every project"', fields: [
        T('std_eyebrow', 'Linha acima do título', 'Every project'),
        T('std_title', 'Título', 'Same standard,'),
        T('std_accent', 'Destaque do título', 'whatever the job.'),
        L('std_items', 'Itens', [S('icon', 'Ícone', ICONS), ...TT], [
          { icon: 'doc', title: 'Clear, itemized estimates', text: 'Scope and price in writing before we start.' },
          { icon: 'clock', title: 'Reliable schedule', text: 'We show up when we say and follow through.' },
          { icon: 'home', title: 'Protected home, daily cleanup', text: 'Your property and routine are respected.' },
          { icon: 'chat', title: 'Fast communication', text: 'Updates you don\'t have to chase.' },
          { icon: 'tool', title: 'Root problem solved', text: 'Rot and water issues fixed, not covered.' },
          { icon: 'shield', title: 'Licensed & insured', text: 'MA HIC/CSL licensed, BBB accredited.' },
        ], { max: 9 }),
      ] },
    ],
  },

  about: {
    label: 'Sobre', path: '/about-us/',
    sections: [
      seo('About Us | Castro Finish Carpentry, Sandwich MA', 'Castro Carpentry started in 2013 as a family business led by Estevam Castro. Licensed, insured and BBB accredited finish carpentry on Cape Cod.'),
      hero('Our story', 'Built on values.', 'Led by Estevam Castro.', 'A Cape Cod family business since 2013, built day by day with hard work, faith and dedication.', 'roofing-porch-aerial', 'Aerial view of a finished roof over a porch'),
      { label: 'História', fields: [
        T('story_eyebrow', 'Linha acima do título', 'Since 2013'),
        T('story_title', 'Título', 'Born from a dream.'),
        T('story_accent', 'Destaque do título', 'Built day by day.'),
        A('story_text', 'Texto', 'Castro Carpentry Inc. started in 2013 as a small family business. Over more than twelve years, the team has grown, but the way we work hasn\'t changed.\n\nEstevam Castro, our founder, is a husband, a father of two, and someone who genuinely loves the work. To him, carpentry is about discipline, purpose and leaving something that lasts.\n\nToday Castro is a solid, reliable and respected name across Cape Cod, known for transparency, reliability and precision. No shortcuts, no hidden costs, and work delivered on schedule.'),
        T('quote', 'Citação', 'We don\'t just build with wood. We build with values.'),
        T('quote_by', 'Autor da citação', 'Estevam Castro, founder'),
        I('portrait', 'Foto', 'roofing-install-aerial'), T('portrait_alt', 'Descrição da foto', 'Castro crew installing a new roof on Cape Cod'),
        T('portrait_name', 'Etiqueta da foto: nome', 'Estevam Castro'), T('portrait_role', 'Etiqueta da foto: cargo', 'Founder · Since 2013'),
        T('years_num', 'Anos de empresa', '12+'), T('years_label', 'Legenda', 'Years on Cape Cod'),
      ] },
      { label: 'O que nos diferencia', fields: [
        T('diff_eyebrow', 'Linha acima do título', 'The Castro Standard'),
        T('diff_title', 'Título', 'What makes Castro'),
        T('diff_accent', 'Destaque do título', 'different.'),
        L('diff_items', 'Itens', TT, items([
          ['Built for Cape Cod homes', 'Cedar shingle, salt air and nor\'easters. We know what these houses need.'],
          ['Craftsmanship you can see', 'Straight lines, tight joints and clean transitions.'],
          ['Clear estimates, no surprises', 'Itemized scope and pricing before we start.'],
          ['Clean, organized job sites', 'Your home protected and cleaned up daily.'],
          ['Reliable timeline', 'We keep the schedule and follow through.'],
          ['Fast, clear communication', 'You always know what\'s next.'],
          ['Licensed & insured', 'Massachusetts HIC/CSL licensed and fully insured.'],
          ['BBB accredited', 'A business you can check on.'],
        ]), { max: 12 }),
      ] },
      { label: 'Como trabalhamos', fields: [
        T('approach_eyebrow', 'Linha acima do título', 'Our approach'),
        T('approach_title', 'Título', 'How we work'),
        T('approach_accent', 'Destaque do título', 'on every job.'),
        A('approach_lead', 'Texto', 'Transparency, reliability and precision, from the first conversation to the final walkthrough.'),
        L('approach_steps', 'Etapas', TT, items([
          ['Guidance first', 'We explain your options before recommending anything.'],
          ['We solve the root problem', 'We trace rot and water damage to the source and fix it there.'],
          ['Respect for your home & routine', 'Protected surfaces, tidy site, considerate crew.'],
          ['Built for durability', 'Materials and details chosen to last on the coast.'],
          ['Pride in the final look', 'We\'re not done until it looks right.'],
        ]), { max: 8 }),
      ] },
      head('cred', 'Selos (os selos vêm de "Topo e rodapé")', 'Trusted experts', 'In professional hands,', 'start to finish.'),
      { label: 'Faixa de chamada', fields: [T('cta_title', 'Título', 'Let\'s talk about your project.')] },
    ],
  },

  process: {
    label: 'Como funciona', path: '/process/',
    sections: [
      seo('How Our Free Estimates Work | Castro Finish Carpentry', 'How Castro\'s free estimates and projects work: quick follow-up, on-site check, itemized quote, protected home, daily cleanup and a final walkthrough.'),
      hero('How it works', 'A predictable path', 'from first call to final walkthrough.', 'No guesswork, no surprises. Here\'s exactly what working with Castro looks like.', 'deck-cable-railing', 'Finished composite deck with cable railing'),
      { label: 'Etapas do orçamento', fields: [
        T('steps_eyebrow', 'Linha acima do título', 'Free estimates'),
        T('steps_title', 'Título', 'Four steps to'),
        T('steps_accent', 'Destaque do título', 'a clear quote.'),
        L('steps', 'Etapas', TT, items([
          ['Tell us what you need', 'Share the project and the town it\'s in by form, phone or email. Photos help us understand it faster.'],
          ['Quick follow-up', 'We get back to you fast to ask the right questions and set a time to come out.'],
          ['On-site check', 'When needed, we visit to measure, check framing and hidden damage, and talk through materials.'],
          ['Clear quote & next steps', 'You get an itemized estimate in writing, repair options where they apply, and a realistic timeline.'],
        ]), { max: 6 }),
      ] },
      { label: 'O que você recebe', fields: [
        T('receive_eyebrow', 'Linha acima do título', 'Your estimate'),
        T('receive_title', 'Título', 'What you receive'),
        T('receive_accent', 'Destaque do título', 'after the visit.'),
        A('receive_lead', 'Texto', 'Everything you need to make a confident decision and plan timing and budget.'),
        L('receive_points', 'Lista', TX, checks(['Photos and a clear explanation of what we found', 'Repair options where they apply: the best fix and a budget fix', 'An itemized estimate for labor and materials', 'A realistic timeline and what to expect on install day'])),
        I('receive_image', 'Foto', 'roofing-new-shingles-aerial'), T('receive_image_alt', 'Descrição da foto', 'Aerial view of a newly shingled roof'),
      ] },
      { label: 'Durante a obra', fields: [
        T('during_eyebrow', 'Linha acima do título', 'During the project'),
        T('during_title', 'Título', 'Professional work,'),
        T('during_accent', 'Destaque do título', 'clean site, clear updates.'),
        L('during', 'Itens', TT, items([
          ['Protected home', 'Surfaces covered, access planned and your routine respected.'],
          ['Daily cleanup', 'The site is left organized at the end of every day.'],
          ['Clear updates', 'You\'ll know what\'s happening and what\'s next without having to chase us.'],
          ['Root problems fixed', 'If we find hidden rot or water damage, we show you and explain options before moving on.'],
          ['Detail-driven finish', 'Tight joints, straight lines and clean transitions.'],
          ['Final walkthrough', 'We review the finished work together before we call it done.'],
        ]), { max: 9 }),
      ] },
      { label: 'Faixa de chamada', fields: [T('cta_title', 'Título', 'Start with step one.'), A('cta_text', 'Texto', 'Tell us what you need. It takes about two minutes.')] },
    ],
  },

  reviews: {
    label: 'Avaliações (página)', path: '/reviews/',
    sections: [
      seo('Reviews: {{rating}} Stars on Google | Castro Finish Carpentry', 'Castro Finish Carpentry is rated {{rating}} stars across {{reviews}} Google reviews from Cape Cod homeowners. Read what they say about trim, siding, deck and window work.'),
      hero('Reviews', 'What Cape Cod homeowners', 'are saying.', '{{rating}} stars across {{reviews}} Google reviews, from single repairs to full exterior projects.', 'siding-white-colonial', 'White shingle colonial with black shutters'),
      { label: 'Quadro da nota', fields: [
        T('card_title', 'Título', 'Real projects. Real neighbors.'),
        A('card_text', 'Texto', 'Every review comes from a homeowner we\'ve worked with. Read them all on Google, or leave one if we\'ve worked together.'),
      ] },
      { label: 'Faixa de chamada', fields: [T('cta_title', 'Título', 'Join our happy homeowners.')] },
    ],
  },

  financing: {
    label: 'Financiamento', path: '/financing-options/',
    sections: [
      seo('Home Improvement Financing | Castro Finish Carpentry', 'Finance trim, siding, deck, window and roof work on Cape Cod. Check options without affecting your credit, fast approval, no prepayment penalties.'),
      hero('Project financing available', 'Get it done now.', 'Pay over time.', 'Don\'t put off the repair or upgrade your home needs. Ask about affordable monthly plans when you request your estimate.', 'roofing-drone', 'Aerial view of a Cape Cod home with a new roof'),
      { label: 'Por que financiar', fields: [
        T('why_eyebrow', 'Linha acima do título', 'Why finance'),
        T('why_title', 'Título', 'Fix it before'),
        T('why_accent', 'Destaque do título', 'it gets worse.'),
        A('why_text', 'Texto', 'Rot, leaks and storm damage don\'t wait for the right time. They only get worse. Financing lets you take care of the work now and spread the cost into predictable monthly payments.'),
        L('why_points', 'Lista', TX, checks(['Check your options without affecting your credit score', 'Fast approval, with funds available in as little as 24 hours', 'Affordable monthly payments', 'No prepayment penalties'])),
        I('why_image', 'Foto', 'deck-black-railing'), T('why_image_alt', 'Descrição da foto', 'Grey deck with black railing and new stairs'),
      ] },
      head('apply', 'Simulador (Enhancify)', 'Check your options', 'See what you qualify for', 'in minutes.', 'Checking your options won\'t affect your credit score. Financing is provided through our partner Enhancify and its lenders, subject to approval.'),
      { label: 'Como funciona', fields: [
        T('steps_eyebrow', 'Linha acima do título', 'How it works'),
        T('steps_title', 'Título', 'Simple from'),
        T('steps_accent', 'Destaque do título', 'start to finish.'),
        L('steps', 'Etapas', TT, items([
          ['Get your estimate', 'We visit and give you a clear, itemized quote.'],
          ['Check your options', 'Use the form above or ask us about financing to see what plans are available to you.'],
          ['Start your project', 'Once approved, we get you on the schedule.'],
        ]), { max: 4 }),
      ] },
      { label: 'Perguntas (as perguntas ficam no FAQ, tema Financiamento)', fields: [
        T('faq_title', 'Título', 'Financing'), T('faq_accent', 'Destaque do título', 'questions.'),
      ] },
      { label: 'Faixa de chamada', fields: [T('cta_title', 'Título', 'Ask about financing with your free estimate.')] },
    ],
  },

  faq: {
    label: 'FAQ (página)', path: '/faq/',
    sections: [
      seo('FAQ: Estimates, Towns & Services | Castro Finish Carpentry', 'Answers about free estimates, the towns we serve, licensing, financing, and our trim, siding, deck, window, roofing and ADU work on Cape Cod.'),
      hero('FAQ', 'Common questions', 'before you call.', 'Straight answers about estimates, scheduling, materials and each of our services.', 'siding-cedar-gable', 'New cedar shingle siding on a gable'),
      { label: 'Faixa de chamada', fields: [T('cta_title', 'Título', 'Still have a question?'), A('cta_text', 'Texto', 'Call us or send a message, and we\'ll get back to you quickly.')] },
    ],
  },

  contact: {
    label: 'Contato', path: '/contact-us/',
    sections: [
      seo('Free Estimate & Contact | Castro Finish Carpentry', 'Request a free on-site estimate for trim, siding, decks, windows and doors, roof repairs or an ADU anywhere on Cape Cod. Call {{phone}}.'),
      hero('Free estimate', 'Tell us about', 'your project.', 'Share what you need and where the project is located. We\'ll follow up quickly with next steps.', 'hero-cape-house', 'Cape Cod home with a new roof and porch'),
      { label: 'Lateral', fields: [
        T('side_title', 'Título dos contatos', 'Prefer to talk?'),
        T('next_title', 'Título das etapas', 'What happens next'),
        L('next_steps', 'Etapas', TT, items([['Quick follow-up', 'We reach out to ask the right questions.'], ['On-site check', 'When needed, we come take a look.'], ['Clear quote', 'Itemized estimate and next steps.']]), { max: 4 }),
      ] },
    ],
  },

  areas: {
    label: 'Áreas atendidas (página geral)', path: '/service-areas/',
    sections: [
      seo('Service Areas: Cape Cod & Plymouth | Castro Finish Carpentry', 'Castro Finish Carpentry serves all of Cape Cod from Sandwich to Provincetown, plus Plymouth. Find your town: Dennis, Orleans, Chatham, Truro and more.'),
      hero('Service areas', 'Cape Cod carpentry,', 'from Sandwich to Provincetown.', 'Our shop is in Sandwich. We work across the Upper, Mid, Lower and Outer Cape, and over the bridge in Plymouth.', 'aerial-home-in-pines', 'Aerial view of a renovated Cape Cod home among pine trees'),
      head('towns', 'Cidades com página', 'Town by town', 'Where we', 'work most.', 'Each page covers the homes, weather and local rules we plan around in that town.'),
      { label: 'Outras cidades', fields: [T('also_title', 'Título', 'We also serve'), A('also_text', 'Texto', 'Not on the list? Tell us your town or ZIP and we\'ll confirm.')] },
    ],
  },

  blog: {
    label: 'Blog (página geral)', path: '/blog/',
    sections: [
      seo('Cape Cod Home Repair Blog | Castro Finish Carpentry', 'Practical advice for Cape Cod homeowners on exterior trim, cedar siding, decks, windows, roof repairs and ADUs, from a Sandwich, MA finish carpenter.'),
      hero('Blog', 'Cape Cod home repair,', 'explained.', 'Practical advice on trim, siding, decks, windows, roofs and ADUs for Cape Cod homes, from the team at Castro Finish Carpentry.', 'siding-white-colonial', 'White shingle colonial with black shutters'),
    ],
  },

  privacy: {
    label: 'Privacidade e termos', path: '/terms-of-service-privacy-policy/',
    sections: [
      seo('Privacy Policy & Terms | Castro Finish Carpentry', 'How Castro Finish Carpentry collects, uses and protects information from website visitors and estimate requests, and the terms for using this website.'),
      hero('Legal', 'Privacy policy', '& terms of service.', 'How we handle your information, and the terms for using this website.', 'siding-cedar-gable', 'Cedar shingle gable'),
      { label: 'Texto', fields: [{ type: 'markdown', name: 'body', label: 'Texto completo (Markdown)', default: '' }] },
    ],
  },

  thanks: {
    label: 'Obrigado (após o formulário)', path: '/thank-you/',
    sections: [
      { label: 'Texto', fields: [
        T('eyebrow', 'Linha acima do título', 'Request received'),
        T('title', 'Título', 'Thanks,'),
        T('accent', 'Destaque do título', 'we got your request.'),
        A('lead', 'Texto', 'We\'ll be in touch shortly to ask a few questions and set up your free estimate. If it\'s urgent, give us a call.'),
      ] },
    ],
  },
};

/* ---------- Services: every service page uses the same template ---------- */
export const SERVICE_SCHEMA = [
  { label: 'Nome e SEO', fields: [
    T('name', 'Nome do serviço', '', { required: true, hint: 'Ex.: Trim & finish carpentry. Aparece nos cards, no rodapé e no formulário.' }),
    T('short', 'Nome curto', '', { required: true, hint: 'Ex.: Trim. Aparece no menu.' }),
    T('seo_title', 'Título para o Google', '', { required: true, max: 70 }),
    A('seo_description', 'Descrição para o Google', '', { required: true, max: 200, plain: true }),
    A('summary', 'Resumo (cards e página de serviços)', '', { required: true }),
    { type: 'checkbox', name: 'home_card', label: 'Mostrar card na página inicial', default: '1' },
  ] },
  { label: 'Topo da página', fields: [
    T('h1', 'Título', '', { required: true }),
    T('h1_accent', 'Destaque do título', ''),
    A('lead', 'Texto de apoio', '', { required: true }),
    I('image', 'Foto principal', '', { required: true }),
    T('image_alt', 'Descrição da foto principal', '', { required: true }),
  ] },
  { label: 'Por que importa', fields: [
    T('why_title', 'Título', ''),
    T('why_accent', 'Destaque do título', ''),
    A('why', 'Texto', ''),
    L('points', 'Lista', TX),
    I('image2', 'Foto lateral', ''),
    T('image2_alt', 'Descrição da foto lateral', ''),
  ] },
  { label: 'O que fazemos', fields: [T('handle_title', 'Título', 'What we handle'), L('handle', 'Itens', TT)] },
  { label: 'Diferenciais e etapas', fields: [
    T('diff_title', 'Título dos diferenciais', 'The Castro difference'), L('diff', 'Diferenciais', TT),
    T('steps_title', 'Título das etapas', 'How it works'), L('steps', 'Etapas', TT),
    T('warning_title', 'Aviso: título (opcional)', ''), A('warning_text', 'Aviso: texto', ''),
  ] },
  { label: 'Galeria de obras', fields: [L('gallery', 'Fotos', [{ type: 'image', name: 'image', label: 'Foto' }, { type: 'text', name: 'caption', label: 'Legenda' }], [], { max: 12 })] },
];

/* ---------- Service areas (town pages): same template for every town ---------- */
export const AREA_SCHEMA = [
  { label: 'Cidade e SEO', fields: [
    T('label', 'Nome curto', '', { required: true, hint: 'Ex.: Sandwich. Aparece em links e títulos.' }),
    T('town', 'Nome usado no texto', '', { required: true, hint: 'Ex.: Provincetown and Truro.' }),
    T('region', 'Região', '', { hint: 'Upper Cape, Mid Cape, Lower Cape, Outer Cape ou South Shore.' }),
    T('seo_title', 'Título para o Google', '', { required: true, max: 70 }),
    A('seo_description', 'Descrição para o Google', '', { required: true, max: 200, plain: true }),
  ] },
  { label: 'Topo da página', fields: [
    T('h1', 'Título', '', { required: true }), T('h1_accent', 'Destaque do título', ''),
    A('lead', 'Texto de apoio', '', { required: true }),
    I('image', 'Foto', '', { required: true }), T('image_alt', 'Descrição da foto', '', { required: true }),
  ] },
  { label: 'Contexto local', fields: [
    T('context_title', 'Título', ''), T('context_accent', 'Destaque do título', ''),
    A('context', 'Texto (escreva sobre a cidade de verdade: o Google pune páginas copiadas)', ''),
    L('watch', 'O que olhamos primeiro nas casas daqui', TX),
    T('note_title', 'Observação local: título (opcional)', ''), A('note_text', 'Observação local: texto', ''),
  ] },
  { label: 'Serviços nesta cidade', fields: [L('services', 'Serviços', [{ type: 'service', name: 'service', label: 'Serviço' }, { type: 'textarea', name: 'text', label: 'Frase sobre o serviço nesta cidade' }])] },
  { label: 'Como funciona aqui', fields: [L('logistics', 'Itens', TT)] },
  { label: 'Obras na cidade', fields: [L('gallery', 'Fotos', [{ type: 'image', name: 'image', label: 'Foto' }, { type: 'text', name: 'caption', label: 'Legenda' }], [], { max: 12 })] },
  { label: 'Cidades vizinhas', fields: [L('nearby', 'Links para', [{ type: 'area', name: 'area', label: 'Cidade' }], [], { max: 6 })] },
];

/* Default values of a page: { field: default }. */
export const pageDefaults = (key) => Object.fromEntries(PAGES[key].sections.flatMap((s) => s.fields).map((f) => [f.name, structuredClone(f.default)]));
export const schemaDefaults = (schema) => Object.fromEntries(schema.flatMap((s) => s.fields).map((f) => [f.name, f.type === 'list' ? [] : '']));
