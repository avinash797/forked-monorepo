interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-2 ${className}`}
      aria-hidden="true"
    />
  );
}
