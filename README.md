# Castro Finish Carpentry · site e painel

Site da **Castro Finish Carpentry Inc** (castrocarpentryinc.com), finish carpentry e reparos externos em Cape Cod, MA, com painel administrativo em `/admin`. Construído sobre o modelo `agenciagapper/painel-admin-template` (Node + Express + SQLite).

Detalhes técnicos e regras para quem desenvolve: [`CLAUDE.md`](CLAUDE.md).

## O que o cliente faz no painel

| Área | O que dá para fazer |
|---|---|
| **Páginas** | Editar textos, listas e fotos de Início, Sobre, Contato, Financiamento, Como funciona, Reviews, FAQ, Áreas atendidas, Blog, Privacidade, Obrigado e do topo/rodapé. A estrutura é fixa. |
| **Serviços** | Criar, editar, ativar/desativar, reordenar e excluir. Todo serviço usa o mesmo modelo de página. Ativos entram no menu, rodapé, página de serviços e formulário. Mudou o endereço? O antigo redireciona (301). |
| **Áreas atendidas** | O mesmo para as páginas de cidade. |
| **FAQ** | Perguntas por tema (geral, financiamento, cada serviço, cada cidade), ordenar, ocultar, mostrar na página inicial. |
| **Avaliações** | Cadastrar, editar, ordenar, ocultar, excluir; marcar para a página inicial ou ligar a uma cidade. |
| **Blog** | Escrever em Markdown, pré-visualizar, publicar/despublicar, ligar a um serviço. Regras de SEO e bloqueio de travessão. |
| **Imagens** | Enviar fotos (o painel gera WebP em vários tamanhos) e usar em qualquer página. |
| **Dados da empresa** | Telefone, e-mail, endereço, mapa, Instagram, nota e total de avaliações do Google, ID do Enhancify. |
| **Leads** | Lista com filtros por datas, página do envio, serviço, origem, página de entrada e busca; status, anotações, quarentena de spam e exportação CSV com os filtros. |
| **Integrações** (admin) | Meta Pixel + Conversions API, GA4, Google Ads, Tag Manager, eventos e conversões por ação, webhooks (até 5, assinados), aviso por e-mail, Instagram, aviso de cookies e scripts extras. |
| **Conectar IA (MCP)** | Claude, ChatGPT e outros fazem pelo chat o mesmo que o painel (OAuth ou token pessoal). |
| **Usuários** | Convite por link, papéis Administrador e Editor, desativar, remover, link de nova senha. |

## Rodar localmente

```bash
npm install
```

```bash
cp .env.example .env
```

Preencha `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env` e:

```bash
npm start
```

Site em http://localhost:3000 e painel em http://localhost:3000/admin. Antes de entregar:

```bash
npm test
```

## Publicar na Hostinger (Node.js Web App, planos Business ou Cloud)

Este projeto substitui o site estático + PHP. A hospedagem passa a ser um **Node.js Web App**:

1. Sites > Adicionar site > Node.js Web App > importar do GitHub (este repositório, branch `main`).
2. Predefinição **Express**, Node **22.x**, comando de construção `npm run build`, diretório de saída vazio, arquivo de entrada `server.js`.
3. Variáveis de ambiente, sem aspas:
   - `NODE_ENV=production`
   - `PUBLIC_URL=https://castrocarpentryinc.com`
   - `DATA_DIR=/home/uXXXXXXXXX/castro-data` (fora da pasta do app, senão o banco some a cada deploy)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` (10+ caracteres), `ADMIN_NAME`
   - opcional, para convites e aviso de lead por e-mail: `SMTP_HOST=smtp.hostinger.com`, `SMTP_PORT=465`, `SMTP_USER`, `SMTP_PASS`
4. Implante e confira no log: `Conteúdo ... importados`, `Site gerado: 29 páginas` e nenhum erro.
5. Teste de persistência: edite um texto, reimplante e confira se continua lá.
6. Apague `ADMIN_PASSWORD` das variáveis e convide os demais usuários pelo painel.
7. Em Integrações, cole o webhook (antes em `~/castro-config.json`), o e-mail de aviso e os IDs de Pixel/GA4/Ads. O token do Instagram (antes em `~/instagram-config.json`) também vai lá; o cron em PHP não é mais necessário.

Os endereços antigos continuam iguais (`/trim/`, `/decking/`, `/service-areas/...`) e os redirecionamentos do WordPress e do `.htaccess` agora estão no servidor (`server/redirects.mjs`).

## Pendências do conteúdo
- Atualizar o total de avaliações do Google em Dados da empresa.
- Foto do Estevam (Sobre e Início) e fotos de obras das cidades sem galeria.
- Publicar 1 a 2 artigos por mês no blog, cada um ligado a um serviço e a uma cidade.
