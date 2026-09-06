import type {
  ParsedRecipe,
  RewriteResult,
  SavedRecipe,
  UserAllergen,
} from "./types";
import { buildStepReplacements, rewriteIngredient, rewriteStep } from "./substitutions";

/**
 * Rewrite a whole recipe for the user's allergens using the offline rule
 * engine. Ingredient swaps drive matching replacements in the instructions.
 */
export function rewriteRecipe(
  recipe: ParsedRecipe,
  userAllergens: UserAllergen[],
): RewriteResult {
  const ingredients = recipe.ingredients.map((line) =>
    rewriteIngredient(line, userAllergens),
  );
  const replacements = buildStepReplacements(ingredients);
  const instructions = recipe.instructions.map((step) => {
    const rewritten = rewriteStep(step, replacements);
    return { original: step, rewritten, changed: rewritten !== step };
  });

  const swapCount = ingredients.filter((i) => i.changed).length;
  const unresolved = [
    ...new Set(
      ingredients.filter((i) => i.unresolved && i.allergen).map((i) => i.allergen!),
    ),
  ];
  return {
    ingredients,
    instructions,
    swapCount,
    unresolved,
    safe: unresolved.length === 0,
    method: "rules",
  };
}

/**
 * Split a pasted block into clean, non-empty lines. Strips leading list
 * markers (bullets, and ordinals like "1." / "2)") WITHOUT touching quantities
 * like "2 cups" — a bare number followed by a space and a word is kept.
 */
export function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) =>
      l
        .replace(/^\s*[•\-*·▢□]\s*/, "") // bullet markers
        .replace(/^\s*\d+[.)]\s+/, "") // "1. " / "2) " ordinals only
        .trim(),
    )
    .filter((l) => l.length > 0);
}

export function parsePastedRecipe(
  title: string,
  ingredientsText: string,
  stepsText: string,
): ParsedRecipe {
  return {
    title: title.trim() || "My recipe",
    ingredients: splitLines(ingredientsText),
    instructions: splitLines(stepsText),
  };
}

/** Render a saved recipe's safe version as shareable/printable plain text. */
export function recipeToText(r: SavedRecipe): string {
  const lines: string[] = [];
  lines.push(r.title + " (allergen-safe)");
  if (r.servings) lines.push(`Serves: ${r.servings}`);
  if (r.totalTime) lines.push(`Time: ${r.totalTime}`);
  lines.push("");
  lines.push("INGREDIENTS");
  for (const i of r.result.ingredients) {
    lines.push(`• ${i.rewritten}${i.changed ? "  ← swapped" : ""}`);
  }
  lines.push("");
  lines.push("INSTRUCTIONS");
  r.result.instructions.forEach((s, idx) => lines.push(`${idx + 1}. ${s.rewritten}`));
  if (r.sourceUrl) {
    lines.push("");
    lines.push(`Adapted from: ${r.sourceUrl}`);
  }
  lines.push("— Made allergen-safe with Allergen Pal");
  return lines.join("\n");
}
