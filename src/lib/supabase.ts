import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/**
 * A configured Supabase client, or null when the app runs in local/guest mode
 * (no env keys). Every cloud path checks for null and degrades gracefully, so
 * the app is fully usable offline with no backend.
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;

export const isCloudEnabled = supabase !== null;
