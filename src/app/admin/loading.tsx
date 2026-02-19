import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-36 bg-surface-2" />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-sm p-5"
          >
            <Skeleton className="h-4 w-24 mb-3 bg-surface-2" />
            <Skeleton className="h-8 w-16 bg-surface-2" />
          </div>
        ))}
      </div>

      {/* Activity panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-sm p-5"
          >
            <Skeleton className="h-6 w-36 mb-4 bg-surface-2" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-5 w-full bg-surface-2" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
