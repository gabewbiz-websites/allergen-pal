import type { IngredientRewrite, UserAllergen } from "./types";

/** A candidate replacement for an allergen-containing ingredient. */
export interface Substitute {
  name: string;
  /** Conversion guidance, e.g. "1:1" or "1 tbsp ground flax + 3 tbsp water per egg". */
  ratio: string;
  /** Allergen ids this substitute itself contains (so we never introduce one). */
  contains?: string[];
  /** How to use it. */
  note?: string;
  /** How the dish may turn out differently — texture, flavor, timing. */
  impact?: string;
}

interface SubRule {
  /** Allergen id this rule addresses. */
  allergen: string;
  /** Lowercase ingredient keywords that trigger this rule (longest match wins). */
  match: string[];
  /** Ordered by preference; first one that's safe for the user is chosen. */
  substitutes: Substitute[];
}

/**
 * Ingredient-level substitution rules, grouped by the allergen they resolve.
 * Ordered most-specific first within each allergen so "almond flour" matches
 * before a bare "almond". Substitutes are tagged with the allergens they carry
 * so the picker can skip any that collide with the user's other allergens.
 */
const RULES: SubRule[] = [
  // ---- Milk / dairy -------------------------------------------------------
  { allergen: "milk", match: ["buttermilk"], substitutes: [
    { name: "oat milk + 1 tbsp lemon juice (per cup)", ratio: "1:1", note: "Let sit 5 min to curdle." },
    { name: "soy milk + 1 tbsp vinegar (per cup)", ratio: "1:1", contains: ["soy"] },
  ]},
  { allergen: "milk", match: ["heavy cream", "double cream", "whipping cream"], substitutes: [
    { name: "full-fat coconut cream", ratio: "1:1", impact: "Faint coconut flavor; whips when well chilled." },
    { name: "cashew cream", ratio: "1:1", contains: ["treenut"], impact: "Rich and neutral; blend until smooth." },
  ]},
  { allergen: "milk", match: ["butter"], substitutes: [
    { name: "vegan butter", ratio: "1:1", note: "Use a stick, not a spread, for baking.", impact: "Behaves like butter; result is nearly identical." },
    { name: "coconut oil", ratio: "1:1", impact: "Adds a subtle coconut note and firms up when cold." },
    { name: "olive oil", ratio: "¾ the amount", impact: "Savory flavor — better for cooking than sweet bakes." },
  ]},
  { allergen: "milk", match: ["cream cheese"], substitutes: [
    { name: "dairy-free cream cheese", ratio: "1:1" },
  ]},
  { allergen: "milk", match: ["cheese", "parmesan", "cheddar", "mozzarella"], substitutes: [
    { name: "dairy-free cheese", ratio: "1:1" },
    { name: "nutritional yeast", ratio: "to taste", note: "Great for a cheesy, savory flavor." },
  ]},
  { allergen: "milk", match: ["yogurt", "yoghurt"], substitutes: [
    { name: "coconut yogurt", ratio: "1:1" },
    { name: "soy yogurt", ratio: "1:1", contains: ["soy"] },
  ]},
  { allergen: "milk", match: ["ice cream"], substitutes: [
    { name: "dairy-free ice cream", ratio: "1:1" },
  ]},
  { allergen: "milk", match: ["whole milk", "skim milk", "milk"], substitutes: [
    { name: "oat milk", ratio: "1:1", impact: "Very close to dairy milk; slightly sweeter and creamier." },
    { name: "rice milk", ratio: "1:1", impact: "Thinner and a touch sweet." },
    { name: "soy milk", ratio: "1:1", contains: ["soy"], impact: "Closest in protein; neutral flavor." },
    { name: "almond milk", ratio: "1:1", contains: ["treenut"], impact: "Thinner with a mild nutty note." },
  ]},

  // ---- Egg ----------------------------------------------------------------
  { allergen: "egg", match: ["egg whites", "egg white"], substitutes: [
    { name: "aquafaba", ratio: "3 tbsp per egg white", note: "Whips like egg whites." },
  ]},
  { allergen: "egg", match: ["egg wash"], substitutes: [
    { name: "plant milk", ratio: "as needed", note: "Brush on for shine." },
  ]},
  { allergen: "egg", match: ["eggs", "egg"], substitutes: [
    { name: "flax egg", ratio: "per egg", note: "1 tbsp ground flax + 3 tbsp water, rested 5 min.", impact: "Great binder, but adds no lift — result is denser. Not for meringues or airy sponges." },
    { name: "unsweetened applesauce", ratio: "¼ cup per egg", note: "Best for moist bakes.", impact: "Softer, moister crumb and a touch sweeter." },
    { name: "egg replacer", ratio: "per package", impact: "Closest all-round match; follow the box." },
  ]},

  // ---- Wheat / gluten -----------------------------------------------------
  { allergen: "wheat", match: ["all-purpose flour", "all purpose flour", "plain flour", "wheat flour", "bread flour", "flour"], substitutes: [
    { name: "gluten-free 1:1 baking flour", ratio: "1:1", note: "Use a blend with xanthan gum.", impact: "Crumb can be slightly denser or more delicate; let batter rest 10 min." },
    { name: "oat flour (certified GF)", ratio: "1:1", impact: "Softer, more tender bake; may need a bit more binder." },
  ]},
  { allergen: "wheat", match: ["breadcrumbs", "bread crumbs", "panko"], substitutes: [
    { name: "gluten-free breadcrumbs", ratio: "1:1" },
    { name: "crushed GF crackers", ratio: "1:1" },
  ]},
  { allergen: "wheat", match: ["soy sauce"], substitutes: [
    { name: "tamari (gluten-free)", ratio: "1:1", contains: ["soy"] },
    { name: "coconut aminos", ratio: "1:1" },
  ]},
  { allergen: "wheat", match: ["pasta", "spaghetti", "noodles"], substitutes: [
    { name: "gluten-free pasta", ratio: "1:1" },
  ]},
  { allergen: "wheat", match: ["flour tortilla", "tortilla"], substitutes: [
    { name: "corn or gluten-free tortilla", ratio: "1:1" },
  ]},
  { allergen: "wheat", match: ["bread", "bun", "roll"], substitutes: [
    { name: "gluten-free bread", ratio: "1:1" },
  ]},

  // ---- Peanut -------------------------------------------------------------
  { allergen: "peanut", match: ["peanut butter"], substitutes: [
    { name: "sunflower seed butter", ratio: "1:1", impact: "Nearly identical texture; can turn green with baking soda (harmless)." },
    { name: "tahini", ratio: "1:1", contains: ["sesame"], impact: "Thinner and more bitter; add a little sweetener." },
    { name: "soy nut butter", ratio: "1:1", contains: ["soy"], impact: "Very close in taste and texture." },
  ]},
  { allergen: "peanut", match: ["peanut oil"], substitutes: [
    { name: "sunflower or canola oil", ratio: "1:1" },
  ]},
  { allergen: "peanut", match: ["peanuts", "peanut"], substitutes: [
    { name: "roasted sunflower seeds", ratio: "1:1" },
    { name: "toasted pumpkin seeds", ratio: "1:1" },
  ]},

  // ---- Tree nuts ----------------------------------------------------------
  { allergen: "treenut", match: ["almond flour", "almond meal"], substitutes: [
    { name: "sunflower seed flour", ratio: "1:1" },
    { name: "oat flour (certified GF)", ratio: "1:1", contains: ["wheat"] },
  ]},
  { allergen: "treenut", match: ["almond milk", "cashew milk"], substitutes: [
    { name: "oat milk", ratio: "1:1" },
  ]},
  { allergen: "treenut", match: ["almond butter", "cashew butter", "nut butter"], substitutes: [
    { name: "sunflower seed butter", ratio: "1:1" },
  ]},
  { allergen: "treenut", match: ["almonds", "cashews", "walnuts", "pecans", "hazelnuts", "pistachios", "pine nuts", "almond", "cashew", "walnut", "pecan", "hazelnut", "pistachio"], substitutes: [
    { name: "toasted pumpkin seeds", ratio: "1:1" },
    { name: "roasted sunflower seeds", ratio: "1:1" },
    { name: "toasted coconut flakes", ratio: "1:1" },
  ]},

  // ---- Soy ----------------------------------------------------------------
  { allergen: "soy", match: ["soy sauce"], substitutes: [
    { name: "coconut aminos", ratio: "1:1" },
  ]},
  { allergen: "soy", match: ["tofu"], substitutes: [
    { name: "chickpeas", ratio: "1:1", impact: "Firmer, beanier bite; press or roast for texture." },
  ]},
  { allergen: "soy", match: ["tempeh"], substitutes: [
    { name: "chickpeas or mushrooms", ratio: "1:1" },
  ]},
  { allergen: "soy", match: ["edamame"], substitutes: [
    { name: "green peas", ratio: "1:1" },
  ]},
  { allergen: "soy", match: ["soy milk"], substitutes: [
    { name: "oat milk", ratio: "1:1" },
  ]},
  { allergen: "soy", match: ["miso"], substitutes: [
    { name: "chickpea miso", ratio: "1:1" },
  ]},

  // ---- Fish ---------------------------------------------------------------
  { allergen: "fish", match: ["fish sauce"], substitutes: [
    { name: "coconut aminos", ratio: "1:1", note: "Add a pinch of salt." },
  ]},
  { allergen: "fish", match: ["anchovy", "anchovies"], substitutes: [
    { name: "capers", ratio: "1:1" },
  ]},
  { allergen: "fish", match: ["salmon", "tuna", "cod", "tilapia", "haddock", "fish"], substitutes: [
    { name: "chicken breast", ratio: "1:1", impact: "Milder, meatier; cook longer to cook through." },
    { name: "hearts of palm", ratio: "1:1", impact: "Flaky, plant-based texture for a lighter dish." },
  ]},

  // ---- Shellfish ----------------------------------------------------------
  { allergen: "shellfish", match: ["shrimp", "prawns", "prawn"], substitutes: [
    { name: "hearts of palm", ratio: "1:1" },
    { name: "chicken", ratio: "1:1" },
  ]},
  { allergen: "shellfish", match: ["crab", "lobster"], substitutes: [
    { name: "hearts of palm", ratio: "1:1" },
    { name: "jackfruit", ratio: "1:1" },
  ]},
  { allergen: "shellfish", match: ["scallops", "clams", "mussels", "oysters"], substitutes: [
    { name: "king oyster mushrooms", ratio: "1:1" },
  ]},

  // ---- Sesame -------------------------------------------------------------
  { allergen: "sesame", match: ["tahini"], substitutes: [
    { name: "sunflower seed butter", ratio: "1:1" },
  ]},
  { allergen: "sesame", match: ["sesame oil"], substitutes: [
    { name: "olive oil", ratio: "1:1", note: "You'll lose the toasty flavor." },
  ]},
  { allergen: "sesame", match: ["sesame seeds", "sesame"], substitutes: [
    { name: "poppy or hemp seeds", ratio: "1:1" },
  ]},
];

function userAllergenIds(userAllergens: UserAllergen[]): Set<string> {
  return new Set(userAllergens.map((a) => a.id));
}

/** Pick the first substitute that doesn't contain any of the user's allergens. */
function pickSubstitute(
  rule: SubRule,
  userIds: Set<string>,
): Substitute | undefined {
  return rule.substitutes.find(
    (s) => !(s.contains ?? []).some((c) => userIds.has(c)),
  );
}

/**
 * Rewrite one ingredient line for the user's allergens. Replaces the matched
 * food term in-place, preserving quantities. Only the user's own allergens are
 * considered "unsafe".
 */
function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-word (or phrase) match, so "egg" doesn't hit "eggplant". */
function wordMatch(haystackLower: string, termLower: string): boolean {
  return new RegExp(`\\b${esc(termLower)}\\b`, "i").test(haystackLower);
}

export function rewriteIngredient(
  line: string,
  userAllergens: UserAllergen[],
): IngredientRewrite {
  const userIds = userAllergenIds(userAllergens);
  const lower = line.toLowerCase();

  // Consider only rules for allergens the user actually has, longest match first.
  const candidates = RULES.filter((r) => userIds.has(r.allergen))
    .flatMap((r) => r.match.map((m) => ({ rule: r, m })))
    .filter(({ m }) => wordMatch(lower, m))
    .sort((a, b) => b.m.length - a.m.length);

  if (candidates.length === 0) {
    return { original: line, rewritten: line, changed: false };
  }

  const { rule, m } = candidates[0];
  const sub = pickSubstitute(rule, userIds);
  if (!sub) {
    return {
      original: line,
      rewritten: line,
      changed: false,
      allergen: rule.allergen,
      unresolved: true,
    };
  }

  // Replace the matched term as a whole word, preserving quantities around it.
  const re = new RegExp(`\\b${esc(m)}\\b`, "i");
  const rewritten = line.replace(re, sub.name);
  return {
    original: line,
    rewritten,
    changed: true,
    allergen: rule.allergen,
    substitute: sub.name,
    matchedTerm: m,
    ratio: sub.ratio,
    note: sub.note,
    impact: sub.impact,
  };
}

/** Map of matched term -> substitute name, for rewriting instruction prose. */
export function buildStepReplacements(
  rewrites: IngredientRewrite[],
): { from: string; to: string }[] {
  const pairs: { from: string; to: string }[] = [];
  for (const r of rewrites) {
    if (!r.changed || !r.substitute || !r.matchedTerm) continue;
    // Use a short form of the substitute (before any parenthesis).
    pairs.push({ from: r.matchedTerm, to: r.substitute.split(" (")[0] });
  }
  // Longest source first so we don't partially replace.
  return pairs.sort((a, b) => b.from.length - a.from.length);
}

/** Apply ingredient substitutions to a step's prose. */
export function rewriteStep(
  step: string,
  replacements: { from: string; to: string }[],
): string {
  let out = step;
  for (const { from, to } of replacements) {
    const re = new RegExp(`\\b${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    out = out.replace(re, to);
  }
  return out;
}
