# Radar do Lucro — Página de Aplicação

Funil de aplicação em HTML puro para o Programa de Aceleração Radar do Lucro.

## Estrutura de arquivos

```
radar-do-lucro/
├── index.html   ← Página principal (CSS crítico inline)
├── styles.css   ← Estilos não-críticos
├── app.js       ← Motor do funil (lê flow.js, gerencia estado, submete)
├── flow.js      ← Configuração: perguntas, mensagens, destino do lead
├── README.md    ← Este arquivo
└── DEPLOY.md    ← Como publicar
```

---

## Rodar localmente

### Opção 1 — Abrir diretamente
Abra `index.html` no navegador. O funil funciona offline (exceto o envio para webhook).

### Opção 2 — Servidor local (recomendado para testar submit)
```bash
npx serve .
# Acesse http://localhost:3000
```

---

## Como personalizar

### Textos e copy da página

Edite diretamente o `index.html`. Os pontos marcados com comentários são:

- **Cases reais** — Substitua os três blocos `.case-card` com os seus cases reais (seção "Resultados reais").
  > Procure pelo comentário `<!-- CASE 1 — Substituir pelo case real -->`

- **Foto do Rafa** — No bloco `.about-avatar`, substitua o emoji pelo tag `<img>`:
  ```html
  <img src="foto-rafa.jpg" alt="Rafael Girardi">
  ```

- **Bio do Rafa** — Adicione credenciais, número de clientes, anos de experiência no parágrafo `.about-bio`.

- **Links de desqualificação** — Em `flow.js`, altere `ctaUrl` em `disqualifyScreens` para apontar para conteúdo gratuito real.

- **Política de privacidade** — Substitua os `href="#"` no footer pelo link real.

### Cores

Todas as cores estão como variáveis CSS no topo de `styles.css`:

```css
:root {
  --blue:       #1d4ed8;  /* cor principal */
  --blue-hover: #1e40af;  /* hover dos botões */
  /* ... */
}
```

Altere os valores hex para adaptar à identidade visual desejada.

---

## Configurar destino do lead

Edite o topo de `flow.js`:

```js
const FLOW_CONFIG = {
  webhookUrl: 'https://hooks.zapier.com/hooks/catch/...',
  // ou URL de qualquer endpoint que aceite POST com JSON
};
```

O payload enviado tem a estrutura:
```json
{
  "situacao": "lucro_some",
  "tempo_situacao": "1_3a",
  "faturamento": "100k_500k",
  "saude_financeira": "estavel",
  "colaboradores": "2_10",
  "segmento": "servicos",
  "nome": "João Silva",
  "empresa": "Empresa XYZ",
  "whatsapp": "(11) 99999-9999",
  "email": "joao@empresa.com",
  "_meta": {
    "submitted_at": "2025-01-01T12:00:00.000Z",
    "total_time_ms": 120000,
    "steps_completed": 7,
    "url": "https://...",
    "referrer": "https://..."
  }
}
```

---

## Configurar tracking (GA4 / Meta Pixel)

Edite o topo de `app.js`:

```js
const TRACKING_CONFIG = {
  ga4_id:        'G-XXXXXXXXXX',   // seu ID do GA4
  meta_pixel_id: '1234567890',     // seu Pixel ID
  custom_webhook: '',              // opcional: webhook adicional
};
```

Adicione os scripts do GA4 e Pixel no `index.html` antes dos scripts do funil:

```html
<!-- GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>

<!-- Meta Pixel -->
<script>
  !function(f,b,e,v,n,t,s){...}(window,...);
  fbq('init', '1234567890');
  fbq('track', 'PageView');
</script>
```

### Eventos disparados automaticamente

| Evento | Quando |
|---|---|
| `page_view` | Ao carregar |
| `funnel_start` | Ao interagir com o primeiro campo |
| `step_view` | Ao entrar em cada passo |
| `step_complete` | Ao avançar com sucesso |
| `field_error` | Ao falhar validação |
| `step_back` | Ao voltar |
| `disqualify` | Ao ser redirecionado para tela de saída |
| `funnel_complete` | Ao submeter com sucesso |
| `funnel_abandon` | Ao sair sem completar |

---

## Ajustar tempo de retorno do comercial

Em `flow.js`, o `successScreen.body` tem `24h úteis`. Altere conforme o prazo real:

```js
successScreen: {
  body: 'Nosso time vai analisar seu perfil e entrar em contato em até <strong>Xh úteis pelo WhatsApp</strong>...',
}
```

---

## Ajustar links de desqualificação

Em `flow.js`, `disqualifyScreens.lowRevenue.ctaUrl` e `disqualifyScreens.indebted.ctaUrl` estão como `'#'`. Substitua por links reais (Instagram, conteúdo gratuito, lista de espera, etc.).
