export default function DishTypesLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-36 bg-surface-2 rounded animate-pulse" />
          <div className="h-4 w-24 bg-surface-2 rounded animate-pulse mt-2" />
        </div>
        <div className="h-9 w-36 bg-surface-2 rounded animate-pulse" />
      </div>

      <div className="mb-4">
        <div className="h-9 w-64 bg-surface-2 rounded animate-pulse" />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="h-10 bg-surface-2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 bg-surface border-t border-border flex items-center px-4 gap-4"
          >
            <div className="h-8 w-8 bg-surface-2 rounded animate-pulse" />
            <div className="h-4 w-32 bg-surface-2 rounded animate-pulse" />
            <div className="h-4 w-24 bg-surface-2 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
