import Link from "next/link";
import type { AdminBlogPost } from "@/lib/admin/blog-queries";

type BlogPostListTableProps = {
  posts: AdminBlogPost[];
};

export function BlogPostListTable({ posts }: BlogPostListTableProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-[#9BA1A6]">
        <p className="text-lg mb-2">No posts found.</p>
        <Link
          href="/admin/blog/new"
          className="text-[#ee6c2b] hover:underline"
        >
          Create your first post
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[rgba(236,237,238,0.08)]">
            <th className="text-left py-3 px-4 font-medium text-[#9BA1A6]">
              Title
            </th>
            <th className="text-left py-3 px-4 font-medium text-[#9BA1A6]">
              Author
            </th>
            <th className="text-left py-3 px-4 font-medium text-[#9BA1A6]">
              Category
            </th>
            <th className="text-left py-3 px-4 font-medium text-[#9BA1A6]">
              Status
            </th>
            <th className="text-left py-3 px-4 font-medium text-[#9BA1A6]">
              Date
            </th>
            <th className="text-right py-3 px-4 font-medium text-[#9BA1A6]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr
              key={post.id}
              className="border-b border-[rgba(236,237,238,0.05)] hover:bg-[#3d2a1f]/50"
            >
              <td className="py-3 px-4">
                <span className="text-[#ECEDEE] font-medium">{post.title}</span>
              </td>
              <td className="py-3 px-4 text-[#c9a492]">
                {post.blog_authors?.name ?? "-"}
              </td>
              <td className="py-3 px-4 text-[#c9a492]">
                {post.blog_categories?.name ?? "-"}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-pill ${
                    post.status === "published"
                      ? "bg-[#34D399]/15 text-[#34D399]"
                      : "bg-[#FBBF24]/15 text-[#FBBF24]"
                  }`}
                >
                  {post.status}
                </span>
              </td>
              <td className="py-3 px-4 text-[#9BA1A6]">
                {post.created_at
                  ? new Date(post.created_at).toLocaleDateString()
                  : "-"}
              </td>
              <td className="py-3 px-4 text-right">
                <Link
                  href={`/admin/blog/${post.id}/edit`}
                  className="text-[#ee6c2b] hover:underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
