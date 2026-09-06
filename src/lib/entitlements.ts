import type { AppState, Subscription } from "./types";

/** Free-plan limits. Safety features (checking, reactions) are never capped. */
export const FREE_LIMITS = {
  savedFoods: 10,
  savedRecipes: 5,
  profiles: 1,
  monthsOfInsights: 0, // insights are Pro-only
};

/** Monthly AI-rewrite quotas, enforced server-side (mirrors the Edge Function). */
export const AI_MONTHLY = {
  free: 3,
  pro: 150, // fair-use ceiling; effectively unlimited for real usage
};

/**
 * A subscription grants Pro access while trialing or active — including after
 * a cancel, up until the period actually ends.
 */
export function isProActive(sub: Subscription, now = Date.now()): boolean {
  if (sub.status === "trialing") {
    return sub.trialEnd == null || now < sub.trialEnd;
  }
  if (sub.status === "active") {
    return sub.currentPeriodEnd == null || now < sub.currentPeriodEnd;
  }
  if (sub.status === "canceled") {
    // canceled but not yet lapsed
    return sub.currentPeriodEnd != null && now < sub.currentPeriodEnd;
  }
  return false;
}

export interface Entitlements {
  isPro: boolean;
  canSaveFood: boolean;
  canSaveRecipe: boolean;
  canUseAiRewrite: boolean;
  canUseInsights: boolean;
  canScanBarcode: boolean;
  canExportEmergencyCard: boolean;
  maxProfiles: number;
  canAddProfile: boolean;
  savedFoodCount: number;
  savedFoodLimit: number;
  savedRecipeCount: number;
  savedRecipeLimit: number;
}

export function computeEntitlements(state: AppState): Entitlements {
  const isPro = isProActive(state.subscription);
  const savedFoodCount = Object.values(state.data).reduce(
    (n, d) => n + d.foods.length,
    0,
  );
  const savedRecipeCount = Object.values(state.data).reduce(
    (n, d) => n + (d.recipes?.length ?? 0),
    0,
  );
  return {
    isPro,
    canSaveFood: isPro || savedFoodCount < FREE_LIMITS.savedFoods,
    canSaveRecipe: isPro || savedRecipeCount < FREE_LIMITS.savedRecipes,
    canUseAiRewrite: isPro,
    canUseInsights: isPro,
    canScanBarcode: isPro,
    canExportEmergencyCard: isPro,
    maxProfiles: isPro ? 8 : FREE_LIMITS.profiles,
    canAddProfile: isPro || state.profiles.length < FREE_LIMITS.profiles,
    savedFoodCount,
    savedFoodLimit: FREE_LIMITS.savedFoods,
    savedRecipeCount,
    savedRecipeLimit: FREE_LIMITS.savedRecipes,
  };
}
