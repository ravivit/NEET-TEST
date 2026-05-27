# BioNEET — NEET Biology Test Platform

## Files
- `index.html` — Main app
- `style.css` — Premium dark/light theme
- `questions.js` — 90 Cell Unit questions (PYQ + Predicted)
- `app.js` — All logic (timer, palette, submit, leaderboard)
- `supabase_schema.sql` — Database setup

---

## Step 1: Supabase Setup

1. Go to https://supabase.com → Create new project
2. Go to **SQL Editor** → Paste content of `supabase_schema.sql` → Run
3. Go to **Settings → API**
4. Copy:
   - `Project URL` → your SUPABASE_URL
   - `anon public` key → your SUPABASE_ANON_KEY

---

## Step 2: Add Your Keys

Open `app.js`, line 3-4:

```js
const SUPABASE_URL = 'https://xxxx.supabase.co';        // paste here
const SUPABASE_ANON_KEY = 'eyJhbGci...';                // paste here
```

---

## Step 3: Deploy to Vercel

### Option A — Drag & Drop (Easiest)
1. Go to https://vercel.com → New Project
2. Drag the entire `neet-bio` folder
3. Deploy → Done!

### Option B — GitHub (Recommended)
1. Create GitHub repo, push all files
2. Go to Vercel → Import from GitHub
3. Select repo → Deploy

---

## Keyboard Shortcuts (During Test)
- `→` / `↓` — Next question
- `←` / `↑` — Previous question
- `1` `2` `3` `4` — Select option A B C D
- `M` — Mark/unmark for review
- `C` — Clear response

---

## Adding More Tests Later
- Duplicate `index.html` → rename to `unit2.html`
- Update `questions.js` with new questions
- Change unit name in `app.js` (`'Cell Unit'` → `'Biomolecules'` etc.)
- All results stored in same Supabase table with `unit` column

---

## Features
- Day/Night theme (saved in localStorage)
- 90Q 90min timer with auto-submit
- Question palette (Green/Orange/Grey)
- Mark for review
- Keyboard shortcuts
- Instant result with score, accuracy, time
- Per-question time tracking
- Full solutions with explanations
- Leaderboard from Supabase
- Mobile responsive
