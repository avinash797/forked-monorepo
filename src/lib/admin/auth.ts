import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

/**
 * Get the current admin user, or null if not authenticated/admin.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
  };
}

/**
 * Require admin access. Redirects to login if not authenticated,
 * or home if not admin. Returns the admin user.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) {
    redirect("/auth/login");
  }
  return admin;
}
