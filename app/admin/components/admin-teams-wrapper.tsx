"use client";

import { useMobile } from "@/lib/hooks/use-mobile";
import { MobileAdminTeams } from "@/components/mobile/admin";

interface AdminTeamsWrapperProps {
    desktopContent: React.ReactNode;
}

export function AdminTeamsWrapper({ desktopContent }: AdminTeamsWrapperProps) {
    const isMobile = useMobile();

    if (isMobile) {
        return <MobileAdminTeams />;
    }

    return <>{desktopContent}</>;
}
