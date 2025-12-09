"use client";

import { useEffect, useState } from "react";
import { useTeam } from "@/components/dashboard/team-provider";
import { getTeamSettlements } from "@/app/actions/expenses";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, FileText, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

    useEffect(() => {
        if (selectedTeam) {
            setLoading(true);
            getTeamSettlements(selectedTeam.id).then((data: any[]) => {
                // Filter for paid settlements
                const paid = data
                    .filter((s) => s.status === "paid")
                    .map(s => ({
                        ...s,
                        // Ensure paid_at is a proper Date object if it comes as string
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
            <div className="flex items-center gap-2">
                <FileText className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold">Receipts</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {receipts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No payment receipts found.
                            </div>
                        ) : (
                            receipts.map((receipt) => (
                                <div key={receipt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-green-100 p-2 rounded-full hidden sm:block">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
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
                                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                                            Paid
                                        </Badge>
                                        <span className="font-bold text-xl">
                                            PHP {receipt.amount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
