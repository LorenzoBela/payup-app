"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Receipt, Loader2 } from "lucide-react";
import { AddExpenseDialog } from "@/components/dashboard/add-expense-dialog";
import { ExpenseList } from "@/components/dashboard/expense-list";
import { useTeam } from "@/components/dashboard/team-provider";
import { getExpenseStats } from "@/app/actions/expenses";
import { toast } from "sonner";

export default function ExpensesPage() {
    const { selectedTeam, isLoading } = useTeam();
    const [refreshKey, setRefreshKey] = useState(0);
    const [stats, setStats] = useState({
        totalSpent: 0,
        thisMonthSpent: 0,
        avgExpense: 0,
        settlementsCompleted: 0,
        settlementsTotal: 0
    });
    const [statsLoading, setStatsLoading] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            if (!selectedTeam) return;
            setStatsLoading(true);
            try {
                const data = await getExpenseStats(selectedTeam.id);
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
                toast.error("Failed to load statistics");
            } finally {
                setStatsLoading(false);
            }
        };

        if (selectedTeam) {
            fetchStats();
        }
    }, [selectedTeam, refreshKey]);

    const handleExpenseAdded = () => {
        setRefreshKey((prev) => prev + 1);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!selectedTeam) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <Receipt className="w-12 h-12 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold">No Team Selected</h2>
                <p className="text-muted-foreground">Please create or join a team to view expenses.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
                    <p className="text-muted-foreground">View and manage all team expenses</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" disabled>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <AddExpenseDialog teamId={selectedTeam.id} onExpenseAdded={handleExpenseAdded} />
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Expenses
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <p className="text-2xl font-bold">₱{stats.totalSpent.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">All time</p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <p className="text-2xl font-bold">₱{stats.thisMonthSpent.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Average per Expense
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <p className="text-2xl font-bold">₱{stats.avgExpense.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">Based on {stats.settlementsTotal} settlements</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Expenses List */}
            <ExpenseList teamId={selectedTeam.id} refreshKey={refreshKey} />
        </div>
    );
}
