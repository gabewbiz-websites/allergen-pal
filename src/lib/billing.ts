import type { Plan, Subscription } from "./types";

/**
 * Billing configuration. Flip `provider` to "stripe" and provide the price ids
 * + a functions base URL to take real money via Stripe Checkout. Until then the
 * app runs the simulated engine below so the whole freemium→paid lifecycle is
 * exercisable end-to-end.
 */
export const BILLING = {
  provider: (import.meta.env.VITE_BILLING_PROVIDER ?? "simulated") as
    | "simulated"
    | "stripe",
  trialDays: 7,
  prices: {
    monthly: {
      amount: "$4.99",
      period: "month",
      stripePriceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY ?? "",
    },
    yearly: {
      amount: "$29.99",
      period: "year",
      stripePriceId: import.meta.env.VITE_STRIPE_PRICE_YEARLY ?? "",
      perMonth: "$2.50",
      savingsPct: 50,
    },
  },
  /** Base URL of the Supabase Edge Functions (…/functions/v1). */
  functionsUrl: import.meta.env.VITE_FUNCTIONS_URL ?? "",
};

const DAY = 24 * 60 * 60 * 1000;

function periodLength(plan: Plan): number {
  return plan === "yearly" ? 365 * DAY : 30 * DAY;
}

export const emptySubscription: Subscription = {
  status: "none",
  plan: null,
  provider: "simulated",
  currentPeriodEnd: null,
  trialEnd: null,
  cancelAtPeriodEnd: false,
};

/** Begin a free trial that converts to `plan` when it ends. */
export function startTrial(plan: Plan, now = Date.now()): Subscription {
  const trialEnd = now + BILLING.trialDays * DAY;
  return {
    status: "trialing",
    plan,
    provider: "simulated",
    trialEnd,
    currentPeriodEnd: trialEnd + periodLength(plan),
    cancelAtPeriodEnd: false,
  };
}

/** Subscribe immediately without a trial (or convert a trial to active). */
export function subscribeNow(plan: Plan, now = Date.now()): Subscription {
  return {
    status: "active",
    plan,
    provider: "simulated",
    trialEnd: null,
    currentPeriodEnd: now + periodLength(plan),
    cancelAtPeriodEnd: false,
  };
}

/** Cancel — keep access until the current period ends. */
export function cancel(sub: Subscription): Subscription {
  if (sub.status !== "active" && sub.status !== "trialing") return sub;
  return { ...sub, status: "canceled", cancelAtPeriodEnd: true };
}

/** Undo a pending cancellation. */
export function resume(sub: Subscription): Subscription {
  if (sub.status !== "canceled") return sub;
  const now = Date.now();
  const stillTrialing = sub.trialEnd != null && now < sub.trialEnd;
  return {
    ...sub,
    status: stillTrialing ? "trialing" : "active",
    cancelAtPeriodEnd: false,
  };
}

/**
 * Advance a subscription's clock. Called on load so trials/cancellations lapse
 * on time even if the app was closed. Returns a new object only when changed.
 */
export function reconcile(sub: Subscription, now = Date.now()): Subscription {
  // Trial elapsed → convert to active (auto-renew) unless it was canceled.
  if (sub.status === "trialing" && sub.trialEnd != null && now >= sub.trialEnd) {
    if (sub.cancelAtPeriodEnd) {
      return { ...emptySubscription, status: "expired" };
    }
    return {
      ...sub,
      status: "active",
      trialEnd: null,
      currentPeriodEnd:
        sub.currentPeriodEnd && sub.currentPeriodEnd > now
          ? sub.currentPeriodEnd
          : now + periodLength(sub.plan ?? "monthly"),
    };
  }
  // Canceled and period ended → expired.
  if (
    sub.status === "canceled" &&
    sub.currentPeriodEnd != null &&
    now >= sub.currentPeriodEnd
  ) {
    return { ...emptySubscription, status: "expired" };
  }
  // Active period ended → auto-renew (simulated).
  if (
    sub.status === "active" &&
    sub.provider === "simulated" &&
    sub.currentPeriodEnd != null &&
    now >= sub.currentPeriodEnd
  ) {
    return { ...sub, currentPeriodEnd: now + periodLength(sub.plan ?? "monthly") };
  }
  return sub;
}

/**
 * Kick off Stripe Checkout. Requires provider "stripe", configured price ids,
 * a functions URL, and a signed-in user (for the access token). Redirects the
 * browser to Stripe on success.
 */
export async function startStripeCheckout(
  plan: Plan,
  accessToken: string,
): Promise<{ ok: boolean; error?: string }> {
  const priceId = BILLING.prices[plan].stripePriceId;
  if (!BILLING.functionsUrl || !priceId) {
    return { ok: false, error: "Stripe is not configured." };
  }
  try {
    const res = await fetch(`${BILLING.functionsUrl}/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        priceId,
        trialDays: BILLING.trialDays,
        successUrl: `${window.location.origin}/?checkout=success`,
        cancelUrl: `${window.location.origin}/?checkout=cancel`,
      }),
    });
    if (!res.ok) return { ok: false, error: `Checkout failed (${res.status})` };
    const { url } = (await res.json()) as { url: string };
    window.location.href = url;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Open the Stripe customer portal to manage/cancel a real subscription. */
export async function openBillingPortal(
  accessToken: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!BILLING.functionsUrl) return { ok: false, error: "Not configured." };
  try {
    const res = await fetch(`${BILLING.functionsUrl}/create-portal-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ returnUrl: window.location.origin }),
    });
    if (!res.ok) return { ok: false, error: `Portal failed (${res.status})` };
    const { url } = (await res.json()) as { url: string };
    window.location.href = url;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
