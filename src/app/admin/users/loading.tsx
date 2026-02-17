import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-36 bg-[#3d2a1f]" />

      {/* Search + filters */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-64 bg-[#3d2a1f] rounded-md" />
        <Skeleton className="h-10 w-32 bg-[#3d2a1f] rounded-md" />
      </div>

      {/* Table rows */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-full bg-[#3d2a1f]" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full bg-[#3d2a1f]" />
        ))}
      </div>
    </div>
  );
}
