import { type NextRequest, NextResponse } from "next/server";
import { createStaticClient } from "@/lib/supabase/static";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * CDN-cached leaderboard reads.
 *
 * `get_leaderboard` is public and identical for every caller, so responses
 * are served with `s-maxage` — repeat pulls (the mobile app's hottest query)
 * hit the CDN instead of Postgres, cutting Supabase egress. Accepted
 * staleness is ~5 minutes.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const cityId = params.get("city_id");
  const dishTypeId = params.get("dish_type_id");
  const neighborhoodId = params.get("neighborhood_id");
  const limit = Math.min(Number(params.get("limit") ?? 25) || 25, 100);

  if (!cityId || !UUID_RE.test(cityId) || !dishTypeId || !UUID_RE.test(dishTypeId)) {
    return NextResponse.json(
      { error: "city_id and dish_type_id are required UUIDs" },
      { status: 400 },
    );
  }
  if (neighborhoodId && !UUID_RE.test(neighborhoodId)) {
    return NextResponse.json(
      { error: "neighborhood_id must be a UUID" },
      { status: 400 },
    );
  }

  const supabase = createStaticClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  try {
    const { data, error } = await supabase.rpc("get_leaderboard", {
      p_city_id: cityId,
      p_dish_type_id: dishTypeId,
      p_neighborhood_id: neighborhoodId ?? undefined,
      p_limit: limit,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json(data ?? [], {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}
