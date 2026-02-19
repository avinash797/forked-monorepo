import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-36 bg-surface-2" />

      {/* Search + filters */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-64 bg-surface-2 rounded-md" />
        <Skeleton className="h-10 w-32 bg-surface-2 rounded-md" />
      </div>

      {/* Table rows */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-full bg-surface-2" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
