import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/** Typed browser client for client components. */
export function createBrowserSupabaseClient(supabaseUrl: string, supabaseAnonKey: string) {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Cookie-free client for static generation (generateStaticParams and other
 * build-time contexts). Returns null if env vars are not configured.
 */
export function createStaticSupabaseClient(
  supabaseUrl: string | undefined,
  supabaseAnonKey: string | undefined
) {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
