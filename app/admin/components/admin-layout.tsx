"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar collapsed={collapsed} onCollapse={setCollapsed} />

            <div
                className={cn(
                    "transition-all duration-300",
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

