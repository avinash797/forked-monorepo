import { Skeleton } from "@/components/ui/skeleton";

export default function BlogPostLoading() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6">
      {/* Category + date */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Title */}
      <Skeleton className="h-12 w-full mb-2" />
      <Skeleton className="h-12 w-3/4 mb-6" />

      {/* Author */}
      <div className="flex items-center gap-3 mb-8">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Featured image */}
      <Skeleton className="h-64 sm:h-96 w-full rounded-lg mb-8" />

      {/* Content skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
        <Skeleton className="h-5 w-2/3" />
      </div>
    </article>
  );
}
