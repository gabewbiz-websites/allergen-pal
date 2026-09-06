// Fetches a recipe page and extracts a structured recipe from its
// schema.org/Recipe JSON-LD (used by most recipe sites & the WP Recipe Maker
// plugin). Runs server-side so the browser's CORS limits don't apply.
// Deploy: supabase functions deploy fetch-recipe --no-verify-jwt
import { corsHeaders } from "../_shared/cors.ts";

interface ParsedRecipe {
  title: string;
  image?: string;
  sourceUrl?: string;
  sourceName?: string;
  servings?: string;
  totalTime?: string;
  ingredients: string[];
  instructions: string[];
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Pull every JSON-LD object out of the HTML, flattening @graph arrays. */
function extractJsonLd(html: string): any[] {
  const blocks: any[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const it of items) {
        if (it && it["@graph"]) blocks.push(...it["@graph"]);
        else blocks.push(it);
      }
    } catch {
      /* skip malformed block */
    }
  }
  return blocks;
}

function hasType(node: any, type: string): boolean {
  const t = node?.["@type"];
  if (!t) return false;
  return Array.isArray(t) ? t.includes(type) : t === type;
}

function toText(v: any): string {
  if (typeof v === "string") return v.trim();
  if (v && typeof v.text === "string") return v.text.trim();
  if (v && typeof v.name === "string") return v.name.trim();
  return "";
}

function parseInstructions(ri: any): string[] {
  if (!ri) return [];
  if (typeof ri === "string") {
    return ri
      .split(/\r?\n|(?<=\.)\s{1,}(?=[A-Z])/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const out: string[] = [];
  const arr = Array.isArray(ri) ? ri : [ri];
  for (const item of arr) {
    if (hasType(item, "HowToSection") && Array.isArray(item.itemListElement)) {
      for (const step of item.itemListElement) out.push(toText(step));
    } else {
      out.push(toText(item));
    }
  }
  return out.filter(Boolean);
}

/** ISO-8601 duration (PT1H30M) → "1 hr 30 min". */
function humanDuration(iso?: string): string | undefined {
  if (!iso || typeof iso !== "string") return undefined;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return undefined;
  const h = m[1] ? `${m[1]} hr` : "";
  const min = m[2] ? `${m[2]} min` : "";
  return [h, min].filter(Boolean).join(" ") || undefined;
}

function firstImage(img: any): string | undefined {
  if (!img) return undefined;
  if (typeof img === "string") return img;
  if (Array.isArray(img)) return firstImage(img[0]);
  if (typeof img.url === "string") return img.url;
  return undefined;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") return json({ error: "Missing url" }, 400);

    const res = await fetch(url, {
      headers: {
        // Some sites gate on a browser-like UA.
        "User-Agent":
          "Mozilla/5.0 (compatible; AllergenPal/1.0; +https://allergen-pal.app)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    if (!res.ok) return json({ error: `Source returned ${res.status}` }, 400);
    const html = await res.text();

    const nodes = extractJsonLd(html);
    const recipeNode = nodes.find((n) => hasType(n, "Recipe"));
    if (!recipeNode) {
      return json({ error: "No structured recipe found on that page." }, 422);
    }

    const ingredients: string[] = Array.isArray(recipeNode.recipeIngredient)
      ? recipeNode.recipeIngredient.map((s: any) => String(s).trim()).filter(Boolean)
      : [];

    const host = (() => {
      try {
        return new URL(url).hostname.replace(/^www\./, "");
      } catch {
        return undefined;
      }
    })();

    const recipe: ParsedRecipe = {
      title: toText(recipeNode.name) || "Recipe",
      image: firstImage(recipeNode.image),
      sourceUrl: url,
      sourceName: host,
      servings: recipeNode.recipeYield
        ? String(
            Array.isArray(recipeNode.recipeYield)
              ? recipeNode.recipeYield[0]
              : recipeNode.recipeYield,
          )
        : undefined,
      totalTime: humanDuration(recipeNode.totalTime),
      ingredients,
      instructions: parseInstructions(recipeNode.recipeInstructions),
    };

    if (recipe.ingredients.length === 0) {
      return json({ error: "Found a recipe but couldn't read its ingredients." }, 422);
    }
    return json(recipe);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
