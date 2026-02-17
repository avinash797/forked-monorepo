import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 600;

export const metadata: Metadata = buildMetadata({
  title: "Leaderboards — Forked",
  description:
    "Browse Elo-ranked dish leaderboards across cities. Find the best gumbo, po'boy, and more.",
  canonicalPath: "/leaderboard",
});

interface City {
  id: string;
  name: string;
  slug: string;
  state: string | null;
}

async function getCities(): Promise<City[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("cities")
      .select("id, name, slug, state")
      .eq("is_active", true)
      .order("name");
    return (data as City[]) ?? [];
  } catch {
    return [];
  }
}

export default async function LeaderboardHub() {
  const cities = await getCities();

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Leaderboards
          </h1>
          <p className="text-text-secondary mb-12">
            Choose a city to explore Elo-ranked dish leaderboards.
          </p>

          {cities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cities.map((city) => (
                <Link key={city.id} href={`/leaderboard/${city.slug}`}>
                  <Card className="hover:border-accent/30 transition-colors cursor-pointer">
                    <h2 className="text-xl font-semibold text-text-primary">
                      {city.name}
                    </h2>
                    {city.state && (
                      <p className="text-sm text-text-secondary mt-1">
                        {city.state}
                      </p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <p className="text-text-secondary">
                No cities available yet. Stay tuned!
              </p>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
