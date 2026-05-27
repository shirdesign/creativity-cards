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
            assets_url:       config.assets_url       || './assets/',
            primary_color:    config.primary_color    || '#F5C500',
            secondary_color:  config.secondary_color  || '#FF7A00',
            accent_color:     config.accent_color     || '#E88C78',
            text_color:       config.text_color       || '#2a2a2a',
            card_text_color:  config.card_text_color  || '#2a2a2a',
            font_family:      config.font_family      || 'Heebo',
            // לוגו וקרדיט
            client_logo_url:  config.client_logo_url  || '',
            credit_text:      config.credit_text      || '',
            credit_url:       config.credit_url       || ''
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

            /* ── all screens ────────────────────────────────────────────── */
            ${s} .ccg-start-screen,
            ${s} .ccg-selection,
            ${s} .ccg-card-open,
            ${s} .ccg-empty-state {
                min-height: 100dvh;
                display: flex;
                flex-direction: column;
                position: relative;
            }
            /* מסך פתיחה + בחירת קלף = bg-main = קפה + פתקיות */
            ${s} .ccg-start-screen,
            ${s} .ccg-selection,
            ${s} .ccg-empty-state {
                background: ${a ? `url('${a}bg-main.png') center center / cover no-repeat` : '#FFF5E0'};
            }
            /* מסך קלף פתוח = bg-inner = עץ נקי עם עיפרון */
            ${s} .ccg-card-open {
                background: ${a ? `url('${a}bg-inner.png') center center / cover no-repeat` : '#FDF6EC'};
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
                font-size: clamp(24px,3.4vw,39px);
                font-weight: 800;
                color: ${ctc};
                margin: 0;
                line-height: 1.2;
            }
            ${s} .ccg-start-subtitle {
                font-size: clamp(13px,1.7vw,17px);
                margin: 0;
                color: #555;
                line-height: 1.7;
                max-width: 520px;
            }

            /* ── מסך בחירת קלף — כפתור כניסה מרכזי ───────────────────── */
            ${s} .ccg-selection {
                align-items: center;
                justify-content: center;
            }
            /* כפתור הכניסה: תמונה + טקסט מעליה (CSS Grid) */
            ${s} .ccg-btn-enter {
                display: grid;
                place-items: center;
                border: none;
                background: transparent;
                padding: 0;
                cursor: pointer;
                width: min(460px, 78vw);
                transition: transform .15s ease, filter .15s ease;
            }
            ${s} .ccg-btn-enter img { grid-area: 1/1; width: 100%; height: auto; display: block; }
            ${s} .ccg-btn-enter span {
                grid-area: 1/1;
                font-family: '${ff}', sans-serif;
                font-size: clamp(15px,2.5vw,22px);
                font-weight: 800;
                color: #1a1a1a;
                z-index: 1;
                pointer-events: none;
                /* מזיז שמאלה+למעלה — מרחיק מסמן העכבר שבתמונה */
                transform: translate(-14px, -7px);
            }
            ${s} .ccg-btn-enter:hover  { transform: translate(-3px,-3px); filter: drop-shadow(5px 5px 0 rgba(0,0,0,.35)); }
            ${s} .ccg-btn-enter:active { transform: translate(1px,1px);   filter: drop-shadow(1px 1px 0 rgba(0,0,0,.3)); }

            /* ── מסך קלף פתוח ───────────────────────────────────────────── */
            ${s} .ccg-card-open {
                align-items: center;
                justify-content: flex-start;
                padding: clamp(8px,1.5vw,16px) clamp(8px,1.5vw,20px);
                gap: 10px;
                overflow-y: auto;
            }

            /*
             * קלף: background-image עם זום מדויק על אזור הנייר בלבד.
             * ה-PNG של הקלף (1306×1796) מכיל ~23% שקיפות למעלה, ~26% למטה,
             * ו-~22% לכל צד. מגדילים ל-174%×195% כדי שרק הנייר ימלא את ה-wrapper.
             * הקלף גדל עם התוכן — אין aspect-ratio קשיח.
             */
            ${s} .ccg-card-visual-wrapper {
                width: min(676px, 92vw);
                animation: ccgCardIn .45s cubic-bezier(.215,.61,.355,1);
                flex-shrink: 0;
                background: url('${a}card-front-straight.png') 51% 47% / 174% 195% no-repeat;
                filter: drop-shadow(0 10px 32px rgba(0,0,0,.22));
                display: flex;
                flex-direction: column;
                /* background נמתח ביחס לגודל ה-wrapper */
            }
            /* overlay: טקסט למעלה, כפתורים 50px מתחת לטקסט */
            ${s} .ccg-card-overlay {
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                gap: 50px;
                /* padding מפנה מהסלוטייפ למעלה ומהשוליים הקרועים מהצדדים */
                padding: 22% 10% 10%;
            }
            /* כל הטקסט מוצג — ללא סקרול */
            ${s} .ccg-card-text { padding-bottom: 6px; }
            ${s} .ccg-card-title {
                font-family: 'OHEyalMeirBerkowitz', 'Heebo', sans-serif;
                font-size: clamp(19px, 3vw, 25px);
                font-weight: normal;
                color: ${ctc};
                margin: 0 0 6px;
                line-height: 1.35;
            }
            ${s} .ccg-card-prompt {
                font-family: 'OHEyalMeirBerkowitz', 'Heebo', sans-serif;
                font-size: clamp(18px, 2.7vw, 22px);
                line-height: 1.6;
                color: ${ctc};
                margin: 0;
            }

            /* ─── כפתורים בתוך הקלף (תמונה + טקסט) ─────────────────────── */
            ${s} .ccg-inner-actions {
                display: flex;
                gap: 8px;
                justify-content: center;
                flex-shrink: 0;
                flex-wrap: nowrap;
            }
            ${s} .ccg-inner-btn {
                display: grid;
                place-items: center;
                border: none;
                background: transparent;
                padding: 0;
                cursor: pointer;
                /* תמיד אחד ליד השני: בדיוק חצי מרוחב הקונטיינר פחות חצי ה-gap */
                width: min(234px, calc(50% - 4px));
                transition: transform .15s ease, filter .15s ease;
            }
            ${s} .ccg-inner-btn img { grid-area: 1/1; width: 100%; height: auto; display: block; }
            ${s} .ccg-inner-btn span {
                grid-area: 1/1;
                font-family: '${ff}', sans-serif;
                font-size: clamp(11px, 1.6vw, 13px);
                font-weight: 700;
                color: #1a1a1a;
                z-index: 1;
                pointer-events: none;
                text-align: center;
                /* מגביל רוחב כדי שהטקסט יעבור ל-2 שורות */
                width: 72%;
                /* מזיז שמאלה+למעלה — מרחיק מסמן העכבר שבפינה ימין-תחתון */
                transform: translate(-8px, -8px);
                line-height: 1.3;
            }
            ${s} .ccg-inner-btn:hover  { transform: translate(-2px,-2px); filter: drop-shadow(3px 3px 0 rgba(0,0,0,.3)); }
            ${s} .ccg-inner-btn:active { transform: translate(1px,1px);   filter: drop-shadow(1px 1px 0 rgba(0,0,0,.25)); }

            /* תיבות פרטים נוספים — מתחת לקלף */
            ${s} .ccg-followup-box,
            ${s} .ccg-encouragement-box {
                width: min(540px, 92vw);
                background: rgba(255,255,255,.92);
                border-radius: 14px;
                padding: 14px 18px;
                font-size: clamp(14px,1.8vw,16px);
                line-height: 1.7;
                color: #333;
                display: none;
                box-shadow: 0 3px 14px rgba(0,0,0,.12);
                backdrop-filter: blur(4px);
            }
            ${s} .ccg-followup-box     { border-right: 4px solid ${sc}; }
            ${s} .ccg-encouragement-box { border-right: 4px solid ${pc}; }
            ${s} .ccg-followup-box.active,
            ${s} .ccg-encouragement-box.active { display: block; animation: ccgFadeIn .35s ease; }

            /* שורת "ערבב" + שיתוף — מתחת לקלף */
            ${s} .ccg-card-bottom-row {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                justify-content: center;
                align-items: center;
                width: min(540px, 92vw);
            }
            ${s} .ccg-btn-new {
                display: inline-flex;
                background: rgba(255,255,255,.85);
                color: #1a1a1a;
                border: 2px solid #1a1a1a;
                border-radius: 60px;
                padding: 11px clamp(18px,2.5vw,32px);
                font-size: clamp(13px,1.7vw,16px);
                font-weight: 700;
                cursor: pointer;
                transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
                box-shadow: 2px 2px 0 #1a1a1a;
                align-items: center;
                justify-content: center;
                font-family: '${ff}', sans-serif;
            }
            ${s} .ccg-btn-new:hover  { background:#fff; transform:translate(-2px,-2px); box-shadow:4px 4px 0 #1a1a1a; }
            ${s} .ccg-btn-new:active { transform:translate(1px,1px); box-shadow:1px 1px 0 #1a1a1a; }

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
            ${s} .ccg-stack-img.shuffling,
            ${s} .ccg-btn-enter.shuffling {
                animation: ccgShuffle .65s cubic-bezier(.36,.07,.19,.97) forwards;
                cursor: default;
                pointer-events: none;
            }

            /* ── ערמת קלפים — מסך בחירה ─────────────────────────────── */
            ${s} .ccg-deck-wrap {
                position: relative;
                width: min(200px, 46vw);
                aspect-ratio: 1306 / 1796;
                cursor: pointer;
                margin-bottom: 28px;
                flex-shrink: 0;
            }
            ${s} .ccg-deck-card {
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0; left: 0;
                object-fit: contain;
                display: block;
                filter: drop-shadow(0 6px 18px rgba(0,0,0,.25));
                transition: filter .15s ease;
            }
            /* 11 קלפים בערימה — מ-c11 (תחתון) עד c1 (עליון) */
            ${s} .ccg-deck-c11 { transform: rotate(-13deg) translate(-12px, 14px); z-index: 1;  }
            ${s} .ccg-deck-c10 { transform: rotate(-12.5deg) translate(-11.5px,13.5px); z-index: 2; }
            ${s} .ccg-deck-c9  { transform: rotate(-12deg) translate(-11px, 13px); z-index: 3;  }
            ${s} .ccg-deck-c8  { transform: rotate(-11.5deg) translate(-10.5px,12.5px); z-index: 4; }
            ${s} .ccg-deck-c7  { transform: rotate(-11deg) translate(-10px, 12px); z-index: 5;  }
            ${s} .ccg-deck-c6  { transform: rotate(-10.5deg) translate(-9.5px,11.5px); z-index: 6; }
            ${s} .ccg-deck-c5  { transform: rotate(-10deg) translate(-9px,  11px);  z-index: 7;  }
            ${s} .ccg-deck-c4  { transform: rotate(-9deg)  translate(-8px,  10px);  z-index: 8;  }
            ${s} .ccg-deck-c3  { transform: rotate(-8deg)  translate(-7px,  9px);   z-index: 9;  }
            ${s} .ccg-deck-c2  { transform: rotate(-3deg)  translate(-2px,  3px);   z-index: 10; }
            ${s} .ccg-deck-c1  { transform: rotate( 3deg);                          z-index: 11; }
            ${s} .ccg-deck-wrap:hover .ccg-deck-c1 { filter: drop-shadow(0 10px 26px rgba(0,0,0,.35)); }

            /*
             * Fan-shuffle: הקלפים נפתחים כמו מניפה (c1 ימינה, c3 שמאלה)
             * ואז מתקפלים בחזרה — כמו ערבוב חפיסת קלפים אמיתית
             */
            @keyframes ccgDeckS1 {
                /* קלף עליון — נפתח ימינה, חוזר */
                0%,100% { transform: rotate(3deg); }
                25%     { transform: rotate(32deg)  translate(28px, -8px);  }
                45%     { transform: rotate(38deg)  translate(35px, -12px); }
                65%     { transform: rotate(22deg)  translate(18px, -5px);  }
                82%     { transform: rotate(8deg)   translate(5px,  -1px);  }
            }
            @keyframes ccgDeckS2 {
                /* קלף אמצעי — עולה קצת ונשאר מרכזי */
                0%,100% { transform: rotate(-3deg) translate(-2px, 3px); }
                30%     { transform: rotate(0deg)  translate(0,   -18px); }
                55%     { transform: rotate(2deg)  translate(4px,  -12px); }
                75%     { transform: rotate(0deg)  translate(0,    -4px);  }
            }
            @keyframes ccgDeckS3 {
                /* קלף תחתון — נפתח שמאלה, חוזר */
                0%,100% { transform: rotate(-8deg) translate(-7px, 9px); }
                25%     { transform: rotate(-34deg) translate(-32px, -8px);  }
                45%     { transform: rotate(-40deg) translate(-40px, -12px); }
                65%     { transform: rotate(-24deg) translate(-20px, -4px);  }
                82%     { transform: rotate(-10deg) translate(-9px,  4px);   }
            }
            ${s} .ccg-deck-wrap.shuffling { pointer-events: none; }
            ${s} .ccg-deck-wrap.shuffling .ccg-deck-c1 {
                animation: ccgDeckS1 .85s cubic-bezier(.25,.46,.45,.94) forwards;
            }
            ${s} .ccg-deck-wrap.shuffling .ccg-deck-c2 {
                animation: ccgDeckS2 .85s cubic-bezier(.25,.46,.45,.94) .04s forwards;
            }
            ${s} .ccg-deck-wrap.shuffling .ccg-deck-c3 {
                animation: ccgDeckS3 .85s cubic-bezier(.25,.46,.45,.94) .08s forwards;
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
                border-radius: 24px;
                padding: 10px 22px;
                font-size: clamp(13px,1.6vw,15px);
                font-weight: 600;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                flex-wrap: wrap;
                justify-content: center;
                text-align: center;
                max-width: min(320px, 84vw);
                line-height: 1.4;
                transition: background .2s ease, transform .15s ease;
                font-family: '${ff}', 'Assistant', 'Rubik', 'Arial', sans-serif;
            }
            ${s} .ccg-share-button:hover { background: #fff; transform: translateY(-1px); }

            /* ── כפתור ראשי (empty state) ──────────────────────────────── */
            ${s} .ccg-btn-primary {
                background: ${pc};
                color: #1a1a1a;
                border: 2px solid #1a1a1a;
                border-radius: 60px;
                padding: 12px clamp(20px,3vw,36px);
                font-size: clamp(14px,1.8vw,17px);
                font-weight: 800;
                cursor: pointer;
                transition: transform .15s ease, box-shadow .15s ease;
                box-shadow: 3px 3px 0 #1a1a1a;
                font-family: '${ff}', sans-serif;
            }
            ${s} .ccg-btn-primary:hover  { transform: translate(-2px,-2px); box-shadow: 5px 5px 0 #1a1a1a; }
            ${s} .ccg-btn-primary:active { transform: translate(1px,1px);   box-shadow: 1px 1px 0 #1a1a1a; }

            /* ── לוגו לקוחה ─────────────────────────────────────────────── */
            ${s} .ccg-logo-main {
                width: min(169px, 36vw);
                height: auto;
                display: block;
                margin: 0 auto 4px;
                flex-shrink: 0;
            }
            ${s} .ccg-logo-small {
                width: min(104px, 23vw);
                height: auto;
                display: block;
                opacity: .88;
                flex-shrink: 0;
            }
            /* בעמוד הקלף: לוגו גדול, ב-absolute */
            ${s} .ccg-card-open .ccg-logo-small {
                position: absolute;
                top: 14px;
                /* ברירת מחדל: חופף פינת הקלף הימנית-עליונה */
                right: calc((100% - min(676px, 92vw)) / 2);
                width: min(160px, 32vw);
                margin: 0;
                opacity: .92;
                z-index: 5;
            }
            /* דסקטופ רחב ≥1100px: מקום פנוי → לוגו מחוץ לקלף, 8px מימינו */
            @media (min-width: 1100px) {
                ${s} .ccg-card-open .ccg-logo-small {
                    right: auto;
                    left: calc(50% + 346px);
                }
            }

            /* ── קרדיט תחתון ────────────────────────────────────────────── */
            ${s} .ccg-credit {
                margin-top: auto;
                padding: 8px 16px 10px;
                font-size: clamp(13px, 1.7vw, 16px);
                color: rgba(20,10,0,.75);
                font-weight: 700;
                text-align: center;
                flex-shrink: 0;
                line-height: 1.4;
            }
            ${s} .ccg-credit a {
                color: inherit;
                text-decoration: underline;
                text-underline-offset: 2px;
                transition: color .15s ease;
            }
            ${s} .ccg-credit a:hover { color: rgba(20,10,0,.75); }

            /* ── מובייל ─────────────────────────────────────────────────── */
            @media (max-width: 480px) {
                ${s} .ccg-card-open { padding: 140px 8px 8px; gap: 8px; }
                ${s} .ccg-card-visual-wrapper { width: min(310px, 90vw); }
                ${s} .ccg-card-open .ccg-logo-small { width: min(120px, 28vw); top: 8px; right: 10px; }
                /* גופן קטן יותר במובייל כדי שהקלף לא יתארך יותר מדי */
                ${s} .ccg-card-title  { font-size: clamp(15px, 4vw, 19px); }
                ${s} .ccg-card-prompt { font-size: clamp(14px, 3.8vw, 17px); }
                ${s} .ccg-card-bottom-row { flex-direction: column; align-items: center; gap: 6px; }
                ${s} .ccg-btn-new { width: 100%; justify-content: center; }
                ${s} .ccg-share-button { align-self: center; max-width: 100%; }
            }
        `;
        document.head.appendChild(style);
    }

    // ── helpers: לוגו + קרדיט ────────────────────────────────────────────────
    logoHtml(cls = 'ccg-logo-main') {
        const src = this.config.client_logo_url;
        return src ? `<img src="${src}" class="${cls}" alt="לוגו" loading="lazy">` : '';
    }
    creditHtml() {
        const { credit_text, credit_url } = this.config;
        if (!credit_text) return '';
        const inner = credit_url
            ? `<a href="${credit_url}" target="_blank" rel="noopener">${credit_text}</a>`
            : credit_text;
        return `<div class="ccg-credit">${inner}</div>`;
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
        const a        = this.config.assets_url;
        const btnLabel = this.config.start_button_label;
        this.container.innerHTML = `
            <div class="ccg ccg-start-screen">
                <div class="ccg-start-overlay">
                    ${this.logoHtml('ccg-logo-main')}
                    <h1 class="ccg-start-heading">${this.config.start_title}</h1>
                    <p class="ccg-start-subtitle">${this.config.start_subtitle}</p>
                    <button type="button" class="ccg-btn-enter ccg-start-btn">
                        <img src="${a}btn-enter.png" alt="${btnLabel}" loading="lazy">
                        <span>${btnLabel}</span>
                    </button>
                </div>
                ${this.creditHtml()}
            </div>`;
        this.container.querySelector('.ccg-start-btn')
            ?.addEventListener('click', () => this.renderCardSelection());
    }

    renderCardSelection() {
        if (!this.state.deck.length) { this.renderDeckEmpty(); return; }
        // מנקה את ה-hash כשחוזרים למסך הבחירה
        try { if (history.replaceState) history.replaceState(null, '', window.location.pathname + window.location.search); } catch {}

        const a        = this.config.assets_url;
        const btnLabel = this.config.select_button_label;

        this.container.innerHTML = `
            <div class="ccg ccg-selection">
                ${this.logoHtml('ccg-logo-small')}
                <!-- ערמת קלפים — לחיצה או כפתור מפעילים את הערבוב -->
                <div class="ccg-deck-wrap ccg-pick-target" role="button" aria-label="${btnLabel}" tabindex="0">
                    <img src="${a}card-back-straight.png" class="ccg-deck-card ccg-deck-c11" alt="" loading="lazy">
                    <img src="${a}card-back-straight.png" class="ccg-deck-card ccg-deck-c10" alt="" loading="lazy">
                    <img src="${a}card-back-straight.png" class="ccg-deck-card ccg-deck-c9"  alt="" loading="lazy">
                    <img src="${a}card-back-straight.png" class="ccg-deck-card ccg-deck-c8"  alt="" loading="lazy">
                    <img src="${a}card-back-straight.png" class="ccg-deck-card ccg-deck-c7"  alt="" loading="lazy">
                    <img src="${a}card-back-straight.png" class="ccg-deck-card ccg-deck-c6"  alt="" loading="lazy">
                    <img src="${a}card-back-straight.png" class="ccg-deck-card ccg-deck-c5"  alt="" loading="lazy">
                    <img src="${a}card-back-straight.png" class="ccg-deck-card ccg-deck-c4"  alt="" loading="lazy">
                    <img src="${a}card-back-straight.png" class="ccg-deck-card ccg-deck-c3"  alt="" loading="lazy">
                    <img src="${a}card-back-straight.png" class="ccg-deck-card ccg-deck-c2"  alt="" loading="lazy">
                    <img src="${a}card-back-straight.png" class="ccg-deck-card ccg-deck-c1"  alt="ערמת קלפים" loading="lazy">
                </div>
                <button type="button" class="ccg-btn-enter ccg-pick-btn">
                    <img src="${a}btn-enter.png" alt="${btnLabel}" loading="lazy">
                    <span>${btnLabel}</span>
                </button>
                ${this.creditHtml()}
            </div>`;

        const pick = () => this.revealCard();
        this.container.querySelector('.ccg-pick-target')?.addEventListener('click', pick);
        this.container.querySelector('.ccg-pick-target')?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') pick(); });
        this.container.querySelector('.ccg-pick-btn')?.addEventListener('click', pick);
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

        const deckWrap = this.container.querySelector('.ccg-deck-wrap');
        const pickBtn  = this.container.querySelector('.ccg-pick-btn');

        if (deckWrap) {
            // אנימציית ערבוב על כל הקלפים בערימה
            if (pickBtn) pickBtn.disabled = true;
            deckWrap.classList.add('shuffling');
            // מחכים לסוף אנימציית הקלף הראשון; fallback ב-900ms
            deckWrap.querySelector('.ccg-deck-c1')?.addEventListener('animationend', doReveal, { once: true });
            setTimeout(doReveal, 900);
        } else if (pickBtn) {
            // fallback: אנימציה על הכפתור עצמו
            pickBtn.disabled = true;
            pickBtn.classList.add('shuffling');
            pickBtn.addEventListener('animationend', doReveal, { once: true });
            setTimeout(doReveal, 800);
        } else {
            doReveal();
        }
    }

    renderCard(card) {
        // מעדכן את ה-URL ל-hash מספרי ייחודי לקלף — לשיתוף ישיר
        try {
            if (history.replaceState) {
                const idx = this.state.allCards.findIndex(
                    c => c.title === card.title && c.prompt === card.prompt);
                if (idx !== -1)
                    history.replaceState(null, '', '#card=' + (idx + 1));
            }
        } catch {}

        const remaining     = this.state.deck.length;
        const encouragement = card.encouragement || this.config.encouragement_default;
        const newBtnLabel   = remaining ? this.config.new_card_button_label : 'ערבוב מחדש 🔀';
        const a             = this.config.assets_url;

        // כפתור שיתוף: label = share_text הספציפי מהקלף, fallback = מהקונפיג
        const rawShare  = card.share_text?.trim();
        const shareLabel = rawShare
            ? this.escapeHtml(rawShare).replace(/<br>/g, ' ')
            : (this.config.share_button_label?.replace(/^🔗\s*/,'') || 'שתפי');
        const shareBtn = this.config.allow_sharing
            ? `<button type="button" class="ccg-share-button" data-action="share">🔗 ${shareLabel}</button>`
            : '';

        this.container.innerHTML = `
            <div class="ccg ccg-card-open">

                ${this.logoHtml('ccg-logo-small')}

                <div class="ccg-card-visual-wrapper">
                    <div class="ccg-card-overlay" dir="rtl">
                        <div class="ccg-card-text">
                            ${card.title ? `<h2 class="ccg-card-title">${this.escapeHtml(card.title)}</h2>` : ''}
                            <div class="ccg-card-prompt">${this.escapeHtml(card.prompt)}</div>
                        </div>
                        <div class="ccg-inner-actions">
                            <button type="button" class="ccg-inner-btn" data-action="followup">
                                <img src="${a}btn-orange.png" alt="${this.config.followup_button_label}" loading="lazy">
                                <span>${this.config.followup_button_label}</span>
                            </button>
                            <button type="button" class="ccg-inner-btn" data-action="encouragement">
                                <img src="${a}btn-yellow.png" alt="${this.config.encouragement_button_label}" loading="lazy">
                                <span>${this.config.encouragement_button_label}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="ccg-followup-box"      id="ccg-followup"></div>
                <div class="ccg-encouragement-box" id="ccg-encouragement"></div>

                <!-- שורת "ערבב ושלוף" + שיתוף — תמיד גלויה -->
                <div class="ccg-card-bottom-row">
                    <button type="button" class="ccg-btn-new" data-action="new">
                        ${newBtnLabel}
                    </button>
                    ${shareBtn}
                </div>

                <div class="ccg-status" aria-live="polite"></div>
                ${this.creditHtml()}
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
        // מה שמשתף: הלינק הישיר לקלף הזה (ה-URL הנוכחי כולל hash)
        const cardUrl  = window.location.href;
        const shareMsg = card.share_text?.trim() || '';
        const isMobile = navigator.maxTouchPoints > 1 || /Mobi|Android/i.test(navigator.userAgent);
        try {
            if (isMobile && navigator.share) {
                // מובייל — שיתוף native עם הלינק ועם ה-share_text כטקסט נלווה
                await navigator.share({
                    title: card.title || 'קלף יצירתיות',
                    text:  shareMsg,
                    url:   cardUrl
                });
            } else if (navigator.clipboard?.writeText) {
                // דסקטופ — מעתיק את הלינק ללוח
                await navigator.clipboard.writeText(cardUrl);
                this.showStatus('✅ הלינק הועתק! שלחי לחבר/ה כדי שיראו את הקלף שלך.', 'success');
            } else {
                window.prompt('העתיקי את הלינק לקלף:', cardUrl);
            }
        } catch (err) {
            if (err?.name !== 'AbortError') {
                try {
                    const ta = document.createElement('textarea');
                    ta.value = cardUrl;
                    ta.style.cssText = 'position:fixed;opacity:0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    this.showStatus('✅ הלינק הועתק! שלחי לחבר/ה כדי שיראו את הקלף שלך.', 'success');
                } catch {
                    this.showStatus('לא הצלחנו לשתף כרגע — נסי שוב.', 'warning');
                }
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
            // אם ה-URL מכיל hash של קלף ספציפי — מציגים אותו ישירות
            if (!this._showHashCard()) this.renderStartScreen();
        } catch (err) {
            console.error('[CreativityCards]', err);
            this.showError(err.message?.includes('Google Sheet')
                ? `<h3>בעיה בטעינת Google Sheet</h3>
                   <p>ודאי שהגיליון פתוח לצפייה ציבורית (שיתוף → כל מי שיש לו קישור).</p>`
                : 'לא הצלחנו לטעון קלפים. נסי לרענן את העמוד.');
        }
    }

    // ── ניווט ישיר לקלף לפי URL hash: #card=מספר (1-based) ─────────────────
    _showHashCard() {
        try {
            const hash = window.location.hash;
            if (!hash.startsWith('#card=')) return false;
            const num  = parseInt(hash.slice(6), 10);
            if (!Number.isFinite(num) || num < 1 || num > this.state.allCards.length) return false;
            const card = this.state.allCards[num - 1];
            if (!card) return false;
            // מוציא מהחפיסה ומציג
            const di = this.state.deck.findIndex(c => c.title === card.title && c.prompt === card.prompt);
            if (di !== -1) this.state.deck.splice(di, 1);
            this.state.usedCards.push(card);
            this.state.currentCard = card;
            this.renderCard(card);
            return true;
        } catch { return false; }
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
        // הסרת UTF-8 BOM אם קיים (Google Sheets לפעמים מוסיף אותו)
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

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
            share_text:    get('share_text','share','שיתוף','share text','לשיתוף','טקסט שיתוף','share_label')
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
