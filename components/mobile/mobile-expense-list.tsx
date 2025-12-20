"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { MobileActionSheet } from "./mobile-action-sheet";
import { useElementSwipe } from "@/lib/hooks/use-swipe";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    paidBy: string;
    paidByName: string;
    createdAt: Date;
    splitCount: number;
}

interface MobileExpenseListProps {
    expenses: Expense[];
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
    loading?: boolean;
}

function ExpenseCard({ expense, onEdit, onDelete }: {
    expense: Expense;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [actionSheetOpen, setActionSheetOpen] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);

    const { elementRef } = useElementSwipe({
        onSwipeLeft: () => setActionSheetOpen(true),
        threshold: 30,
    });

    return (
        <>
            <motion.div
                ref={elementRef as React.RefObject<HTMLDivElement>}
                animate={{ x: swipeOffset }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <Card
                    className="p-4 active:bg-accent transition-colors cursor-pointer"
                    onClick={() => setActionSheetOpen(true)}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold truncate">{expense.description}</h4>
                                {expense.category && (
                                    <Badge variant="outline" className="text-xs shrink-0">
                                        {expense.category}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Paid by {expense.paidByName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(expense.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-xl font-bold">₱{expense.amount.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                                Split {expense.splitCount} ways
                            </p>
                        </div>
                    </div>
                </Card>
            </motion.div>

            <MobileActionSheet
                open={actionSheetOpen}
                onOpenChange={setActionSheetOpen}
                title={expense.description}
                actions={[
                    {
                        label: "Edit Expense",
                        onClick: onEdit,
                        icon: <Pencil className="w-5 h-5" />,
                    },
                    {
                        label: "Delete Expense",
                        onClick: onDelete,
                        variant: "destructive",
                        icon: <Trash2 className="w-5 h-5" />,
                    },
                ]}
            />
        </>
    );
}

export function MobileExpenseList({
    expenses,
    onEdit,
    onDelete,
    loading,
}: MobileExpenseListProps) {
    if (loading) {
        return (
            <div className="space-y-3 w-full">
                {[...Array(5)].map((_, i) => (
                    <Card key={i} className="p-4 h-24 animate-pulse bg-muted" />
                ))}
            </div>
        );
    }

    if (expenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center w-full">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <MoreVertical className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No expenses yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Start tracking by adding your first expense
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 w-full">
            <h3 className="font-semibold text-lg mb-3">Recent Expenses</h3>
            {expenses.map((expense) => (
                <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onEdit={() => onEdit(expense)}
                    onDelete={() => onDelete(expense)}
                />
            ))}
        </div>
    );
}
