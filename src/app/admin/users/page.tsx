import Link from "next/link";
import { getAdminUserList, getWaitlist } from "@/lib/admin/user-queries";
import { UserListTable } from "@/components/admin/users/user-list-table";
import { WaitlistTable } from "@/components/admin/users/waitlist-table";

type SearchParams = Promise<{
  filter?: string;
  search?: string;
  page?: string;
}>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filter = params.filter ?? "all";
  const search = params.search ?? "";
  const page = parseInt(params.page ?? "1", 10);

  const isWaitlist = filter === "waitlisted";

  const userResult = isWaitlist
    ? null
    : await getAdminUserList({ filter, search, page, perPage: 25 });

  const waitlistResult = isWaitlist
    ? await getWaitlist({ search, page, perPage: 25 })
    : null;

  // For the "Copy All Emails" button we fetch all emails (no pagination) when on waitlist view
  const allEmailsResult = isWaitlist
    ? await getWaitlist({ search, perPage: 10000 })
    : null;

  const total = isWaitlist
    ? (waitlistResult?.total ?? 0)
    : (userResult?.total ?? 0);
  const totalPages = Math.ceil(total / 25);

  const filters = ["all", "active", "banned", "admins", "waitlisted"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Users</h1>

      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          {filters.map((f) => (
            <Link
              key={f}
              href={`/admin/users?filter=${f}${search ? `&search=${search}` : ""}`}
              className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${
                filter === f
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Link>
          ))}
        </div>

        <form className="flex-1 max-w-sm">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder={isWaitlist ? "Search emails..." : "Search users..."}
            className="w-full rounded-sm border border-[rgba(236,237,238,0.12)] bg-surface-2 px-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <input type="hidden" name="filter" value={filter} />
        </form>

        <span className="text-sm text-text-secondary">
          {total} {isWaitlist ? "waitlisted" : "users"}
        </span>
      </div>

      <div className="bg-surface border border-border rounded-sm">
        {isWaitlist ? (
          <WaitlistTable
            entries={waitlistResult?.entries ?? []}
            allEmails={(allEmailsResult?.entries ?? []).map((e) => e.email)}
          />
        ) : (
          <UserListTable users={userResult?.users ?? []} />
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/users?filter=${filter}${search ? `&search=${search}` : ""}&page=${p}`}
              className={`px-3 py-1.5 text-sm rounded-sm ${
                page === p
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-surface"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
