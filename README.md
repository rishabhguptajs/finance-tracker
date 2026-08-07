

# 🐷 PaisaTrack

**Log expenses in plain English. Get answers in plain English.**

Type `450 swiggy dinner, cab 180, netflix 500 on card` and it becomes three
categorised transactions. Then ask *"do I spend more on weekends?"* and get a
real number back.



---

## Why

I never tracked my money because every tracker wants a form: amount field, category dropdown, date picker, save. Twelve taps for a ₹40 black coffee.

So the whole app is one text box. You type how you'd text a friend, and an LLM turns it into rows. Everything else (budgets, charts, recurring detection) is built on top of that one habit being easy enough to actually keep.

## What it does

**Logging**

- One box, plain English, several entries at once
- Understands income too — `salary 90000 credited` files itself separately
- Picks up payment method when you mention it (`paid by card`, `gpay`)
- Shows a confirm card before saving, so a bad guess never becomes a bad row

**Understanding**

- Dashboard: spend, income, savings rate, budget, category donut, daily bars
- Trends: 6/12-month money-in-vs-out, stacked categories, month-by-month table
- Recurring radar: finds subscriptions and bills in your history, flags price
changes and ones that stopped charging
- Budgets: an overall monthly limit plus per-category caps

**Asking**

- `/ask` answers questions about your own data
- Every answer shows the lookups behind it, so you can check the number

**Living with it**

- Installable on your phone as a PWA — home screen icon, fullscreen, bottom tabs
- Light and dark theme
- Password gate, since it's a single-user app

## Two decisions worth explaining

**The model never does arithmetic.** `/ask` gets a briefing of pre-computed
totals, plus tools that return sums calculated in JavaScript. It picks *which
slice* to look at; it never adds up a list of transactions.

This isn't theoretical. An early version pulled correct per-day totals, summed
them itself, and reported *"more on weekends (₹4,885) than weekdays (₹11,449)"* —
backwards, and stated with total confidence. The fix was a `weekday_weekend`
grouping computed server-side, not a sterner prompt. If a new comparison comes
out wrong, the answer is usually a new `group_by`.

**Category colours are validated, not chosen by eye.** The original palette had
Health and Groceries 11.3 ΔE apart and Health/Entertainment at 4.2 under
protanopia — fine in a donut with a legend, unreadable in a stacked bar. The
current nine hues are re-stepped to pass lightness-band, chroma-floor, and
colour-vision-deficiency separation checks, and they sit in the overlap of the
light and dark bands so one palette serves both themes.

## Stack


|            |                                             |
| ---------- | ------------------------------------------- |
| Framework  | Next.js 16 (App Router)                     |
| Language   | TypeScript                                  |
| Styling    | Tailwind CSS v4 with semantic colour tokens |
| Database   | Supabase (Postgres)                         |
| Extraction | Gemini 3.1 Flash Lite                       |
| Q&A        | Gemini 3.5 Flash Lite with function calling |
| Charts     | Recharts                                    |
| Fetching   | SWR                                         |


## Running it

```bash
git clone https://github.com/rishabhguptajs/finance-tracker
cd finance-tracker
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
APP_PASSWORD=whatever-you-like
```

Run `supabase/schema.sql` in the Supabase SQL editor. (Upgrading an existing
install instead? Run `supabase/migrations/002_income_budgets_payment.sql` — it's
additive and safe to re-run.)

```bash
npm run dev
```

## Install it on your phone

Deploy it, open the URL on your phone, and **Share → Add to Home Screen**. It
launches fullscreen with its own icon and a bottom tab bar. Needs HTTPS, which
you get free on Vercel.

## Layout

```
src/
├── app/
│   ├── api/
│   │   ├── ask/          # question → tool loop → grounded answer
│   │   ├── budget/       # overall + per-category limits
│   │   ├── expenses/     # CRUD, filtering, search
│   │   ├── extract/      # text → structured entries
│   │   └── income/
│   ├── ask/  dashboard/  trends/  transactions/
│   ├── icon.tsx          # app icon, generated at build time
│   └── manifest.ts
├── components/
└── lib/
    ├── ask.ts            # tools + briefing; all sums computed here
    ├── recurring.ts      # cadence detection over spend history
    ├── categories.ts     # the validated palette
    └── gemini.ts         # extraction prompt + parsing
```

## Known gaps

- **No offline support.** Close the network and API calls fail like any website.
A service worker with queued writes is the obvious next step.
- **Single user.** RLS is off and auth is one shared password. Fine for one
person, not fine for two.
- **Recurring needs history.** Monthly charges need three separate months before
they're called recurring, so it's quiet on a fresh install.

## License

MIT