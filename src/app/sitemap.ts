import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://getforked.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { createStaticClient } = await import("@/lib/supabase/static");
  const supabase = createStaticClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  if (!supabase) return staticPages;

  // Dynamic leaderboard pages
  const leaderboardPages: MetadataRoute.Sitemap = [];

  const [citiesResult, dishTypesResult, blogPostsResult] = await Promise.all([
    supabase.from("cities").select("slug").eq("is_active", true),
    supabase.from("dish_types").select("slug").eq("is_active", true),
    supabase
      .from("blog_posts")
      .select("slug, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
  ]);

  const cities = citiesResult.data ?? [];
  const dishTypes = dishTypesResult.data ?? [];
  const blogPosts = blogPostsResult.data ?? [];

  // City pages
  for (const city of cities) {
    leaderboardPages.push({
      url: `${SITE_URL}/leaderboard/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });

    // City + dish type pages (highest SEO value)
    for (const dishType of dishTypes) {
      leaderboardPages.push({
        url: `${SITE_URL}/leaderboard/${city.slug}/${dishType.slug}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      });
    }
  }

  // Blog post pages
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.published_at ? new Date(post.published_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...leaderboardPages, ...blogPages];
}
