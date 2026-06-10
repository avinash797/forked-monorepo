import Link from "next/link";
import type { AdminUserListItem } from "@/lib/admin/user-queries";

type UserListTableProps = {
  users: AdminUserListItem[];
};

export function UserListTable({ users }: UserListTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p>No users found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-text-tertiary">
              User
            </th>
            <th className="text-left py-3 px-4 font-medium text-text-tertiary">
              Role
            </th>
            <th className="text-left py-3 px-4 font-medium text-text-tertiary">
              Ratings
            </th>
            <th className="text-left py-3 px-4 font-medium text-text-tertiary">
              Battles
            </th>
            <th className="text-left py-3 px-4 font-medium text-text-tertiary">
              Status
            </th>
            <th className="text-left py-3 px-4 font-medium text-text-tertiary">
              Joined
            </th>
            <th className="text-right py-3 px-4 font-medium text-text-tertiary">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-border hover:bg-surface-2/50"
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
                    <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-xs text-text-secondary">
                      {(user.display_name || user.username || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-text-primary font-medium">
                      {user.display_name || "Unnamed"}
                    </p>
                    {user.username && (
                      <p className="text-xs text-text-secondary">
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
                      ? "bg-accent/15 text-accent"
                      : "bg-surface-2 text-text-secondary"
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="py-3 px-4 text-text-secondary">
                {user.total_ratings ?? 0}
              </td>
              <td className="py-3 px-4 text-text-secondary">
                {user.total_comparisons ?? 0}
              </td>
              <td className="py-3 px-4">
                {user.is_banned ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-danger/15 text-danger">
                    Banned
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-success/15 text-success">
                    Active
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-text-secondary">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "-"}
              </td>
              <td className="py-3 px-4 text-right">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="text-accent hover:underline"
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
