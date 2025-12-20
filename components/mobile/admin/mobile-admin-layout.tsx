"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Shield,
    Home,
    Users,
    Building2,
    Receipt,
    Activity,
    BarChart3,
    ChevronLeft,
    Menu,
    MoreHorizontal,
    Gauge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface MobileAdminLayoutProps {
    children: React.ReactNode;
}

// Primary items shown in bottom nav (first 4)
const primaryNavItems = [
    { href: "/admin", label: "Home", icon: Home },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/teams", label: "Teams", icon: Building2 },
    { href: "/admin/transactions", label: "Trans", icon: Receipt },
];

// More menu items (shown in sheet)
const moreMenuItems = [
    { href: "/admin/activity", label: "Activity Logs", icon: Activity, description: "System activity" },
    { href: "/admin/reports", label: "Reports", icon: BarChart3, description: "Analytics & insights" },
    { href: "/admin/performance", label: "Performance", icon: Gauge, description: "System health" },
];

// All nav items for the header menu
const allNavItems = [...primaryNavItems, ...moreMenuItems];

export function MobileAdminLayout({ children }: MobileAdminLayoutProps) {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);

    // Check if current page is in the more menu
    const isMoreActive = moreMenuItems.some(item =>
        item.href === pathname || pathname.startsWith(item.href + "/")
    );

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            {/* Mobile Admin Header */}
            <header className="sticky top-0 z-50 bg-card border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                            <Shield className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold">Admin</span>
                    </div>
                </div>

                {/* Header Navigation Menu */}
                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[280px]">
                        <SheetHeader className="text-left pb-4">
                            <SheetTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                Admin Menu
                            </SheetTitle>
                        </SheetHeader>
                        <nav className="space-y-1">
                            {allNavItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = item.href === pathname ||
                                    (item.href !== "/admin" && pathname.startsWith(item.href));

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <div
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                                                isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "hover:bg-accent text-muted-foreground"
                                            )}
                                        >
                                            <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                                            <span className={cn("font-medium", isActive && "text-primary")}>
                                                {item.label}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-6 pt-6 border-t">
                            <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                                <Button variant="outline" className="w-full gap-2">
                                    <ChevronLeft className="w-4 h-4" />
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </SheetContent>
                </Sheet>
            </header>

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t md:hidden">
                <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
                    {/* Primary Nav Items */}
                    {primaryNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.href === pathname ||
                            (item.href !== "/admin" && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-[56px]",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                <Icon className={cn("w-5 h-5", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* More Button */}
                    <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
                        <SheetTrigger asChild>
                            <button
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-[56px] active:scale-95",
                                    isMoreActive ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                <MoreHorizontal className={cn("w-5 h-5", isMoreActive && "fill-current")} strokeWidth={isMoreActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">More</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-t-3xl">
                            <SheetHeader>
                                <SheetTitle>More Options</SheetTitle>
                            </SheetHeader>
                            <div className="grid gap-2 py-6 pb-8">
                                {moreMenuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = item.href === pathname || pathname.startsWith(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMoreMenuOpen(false)}
                                        >
                                            <div
                                                className={cn(
                                                    "flex items-center gap-4 p-4 rounded-xl transition-colors w-full",
                                                    isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "hover:bg-accent"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                                    isActive ? "bg-primary text-primary-foreground" : "bg-secondary"
                                                )}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                    <div className="font-semibold text-base leading-tight">{item.label}</div>
                                                    <div className="text-sm text-muted-foreground leading-tight">{item.description}</div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </nav>

            {/* Main Content - overflow-y-auto makes this the scroll container, pb-24 provides clearance for the fixed h-16 bottom nav */}
            <main className="flex-1 overflow-y-auto p-4 pb-24">
                {children}
            </main>
        </div>
    );
}

