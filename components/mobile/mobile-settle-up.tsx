"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, CheckCircle, Circle, Clock, DollarSign, Calendar } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getPaymentsPageData } from "@/app/actions/expenses";
import { useTeam } from "@/components/dashboard/team-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isBefore, isPast } from "date-fns";

// Get initials from name
const getInitials = (name: string) => {
    if (name === "You") return "ME";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Check if settlement is a monthly payment
const isMonthlyPayment = (settlement: any) => {
    const hasMonthPattern = /Month \d+\/\d+/i.test(settlement.expense_description);
    const hasDeadline = settlement.deadline !== null && settlement.deadline !== undefined;
    const isMonthlyFlag = settlement.is_monthly === true;
    return hasMonthPattern || hasDeadline || isMonthlyFlag;
};

interface DebtRelationship {
    personId: string;
    personName: string;
    totalAmount: number;
    pendingCount: number;
    unconfirmedCount: number;
    monthlyCount: number;
    earliestDeadline: Date | null;
    isOverdue: boolean;
    items: Array<{
        id: string;
        description: string;
        amount: number;
        status: string;
        deadline: Date | null;
        isMonthly: boolean;
    }>;
}

interface MobileSettleUpProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MobileSettleUp({ open, onOpenChange }: MobileSettleUpProps) {
    const { selectedTeam } = useTeam();
    const [debts, setDebts] = useState<DebtRelationship[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch data when dialog opens - using the SAME API as desktop payments page
    useEffect(() => {
        const fetchData = async () => {
            if (!open || !selectedTeam) return;

            setIsLoading(true);
            try {
                const { payables } = await getPaymentsPageData(selectedTeam.id);

                console.log('=== SETTLE UP DEBUG ===');
                console.log('Payables from API:', payables);

                // Group by person
                const grouped = payables.reduce((acc: Record<string, DebtRelationship>, curr: any) => {
                    const personId = curr.owed_to.id;
                    const personName = curr.owed_to.name;
                    const deadline = curr.deadline ? new Date(curr.deadline) : null;
                    const isMonthly = isMonthlyPayment(curr);

                    if (!acc[personId]) {
                        acc[personId] = {
                            personId,
                            personName,
                            totalAmount: 0,
                            pendingCount: 0,
                            unconfirmedCount: 0,
                            monthlyCount: 0,
                            earliestDeadline: null,
                            isOverdue: false,
                            items: []
                        };
                    }

                    const group = acc[personId];
                    group.totalAmount += curr.amount;

                    // Count by type
                    if (isMonthly) {
                        group.monthlyCount += 1;
                    } else if (curr.status === 'unconfirmed') {
                        group.unconfirmedCount += 1;
                    } else {
                        group.pendingCount += 1;
                    }

                    // Track earliest deadline
                    if (deadline) {
                        if (!group.earliestDeadline || isBefore(deadline, group.earliestDeadline)) {
                            group.earliestDeadline = deadline;
                            group.isOverdue = isPast(deadline);
                        }
                    }

                    group.items.push({
                        id: curr.id,
                        description: curr.expense_description,
                        amount: curr.amount,
                        status: curr.status,
                        deadline: deadline,
                        isMonthly: isMonthly
                    });

                    return acc;
                }, {});

                // Convert to array and sort
                const result = Object.values(grouped).sort((a, b) => {
                    if (a.isOverdue && !b.isOverdue) return -1;
                    if (!a.isOverdue && b.isOverdue) return 1;
                    if (a.earliestDeadline && b.earliestDeadline) {
                        return isBefore(a.earliestDeadline, b.earliestDeadline) ? -1 : 1;
                    }
                    if (a.earliestDeadline && !b.earliestDeadline) return -1;
                    if (!a.earliestDeadline && b.earliestDeadline) return 1;
                    return b.totalAmount - a.totalAmount;
                });

                setDebts(result);
            } catch (error) {
                console.error('Failed to fetch payments data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [open, selectedTeam]);

    const handleSettlePayment = (debt: DebtRelationship) => {
        window.location.href = `/dashboard/payments`;
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="rounded-t-3xl p-0 max-h-[90vh]">
                <div className="flex flex-col h-full max-h-[90vh]">
                    <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
                        <SheetTitle className="text-xl">Settle Up</SheetTitle>
                        <p className="text-sm text-muted-foreground">Pay what you owe</p>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <div className="space-y-3 pb-4">
                            {isLoading ? (
                                <>
                                    {[...Array(3)].map((_, i) => (
                                        <Card key={i} className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <Skeleton className="h-4 w-20" />
                                                <Skeleton className="h-4 w-4" />
                                                <Skeleton className="h-4 w-20" />
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                            </div>
                                        </Card>
                                    ))}
                                </>
                            ) : debts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-500" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2">You're All Settled!</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm">
                                        You don't owe anyone at the moment
                                    </p>
                                </div>
                            ) : (
                                debts.map((debt) => (
                                    <Card key={debt.personId} className={debt.isOverdue ? "border-red-500 border-2" : ""}>
                                        <div className="p-4 space-y-3">
                                            {/* You → Person */}
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border-2 border-primary">
                                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                                                        ME
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-semibold text-sm flex-1 min-w-0">You</span>
                                                <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                                                <span className="font-semibold text-sm flex-1 min-w-0 text-right">{debt.personName}</span>
                                                <Avatar className="h-10 w-10 border-2">
                                                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                                                        {getInitials(debt.personName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>

                                            {/* Amount and Deadline */}
                                            <div className="text-center space-y-1">
                                                <p className="text-3xl font-bold text-red-500">
                                                    ₱{debt.totalAmount.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">You owe</p>
                                                {debt.earliestDeadline && (
                                                    <div className={`text-xs font-medium flex items-center justify-center gap-1 ${debt.isOverdue ? 'text-red-600 dark:text-red-500' : 'text-muted-foreground'
                                                        }`}>
                                                        <Calendar className="w-3 h-3" />
                                                        {debt.isOverdue ? 'Overdue: ' : 'Due: '}
                                                        {format(debt.earliestDeadline, 'MMM d, yyyy')}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status badges */}
                                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                                {debt.pendingCount > 0 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Circle className="w-2 h-2 mr-1 fill-current" />
                                                        {debt.pendingCount} pending
                                                    </Badge>
                                                )}
                                                {debt.monthlyCount > 0 && (
                                                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {debt.monthlyCount} monthly
                                                    </Badge>
                                                )}
                                                {debt.unconfirmedCount > 0 && (
                                                    <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-400">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {debt.unconfirmedCount} awaiting
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Expense list */}
                                            {debt.items.length > 0 && (
                                                <div className="space-y-1 pt-2 border-t">
                                                    <p className="text-xs font-medium text-muted-foreground">For expenses:</p>
                                                    {debt.items.slice(0, 3).map((item) => (
                                                        <div key={item.id} className="flex justify-between text-xs gap-2">
                                                            <span className="text-muted-foreground truncate flex-1">
                                                                • {item.description}
                                                                {item.deadline && item.isMonthly && (
                                                                    <span className="text-[10px] ml-1 text-orange-600">
                                                                        (Due {format(item.deadline, 'MMM d')})
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className="font-medium shrink-0">₱{item.amount.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                    {debt.items.length > 3 && (
                                                        <p className="text-xs text-muted-foreground">+{debt.items.length - 3} more</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Action button */}
                                            <Button
                                                className={`w-full gap-2 ${debt.isOverdue ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                                size="lg"
                                                onClick={() => handleSettlePayment(debt)}
                                            >
                                                <DollarSign className="w-5 h-5" />
                                                {debt.isOverdue ? 'Pay Overdue to' : 'Pay'} {debt.personName}
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
