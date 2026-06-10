import { Skeleton } from "@/components/ui/skeleton";

export default function BlogListingLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <Skeleton className="h-10 w-24 mb-2" />
      <Skeleton className="h-5 w-80 mb-8" />

      {/* Category filter skeleton */}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      {/* Blog cards grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg overflow-hidden">
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center gap-2 pt-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
