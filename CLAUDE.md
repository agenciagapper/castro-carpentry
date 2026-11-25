# Castro Finish Carpentry · site + painel

Site da Castro Finish Carpentry (castrocarpentryinc.com, Cape Cod, MA) com painel administrativo. Baseado no modelo `agenciagapper/painel-admin-template`: HTML gerado em Node sem framework (`dist/`), servido por Express, que também hospeda o painel em `/admin` e o MCP em `/mcp`. Banco SQLite nativo (`node:sqlite`, Node 22.13+). Hospedagem: Node.js Web App da Hostinger.

O site é em inglês; o painel e esta documentação, em português.

## Comandos
- `npm start`: site + painel em http://localhost:3000 (lê `.env`). Na primeira subida importa todo o conteúdo para o banco e gera o `dist/`; depois, gera de novo a cada edição.
- `npm test`: 110 verificações de ponta a ponta (site, redirecionamentos, papéis, páginas, serviços, cidades, FAQ, avaliações, leads e antispam, blog, integrações, MCP, OAuth). Rode antes de cada entrega.
- `npm run build`: gera `dist/` só com o conteúdo de fábrica (sem banco).
- `npm run images`: `src/img-src/*.jpg` vira WebP responsivo (480 a 1600 px) + JPG 1200x630 em `public/img/`, e atualiza `src/img-manifest.json`.
- `npm run admin:criar -- email "Nome"`: cria um usuário (ou redefine a senha) pelo terminal.

## Regra principal: o cliente edita conteúdo, não estrutura
- `src/content/schema.mjs` define, para cada página, serviço e cidade, quais campos existem (texto, texto curto com Markdown, lista, imagem). O painel e o MCP geram os formulários a partir dele e validam tudo por ele.
- `src/pages/main.mjs` e `src/pages/blog.mjs` têm o layout fixo e só leem os campos. Mudou o visual ou uma seção? Mude aqui e no esquema, nunca deixe o cliente montar layout.
- Campo novo: acrescente ao esquema com `default` (o valor atual do site) e use-o na página. Os dados salvos continuam válidos porque `getPage()` mistura padrão + banco.
- Títulos têm duas partes (`*_title` + `*_accent`); o renderer monta o `<span class="accent">`. Nenhum campo aceita HTML: tudo passa por `t()`/`md()` em `src/lib.mjs`.
- Textos aceitam `{{phone}}`, `{{email}}`, `{{rating}}`, `{{reviews}}` e `{{business}}` (dados atuais da empresa).

## Estrutura
- `src/site.config.mjs`: o que é fixo (nome, fuso, hosts de produção, opções do formulário, antispam, endereços reservados) e os dados de fábrica da empresa.
- `src/content/seed/*.json` e `src/blog/posts/*.md`: conteúdo de fábrica, importado para o banco só na primeira subida (`seedContent`, `seedPostsFromMarkdown`).
- `src/build-site.mjs`: `buildSite(ctx)` gera páginas, sitemap, robots (com crawlers de IA liberados), `llms.txt` e RSS em `dist.tmp/` e troca pelo `dist/` no fim.
- `server/content.mjs`: páginas, serviços, cidades (motor `collection()` com renomear = 301, desativar, ordenar, excluir), FAQ, avaliações e dados da empresa.
- `server/leads.mjs`: `/api/leads` com o antispam do antigo `lead.php` (iscas, token assinado com tempo mínimo e uso único, prova de trabalho, limite por conexão, telefone americano, filtros de conteúdo e de sinais estrangeiros). Spam evidente é descartado com resposta falsa de sucesso; casos duvidosos ficam com status `suspeito` (quarentena) e não vão para webhook, e-mail nem Meta.
- `server/integrations.mjs`: Pixel/GA4/Ads/GTM com eventos configuráveis por ação (lead, phone, email, financing), Conversions API, até 5 webhooks assinados (HMAC), aviso por e-mail e sincronização do Instagram (de hora em hora, substitui o cron em PHP).
- `server/redirects.mjs`: o que o antigo `.htaccess` fazia (www, URLs do WordPress, `.html`, 410 para sondas).
- `server/mcp.mjs`: MCP com as funções do painel. Leads nunca são excluídos pela IA; exclusões pedem `confirmar=true`; webhooks, e-mails de aviso, scripts e tokens só mudam no painel; a IA herda o papel do usuário.
- `server/auth.mjs`: papéis `admin` (tudo) e `editor` (conteúdo, blog, imagens e leads).
- Migrações em `server/db.mjs`: acrescente ao fim do array, nunca edite uma já publicada.

## Contrato do formulário
`estimateForm()` (`src/lib.mjs`) envia para `/api/leads`: `name`, `phone`, `email`, `town`, `service` (um dos serviços ativos ou "Other / not sure"), `timeframe`, `message`, `form`, campos de origem (`page_url`, `landing_page`, `referrer`, UTMs, `gclid`, `fbclid`, `fbp`, `fbc`, `event_id`, `consent`), iscas (`website`, `company`, `fax`, `botcheck`) e `form_token`/`pow`/`tz`/`lang`. `src/js/main.js` busca o token em `/api/leads/token` e resolve a prova de trabalho.

## Variáveis de ambiente (ver `.env.example`)
`PUBLIC_URL`, `DATA_DIR` (fora da pasta do app), `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` (primeiro admin) e `SMTP_*` (opcional).
