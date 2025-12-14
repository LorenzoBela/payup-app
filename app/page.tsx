import { getLandingStats } from "@/app/actions/stats";
import { LandingPageClient } from "@/components/landing-page-client";

export default async function Home() {
  const stats = await getLandingStats();
  return <LandingPageClient stats={stats} />;
}
