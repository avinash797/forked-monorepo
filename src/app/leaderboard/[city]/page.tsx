import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DishTypeTabs } from "@/components/leaderboard/dish-type-tabs";
import { LeaderboardTable, type LeaderboardEntry } from "@/components/leaderboard/leaderboard-table";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 600;

interface Props {
  params: Promise<{ city: string }>;
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

async function getDishTypes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dish_types")
    .select("id, name, slug, emoji")
    .eq("is_active", true)
    .order("launch_order");
  return data ?? [];
}

async function getTopEntriesForCity(
  cityId: string,
  dishTypeId: string
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_leaderboard", {
    p_city_id: cityId,
    p_dish_type_id: dishTypeId,
    p_limit: 5,
    p_min_battles: 0,
    p_min_ratings: 0,
  });
  return (data as LeaderboardEntry[]) ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) return {};

  return buildMetadata({
    title: `Best Dishes in ${city.name} — Forked Leaderboard`,
    description: `Elo-ranked dish leaderboards for ${city.name}${city.state ? `, ${city.state}` : ""}. Find the best gumbo, po'boy, and more.`,
    canonicalPath: `/leaderboard/${city.slug}`,
  });
}

export async function generateStaticParams() {
  const { createStaticClient } = await import("@/lib/supabase/static");
  const supabase = createStaticClient();
  if (!supabase) return [];

  const { data: cities } = await supabase
    .from("cities")
    .select("slug")
    .eq("is_active", true);
  return (cities ?? []).map((c) => ({ city: c.slug }));
}

export default async function CityLeaderboard({ params }: Props) {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) notFound();

  const dishTypes = await getDishTypes();

  // Get top 5 for each dish type as a preview
  const dishPreviews = await Promise.all(
    dishTypes.map(async (dt) => ({
      dishType: dt,
      entries: await getTopEntriesForCity(city.id, dt.id),
    }))
  );

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
            Best Dishes in {city.name}
          </h1>
          {city.state && (
            <p className="text-text-secondary mb-8">{city.state}</p>
          )}

          <div className="mb-8">
            <DishTypeTabs
              dishTypes={dishTypes}
              citySlug={citySlug}
            />
          </div>

          <div className="space-y-12">
            {dishPreviews.map(({ dishType, entries }) => (
              <section key={dishType.id}>
                <h2 className="text-xl font-bold text-text-primary mb-4">
                  {dishType.emoji} Best {dishType.name}
                </h2>
                <LeaderboardTable entries={entries} />
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
