export default function DishTypesLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-36 bg-[#342219] rounded animate-pulse" />
          <div className="h-4 w-24 bg-[#342219] rounded animate-pulse mt-2" />
        </div>
        <div className="h-9 w-36 bg-[#342219] rounded animate-pulse" />
      </div>

      <div className="mb-4">
        <div className="h-9 w-64 bg-[#342219] rounded animate-pulse" />
      </div>

      <div className="rounded-lg border border-[#4a3728] overflow-hidden">
        <div className="h-10 bg-[#1a0f08]" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-[#342219] border-t border-[#4a3728] flex items-center px-4 gap-4">
            <div className="h-8 w-8 bg-[#3d2a1f] rounded animate-pulse" />
            <div className="h-4 w-32 bg-[#3d2a1f] rounded animate-pulse" />
            <div className="h-4 w-24 bg-[#3d2a1f] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
