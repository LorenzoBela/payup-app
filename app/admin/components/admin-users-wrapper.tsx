"use client";

import { useMobile } from "@/lib/hooks/use-mobile";
import { MobileAdminUsers } from "@/components/mobile/admin";

interface AdminUsersWrapperProps {
    desktopContent: React.ReactNode;
}

export function AdminUsersWrapper({ desktopContent }: AdminUsersWrapperProps) {
    const isMobile = useMobile();

    if (isMobile) {
        return <MobileAdminUsers />;
    }

    return <>{desktopContent}</>;
}
