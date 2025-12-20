"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowUpRight, ArrowDownLeft, Plus, Users as UsersIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface BalanceData {
    youOwe: number;
    owedToYou: number;
    youOweCount: number;
    owedToYouCount: number;
}

interface MobileDashboardProps {
    balances: BalanceData;
    loading: boolean;
    onAddExpense: () => void;
    onSettleUp: () => void;
}

export function MobileDashboard({
    balances,
    loading,
    onAddExpense,
    onSettleUp,
}: MobileDashboardProps) {
    const netBalance = balances.owedToYou - balances.youOwe;

    return (
        <div className="space-y-4 w-full">
            {/* Net Balance Card - Large and Prominent */}
            <Card className="border-2">
                <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground font-medium">Total Balance</p>
                        {loading ? (
                            <Skeleton className="h-12 w-32 mx-auto" />
                        ) : (
                            <p className={cn(
                                "text-4xl font-bold",
                                netBalance >= 0 ? "text-green-500" : "text-red-500"
                            )}>
                                ₱{Math.abs(netBalance).toFixed(2)}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            {netBalance >= 0 ? "You are owed" : "You owe"}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
                <Button
                    onClick={onAddExpense}
                    size="lg"
                    className="h-16 text-base font-semibold gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Expense
                </Button>
                <Button
                    onClick={onSettleUp}
                    variant="outline"
                    size="lg"
                    className="h-16 text-base font-semibold gap-2"
                >
                    <DollarSign className="w-5 h-5" />
                    Settle Up
                </Button>
            </div>

            {/* Balance Breakdown */}
            <div className="grid grid-cols-2 gap-3">
                {/* You Owe */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-red-500" />
                            You Owe
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <>
                                <p className="text-2xl font-bold text-red-500">
                                    ₱{balances.youOwe.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    to {balances.youOweCount} {balances.youOweCount === 1 ? 'person' : 'people'}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Owed to You */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ArrowDownLeft className="w-4 h-4 text-green-500" />
                            Owed to You
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <>
                                <p className="text-2xl font-bold text-green-500">
                                    ₱{balances.owedToYou.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    from {balances.owedToYouCount} {balances.owedToYouCount === 1 ? 'person' : 'people'}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
