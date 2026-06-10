import { Skeleton } from "@/components/ui/skeleton";

export default function AdminModerationLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 bg-surface-2" />

      {/* Filter tabs */}
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 bg-surface-2 rounded-md" />
        ))}
      </div>

      {/* Flag list skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-sm p-4 flex items-center justify-between"
          >
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48 bg-surface-2" />
              <Skeleton className="h-4 w-64 bg-surface-2" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 bg-surface-2 rounded-md" />
              <Skeleton className="h-8 w-20 bg-surface-2 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
