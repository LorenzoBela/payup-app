"use client";

import { useMobile } from "@/lib/hooks/use-mobile";
import { MobileAdminDashboard } from "@/components/mobile/admin";

interface AdminDashboardWrapperProps {
    desktopContent: React.ReactNode;
}

export function AdminDashboardWrapper({ desktopContent }: AdminDashboardWrapperProps) {
    const isMobile = useMobile();

    if (isMobile) {
        return <MobileAdminDashboard />;
    }

    return <>{desktopContent}</>;
}
