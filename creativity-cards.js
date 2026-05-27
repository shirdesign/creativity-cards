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
            select_button_label:        config.select_button_label        || 'בחרו קלף השראה',
            cards_source:              (config.cards_source || 'manual').toLowerCase(),
            cards_manual:               config.cards_manual               || '[]',
            cards_sheet_url:            config.cards_sheet_url            || '',
            cards_sheet_gid:            config.cards_sheet_gid            || '0',
            cards_per_session:          toInt(config.cards_per_session, 6),
            followup_button_label:      config.followup_button_label      || 'רוצה כיוון נוסף',
            encouragement_button_label: config.encouragement_button_label || 'הולך לבצע',
            new_card_button_label:      config.new_card_button_label      || 'ערבב ושלוף לי קלף יצירתי',
            encouragement_default:      config.encouragement_default      || 'איזה אומץ! לכי תנסי ונשמח לשמוע איך היה.',
            allow_sharing:              toBool(config.allow_sharing, false),
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
        const ctc = this.config.card_text_color;

        const style = document.createElement('style');
        style.id    = this.styleId;
        style.textContent = `
            /* ── כתב יד — OHEyalMeirBerkowitz ──────────────────────────── */
            @font-face {
                font-family: 'OHEyalMeirBerkowitz';
                src: url('${a}OHEyalMeirBerkowitz-Regular.woff2') format('woff2'),
                     url('${a}OHEyalMeirBerkowitz-Regular.woff')  format('woff');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
            }

            /* ── base ─────────────────────────────────────────────────── */
            ${s} .ccg {
                font-family: '${ff}', 'Assistant', 'Rubik', 'Arial', sans-serif;
                color: ${tc};
                direction: rtl;
                box-sizing: border-box;
            }
            ${s} .ccg *, ${s} .ccg *::before, ${s} .ccg *::after { box-sizing: inherit; }
            ${s} .ccg button { font-family: '${ff}', 'Assistant', 'Rubik', 'Arial', sans-serif; }

            /* ── all screens share bg-main ─────────────────────────────── */
            ${s} .ccg-start-screen,
            ${s} .ccg-selection,
            ${s} .ccg-card-open,
            ${s} .ccg-empty-state {
                min-height: 100dvh;
                display: flex;
                flex-direction: column;
                position: relative;
                background: ${a ? `url('${a}bg-main.png') center center / cover no-repeat` : '#FFF5E0'};
            }

            /* ── מסך פתיחה ─────────────────────────────────────────────── */
            ${s} .ccg-start-screen {
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

            /* ── מסך בחירת קלף ─────────────────────────────────────────── */
            ${s} .ccg-selection {
                align-items: center;
                justify-content: center;
            }
            ${s} .ccg-stack-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 36px;
                padding: 48px 24px;
            }
            ${s} .ccg-stack-img {
                max-width: min(280px, 68vw);
                width: 100%;
                height: auto;
                display: block;
                filter: drop-shadow(0 8px 28px rgba(0,0,0,.22));
                cursor: pointer;
                transition: transform .25s cubic-bezier(.175,.885,.32,1.275), filter .2s ease;
            }
            ${s} .ccg-stack-img:hover {
                transform: translateY(-8px) scale(1.03);
                filter: drop-shadow(0 16px 36px rgba(0,0,0,.3));
            }

            /* ── כפתורים משותפים ────────────────────────────────────────── */
            ${s} .ccg-btn-primary {
                background: ${pc};
                color: #1a1a1a;
                border: 2.5px solid #1a1a1a;
                border-radius: 60px;
                padding: 16px clamp(32px,4vw,52px);
                font-size: clamp(17px,2.2vw,22px);
                font-weight: 700;
                cursor: pointer;
                transition: transform .15s ease, box-shadow .15s ease;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                box-shadow: 3px 3px 0 #1a1a1a;
                text-align: center;
            }
            ${s} .ccg-btn-primary:hover  { transform: translate(-2px,-2px); box-shadow: 5px 5px 0 #1a1a1a; }
            ${s} .ccg-btn-primary:active { transform: translate(1px,1px);   box-shadow: 1px 1px 0 #1a1a1a; }

            ${s} .ccg-btn-secondary {
                background: ${sc};
                color: #fff;
                border: 2.5px solid #1a1a1a;
                border-radius: 60px;
                padding: 14px clamp(24px,3vw,44px);
                font-size: clamp(15px,2vw,19px);
                font-weight: 700;
                cursor: pointer;
                transition: transform .15s ease, box-shadow .15s ease;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                box-shadow: 3px 3px 0 #1a1a1a;
                text-align: center;
            }
            ${s} .ccg-btn-secondary:hover  { transform: translate(-2px,-2px); box-shadow: 5px 5px 0 #1a1a1a; }
            ${s} .ccg-btn-secondary:active { transform: translate(1px,1px);   box-shadow: 1px 1px 0 #1a1a1a; }

            /* ── מסך קלף פתוח ───────────────────────────────────────────── */
            ${s} .ccg-card-open {
                align-items: center;
                justify-content: center;
                padding: clamp(20px,3vw,40px) clamp(16px,3vw,32px);
                gap: 24px;
            }

            /* קלף — תמונה + שכבת טקסט (CSS Grid: שניהם בתא אחד, ללא position:absolute) */
            ${s} .ccg-card-visual-wrapper {
                display: grid;
                grid-template-areas: "card";
                max-width: min(480px, 88vw);
                width: 100%;
                /* aspect-ratio לפי card-front.png: 1118×1677 */
                aspect-ratio: 1118 / 1677;
                animation: ccgCardIn .45s cubic-bezier(.215,.61,.355,1);
            }
            ${s} .ccg-card-img {
                grid-area: card;
                width: 100%;
                height: 100%;
                object-fit: contain;
                display: block;
                user-select: none;
                pointer-events: none;
                filter: drop-shadow(0 8px 30px rgba(0,0,0,.22));
            }
            /* שכבת הטקסט — גם היא בתא "card", מסודרת מעל התמונה */
            ${s} .ccg-card-overlay {
                grid-area: card;
                /* padding דוחף את הטקסט לאזור הנייר הלבן שמתחת לסלוטייפ */
                padding: 20% 14% 9% 12%;
                display: flex;
                flex-direction: column;
                gap: 5px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: rgba(0,0,0,.2) transparent;
            }
            ${s} .ccg-card-title {
                font-family: 'OHEyalMeirBerkowitz', 'Heebo', sans-serif;
                font-size: clamp(16px,2.4vw,21px);
                font-weight: normal;
                color: ${ctc};
                margin: 0 0 6px;
                line-height: 1.4;
            }
            ${s} .ccg-card-prompt {
                font-family: 'OHEyalMeirBerkowitz', 'Heebo', sans-serif;
                font-size: clamp(15px,2.2vw,19px);
                line-height: 1.9;
                color: ${ctc};
                margin: 0;
            }

            /* תיבות פרטים נוספים — מתחת לקלף */
            ${s} .ccg-followup-box,
            ${s} .ccg-encouragement-box {
                max-width: min(400px, 88vw);
                width: 100%;
                background: rgba(255,255,255,.9);
                border-radius: 14px;
                padding: 14px 18px;
                font-size: clamp(14px,1.8vw,16px);
                line-height: 1.7;
                color: #333;
                display: none;
                box-shadow: 0 3px 14px rgba(0,0,0,.1);
                backdrop-filter: blur(4px);
            }
            ${s} .ccg-followup-box {
                border-right: 4px solid ${sc};
            }
            ${s} .ccg-encouragement-box {
                border-right: 4px solid ${pc};
            }
            ${s} .ccg-followup-box.active,
            ${s} .ccg-encouragement-box.active {
                display: block;
                animation: ccgFadeIn .35s ease;
            }

            /* כפתורי פעולה */
            ${s} .ccg-card-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 14px;
                justify-content: center;
                max-width: min(400px, 88vw);
                width: 100%;
            }
            /* כפתור "ערבב ושלוף" — תמיד גלוי, סגנון שונה מ-2 הכפתורים הראשיים */
            ${s} .ccg-btn-new {
                display: inline-flex;
                background: rgba(255,255,255,.85);
                color: #1a1a1a;
                border: 2px solid #1a1a1a;
                border-radius: 60px;
                padding: 12px clamp(20px,3vw,36px);
                font-size: clamp(14px,1.8vw,17px);
                font-weight: 700;
                cursor: pointer;
                transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
                box-shadow: 2px 2px 0 #1a1a1a;
                align-items: center;
                justify-content: center;
                gap: 8px;
                text-align: center;
                font-family: '${ff}', 'Assistant', 'Rubik', 'Arial', sans-serif;
            }
            ${s} .ccg-btn-new:hover  { background: #fff; transform: translate(-2px,-2px); box-shadow: 4px 4px 0 #1a1a1a; }
            ${s} .ccg-btn-new:active { transform: translate(1px,1px); box-shadow: 1px 1px 0 #1a1a1a; }

            /* ── status / loader / empty ────────────────────────────────── */
            ${s} .ccg-status {
                border-radius: 14px; padding: 10px 16px;
                font-size: 14px; background: rgba(255,255,255,.75);
                color: ${tc}; display: none; text-align: center;
                max-width: min(400px, 88vw);
            }
            ${s} .ccg-status.visible { display: block; animation: ccgFadeIn .35s ease; }

            ${s} .ccg-empty-state {
                align-items: center;
                justify-content: center;
            }
            ${s} .ccg-empty-card {
                background: rgba(255,255,255,.9);
                border-radius: 20px;
                padding: clamp(24px,3vw,40px);
                text-align: center;
                display: flex; flex-direction: column;
                gap: 16px; align-items: center;
                margin: 24px;
                box-shadow: 0 4px 20px rgba(0,0,0,.12);
                backdrop-filter: blur(4px);
                max-width: 480px;
                width: 100%;
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
            @keyframes ccgCardIn {
                from { opacity: 0; transform: translateY(22px) scale(.95); }
                to   { opacity: 1; transform: translateY(0)    scale(1);   }
            }
            /* אנימציית ערבוב — הערמה מתנדנדת לפני שליפת קלף */
            @keyframes ccgShuffle {
                0%   { transform: rotate(0deg)   translateY(0)    scale(1);    }
                12%  { transform: rotate(-12deg) translateY(-14px) scale(1.06); }
                28%  { transform: rotate(12deg)  translateY(-18px) scale(1.08); }
                44%  { transform: rotate(-9deg)  translateY(-12px) scale(1.05); }
                60%  { transform: rotate(7deg)   translateY(-6px)  scale(1.03); }
                76%  { transform: rotate(-4deg)  translateY(-2px)  scale(1.01); }
                88%  { transform: rotate(2deg)   translateY(0); }
                100% { transform: rotate(0deg)   translateY(0)    scale(1);    }
            }
            ${s} .ccg-stack-img.shuffling {
                animation: ccgShuffle .65s cubic-bezier(.36,.07,.19,.97) forwards;
                cursor: default;
                pointer-events: none;
            }

            /* שורת "קלף חדש" + שיתוף */
            ${s} .ccg-card-bottom-row {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                justify-content: center;
                align-items: center;
                max-width: min(400px, 88vw);
                width: 100%;
            }

            /* טקסט על מסך הבחירה */
            ${s} .ccg-shuffle-text {
                font-size: clamp(14px,1.8vw,17px);
                color: #444;
                background: rgba(255,255,255,.78);
                border-radius: 12px;
                padding: 10px 18px;
                line-height: 1.6;
                text-align: center;
                max-width: min(340px, 82vw);
                backdrop-filter: blur(3px);
            }

            /* כפתור שיתוף */
            ${s} .ccg-share-button {
                background: rgba(255,255,255,.82);
                color: #333;
                border: 1.5px solid rgba(0,0,0,.18);
                border-radius: 60px;
                padding: 10px 22px;
                font-size: clamp(13px,1.6vw,15px);
                font-weight: 600;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                transition: background .2s ease, transform .15s ease;
                font-family: '${ff}', 'Assistant', 'Rubik', 'Arial', sans-serif;
            }
            ${s} .ccg-share-button:hover { background: #fff; transform: translateY(-1px); }

            /* ── מובייל ─────────────────────────────────────────────────── */
            @media (max-width: 480px) {
                ${s} .ccg-card-actions { flex-direction: column; align-items: stretch; }
                ${s} .ccg-card-actions > * { width: 100%; justify-content: center; }
                ${s} .ccg-card-bottom-row { flex-direction: column; align-items: center; }
                ${s} .ccg-btn-new { width: 100%; justify-content: center; }
                ${s} .ccg-share-button { align-self: center; }
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
                        ${this.config.start_button_label}
                    </button>
                </div>
            </div>`;
        this.container.querySelector('.ccg-start-btn')
            ?.addEventListener('click', () => this.renderCardSelection());
    }

    renderCardSelection() {
        if (!this.state.deck.length) { this.renderDeckEmpty(); return; }

        const stackImg = this.config.assets_url
            ? `<img src="${this.config.assets_url}card-stack.png" alt="ערמת קלפים" class="ccg-stack-img" loading="lazy">`
            : `<div style="font-size:80px;text-align:center">🃏</div>`;

        const shuffleText = this.config.shuffle_screen_text
            ? `<p class="ccg-shuffle-text">${this.config.shuffle_screen_text}</p>`
            : '';

        this.container.innerHTML = `
            <div class="ccg ccg-selection">
                <div class="ccg-stack-section">
                    <div class="ccg-stack-clickable">${stackImg}</div>
                    ${shuffleText}
                    <button type="button" class="ccg-btn-primary ccg-pick-btn">
                        ${this.config.select_button_label}
                    </button>
                </div>
            </div>`;

        // גם לחיצה על ערמת הקלפים שולפת קלף
        this.container.querySelector('.ccg-stack-clickable')
            ?.addEventListener('click', () => this.revealCard());
        this.container.querySelector('.ccg-pick-btn')
            ?.addEventListener('click', () => this.revealCard());
    }

    revealCard() {
        if (!this.state.deck.length) { this.renderDeckEmpty(); return; }

        let revealed = false;
        const doReveal = () => {
            if (revealed) return;
            revealed = true;
            const idx = Math.floor(Math.random() * this.state.deck.length);
            const [card] = this.state.deck.splice(idx, 1);
            this.state.usedCards.push(card);
            this.state.currentCard = card;
            this.renderCard(card);
        };

        const stackImg = this.container.querySelector('.ccg-stack-img');
        const pickBtn  = this.container.querySelector('.ccg-pick-btn');

        if (stackImg) {
            // חסום כפתורים ותן לאנימציה לרוץ קודם
            if (pickBtn) pickBtn.disabled = true;
            stackImg.classList.add('shuffling');
            // אחרי האנימציה (650ms) — שלוף קלף; fallback ב-800ms
            stackImg.addEventListener('animationend', doReveal, { once: true });
            setTimeout(doReveal, 800);
        } else {
            doReveal();
        }
    }

    renderCard(card) {
        const remaining     = this.state.deck.length;
        const encouragement = card.encouragement || this.config.encouragement_default;
        const newBtnLabel   = remaining ? this.config.new_card_button_label : 'ערבוב מחדש 🔀';

        const cardImg = this.config.assets_url
            ? `<img src="${this.config.assets_url}card-front.png"
                     alt="קלף יצירתיות" class="ccg-card-img">`
            : '';

        const shareBtn = (this.config.allow_sharing && (card.share_text || card.prompt))
            ? `<button type="button" class="ccg-share-button" data-action="share">
                   ${this.config.share_button_label}
               </button>`
            : '';

        this.container.innerHTML = `
            <div class="ccg ccg-card-open">

                <div class="ccg-card-visual-wrapper">
                    ${cardImg}
                    <div class="ccg-card-overlay" dir="rtl">
                        ${card.title ? `<h2 class="ccg-card-title">${this.escapeHtml(card.title)}</h2>` : ''}
                        <div class="ccg-card-prompt">${this.escapeHtml(card.prompt)}</div>
                    </div>
                </div>

                <div class="ccg-followup-box"      id="ccg-followup"></div>
                <div class="ccg-encouragement-box" id="ccg-encouragement"></div>

                <!-- 2 כפתורים ראשיים: followup + encouragement -->
                <div class="ccg-card-actions">
                    <button type="button" class="ccg-btn-secondary" data-action="followup">
                        ${this.config.followup_button_label}
                    </button>
                    <button type="button" class="ccg-btn-primary" data-action="encouragement">
                        ${this.config.encouragement_button_label}
                    </button>
                </div>

                <!-- שורת "קלף חדש" + שיתוף — תמיד גלויה -->
                <div class="ccg-card-bottom-row">
                    <button type="button" class="ccg-btn-new" data-action="new">
                        ${newBtnLabel}
                    </button>
                    ${shareBtn}
                </div>

                <div class="ccg-status" aria-live="polite"></div>
            </div>`;

        const followUpBox      = this.container.querySelector('#ccg-followup');
        const encouragementBox = this.container.querySelector('#ccg-encouragement');

        this.container.querySelector('[data-action="followup"]')?.addEventListener('click', () => {
            if (card.follow_up) {
                followUpBox.innerHTML = this.escapeHtml(card.follow_up);
                followUpBox.classList.add('active');
            } else {
                this.showStatus('לקלף הזה אין עזרה נוספת — נסי קלף חדש!', 'warning');
            }
        });

        this.container.querySelector('[data-action="encouragement"]')?.addEventListener('click', () => {
            encouragementBox.innerHTML = this.escapeHtml(encouragement);
            encouragementBox.classList.add('active');
        });

        this.container.querySelector('[data-action="new"]')?.addEventListener('click', () => {
            if (!this.state.deck.length) this.resetDeck();
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
                        ערבוב מחדש
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
        // משתמשת ב-share_text הספציפי של הקלף, ולא בטקסט כללי
        const text = card.share_text || card.prompt || '';
        try {
            if (navigator.share) {
                // שיתוף native — פותח את menu השיתוף של הטלפון/מחשב
                await navigator.share({ text });
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                this.showStatus('הטקסט הועתק! אפשר להדביק בכל מקום.', 'success');
            } else {
                this.showStatus('הדפדפן לא תומך בשיתוף אוטומטי.', 'warning');
            }
        } catch (err) {
            // המשתמשת ביטלה את השיתוף — לא שגיאה אמיתית
            if (err?.name !== 'AbortError') {
                this.showStatus('לא הצלחנו לשתף עכשיו.', 'warning');
            }
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

    // ── CSV parser מלא — מטפל בתאים מרובי-שורות בתוך מרכאות ──────────────────
    parseCsv(text) {
        const rows = [];
        let row = [], cur = '', inQ = false, i = 0;

        while (i < text.length) {
            const c = text[i];

            if (inQ) {
                if (c === '"' && text[i + 1] === '"') {
                    // מרכאה מוכפלת בתוך שדה מוקף — ממירה למרכאה אחת
                    cur += '"'; i += 2;
                } else if (c === '"') {
                    // סיום שדה מוקף
                    inQ = false; i++;
                } else {
                    // כל תו — כולל \n ו-\r בתוך שדה מוקף — נשמר כחלק מהערך
                    cur += c; i++;
                }
            } else {
                if (c === '"') {
                    inQ = true; i++;
                } else if (c === ',') {
                    row.push(cur.trim()); cur = ''; i++;
                } else if (c === '\r' && text[i + 1] === '\n') {
                    row.push(cur.trim()); rows.push(row); row = []; cur = ''; i += 2;
                } else if (c === '\n') {
                    row.push(cur.trim()); rows.push(row); row = []; cur = ''; i++;
                } else {
                    cur += c; i++;
                }
            }
        }
        // שורה אחרונה ללא ירידת שורה בסוף
        if (cur || row.length) { row.push(cur.trim()); rows.push(row); }

        // מסנן שורות ריקות לגמרי
        const nonEmpty = rows.filter(r => r.some(v => v));
        if (nonEmpty.length < 2) return { headers: [], rows: [] };
        return {
            headers: nonEmpty[0].map(h => h.trim().toLowerCase()),
            rows:    nonEmpty.slice(1)
        };
    }
    // ── עזרי תצוגה ──────────────────────────────────────────────────────────
    // מנקה תווי HTML מסוכנים + ממיר ירידות שורה ל-<br> להצגה נכונה
    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/\r\n|\r|\n/g, '<br>');
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
