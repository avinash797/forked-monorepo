import { LandingPageClient } from "@/components/marketing/landing-page-client";
import { CityLeaderboardViewer } from "@/components/marketing/city-leaderboard-viewer";

export const revalidate = 600;

export default function Home() {
  return <LandingPageClient leaderboardSection={<CityLeaderboardViewer />} />;
}
