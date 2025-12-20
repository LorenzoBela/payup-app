"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Receipt, DollarSign, Plus, MoreHorizontal, Users, FileText, BarChart3, Settings, ScrollText, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MobileSettleUp } from "./mobile-settle-up";
import { useUserRole } from "@/lib/hooks/use-user-role";

const primaryNavItems = [
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: Home,
    },
    {
        href: "/dashboard/expenses",
        label: "Expenses",
        icon: Receipt,
    },
    {
        href: "add",
        label: "Add",
        icon: Plus,
        isAction: true,
    },
    {
        href: "/dashboard/payments",
        label: "Payments",
        icon: DollarSign,
    },
];

const moreMenuItems = [
    {
        href: "/dashboard/members",
        label: "Members",
        icon: Users,
        description: "View team members"
    },
    {
        href: "/dashboard/logs",
        label: "Activity Logs",
        icon: ScrollText,
        description: "Track team activity"
    },
    {
        href: "/dashboard/receipts",
        label: "Receipts",
        icon: FileText,
        description: "Manage receipts"
    },
    {
        href: "/dashboard/reports",
        label: "Reports",
        icon: BarChart3,
        description: "View analytics"
    },
    {
        href: "/dashboard/settings",
        label: "Settings",
        icon: Settings,
        description: "Account preferences"
    },
];

// Admin menu item - shown only for super admins
const adminMenuItem = {
    href: "/admin",
    label: "Admin Panel",
    icon: Shield,
    description: "System administration"
};

export function MobileNav() {
    const pathname = usePathname();
    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const [settleUpOpen, setSettleUpOpen] = useState(false);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const { isSuperAdmin, isLoading: roleLoading } = useUserRole();

    // Check if current page is in the more menu or admin
    const isMoreActive = moreMenuItems.some(item => pathname.startsWith(item.href)) ||
        (isSuperAdmin && pathname.startsWith("/admin"));

    const handleAddExpense = () => {
        setAddMenuOpen(false);
        setTimeout(() => {
            window.location.href = "/dashboard?action=add-expense";
        }, 100);
    };

    const handleSettleUp = () => {
        setAddMenuOpen(false);
        setTimeout(() => {
            setSettleUpOpen(true);
        }, 150);
    };

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden w-full max-w-full overflow-visible">
                <div className="flex items-center justify-around h-16 px-1 safe-area-bottom w-full">
                    {primaryNavItems.map((item) => {
                        if (item.isAction) {
                            return (
                                <button
                                    key={item.href}
                                    onClick={() => setAddMenuOpen(true)}
                                    className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all active:scale-95 relative"
                                >
                                    <div className="w-14 h-14 -mt-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl border-4 border-background">
                                        <Plus className="w-7 h-7" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-xs font-medium text-primary mt-0.5">{item.label}</span>
                                </button>
                            );
                        }

                        const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-[56px] active:scale-95",
                                    isActive
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                <Icon className={cn("w-5 h-5", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-xs font-medium">{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* More Menu Button */}
                    <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
                        <SheetTrigger asChild>
                            <button
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-[56px] active:scale-95",
                                    isMoreActive ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                <MoreHorizontal className={cn("w-5 h-5", isMoreActive && "fill-current")} strokeWidth={isMoreActive ? 2.5 : 2} />
                                <span className="text-xs font-medium">More</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>More Options</SheetTitle>
                            </SheetHeader>
                            <div className="grid gap-2 py-6 pb-8">
                                {/* Admin Panel - Only for SuperAdmins */}
                                {isSuperAdmin && (
                                    <Link
                                        href={adminMenuItem.href}
                                        onClick={() => setMoreMenuOpen(false)}
                                    >
                                        <div
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl transition-colors w-full",
                                                pathname.startsWith("/admin")
                                                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                                                    : "hover:bg-accent"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                                pathname.startsWith("/admin")
                                                    ? "bg-red-500 text-white"
                                                    : "bg-red-100 dark:bg-red-900/30 text-red-600"
                                            )}>
                                                <Shield className="w-6 h-6" />
                                            </div>
                                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                <div className="font-semibold text-base leading-tight">{adminMenuItem.label}</div>
                                                <div className="text-sm text-muted-foreground leading-tight">{adminMenuItem.description}</div>
                                            </div>
                                        </div>
                                    </Link>
                                )}

                                {/* Regular More Menu Items */}
                                {moreMenuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname.startsWith(item.href);

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

            {/* Add Expense Dialog */}
            <Dialog open={addMenuOpen} onOpenChange={setAddMenuOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Quick Actions</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-4">
                        <Button
                            variant="outline"
                            className="justify-start h-16"
                            onClick={handleAddExpense}
                        >
                            <Receipt className="mr-3 h-5 w-5 shrink-0" />
                            <div className="text-left">
                                <div className="font-semibold">Add Expense</div>
                                <div className="text-xs text-muted-foreground">Track a new expense</div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start h-16"
                            onClick={handleSettleUp}
                        >
                            <DollarSign className="mr-3 h-5 w-5 shrink-0" />
                            <div className="text-left">
                                <div className="font-semibold">Settle Up</div>
                                <div className="text-xs text-muted-foreground">Record a payment</div>
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Settle Up Sheet */}
            <MobileSettleUp open={settleUpOpen} onOpenChange={setSettleUpOpen} />
        </>
    );
}
