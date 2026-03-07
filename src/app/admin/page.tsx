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
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>

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
        <div className="bg-surface border border-border rounded-sm p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Recent Ratings
          </h2>
          {recentRatings.length === 0 ? (
            <p className="text-sm text-text-secondary">No ratings yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentRatings.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="text-text-primary font-medium">
                      {r.restaurant_name}
                    </span>
                    <span className="text-text-secondary mx-1.5">&middot;</span>
                    <span className="text-accent">{r.dish_type_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-secondary text-xs">
                      {r.user_display_name}
                    </span>
                    <span
                      className={`font-semibold ${
                        (r.derived_score ?? 0) >= 7
                          ? "text-success"
                          : (r.derived_score ?? 0) >= 4
                            ? "text-warning"
                            : "text-danger"
                      }`}
                    >
                      {r.derived_score ?? "—"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Blog Posts */}
        <div className="bg-surface border border-border rounded-sm p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Recent Blog Posts
          </h2>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-text-secondary">No blog posts yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentPosts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="text-text-primary font-medium">
                      {p.title}
                    </span>
                    <span className="text-text-secondary mx-1.5">&middot;</span>
                    <span className="text-accent">{p.author_name}</span>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-pill ${
                      p.status === "published"
                        ? "bg-success/15 text-success"
                        : "bg-warning/15 text-warning"
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
