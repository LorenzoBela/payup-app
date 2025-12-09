import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { TeamProvider } from "@/components/dashboard/team-provider";

export default function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <TeamProvider>
            <DashboardLayout>{children}</DashboardLayout>
        </TeamProvider>
    );
}
