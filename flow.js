// RADAR DO LUCRO — Configuração do Funil de Aplicação
// Edite este arquivo para ajustar perguntas, mensagens e destino do lead.

const FLOW_CONFIG = {

  // ─── INTEGRAÇÃO ────────────────────────────────────────────────────────────
  webhookUrl: '',          // URL do seu CRM / webhook (Zapier, n8n, etc.)
  redirectAfterSuccess: '', // Deixe vazio para mostrar tela de sucesso inline

  // ─── TELAS DE DESQUALIFICAÇÃO ───────────────────────────────────────────────
  disqualifyScreens: {
    lowRevenue: {
      icon: '📊',
      title: 'Obrigado pelo interesse!',
      body: 'O Programa de Aceleração Radar do Lucro foi desenvolvido para empresas com faturamento a partir de R$50.000/mês. Neste momento, o perfil que você descreveu tem um caminho diferente — e temos uma indicação melhor para o seu estágio.',
      ctaLabel: 'Conhecer conteúdo gratuito',
      ctaUrl: '#',
    },
    indebted: {
      icon: '🤝',
      title: 'Agradecemos sua honestidade.',
      body: 'O Programa entrega os melhores resultados quando a empresa já está operacionalmente estável. Para quem está em processo de reorganização financeira, temos uma recomendação mais adequada para esse momento específico.',
      ctaLabel: 'Ver indicação para minha situação',
      ctaUrl: '#',
    },
  },

  // ─── TELA DE SUCESSO ────────────────────────────────────────────────────────
  successScreen: {
    icon: '✅',
    title: 'Aplicação recebida com sucesso!',
    body: 'Nosso time vai analisar seu perfil e entrar em contato em até <strong>24h úteis pelo WhatsApp</strong> que você informou.',
    nextSteps: [
      'Salve o número da Hands on na sua agenda para não perder a ligação.',
      'Separe 30 minutos para a conversa — vamos analisar seu negócio juntos.',
      'Pense agora: qual produto você suspeita que está te custando mais do que deveria?',
    ],
  },

  // ─── ETAPAS DO FORMULÁRIO ───────────────────────────────────────────────────
  // Ordem obrigatória: engajamento → qualificação → dados pessoais
  // 5 passos (reduzido de 7 — removido tempo_situacao, segmento+colaboradores combinados)
  steps: [
    {
      id: 'situacao',
      block: 'engagement',
      title: 'Qual situação mais descreve o seu negócio hoje?',
      subtitle: 'Escolha a que mais se aproxima da realidade atual.',
      type: 'radio',
      required: true,
      options: [
        { value: 'lucro_some',       label: 'Vendo bem, mas o dinheiro some — no final do mês não sobra o que eu esperava' },
        { value: 'sem_visibilidade', label: 'Sei quanto faturei, mas não sei qual produto me dá mais lucro de verdade' },
        { value: 'margem_caiu',      label: 'Minha margem caiu e não consigo identificar o motivo exato' },
        { value: 'quer_escalar',     label: 'Quero crescer, mas não sei se estou financeiramente preparado' },
      ],
      nextStep: 'faturamento',
    },

    {
      id: 'faturamento',
      block: 'qualification',
      title: 'Qual o faturamento mensal médio da sua empresa?',
      subtitle: 'Usamos isso para verificar se o programa é adequado ao seu momento.',
      type: 'radio',
      required: true,
      options: [
        { value: 'abaixo_50k', label: 'Menos de R$50.000/mês' },
        { value: '50k_100k',   label: 'Entre R$50.000 e R$100.000/mês' },
        { value: '100k_500k',  label: 'Entre R$100.000 e R$500.000/mês' },
        { value: '500k_2m',    label: 'Entre R$500.000 e R$2.000.000/mês' },
        { value: 'acima_2m',   label: 'Acima de R$2.000.000/mês' },
      ],
      nextStep: 'saude_financeira',
    },

    {
      id: 'saude_financeira',
      block: 'qualification',
      title: 'Como está a saúde financeira da empresa hoje?',
      subtitle: 'Seja honesto — isso garante que a recomendação seja a mais adequada para você.',
      type: 'radio',
      required: true,
      options: [
        { value: 'estavel',    label: 'Estável: pago as contas e tenho alguma sobra' },
        { value: 'apertada',   label: 'Apertada: pago as contas, mas sobra muito pouco' },
        { value: 'endividada', label: 'Endividada: tenho dívidas pesando no caixa' },
        { value: 'crise',      label: 'Em crise: tenho dificuldade para honrar compromissos' },
      ],
      nextStep: 'perfil_empresa',
    },

    {
      id: 'colaboradores',
      block: 'qualification',
      title: 'Quantos colaboradores tem sua empresa?',
      subtitle: null,
      type: 'radio',
      required: true,
      options: [
        { value: 'solo',    label: 'Só eu (sem equipe contratada)' },
        { value: '2_10',    label: '2 a 10 colaboradores' },
        { value: '11_50',   label: '11 a 50 colaboradores' },
        { value: 'mais_50', label: 'Mais de 50 colaboradores' },
      ],
      nextStep: 'dados_pessoais',
    },

    {
      id: 'dados_pessoais',
      block: 'personal',
      title: 'Quase lá. Informe seus dados para entrarmos em contato.',
      subtitle: 'Nosso time analisa seu perfil e fala com você em até 24h úteis pelo WhatsApp.',
      type: 'fields',
      trustNote: 'Seus dados são usados exclusivamente para contato da equipe Hands on. Nunca compartilhamos com terceiros.',
      fields: [
        {
          id: 'nome',
          type: 'text',
          label: 'Seu nome completo',
          placeholder: 'Como prefere ser chamado',
          required: true,
          autocomplete: 'name',
          minLength: 3,
          errorMsg: 'Informe seu nome completo (mínimo 3 caracteres).',
        },
        {
          id: 'empresa',
          type: 'text',
          label: 'Nome da empresa',
          placeholder: 'Razão social ou nome fantasia',
          required: true,
          autocomplete: 'organization',
          minLength: 2,
          errorMsg: 'Informe o nome da empresa.',
        },
        {
          id: 'whatsapp',
          type: 'tel',
          label: 'WhatsApp',
          placeholder: '(11) 99999-9999',
          required: true,
          autocomplete: 'tel',
          errorMsg: 'Informe um WhatsApp válido com DDD (ex: 11 99999-9999).',
        },
        {
          id: 'email',
          type: 'email',
          label: 'E-mail',
          placeholder: 'voce@empresa.com.br',
          required: true,
          autocomplete: 'email',
          errorMsg: 'Informe um e-mail válido.',
        },
      ],
      nextStep: null, // terminal — dispara submit
    },
  ],
};
