"use client";

import { UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/mode-toggle";
import { MobileAdminSidebar } from "./admin-sidebar";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export function AdminHeader() {
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

                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>
        </header>
    );
}

