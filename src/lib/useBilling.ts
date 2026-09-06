import { useStore } from "./store";
import { useAuth } from "./auth";
import {
  BILLING,
  cancel,
  resume,
  startStripeCheckout,
  startTrial,
  subscribeNow,
  openBillingPortal,
} from "./billing";
import type { Plan } from "./types";

/**
 * One place the UI calls to change subscription state. In simulated mode it
 * mutates local subscription immediately; in stripe mode (signed in) it hands
 * off to Stripe Checkout / the customer portal.
 */
export function useBilling() {
  const { state, dispatch } = useStore();
  const { session } = useAuth();

  const useStripe = BILLING.provider === "stripe";

  async function startCheckout(plan: Plan): Promise<{ ok: boolean; error?: string }> {
    if (useStripe && session?.access_token) {
      return startStripeCheckout(plan, session.access_token);
    }
    // Simulated: begin a free trial that auto-converts to paid.
    dispatch({ type: "setSubscription", subscription: startTrial(plan) });
    return { ok: true };
  }

  function subscribeImmediately(plan: Plan) {
    dispatch({ type: "setSubscription", subscription: subscribeNow(plan) });
  }

  async function manageBilling(): Promise<{ ok: boolean; error?: string }> {
    if (useStripe && session?.access_token) {
      return openBillingPortal(session.access_token);
    }
    return { ok: true };
  }

  function cancelSubscription() {
    dispatch({ type: "setSubscription", subscription: cancel(state.subscription) });
  }

  function resumeSubscription() {
    dispatch({ type: "setSubscription", subscription: resume(state.subscription) });
  }

  return {
    provider: BILLING.provider,
    subscription: state.subscription,
    startCheckout,
    subscribeImmediately,
    manageBilling,
    cancelSubscription,
    resumeSubscription,
  };
}
