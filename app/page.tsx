import { getLandingStats } from "@/app/actions/stats";
import { LandingPageClient } from "@/components/landing-page-client";
import { MobileLanding } from "@/components/mobile/mobile-landing";
import { isMobileDevice } from "@/lib/is-mobile";

export default async function Home() {
  const stats = await getLandingStats();
  const isMobile = await isMobileDevice();

  if (isMobile) {
    return <MobileLanding stats={stats} />;
  }

  return <LandingPageClient stats={stats} />;
}
