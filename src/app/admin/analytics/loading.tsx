import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAnalyticsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-36 bg-[#3d2a1f]" />

      {/* Date range selector */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 bg-[#3d2a1f] rounded-md" />
        ))}
      </div>

      {/* Chart placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-[#342219] border border-[rgba(236,237,238,0.08)] rounded-sm p-5"
          >
            <Skeleton className="h-5 w-40 mb-4 bg-[#3d2a1f]" />
            <Skeleton className="h-48 w-full bg-[#3d2a1f] rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
