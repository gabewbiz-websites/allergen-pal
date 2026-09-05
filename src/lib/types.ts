export type Severity = "mild" | "moderate" | "severe";

export type Verdict = "safe" | "caution" | "avoid";

/** A user's sensitivity to a specific allergen. */
export interface UserAllergen {
  /** Allergen catalog id, or a custom slug. */
  id: string;
  /** Display label (needed for custom allergens). */
  label: string;
  emoji: string;
  severity: Severity;
  /** Extra keywords the user wants matched, e.g. a brand or a specific food. */
  customKeywords?: string[];
}

export interface FoodEntry {
  id: string;
  name: string;
  /** Raw ingredient text the user pasted or typed. */
  ingredients: string;
  /** Allergen ids that were flagged. */
  flagged: string[];
  verdict: Verdict;
  notes?: string;
  createdAt: number;
  favorite?: boolean;
}

export interface ReactionEntry {
  id: string;
  severity: Severity;
  symptoms: string[];
  suspectedTrigger: string;
  notes?: string;
  /** epoch ms of when the reaction happened. */
  occurredAt: number;
  createdAt: number;
}

export interface EmergencyInfo {
  fullName: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medications: string;
  bloodType: string;
  doctorPhone: string;
  notes: string;
}

export interface Profile {
  displayName: string;
  onboarded: boolean;
  isPro: boolean;
  emergency: EmergencyInfo;
}

export interface AppState {
  profile: Profile;
  allergens: UserAllergen[];
  foods: FoodEntry[];
  reactions: ReactionEntry[];
}
