// RADAR DO LUCRO — Motor do Funil de Aplicação
// Lê FLOW_CONFIG (flow.js) e gerencia todo o ciclo de vida do formulário.

// ─── CONFIGURAÇÃO DE TRACKING ─────────────────────────────────────────────────
// Preencha os IDs abaixo para ativar o tracking. Deixe vazio para usar só o console.
const TRACKING_CONFIG = {
  ga4_id:          '',   // Ex: 'G-XXXXXXXXXX'
  meta_pixel_id:   '',   // Ex: '1234567890'
  custom_webhook:  '',   // Ex: 'https://hooks.zapier.com/hooks/catch/...'
};

// ─── ESTADO GLOBAL ────────────────────────────────────────────────────────────
const STATE = {
  currentStepIndex: 0,
  answers: {},
  startTime: null,
  stepStartTime: null,
  isSubmitting: false,
  disqualifyReason: null,
};

const STORAGE_KEY = 'rdl_funnel_state';

// ─── TRACKING ─────────────────────────────────────────────────────────────────
function trackEvent(eventName, data = {}) {
  const payload = { ...data, timestamp: Date.now(), url: location.href };
  console.log(`[TRACK] ${eventName}`, payload);

  if (TRACKING_CONFIG.ga4_id && typeof gtag === 'function') {
    gtag('event', eventName, payload);
  }
  if (TRACKING_CONFIG.meta_pixel_id && typeof fbq === 'function') {
    fbq('trackCustom', eventName, payload);
  }
  if (TRACKING_CONFIG.custom_webhook) {
    try {
      navigator.sendBeacon(
        TRACKING_CONFIG.custom_webhook,
        JSON.stringify({ event: eventName, ...payload })
      );
    } catch (_) {}
  }
}

// ─── PERSISTÊNCIA ─────────────────────────────────────────────────────────────
function saveState() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentStepIndex: STATE.currentStepIndex,
      answers: STATE.answers,
    }));
  } catch (_) {}
}

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function clearState() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch (_) {}
}

// ─── UTILIDADES ───────────────────────────────────────────────────────────────
function getSteps() { return FLOW_CONFIG.steps; }
function getCurrentStep() { return getSteps()[STATE.currentStepIndex]; }

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
}

function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isValidPhone(v) { return /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(v.replace(/\s/g, '')); }

// ─── RENDERIZAÇÃO ─────────────────────────────────────────────────────────────
function getWrapper() { return document.getElementById('funnel-wrapper'); }

function renderProgressBar() {
  const steps = getSteps();
  const total = steps.length;
  const current = STATE.currentStepIndex + 1;
  const pct = Math.round((current / total) * 100);
  return `
    <div class="funnel-progress" role="progressbar" aria-valuenow="${current}" aria-valuemin="1" aria-valuemax="${total}" aria-label="Progresso do formulário">
      <div class="funnel-progress__bar" style="width:${pct}%"></div>
    </div>
    <p class="funnel-progress__label">Passo ${current} de ${total} &nbsp;·&nbsp; ~2 minutos</p>
  `;
}

function renderRadioStep(step) {
  const saved = STATE.answers[step.id];
  const opts = step.options.map(opt => `
    <label class="radio-option${saved === opt.value ? ' radio-option--selected' : ''}" for="opt_${escapeHtml(opt.value)}">
      <input
        class="radio-option__input"
        type="radio"
        id="opt_${escapeHtml(opt.value)}"
        name="${escapeHtml(step.id)}"
        value="${escapeHtml(opt.value)}"
        ${saved === opt.value ? 'checked' : ''}
      >
      <span class="radio-option__mark" aria-hidden="true"></span>
      <span class="radio-option__text">${escapeHtml(opt.label)}</span>
    </label>
  `).join('');

  return `
    <fieldset class="funnel-fieldset" aria-required="true">
      <legend class="funnel-step__title">${escapeHtml(step.title)}</legend>
      ${step.subtitle ? `<p class="funnel-step__subtitle">${escapeHtml(step.subtitle)}</p>` : ''}
      <div id="error-summary" class="error-summary hidden" role="alert" aria-live="assertive"></div>
      <div class="radio-group">${opts}</div>
    </fieldset>
    <div class="funnel-actions">
      ${STATE.currentStepIndex > 0 ? '<button type="button" class="btn btn--ghost" id="btn-back">← Voltar</button>' : ''}
      <button type="button" class="btn btn--primary" id="btn-next">Continuar →</button>
    </div>
  `;
}

function renderSelectStep(step) {
  const saved = STATE.answers[step.id] || '';
  const opts = step.options.map(opt =>
    `<option value="${escapeHtml(opt.value)}" ${saved === opt.value ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`
  ).join('');

  return `
    <div class="funnel-step__header">
      <h2 class="funnel-step__title">${escapeHtml(step.title)}</h2>
      ${step.subtitle ? `<p class="funnel-step__subtitle">${escapeHtml(step.subtitle)}</p>` : ''}
    </div>
    <div id="error-summary" class="error-summary hidden" role="alert" aria-live="assertive"></div>
    <div class="field-group">
      <label class="field-label" for="field_${step.id}">
        ${escapeHtml(step.title)} <span class="field-required" aria-label="obrigatório">*</span>
      </label>
      <select
        class="field-select"
        id="field_${step.id}"
        name="${escapeHtml(step.id)}"
        required
        aria-required="true"
        aria-describedby="err_${step.id}"
      >
        <option value="" disabled ${!saved ? 'selected' : ''}>${escapeHtml(step.placeholder || 'Selecione...')}</option>
        ${opts}
      </select>
      <span id="err_${step.id}" class="field-error hidden" aria-live="polite"></span>
    </div>
    <div class="funnel-actions">
      ${STATE.currentStepIndex > 0 ? '<button type="button" class="btn btn--ghost" id="btn-back">← Voltar</button>' : ''}
      <button type="button" class="btn btn--primary" id="btn-next">Continuar →</button>
    </div>
  `;
}

function renderFieldsStep(step) {
  const fields = step.fields.map(f => {
    const saved = (STATE.answers[step.id] || {})[f.id] || '';

    // Campo select (quando field tem .options)
    if (f.type === 'select') {
      const opts = (f.options || []).map(o =>
        `<option value="${escapeHtml(o.value)}" ${saved === o.value ? 'selected' : ''}>${escapeHtml(o.label)}</option>`
      ).join('');
      return `
        <div class="field-group" id="fg_${f.id}">
          <label class="field-label" for="field_${f.id}">
            ${escapeHtml(f.label)}
            <span class="field-required" aria-label="obrigatório">*</span>
          </label>
          <select
            class="field-select"
            id="field_${f.id}"
            name="${escapeHtml(f.id)}"
            required
            aria-required="true"
            aria-describedby="err_${f.id}"
          >
            <option value="" disabled ${!saved ? 'selected' : ''}>${escapeHtml(f.placeholder || 'Selecione...')}</option>
            ${opts}
          </select>
          <span id="err_${f.id}" class="field-error hidden" aria-live="polite"></span>
        </div>
      `;
    }

    // Campo input (text, email, tel)
    return `
      <div class="field-group" id="fg_${f.id}">
        <label class="field-label" for="field_${f.id}">
          ${escapeHtml(f.label)}
          <span class="field-required" aria-label="obrigatório">*</span>
        </label>
        <input
          class="field-input"
          type="${f.type}"
          id="field_${f.id}"
          name="${escapeHtml(f.id)}"
          placeholder="${escapeHtml(f.placeholder || '')}"
          autocomplete="${f.autocomplete || 'off'}"
          value="${escapeHtml(saved)}"
          required
          aria-required="true"
          aria-describedby="err_${f.id}"
        >
        <span id="err_${f.id}" class="field-error hidden" aria-live="polite"></span>
      </div>
    `;
  }).join('');

  return `
    <div class="funnel-step__header">
      <h2 class="funnel-step__title">${escapeHtml(step.title)}</h2>
      ${step.subtitle ? `<p class="funnel-step__subtitle">${escapeHtml(step.subtitle)}</p>` : ''}
    </div>
    ${step.trustNote ? `<p class="trust-note">🔒 ${escapeHtml(step.trustNote)}</p>` : ''}
    <div id="error-summary" class="error-summary hidden" role="alert" aria-live="assertive"></div>
    <div class="fields-container">${fields}</div>
    <div class="funnel-actions">
      ${STATE.currentStepIndex > 0 ? '<button type="button" class="btn btn--ghost" id="btn-back">← Voltar</button>' : ''}
      <button type="button" class="btn btn--primary btn--submit" id="btn-next" aria-live="polite">
        Enviar aplicação
      </button>
    </div>
  `;
}

function renderStep(step) {
  const wrapper = getWrapper();
  if (!wrapper) return;

  let inner = '';
  if (step.type === 'radio')  inner = renderRadioStep(step);
  if (step.type === 'select') inner = renderSelectStep(step);
  if (step.type === 'fields') inner = renderFieldsStep(step);

  wrapper.innerHTML = `
    <div class="funnel-card" id="funnel-card">
      ${renderProgressBar()}
      <div class="funnel-step" id="funnel-step" tabindex="-1">
        ${inner}
      </div>
    </div>
  `;

  // Focus para acessibilidade
  const stepEl = wrapper.querySelector('#funnel-step');
  if (stepEl) stepEl.focus({ preventScroll: true });

  // Listeners
  bindListeners(step);

  // Auto-avança radio ao selecionar (UX)
  if (step.type === 'radio') {
    wrapper.querySelectorAll('.radio-option__input').forEach(input => {
      input.addEventListener('change', () => {
        wrapper.querySelectorAll('.radio-option').forEach(l => l.classList.remove('radio-option--selected'));
        const label = wrapper.querySelector(`label[for="${input.id}"]`);
        if (label) label.classList.add('radio-option--selected');
        // Pequeno delay para o usuário ver a seleção antes de avançar
        setTimeout(() => advance(step), 350);
      });
    });
  }

  // Máscara de telefone
  if (step.type === 'fields') {
    const telInput = wrapper.querySelector('input[type="tel"]');
    if (telInput) {
      telInput.addEventListener('input', () => {
        const pos = telInput.selectionStart;
        telInput.value = formatPhone(telInput.value);
        try { telInput.setSelectionRange(pos, pos); } catch (_) {}
      });
    }
    // Limpa erro ao corrigir campo
    wrapper.querySelectorAll('.field-input, .field-select').forEach(input => {
      input.addEventListener('input', () => clearFieldError(input.id.replace('field_', '')));
      input.addEventListener('change', () => clearFieldError(input.id.replace('field_', '')));
    });
  }

  trackEvent('step_view', {
    step_id: step.id,
    step_number: STATE.currentStepIndex + 1,
    step_title: step.title,
  });
}

function bindListeners(step) {
  const wrapper = getWrapper();
  const btnNext = wrapper.querySelector('#btn-next');
  const btnBack = wrapper.querySelector('#btn-back');

  if (btnNext) btnNext.addEventListener('click', () => advance(step));
  if (btnBack) btnBack.addEventListener('click', () => goBack());

  // Enter para avançar em selects e campos
  if (step.type === 'select' || step.type === 'fields') {
    wrapper.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') advance(step);
    });
  }
}

// ─── VALIDAÇÃO ────────────────────────────────────────────────────────────────
function validateStep(step) {
  const wrapper = getWrapper();
  const errors = [];

  if (step.type === 'radio') {
    const checked = wrapper.querySelector(`input[name="${step.id}"]:checked`);
    if (!checked) errors.push({ field: step.id, msg: 'Selecione uma opção para continuar.' });
  }

  if (step.type === 'select') {
    const sel = wrapper.querySelector(`#field_${step.id}`);
    if (!sel || !sel.value) errors.push({ field: step.id, msg: 'Selecione uma opção para continuar.' });
  }

  if (step.type === 'fields') {
    step.fields.forEach(f => {
      const input = wrapper.querySelector(`#field_${f.id}`);
      if (!input) return;
      const v = input.value.trim();

      if (f.required && !v) {
        errors.push({ field: f.id, msg: `Erro: ${f.errorMsg || 'Campo obrigatório.'}` });
        return;
      }
      if (f.minLength && v.length < f.minLength) {
        errors.push({ field: f.id, msg: `Erro: ${f.errorMsg}` });
        return;
      }
      if (f.type === 'email' && v && !isValidEmail(v)) {
        errors.push({ field: f.id, msg: `Erro: ${f.errorMsg}` });
        return;
      }
      if (f.type === 'tel' && v && !isValidPhone(v)) {
        errors.push({ field: f.id, msg: `Erro: ${f.errorMsg}` });
      }
    });
  }

  return errors;
}

function showErrors(errors, step) {
  const wrapper = getWrapper();
  const summary = wrapper.querySelector('#error-summary');

  // Limpa erros anteriores de campos
  wrapper.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.classList.add('hidden'); });
  wrapper.querySelectorAll('.field-group').forEach(el => el.classList.remove('field-group--error'));
  wrapper.querySelectorAll('.radio-option').forEach(el => el.classList.remove('radio-option--error'));

  if (errors.length === 0) {
    if (summary) { summary.textContent = ''; summary.classList.add('hidden'); }
    return;
  }

  // Inline errors
  errors.forEach(err => {
    const errEl = wrapper.querySelector(`#err_${err.field}`);
    const groupEl = wrapper.querySelector(`#fg_${err.field}`);
    if (errEl) { errEl.textContent = err.msg; errEl.classList.remove('hidden'); }
    if (groupEl) groupEl.classList.add('field-group--error');
  });

  // Summary para radio (sem campo visual individual)
  if (summary) {
    if (step.type === 'radio') {
      summary.textContent = errors[0].msg;
      summary.classList.remove('hidden');
    }
  }

  // Foco no primeiro erro
  const firstErr = wrapper.querySelector('.field-group--error .field-input, .field-group--error .field-select');
  if (firstErr) firstErr.focus();
  else if (summary && !summary.classList.contains('hidden')) summary.focus();

  trackEvent('field_error', { step_id: step.id, error_count: errors.length });
}

function clearFieldError(fieldId) {
  const wrapper = getWrapper();
  const errEl = wrapper.querySelector(`#err_${fieldId}`);
  const groupEl = wrapper.querySelector(`#fg_${fieldId}`);
  if (errEl) { errEl.textContent = ''; errEl.classList.add('hidden'); }
  if (groupEl) groupEl.classList.remove('field-group--error');
}

// ─── COLETA DE RESPOSTAS ──────────────────────────────────────────────────────
function collectAnswers(step) {
  const wrapper = getWrapper();

  if (step.type === 'radio') {
    const checked = wrapper.querySelector(`input[name="${step.id}"]:checked`);
    if (checked) STATE.answers[step.id] = checked.value;
  }

  if (step.type === 'select') {
    const sel = wrapper.querySelector(`#field_${step.id}`);
    if (sel) STATE.answers[step.id] = sel.value;
  }

  if (step.type === 'fields') {
    STATE.answers[step.id] = {};
    step.fields.forEach(f => {
      const input = wrapper.querySelector(`#field_${f.id}`);
      if (input) STATE.answers[step.id][f.id] = input.value.trim();
    });
  }
}

// ─── NAVEGAÇÃO ────────────────────────────────────────────────────────────────
function advance(step) {
  const errors = validateStep(step);
  if (errors.length > 0) { showErrors(errors, step); return; }

  collectAnswers(step);

  // Verifica desqualificação
  const disqualifyReason = checkDisqualify(step);
  if (disqualifyReason) {
    STATE.disqualifyReason = disqualifyReason;
    trackEvent('disqualify', { step_id: step.id, reason: disqualifyReason });
    saveState();
    renderDisqualify(disqualifyReason);
    return;
  }

  // Métrica de tempo no passo
  const timeOnStep = STATE.stepStartTime ? Date.now() - STATE.stepStartTime : 0;
  trackEvent('step_complete', {
    step_id: step.id,
    step_number: STATE.currentStepIndex + 1,
    time_on_step: timeOnStep,
  });

  // Último passo — envia
  if (step.nextStep === null) {
    submitFunnel();
    return;
  }

  STATE.currentStepIndex++;
  STATE.stepStartTime = Date.now();
  saveState();
  renderStep(getCurrentStep());
  scrollToFunnel();
}

function goBack() {
  if (STATE.currentStepIndex === 0) return;
  const from = getCurrentStep();
  STATE.currentStepIndex--;
  const to = getCurrentStep();
  trackEvent('step_back', { from_step: from.id, to_step: to.id });
  STATE.stepStartTime = Date.now();
  saveState();
  renderStep(to);
  scrollToFunnel();
}

function checkDisqualify(step) {
  const wrapper = getWrapper();
  if (step.type === 'radio') {
    const checked = wrapper.querySelector(`input[name="${step.id}"]:checked`);
    if (!checked) return null;
    const opt = step.options.find(o => o.value === checked.value);
    return opt && opt.disqualify ? opt.disqualify : null;
  }
  return null;
}

function scrollToFunnel() {
  const el = document.getElementById('aplicar');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── TELAS ESPECIAIS ──────────────────────────────────────────────────────────
function renderDisqualify(reason) {
  const screen = FLOW_CONFIG.disqualifyScreens[reason];
  if (!screen) return;
  const wrapper = getWrapper();
  wrapper.innerHTML = `
    <div class="funnel-card funnel-card--result">
      <div class="result-icon">${screen.icon}</div>
      <h2 class="result-title">${escapeHtml(screen.title)}</h2>
      <p class="result-body">${escapeHtml(screen.body)}</p>
      ${screen.ctaUrl && screen.ctaUrl !== '#' ? `
        <a href="${escapeHtml(screen.ctaUrl)}" class="btn btn--primary result-cta">${escapeHtml(screen.ctaLabel)}</a>
      ` : ''}
    </div>
  `;
}

function renderSuccess() {
  const s = FLOW_CONFIG.successScreen;
  const stepsHtml = s.nextSteps.map((st, i) => `
    <li class="next-step-item">
      <span class="next-step-num">${i + 1}</span>
      <span>${escapeHtml(st)}</span>
    </li>
  `).join('');

  const wrapper = getWrapper();
  wrapper.innerHTML = `
    <div class="funnel-card funnel-card--result funnel-card--success">
      <div class="result-icon">${s.icon}</div>
      <h2 class="result-title">${escapeHtml(s.title)}</h2>
      <p class="result-body">${s.body}</p>
      <div class="next-steps">
        <p class="next-steps__label">Enquanto aguarda, prepare-se:</p>
        <ol class="next-steps__list">${stepsHtml}</ol>
      </div>
    </div>
  `;
}

function renderSubmitting() {
  const wrapper = getWrapper();
  const card = wrapper.querySelector('#funnel-card');
  const btn = wrapper.querySelector('#btn-next');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    btn.setAttribute('aria-busy', 'true');
  }
}

// ─── SUBMIT ───────────────────────────────────────────────────────────────────
async function submitFunnel() {
  if (STATE.isSubmitting) return;
  STATE.isSubmitting = true;
  renderSubmitting();

  const totalTime = STATE.startTime ? Date.now() - STATE.startTime : 0;

  // Monta payload flat — achata todos os steps do tipo 'fields'
  const payload = { ...STATE.answers };
  Object.keys(payload).forEach(key => {
    if (payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key])) {
      Object.assign(payload, payload[key]);
      delete payload[key];
    }
  });
  payload._meta = {
    submitted_at: new Date().toISOString(),
    total_time_ms: totalTime,
    steps_completed: STATE.currentStepIndex + 1,
    url: location.href,
    referrer: document.referrer,
  };

  trackEvent('funnel_complete', {
    total_time: totalTime,
    steps_completed: STATE.currentStepIndex + 1,
  });

  // Envia para webhook se configurado
  if (FLOW_CONFIG.webhookUrl) {
    try {
      await fetch(FLOW_CONFIG.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[RDL] Erro ao enviar:', err);
    }
  } else {
    console.log('[RDL] Payload (sem webhook configurado):', payload);
  }

  clearState();

  if (FLOW_CONFIG.redirectAfterSuccess) {
    location.href = FLOW_CONFIG.redirectAfterSuccess;
    return;
  }

  renderSuccess();
  scrollToFunnel();
}

// ─── ABANDON TRACKING ─────────────────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  if (STATE.currentStepIndex > 0 && !STATE.isSubmitting) {
    trackEvent('funnel_abandon', {
      last_step: getCurrentStep().id,
      time_on_page: STATE.startTime ? Date.now() - STATE.startTime : 0,
    });
  }
});

// ─── INICIALIZAÇÃO ────────────────────────────────────────────────────────────
function initFunnel() {
  const wrapper = getWrapper();
  if (!wrapper) return; // Não está na página do funil

  trackEvent('page_view', { referrer: document.referrer });

  const saved = loadState();

  if (saved && saved.currentStepIndex > 0 && Object.keys(saved.answers).length > 0) {
    // Mostra banner de retomada
    wrapper.innerHTML = `
      <div class="funnel-card funnel-card--resume">
        <p class="resume-text">Você começou a preencher antes. Quer continuar de onde parou?</p>
        <div class="resume-actions">
          <button class="btn btn--primary" id="btn-resume">Continuar de onde parei</button>
          <button class="btn btn--ghost" id="btn-restart">Recomeçar</button>
        </div>
      </div>
    `;
    document.getElementById('btn-resume').addEventListener('click', () => {
      STATE.currentStepIndex = saved.currentStepIndex;
      STATE.answers = saved.answers;
      startFunnel();
    });
    document.getElementById('btn-restart').addEventListener('click', () => {
      clearState();
      startFunnel();
    });
  } else {
    startFunnel();
  }
}

function startFunnel() {
  STATE.startTime = Date.now();
  STATE.stepStartTime = Date.now();
  trackEvent('funnel_start', { timestamp: STATE.startTime });
  renderStep(getCurrentStep());
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initFunnel);

// ─── EXIT INTENT MODAL ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  const overlay = document.getElementById('exit-modal');
  if (!overlay) return;

  const MODAL_KEY = 'rdl_exit_shown';

  function showModal() {
    if (sessionStorage.getItem(MODAL_KEY)) return;
    sessionStorage.setItem(MODAL_KEY, '1');
    overlay.classList.add('modal-overlay--visible');
    overlay.querySelector('.modal-close').focus();
    trackEvent('exit_intent_shown', {});
  }

  function hideModal() {
    overlay.classList.remove('modal-overlay--visible');
  }

  // Trigger: mouse sai pelo topo da janela (desktop)
  document.documentElement.addEventListener('mouseleave', function (e) {
    if (e.clientY <= 0) showModal();
  });

  // Fechar com X
  overlay.querySelector('.modal-close').addEventListener('click', hideModal);

  // Fechar clicando no overlay
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) hideModal();
  });

  // Fechar com Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hideModal();
  });

  // Dismiss link
  const dismiss = overlay.querySelector('.modal-dismiss');
  if (dismiss) dismiss.addEventListener('click', hideModal);
});

// ─── STICKY CTA MOBILE ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  const sticky = document.getElementById('sticky-cta');
  if (!sticky) return;

  const aplicarEl = document.getElementById('aplicar');

  function updateSticky() {
    const scrollY = window.scrollY || window.pageYOffset;
    if (scrollY < 400) {
      sticky.classList.remove('sticky-cta--visible');
      document.body.classList.remove('sticky-cta-active');
      return;
    }
    // Some quando o formulário está visível
    if (aplicarEl) {
      const rect = aplicarEl.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        sticky.classList.remove('sticky-cta--visible');
        document.body.classList.remove('sticky-cta-active');
        return;
      }
    }
    sticky.classList.add('sticky-cta--visible');
    document.body.classList.add('sticky-cta-active');
  }

  window.addEventListener('scroll', updateSticky, { passive: true });
  updateSticky();
});
