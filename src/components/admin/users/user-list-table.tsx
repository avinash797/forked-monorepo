import Link from "next/link";
import type { AdminUserListItem } from "@/lib/admin/user-queries";

type UserListTableProps = {
  users: AdminUserListItem[];
};

export function UserListTable({ users }: UserListTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-[#9BA1A6]">
        <p>No users found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[rgba(236,237,238,0.08)]">
            <th className="text-left py-3 px-4 font-medium text-[#9BA1A6]">
              User
            </th>
            <th className="text-left py-3 px-4 font-medium text-[#9BA1A6]">
              Role
            </th>
            <th className="text-left py-3 px-4 font-medium text-[#9BA1A6]">
              Ratings
            </th>
            <th className="text-left py-3 px-4 font-medium text-[#9BA1A6]">
              Battles
            </th>
            <th className="text-left py-3 px-4 font-medium text-[#9BA1A6]">
              Status
            </th>
            <th className="text-left py-3 px-4 font-medium text-[#9BA1A6]">
              Joined
            </th>
            <th className="text-right py-3 px-4 font-medium text-[#9BA1A6]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-[rgba(236,237,238,0.05)] hover:bg-[#3d2a1f]/50"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#482f23] flex items-center justify-center text-xs text-[#9BA1A6]">
                      {(user.display_name || user.username || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-[#ECEDEE] font-medium">
                      {user.display_name || "Unnamed"}
                    </p>
                    {user.username && (
                      <p className="text-xs text-[#9BA1A6]">
                        @{user.username}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-pill ${
                    user.role === "admin"
                      ? "bg-[#ee6c2b]/15 text-[#ee6c2b]"
                      : "bg-[#482f23] text-[#9BA1A6]"
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="py-3 px-4 text-[#c9a492]">
                {user.total_ratings ?? 0}
              </td>
              <td className="py-3 px-4 text-[#c9a492]">
                {user.total_battles ?? 0}
              </td>
              <td className="py-3 px-4">
                {user.is_banned ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-[#EF4444]/15 text-[#F87171]">
                    Banned
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-[#34D399]/15 text-[#34D399]">
                    Active
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-[#9BA1A6]">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "-"}
              </td>
              <td className="py-3 px-4 text-right">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="text-[#ee6c2b] hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
