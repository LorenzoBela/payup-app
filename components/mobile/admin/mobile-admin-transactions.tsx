"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import {
    Receipt,
    ChevronLeft,
    ChevronRight,
    Building2,
    User,
    DollarSign,
    Check,
    Clock,
    Circle
} from "lucide-react";
import { getAllTransactions } from "@/app/actions/admin";

interface Transaction {
    id: string;
    amount: number;
    description: string;
    category: string;
    currency: string;
    created_at: Date;
    paidByName: string;
    teamName: string;
    settlementCount: number;
    pendingCount: number;
    paidCount: number;
}

export function MobileAdminTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const result = await getAllTransactions({ page, limit: 20 });
            setTransactions(result.transactions);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page]);

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            Food: "bg-orange-100 text-orange-700",
            Transport: "bg-blue-100 text-blue-700",
            Utilities: "bg-purple-100 text-purple-700",
            Entertainment: "bg-pink-100 text-pink-700",
            Shopping: "bg-green-100 text-green-700",
            Other: "bg-gray-100 text-gray-700",
        };
        return colors[category] || colors.Other;
    };

    if (isLoading && transactions.length === 0) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-48" />
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Receipt className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">Transactions</h1>
                    <p className="text-sm text-muted-foreground">All system expenses</p>
                </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-2">
                {transactions.map((tx) => (
                    <Card key={tx.id}>
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-muted rounded-lg shrink-0">
                                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <p className="font-semibold truncate">{tx.description}</p>
                                        <p className="font-bold text-lg shrink-0">₱{tx.amount.toFixed(0)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className={`text-[10px] px-1.5 py-0 ${getCategoryColor(tx.category)}`}>
                                            {tx.category}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {tx.paidByName}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Building2 className="w-3 h-3" />
                                            {tx.teamName}
                                        </span>
                                        <span>
                                            {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    {tx.settlementCount > 0 && (
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                                            {tx.paidCount > 0 && (
                                                <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 border-green-300 text-green-700">
                                                    <Check className="w-2.5 h-2.5" />
                                                    {tx.paidCount} paid
                                                </Badge>
                                            )}
                                            {tx.pendingCount > 0 && (
                                                <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 border-yellow-300 text-yellow-700">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {tx.pendingCount} pending
                                                </Badge>
                                            )}
                                            {tx.settlementCount - tx.paidCount - tx.pendingCount > 0 && (
                                                <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                                                    <Circle className="w-2.5 h-2.5" />
                                                    {tx.settlementCount - tx.paidCount - tx.pendingCount} other
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {transactions.length === 0 && !isLoading && (
                <div className="text-center py-12">
                    <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No transactions found</p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || isLoading}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
