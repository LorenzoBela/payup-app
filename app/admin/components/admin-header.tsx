"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/mode-toggle";
import { MobileAdminSidebar } from "./admin-sidebar";
import { Badge } from "@/components/ui/badge";
import { Shield, Calendar, Clock } from "lucide-react";

export function AdminHeader() {
    const [dateTime, setDateTime] = useState<{ date: string; time: string; day: string } | null>(null);

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            setDateTime({
                day: now.toLocaleDateString(undefined, { weekday: 'long' }),
                date: now.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                time: now.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
            });
        };

        updateDateTime();
        const interval = setInterval(updateDateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="sticky top-0 z-20 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-full items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-4">
                    <MobileAdminSidebar />
                    <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="hidden sm:flex gap-1">
                            <Shield className="w-3 h-3" />
                            SuperAdmin
                        </Badge>
                    </div>
                </div>

                {/* Date & Time Display */}
                <div className="hidden md:flex items-center gap-4 text-sm">
                    {dateTime && (
                        <>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">{dateTime.day}</span>
                                <span>•</span>
                                <span>{dateTime.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span className="font-mono">{dateTime.time}</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>
        </header>
    );
}
