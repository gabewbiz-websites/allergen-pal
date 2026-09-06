import { supabase } from "./supabase";
import type { AppState, Profile, ProfileData, Subscription } from "./types";

/** The slice of app state that syncs to the cloud (never the subscription). */
export interface SyncDoc {
  onboarded: boolean;
  profiles: Profile[];
  activeProfileId: string;
  data: Record<string, ProfileData>;
}

export function toSyncDoc(state: AppState): SyncDoc {
  return {
    onboarded: state.onboarded,
    profiles: state.profiles,
    activeProfileId: state.activeProfileId,
    data: state.data,
  };
}

/** Read the user's document + authoritative subscription from Supabase. */
export async function pull(
  userId: string,
): Promise<{ doc: SyncDoc | null; subscription: Subscription | null }> {
  if (!supabase) return { doc: null, subscription: null };

  const [{ data: stateRow }, { data: subRow }] = await Promise.all([
    supabase.from("user_state").select("state").eq("user_id", userId).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("status, plan, current_period_end, cancel_at_period_end, provider")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const doc = (stateRow?.state as SyncDoc | undefined) ?? null;
  const subscription = subRow
    ? {
        status: subRow.status,
        plan: subRow.plan,
        provider: subRow.provider ?? "stripe",
        currentPeriodEnd: subRow.current_period_end
          ? new Date(subRow.current_period_end).getTime()
          : null,
        trialEnd: null,
        cancelAtPeriodEnd: !!subRow.cancel_at_period_end,
      }
    : null;
  return { doc, subscription };
}

/** Upsert the user's document. Best-effort; returns success. */
export async function push(userId: string, doc: SyncDoc): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("user_state")
    .upsert(
      { user_id: userId, state: doc, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  return !error;
}
