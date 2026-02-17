import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = process.env.REVALIDATION_TOKEN;

  if (!token || authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { path } = body as { path?: string };

    if (path) {
      // Only allow revalidation of known public content paths
      const allowedPrefixes = ["/leaderboard", "/blog", "/about", "/how-it-works"];
      const isAllowed = path === "/" || allowedPrefixes.some((p) => path.startsWith(p));
      if (!isAllowed) {
        return NextResponse.json({ error: "Path not allowed" }, { status: 400 });
      }
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path });
    }

    // Default: revalidate all leaderboard pages
    revalidatePath("/leaderboard", "layout");
    revalidatePath("/", "page");

    return NextResponse.json({ revalidated: true, path: "all" });
  } catch {
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}
