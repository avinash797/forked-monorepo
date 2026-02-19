"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ForkLogo } from "@/components/icons/fork-logo";
import { track } from "@vercel/analytics";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirectTo") || "/admin";
  // Prevent open redirect — only allow relative paths
  const redirectTo =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    track("admin_login_attempt");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      track("admin_login_failed", { reason: "auth_error" });
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check admin role
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      track("admin_login_failed", { reason: "auth_error" });
      setError("Authentication failed.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      track("admin_login_failed", { reason: "not_admin" });
      await supabase.auth.signOut();
      setError("Access denied. Admin privileges required.");
      setLoading(false);
      return;
    }

    track("admin_login_success");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#221610]">
      <div className="w-full max-w-md px-8">
        <div className="flex flex-col items-center mb-8">
          <ForkLogo size={48} color="#FBBF24" />
          <h1 className="mt-4 text-2xl font-bold text-[#ECEDEE]">
            Forked Admin
          </h1>
          <p className="mt-2 text-sm text-[#9BA1A6]">
            Sign in to access the dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-sm bg-[#2A1813] border border-[#EF4444]/30 px-4 py-3 text-sm text-[#F87171]">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#c9a492] mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-[rgba(236,237,238,0.12)] bg-[#482f23] px-4 py-2.5 text-[#ECEDEE] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(238,108,43,0.40)]"
              placeholder="admin@forked.app"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#c9a492] mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-[rgba(236,237,238,0.12)] bg-[#482f23] px-4 py-2.5 text-[#ECEDEE] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(238,108,43,0.40)]"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-[#ee6c2b] px-4 py-2.5 font-semibold text-white hover:brightness-110 active:brightness-90 disabled:opacity-45 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
