/**
 * CreativityCardsGame — Standalone (no WordPress dependency)
 * עיצוב: עץ + קלפי נייר מחברת + כפתורים צהוב/כתום
 */
class CreativityCardsGame {
    constructor(container, config = {}) {
        this.container = container;
        this.container.classList.add('creativity-cards-root');
        this.config = this.normalizeConfig(config);
        this.state = {
            allCards: [],
            deck: [],
            usedCards: [],
            currentCard: null,
            statusTimeout: null
        };

        this.styleId = `ccg-style-${container.id || Math.random().toString(36).slice(2)}`;
        this.scopeSelector = container.id ? `#${this.escapeSelector(container.id)}` : '.creativity-cards-root';

        this.injectStyles();
        this.renderLoading();
        this.loadCards();
    }

    normalizeConfig(config) {
        const toBool = (value, fallback = false) => {
            if (typeof value === 'boolean') return value;
            if (value === undefined || value === null) return fallback;
            return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
        };
        const toInt = (value, fallback = 0) => {
            const parsed = parseInt(value, 10);
            return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
        };

        const normalized = {
            start_title:                config.start_title                || 'מכירים את הרגע שהראש נחסם?',
            start_subtitle:             config.start_subtitle             || 'באמצע עבודה שמצריכה ריכוז והרעיונות נגמרו? הכרטיסים האלה נבנו במיוחד בשבילכם — כל קלף פותח הראש אחרת.',
            start_button_label:         config.start_button_label         || 'יאללה, בואי ננסה משהו חדש',
            shuffle_screen_text:        config.shuffle_screen_text        || 'מוכנים להיות יצירתיים? מתחו אצבעות, שנסו מותניים ולחצו על הכפתור.',
            cards_source:              (config.cards_source || 'manual').toLowerCase(),
            cards_manual:               config.cards_manual               || '[]',
            cards_sheet_url:            config.cards_sheet_url            || '',
            cards_sheet_gid:            config.cards_sheet_gid            || '0',
            cards_per_session:          toInt(config.cards_per_session, 6),
            followup_button_label:      config.followup_button_label      || 'רוצה כיוון נוסף',
            encouragement_button_label: config.encouragement_button_label || 'אני הולכת לבצע את הקלף שלי עכשיו!',
            new_card_button_label:      config.new_card_button_label      || 'ערבב ושלוף לי קלף יצירתי',
            encouragement_default:      config.encouragement_default      || 'איזה אומץ! לכי תנסי ונשמח לשמוע איך היה.',
            allow_sharing:              toBool(config.allow_sharing, true),
            share_button_label:         config.share_button_label         || 'שתפי את הקלף',
            // עיצוב
            assets_url:      config.assets_url      || './assets/',
            primary_color:   config.primary_color   || '#F5C500',
            secondary_color: config.secondary_color || '#FF7A00',
            accent_color:    config.accent_color    || '#E88C78',
            text_color:      config.text_color      || '#2a2a2a',
            card_text_color: config.card_text_color || '#2a2a2a',
            font_family:     config.font_family     || 'Heebo'
        };

        if (normalized.cards_per_session < 1) normalized.cards_per_session = 1;
        return normalized;
    }

    escapeSelector(id) {
        return String(id).replace(/([^a-zA-Z0-9_-])/g, '\\$1');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CSS
    // ─────────────────────────────────────────────────────────────────────────
    injectStyles() {
        if (document.getElementById(this.styleId)) return;

        const a   = this.config.assets_url;
        const s   = this.scopeSelector;
        const ff  = this.config.font_family;
        const tc  = this.config.text_color;
        const pc  = this.config.primary_color;
        const sc  = this.config.secondary_color;
        const ac  = this.config.accent_color;
        const ctc = this.config.card_text_color;

        const style = document.createElement('style');
        style.id    = this.styleId;
        style.textContent = `
            /* ── base ─────────────────────────────────────────────────── */
            ${s} .ccg {
                font-family: '${ff}', 'Assistant', 'Rubik', 'Arial', sans-serif;
                color: ${tc};
                direction: rtl;
                box-sizing: border-box;
            }
            ${s} .ccg *, ${s} .ccg *::before, ${s} .ccg *::after { box-sizing: inherit; }
            ${s} .ccg button { font-family: inherit; }

            /* ── shared screen layout ──────────────────────────────────── */
            ${s} .ccg-start-screen,
            ${s} .ccg-selection,
            ${s} .ccg-card-open,
            ${s} .ccg-empty-state {
                min-height: 100dvh;
                display: flex;
                flex-direction: column;
                position: relative;
            }

            /* ── מסך פתיחה ─────────────────────────────────────────────── */
            ${s} .ccg-start-screen {
                background: ${a ? `url('${a}bg-main.png') center center / cover no-repeat` : '#FFF5E0'};
                align-items: center;
                justify-content: center;
            }
            ${s} .ccg-start-overlay {
                background: rgba(255,255,255,0.88);
                backdrop-filter: blur(4px);
                border-radius: 20px;
                padding: clamp(24px,3vw,40px) clamp(20px,4vw,56px);
                margin: clamp(16px,4vw,40px);
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
                box-shadow: 0 8px 40px rgba(0,0,0,.15);
                max-width: 640px;
                width: 100%;
            }
            ${s} .ccg-start-heading {
                font-size: clamp(28px,4vw,46px);
                font-weight: 800;
                color: ${ctc};
                margin: 0;
                line-height: 1.2;
            }
            ${s} .ccg-start-subtitle {
                font-size: clamp(15px,2vw,20px);
                margin: 0;
                color: #555;
                line-height: 1.7;
                max-width: 520px;
            }

            /* ── עמודים פנימיים ─────────────────────────────────────────── */
            ${s} .ccg-selection,
            ${s} .ccg-card-open,
            ${s} .ccg-empty-state {
                background: ${a ? `url('${a}bg-main.png') center center / cover no-repeat` : '#FDF6EC'};
                padding: clamp(20px,3vw,40px);
                gap: 20px;
            }

            /* תוכן פנימי ממורכז ורחב מקסימום */
            ${s} .ccg-selection > *,
            ${s} .ccg-card-open > * {
                max-width: 760px;
                width: 100%;
                margin-left: auto;
                margin-right: auto;
            }

            /* ── כפתורים ────────────────────────────────────────────────── */
            ${s} .ccg-btn-primary {
                background: ${pc};
                color: #1a1a1a;
                border: 2.5px solid #1a1a1a;
                border-radius: 60px;
                padding: 14px 36px;
                font-size: clamp(16px,2vw,20px);
                font-weight: 700;
                cursor: pointer;
                position: relative;
                transition: transform .15s ease, box-shadow .15s ease;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                box-shadow: 3px 3px 0 #1a1a1a;
                align-self: center;
            }
            ${s} .ccg-btn-primary:hover { transform: translate(-2px,-2px); box-shadow: 5px 5px 0 #1a1a1a; }
            ${s} .ccg-btn-primary:active { transform: translate(1px,1px); box-shadow: 1px 1px 0 #1a1a1a; }

            ${s} .ccg-btn-outline {
                background: rgba(255,255,255,.85);
                color: #1a1a1a;
                border: 2px solid #1a1a1a;
                border-radius: 60px;
                padding: 10px 24px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: background .2s ease;
            }
            ${s} .ccg-btn-outline:hover { background: #fff; }

            /* ── meta row ───────────────────────────────────────────────── */
            ${s} .ccg-meta-row {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: rgba(0,0,0,.55);
                background: rgba(255,255,255,.6);
                border-radius: 12px;
                padding: 8px 14px;
            }

            /* ── גבות קלפים ─────────────────────────────────────────────── */
            ${s} .ccg-card-grid {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                align-items: flex-end;
                gap: 10px;
                padding: 24px 8px;
                min-height: 220px;
            }
            ${s} .ccg-card-back {
                position: relative;
                width: 110px;
                height: 165px;
                border-radius: 12px;
                cursor: pointer;
                border: none;
                padding: 0;
                background: transparent;
                transition: transform .3s cubic-bezier(.175,.885,.32,1.275), filter .2s ease;
                transform-origin: bottom center;
            }
            ${s} .ccg-card-back img {
                width: 100%; height: 100%;
                object-fit: contain;
                border-radius: 12px;
                pointer-events: none;
                display: block;
            }
            ${s} .ccg-card-back:nth-child(1) { transform: rotate(-14deg) translateY(8px); }
            ${s} .ccg-card-back:nth-child(2) { transform: rotate(-9deg)  translateY(4px); }
            ${s} .ccg-card-back:nth-child(3) { transform: rotate(-4deg); }
            ${s} .ccg-card-back:nth-child(4) { transform: rotate(1deg); }
            ${s} .ccg-card-back:nth-child(5) { transform: rotate(6deg)  translateY(4px); }
            ${s} .ccg-card-back:nth-child(6) { transform: rotate(11deg) translateY(8px); }
            ${s} .ccg-card-back:nth-child(7) { transform: rotate(16deg) translateY(12px); }
            ${s} .ccg-card-back:nth-child(8) { transform: rotate(21deg) translateY(16px); }
            ${s} .ccg-card-back:hover {
                transform: translateY(-24px) scale(1.08) !important;
                filter: drop-shadow(0 12px 20px rgba(0,0,0,.25));
                z-index: 10;
            }

            ${s} .ccg-shuffle-text {
                text-align: center;
                font-size: clamp(15px,2vw,18px);
                color: #444;
                background: rgba(255,255,255,.75);
                border-radius: 12px;
                padding: 12px 20px;
                line-height: 1.6;
            }

            /* ── קלף פתוח — נייר מחברת ─────────────────────────────────── */
            ${s} .ccg-card-shell {
                position: relative;
                background: #FFF8F2;
                background-image: repeating-linear-gradient(
                    transparent, transparent 27px,
                    #E8D8C4 27px, #E8D8C4 28px
                );
                border-radius: 4px 4px 6px 6px;
                padding: 48px clamp(20px,3vw,36px) clamp(24px,3vw,36px);
                color: ${ctc};
                max-width: 600px;
                width: 100%;
                margin: 0 auto;
                -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 520' preserveAspectRatio='none'%3E%3Cpath d='M0,12 Q8,0 16,10 Q24,20 32,8 Q40,0 48,10 Q56,20 64,6 Q72,0 80,10 Q88,20 96,4 Q104,0 112,10 Q120,20 128,8 Q136,0 144,10 Q152,20 160,4 Q168,0 176,8 Q184,18 192,6 Q200,0 208,10 Q216,20 224,8 Q232,0 240,10 Q248,20 256,4 Q264,0 272,10 Q280,20 288,6 Q296,0 304,10 Q312,20 320,8 Q328,0 336,10 Q344,20 352,6 Q360,0 368,10 Q376,20 384,8 Q392,0 400,10 L400,510 Q392,520 384,510 Q376,500 368,514 Q360,520 352,510 Q344,500 336,514 Q328,520 320,510 Q312,500 304,514 Q296,520 288,510 Q280,500 272,514 Q264,520 256,510 Q248,500 240,514 Q232,520 224,510 Q216,500 208,514 Q200,520 192,510 Q184,500 176,514 Q168,520 160,510 Q152,500 144,514 Q136,520 128,510 Q120,500 112,514 Q104,520 96,510 Q88,500 80,514 Q72,520 64,510 Q56,500 48,514 Q40,520 32,510 Q24,500 16,514 Q8,520 0,510 Z'/%3E%3C/svg%3E");
                mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 520' preserveAspectRatio='none'%3E%3Cpath d='M0,12 Q8,0 16,10 Q24,20 32,8 Q40,0 48,10 Q56,20 64,6 Q72,0 80,10 Q88,20 96,4 Q104,0 112,10 Q120,20 128,8 Q136,0 144,10 Q152,20 160,4 Q168,0 176,8 Q184,18 192,6 Q200,0 208,10 Q216,20 224,8 Q232,0 240,10 Q248,20 256,4 Q264,0 272,10 Q280,20 288,6 Q296,0 304,10 Q312,20 320,8 Q328,0 336,10 Q344,20 352,6 Q360,0 368,10 Q376,20 384,8 Q392,0 400,10 L400,510 Q392,520 384,510 Q376,500 368,514 Q360,520 352,510 Q344,500 336,514 Q328,520 320,510 Q312,500 304,514 Q296,520 288,510 Q280,500 272,514 Q264,520 256,510 Q248,500 240,514 Q232,520 224,510 Q216,500 208,514 Q200,520 192,510 Q184,500 176,514 Q168,520 160,510 Q152,500 144,514 Q136,520 128,510 Q120,500 112,514 Q104,520 96,510 Q88,500 80,514 Q72,520 64,510 Q56,500 48,514 Q40,520 32,510 Q24,500 16,514 Q8,520 0,510 Z'/%3E%3C/svg%3E");
                -webkit-mask-size: 100% 100%;
                mask-size: 100% 100%;
                box-shadow: 2px 6px 24px rgba(0,0,0,.14);
            }
            /* סלוטייפ ורוד */
            ${s} .ccg-card-shell::before {
                content: '';
                position: absolute;
                top: -8px;
                left: 50%;
                transform: translateX(-50%) rotate(-2deg);
                width: 72px; height: 28px;
                background: rgba(230,140,120,.65);
                border-radius: 3px;
                box-shadow: 0 1px 4px rgba(0,0,0,.15);
                z-index: 5;
            }
            ${s} .ccg-card-title {
                font-size: clamp(20px,2.8vw,26px);
                font-weight: 800;
                color: ${ctc};
                margin: 0 0 16px;
                line-height: 1.3;
            }
            ${s} .ccg-card-prompt {
                font-size: clamp(17px,2.2vw,21px);
                line-height: 1.85;
                color: ${ctc};
                margin-bottom: 20px;
            }
            ${s} .ccg-followup-box,
            ${s} .ccg-encouragement-box {
                background: rgba(255,245,220,.85);
                border-right: 4px solid ${ac};
                border-radius: 8px;
                padding: 16px 20px;
                font-size: clamp(15px,2vw,18px);
                line-height: 1.7;
                margin-top: 14px;
                display: none;
            }
            ${s} .ccg-followup-box.active,
            ${s} .ccg-encouragement-box.active {
                display: block;
                animation: ccgFadeIn .35s ease;
            }

            /* ── כפתורי פעולה ────────────────────────────────────────────── */
            ${s} .ccg-card-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                margin-top: 24px;
                justify-content: center;
            }
            ${s} .ccg-card-actions button {
                border-radius: 60px;
                padding: 12px 24px;
                font-size: clamp(13px,1.8vw,16px);
                font-weight: 700;
                cursor: pointer;
                transition: transform .15s ease, box-shadow .15s ease;
                white-space: normal;
                word-wrap: break-word;
                min-height: 48px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                border: 2.5px solid #1a1a1a;
                box-shadow: 3px 3px 0 #1a1a1a;
                gap: 6px;
            }
            ${s} .ccg-card-actions button:hover  { transform: translate(-2px,-2px); box-shadow: 5px 5px 0 #1a1a1a; }
            ${s} .ccg-card-actions button:active { transform: translate(1px,1px);   box-shadow: 1px 1px 0 #1a1a1a; }
            ${s} .ccg-card-actions button[data-action="followup"]      { background: #FFF8F0; color: #1a1a1a; }
            ${s} .ccg-card-actions button[data-action="encouragement"] { background: ${pc};   color: #1a1a1a; }
            ${s} .ccg-card-actions button[data-action="new"]           { background: ${sc};   color: #fff; }

            /* ── שיתוף ──────────────────────────────────────────────────── */
            ${s} .ccg-share-button {
                background: rgba(255,255,255,.8);
                color: #333;
                border: 1.5px solid rgba(0,0,0,.2);
                border-radius: 60px;
                padding: 8px 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                transition: background .2s ease;
            }
            ${s} .ccg-share-button:hover { background: #fff; }

            /* ── status / loader / empty ────────────────────────────────── */
            ${s} .ccg-status {
                border-radius: 14px; padding: 10px 16px;
                font-size: 14px; background: rgba(255,255,255,.75);
                color: ${tc}; display: none; text-align: center;
            }
            ${s} .ccg-status.visible { display: block; animation: ccgFadeIn .35s ease; }

            ${s} .ccg-empty-card {
                background: rgba(255,255,255,.88);
                border-radius: 20px;
                padding: clamp(24px,3vw,40px);
                text-align: center;
                display: flex; flex-direction: column;
                gap: 16px; align-items: center;
                margin: auto;
                box-shadow: 0 4px 20px rgba(0,0,0,.1);
            }
            ${s} .ccg-empty-card h3 { margin: 0; font-size: clamp(20px,3vw,26px); }
            ${s} .ccg-empty-card p  { margin: 0; font-size: 16px; opacity: .7; }

            ${s} .ccg-loader {
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                gap: 16px; min-height: 280px;
                background: #FDF6EC; border-radius: 24px;
            }
            ${s} .ccg-spinner {
                border: 4px solid rgba(0,0,0,.08);
                border-top-color: ${pc};
                border-radius: 50%; width: 48px; height: 48px;
                animation: ccgSpin .9s linear infinite;
            }

            /* ── אנימציות ───────────────────────────────────────────────── */
            @keyframes ccgSpin   { to { transform: rotate(360deg); } }
            @keyframes ccgFadeIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform:translateY(0); } }
            @keyframes ccgCardFlip {
                0%  { transform: rotateY(0deg)  scale(1);   }
                50% { transform: rotateY(90deg) scale(.9);  }
                100%{ transform: rotateY(0deg)  scale(1);   }
            }
            ${s} .ccg-card-back.flipping { animation: ccgCardFlip .5s ease-in-out; }

            /* ── מובייל ─────────────────────────────────────────────────── */
            @media (max-width: 680px) {
                ${s} .ccg-card-back { width: 88px; height: 132px; }
                ${s} .ccg-card-grid { padding: 16px 4px; gap: 6px; }
                ${s} .ccg-card-actions { flex-direction: column; align-items: stretch; }
                ${s} .ccg-card-actions button { width: 100%; padding: 14px 20px; font-size: 15px; }
            }
        `;
        document.head.appendChild(style);
    }

    // ─────────────────────────────────────────────────────────────────────────
    renderLoading() {
        this.container.innerHTML = `
            <div class="ccg ccg-loader" role="status" aria-live="polite">
                <div class="ccg-spinner" aria-hidden="true"></div>
                <div>טוענים את הקלפים...</div>
            </div>`;
    }

    renderStartScreen() {
        this.container.innerHTML = `
            <div class="ccg ccg-start-screen">
                <div class="ccg-start-overlay">
                    <h1 class="ccg-start-heading">${this.config.start_title}</h1>
                    <p class="ccg-start-subtitle">${this.config.start_subtitle}</p>
                    <button type="button" class="ccg-btn-primary ccg-start-btn">
                        <span>${this.config.start_button_label}</span>
                        <span>🖱️</span>
                    </button>
                </div>
            </div>`;
        this.container.querySelector('.ccg-start-btn')
            ?.addEventListener('click', () => this.renderCardSelection());
    }

    renderCardSelection() {
        if (!this.state.deck.length) { this.renderDeckEmpty(); return; }

        const count     = Math.min(this.config.cards_per_session, this.state.deck.length);
        const total     = this.state.allCards.length;
        const remaining = this.state.deck.length;
        const cardImg   = this.config.assets_url
            ? `<img src="${this.config.assets_url}card-back.png" alt="גב קלף" loading="lazy">`
            : `<span style="font-size:28px">🃏</span>`;

        this.container.innerHTML = `
            <div class="ccg ccg-selection">
                <div class="ccg-meta-row">
                    <span>בחרי קלף מעורר השראה</span>
                    <span>נשארו ${remaining} מתוך ${total} קלפים</span>
                </div>
                <p class="ccg-shuffle-text">${this.config.shuffle_screen_text}</p>
                <div class="ccg-card-grid">
                    ${Array.from({length: count}, (_, idx) => `
                        <button type="button" class="ccg-card-back"
                                data-deck-index="${idx}"
                                aria-label="קלף מספר ${idx + 1}">
                            ${cardImg}
                        </button>`).join('')}
                </div>
            </div>`;

        this.container.querySelectorAll('.ccg-card-back').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.getAttribute('data-deck-index') || '0', 10);
                this.revealCard(i, btn);
            });
        });
    }

    revealCard(deckIndex, clickedButton = null) {
        if (!this.state.deck.length || deckIndex >= this.state.deck.length) {
            this.renderDeckEmpty(); return;
        }
        if (clickedButton) clickedButton.classList.add('flipping');
        setTimeout(() => {
            const [card] = this.state.deck.splice(deckIndex, 1);
            this.state.usedCards.push(card);
            this.state.currentCard = card;
            this.renderCard(card);
        }, 300);
    }

    renderCard(card) {
        const remaining    = this.state.deck.length;
        const total        = this.state.allCards.length;
        const encouragement = card.encouragement || this.config.encouragement_default;
        const newBtnLabel  = remaining ? this.config.new_card_button_label : 'ערבוב מחדש 🔀';

        this.container.innerHTML = `
            <div class="ccg ccg-card-open">
                <div class="ccg-meta-row">
                    <button type="button" class="ccg-btn-outline ccg-back-to-selection">← חזרה לקלפים</button>
                    <span>נותרו ${remaining} מתוך ${total} קלפים</span>
                </div>
                <div class="ccg-card-shell">
                    <h2 class="ccg-card-title">${card.title || 'קלף יצירתיות'}</h2>
                    <div class="ccg-card-prompt">${card.prompt}</div>
                    <div class="ccg-followup-box"    id="ccg-followup"></div>
                    <div class="ccg-encouragement-box" id="ccg-encouragement"></div>
                    <div class="ccg-card-actions">
                        <button type="button" data-action="followup">💡 ${this.config.followup_button_label}</button>
                        <button type="button" data-action="encouragement">✨ ${this.config.encouragement_button_label}</button>
                        <button type="button" data-action="new">🖱️ ${newBtnLabel}</button>
                    </div>
                    ${this.config.allow_sharing ? `
                        <div style="margin-top:20px;text-align:center">
                            <button type="button" class="ccg-share-button" data-action="share">
                                🔗 ${this.config.share_button_label}
                            </button>
                        </div>` : ''}
                </div>
                <div class="ccg-status" aria-live="polite"></div>
            </div>`;

        const followUpBox      = this.container.querySelector('#ccg-followup');
        const encouragementBox = this.container.querySelector('#ccg-encouragement');

        this.container.querySelector('[data-action="followup"]')?.addEventListener('click', () => {
            if (card.follow_up) {
                followUpBox.textContent = card.follow_up;
                followUpBox.classList.add('active');
                this.showStatus('קיבלת כיוון נוסף להמשך.', 'info');
            } else {
                this.showStatus('לקלף הזה אין המשך נוסף, נסי קלף חדש!', 'warning');
            }
        });
        this.container.querySelector('[data-action="encouragement"]')?.addEventListener('click', () => {
            encouragementBox.textContent = encouragement;
            encouragementBox.classList.add('active');
            this.showStatus('איזו בחירה מצוינת! לכי על זה.', 'success');
        });
        this.container.querySelector('[data-action="new"]')?.addEventListener('click', () => {
            if (!this.state.deck.length) this.resetDeck();
            this.renderCardSelection();
        });
        this.container.querySelector('.ccg-back-to-selection')?.addEventListener('click', () => {
            this.renderCardSelection();
        });
        this.container.querySelector('[data-action="share"]')?.addEventListener('click', () => {
            this.shareCard(card);
        });
    }

    renderDeckEmpty() {
        this.container.innerHTML = `
            <div class="ccg ccg-empty-state">
                <div class="ccg-empty-card">
                    <div style="font-size:56px">🃏</div>
                    <h3>כל הקלפים נפתחו!</h3>
                    <p>בואי נערבב אותם מחדש ונמשיך לחפש השראה חדשה.</p>
                    <button type="button" class="ccg-btn-primary ccg-reset">
                        <span>ערבוב מחדש</span><span>🖱️</span>
                    </button>
                </div>
            </div>`;
        this.container.querySelector('.ccg-reset')?.addEventListener('click', () => {
            this.resetDeck(); this.renderCardSelection();
        });
    }

    showError(message) {
        const isHTML = /<[a-z][\s\S]*>/i.test(message);
        this.container.innerHTML = `
            <div class="ccg ccg-empty-state">
                <div class="ccg-empty-card">
                    <div style="font-size:48px">😕</div>
                    <h3>אופס...</h3>
                    ${isHTML ? message : `<p>${message}</p>`}
                </div>
            </div>`;
    }

    showStatus(message, type = 'info') {
        const el = this.container.querySelector('.ccg-status');
        if (!el) return;
        if (this.state.statusTimeout) clearTimeout(this.state.statusTimeout);
        el.textContent = message;
        el.dataset.type = type;
        el.classList.add('visible');
        this.state.statusTimeout = setTimeout(() => el.classList.remove('visible'), 4000);
    }

    async shareCard(card) {
        const text = card.share_text || `${card.title ? card.title + ' — ' : ''}${card.prompt}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: card.title || 'קלף יצירתיות', text });
                this.showStatus('שלחנו את הקלף לשיתוף!', 'success');
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                this.showStatus('הקלף הועתק ללוח. אפשר לשתף אותו בכל מקום.', 'success');
            } else {
                this.showStatus('הדפדפן לא תומך בשיתוף אוטומטי.', 'warning');
            }
        } catch {
            this.showStatus('לא הצלחנו לשתף עכשיו.', 'warning');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Data loading
    // ─────────────────────────────────────────────────────────────────────────
    async loadCards() {
        try {
            let cards = [];
            const fromSheet =
                this.config.cards_source === 'google_sheet' ||
                (this.config.cards_sheet_url && this.config.cards_sheet_url.includes('docs.google.com'));

            if (fromSheet && this.config.cards_sheet_url) {
                try {
                    cards = await this.fetchCardsFromGoogleSheet(
                        this.config.cards_sheet_url, this.config.cards_sheet_gid);
                } catch (e) {
                    console.warn('[CreativityCards] Sheet failed, fallback to manual:', e);
                    cards = this.parseManualCards(this.config.cards_manual);
                }
            } else {
                cards = this.parseManualCards(this.config.cards_manual);
            }

            if (!Array.isArray(cards) || !cards.length)
                cards = this.parseManualCards(this.config.cards_manual);

            cards = this.sanitiseCards(cards);
            if (!cards.length) throw new Error('No valid cards supplied');

            this.state.allCards = cards;
            this.resetDeck();
            this.renderStartScreen();
        } catch (err) {
            console.error('[CreativityCards]', err);
            this.showError(err.message?.includes('Google Sheet')
                ? `<h3>בעיה בטעינת Google Sheet</h3>
                   <p>ודאי שהגיליון פתוח לצפייה ציבורית (שיתוף → כל מי שיש לו קישור).</p>`
                : 'לא הצלחנו לטעון קלפים. נסי לרענן את העמוד.');
        }
    }

    parseManualCards(raw) {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
            const t = raw.trim();
            if (!t) return [];
            try {
                const p = JSON.parse(t);
                if (Array.isArray(p)) return p;
            } catch {
                return t.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(line => {
                    const parts = line.split('||');
                    return {
                        title: parts[1] ? parts[0].trim() : '',
                        prompt: parts[1] ? parts[1].trim() : parts[0].trim(),
                        follow_up: parts[2]?.trim() || '',
                        encouragement: parts[3]?.trim() || ''
                    };
                });
            }
        }
        return [];
    }

    sanitiseCards(cards) { return cards.map((c, i) => this.sanitiseCard(c, i)).filter(Boolean); }
    sanitiseCard(card, index) {
        if (!card) return null;
        const prompt = (card.prompt || card.text || card.body || '').trim();
        if (!prompt) return null;
        return {
            title:         (card.title || card.heading || `קלף ${index + 1}`).toString().trim(),
            prompt,
            follow_up:     (card.follow_up || card.followup || '').trim(),
            encouragement: (card.encouragement || '').trim(),
            share_text:    (card.share_text || card.share || '').trim()
        };
    }

    async fetchCardsFromGoogleSheet(sheetUrl, gid = '0') {
        const url   = new URL(sheetUrl);
        const parts = url.pathname.split('/').filter(p => p);
        const idx   = parts.indexOf('d');
        const sheetId = idx >= 0 && idx + 1 < parts.length ? parts[idx + 1] : null;
        if (!sheetId) throw new Error('Could not extract sheet ID from URL');

        const formats = [
            `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid || '0'}`,
            `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid || '0'}`
        ];

        let lastErr = null;
        for (const csvUrl of formats) {
            try {
                const res = await fetch(csvUrl, { credentials: 'omit', mode: 'cors', cache: 'no-cache' });
                if (!res.ok) { lastErr = new Error(`HTTP ${res.status}`); continue; }
                const text = await res.text();
                if (text.trim().startsWith('<')) { lastErr = new Error('Got HTML instead of CSV'); continue; }
                const { headers, rows } = this.parseCsv(text);
                return rows.map(r => this.mapRowToCard(r, headers)).filter(Boolean);
            } catch (e) { lastErr = e; }
        }
        throw new Error(`Google Sheet load failed: ${lastErr?.message}`);
    }

    parseCsv(text) {
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) return { headers: [], rows: [] };
        return {
            headers: this.parseCsvLine(lines[0]).map(h => h.trim().toLowerCase()),
            rows:    lines.slice(1).map(l => this.parseCsvLine(l))
        };
    }
    parseCsvLine(line) {
        const r = []; let cur = '', inQ = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
            else if (c === ',' && !inQ) { r.push(cur.trim()); cur = ''; }
            else cur += c;
        }
        r.push(cur.trim()); return r;
    }
    mapRowToCard(vals, hdrs) {
        if (!vals || !hdrs) return null;
        const get = (...keys) => { for (const k of keys) { const i = hdrs.indexOf(k); if (i !== -1 && vals[i]?.trim()) return vals[i].trim(); } return ''; };
        const prompt = get('prompt','card','text','question','תוכן','רעיון','משימה');
        if (!prompt) return null;
        return {
            title:         get('title','כותרת','card_title','heading'),
            prompt,
            follow_up:     get('follow_up','followup','המשך','רעיון המשך'),
            encouragement: get('encouragement','עידוד','celebration'),
            share_text:    get('share_text','share','שיתוף')
        };
    }

    resetDeck() {
        this.state.deck      = this.shuffle([...this.state.allCards]);
        this.state.usedCards = [];
        this.state.currentCard = null;
    }
    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}

window.CreativityCardsGame = CreativityCardsGame;
