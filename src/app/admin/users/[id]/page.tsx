import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getAdminUserById,
  getUserRatings,
  getUserModHistory,
} from "@/lib/admin/user-queries";
import { UserModerationPanel } from "@/components/admin/users/user-moderation-panel";
import { UserActivityTabs } from "@/components/admin/users/user-activity-tabs";

type Params = Promise<{ id: string }>;

export default async function UserDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const admin = await requireAdmin();

  const [user, ratings, modHistory] = await Promise.all([
    getAdminUserById(id),
    getUserRatings(id),
    getUserModHistory(id),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">User Detail</h1>

      {/* User Profile Card */}
      <div className="bg-surface border border-border rounded-sm p-5">
        <div className="flex items-start gap-5">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center text-xl text-text-secondary">
              {(user.display_name || user.username || "?")
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-text-primary">
                {user.display_name || "Unnamed User"}
              </h2>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-pill ${
                  user.role === "admin"
                    ? "bg-accent/15 text-accent"
                    : "bg-surface-2 text-text-secondary"
                }`}
              >
                {user.role}
              </span>
              {user.is_banned && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-danger/15 text-danger">
                  Banned
                </span>
              )}
            </div>
            {user.username && (
              <p className="text-sm text-text-secondary mb-1">
                @{user.username}
              </p>
            )}
            {user.bio && (
              <p className="text-sm text-text-tertiary mb-3">{user.bio}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-text-secondary">Ratings</span>
                <p className="text-text-primary font-semibold">
                  {user.total_ratings ?? 0}
                </p>
              </div>
              <div>
                <span className="text-text-secondary">Battles</span>
                <p className="text-text-primary font-semibold">
                  {user.total_battles ?? 0}
                </p>
              </div>
              <div>
                <span className="text-text-secondary">Credibility</span>
                <p className="text-text-primary font-semibold">
                  {user.credibility_score?.toFixed(1) ?? "-"}
                </p>
              </div>
              <div>
                <span className="text-text-secondary">Home City</span>
                <p className="text-text-primary font-semibold">
                  {user.home_city?.name ?? "-"}
                </p>
              </div>
            </div>

            {user.is_banned && user.ban_reason && (
              <div className="mt-3 p-3 bg-danger/10 rounded-sm text-sm">
                <span className="text-danger font-medium">Ban reason:</span>{" "}
                <span className="text-text-secondary">{user.ban_reason}</span>
              </div>
            )}

            {user.warn_count > 0 && (
              <p className="mt-2 text-xs text-warning">
                Warnings: {user.warn_count}
                {user.warned_at && (
                  <> (last: {new Date(user.warned_at).toLocaleDateString()})</>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Moderation Panel */}
      <UserModerationPanel user={user} currentAdminId={admin.id} />

      {/* Activity Tabs */}
      <UserActivityTabs ratings={ratings} modHistory={modHistory} />
    </div>
  );
}
