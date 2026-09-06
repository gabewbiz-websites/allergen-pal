import type { ParsedRecipe, RewriteResult, UserAllergen } from "./types";

const FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL ?? "";

export const urlImportEnabled = !!FUNCTIONS_URL;
/** AI rewrite runs through the same Edge Functions base URL. */
export const aiEnabled = !!FUNCTIONS_URL;

export interface FetchResult {
  ok: boolean;
  recipe?: ParsedRecipe;
  error?: string;
}

/**
 * Fetch and parse a recipe from a URL via the Supabase Edge Function
 * (browsers can't fetch recipe sites directly — CORS). When the function
 * isn't configured, the caller should fall back to pasting the recipe.
 */
export async function fetchRecipeFromUrl(url: string): Promise<FetchResult> {
  if (!FUNCTIONS_URL) {
    return {
      ok: false,
      error:
        "Recipe-by-URL needs the recipe service turned on. Paste the recipe text instead, or see SETUP.md.",
    };
  }
  try {
    const res = await fetch(`${FUNCTIONS_URL}/fetch-recipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.error ?? `Couldn't read that page (${res.status}).` };
    }
    const recipe = (await res.json()) as ParsedRecipe;
    if (!recipe.ingredients?.length) {
      return { ok: false, error: "No recipe found on that page. Try pasting the text." };
    }
    return { ok: true, recipe };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export interface AiRewriteResult {
  ok: boolean;
  result?: RewriteResult;
  error?: string;
  /** "signin" (not authenticated) or "quota" (monthly limit reached). */
  code?: string;
  isPro?: boolean;
}

/**
 * AI "smart rewrite" via the Claude-backed Edge Function (Pro). Falls back
 * gracefully when not configured; the caller can use the offline rule engine.
 */
export async function aiRewriteRecipe(
  recipe: ParsedRecipe,
  allergens: UserAllergen[],
  accessToken: string | undefined,
): Promise<AiRewriteResult> {
  if (!FUNCTIONS_URL) {
    return { ok: false, error: "AI rewrite isn't configured in this build." };
  }
  try {
    const res = await fetch(`${FUNCTIONS_URL}/rewrite-recipe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        recipe,
        allergens: allergens.map((a) => ({ label: a.label, severity: a.severity })),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: body.error ?? `AI rewrite failed (${res.status}).`,
        code: body.code,
        isPro: body.isPro,
      };
    }
    const result = (await res.json()) as RewriteResult;
    return { ok: true, result: { ...result, method: "ai" } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
