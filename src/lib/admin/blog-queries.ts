import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

export type AdminBlogPost = Tables<"blog_posts"> & {
  blog_authors: { name: string } | null;
  blog_categories: { name: string } | null;
};

export type BlogPostFilters = {
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
};

export async function getAdminBlogPosts(filters: BlogPostFilters = {}) {
  const { status, search, page = 1, perPage = 20 } = filters;
  const supabase = await createClient();

  let query = supabase
    .from("blog_posts")
    .select("*, blog_authors(name), blog_categories(name)", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    return { posts: [] as AdminBlogPost[], total: 0 };
  }

  return {
    posts: (data ?? []) as AdminBlogPost[],
    total: count ?? 0,
  };
}

export type AdminBlogPostDetail = Tables<"blog_posts"> & {
  blog_authors: { id: string; name: string } | null;
  blog_categories: { id: string; name: string } | null;
  blog_post_tags: { blog_tag_id: string }[];
};

export async function getAdminBlogPostById(
  id: string
): Promise<AdminBlogPostDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "*, blog_authors(id, name), blog_categories(id, name), blog_post_tags(blog_tag_id)"
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return data as AdminBlogPostDetail;
}

export async function getAuthors() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_authors")
    .select("id, name")
    .order("name");
  return data ?? [];
}

export async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_categories")
    .select("id, name, slug")
    .order("display_order");
  return data ?? [];
}

export async function getTags() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_tags")
    .select("id, name, slug")
    .order("name");
  return data ?? [];
}

export async function getCities() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

export async function getDishTypes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dish_types")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}
