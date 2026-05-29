# Deploy — Radar do Lucro

Como publicar a página em cada plataforma. Todas as opções são gratuitas ou de baixo custo.

---

## Opção 1 — Netlify (recomendado — mais fácil)

### Drag & drop (sem conta GitHub)
1. Acesse [netlify.com](https://netlify.com) e crie uma conta gratuita
2. No painel, clique em **"Add new site" → "Deploy manually"**
3. Arraste a pasta `radar-do-lucro/` para a área indicada
4. Pronto — você recebe uma URL pública em segundos

### Via CLI
```bash
npm install -g netlify-cli
netlify deploy --dir . --prod
```

### Domínio personalizado
No painel da Netlify: **Site settings → Domain management → Add custom domain**

---

## Opção 2 — Vercel

```bash
npm install -g vercel
cd radar-do-lucro
vercel --prod
```

Ou conecte o repositório GitHub em [vercel.com](https://vercel.com) para deploy automático a cada push.

---

## Opção 3 — GitHub Pages

1. Crie um repositório no GitHub (ex: `radar-do-lucro`)
2. Faça push dos arquivos:
```bash
git init
git add .
git commit -m "inicial"
git remote add origin https://github.com/SEU_USUARIO/radar-do-lucro.git
git push -u origin main
```
3. No repositório → **Settings → Pages → Source: main branch / root**
4. URL pública: `https://SEU_USUARIO.github.io/radar-do-lucro`

---

## Opção 4 — Cloudflare Pages

1. Acesse [pages.cloudflare.com](https://pages.cloudflare.com)
2. **Create a project → Upload assets**
3. Arraste a pasta ou conecte o repositório GitHub
4. Deploy automático, CDN global, HTTPS incluído

---

## Opção 5 — Amazon S3 (Static Website)

```bash
# Instale o AWS CLI e configure suas credenciais
aws s3 mb s3://radar-do-lucro
aws s3 website s3://radar-do-lucro --index-document index.html
aws s3 sync . s3://radar-do-lucro --acl public-read
```

URL pública: `http://radar-do-lucro.s3-website-us-east-1.amazonaws.com`

Para HTTPS e domínio personalizado, use o CloudFront na frente.

---

## Opção 6 — Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Selecione a pasta atual como public directory
firebase deploy
```

---

## Domínio personalizado

Para qualquer plataforma acima, você pode apontar seu domínio customizado:

1. Compre/use um domínio existente (ex: no Registro.br, GoDaddy, Namecheap)
2. Aponte o DNS para a plataforma escolhida (cada plataforma tem instruções específicas no painel)
3. HTTPS é configurado automaticamente em Netlify, Vercel, Cloudflare Pages e Firebase

---

## Checklist antes de publicar

- [ ] Substituir cases ilustrativos pelos cases reais (em `index.html`)
- [ ] Adicionar foto real do Rafa (em `index.html`, bloco `.about-avatar`)
- [ ] Completar bio com credenciais reais
- [ ] Configurar `webhookUrl` em `flow.js` para receber os leads
- [ ] Atualizar links de desqualificação em `flow.js`
- [ ] Adicionar link real da Política de Privacidade no footer
- [ ] Configurar IDs de tracking em `app.js` (GA4, Meta Pixel)
- [ ] Testar o formulário completo e verificar se os leads chegam no CRM
- [ ] Testar em mobile (iPhone Safari e Chrome Android)
- [ ] Testar navegação por teclado (Tab, Enter, Escape)
