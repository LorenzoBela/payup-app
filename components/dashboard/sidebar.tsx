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
    Receipt,
    BarChart3,
    Settings,
    Menu,
    DollarSign,
    ChevronLeft,
    History,
    FileText,
} from "lucide-react";

interface SidebarProps {
    teamId?: string;
    collapsed?: boolean;
    onCollapse?: (collapsed: boolean) => void;
}

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
    { name: "Members", href: "/dashboard/members", icon: Users },
    { name: "Logs", href: "/dashboard/logs", icon: History },
    { name: "Receipts", href: "/dashboard/receipts", icon: FileText },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

function SidebarContent({ collapsed = false, onNavClick }: { collapsed?: boolean; onNavClick?: () => void }) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-2 px-4 py-6 border-b border-border">
                <div className="bg-primary p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-primary-foreground" />
                </div>
                {!collapsed && (
                    <span className="font-bold text-xl">PayUp</span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onNavClick}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
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
                        © 2025 PayUp
                    </p>
                )}
            </div>
        </div>
    );
}

export function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
    return (
        <aside
            className={cn(
                "hidden md:flex flex-col h-screen fixed left-0 top-0 bg-card border-r border-border transition-all duration-300 z-30",
                collapsed ? "w-[70px]" : "w-[240px]"
            )}
        >
            <SidebarContent collapsed={collapsed} />

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

export function MobileSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[240px]">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                    Mobile navigation sidebar to access dashboard, expenses, members, reports, and settings.
                </SheetDescription>
                <SidebarContent onNavClick={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}

