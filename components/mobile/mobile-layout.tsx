"use client";

import { MobileHeader } from "./mobile-header";
import { MobileNav } from "./mobile-nav";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export function MobileLayout({ children, className }: MobileLayoutProps) {
    return (
        <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden md:hidden">
            <MobileHeader />
            <main className={cn("flex-1 pb-20 w-full max-w-full overflow-x-hidden px-4 pt-4", className)}>
                {children}
            </main>
            <MobileNav />
        </div>
    );
}
