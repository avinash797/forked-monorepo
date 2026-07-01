import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DishTypeTabs } from "@/components/leaderboard/dish-type-tabs";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import type { LeaderboardEntry } from "@forked/supabase";
import { buildMetadata, buildLeaderboardJsonLd } from "@/lib/seo";
import { getRelatedBlogPosts } from "@/lib/blog/queries";
import { BlogPostCard } from "@/components/blog/blog-post-card";

export const revalidate = 600;

interface Props {
  params: Promise<{ city: string; dishType: string }>;
}

async function getCityBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name, slug, state")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
}

async function getDishTypeBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dish_types")
    .select("id, name, slug, emoji")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
}

async function getAllDishTypes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dish_types")
    .select("id, name, slug, emoji")
    .eq("is_active", true)
    .order("launch_order");
  return data ?? [];
}

async function getLeaderboardEntries(
  cityId: string,
  dishTypeId: string
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_leaderboard", {
    p_city_id: cityId,
    p_dish_type_id: dishTypeId,
    p_limit: 25,
  });
  return (data as unknown as LeaderboardEntry[]) ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, dishType: dishTypeSlug } = await params;
  const [city, dishType] = await Promise.all([
    getCityBySlug(citySlug),
    getDishTypeBySlug(dishTypeSlug),
  ]);
  if (!city || !dishType) return {};

  const title = `Best ${dishType.name} in ${city.name} — Forked Leaderboard`;
  const description = `The definitive ranking of the best ${dishType.name.toLowerCase()} in ${city.name}. Ranked by Forked's proprietary algorithm through real dish battles.`;

  return buildMetadata({
    title,
    description,
    openGraph: { title, description },
    canonicalPath: `/leaderboard/${city.slug}/${dishType.slug}`,
  });
}

export async function generateStaticParams() {
  const { createStaticClient } = await import("@/lib/supabase/static");
  const supabase = createStaticClient();
  if (!supabase) return [];

  const [{ data: cities }, { data: dishTypes }] = await Promise.all([
    supabase.from("cities").select("slug").eq("is_active", true),
    supabase.from("dish_types").select("slug").eq("is_active", true),
  ]);

  const params: { city: string; dishType: string }[] = [];
  for (const c of cities ?? []) {
    for (const dt of dishTypes ?? []) {
      params.push({ city: c.slug, dishType: dt.slug });
    }
  }
  return params;
}

export default async function DishTypeLeaderboard({ params }: Props) {
  const { city: citySlug, dishType: dishTypeSlug } = await params;

  const [city, dishType, allDishTypes] = await Promise.all([
    getCityBySlug(citySlug),
    getDishTypeBySlug(dishTypeSlug),
    getAllDishTypes(),
  ]);

  if (!city || !dishType) notFound();

  const [entries, relatedPosts] = await Promise.all([
    getLeaderboardEntries(city.id, dishType.id),
    getRelatedBlogPosts(city.id, dishType.id),
  ]);

  const topEntry = entries[0];
  const jsonLd = buildLeaderboardJsonLd({
    city: city.name,
    dishType: dishType.name,
    entries,
  });

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />

          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
            {dishType.emoji} Best {dishType.name} in {city.name}
          </h1>
          <p className="text-text-secondary mb-8">
            {entries.length > 0
              ? `${entries.length} ranked restaurants. Updated in real-time.`
              : "No rankings yet — be the first to rate!"}
          </p>

          {/* Direct answer for LLMs */}
          {topEntry && (
            <p className="text-sm text-text-tertiary mb-6">
              The best {dishType.name.toLowerCase()} in {city.name} is at{" "}
              <strong className="text-text-primary">
                {topEntry.restaurant_name}
              </strong>
              {topEntry.address &&
                ` in ${topEntry.address}`}
              , based on {topEntry.total_ratings} rating
              {topEntry.total_ratings !== 1 ? "s" : ""} through Forked&apos;s proprietary ranking algorithm.
            </p>
          )}

          <div className="mb-8">
            <DishTypeTabs
              dishTypes={allDishTypes}
              citySlug={citySlug}
              activeSlug={dishTypeSlug}
            />
          </div>

          <LeaderboardTable entries={entries} />

          {/* FAQ section for SEO */}
          {entries.length > 0 && (
            <section className="mt-16">
              <h2 className="text-xl font-bold text-text-primary mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">
                    What is the best {dishType.name.toLowerCase()} in{" "}
                    {city.name}?
                  </h3>
                  <p className="text-sm text-text-secondary">
                    According to Forked&apos;s proprietary ranking algorithm, the
                    #1 {dishType.name.toLowerCase()} in {city.name} is at{" "}
                    {entries[0].restaurant_name}
                    {entries[0].address &&
                      ` in ${entries[0].address}`}
                    .
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">
                    How are {dishType.name.toLowerCase()} rankings determined?
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Rankings are powered by Forked&apos;s proprietary ranking
                    algorithm. Users compare dishes in head-to-head &quot;This vs
                    That&quot; battles, and the algorithm weighs every battle
                    result to produce a ranking that reflects genuine taste
                    preferences, not inflated star ratings.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">
                    How often are leaderboards updated?
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Leaderboards update in real-time as new battles are fought.
                    This page refreshes every 10 minutes to reflect the latest
                    rankings.
                  </p>
                </div>
              </div>

              {/* FAQPage JSON-LD */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: [
                      {
                        "@type": "Question",
                        name: `What is the best ${dishType.name.toLowerCase()} in ${city.name}?`,
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: `According to Forked's proprietary ranking algorithm, the #1 ${dishType.name.toLowerCase()} in ${city.name} is at ${entries[0].restaurant_name}${entries[0].address ? ` in ${entries[0].address}` : ""}.`,
                        },
                      },
                      {
                        "@type": "Question",
                        name: `How are ${dishType.name.toLowerCase()} rankings determined?`,
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: "Rankings are powered by Forked's proprietary ranking algorithm. Users compare dishes in head-to-head 'This vs That' battles, and the algorithm weighs every result to produce rankings that reflect genuine taste preferences.",
                        },
                      },
                    ],
                  }),
                }}
              />
            </section>
          )}

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-xl font-bold text-text-primary mb-6">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.slice(0, 3).map((post) => (
                  <BlogPostCard
                    key={post.id}
                    title={post.title}
                    slug={post.slug}
                    excerpt={post.excerpt}
                    featuredImageUrl={post.featured_image_url}
                    publishedAt={post.published_at}
                    authorName={post.blog_authors?.name ?? "Forked Team"}
                    authorAvatarUrl={post.blog_authors?.avatar_url ?? null}
                    categoryName={post.blog_categories?.name ?? "Uncategorized"}
                    categorySlug={post.blog_categories?.slug ?? ""}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
