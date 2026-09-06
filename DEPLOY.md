# Deploying to Vercel

Allergen Pal is a static Vite PWA, so Vercel hosts it with no server. The repo
already includes [`vercel.json`](vercel.json) with the right build settings and
SPA + service-worker rules, so import is basically one screen.

## One-time setup (~2 minutes)

1. Go to [vercel.com/new](https://vercel.com/new) and **Import** this GitHub repo
   (`gabewbiz-websites/allergen-pal`). Authorize Vercel for the repo if asked.
2. Vercel auto-detects the framework as **Vite**. Leave the defaults — they
   match `vercel.json`:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
3. **Environment variables** (optional — skip to ship in local/simulated mode).
   Add any of these under *Settings → Environment Variables*, then redeploy:

   | Variable | When you need it |
   |---|---|
   | `VITE_SUPABASE_URL` | Cloud accounts + sync |
   | `VITE_SUPABASE_ANON_KEY` | Cloud accounts + sync |
   | `VITE_BILLING_PROVIDER` | Set to `stripe` to take real money |
   | `VITE_FUNCTIONS_URL` | Stripe (your Supabase functions base URL) |
   | `VITE_STRIPE_PRICE_MONTHLY` | Stripe |
   | `VITE_STRIPE_PRICE_YEARLY` | Stripe |

   See [SETUP.md](SETUP.md) for where each value comes from. Only the
   `VITE_*` vars belong here; Stripe/Supabase **secret** keys live on the
   Supabase Edge Functions, never in the frontend.
4. Click **Deploy**. You'll get a `*.vercel.app` URL. Add a custom domain later
   under *Settings → Domains*.

## Continuous deploys

Once imported, every push to the default branch auto-deploys, and each pull
request gets its own preview URL. To promote this feature branch, either merge
it to the default branch or set it as the Production Branch in Vercel.

## Notes

- **PWA:** `vercel.json` sends `sw.js` and the web manifest with
  `no-cache` so app updates reach users promptly; hashed assets stay
  long-cached by Vercel's defaults.
- **SPA routing:** the catch-all rewrite serves `index.html` for app routes
  while still serving real files (assets, icons, `sw.js`) directly.
- **OAuth redirect:** if you enable Google sign-in, add your Vercel URL (and any
  custom domain) to Supabase → Authentication → URL Configuration, and to the
  Google OAuth allowed redirect URIs.
- **CLI alternative:** `npm i -g vercel && vercel` (then `vercel --prod`) from
  the repo root does the same thing from your terminal.
