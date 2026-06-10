import { createStaticSupabaseClient } from "@forked/supabase/web";

/**
 * Supabase client for static generation (build time).
 * Does NOT use cookies — safe for generateStaticParams and other build-time contexts.
 * Returns null if env vars are not configured.
 */
export function createStaticClient() {
  return createStaticSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
