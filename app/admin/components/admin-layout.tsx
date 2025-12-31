"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { MobileAdminLayout } from "@/components/mobile/admin";
import { useMobile } from "@/lib/hooks/use-mobile";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const [collapsed, setCollapsed] = useState(false);
    const isMobile = useMobile();

    // Render mobile layout on mobile devices
    if (isMobile) {
        return <MobileAdminLayout>{children}</MobileAdminLayout>;
    }

    return (
        <div className="h-screen bg-background overflow-hidden">
            <AdminSidebar collapsed={collapsed} onCollapse={setCollapsed} />

            <div
                className={cn(
                    "transition-all duration-300 h-full overflow-y-auto",
                    collapsed ? "md:ml-[70px]" : "md:ml-[240px]"
                )}
            >
                <AdminHeader />
                <main className="p-3 sm:p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

