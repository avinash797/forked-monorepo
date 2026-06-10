import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type ReportReason = Database["public"]["Enums"]["report_reason"];
export type ReportStatus = Database["public"]["Enums"]["report_status"];

// Shape of a content_reports row (post-migration). The generated DB types
// are extended here with the admin-resolution fields so this file compiles
// before types are regenerated. After type regen these fields already exist
// on the base Row type and the intersection is a no-op.
type ContentReportRow = Database["public"]["Tables"]["content_reports"]["Row"] & {
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_action: string | null;
  admin_notes: string | null;
};

export type ReportedUser = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_banned: boolean;
  warn_count: number;
};

export type ReportedRating = {
  id: string;
  photo_url: string | null;
  photo_storage_path: string | null;
  derived_score: number | null;
  created_at: string | null;
  notes: string | null;
  user_id: string;
  restaurant_name: string;
  dish_type_name: string;
  reported_user: ReportedUser | null;
};

export type ContentReport = ContentReportRow & {
  reporter: {
    id: string;
    display_name: string | null;
    username: string | null;
  } | null;
  rating: ReportedRating | null;
};

export type ReportFilters = {
  status?: ReportStatus | "all";
  reason?: ReportReason | "all";
  page?: number;
  perPage?: number;
};

const RATING_JOIN =
  "id, photo_url, photo_storage_path, derived_score, created_at, notes, user_id, " +
  "restaurants(name), dish_types(name), " +
  "profiles!personal_ratings_user_id_fkey(id, display_name, username, avatar_url, is_banned, warn_count)";

const REPORTER_JOIN =
  "profiles!content_reports_reporter_id_fkey(id, display_name, username)";

type RawReportRow = ContentReportRow & {
  rating: {
    id: string;
    photo_url: string | null;
    photo_storage_path: string | null;
    derived_score: number | null;
    created_at: string | null;
    notes: string | null;
    user_id: string;
    restaurants: { name: string } | null;
    dish_types: { name: string } | null;
    profiles: {
      id: string;
      display_name: string | null;
      username: string | null;
      avatar_url: string | null;
      is_banned: boolean;
      warn_count: number;
    } | null;
  } | null;
  reporter: {
    id: string;
    display_name: string | null;
    username: string | null;
  } | null;
};

function hydrateReport(row: RawReportRow): ContentReport {
  const rating = row.rating
    ? {
        id: row.rating.id,
        photo_url: row.rating.photo_url,
        photo_storage_path: row.rating.photo_storage_path,
        derived_score: row.rating.derived_score,
        created_at: row.rating.created_at,
        notes: row.rating.notes,
        user_id: row.rating.user_id,
        restaurant_name: row.rating.restaurants?.name ?? "Unknown",
        dish_type_name: row.rating.dish_types?.name ?? "Unknown",
        reported_user: row.rating.profiles ?? null,
      }
    : null;

  return {
    ...row,
    rating,
    reporter: row.reporter,
  };
}

export async function getPendingReportCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("content_reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

export async function getReportCounts() {
  const supabase = await createClient();
  const statuses: ReportStatus[] = [
    "pending",
    "reviewed",
    "dismissed",
    "actioned",
  ];
  const results = await Promise.all(
    statuses.map((s) =>
      supabase
        .from("content_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", s)
        .then((r) => r.count ?? 0),
    ),
  );
  return {
    pending: results[0],
    reviewed: results[1],
    dismissed: results[2],
    actioned: results[3],
  };
}

export async function getContentReports(filters: ReportFilters = {}) {
  const { status = "pending", reason, page = 1, perPage = 25 } = filters;
  const supabase = await createClient();

  let query = supabase
    .from("content_reports")
    .select(
      `*, rating:personal_ratings!content_reports_reported_rating_id_fkey(${RATING_JOIN}), reporter:${REPORTER_JOIN}`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (reason && reason !== "all") {
    query = query.eq("reason", reason);
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error || !data) {
    return { reports: [] as ContentReport[], total: 0 };
  }

  return {
    reports: (data as unknown as RawReportRow[]).map(hydrateReport),
    total: count ?? 0,
  };
}

export async function getContentReportById(
  id: string,
): Promise<ContentReport | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_reports")
    .select(
      `*, rating:personal_ratings!content_reports_reported_rating_id_fkey(${RATING_JOIN}), reporter:${REPORTER_JOIN}`,
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return hydrateReport(data as unknown as RawReportRow);
}

export type UserReportHistory = {
  priorReportCount: number;
  priorActionCount: number;
};

export async function getUserReportHistory(
  userId: string,
  excludeReportId?: string,
): Promise<UserReportHistory> {
  const supabase = await createClient();

  // Count of prior content_reports where the reported rating belongs to this
  // user. Joins through personal_ratings via inner join + filter on user_id.
  let reportsQuery = supabase
    .from("content_reports")
    .select("id, rating:personal_ratings!inner(user_id)", {
      count: "exact",
      head: true,
    })
    .eq("rating.user_id", userId);
  if (excludeReportId) {
    reportsQuery = reportsQuery.neq("id", excludeReportId);
  }
  const { count: priorReportCount } = await reportsQuery;

  // Count of admin_actions targeting this user.
  const { count: priorActionCount } = await supabase
    .from("admin_actions")
    .select("id", { count: "exact", head: true })
    .eq("target_type", "user")
    .eq("target_id", userId);

  return {
    priorReportCount: priorReportCount ?? 0,
    priorActionCount: priorActionCount ?? 0,
  };
}
