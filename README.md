# Allergen Pal

Your pocket companion for staying safe with food allergies. Set up the
allergens you (and your family) react to, then check any food's ingredients —
by barcode or by pasting the label — for hidden allergens, log reactions, and
keep an emergency card handy.

Built as an installable, offline-first **PWA** with optional cloud accounts and
real subscription billing.

## Features

- **Onboarding** — pick your allergens (FDA "big 9" + gluten), set a severity
  for each (mild / moderate / severe).
- **Food checker** — **scan a barcode** (Open Food Facts) or paste an ingredient
  list for an instant **safe / caution / avoid** verdict. Catches hidden names
  (casein → milk, arachis → peanut, semolina → wheat, and dozens more).
- **Food history** — saved checks, searchable/filterable, with favorites.
- **Reaction log** — severity, symptoms, suspected trigger, date & notes.
- **Insights** *(Pro)* — reactions over time, top suspected triggers, safe-rate.
- **Family profiles** *(Pro)* — track allergens separately for kids & loved ones.
- **Emergency card** *(Pro)* — share/print allergies, meds & contacts.
- **Accounts & cloud sync** *(optional)* — Supabase auth + multi-device sync.
- **Subscriptions** — freemium with a real Stripe-backed billing lifecycle.

## Freemium model

Gated through a real entitlement layer (`src/lib/entitlements.ts`). **Safety
features are always free** (allergen checking, reaction logging) — good for
retention and reviews. Pro unlocks power features:

| | Free | Pro |
|---|---|---|
| Allergen checking & reactions | ✅ unlimited | ✅ |
| Saved food history | last 10 | unlimited |
| Barcode scanning | — | ✅ |
| Insights / trends | — | ✅ |
| Family profiles | 1 | up to 8 |
| Emergency card export | — | ✅ |
| Cloud backup & sync | ✅ (account) | ✅ |

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
See **[SETUP.md](SETUP.md)** to turn on real accounts, sync, and payments.

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
