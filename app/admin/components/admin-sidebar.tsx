"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
    LayoutDashboard,
    Users,
    Building2,
    Receipt,
    Activity,
    Menu,
    Shield,
    ChevronLeft,
    ArrowLeft,
} from "lucide-react";

interface AdminSidebarProps {
    collapsed?: boolean;
    onCollapse?: (collapsed: boolean) => void;
}

const adminNavigation = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Teams", href: "/admin/teams", icon: Building2 },
    { name: "Transactions", href: "/admin/transactions", icon: Receipt },
    { name: "Activity", href: "/admin/activity", icon: Activity },
];

function AdminSidebarContent({ collapsed = false, onNavClick }: { collapsed?: boolean; onNavClick?: () => void }) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-2 px-4 py-6 border-b border-border">
                <div className="bg-red-600 p-2 rounded-lg">
                    <Shield className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <div className="flex flex-col">
                        <span className="font-bold text-xl">PayUp</span>
                        <span className="text-xs text-red-500 font-medium">Admin Panel</span>
                    </div>
                )}
            </div>

            {/* Back to Dashboard Link */}
            <div className="px-3 py-3 border-b border-border">
                <Link
                    href="/dashboard"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <ArrowLeft className="w-4 h-4" />
                    {!collapsed && <span>Back to Dashboard</span>}
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {adminNavigation.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/admin" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onNavClick}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-red-600 text-white"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border">
                {!collapsed && (
                    <p className="text-xs text-muted-foreground text-center">
                        SuperAdmin Access
                    </p>
                )}
            </div>
        </div>
    );
}

export function AdminSidebar({ collapsed = false, onCollapse }: AdminSidebarProps) {
    return (
        <aside
            className={cn(
                "hidden md:flex flex-col h-screen fixed left-0 top-0 bg-card border-r border-border transition-all duration-300 z-30",
                collapsed ? "w-[70px]" : "w-[240px]"
            )}
        >
            <AdminSidebarContent collapsed={collapsed} />

            {/* Collapse button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onCollapse?.(!collapsed)}
                className="absolute top-1/2 -right-3 transform -translate-y-1/2 h-6 w-6 rounded-full border bg-background shadow-md z-50 hover:bg-accent"
            >
                <ChevronLeft className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
            </Button>
        </aside>
    );
}

export function MobileAdminSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle admin menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[240px]">
                <SheetTitle className="sr-only">Admin Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                    Admin navigation sidebar to access users, teams, transactions, and activity logs.
                </SheetDescription>
                <AdminSidebarContent onNavClick={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}

