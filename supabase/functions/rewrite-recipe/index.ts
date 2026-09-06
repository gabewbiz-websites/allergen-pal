// AI "smart rewrite" (Pro): rewrites a recipe for the user's allergens with
// Claude. Verifies the caller is a signed-in Pro user before spending tokens.
// Deploy: supabase functions deploy rewrite-recipe --no-verify-jwt
// Secrets: ANTHROPIC_API_KEY (required); AI_MODEL (optional, default claude-opus-5).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
// Per Anthropic guidance the default is Opus 5; set AI_MODEL to a cheaper model
// (e.g. claude-sonnet-5 or claude-haiku-4-5) to reduce per-conversion cost.
const AI_MODEL = Deno.env.get("AI_MODEL") ?? "claude-opus-5";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const PRO_STATUSES = new Set(["trialing", "active", "canceled"]);

async function isProUser(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data || !PRO_STATUSES.has(data.status)) return false;
  if (data.status === "canceled") {
    return !!data.current_period_end && new Date(data.current_period_end) > new Date();
  }
  return true;
}

function buildPrompt(recipe: any, allergens: { label: string; severity: string }[]) {
  const allergenList = allergens.map((a) => `${a.label} (${a.severity})`).join(", ");
  return `You are a careful recipe editor for people with food allergies.

The user must AVOID these allergens: ${allergenList || "none specified"}.

Rewrite the recipe below so it is safe for them. For every ingredient that
contains one of their allergens, substitute a safe alternative that does NOT
introduce any of their other allergens. Adjust quantities and the method steps
to match the substitutions (e.g. resting a flax egg, reducing oven time). Keep
everything else faithful to the original.

Return ONLY a JSON object (no markdown, no prose) with this exact shape:
{
  "ingredients": [
    { "original": string, "rewritten": string, "changed": boolean,
      "allergen": string | null, "substitute": string | null,
      "ratio": string | null, "note": string | null,
      "impact": string | null, "unresolved": boolean }
  ],
  "instructions": [ { "original": string, "rewritten": string, "changed": boolean } ],
  "swapCount": number,
  "unresolved": string[],
  "safe": boolean,
  "summary": string
}
"swapCount" = number of changed ingredients. "unresolved" = allergen labels you
could not safely remove. "safe" = true only if nothing unsafe remains.
"impact" (for each changed ingredient) = how the finished dish may differ with
this swap — texture, flavor, rise, or cook time (e.g. "denser crumb", "milder
flavor", "browns less"). "summary" = one or two sentences on the key changes.

RECIPE
Title: ${recipe.title ?? ""}
Servings: ${recipe.servings ?? ""}
Ingredients:
${(recipe.ingredients ?? []).map((i: string) => `- ${i}`).join("\n")}
Instructions:
${(recipe.instructions ?? []).map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}`;
}

function extractJson(text: string): any {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in model response");
  return JSON.parse(text.slice(start, end + 1));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!ANTHROPIC_API_KEY) return json({ error: "AI is not configured." }, 500);

    // Require a signed-in Pro user before spending tokens.
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    if (!userData?.user) return json({ error: "Please sign in to use AI rewrite." }, 401);
    if (!(await isProUser(userData.user.id))) {
      return json({ error: "AI rewrite is a Pro feature." }, 403);
    }

    const { recipe, allergens } = await req.json();
    if (!recipe?.ingredients?.length) return json({ error: "No recipe provided." }, 400);

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 4096,
        output_config: { effort: "low" },
        messages: [{ role: "user", content: buildPrompt(recipe, allergens ?? []) }],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return json({ error: `AI request failed (${aiRes.status})`, detail: errText }, 502);
    }
    const data = await aiRes.json();
    const text = (data.content ?? [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
    const result = extractJson(text);
    result.method = "ai";
    return json(result);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
