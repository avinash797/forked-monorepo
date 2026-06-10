import { createClient } from "@/lib/supabase/server";

interface Stats {
  totalRatings: number;
  totalBattles: number;
  totalCities: number;
}

async function getStats(): Promise<Stats> {
  try {
    const supabase = await createClient();

    const [ratingsResult, battlesResult, citiesResult] = await Promise.all([
      supabase
        .from("personal_ratings")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("comparisons")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("cities")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
    ]);

    return {
      totalRatings: ratingsResult.count ?? 0,
      totalBattles: battlesResult.count ?? 0,
      totalCities: citiesResult.count ?? 0,
    };
  } catch {
    return { totalRatings: 0, totalBattles: 0, totalCities: 0 };
  }
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export async function StatsSection() {
  const stats = await getStats();

  const items = [
    { label: "Dishes Rated", value: stats.totalRatings },
    { label: "Battles Fought", value: stats.totalBattles },
    { label: "Cities", value: stats.totalCities },
  ];

  return (
    <section className="py-16 sm:py-20 bg-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-3 gap-8">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent mb-2">
                {formatNumber(item.value)}
              </p>
              <p className="text-sm sm:text-base text-text-secondary">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
