# Going live: Supabase + Stripe

The app is **fully functional out of the box** in local/guest mode with
simulated billing — no setup required. Follow this guide to turn on real
accounts, cloud sync, and real payments. You can do the two halves (Supabase,
Stripe) independently.

---

## 1. Supabase (accounts + cloud sync)

1. Create a project at [supabase.com](https://supabase.com).
2. **Database:** open the SQL editor and run [`supabase/schema.sql`](supabase/schema.sql).
   This creates `user_state` and `subscriptions` with row-level security so each
   user can only touch their own rows.
3. **Auth:** Authentication → Providers. Email is on by default. To enable
   "Continue with Google," turn on the Google provider and add your OAuth
   credentials. Add your site URL to Authentication → URL Configuration.
4. **Keys:** Project Settings → API. Put these in your `.env`:
   ```
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon public key>
   ```
5. Rebuild/redeploy. The Profile screen now offers sign-in; signing in migrates
   the device's guest data to the account and syncs across devices.

That's enough for accounts + sync. Billing stays simulated until step 2.

---

## 2. Stripe (real subscriptions)

1. In [Stripe](https://dashboard.stripe.com) (start in **test mode**), create a
   product "Allergen Pal Pro" with two recurring prices: **$4.99/month** and
   **$29.99/year**. Copy the two Price IDs (`price_…`).
2. Deploy the Edge Functions (requires the Supabase CLI, `supabase link`ed):
   ```bash
   supabase functions deploy create-checkout-session --no-verify-jwt
   supabase functions deploy create-portal-session   --no-verify-jwt
   supabase functions deploy stripe-webhook          --no-verify-jwt
   ```
3. Set the function secrets:
   ```bash
   supabase secrets set \
     STRIPE_SECRET_KEY=sk_test_… \
     STRIPE_WEBHOOK_SECRET=whsec_… \
     STRIPE_PRICE_MONTHLY=price_… \
     STRIPE_PRICE_YEARLY=price_…
   ```
   (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.)
4. In Stripe → Developers → Webhooks, add an endpoint pointing at
   `https://<ref>.supabase.co/functions/v1/stripe-webhook` and subscribe to
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copy its signing secret into
   `STRIPE_WEBHOOK_SECRET` above.
5. Point the frontend at Stripe in `.env`:
   ```
   VITE_BILLING_PROVIDER=stripe
   VITE_FUNCTIONS_URL=https://<ref>.supabase.co/functions/v1
   VITE_STRIPE_PRICE_MONTHLY=price_…
   VITE_STRIPE_PRICE_YEARLY=price_…
   ```
6. Rebuild/redeploy. "Start free trial" now opens Stripe Checkout; the webhook
   writes the authoritative subscription row, which the app reads to unlock Pro.
   "Manage billing" opens the Stripe customer portal. Use Stripe test cards
   (e.g. `4242 4242 4242 4242`) to try the full flow, then switch to live keys.

## 3. Recipe service (URL import + AI rewrite)

The recipe converter's **paste-text** path works with zero setup. Two Edge
Functions add more:

- **`fetch-recipe`** lets users paste a **URL** — it fetches the page
  server-side (browsers can't, due to CORS) and reads the schema.org recipe
  data most sites embed. No API key needed.
- **`rewrite-recipe`** is the **AI "smart rewrite" (Pro)** — it calls Claude to
  rewrite ingredients, quantities and steps. It verifies the caller is a
  signed-in Pro user before spending tokens (so it needs steps 1 & 2 above).

Deploy them and set the frontend's `VITE_FUNCTIONS_URL` (same base URL used for
Stripe):

```bash
supabase functions deploy fetch-recipe   --no-verify-jwt
supabase functions deploy rewrite-recipe  --no-verify-jwt
supabase secrets set ANTHROPIC_API_KEY=sk-ant-…
# optional: pick a cheaper model per conversion (default is claude-opus-5)
supabase secrets set AI_MODEL=claude-sonnet-5
```

```
VITE_FUNCTIONS_URL=https://<ref>.supabase.co/functions/v1
```

Get an Anthropic API key at [console.anthropic.com](https://console.anthropic.com).
AI rewrite is metered by Anthropic usage — gating it to Pro keeps that cost
aligned with revenue.

## Why the split?

Subscription state lives in the `subscriptions` table and is written **only** by
the webhook (service role). The browser can read it but never write it, so a
user can't grant themselves Pro by editing local data. App data (allergens,
foods, reactions) syncs through `user_state`, which users own via RLS.

---

## Deploying the web app

It's a static Vite build (`npm run build` → `dist/`). Host it anywhere —
Vercel, Netlify, Cloudflare Pages, GitHub Pages, or any static host. Set the
`VITE_*` env vars in your host's dashboard. Because it's a PWA, users can
install it to their home screen and use it offline.
