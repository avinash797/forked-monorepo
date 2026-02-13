import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DishTypeTabs } from "@/components/leaderboard/dish-type-tabs";
import {
  LeaderboardTable,
  type LeaderboardEntry,
} from "@/components/leaderboard/leaderboard-table";
import { buildMetadata, buildLeaderboardJsonLd } from "@/lib/seo";

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
    p_min_battles: 0,
    p_min_ratings: 0,
  });
  return (data as LeaderboardEntry[]) ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, dishType: dishTypeSlug } = await params;
  const [city, dishType] = await Promise.all([
    getCityBySlug(citySlug),
    getDishTypeBySlug(dishTypeSlug),
  ]);
  if (!city || !dishType) return {};

  const title = `Best ${dishType.name} in ${city.name} — Forked Leaderboard`;
  const description = `The definitive ranking of the best ${dishType.name.toLowerCase()} in ${city.name}. Elo-ranked by real dish battles on Forked.`;

  return buildMetadata({
    title,
    description,
    openGraph: { title, description },
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

  const entries = await getLeaderboardEntries(city.id, dishType.id);

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
              {topEntry.neighborhood_name &&
                ` in ${topEntry.neighborhood_name}`}
              , with a Forked score of {topEntry.avg_raw_score?.toFixed(1)} based
              on {topEntry.total_ratings} rating
              {topEntry.total_ratings !== 1 ? "s" : ""}.
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
                    According to Forked&apos;s Elo-ranked dish battles, the #1{" "}
                    {dishType.name.toLowerCase()} in {city.name} is at{" "}
                    {entries[0].restaurant_name}
                    {entries[0].neighborhood_name &&
                      ` in ${entries[0].neighborhood_name}`}
                    .
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">
                    How are {dishType.name.toLowerCase()} rankings determined?
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Rankings use an Elo rating system. Users rate individual
                    dishes, then compare them in head-to-head &quot;This vs
                    That&quot; battles. Winners gain Elo points, losers drop. The
                    result is a ranking that reflects genuine taste preferences,
                    not inflated star ratings.
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
                          text: `According to Forked's Elo-ranked dish battles, the #1 ${dishType.name.toLowerCase()} in ${city.name} is at ${entries[0].restaurant_name}${entries[0].neighborhood_name ? ` in ${entries[0].neighborhood_name}` : ""}.`,
                        },
                      },
                      {
                        "@type": "Question",
                        name: `How are ${dishType.name.toLowerCase()} rankings determined?`,
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: "Rankings use an Elo rating system. Users rate individual dishes, then compare them in head-to-head 'This vs That' battles. Winners gain Elo points, losers drop.",
                        },
                      },
                    ],
                  }),
                }}
              />
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
