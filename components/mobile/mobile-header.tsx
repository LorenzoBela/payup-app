"use client";

import { MobileTeamSwitcher } from "@/components/mobile/mobile-team-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { UserButton } from "@clerk/nextjs";
import { DollarSign } from "lucide-react";

export function MobileHeader() {
    return (
        <header className="sticky top-0 z-40 w-full max-w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden overflow-x-hidden">
            <div className="flex h-14 items-center justify-between px-3 gap-2 w-full max-w-full">
                {/* Left: Logo */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="bg-primary p-1.5 rounded-lg">
                        <DollarSign className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-base">PayUp</span>
                </div>

                {/* Center: Team Switcher - takes available space */}
                <div className="flex-1 min-w-0 max-w-[180px]">
                    <MobileTeamSwitcher />
                </div>

                {/* Right: Theme & User */}
                <div className="flex items-center gap-1 shrink-0">
                    <ModeToggle />
                    <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                            elements: {
                                avatarBox: "w-8 h-8"
                            }
                        }}
                    />
                </div>
            </div>
        </header>
    );
}
