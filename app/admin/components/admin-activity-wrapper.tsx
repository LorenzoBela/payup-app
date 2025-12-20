"use client";

import { useMobile } from "@/lib/hooks/use-mobile";
import { MobileAdminActivity } from "@/components/mobile/admin";

interface AdminActivityWrapperProps {
    desktopContent: React.ReactNode;
}

export function AdminActivityWrapper({ desktopContent }: AdminActivityWrapperProps) {
    const isMobile = useMobile();

    if (isMobile) {
        return <MobileAdminActivity />;
    }

    return <>{desktopContent}</>;
}
