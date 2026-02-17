import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Skeleton } from "@/components/ui/skeleton";

export default function CityLeaderboardLoading() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-32 mb-8" />

          {/* Dish type tabs skeleton */}
          <div className="flex gap-2 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>

          {/* Leaderboard sections skeleton */}
          <div className="space-y-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-7 w-40 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-14 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
