import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { MobileLayout } from "@/components/mobile/mobile-layout";
import { TeamProvider } from "@/components/dashboard/team-provider";
import { isMobileDevice } from "@/lib/is-mobile";

export default async function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const isMobile = await isMobileDevice();

    return (
        <TeamProvider>
            {isMobile ? (
                <MobileLayout>{children}</MobileLayout>
            ) : (
                <DashboardLayout>{children}</DashboardLayout>
            )}
        </TeamProvider>
    );
}
