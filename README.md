# Allergen Pal

Paste a recipe — by link or text — and get it **rewritten to be safe for your
allergies**, with smart ingredient swaps and a plain-English note on how each
swap changes the dish. Plus a food-label checker, reaction log, and an
emergency card.

Built as an installable, offline-first **PWA** with optional cloud accounts and
real subscription billing.

## Features

- **Recipe converter (the core)** — paste a recipe URL or text and get an
  allergen-safe version. For every unsafe ingredient it picks a substitute that
  doesn't introduce another of your allergens (milk→oat milk, egg→flax egg,
  wheat flour→GF blend, peanut butter→sunflower butter…), rewrites the method to
  match, and shows **what may change** (texture, flavor, bake time).
- **AI smart rewrite** *(Pro)* — Claude rewrites ingredients, quantities and
  steps for sharper, recipe-aware results.
- **Onboarding** — pick your allergens (FDA "big 9" + gluten), set a severity.
- **Food checker** — scan a barcode (Open Food Facts) or paste a label for an
  instant **safe / caution / avoid** verdict, catching hidden names.
- **Reaction log** — severity, symptoms, suspected trigger, date & notes.
- **Insights** *(Pro)* — reactions over time, top suspected triggers, safe-rate.
- **Family profiles** *(Pro)* — convert & track allergens separately for kids.
- **Emergency card** *(Pro)* — share/print allergies, meds & contacts.
- **Accounts & cloud sync** *(optional)* — Supabase auth + multi-device sync.
- **Subscriptions** — freemium with a real Stripe-backed billing lifecycle.

## Freemium model

Gated through a real entitlement layer (`src/lib/entitlements.ts`). **Safety
features are always free** (allergen checking, reaction logging) — good for
retention and reviews. Pro unlocks power features:

| | Free | Pro |
|---|---|---|
| Recipe conversion (rule-based swaps) | ✅ unlimited | ✅ |
| AI smart rewrite | 3 / month | unlimited* |
| Saved recipes | last 5 | unlimited |
| Allergen checking & reactions | ✅ unlimited | ✅ |
| Saved food history | last 10 | unlimited |
| Barcode scanning | — | ✅ |
| Insights / trends | — | ✅ |
| Family profiles | 1 | up to 8 |
| Emergency card export | — | ✅ |
| Cloud backup & sync | ✅ (account) | ✅ |

<sub>* Pro AI rewrite has a generous fair-use ceiling (150/mo) to bound cost. AI runs on Claude Haiku 4.5 (~1¢/rewrite) and is metered server-side, keeping gross margin ~90%+.</sub>

**Pricing:** $4.99/mo or $29.99/yr, 7-day free trial.

## Architecture

- **Frontend:** React + TypeScript + Vite PWA. Offline-first: a reducer store
  (`src/lib/store.tsx`) persists to `localStorage` and, when signed in, syncs a
  JSON document to Supabase (`src/lib/cloud.ts`).
- **Billing:** `src/lib/billing.ts` runs a full simulated lifecycle
  (trial → active → cancel → expire, with auto-renew) by default, and hands off
  to **Stripe Checkout / Customer Portal** when configured. Entitlement is
  computed from subscription state (`src/lib/entitlements.ts`).
- **Backend (optional):** Supabase Postgres + RLS (`supabase/schema.sql`) and
  three Stripe **Edge Functions** (`supabase/functions/*`). The Stripe webhook
  is the authoritative source of subscription state, so Pro can't be self-granted.

With **no environment variables set**, everything above runs locally in
guest/simulated mode — the app is fully usable and testable with zero backend.
See **[SETUP.md](SETUP.md)** to turn on real accounts, sync, and payments, and
**[DEPLOY.md](DEPLOY.md)** to deploy to Vercel.

## Development

```bash
npm install
cp .env.example .env   # optional; leave blank for local/guest mode
npm run dev            # dev server
npm run build          # type-check + production build
npm run preview        # preview the production build
```

## Disclaimer

Allergen Pal helps you stay aware but is **not** a substitute for medical
advice. Always read labels and consult your doctor.
