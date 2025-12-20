"use client";

import { useMobile } from "@/lib/hooks/use-mobile";
import { MobileAdminTransactions } from "@/components/mobile/admin";

interface AdminTransactionsWrapperProps {
    desktopContent: React.ReactNode;
}

export function AdminTransactionsWrapper({ desktopContent }: AdminTransactionsWrapperProps) {
    const isMobile = useMobile();

    if (isMobile) {
        return <MobileAdminTransactions />;
    }

    return <>{desktopContent}</>;
}
