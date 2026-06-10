import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import type { Database } from './database.types';

/**
 * Typed server client. Cookie handlers are injected by the caller so this
 * package stays framework-agnostic (works from Next.js server components,
 * route handlers, and middleware alike).
 */
export function createServerSupabaseClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  cookies: CookieMethodsServer
) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, { cookies });
}
