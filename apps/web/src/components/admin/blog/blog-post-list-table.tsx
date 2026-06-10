import Link from "next/link";
import type { AdminBlogPost } from "@/lib/admin/blog-queries";

type BlogPostListTableProps = {
  posts: AdminBlogPost[];
};

export function BlogPostListTable({ posts }: BlogPostListTableProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p className="text-lg mb-2">No posts found.</p>
        <Link href="/admin/blog/new" className="text-accent hover:underline">
          Create your first post
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-text-secondary">
              Title
            </th>
            <th className="text-left py-3 px-4 font-medium text-text-secondary">
              Author
            </th>
            <th className="text-left py-3 px-4 font-medium text-text-secondary">
              Category
            </th>
            <th className="text-left py-3 px-4 font-medium text-text-secondary">
              Status
            </th>
            <th className="text-left py-3 px-4 font-medium text-text-secondary">
              Date
            </th>
            <th className="text-right py-3 px-4 font-medium text-text-secondary">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr
              key={post.id}
              className="border-b border-divider hover:bg-surface-2"
            >
              <td className="py-3 px-4">
                <span className="text-text-primary font-medium">
                  {post.title}
                </span>
              </td>
              <td className="py-3 px-4 text-text-secondary">
                {post.blog_authors?.name ?? "-"}
              </td>
              <td className="py-3 px-4 text-text-secondary">
                {post.blog_categories?.name ?? "-"}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-pill ${
                    post.status === "published"
                      ? "bg-success/15 text-success"
                      : "bg-warning/15 text-warning"
                  }`}
                >
                  {post.status}
                </span>
              </td>
              <td className="py-3 px-4 text-text-secondary">
                {post.created_at
                  ? new Date(post.created_at).toLocaleDateString()
                  : "-"}
              </td>
              <td className="py-3 px-4 text-right">
                <Link
                  href={`/admin/blog/${post.id}/edit`}
                  className="text-accent hover:underline"
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
