import Link from "next/link";
import { getAdminBlogPosts } from "@/lib/admin/blog-queries";
import { BlogPostListTable } from "@/components/admin/blog/blog-post-list-table";

type SearchParams = Promise<{
  status?: string;
  search?: string;
  page?: string;
}>;

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const search = params.search ?? "";
  const page = parseInt(params.page ?? "1", 10);

  const { posts, total } = await getAdminBlogPosts({
    status,
    search,
    page,
    perPage: 20,
  });

  const totalPages = Math.ceil(total / 20);

  const statuses = ["all", "draft", "published"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#ECEDEE]">Blog Posts</h1>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-[#ee6c2b] text-white font-medium hover:brightness-110 transition-all"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          {statuses.map((s) => (
            <Link
              key={s}
              href={`/admin/blog?status=${s}${search ? `&search=${search}` : ""}`}
              className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${
                status === s
                  ? "bg-[#ee6c2b] text-white"
                  : "text-[#9BA1A6] hover:bg-[#342219] hover:text-[#ECEDEE]"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Link>
          ))}
        </div>

        <form className="flex-1 max-w-sm">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search posts..."
            className="w-full rounded-sm border border-[rgba(236,237,238,0.12)] bg-[#482f23] px-4 py-2 text-sm text-[#ECEDEE] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(238,108,43,0.40)]"
          />
          <input type="hidden" name="status" value={status} />
        </form>

        <span className="text-sm text-[#9BA1A6]">{total} posts</span>
      </div>

      {/* Table */}
      <div className="bg-[#342219] border border-[rgba(236,237,238,0.08)] rounded-sm">
        <BlogPostListTable posts={posts} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/blog?status=${status}${search ? `&search=${search}` : ""}&page=${p}`}
              className={`px-3 py-1.5 text-sm rounded-sm ${
                page === p
                  ? "bg-[#ee6c2b] text-white"
                  : "text-[#9BA1A6] hover:bg-[#342219]"
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
