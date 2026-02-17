import {
  getAdminDashboardStats,
  getRecentRatings,
  getRecentBlogPosts,
} from "@/lib/admin/queries";
import { MetricCard } from "@/components/admin/metric-card";

export default async function AdminDashboard() {
  const [stats, recentRatings, recentPosts] = await Promise.all([
    getAdminDashboardStats(),
    getRecentRatings(5),
    getRecentBlogPosts(5),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#ECEDEE]">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Users" value={stats.totalUsers} />
        <MetricCard title="Total Ratings" value={stats.totalRatings} />
        <MetricCard title="Total Battles" value={stats.totalBattles} />
        <MetricCard title="Restaurants" value={stats.totalRestaurants} />
        <MetricCard title="Blog Posts" value={stats.totalBlogPosts} />
        <MetricCard title="Active Cities" value={stats.activeCities} />
        <MetricCard title="Dish Types" value={stats.activeDishTypes} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Ratings */}
        <div className="bg-[#342219] border border-[rgba(236,237,238,0.08)] rounded-sm p-5">
          <h2 className="text-lg font-semibold text-[#ECEDEE] mb-4">
            Recent Ratings
          </h2>
          {recentRatings.length === 0 ? (
            <p className="text-sm text-[#9BA1A6]">No ratings yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentRatings.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="text-[#ECEDEE] font-medium">
                      {r.restaurant_name}
                    </span>
                    <span className="text-[#9BA1A6] mx-1.5">&middot;</span>
                    <span className="text-[#c9a492]">{r.dish_type_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#9BA1A6] text-xs">
                      {r.user_display_name}
                    </span>
                    <span
                      className={`font-semibold ${
                        r.raw_score >= 7
                          ? "text-[#34D399]"
                          : r.raw_score >= 4
                          ? "text-[#FBBF24]"
                          : "text-[#F87171]"
                      }`}
                    >
                      {r.raw_score}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Blog Posts */}
        <div className="bg-[#342219] border border-[rgba(236,237,238,0.08)] rounded-sm p-5">
          <h2 className="text-lg font-semibold text-[#ECEDEE] mb-4">
            Recent Blog Posts
          </h2>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-[#9BA1A6]">No blog posts yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentPosts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="text-[#ECEDEE] font-medium">
                      {p.title}
                    </span>
                    <span className="text-[#9BA1A6] mx-1.5">&middot;</span>
                    <span className="text-[#c9a492]">{p.author_name}</span>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-pill ${
                      p.status === "published"
                        ? "bg-[#34D399]/15 text-[#34D399]"
                        : "bg-[#FBBF24]/15 text-[#FBBF24]"
                    }`}
                  >
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
