"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft, Receipt, Calendar, Clock, User, CheckCircle2,
    XCircle, AlertCircle, CalendarDays, Users, Wallet
} from "lucide-react";
import { getExpenseById } from "@/app/actions/expenses";
import { useTeam } from "@/components/dashboard/team-provider";
import { EditExpenseDialog } from "@/components/dashboard/edit-expense-dialog";
import { useUser } from "@clerk/nextjs";

// Status badge component
function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case "paid":
            return (
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Paid
                </Badge>
            );
        case "unconfirmed":
            return (
                <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Pending Verification
                </Badge>
            );
        default:
            return (
                <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30">
                    <XCircle className="w-3 h-3 mr-1" />
                    Unpaid
                </Badge>
            );
    }
}

// Category colors
function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
        food: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        printing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        supplies: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        transportation: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        utilities: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    };
    return colors[category.toLowerCase()] || colors.other;
}

export default function ExpenseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const expenseId = params.expenseId as string;

    const [expense, setExpense] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { selectedTeam } = useTeam();
    const { user } = useUser();

    // Check if current user can edit this expense
    const canEdit = expense && user && (
        selectedTeam?.role === 'admin' || expense.paid_by === user.id
    );

    useEffect(() => {
        async function loadExpense() {
            if (!expenseId) return;

            setLoading(true);
            const result = await getExpenseById(expenseId);

            if (result.error) {
                setError(result.error);
            } else {
                setExpense(result.expense);
            }
            setLoading(false);
        }

        loadExpense();
    }, [expenseId]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-64 rounded-xl" />
                        <Skeleton className="h-96 rounded-xl" />
                    </div>
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !expense) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <Receipt className="w-12 h-12 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold">Expense Not Found</h2>
                <p className="text-muted-foreground">{error || "The expense you're looking for doesn't exist."}</p>
                <Button onClick={() => router.push("/dashboard/expenses")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Expenses
                </Button>
            </div>
        );
    }

    const paidCount = expense.settlements.filter((s: any) => s.status === "paid").length;
    const totalMembers = expense.settlements.length;
    const paymentPercentage = totalMembers > 0 ? (paidCount / totalMembers) * 100 : 0;
    const totalPaid = expense.settlements
        .filter((s: any) => s.status === "paid")
        .reduce((sum: number, s: any) => sum + s.amount_owed, 0);
    const totalPending = expense.settlements
        .filter((s: any) => s.status !== "paid")
        .reduce((sum: number, s: any) => sum + s.amount_owed, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/expenses")}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold tracking-tight">{expense.description}</h1>
                        <Badge variant="secondary" className={getCategoryColor(expense.category)}>
                            {expense.category}
                        </Badge>
                        {expense.is_monthly && (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                                <CalendarDays className="w-3 h-3 mr-1" />
                                Monthly Plan
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground mt-1">
                        Created on {new Date(expense.created_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
                {canEdit && (
                    <EditExpenseDialog
                        expenseId={expense.id}
                        currentDescription={expense.description}
                        currentNote={expense.note}
                        onExpenseUpdated={() => window.location.reload()}
                    />
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Overview Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="w-5 h-5" />
                                Expense Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Amount</p>
                                        <p className="text-3xl font-bold text-primary">
                                            ₱{expense.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    {expense.is_monthly && expense.total_months && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Monthly Payment</p>
                                            <p className="text-xl font-semibold">
                                                ₱{(expense.amount / expense.total_months).toFixed(2)}/month
                                            </p>
                                            <p className="text-xs text-muted-foreground">{expense.total_months} months total</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Paid By</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{expense.paid_by_user?.name || "Unknown"}</p>
                                                <p className="text-xs text-muted-foreground">{expense.paid_by_user?.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {expense.team && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Team</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium">{expense.team.name}</span>
                                            </div>
                                        </div>
                                    )}
                                    {expense.note && (
                                        <div className="mt-4 pt-4 border-t">
                                            <p className="text-sm text-muted-foreground mb-1">Note</p>
                                            <p className="text-sm text-foreground">{expense.note}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Progress */}
                            {totalMembers > 0 && (
                                <div className="mt-6 pt-6 border-t">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-muted-foreground">Payment Progress</span>
                                        <span className={paidCount === totalMembers ? "text-green-500 font-medium" : ""}>
                                            {paidCount}/{totalMembers} members paid ({paymentPercentage.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 rounded-full ${paymentPercentage === 100 ? 'bg-green-500' :
                                                paymentPercentage > 50 ? 'bg-yellow-500' : 'bg-orange-500'
                                                }`}
                                            style={{ width: `${paymentPercentage}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                        <span>₱{totalPaid.toFixed(2)} collected</span>
                                        <span>₱{totalPending.toFixed(2)} pending</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Member Settlements */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Member Settlements
                            </CardTitle>
                            <CardDescription>Track who has paid and who still owes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {expense.settlements.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No settlements for this expense</p>
                            ) : (
                                <div className="space-y-3">
                                    {expense.settlements.map((settlement: any) => (
                                        <div
                                            key={settlement.id}
                                            className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{settlement.member?.name || "Unknown"}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {settlement.paid_at
                                                            ? `Paid on ${new Date(settlement.paid_at).toLocaleDateString()}`
                                                            : "Payment pending"
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="text-lg font-semibold">₱{settlement.amount_owed.toFixed(2)}</p>
                                                <StatusBadge status={settlement.status} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Monthly Breakdown (if applicable) */}
                    {expense.is_monthly && expense.child_expenses && expense.child_expenses.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarDays className="w-5 h-5" />
                                    Monthly Breakdown
                                </CardTitle>
                                <CardDescription>View each monthly installment</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {expense.child_expenses.map((child: any, index: number) => {
                                        const childPaidCount = child.settlements.filter((s: any) => s.status === "paid").length;
                                        const childTotal = child.settlements.length;
                                        return (
                                            <div key={child.id} className="border border-border rounded-lg overflow-hidden">
                                                <div className="flex items-center justify-between p-4 bg-muted/20">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                            {child.month_number}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">Month {child.month_number}</p>
                                                            {child.deadline && (
                                                                <div className="flex items-center gap-1 text-xs text-orange-500">
                                                                    <Clock className="w-3 h-3" />
                                                                    Due: {new Date(child.deadline).toLocaleDateString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold">₱{child.amount.toFixed(2)}</p>
                                                        <p className="text-xs text-muted-foreground">{childPaidCount}/{childTotal} paid</p>
                                                    </div>
                                                </div>
                                                {child.settlements.length > 0 && (
                                                    <div className="p-4 space-y-2 bg-background">
                                                        {child.settlements.map((s: any) => (
                                                            <div key={s.id} className="flex items-center justify-between text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                                    <span>{s.member?.name || "Unknown"}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-muted-foreground">₱{s.amount_owed.toFixed(0)}</span>
                                                                    <StatusBadge status={s.status} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Amount</span>
                                <span className="font-semibold">₱{expense.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Category</span>
                                <Badge variant="secondary" className={getCategoryColor(expense.category)}>
                                    {expense.category}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Members</span>
                                <span className="font-semibold">{totalMembers}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Collected</span>
                                <span className="font-semibold text-green-500">₱{totalPaid.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Pending</span>
                                <span className="font-semibold text-orange-500">₱{totalPending.toFixed(0)}</span>
                            </div>
                            {expense.is_monthly && (
                                <>
                                    <div className="border-t pt-4 mt-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Total Months</span>
                                            <span className="font-semibold">{expense.total_months}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Deadline Day</span>
                                        <span className="font-semibold">{expense.deadline_day}th of month</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/expenses")}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Expenses
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
