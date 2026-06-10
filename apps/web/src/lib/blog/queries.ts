import { createClient } from "@/lib/supabase/server";

const POSTS_PER_PAGE = 9;

const POST_LIST_SELECT = `
  id,
  title,
  slug,
  excerpt,
  featured_image_url,
  published_at,
  blog_authors ( name, slug, avatar_url ),
  blog_categories ( name, slug ),
  blog_post_tags ( blog_tags ( name, slug ) )
` as const;

const POST_DETAIL_SELECT = `
  id,
  title,
  slug,
  excerpt,
  content,
  featured_image_url,
  status,
  author_id,
  category_id,
  city_id,
  dish_type_id,
  seo_title,
  seo_description,
  published_at,
  created_at,
  updated_at,
  blog_authors ( name, slug, avatar_url, bio ),
  blog_categories ( name, slug ),
  blog_post_tags ( blog_tags ( name, slug ) ),
  cities ( id, name, slug, state ),
  dish_types ( id, name, slug, emoji )
` as const;

export async function getBlogPosts({
  limit = POSTS_PER_PAGE,
  offset = 0,
  categorySlug,
}: {
  limit?: number;
  offset?: number;
  categorySlug?: string;
} = {}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("blog_posts")
      .select(POST_LIST_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (categorySlug) {
      query = query.eq("blog_categories.slug", categorySlug);
    }

    const { data } = await query;

    // If filtering by category via join, filter out posts where the category didn't match
    if (categorySlug && data) {
      return data.filter((post) => post.blog_categories !== null);
    }

    return data ?? [];
  } catch {
    return [];
  }
}

export async function getBlogPostBySlug(slug: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("blog_posts")
      .select(POST_DETAIL_SELECT)
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    return data;
  } catch {
    return null;
  }
}

export async function getBlogPostCount(categorySlug?: string) {
  try {
    const supabase = await createClient();

    if (categorySlug) {
      // Need to filter by category — get category ID first then count
      const { data: category } = await supabase
        .from("blog_categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();

      if (!category) return 0;

      const { count } = await supabase
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .eq("category_id", category.id);

      return count ?? 0;
    }

    const { count } = await supabase
      .from("blog_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");

    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getAllBlogCategories() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("blog_categories")
      .select("id, name, slug, description")
      .order("display_order");

    return data ?? [];
  } catch {
    return [];
  }
}

export async function getRelatedBlogPosts(
  cityId?: string | null,
  dishTypeId?: string | null,
  excludePostId?: string,
  limit = 3
) {
  if (!cityId && !dishTypeId) return [];

  try {
    const supabase = await createClient();

    let query = supabase
      .from("blog_posts")
      .select(POST_LIST_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (cityId) query = query.eq("city_id", cityId);
    if (dishTypeId) query = query.eq("dish_type_id", dishTypeId);
    if (excludePostId) query = query.neq("id", excludePostId);

    const { data } = await query;
    return data ?? [];
  } catch {
    return [];
  }
}

export { POSTS_PER_PAGE };
