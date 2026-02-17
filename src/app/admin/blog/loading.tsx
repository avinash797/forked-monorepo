import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBlogLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36 bg-[#3d2a1f]" />
        <Skeleton className="h-10 w-32 bg-[#3d2a1f] rounded-md" />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 bg-[#3d2a1f] rounded-md" />
        ))}
      </div>

      {/* Table rows */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-full bg-[#3d2a1f]" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full bg-[#3d2a1f]" />
        ))}
      </div>
    </div>
  );
}
