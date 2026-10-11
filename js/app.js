/* ==========================================================================
   MATHESIS — lógica da aplicação
   --------------------------------------------------------------------------
   Depende de (carregados antes no index.html):
     js/data/modules.js          → MODULES
     js/data/final-challenge.js  → FINAL_CHALLENGE
   ========================================================================== */
(function () {
    'use strict';

    // ==========================================================
    // CONFIGURAÇÃO
    // ==========================================================
    const STORAGE_KEY = 'mathesis_final_state';
    const XP_PER_LEVEL = 500;
    const ORIGINAL_XP = 50; // XP pela questão original de cada módulo
    const FINAL_XP = 100; // XP por questão do desafio
    const FINAL_BONUS_XP = 300; // bônus ao fechar as 15
    const SRS_XP = 25; // XP por revisão espaçada acertada
    const PASS_RATIO = 2 / 3; // fração mínima de acertos na verificação
    const TOTAL_QUESTIONS = MODULES.length + FINAL_CHALLENGE.length;

    // ==========================================================
    // REVISÃO ESPAÇADA – curva do esquecimento (Leitner)
    // Cada acerto empurra o módulo para a caixa seguinte, com
    // intervalo maior. Um erro devolve o módulo à caixa 1.
    // ==========================================================
    const SRS_INTERVALS = [1, 3, 7, 16, 35]; // dias por caixa
    const SRS_LABELS = ['Frágil', 'Recente', 'Firmando', 'Sólido', 'Forte', 'Consolidado'];
    const DAY_MS = 86400000;

    // ==========================================================
    // ELEMENTOS FIXOS DA PÁGINA
    // ==========================================================
    const $main = document.getElementById('main');
    const $mount = document.getElementById('main-mount');
    const $nav = document.getElementById('module-nav');
    const $crumb = document.getElementById('crumb');
    const $toasts = document.getElementById('toast-region');
    const $sidebar = document.getElementById('sidebar');
    const $overlay = document.getElementById('sidebarOverlay');
    const $toggle = document.getElementById('menuToggle');

    // ==========================================================
    // ESTADO
    // ==========================================================
    let state = {
        xp: 0,
        level: 1,
        solved: [], // IDs dos módulos concluídos
        currentIdx: 0,
        rank: 'JUNIOR',
        // Progresso detalhado para cada módulo
        progress: {},
        // Agendamento de revisões: { [moduleId]: {box, due, seen, hits, misses} }
        srs: {},
        // Desafio final: ids resolvidos + tentativas por questão
        finalChallenge: { solved: [], attempts: {} },
        // Módulos cuja questão original já rendeu XP
        originalSolved: [],
        // Tela ativa: 'module' | 'srs' | 'final'
        view: 'module',
        // Deslocamento de tempo (apenas para testar o agendamento)
        timeOffsetDays: 0
    };

    // Sessão de revisão em andamento (não persistida)
    let srsSession = null;

    function blankProgress(m) {
        return {
            done: false,
            xpAwarded: false,
            verificationCorrect: 0,
            verificationAttempted: 0,
            guided: new Array(m.practice ? m.practice.length : 0).fill(false),
            independent: new Array(m.independent ? m.independent.length : 0).fill(false),
            verification: new Array(m.verification ? m.verification.length : 0).fill(false),
        };
    }

    MODULES.forEach(m => {
        if (!state.progress[m.id]) state.progress[m.id] = blankProgress(m);
    });

    // ==========================================================
    // PERSISTÊNCIA
    // ==========================================================
    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (_) {}
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            Object.assign(state, JSON.parse(raw));

            // Garantir que todos os módulos tenham progresso
            MODULES.forEach(m => {
                const p = state.progress[m.id];
                if (!p) state.progress[m.id] = blankProgress(m);
                // Saves antigos: módulo concluído já recebeu o XP
                else if (p.done && p.xpAwarded === undefined) p.xpAwarded = true;
            });

            // Campos novos em saves antigos
            if (!state.srs) state.srs = {};
            if (!state.finalChallenge) state.finalChallenge = { solved: [], attempts: {} };
            if (!Array.isArray(state.finalChallenge.solved)) state.finalChallenge.solved = [];
            if (!state.finalChallenge.attempts) state.finalChallenge.attempts = {};
            if (!Array.isArray(state.originalSolved)) state.originalSolved = [];
            if (typeof state.timeOffsetDays !== 'number') state.timeOffsetDays = 0;
            state.view = 'module';

            // Recalcular solved baseado no progresso
            state.solved = MODULES.filter(m => isDone(m.id)).map(m => m.id);
            // Progresso antigo (sem SRS) entra no agendamento agora
            state.solved.forEach(id => scheduleFirstReview(id));
            calculateLevel();
        } catch (_) {}
    }

    // ==========================================================
    // HELPERS
    // ==========================================================
    function moduleById(id) {
        return MODULES.find(m => m.id === id);
    }

    function isDone(id) {
        return !!(state.progress[id] && state.progress[id].done);
    }

    function isModuleUnlocked(id) {
        const m = moduleById(id);
        if (!m) return false;
        return m.prereqs.every(pid => isDone(pid));
    }

    function allModulesDone() {
        return MODULES.every(m => isDone(m.id));
    }

    function getOverallProgress() {
        const done = MODULES.filter(m => isDone(m.id)).length;
        return Math.round((done / MODULES.length) * 100);
    }

    // Quantas questões de verificação precisam ser acertadas
    function passThreshold(m) {
        return Math.ceil(m.verification.length * PASS_RATIO);
    }

    function plural(n, singular, pluralForm) {
        return n === 1 ? singular : pluralForm;
    }

    function calculateLevel() {
        state.level = Math.floor(state.xp / XP_PER_LEVEL) + 1;
        if (state.level >= 6) state.rank = 'PRINCIPAL';
        else if (state.level >= 4) state.rank = 'SENIOR';
        else if (state.level >= 2) state.rank = 'MID-LEVEL';
        else state.rank = 'JUNIOR';
    }

    function addXP(amount) {
        const before = state.level;
        state.xp += amount;
        calculateLevel();
        if (state.level > before) toast(`⬆️ Subiu para o nível ${state.level} — ${state.rank}`);
    }

    function typeset() {
        if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([$mount]);
    }

    // Troca o conteúdo principal avisando o MathJax do que saiu da tela
    function mountHTML(html) {
        if (window.MathJax && MathJax.typesetClear) MathJax.typesetClear([$mount]);
        $mount.innerHTML = html;
    }

    function setCrumb(text) {
        $crumb.textContent = text;
    }

    function celebrate(strong) {
        if (typeof confetti !== 'function') return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        confetti({
            particleCount: strong ? 220 : 140,
            spread: strong ? 90 : 70,
            origin: { y: strong ? 0.5 : 0.6 },
            colors: ['#316dca', '#c69026', '#2e8b57']
        });
    }

    // Notificação discreta no rodapé (substitui o alert())
    function toast(message) {
        const el = document.createElement('div');
        el.className = 'toast';
        el.textContent = message;
        $toasts.appendChild(el);
        setTimeout(() => {
            el.classList.add('is-leaving');
            setTimeout(() => el.remove(), 300);
        }, 4000);
    }

    // ---------- Alternativas (compartilhado por todas as telas) ----------
    function optionsHTML(opts, disabled, correctIdx) {
        return opts.map((opt, oi) => `
            <button type="button" class="option-btn${oi === correctIdx ? ' correct' : ''}" data-value="${oi}" aria-pressed="false" ${disabled ? 'disabled' : ''}>
              <span class="letter">${String.fromCharCode(65 + oi)}</span>
              <span class="opt-text">${opt}</span>
            </button>`).join('');
    }

    function getSelectedIndex(container) {
        let selected = null;
        container.querySelectorAll('.option-btn').forEach((b, i) => {
            if (b.classList.contains('selected')) selected = i;
        });
        return selected;
    }

    // Pinta a resposta certa (e a errada, se houver) e trava as alternativas
    function paintAnswer(container, correctIdx, selected) {
        container.querySelectorAll('.option-btn').forEach((b, i) => {
            b.disabled = true;
            if (i === correctIdx) b.classList.add('correct');
            if (i === selected && selected !== correctIdx) b.classList.add('wrong');
        });
    }

    // Libera as alternativas para uma nova tentativa
    function resetAnswer(container, fb) {
        container.querySelectorAll('.option-btn').forEach(b => {
            b.disabled = false;
            b.classList.remove('correct', 'wrong', 'selected');
            b.setAttribute('aria-pressed', 'false');
        });
        setFeedback(fb, '', '');
    }

    function setFeedback(fb, kind, html) {
        fb.className = 'feedback-panel' + (kind ? ' ' + kind : '');
        fb.innerHTML = html;
    }

    // ==========================================================
    // TEMPO (com deslocamento simulável)
    // ==========================================================
    function now() {
        return Date.now() + (state.timeOffsetDays || 0) * DAY_MS;
    }

    function daysUntil(ts) {
        return Math.ceil((ts - now()) / DAY_MS);
    }

    // ==========================================================
    // AGENDAMENTO (SRS)
    // ==========================================================
    function scheduleFirstReview(moduleId) {
        if (state.srs[moduleId]) return;
        state.srs[moduleId] = {
            box: 0,
            due: now() + SRS_INTERVALS[0] * DAY_MS,
            seen: 0,
            hits: 0,
            misses: 0
        };
    }

    function promoteReview(moduleId) {
        const s = state.srs[moduleId];
        if (!s) return 0;
        s.box = Math.min(s.box + 1, SRS_INTERVALS.length - 1);
        s.seen = (s.seen || 0) + 1;
        s.hits = (s.hits || 0) + 1;
        const dias = SRS_INTERVALS[s.box];
        s.due = now() + dias * DAY_MS;
        return dias;
    }

    function demoteReview(moduleId) {
        const s = state.srs[moduleId];
        if (!s) return 0;
        s.box = 0;
        s.seen = (s.seen || 0) + 1;
        s.misses = (s.misses || 0) + 1;
        s.due = now() + SRS_INTERVALS[0] * DAY_MS;
        return SRS_INTERVALS[0];
    }

    function dueReviewIds() {
        return Object.keys(state.srs)
            .map(Number)
            .filter(id => state.srs[id] && state.srs[id].due <= now())
            .sort((a, b) => state.srs[a].due - state.srs[b].due);
    }

    function srsAccuracy() {
        let hits = 0, total = 0;
        Object.values(state.srs).forEach(s => {
            hits += s.hits || 0;
            total += (s.hits || 0) + (s.misses || 0);
        });
        return total === 0 ? null : Math.round((hits / total) * 100);
    }

    // Escolhe a pergunta da revisão: percorre o banco do módulo
    // em rodízio, para não repetir sempre a mesma.
    function pickReviewQuestion(mod) {
        const pool = [];
        (mod.review || []).forEach(q => pool.push(q));
        (mod.verification || []).forEach(q => pool.push(q));
        if (mod.originalQuestion) {
            pool.push({
                q: mod.originalQuestion.text,
                opts: mod.originalQuestion.options,
                correct: mod.originalQuestion.correct,
                hint: mod.originalQuestion.hint
            });
        }
        (mod.independent || []).forEach(q => pool.push(q));
        const s = state.srs[mod.id] || { seen: 0 };
        return pool[(s.seen || 0) % pool.length];
    }

    function srsStatusLabel(id) {
        const s = state.srs[id];
        if (!s) return '';
        const d = daysUntil(s.due);
        if (d <= 0) return d === 0 ? 'revisar hoje' : `atrasada ${Math.abs(d)} dia(s)`;
        return `em ${d} dia(s)`;
    }

    function srsPillClass(id) {
        const d = daysUntil(state.srs[id].due);
        if (d < 0) return 'late';
        if (d === 0) return 'due';
        return 'ok';
    }

    function boxDots(box) {
        return `<div class="box-dots" title="Força da memória: ${SRS_LABELS[box + 1] || SRS_LABELS[0]}">` +
            SRS_INTERVALS.map((_, i) => `<span class="dot ${i <= box ? 'on' : ''}"></span>`).join('') +
            `</div>`;
    }

    // Marca módulo como dominado e agenda a primeira revisão
    function markModuleDone(m) {
        const prog = state.progress[m.id];
        prog.done = true;
        if (!state.solved.includes(m.id)) state.solved.push(m.id);
        // XP só na primeira vez — refazer a verificação não rende XP de novo
        if (!prog.xpAwarded) {
            prog.xpAwarded = true;
            addXP(m.xp || 200);
        }
        celebrate(true);
        scheduleFirstReview(m.id);
    }

    // ==========================================================
    // ROTEADOR DE TELAS
    // ==========================================================
    function render() {
        if (state.view === 'srs') renderSRS();
        else if (state.view === 'final') renderFinal();
        else renderModule(state.currentIdx);
    }

    function goTo(view, idx) {
        state.view = view;
        if (typeof idx === 'number') state.currentIdx = idx;
        if (view !== 'srs') srsSession = null;
        saveState();
        render();
        closeSidebar();
        $main.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==========================================================
    // SIDEBAR
    // ==========================================================
    function renderSidebar() {
        const dueCount = dueReviewIds().length;
        const scheduled = Object.keys(state.srs).length;
        const finalUnlocked = allModulesDone();
        const finalSolved = state.finalChallenge.solved.length;

        let html = `<div class="nav-divider">Trilha</div>`;

        html += MODULES.map((m, idx) => {
            const done = isDone(m.id);
            const locked = !done && !isModuleUnlocked(m.id);
            const active = state.view === 'module' && idx === state.currentIdx;

            let cls = 'nav-item';
            if (locked) cls += ' locked';
            if (active) cls += ' active';
            if (done) cls += ' done';

            return `
              <button type="button" class="${cls}" data-idx="${idx}" data-id="${m.id}" ${active ? 'aria-current="page"' : ''} ${locked ? 'aria-disabled="true"' : ''}>
                <span class="icon" aria-hidden="true">${m.icon}</span>
                <span class="info">
                  <span class="title">${m.title}</span>
                  <span class="tag">${m.tag}</span>
                </span>
                <span class="status-badge">${done ? '✓' : (locked ? '🔒' : m.id)}</span>
              </button>`;
        }).join('');

        html += `<div class="nav-divider">Consolidação</div>`;

        // Revisão espaçada
        html += `
              <button type="button" class="nav-item ${state.view === 'srs' ? 'active' : ''}" data-view="srs">
                <span class="icon" aria-hidden="true">🔁</span>
                <span class="info">
                  <span class="title">Revisão Espaçada</span>
                  <span class="tag">${scheduled} módulo(s) agendado(s)</span>
                </span>
                <span class="count-badge ${dueCount ? '' : 'calm'}">${dueCount || '—'}</span>
              </button>`;

        // Desafio final
        html += `
              <button type="button" class="nav-item ${finalUnlocked ? '' : 'locked'} ${state.view === 'final' ? 'active' : ''}" data-view="final" ${finalUnlocked ? '' : 'aria-disabled="true"'}>
                <span class="icon" aria-hidden="true">${finalUnlocked ? '🏆' : '🔒'}</span>
                <span class="info">
                  <span class="title">Desafio Final</span>
                  <span class="tag">Questões ${MODULES.length + 1} – ${TOTAL_QUESTIONS} do PDF</span>
                </span>
                <span class="status-badge">${finalSolved}/${FINAL_CHALLENGE.length}</span>
              </button>`;

        $nav.innerHTML = html;
    }

    // Um único listener para toda a navegação lateral
    $nav.addEventListener('click', e => {
        const item = e.target.closest('.nav-item');
        if (!item) return;

        const view = item.dataset.view;
        if (view) {
            if (view === 'final' && !allModulesDone()) {
                const faltam = MODULES.filter(m => !isDone(m.id)).map(m => m.title).join(', ');
                toast(`🔒 O Desafio Final abre depois de dominar todos os módulos.\nFaltam: ${faltam}`);
                return;
            }
            goTo(view);
            return;
        }

        const idx = parseInt(item.dataset.idx, 10);
        const id = parseInt(item.dataset.id, 10);
        if (!isModuleUnlocked(id) && !isDone(id)) {
            const prereqNames = moduleById(id).prereqs
                .filter(pid => !isDone(pid))
                .map(pid => moduleById(pid).title)
                .join(', ');
            toast(`🔒 Este módulo requer: ${prereqNames}.`);
            return;
        }
        goTo('module', idx);
    });

    // ==========================================================
    // TELA: MÓDULO
    // ==========================================================
    function questionFor(m, type, idx) {
        const pools = {
            guided: m.practice,
            independent: m.independent,
            verification: m.verification,
            review: m.review
        };
        const pool = pools[type];
        return pool ? pool[idx] : null;
    }

    function quizBlockHTML(m, type, q, qi, disabled, done) {
        return `
            <div class="quiz-area" data-module="${m.id}" data-type="${type}" data-idx="${qi}">
              <p class="q-text">${q.q}</p>
              <div class="options-grid">${optionsHTML(q.opts, disabled)}</div>
              <div class="feedback-panel" aria-live="polite"></div>
              <div class="btn-group">
                <button type="button" class="primary-btn" data-action="check-${type}" ${disabled ? 'disabled' : ''}>Verificar</button>
                <button type="button" class="primary-btn secondary-btn" data-action="hint-${type}" ${disabled ? 'disabled' : ''}>Dica</button>
                ${done ? '<span class="done-label">✅ Concluído</span>' : ''}
              </div>
            </div>`;
    }

    function renderModule(idx) {
        const m = MODULES[idx];
        if (!m) return;

        const prog = state.progress[m.id] || {};
        const isLocked = !isModuleUnlocked(m.id) && !prog.done;
        const total = m.verification ? m.verification.length : 0;
        const prevIdx = idx > 0 ? idx - 1 : null;
        const nextIdx = idx < MODULES.length - 1 ? idx + 1 : null;
        const nextOpen = nextIdx !== null && (isModuleUnlocked(MODULES[nextIdx].id) || isDone(MODULES[nextIdx].id));

        setCrumb(`Trilha / Módulo ${m.id} · ${m.title}`);

        // Cabeçalho
        let html = `
            <section class="glass-card ${isLocked ? 'is-error' : 'is-accent'}">
              <span class="badge badge-prereq">Módulo ${m.id} de ${MODULES.length}</span>
              <div class="title-row">
                <span class="module-icon" aria-hidden="true">${m.icon}</span>
                <div>
                  <h1>${m.title}</h1>
                  <span class="sub-heading">// TAG: ${m.tag}</span>
                </div>
              </div>
              <p>${m.objective}</p>
              <div class="module-meta">
                <span class="meta-chip">🧪 Verificação: ${prog.verificationCorrect || 0}/${total}</span>
                <span class="meta-chip">⭐ ${m.xp} XP</span>
                ${prog.done ? '<span class="meta-chip is-success">✅ Concluído</span>' : ''}
                ${prog.done && state.srs[m.id] ? `<span class="meta-chip is-gold">🔁 Revisão ${srsStatusLabel(m.id)}</span>` : ''}
              </div>
            </section>`;

        if (isLocked) {
            html += `
            <section class="glass-card is-error">
              <h2>🔒 Módulo bloqueado</h2>
              <p>Complete os módulos anteriores:</p>
              <ul class="check-list">
                ${m.prereqs.map(pid => {
                    const pmod = moduleById(pid);
                    return `<li>${isDone(pid) ? '✅' : '⏳'} <strong>${pmod ? pmod.title : pid}</strong></li>`;
                }).join('')}
              </ul>
            </section>`;
            mountHTML(html);
            typeset();
            renderSidebar();
            updateHUD();
            return;
        }

        // Teoria
        html += `
            <section class="glass-card">
              <h2>📖 Teoria</h2>
              <p>${m.theory}</p>
              <div class="formula-box">\\(${m.math}\\)</div>
              ${m.guidedSteps ? `
                <div class="step-list">
                  <div class="step-list-title">Exemplo resolvido</div>
                  ${m.guidedSteps.map((step, i) => `
                    <div class="step">
                      <span class="num">${i + 1}.</span>
                      <span>${step}</span>
                    </div>`).join('')}
                </div>` : ''}
            </section>`;

        // Vídeos
        if (m.videos && m.videos.length) {
            html += `
            <section class="glass-card">
              <h2>🎬 Recomendações</h2>
              ${m.videos.map(v => `
                <div class="video-rec">
                  <div class="v-icon" aria-hidden="true">▶</div>
                  <div class="v-info">
                    <div class="v-title">${v.title}</div>
                    <div class="v-desc">${v.desc}</div>
                    <div class="v-meta">${v.channel} • Assista: ${v.momento}</div>
                  </div>
                  <a class="v-link" href="${v.link}" target="_blank" rel="noopener">Assistir →</a>
                </div>`).join('')}
            </section>`;
        }

        // Prática guiada
        if (m.practice && m.practice.length) {
            html += `
            <section class="glass-card">
              <h2>✏️ Prática guiada</h2>
              ${m.practice.map((q, qi) => {
                  const done = !!(prog.guided && prog.guided[qi]);
                  return quizBlockHTML(m, 'guided', q, qi, done, done);
              }).join('')}
            </section>`;
        }

        // Prática independente
        if (m.independent && m.independent.length) {
            html += `
            <section class="glass-card">
              <h2>🧠 Prática independente</h2>
              ${m.independent.map((q, qi) => {
                  const done = !!(prog.independent && prog.independent[qi]);
                  return quizBlockHTML(m, 'independent', q, qi, done, done);
              }).join('')}
            </section>`;
        }

        // Verificação
        if (total) {
            const passed = !!prog.done;
            const needed = passThreshold(m);
            html += `
            <section class="glass-card ${passed ? 'is-success' : 'is-gold'}">
              <h2>🧪 Verificação</h2>
              <p class="muted">${passed ? '✅ Aprovado!' : `Critério: acertar ${needed} de ${total} ${plural(total, 'questão', 'questões')} de verificação.`}</p>
              ${passed ? `<div class="banner banner-success">🎉 Módulo dominado! Próxima revisão: ${srsStatusLabel(m.id)}.</div>` : ''}
              ${m.verification.map((q, qi) => {
                  const done = !!(prog.verification && prog.verification[qi]);
                  return quizBlockHTML(m, 'verification', q, qi, done || passed, done);
              }).join('')}
              ${!passed && prog.verificationAttempted > 0 ? `
                <div class="banner banner-info">
                  <strong>Progresso:</strong> ${prog.verificationCorrect} de ${Math.min(prog.verificationAttempted, total)} corretas.
                  ${prog.verificationCorrect >= needed ? ' 🎉 Você atingiu o critério! Avance para o próximo módulo.' : ' Continue praticando.'}
                </div>` : ''}
              ${passed ? `
                <div class="btn-group">
                  ${nextIdx !== null
                      ? '<button type="button" class="primary-btn" data-action="next-module">→ Avançar</button>'
                      : (allModulesDone() ? '<button type="button" class="primary-btn gold-btn" data-action="go-final">🏆 Desafio Final</button>' : '')}
                  <button type="button" class="primary-btn secondary-btn" data-action="review-module">🔄 Refazer verificação</button>
                </div>` : ''}
            </section>`;
        }

        // Revisão
        if (m.review && m.review.length) {
            html += `
            <section class="glass-card">
              <h2>🔄 Revisão</h2>
              ${m.review.map((q, qi) => quizBlockHTML(m, 'review', q, qi, false, false)).join('')}
            </section>`;
        }

        // Questão original
        if (m.originalQuestion) {
            const solvedBefore = state.originalSolved.includes(m.id);
            html += `
            <section class="glass-card is-gold">
              <div class="badge-row">
                <span class="badge badge-original">Questão ${m.id} de ${TOTAL_QUESTIONS} — Original do PDF</span>
                ${solvedBefore ? '<span class="badge badge-success">✅ Resolvida</span>' : ''}
              </div>
              <h3>${m.originalQuestion.text}</h3>
              <div class="options-grid" id="original-options">${optionsHTML(m.originalQuestion.options, false)}</div>
              <div id="fb_original" class="feedback-panel" aria-live="polite"></div>
              <div class="btn-group">
                <button type="button" class="primary-btn gold-btn" id="check-original">Verificar</button>
                <button type="button" class="primary-btn secondary-btn" id="hint-original">Dica</button>
              </div>
            </section>`;
        }

        // Navegação entre módulos
        html += `
            <nav class="module-pager" aria-label="Navegação entre módulos">
              ${prevIdx !== null ? `<button type="button" class="primary-btn secondary-btn" data-action="prev-module">← ${MODULES[prevIdx].title}</button>` : '<span></span>'}
              ${nextIdx !== null
                  ? `<button type="button" class="primary-btn" data-action="next-module" ${nextOpen ? '' : 'disabled'}>${MODULES[nextIdx].title} →</button>`
                  : (allModulesDone() ? '<button type="button" class="primary-btn gold-btn" data-action="go-final">🏆 Desafio Final</button>' : '<span></span>')}
            </nav>`;

        mountHTML(html);

        // ---------- Eventos ----------
        attachExerciseListeners(m);

        $mount.querySelectorAll('[data-action="prev-module"]').forEach(el => {
            el.addEventListener('click', () => goTo('module', prevIdx));
        });
        $mount.querySelectorAll('[data-action="next-module"]').forEach(el => {
            el.addEventListener('click', () => goTo('module', nextIdx));
        });
        $mount.querySelectorAll('[data-action="go-final"]').forEach(el => {
            el.addEventListener('click', () => goTo('final'));
        });
        $mount.querySelectorAll('[data-action="review-module"]').forEach(el => {
            el.addEventListener('click', () => {
                const p = state.progress[m.id];
                p.done = false;
                p.verificationCorrect = 0;
                p.verificationAttempted = 0;
                p.verification = new Array(m.verification.length).fill(false);
                const idxS = state.solved.indexOf(m.id);
                if (idxS !== -1) state.solved.splice(idxS, 1);
                saveState();
                render();
            });
        });

        attachOriginalQuestion(m);

        typeset();
        updateHUD();
        renderSidebar();
        saveState();
    }

    function attachOriginalQuestion(m) {
        const checkBtn = document.getElementById('check-original');
        const hintBtn = document.getElementById('hint-original');
        if (!checkBtn || !m.originalQuestion) return;

        const container = document.getElementById('original-options');
        const fb = document.getElementById('fb_original');
        const oq = m.originalQuestion;

        checkBtn.addEventListener('click', () => {
            const selected = getSelectedIndex(container);
            if (selected === null) {
                setFeedback(fb, 'info', 'ℹ️ Selecione uma alternativa.');
                return;
            }
            const correct = selected === oq.correct;
            paintAnswer(container, oq.correct, selected);

            if (correct) {
                const first = !state.originalSolved.includes(m.id);
                if (first) {
                    state.originalSolved.push(m.id);
                    addXP(ORIGINAL_XP);
                }
                setFeedback(fb, 'success', `🎉 Correto! Você resolveu a questão original!${first ? ` +${ORIGINAL_XP} XP` : ''}`);
                celebrate(false);
                updateHUD();
                saveState();
            } else {
                setFeedback(fb, 'error', `❌ Incorreto. Dica: ${oq.hint}`);
                setTimeout(() => resetAnswer(container, fb), 3000);
            }
        });

        hintBtn.addEventListener('click', () => {
            setFeedback(fb, 'info', `💡 Dica: ${oq.hint}`);
        });
    }

    function attachExerciseListeners(m) {
        // Verificar
        $mount.querySelectorAll('[data-action^="check-"]').forEach(btn => {
            btn.addEventListener('click', function () {
                const quiz = this.closest('.quiz-area');
                if (!quiz) return;
                const type = quiz.dataset.type;
                const idx = parseInt(quiz.dataset.idx, 10);
                const q = questionFor(m, type, idx);
                if (!q) return;

                const fb = quiz.querySelector('.feedback-panel');
                const selected = getSelectedIndex(quiz);
                if (selected === null) {
                    setFeedback(fb, 'info', 'ℹ️ Selecione uma alternativa.');
                    return;
                }

                const correct = selected === q.correct;
                paintAnswer(quiz, q.correct, selected);
                const prog = state.progress[m.id];

                if (correct) {
                    setFeedback(fb, 'success', '✅ Correto!');
                    // Evita contar o mesmo acerto duas vezes
                    quiz.querySelectorAll('[data-action]').forEach(b => { b.disabled = true; });
                    if (type === 'review') return;

                    if (!prog[type]) prog[type] = [];
                    prog[type][idx] = true;
                    if (type === 'verification') {
                        prog.verificationCorrect = (prog.verificationCorrect || 0) + 1;
                        prog.verificationAttempted = (prog.verificationAttempted || 0) + 1;
                        if (prog.verificationCorrect >= passThreshold(m)) markModuleDone(m);
                    }
                    saveState();
                    renderSidebar();
                    updateHUD();
                    if (type === 'verification' && prog.done) setTimeout(render, 600);
                } else {
                    setFeedback(fb, 'error', `❌ Incorreto. ${q.hint ? '💡 ' + q.hint : ''}`);
                    if (type === 'verification') {
                        prog.verificationAttempted = (prog.verificationAttempted || 0) + 1;
                    }
                    saveState();
                    setTimeout(() => resetAnswer(quiz, fb), 3000);
                }
            });
        });

        // Dica
        $mount.querySelectorAll('[data-action^="hint-"]').forEach(btn => {
            btn.addEventListener('click', function () {
                const quiz = this.closest('.quiz-area');
                if (!quiz) return;
                const q = questionFor(m, quiz.dataset.type, parseInt(quiz.dataset.idx, 10));
                if (!q) return;
                setFeedback(quiz.querySelector('.feedback-panel'), 'info', q.hint ? '💡 ' + q.hint : '💡 Tente rever a teoria.');
            });
        });
    }

    // ==========================================================
    // TELA: REVISÃO ESPAÇADA
    // ==========================================================
    function renderSRS() {
        const ids = Object.keys(state.srs).map(Number)
            .sort((a, b) => state.srs[a].due - state.srs[b].due);
        const due = dueReviewIds();
        const acc = srsAccuracy();
        const consolidados = ids.filter(id => state.srs[id].box >= SRS_INTERVALS.length - 1).length;
        const intervalos = SRS_INTERVALS.slice(0, -1).join(', ') + ' e ' + SRS_INTERVALS[SRS_INTERVALS.length - 1];

        setCrumb('Consolidação / Revisão Espaçada');

        let html = `
            <section class="glass-card is-gold">
              <span class="badge badge-original">Consolidação</span>
              <h1>🔁 Revisão Espaçada</h1>
              <span class="sub-heading">// COMBATENDO A CURVA DO ESQUECIMENTO</span>
              <p>Aprender uma vez não é aprender. Cada módulo dominado entra numa fila de revisões
              com intervalos crescentes — <strong>${intervalos} dias</strong>. Você revê o conteúdo
              pouco antes de esquecê-lo, que é exatamente quando a repetição vale mais.
              Acertou? O intervalo cresce. Errou? O módulo volta para o começo da fila.</p>
              <div class="stat-grid">
                <div class="stat-box"><div class="stat-val ${due.length ? 'is-gold' : ''}">${due.length}</div><div class="stat-lbl">Vencidas hoje</div></div>
                <div class="stat-box"><div class="stat-val">${ids.length}</div><div class="stat-lbl">Agendadas</div></div>
                <div class="stat-box"><div class="stat-val">${consolidados}</div><div class="stat-lbl">Consolidadas</div></div>
                <div class="stat-box"><div class="stat-val">${acc === null ? '—' : acc + '%'}</div><div class="stat-lbl">Taxa de acerto</div></div>
              </div>
            </section>`;

        // Sessão em andamento
        if (srsSession) {
            html += renderSRSSession();
        } else if (due.length) {
            html += `
            <section class="glass-card is-gold">
              <h2>⏰ ${due.length} revisão(ões) esperando por você</h2>
              <p class="muted">${due.map(id => moduleById(id).title).join(' • ')}</p>
              <div class="btn-group">
                <button type="button" class="primary-btn gold-btn" id="start-srs">▶ Iniciar sessão de revisão</button>
              </div>
            </section>`;
        }

        // Agenda
        if (!ids.length) {
            html += `
            <section class="glass-card">
              <div class="empty-state">
                <span class="big-icon">🌱</span>
                <strong>Nenhuma revisão agendada ainda.</strong>
                <p class="muted">Domine seu primeiro módulo — a revisão dele é agendada automaticamente para o dia seguinte.</p>
              </div>
            </section>`;
        } else {
            html += `
            <section class="glass-card">
              <h2>🗓️ Agenda</h2>
              <p class="muted" style="margin-bottom:14px;">Ordenada pela próxima data de revisão.</p>
              ${ids.map(id => {
                  const s = state.srs[id];
                  const mod = moduleById(id);
                  return `
                    <div class="srs-row ${s.due <= now() ? 'is-due' : ''}">
                      <span class="srs-icon" aria-hidden="true">${mod.icon}</span>
                      <div class="srs-title">${mod.title}
                        <small>${SRS_LABELS[Math.min(s.box + 1, SRS_LABELS.length - 1)]} • ${s.hits || 0} acerto(s) / ${s.misses || 0} erro(s)</small>
                      </div>
                      ${boxDots(s.box)}
                      <span class="pill ${srsPillClass(id)}">${srsStatusLabel(id)}</span>
                      <button type="button" class="primary-btn secondary-btn btn-sm" data-review-one="${id}">Revisar</button>
                    </div>`;
              }).join('')}
            </section>`;
        }

        // Mapa de domínio
        html += `
            <section class="glass-card">
              <h2>🗺️ Mapa de domínio</h2>
              <p class="muted">Quanto mais dourado, mais consolidado está o módulo na sua memória.</p>
              <div class="heat-grid">
                ${MODULES.map(m => {
                    const done = isDone(m.id);
                    const s = state.srs[m.id];
                    const level = !done ? 0 : Math.min((s ? s.box : 0) + 1, 5);
                    return `<div class="heat-cell l${level} ${done ? '' : 'is-locked'}" title="${m.title}: ${done ? SRS_LABELS[level] : 'não concluído'}">${m.id}</div>`;
                }).join('')}
              </div>
              <div class="time-machine">
                <span>Simulador de tempo (para testar o agendamento):</span>
                <button type="button" data-skip="1">⏩ +1 dia</button>
                <button type="button" data-skip="3">⏩ +3 dias</button>
                <button type="button" data-skip="7">⏩ +7 dias</button>
                <button type="button" data-skip="reset">↺ tempo real</button>
                <span class="offset">offset atual: +${state.timeOffsetDays || 0}d</span>
              </div>
            </section>`;

        mountHTML(html);

        const startBtn = document.getElementById('start-srs');
        if (startBtn) startBtn.addEventListener('click', () => startSRSSession(dueReviewIds()));

        $mount.querySelectorAll('[data-review-one]').forEach(el => {
            el.addEventListener('click', function () {
                startSRSSession([parseInt(this.dataset.reviewOne, 10)]);
            });
        });

        $mount.querySelectorAll('[data-skip]').forEach(el => {
            el.addEventListener('click', function () {
                const v = this.dataset.skip;
                state.timeOffsetDays = v === 'reset' ? 0 : (state.timeOffsetDays || 0) + parseInt(v, 10);
                saveState();
                renderSRS();
            });
        });

        attachSRSSessionListeners();
        typeset();
        renderSidebar();
        updateHUD();
    }

    function startSRSSession(ids) {
        if (!ids.length) return;
        srsSession = {
            queue: ids.map(id => ({ id: id, q: pickReviewQuestion(moduleById(id)) })),
            idx: 0,
            hits: 0,
            misses: 0,
            answered: false,
            finished: false
        };
        renderSRS();
        $main.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderSRSSession() {
        const s = srsSession;

        if (s.finished) {
            const total = s.hits + s.misses;
            const perfeito = s.misses === 0;
            return `
            <section class="glass-card ${perfeito ? 'is-success' : 'is-accent'}">
              <h2>${perfeito ? '🎉 Sessão perfeita!' : '📊 Sessão concluída'}</h2>
              <p>Você revisou <strong>${total}</strong> módulo(s):
              <span class="text-success">${s.hits} acerto(s)</span> e
              <span class="text-error">${s.misses} erro(s)</span>.</p>
              ${s.misses ? '<p class="muted">Os módulos errados voltaram para a caixa 1 e reaparecem amanhã. Errar aqui é barato — é exatamente para isso que a revisão existe.</p>' : ''}
              <div class="btn-group">
                <button type="button" class="primary-btn secondary-btn" id="end-srs">Voltar à agenda</button>
              </div>
            </section>`;
        }

        const item = s.queue[s.idx];
        const mod = moduleById(item.id);
        const q = item.q;
        const caixa = SRS_LABELS[Math.min(state.srs[item.id].box + 1, SRS_LABELS.length - 1)];

        return `
            <section class="glass-card is-gold">
              <span class="badge badge-original">Revisão ${s.idx + 1} de ${s.queue.length}</span>
              <h2>${mod.icon} ${mod.title}</h2>
              <p class="muted">Caixa atual: ${caixa} — sem consultar a teoria, tente recuperar de memória.</p>
              <div class="quiz-area" id="srs-quiz">
                <p class="q-text" style="margin-top:14px;">${q.q}</p>
                <div class="options-grid">${optionsHTML(q.opts, s.answered)}</div>
                <div class="feedback-panel" id="fb_srs" aria-live="polite"></div>
                <div class="btn-group">
                  ${s.answered
                      ? `<button type="button" class="primary-btn" id="srs-next">${s.idx + 1 < s.queue.length ? 'Próxima revisão →' : 'Finalizar sessão →'}</button>
                         <button type="button" class="primary-btn secondary-btn" data-open-module="${item.id}">📖 Reabrir teoria</button>`
                      : `<button type="button" class="primary-btn gold-btn" id="srs-check">Verificar</button>
                         <button type="button" class="primary-btn secondary-btn" id="srs-hint">Dica</button>
                         <button type="button" class="primary-btn secondary-btn" id="srs-skip">Pular</button>`}
                </div>
              </div>
            </section>`;
    }

    function attachSRSSessionListeners() {
        if (!srsSession) return;

        const end = document.getElementById('end-srs');
        if (end) end.addEventListener('click', () => { srsSession = null; renderSRS(); });

        const check = document.getElementById('srs-check');
        if (check) {
            check.addEventListener('click', () => {
                const s = srsSession;
                const item = s.queue[s.idx];
                const q = item.q;
                const selected = getSelectedIndex(document.getElementById('srs-quiz'));

                if (selected === null) {
                    setFeedback(document.getElementById('fb_srs'), 'info', 'ℹ️ Selecione uma alternativa.');
                    return;
                }

                const correct = selected === q.correct;
                let nextIn;
                s.answered = true;

                if (correct) {
                    s.hits++;
                    nextIn = promoteReview(item.id);
                    addXP(SRS_XP);
                    celebrate(false);
                } else {
                    s.misses++;
                    nextIn = demoteReview(item.id);
                }
                saveState();

                // Re-renderiza a tela e pinta o resultado
                renderSRS();
                paintAnswer(document.getElementById('srs-quiz'), q.correct, selected);
                setFeedback(document.getElementById('fb_srs'), correct ? 'success' : 'error', correct
                    ? `✅ Correto! +${SRS_XP} XP — próxima revisão em ${nextIn} dia(s).`
                    : `❌ Incorreto. ${q.hint ? '💡 ' + q.hint + '<br>' : ''}Este módulo volta para a caixa 1: nova revisão em ${nextIn} dia(s).`);
            });
        }

        const hint = document.getElementById('srs-hint');
        if (hint) {
            hint.addEventListener('click', () => {
                const q = srsSession.queue[srsSession.idx].q;
                setFeedback(document.getElementById('fb_srs'), 'info', q.hint ? '💡 ' + q.hint : '💡 Reveja a teoria do módulo.');
            });
        }

        const skip = document.getElementById('srs-skip');
        if (skip) skip.addEventListener('click', advanceSRS);

        const next = document.getElementById('srs-next');
        if (next) next.addEventListener('click', advanceSRS);

        $mount.querySelectorAll('[data-open-module]').forEach(el => {
            el.addEventListener('click', function () {
                const id = parseInt(this.dataset.openModule, 10);
                goTo('module', MODULES.findIndex(m => m.id === id));
            });
        });
    }

    function advanceSRS() {
        const s = srsSession;
        s.idx++;
        s.answered = false;
        if (s.idx >= s.queue.length) s.finished = true;
        renderSRS();
        $main.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==========================================================
    // TELA: DESAFIO FINAL
    // ==========================================================
    function renderFinal() {
        const solved = state.finalChallenge.solved;
        const total = FINAL_CHALLENGE.length;
        const pct = Math.round((solved.length / total) * 100);
        const firstId = MODULES.length + 1;

        setCrumb('Consolidação / Desafio Final');

        if (!allModulesDone()) {
            const faltam = MODULES.filter(m => !isDone(m.id));
            mountHTML(`
            <section class="glass-card is-error">
              <h1>🔒 Desafio Final</h1>
              <span class="sub-heading">// QUESTÕES ${firstId} A ${TOTAL_QUESTIONS} DO PDF</span>
              <p>Estas ${total} questões misturam vários módulos de uma vez. Elas abrem quando toda a
              trilha estiver dominada — resolver antes disso só ensinaria a chutar.</p>
              <ul class="check-list">
                ${MODULES.map(m => `<li>${isDone(m.id) ? '✅' : '⏳'} <strong>${m.title}</strong></li>`).join('')}
              </ul>
              <p style="margin-top:12px; color:var(--gold);">Faltam ${faltam.length} módulo(s).</p>
            </section>`);
            typeset();
            renderSidebar();
            updateHUD();
            return;
        }

        let html = `
            <section class="glass-card is-gold">
              <span class="badge badge-original">Questões ${firstId} – ${TOTAL_QUESTIONS} do PDF</span>
              <h1>🏆 Desafio Final</h1>
              <span class="sub-heading">// INTEGRAÇÃO DE TODA A TRILHA</span>
              <p>As ${MODULES.length} primeiras questões do PDF você resolveu dentro dos módulos, uma de cada vez.
              Estas ${total} são diferentes: cada uma exige <strong>dois ou mais conteúdos ao mesmo tempo</strong>.
              É aqui que se vê se o conhecimento virou ferramenta.</p>
              <div class="progress-track"><div class="fill" style="width:${pct}%"></div></div>
              <div class="progress-caption">
                <span>${solved.length} de ${total} resolvidas</span>
                <span>+${FINAL_XP} XP cada</span>
              </div>
            </section>`;

        if (solved.length === total) {
            html += `
            <section class="glass-card is-success center">
              <span class="big-icon">🎓</span>
              <h1>${TOTAL_QUESTIONS} de ${TOTAL_QUESTIONS}</h1>
              <p>Você resolveu todas as questões do PDF — as ${MODULES.length} dos módulos e as ${total} integradoras.
              A trilha está completa. Agora o jogo é manter: a Revisão Espaçada cuida disso.</p>
              <div class="btn-group center">
                <button type="button" class="primary-btn gold-btn" data-go="srs">🔁 Ir para a revisão</button>
              </div>
            </section>`;
        }

        html += FINAL_CHALLENGE.map(q => {
            const isSolved = solved.includes(q.id);
            const tags = q.topics.map(t => {
                const mod = moduleById(t);
                return `<span class="topic-tag">${mod ? mod.icon + ' ' + mod.title : t}</span>`;
            }).join('');
            return `
            <section class="glass-card ${isSolved ? 'is-success' : 'is-gold'}" data-final="${q.id}">
              <span class="badge ${isSolved ? 'badge-success' : 'badge-original'}">Questão ${q.id} de ${TOTAL_QUESTIONS} ${isSolved ? '✅' : ''}</span>
              <div>${tags}</div>
              <h3>${q.text}</h3>
              <div class="options-grid">${optionsHTML(q.options, isSolved, isSolved ? q.correct : -1)}</div>
              <div class="feedback-panel ${isSolved ? 'success' : ''}" aria-live="polite">${isSolved ? '✅ Resolvida.' : ''}</div>
              ${isSolved ? solutionHTML(q) : `
                <div class="btn-group">
                  <button type="button" class="primary-btn" data-check-final="${q.id}">Verificar</button>
                  <button type="button" class="primary-btn secondary-btn" data-hint-final="${q.id}">Dica</button>
                </div>`}
            </section>`;
        }).join('');

        mountHTML(html);

        $mount.querySelectorAll('[data-check-final]').forEach(btn => {
            btn.addEventListener('click', function () {
                checkFinalQuestion(parseInt(this.dataset.checkFinal, 10));
            });
        });

        $mount.querySelectorAll('[data-hint-final]').forEach(btn => {
            btn.addEventListener('click', function () {
                const qid = parseInt(this.dataset.hintFinal, 10);
                const q = FINAL_CHALLENGE.find(x => x.id === qid);
                const card = $mount.querySelector(`[data-final="${qid}"]`);
                setFeedback(card.querySelector('.feedback-panel'), 'info', `💡 ${q.hint}`);
            });
        });

        $mount.querySelectorAll('[data-go="srs"]').forEach(el => {
            el.addEventListener('click', () => goTo('srs'));
        });

        typeset();
        renderSidebar();
        updateHUD();
    }

    function solutionHTML(q) {
        return `
            <div class="solution-box">
              <div class="sol-title">Resolução passo a passo</div>
              <ol>${q.solution.map(s => `<li>${s}</li>`).join('')}</ol>
            </div>`;
    }

    function checkFinalQuestion(qid) {
        const q = FINAL_CHALLENGE.find(x => x.id === qid);
        const card = $mount.querySelector(`[data-final="${qid}"]`);
        const fb = card.querySelector('.feedback-panel');

        const selected = getSelectedIndex(card);
        if (selected === null) {
            setFeedback(fb, 'info', 'ℹ️ Selecione uma alternativa.');
            return;
        }

        const attempts = state.finalChallenge.attempts;
        attempts[qid] = (attempts[qid] || 0) + 1;

        const correct = selected === q.correct;
        paintAnswer(card, q.correct, selected);

        if (correct) {
            if (!state.finalChallenge.solved.includes(qid)) {
                state.finalChallenge.solved.push(qid);
                addXP(FINAL_XP);
            }
            setFeedback(fb, 'success', `🎉 Correto! +${FINAL_XP} XP ${attempts[qid] === 1 ? '— de primeira!' : ''}`);
            celebrate(false);

            const fechou = state.finalChallenge.solved.length === FINAL_CHALLENGE.length;
            if (fechou && !state.finalChallenge.bonusGiven) {
                state.finalChallenge.bonusGiven = true;
                addXP(FINAL_BONUS_XP);
                celebrate(true);
            }
            saveState();
            setTimeout(renderFinal, fechou ? 900 : 700);
        } else {
            setFeedback(fb, 'error', `❌ Incorreto. 💡 ${q.hint}`);
            saveState();
            setTimeout(() => resetAnswer(card, fb), 3500);
        }
        updateHUD();
    }

    // ==========================================================
    // HUD + PERFIL
    // ==========================================================
    function updateHUD() {
        const doneCount = MODULES.filter(m => isDone(m.id)).length;

        document.getElementById('hud-lvl').textContent = state.level;
        document.getElementById('hud-solved').textContent = doneCount;
        document.getElementById('hud-total').textContent = MODULES.length;
        document.getElementById('hud-xp').textContent = state.xp;

        const xpInLevel = state.xp % XP_PER_LEVEL;
        document.getElementById('xp-fill').style.width = (xpInLevel / XP_PER_LEVEL) * 100 + '%';
        document.getElementById('xp-text').textContent = `${state.xp} / ${state.level * XP_PER_LEVEL}`;
        document.getElementById('user-rank').textContent = state.rank;

        document.getElementById('trail-text').textContent = `${doneCount}/${MODULES.length} · ${getOverallProgress()}%`;
        document.getElementById('trail-segments').innerHTML = MODULES.map((m, i) => {
            let cls = 'seg';
            if (isDone(m.id)) cls += ' is-done';
            else if (state.view === 'module' && i === state.currentIdx) cls += ' is-active';
            return `<span class="${cls}" title="${m.title}"></span>`;
        }).join('');

        const dueCount = dueReviewIds().length;
        document.getElementById('hud-due-wrap').hidden = !dueCount;
        document.getElementById('hud-due').textContent = dueCount;
    }

    // ==========================================================
    // EVENTOS GLOBAIS
    // ==========================================================

    // Seleção visual das alternativas (vale para todas as telas)
    $mount.addEventListener('click', e => {
        const btn = e.target.closest('.option-btn');
        if (!btn || btn.disabled) return;
        const group = btn.closest('.options-grid');
        if (!group) return;
        group.querySelectorAll('.option-btn').forEach(b => {
            b.classList.remove('selected');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
    });

    // Sidebar no celular
    function openSidebar() {
        $sidebar.classList.add('open');
        $overlay.classList.add('show');
        $toggle.setAttribute('aria-expanded', 'true');
    }

    function closeSidebar() {
        $sidebar.classList.remove('open');
        $overlay.classList.remove('show');
        $toggle.setAttribute('aria-expanded', 'false');
    }

    $toggle.addEventListener('click', openSidebar);
    $overlay.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeSidebar();
    });

    document.getElementById('hud-due-wrap').addEventListener('click', () => goTo('srs'));

    document.getElementById('reset-progress').addEventListener('click', () => {
        if (!confirm('Apagar todo o progresso salvo neste navegador? Essa ação não pode ser desfeita.')) return;
        try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
        location.reload();
    });

    // ==========================================================
    // INICIALIZAÇÃO
    // ==========================================================
    loadState();

    // Abre no primeiro módulo ainda não concluído
    const firstIncomplete = MODULES.findIndex(m => !isDone(m.id));
    state.currentIdx = firstIncomplete !== -1 ? firstIncomplete : MODULES.length - 1;
    state.view = 'module';

    render();

    console.log('🚀 Mathesis carregado. Atalhos de teste em window.__mathesis (skipDays, completeAll, reset).');

    // Expor para debug
    window.__mathesis = {
        state: state,
        MODULES: MODULES,
        FINAL_CHALLENGE: FINAL_CHALLENGE,
        render: render,
        goTo: goTo,
        // Atalhos úteis para testar sem esperar dias reais
        skipDays: function (n) {
            state.timeOffsetDays = (state.timeOffsetDays || 0) + n;
            saveState();
            render();
        },
        completeAll: function () {
            MODULES.forEach(m => {
                state.progress[m.id].verificationCorrect = m.verification.length;
                markModuleDone(m);
            });
            saveState();
            render();
        },
        reset: function () {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    };
})();
