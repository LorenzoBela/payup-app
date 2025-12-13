"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllTransactions } from "@/app/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Receipt, ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
    id: string;
    amount: number;
    description: string;
    category: string;
    currency: string;
    created_at: Date;
    paid_by: string;
    team_id: string | null;
    paidByName: string;
    teamName: string;
    settlementCount: number;
    pendingCount: number;
    paidCount: number;
}

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getAllTransactions({
                page,
                limit: 20,
            });
            setTransactions(result.transactions as Transaction[]);
            setTotalPages(result.totalPages);
            setTotal(result.total);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            food: "bg-orange-500/10 text-orange-500",
            printing: "bg-blue-500/10 text-blue-500",
            supplies: "bg-green-500/10 text-green-500",
            other: "bg-gray-500/10 text-gray-500",
        };
        return colors[category] || colors.other;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">All Transactions</h1>
                <p className="text-muted-foreground">
                    View all expenses and settlements across the entire system.
                </p>
            </div>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Transactions
                    </CardTitle>
                    <CardDescription>
                        {total} total expenses across all teams
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : transactions.length > 0 ? (
                        <>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Paid By</TableHead>
                                            <TableHead>Team</TableHead>
                                            <TableHead>Settlements</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((tx) => (
                                            <TableRow key={tx.id}>
                                                <TableCell>
                                                    <p className="font-medium max-w-[200px] truncate">
                                                        {tx.description}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold">
                                                        ₱{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getCategoryColor(tx.category)}>
                                                        {tx.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">{tx.paidByName}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground">
                                                        {tx.teamName}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {tx.paidCount > 0 && (
                                                            <Badge variant="outline" className="gap-1 text-green-600">
                                                                <CheckCircle className="h-3 w-3" />
                                                                {tx.paidCount}
                                                            </Badge>
                                                        )}
                                                        {tx.pendingCount > 0 && (
                                                            <Badge variant="outline" className="gap-1 text-yellow-600">
                                                                <Clock className="h-3 w-3" />
                                                                {tx.pendingCount}
                                                            </Badge>
                                                        )}
                                                        {tx.settlementCount === 0 && (
                                                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                                                                <AlertCircle className="h-3 w-3" />
                                                                None
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <span className="hidden sm:inline ml-1">Previous</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                    >
                                        <span className="hidden sm:inline mr-1">Next</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-12">
                            No transactions found
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

