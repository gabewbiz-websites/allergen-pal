import type { UserAllergen, Verdict } from "./types";

export interface AllergenDef {
  id: string;
  label: string;
  emoji: string;
  /** Lowercase substrings that indicate this allergen is present. */
  keywords: string[];
}

/**
 * The FDA "big 9" major allergens plus gluten — the set that covers the
 * overwhelming majority of food-allergy needs. Keyword lists include the
 * common "hidden" names people miss on labels.
 */
export const ALLERGEN_CATALOG: AllergenDef[] = [
  {
    id: "peanut",
    label: "Peanuts",
    emoji: "🥜",
    keywords: ["peanut", "arachis", "groundnut", "goober", "beer nut", "mandelona"],
  },
  {
    id: "treenut",
    label: "Tree nuts",
    emoji: "🌰",
    keywords: [
      "almond", "cashew", "walnut", "pecan", "hazelnut", "pistachio",
      "macadamia", "brazil nut", "pine nut", "chestnut", "praline",
      "marzipan", "nut butter", "nougat", "gianduja",
    ],
  },
  {
    id: "milk",
    label: "Milk / Dairy",
    emoji: "🥛",
    keywords: [
      "milk", "casein", "caseinate", "whey", "lactose", "butter", "buttermilk",
      "cream", "cheese", "ghee", "curd", "custard", "yogurt", "yoghurt",
      "lactalbumin", "dairy",
    ],
  },
  {
    id: "egg",
    label: "Eggs",
    emoji: "🥚",
    keywords: [
      "egg", "albumin", "albumen", "mayonnaise", "meringue", "ovalbumin",
      "lysozyme", "globulin", "livetin",
    ],
  },
  {
    id: "soy",
    label: "Soy",
    emoji: "🫘",
    keywords: [
      "soy", "soya", "soybean", "edamame", "tofu", "tempeh", "miso",
      "tamari", "lecithin", "textured vegetable protein", "tvp",
    ],
  },
  {
    id: "wheat",
    label: "Wheat / Gluten",
    emoji: "🌾",
    keywords: [
      "wheat", "gluten", "flour", "barley", "rye", "malt", "semolina",
      "spelt", "durum", "farro", "couscous", "bulgur", "seitan", "bran",
      "graham", "triticale",
    ],
  },
  {
    id: "fish",
    label: "Fish",
    emoji: "🐟",
    keywords: [
      "fish", "cod", "salmon", "tuna", "tilapia", "haddock", "anchovy",
      "bass", "trout", "sardine", "pollock", "worcestershire", "surimi",
    ],
  },
  {
    id: "shellfish",
    label: "Shellfish",
    emoji: "🦐",
    keywords: [
      "shellfish", "shrimp", "prawn", "crab", "lobster", "crawfish",
      "crayfish", "clam", "mussel", "oyster", "scallop", "squid",
      "calamari", "octopus", "crustacean", "krill",
    ],
  },
  {
    id: "sesame",
    label: "Sesame",
    emoji: "🫙",
    keywords: ["sesame", "tahini", "benne", "sesamol", "gingelly", "til"],
  },
];

export function allergenById(id: string): AllergenDef | undefined {
  return ALLERGEN_CATALOG.find((a) => a.id === id);
}

/**
 * Scan a free-text ingredient list against the user's allergens.
 * Returns the ids of user allergens whose keywords appear in the text.
 */
export function scanIngredients(
  ingredients: string,
  userAllergens: UserAllergen[],
): string[] {
  const text = ` ${ingredients.toLowerCase()} `;
  const hits: string[] = [];
  for (const ua of userAllergens) {
    const def = allergenById(ua.id);
    const keywords = [
      ...(def?.keywords ?? [ua.label.toLowerCase()]),
      ...(ua.customKeywords ?? []).map((k) => k.toLowerCase()),
    ];
    if (keywords.some((kw) => kw && text.includes(kw))) {
      hits.push(ua.id);
    }
  }
  return hits;
}

/** Worst severity among the flagged allergens drives the verdict. */
export function verdictFor(
  flagged: string[],
  userAllergens: UserAllergen[],
): Verdict {
  if (flagged.length === 0) return "safe";
  const flaggedSet = new Set(flagged);
  const anySevere = userAllergens.some(
    (u) => flaggedSet.has(u.id) && u.severity === "severe",
  );
  return anySevere ? "avoid" : "caution";
}
