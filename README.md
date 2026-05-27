# קלפי יצירתיות 🃏

אפליקציית קלפים יצירתיים — עצמאית, ללא תלות בוורדפרס.

## הרצה מקומית

```bash
# Python (מובנה בכל מק)
python3 -m http.server 3000
# ואז פתחי: http://localhost:3000
```

## עריכת הגדרות ותוכן

כל ההגדרות נמצאות בקובץ `config.js`:

| הגדרה | תיאור |
|---|---|
| `cards_sheet_url` | קישור לגיליון Google Sheets עם הקלפים |
| `cards_sheet_gid` | מזהה טאב (gid) בכתובת ה-URL |
| `start_title` | כותרת מסך הפתיחה |
| `start_subtitle` | תיאור קצר |
| `start_button_label` | טקסט כפתור הכניסה |
| `shuffle_screen_text` | טקסט מעל ערימת הקלפים |
| `new_card_button_label` | כפתור "קלף נוסף" |
| `primary_color` | צבע כפתור ראשי (צהוב) |
| `secondary_color` | צבע כפתור משני (כתום) |

## מבנה הגיליון (Google Sheets)

| עמודה | שם |
|---|---|
| `prompt` / `תוכן` | תוכן הקלף (חובה) |
| `title` / `כותרת` | כותרת הקלף |
| `follow_up` / `המשך` | טיפ להמשך |
| `encouragement` / `עידוד` | משפט עידוד |
| `share_text` / `שיתוף` | טקסט לשיתוף |

> חשוב: הגיליון חייב להיות פתוח לצפייה ציבורית (שיתוף → כל מי שיש לו קישור).

## העלאה ל-Vercel

```bash
# התקנת Vercel CLI (פעם אחת)
npm i -g vercel

# העלאה
vercel
```

או דרך GitHub: חברי את ה-repo ב-Vercel Dashboard — כל push ל-`main` יפרסם אוטומטית.

## קבצים

```
creativity-cards-app/
├── index.html          ← דף הגיים
├── config.js           ← כל ההגדרות (ערכו כאן!)
├── creativity-cards.js ← לוגיקה ועיצוב הגיים
├── assets/             ← תמונות (רקעים, קלפים, כפתורים)
└── vercel.json         ← הגדרות פריסה
```
