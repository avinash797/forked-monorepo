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

export default async function UserDetailPage({
  params,
}: {
  params: Params;
}) {
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
      <h1 className="text-2xl font-bold text-[#ECEDEE]">User Detail</h1>

      {/* User Profile Card */}
      <div className="bg-[#342219] border border-[rgba(236,237,238,0.08)] rounded-sm p-5">
        <div className="flex items-start gap-5">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#482f23] flex items-center justify-center text-xl text-[#9BA1A6]">
              {(user.display_name || user.username || "?")
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-[#ECEDEE]">
                {user.display_name || "Unnamed User"}
              </h2>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-pill ${
                  user.role === "admin"
                    ? "bg-[#ee6c2b]/15 text-[#ee6c2b]"
                    : "bg-[#482f23] text-[#9BA1A6]"
                }`}
              >
                {user.role}
              </span>
              {user.is_banned && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-[#EF4444]/15 text-[#F87171]">
                  Banned
                </span>
              )}
            </div>
            {user.username && (
              <p className="text-sm text-[#9BA1A6] mb-1">@{user.username}</p>
            )}
            {user.bio && (
              <p className="text-sm text-[#c9a492] mb-3">{user.bio}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-[#9BA1A6]">Ratings</span>
                <p className="text-[#ECEDEE] font-semibold">
                  {user.total_ratings ?? 0}
                </p>
              </div>
              <div>
                <span className="text-[#9BA1A6]">Battles</span>
                <p className="text-[#ECEDEE] font-semibold">
                  {user.total_battles ?? 0}
                </p>
              </div>
              <div>
                <span className="text-[#9BA1A6]">Credibility</span>
                <p className="text-[#ECEDEE] font-semibold">
                  {user.credibility_score?.toFixed(1) ?? "-"}
                </p>
              </div>
              <div>
                <span className="text-[#9BA1A6]">Home City</span>
                <p className="text-[#ECEDEE] font-semibold">
                  {user.home_city?.name ?? "-"}
                </p>
              </div>
            </div>

            {user.is_banned && user.ban_reason && (
              <div className="mt-3 p-3 bg-[#EF4444]/10 rounded-sm text-sm">
                <span className="text-[#F87171] font-medium">Ban reason:</span>{" "}
                <span className="text-[#9BA1A6]">{user.ban_reason}</span>
              </div>
            )}

            {user.warn_count > 0 && (
              <p className="mt-2 text-xs text-[#FBBF24]">
                Warnings: {user.warn_count}
                {user.warned_at && (
                  <>
                    {" "}
                    (last:{" "}
                    {new Date(user.warned_at).toLocaleDateString()})
                  </>
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
