import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getBlogPostBySlug } from "@/lib/blog/queries";
import { buildMetadata, buildArticleJsonLd } from "@/lib/seo";
import { TipTapRenderer } from "@/components/blog/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { BlogLeaderboardEnrichment } from "@/components/blog/blog-leaderboard-enrichment";

export const revalidate = 600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { createStaticClient } = await import("@/lib/supabase/static");
  const supabase = createStaticClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("status", "published");

  return (data ?? []).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};

  const title = post.seo_title || `${post.title} — Forked Blog`;
  const description = post.seo_description || post.excerpt || "";

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://forkedapp.com";

  return buildMetadata({
    title,
    description,
    canonicalPath: `/blog/${post.slug}`,
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: post.published_at ?? undefined,
      authors: post.blog_authors?.name ? [post.blog_authors.name] : undefined,
      section: post.blog_categories?.name ?? undefined,
      images: post.featured_image_url
        ? [post.featured_image_url]
        : [`${SITE_URL}/api/og?title=${encodeURIComponent(post.title)}`],
    },
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const tags =
    post.blog_post_tags
      ?.map((pt) => pt.blog_tags)
      .filter((t): t is { name: string; slug: string } => t !== null) ?? [];

  const jsonLd = buildArticleJsonLd({
    title: post.title,
    description: post.seo_description || post.excerpt || "",
    slug: post.slug,
    publishedAt: post.published_at ?? new Date().toISOString(),
    modifiedAt: post.updated_at,
    authorName: post.blog_authors?.name ?? "Forked Team",
    categoryName: post.blog_categories?.name ?? "Uncategorized",
    imageUrl: post.featured_image_url,
  });

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="text-sm text-text-tertiary mb-6">
        <Link
          href="/blog"
          className="hover:text-text-primary transition-colors"
        >
          Blog
        </Link>
        <span className="mx-2">/</span>
        {post.blog_categories && (
          <>
            <Link
              href={`/blog?category=${post.blog_categories.slug}`}
              className="hover:text-text-primary transition-colors"
            >
              {post.blog_categories.name}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-text-secondary">{post.title}</span>
      </nav>

      {/* Featured Image */}
      {post.featured_image_url && (
        <div className="relative aspect-[2/1] rounded-lg overflow-hidden mb-8">
          <Image
            src={post.featured_image_url}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
        {post.title}
      </h1>

      {/* Byline */}
      <div className="flex items-center gap-3 text-sm text-text-secondary mb-8 pb-8 border-b border-border">
        {post.blog_authors?.avatar_url ? (
          <Image
            src={post.blog_authors.avatar_url}
            alt={post.blog_authors.name}
            width={36}
            height={36}
            className="rounded-full"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary font-semibold">
            {(post.blog_authors?.name ?? "F").charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-text-primary">
            {post.blog_authors?.name ?? "Forked Team"}
          </p>
          {formattedDate && (
            <time
              dateTime={post.published_at!}
              className="text-text-tertiary text-xs"
            >
              {formattedDate}
            </time>
          )}
        </div>
      </div>

      {/* Content */}
      <TipTapRenderer content={post.content} />

      {/* Leaderboard Enrichment */}
      {post.city_id && post.dish_type_id && post.cities && post.dish_types && (
        <BlogLeaderboardEnrichment
          cityId={post.city_id}
          dishTypeId={post.dish_type_id}
          citySlug={post.cities.slug}
          dishTypeSlug={post.dish_types.slug}
          cityName={post.cities.name}
          dishTypeName={post.dish_types.name}
          dishTypeEmoji={post.dish_types.emoji}
        />
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-border">
          {tags.map((tag) => (
            <Badge key={tag.slug} variant="default">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
    </article>
  );
}
