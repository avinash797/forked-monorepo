import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata, buildBlogListingJsonLd } from "@/lib/seo";
import {
  getBlogPosts,
  getBlogPostCount,
  getAllBlogCategories,
  POSTS_PER_PAGE,
} from "@/lib/blog/queries";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { BlogCategoryFilter } from "@/components/blog/blog-category-filter";
import { BlogPagination } from "@/components/blog/blog-pagination";

export const revalidate = 600;

interface Props {
  searchParams: Promise<{ page?: string; category?: string }>;
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { category } = await searchParams;
  const title = category
    ? `${category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} — Forked Blog`
    : "Blog — Forked";
  const description =
    "Articles about food rankings, city guides, and the best dishes — from the Forked team.";

  return buildMetadata({ title, description, canonicalPath: "/blog" });
}

export default async function BlogListingPage({ searchParams }: Props) {
  const { page: pageParam, category: categorySlug } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (currentPage - 1) * POSTS_PER_PAGE;

  const [posts, totalCount, categories] = await Promise.all([
    getBlogPosts({ offset, categorySlug }),
    getBlogPostCount(categorySlug),
    getAllBlogCategories(),
  ]);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  const jsonLd = buildBlogListingJsonLd({
    posts: posts.map((p) => ({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
    })),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
        Blog
      </h1>
      <p className="text-text-secondary mb-8">
        Stories about food, rankings, and the quest for the best dish.
      </p>

      <div className="mb-8">
        <Suspense>
          <BlogCategoryFilter categories={categories} />
        </Suspense>
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogPostCard
              key={post.id}
              title={post.title}
              slug={post.slug}
              excerpt={post.excerpt}
              featuredImageUrl={post.featured_image_url}
              publishedAt={post.published_at}
              authorName={post.blog_authors?.name ?? "Forked Team"}
              authorAvatarUrl={post.blog_authors?.avatar_url ?? null}
              categoryName={post.blog_categories?.name ?? "Uncategorized"}
              categorySlug={post.blog_categories?.slug ?? ""}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-text-secondary text-lg">
            No posts found{categorySlug ? " in this category" : ""}.
          </p>
        </div>
      )}

      <BlogPagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/blog"
        categorySlug={categorySlug}
      />
    </div>
  );
}
