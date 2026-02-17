import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Skeleton } from "@/components/ui/skeleton";

export default function DishTypeLeaderboardLoading() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Skeleton className="h-5 w-48 mb-4" />
          <Skeleton className="h-10 w-80 mb-2" />
          <Skeleton className="h-5 w-64 mb-8" />

          {/* Table skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-md" />
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>

          {/* FAQ skeleton */}
          <div className="mt-16 space-y-4">
            <Skeleton className="h-8 w-64 mb-6" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
