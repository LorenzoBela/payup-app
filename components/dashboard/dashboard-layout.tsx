"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser, UserButton } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Sidebar, MobileSidebar } from "@/components/dashboard/sidebar";
import { TeamSwitcher } from "@/components/team-switcher";
import { DateDisplay } from "@/components/dashboard/date-display";
import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { useTeam } from "@/components/dashboard/team-provider";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const { teams, selectedTeam, setSelectedTeam, isLoading } = useTeam();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) {
            router.push("/signin");
            return;
        }
    }, [user, isLoaded, router]);

    if (!isLoaded || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen flex bg-background">
            {/* Desktop Sidebar */}
            <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />

            {/* Main Content */}
            <div className={cn(
                "flex-1 flex flex-col min-h-screen transition-all duration-300",
                sidebarCollapsed ? "md:ml-[70px]" : "md:ml-[240px]"
            )}>
                {/* Top Navbar */}
                <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex h-16 items-center gap-4 px-4 md:px-6 relative">
                        {/* Mobile menu */}
                        <MobileSidebar />

                        {/* Team Switcher - Desktop only */}
                        <div className="hidden sm:flex items-center gap-4">
                            <Separator orientation="vertical" className="h-6" />
                            <TeamSwitcher
                                teams={teams}
                                selectedTeam={selectedTeam}
                                onTeamSelect={setSelectedTeam}
                                onCreateTeamClick={() => router.push("/dashboard?action=create-team")}
                                onJoinTeamClick={() => router.push("/dashboard?action=join-team")}
                            />
                        </div>

                        {/* Centered Date Display - Mobile: absolute center, Desktop: in flow */}
                        <div className="absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0 sm:flex-1 sm:flex sm:justify-end sm:mr-4">
                            <DateDisplay />
                        </div>

                        {/* Spacer for desktop */}
                        <div className="flex-1 sm:hidden" />

                        <ModeToggle />

                        {/* User Button */}
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

