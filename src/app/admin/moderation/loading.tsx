import { Skeleton } from "@/components/ui/skeleton";

export default function AdminModerationLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 bg-[#3d2a1f]" />

      {/* Filter tabs */}
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 bg-[#3d2a1f] rounded-md" />
        ))}
      </div>

      {/* Flag list skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-[#342219] border border-[rgba(236,237,238,0.08)] rounded-sm p-4 flex items-center justify-between"
          >
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48 bg-[#3d2a1f]" />
              <Skeleton className="h-4 w-64 bg-[#3d2a1f]" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 bg-[#3d2a1f] rounded-md" />
              <Skeleton className="h-8 w-20 bg-[#3d2a1f] rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
