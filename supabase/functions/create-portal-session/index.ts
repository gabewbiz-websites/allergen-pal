// Opens the Stripe Billing Portal for the signed-in user to manage/cancel.
// Deploy: supabase functions deploy create-portal-session --no-verify-jwt
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !userData.user) return json({ error: "Unauthorized" }, 401);

    const { returnUrl } = await req.json();
    const { data: subRow } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!subRow?.stripe_customer_id) {
      return json({ error: "No billing account found." }, 400);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subRow.stripe_customer_id as string,
      return_url: returnUrl,
    });
    return json({ url: session.url });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
