export type Severity = "mild" | "moderate" | "severe";

export type Verdict = "safe" | "caution" | "avoid";

/** A person whose allergens we track. The first one is the account owner. */
export interface Profile {
  id: string;
  name: string;
  emoji: string;
  /** "self" for the owner, else a family member. */
  relation: "self" | "family";
}

/** A profile's sensitivity to a specific allergen. */
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
  /** Barcode this was looked up from, if any. */
  barcode?: string;
  /** Brand from a product lookup, if any. */
  brand?: string;
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

/** All the data that belongs to a single profile. */
export interface ProfileData {
  allergens: UserAllergen[];
  foods: FoodEntry[];
  reactions: ReactionEntry[];
  emergency: EmergencyInfo;
}

export type Plan = "monthly" | "yearly";

export type SubscriptionStatus =
  | "none" // free, never subscribed
  | "trialing" // in free trial
  | "active" // paying
  | "canceled" // will lapse at period end
  | "expired"; // trial/sub ended

export type BillingProvider = "simulated" | "stripe";

export interface Subscription {
  status: SubscriptionStatus;
  plan: Plan | null;
  provider: BillingProvider;
  /** epoch ms the current paid/trial period ends. */
  currentPeriodEnd: number | null;
  /** epoch ms the trial ends (during trialing). */
  trialEnd: number | null;
  /** true once the user asked to cancel; access remains until period end. */
  cancelAtPeriodEnd: boolean;
  /** Stripe identifiers when provider === "stripe". */
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

/** Signed-in account, or guest when userId is null. */
export interface Account {
  userId: string | null;
  email: string | null;
  /** last time cloud sync completed. */
  lastSyncedAt: number | null;
}

export interface AppState {
  account: Account;
  subscription: Subscription;
  onboarded: boolean;
  profiles: Profile[];
  activeProfileId: string;
  /** profileId -> that profile's data. */
  data: Record<string, ProfileData>;
}
