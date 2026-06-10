import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BlogPostCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  publishedAt: string | null;
  authorName: string;
  authorAvatarUrl: string | null;
  categoryName: string;
  categorySlug: string;
}

export function BlogPostCard({
  title,
  slug,
  excerpt,
  featuredImageUrl,
  publishedAt,
  authorName,
  authorAvatarUrl,
  categoryName,
}: BlogPostCardProps) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Link href={`/blog/${slug}`} className="group block">
      <Card variant="surface" className="overflow-hidden p-0 h-full transition-shadow hover:shadow-lg">
        {featuredImageUrl && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={featuredImageUrl}
              alt={title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="p-5">
          <div className="mb-3">
            <Badge variant="default">{categoryName}</Badge>
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-accent transition-colors line-clamp-2">
            {title}
          </h3>
          {excerpt && (
            <p className="text-sm text-text-secondary mb-4 line-clamp-2">
              {excerpt}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-text-tertiary">
            {authorAvatarUrl ? (
              <Image
                src={authorAvatarUrl}
                alt={authorName}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary text-xs font-semibold">
                {authorName.charAt(0)}
              </div>
            )}
            <span>{authorName}</span>
            {formattedDate && (
              <>
                <span>·</span>
                <time dateTime={publishedAt!}>{formattedDate}</time>
              </>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
