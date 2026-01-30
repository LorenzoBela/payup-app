"use client";

import { useEffect, useState } from "react";
import { useTeam } from "@/components/dashboard/team-provider";
import { getTeamSettlements } from "@/app/actions/expenses";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, CheckCircle2, Grid3X3, List, ArrowRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Receipt {
    id: string;
    expense_description: string;
    owed_by: string; // Name
    owed_to: string; // Name
    amount: number;
    status: string;
    paid_at?: Date | null;
}

export default function ReceiptsPage() {
    const { selectedTeam } = useTeam();
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    useEffect(() => {
        if (selectedTeam) {
            setLoading(true);
            getTeamSettlements(selectedTeam.id).then((data) => {
                const settlements = data.settlements || [];
                // Filter for paid settlements
                const paid = settlements
                    .filter((s) => s.status === "paid")
                    .map(s => ({
                        id: s.id,
                        expense_description: s.expense_description,
                        owed_by: s.owed_by,
                        owed_to: s.owed_to,
                        amount: s.amount,
                        status: s.status,
                        paid_at: s.paid_at ? new Date(s.paid_at) : null
                    }))
                    .sort((a, b) => {
                        const dateA = a.paid_at ? a.paid_at.getTime() : 0;
                        const dateB = b.paid_at ? b.paid_at.getTime() : 0;
                        return dateB - dateA;
                    });
                setReceipts(paid);
                setLoading(false);
            });
        }
    }, [selectedTeam]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                <h1 className="text-2xl sm:text-3xl font-bold">Receipts</h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <CardTitle>Payment History</CardTitle>
                        {/* View Toggle */}
                        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                            <Button
                                variant={viewMode === "grid" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("grid")}
                                className="h-8 w-8 p-0"
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("list")}
                                className="h-8 w-8 p-0"
                            >
                                <List className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {receipts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No payment receipts found.
                        </div>
                    ) : viewMode === "grid" ? (
                        /* Grid View - Minimalist */
                        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                            {receipts.map((receipt) => (
                                <div
                                    key={receipt.id}
                                    className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
                                >
                                    <div className="flex flex-col h-full">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <Badge variant="outline" className="border-green-200 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs">
                                                Paid
                                            </Badge>
                                        </div>

                                        {/* Title & Amount */}
                                        <h3 className="font-medium text-foreground line-clamp-2 mb-2">
                                            {receipt.expense_description}
                                        </h3>
                                        <p className="text-xl font-bold text-green-600 dark:text-green-400 mb-3">
                                            PHP {receipt.amount.toFixed(2)}
                                        </p>

                                        {/* Payer Info */}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                            <span className="font-medium text-foreground truncate">{receipt.owed_by}</span>
                                            <ArrowRight className="w-3 h-3 flex-shrink-0" />
                                            <span className="font-medium text-foreground truncate">{receipt.owed_to}</span>
                                        </div>

                                        {/* Footer */}
                                        {receipt.paid_at && (
                                            <div className="mt-auto pt-3 border-t">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{receipt.paid_at.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* List View */
                        <div className="space-y-4">
                            {receipts.map((receipt) => (
                                <div key={receipt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full hidden sm:block">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">{receipt.expense_description}</p>
                                            <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground mt-1">
                                                <span className="font-medium text-foreground">{receipt.owed_by}</span>
                                                <span>paid</span>
                                                <span className="font-medium text-foreground">{receipt.owed_to}</span>
                                            </div>
                                            {receipt.paid_at && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {receipt.paid_at.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                        <Badge variant="outline" className="border-green-200 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                                            Paid
                                        </Badge>
                                        <span className="font-bold text-xl">
                                            PHP {receipt.amount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
