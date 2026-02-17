import { Suspense } from "react";
import {
  getDailyStats,
  getCityBreakdown,
  getDishTypeBreakdown,
  getLeaderboardHealth,
} from "@/lib/admin/analytics-queries";
import { ActivityChart } from "@/components/admin/analytics/activity-chart";
import { CityBreakdownChart } from "@/components/admin/analytics/city-breakdown-chart";
import { DishTypeBreakdownChart } from "@/components/admin/analytics/dish-type-breakdown-chart";
import { LeaderboardHealthCard } from "@/components/admin/analytics/leaderboard-health";
import { DateRangeSelector } from "@/components/admin/analytics/date-range-selector";

type SearchParams = Promise<{
  days?: string;
}>;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const days = parseInt(params.days ?? "30", 10);

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [dailyStats, cityBreakdown, dishTypeBreakdown, health] =
    await Promise.all([
      getDailyStats(startDate, endDate),
      getCityBreakdown(),
      getDishTypeBreakdown(),
      getLeaderboardHealth(),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#ECEDEE]">Analytics</h1>
        <Suspense>
          <DateRangeSelector />
        </Suspense>
      </div>

      <ActivityChart data={dailyStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CityBreakdownChart data={cityBreakdown} />
        <DishTypeBreakdownChart data={dishTypeBreakdown} />
      </div>

      <LeaderboardHealthCard health={health} />
    </div>
  );
}
