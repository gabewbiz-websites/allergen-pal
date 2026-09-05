# Allergen Pal

Your pocket companion for staying safe with food allergies. Set up the
allergens you react to, then check any food's ingredients for hidden allergens,
log reactions, and keep an emergency card handy.

Built as an installable, offline-first **PWA** — no account required, all data
stays on the device.

## Features

- **Onboarding** — pick your allergens (FDA "big 9" + gluten) and set a
  severity for each (mild / moderate / severe).
- **Food checker** — paste an ingredient list and get an instant
  **safe / caution / avoid** verdict. Matches hidden names too (casein → milk,
  arachis → peanut, semolina → wheat, and dozens more).
- **Food history** — saved checks, searchable and filterable, with favorites.
- **Reaction log** — record severity, symptoms, suspected trigger, date & notes.
- **Insights** *(Pro)* — reactions over time, top suspected triggers, safe-rate.
- **Emergency card** *(Pro)* — share/print your allergies, medications and
  contacts for schools, sitters, and first responders.

## Monetization

Freemium, gated on a single `isPro` flag (`src/lib/store.tsx`). Safety-critical
features (allergen checking, reaction logging) are **always free**; power/
convenience features are Pro:

- Free: unlimited allergen checks & reactions, last 10 saved foods.
- Pro ($4.99/mo or $29.99/yr): insights, unlimited history, emergency card
  export, family profiles, cloud backup.

The purchase flow in `src/components/UpgradeSheet.tsx` currently flips the flag
locally — swap `purchase()` for Stripe / RevenueCat / App Store IAP to go live.

## Development

```bash
npm install
npm run dev      # start dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Tech

React + TypeScript + Vite, `vite-plugin-pwa` for the installable/offline
service worker. State is a small reducer persisted to `localStorage`
(`src/lib/store.tsx`). No backend.

## Disclaimer

Allergen Pal helps you stay aware but is **not** a substitute for medical
advice. Always read labels and consult your doctor.
