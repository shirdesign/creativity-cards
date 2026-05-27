/**
 * ⚙️  הגדרות קלפי יצירתיות
 * ערכו כאן את כל הטקסטים, הצבעים ומקור הקלפים.
 */

window.CREATIVITY_CARDS_CONFIG = {

    // ─── מקור הקלפים ────────────────────────────────────────────────────────
    // אפשרויות: 'google_sheet' | 'manual'
    cards_source: 'google_sheet',

    // Google Sheet: הדביקו כאן את הקישור לגיליון (חייב להיות פתוח לצפייה)
    cards_sheet_url: 'https://docs.google.com/spreadsheets/d/1q830Ht0crglLrJWOuWIN3Y8jXJFUrXoYpQ1APfETnmo/edit',

    // מזהה הטאב (gid) — מופיע בכתובת ה-URL אחרי #gid=
    cards_sheet_gid: '0',

    // כמה קלפים להציג בכל מחזור בחירה
    cards_per_session: 6,

    // ─── טקסטים ─────────────────────────────────────────────────────────────
    start_title:                'מכירים את הרגע שהראש נחסם?',
    start_subtitle:             'באמצע עבודה שמצריכה ריכוז והרעיונות נגמרו? הכרטיסים האלה נבנו במיוחד בשבילכם — כל קלף פותח הראש אחרת.',
    start_button_label:         'יאללה, בואי ננסה משהו חדש',

    shuffle_screen_text:        'מוכנים להיות יצירתיים? מתחו אצבעות, שנסו מותניים ולחצו על הכפתור.',

    followup_button_label:      'רוצה כיוון נוסף',
    encouragement_button_label: 'הולך לבצע',
    new_card_button_label:      'ערבב ושלוף לי קלף יצירתי',
    encouragement_default:      'איזה אומץ! לכי תנסי ונשמח לשמוע איך היה.',

    allow_sharing:              true,
    share_button_label:         'שתפי את הקלף',

    // ─── צבעים ──────────────────────────────────────────────────────────────
    primary_color:   '#F5C500',   // צהוב — כפתור ראשי
    secondary_color: '#FF7A00',   // כתום — כפתור משני
    accent_color:    '#E88C78',   // ורוד-כתום — מסגרת follow-up
    text_color:      '#2a2a2a',
    card_text_color: '#2a2a2a',
    font_family:     'Heebo',

    // ─── נתיב תמונות (אין צורך לשנות) ──────────────────────────────────────
    assets_url: './assets/',

    // ─── קלפים ידניים (רק אם cards_source = 'manual') ───────────────────────
    cards_manual: JSON.stringify([
        {
            title: 'קלף לדוגמה',
            prompt: 'תארי לעצמך שאת מסבירה את הרעיון הזה לילד בן 10. מה היית אומרת?',
            follow_up: 'נסי לצייר את הרעיון — אפילו בקווים פשוטים.',
            encouragement: 'כל ניסיון הוא התקדמות! לכי על זה.'
        }
    ])
};
