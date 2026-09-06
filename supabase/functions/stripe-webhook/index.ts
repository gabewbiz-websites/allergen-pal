// Stripe webhook — the authoritative source of subscription state.
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// Then add the function URL as a webhook endpoint in the Stripe dashboard and
// set STRIPE_WEBHOOK_SECRET.
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const PRICE_MONTHLY = Deno.env.get("STRIPE_PRICE_MONTHLY") ?? "";
const PRICE_YEARLY = Deno.env.get("STRIPE_PRICE_YEARLY") ?? "";

function planFor(priceId: string | undefined): string | null {
  if (priceId && priceId === PRICE_YEARLY) return "yearly";
  if (priceId && priceId === PRICE_MONTHLY) return "monthly";
  return null;
}

/** Map a Stripe subscription to our simplified status. */
function statusFor(sub: Stripe.Subscription): string {
  if (sub.status === "trialing") return "trialing";
  if (sub.status === "active") return sub.cancel_at_period_end ? "canceled" : "active";
  if (["canceled", "unpaid", "incomplete_expired", "past_due"].includes(sub.status))
    return "expired";
  return "none";
}

async function upsertFromSubscription(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // Find the user this customer belongs to.
  const { data: row } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  let userId = row?.user_id as string | undefined;
  if (!userId) {
    // Fall back to the customer metadata we set at creation.
    const customer = await stripe.customers.retrieve(customerId);
    userId = (customer as Stripe.Customer).metadata?.user_id;
  }
  if (!userId) return;

  await supabaseAdmin.from("subscriptions").upsert({
    user_id: userId,
    provider: "stripe",
    status: statusFor(sub),
    plan: planFor(sub.items.data[0]?.price?.id),
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  });
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      webhookSecret,
    );
  } catch (e) {
    return new Response(`Webhook signature error: ${(e as Error).message}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await upsertFromSubscription(event.data.object as Stripe.Subscription);
        break;
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          await upsertFromSubscription(sub);
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    return new Response(`Handler error: ${(e as Error).message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
