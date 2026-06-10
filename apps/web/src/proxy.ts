import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const IS_WAITLIST_MODE = process.env.NEXT_PUBLIC_WAITLIST_MODE === "true";

// Routes hidden entirely when NEXT_PUBLIC_WAITLIST_MODE=true
const WAITLIST_GATED_PREFIXES = ["/leaderboard", "/blog"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Drop gated routes in waitlist mode — redirect to home before any page renders
  if (IS_WAITLIST_MODE) {
    const isGated = WAITLIST_GATED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    );
    if (isGated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Run Supabase session refresh only for routes that need auth
  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) {
    return await updateSession(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/auth/:path*",
    "/leaderboard",
    "/leaderboard/:path*",
    "/blog",
    "/blog/:path*",
  ],
};
