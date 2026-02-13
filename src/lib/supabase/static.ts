import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Supabase client for static generation (build time).
 * Does NOT use cookies — safe for generateStaticParams and other build-time contexts.
 * Returns null if env vars are not configured.
 */
export function createStaticClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || !url.startsWith("http")) {
    return null;
  }

  return createSupabaseClient<Database>(url, key);
}
