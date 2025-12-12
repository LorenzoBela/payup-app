"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { TeamSwitcher } from "@/components/team-switcher";
import { useTeam } from "@/components/dashboard/team-provider";
import { Separator } from "@/components/ui/separator";
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
    Shield,
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
    { name: "Payments", href: "/dashboard/payments", icon: DollarSign },
    { name: "Logs", href: "/dashboard/logs", icon: History },
    { name: "Receipts", href: "/dashboard/receipts", icon: FileText },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

function SidebarContent({ collapsed = false, onNavClick, isSuperAdmin = false }: { collapsed?: boolean; onNavClick?: () => void; isSuperAdmin?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();

    // Prefetch route on hover for instant navigation
    const handleMouseEnter = useCallback((href: string) => {
        router.prefetch(href);
    }, [router]);

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
                            onMouseEnter={() => handleMouseEnter(item.href)}
                            prefetch={true}
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

                {/* SuperAdmin Link */}
                {isSuperAdmin && (
                    <Link
                        href="/admin"
                        onClick={onNavClick}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-4 border-t border-border pt-4",
                            pathname.startsWith("/admin")
                                ? "bg-red-600 text-white"
                                : "text-red-500 hover:bg-red-500/10 hover:text-red-600"
                        )}
                    >
                        <Shield className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span>Admin Panel</span>}
                    </Link>
                )}
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
    const { isSuperAdmin } = useUserRole();

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col h-screen fixed left-0 top-0 bg-card border-r border-border transition-all duration-300 z-30",
                collapsed ? "w-[70px]" : "w-[240px]"
            )}
        >
            <SidebarContent collapsed={collapsed} isSuperAdmin={isSuperAdmin} />

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
    const { isSuperAdmin } = useUserRole();
    const { teams, selectedTeam, setSelectedTeam } = useTeam();
    const router = useRouter();

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                    Mobile navigation sidebar to access dashboard, expenses, members, reports, and settings.
                </SheetDescription>

                {/* Team Switcher Section for Mobile */}
                <div className="px-4 py-4 border-b border-border bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Current Team</p>
                    <TeamSwitcher
                        teams={teams}
                        selectedTeam={selectedTeam}
                        onTeamSelect={(team) => {
                            setSelectedTeam(team);
                            setOpen(false);
                        }}
                        onCreateTeamClick={() => {
                            router.push("/dashboard?action=create-team");
                            setOpen(false);
                        }}
                        onJoinTeamClick={() => {
                            router.push("/dashboard?action=join-team");
                            setOpen(false);
                        }}
                        className="w-full"
                    />
                </div>

                <SidebarContent onNavClick={() => setOpen(false)} isSuperAdmin={isSuperAdmin} />
            </SheetContent>
        </Sheet>
    );
}

