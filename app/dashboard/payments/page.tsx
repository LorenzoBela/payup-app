"use client";

import { useEffect, useState } from "react";
import { useTeam } from "@/components/dashboard/team-provider";
import { getMyPendingSettlements, getMyReceivables, markSettlementAsPaid } from "@/app/actions/expenses";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, DollarSign, Wallet, CheckCircle2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Person {
    id: string;
    name: string;
    email: string;
}

interface PendingSettlement {
    id: string;
    amount: number;
    expense_description: string;
    expense_amount: number;
    expense_date: Date;
    category: string;
    person: Person;
}

interface GroupedDebt {
    personId: string;
    person: Person;
    totalAmount: number;
    settlements: PendingSettlement[];
}

export default function PaymentsPage() {
    const { selectedTeam } = useTeam();
    const [payables, setPayables] = useState<GroupedDebt[]>([]);
    const [receivables, setReceivables] = useState<GroupedDebt[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchData = async () => {
        if (!selectedTeam) return;
        setLoading(true);
        try {
            const [payablesData, receivablesData] = await Promise.all([
                getMyPendingSettlements(selectedTeam.id),
                getMyReceivables(selectedTeam.id)
            ]);

            // Process Payables (I Owe)
            const groupedPayables = payablesData.reduce((acc, curr) => {
                const personId = curr.owed_to.id;
                if (!acc[personId]) {
                    acc[personId] = {
                        personId,
                        person: curr.owed_to,
                        totalAmount: 0,
                        settlements: []
                    };
                }
                acc[personId].settlements.push({
                    ...curr,
                    person: curr.owed_to
                });
                acc[personId].totalAmount += curr.amount;
                return acc;
            }, {} as Record<string, GroupedDebt>);

            // Process Receivables (Owed to Me)
            const groupedReceivables = receivablesData.reduce((acc, curr) => {
                const personId = curr.owed_by.id;
                if (!acc[personId]) {
                    acc[personId] = {
                        personId,
                        person: curr.owed_by,
                        totalAmount: 0,
                        settlements: []
                    };
                }
                acc[personId].settlements.push({
                    ...curr,
                    person: curr.owed_by
                });
                acc[personId].totalAmount += curr.amount;
                return acc;
            }, {} as Record<string, GroupedDebt>);

            setPayables(Object.values(groupedPayables));
            setReceivables(Object.values(groupedReceivables));
        } catch (error) {
            console.error("Failed to fetch payments data", error);
            toast.error("Failed to load payments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedTeam]);

    const handleAction = async (settlementId: string, type: 'pay' | 'collect') => {
        setProcessingId(settlementId);
        try {
            const result = await markSettlementAsPaid(settlementId);
            if (result.success) {
                toast.success(type === 'pay' ? "Payment successful!" : "Marked as received!");
                await fetchData(); // Refresh data
            } else {
                toast.error(result.error || "Action failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading && payables.length === 0 && receivables.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const DebtList = ({ groups, type }: { groups: GroupedDebt[], type: 'payable' | 'receivable' }) => {
        if (groups.length === 0) {
            return (
                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <CheckCircle2 className="w-12 h-12 mb-4 text-green-500" />
                        <h3 className="text-xl font-semibold mb-2">You're all settled up!</h3>
                        <p>{type === 'payable' ? "You don't owe anything." : "No one owes you anything."}</p>
                    </CardContent>
                </Card>
            );
        }

        return (
            <div className="grid gap-6">
                {groups.map((group) => (
                    <Card key={group.personId} className="overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${type === 'payable' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {type === 'payable' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">
                                            {type === 'payable' ? `Owed to ${group.person.name}` : `Owed by ${group.person.name}`}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Based on {group.settlements.length} expense{group.settlements.length > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Amount</p>
                                    <p className={`text-2xl font-bold ${type === 'payable' ? 'text-red-600' : 'text-green-600'}`}>
                                        PHP {group.totalAmount.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ul className="divide-y divide-border">
                                {group.settlements.map((settlement) => (
                                    <li key={settlement.id} className="p-4 hover:bg-muted/20 transition-colors">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">{settlement.expense_description}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    <span>{new Date(settlement.expense_date).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span className="capitalize">{settlement.category}</span>
                                                    <span>•</span>
                                                    <span>Original: PHP {settlement.expense_amount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-semibold whitespace-nowrap">
                                                    PHP {settlement.amount.toFixed(2)}
                                                </span>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant={type === 'payable' ? "default" : "outline"}
                                                            disabled={processingId === settlement.id}
                                                            className={type === 'receivable' ? "border-green-600 text-green-600 hover:bg-green-50" : ""}
                                                        >
                                                            {type === 'payable' ? "Pay" : "Collect"}
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>{type === 'payable' ? "Confirm Payment" : "Confirm Receipt"}</DialogTitle>
                                                            <DialogDescription>
                                                                {type === 'payable'
                                                                    ? `Are you sure you want to mark this debt to ${group.person.name} as paid?`
                                                                    : `Are you sure you want to mark this debt from ${group.person.name} as received?`
                                                                }
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        <div className="py-4">
                                                            <Alert variant={type === 'payable' ? "default" : "default"}>
                                                                <DollarSign className="h-4 w-4" />
                                                                <AlertTitle>Amount</AlertTitle>
                                                                <AlertDescription className="font-bold text-lg mt-1">
                                                                    PHP {settlement.amount.toFixed(2)}
                                                                </AlertDescription>
                                                            </Alert>
                                                        </div>

                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => { }}>Cancel</Button>
                                                            <Button
                                                                onClick={() => handleAction(settlement.id, type === 'payable' ? 'pay' : 'collect')}
                                                                disabled={processingId === settlement.id}
                                                                variant={type === 'payable' ? "default" : "outline"}
                                                                className={type === 'receivable' ? "border-green-600 text-green-600 hover:bg-green-50" : ""}
                                                            >
                                                                {processingId === settlement.id ? (
                                                                    <>
                                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                        Processing...
                                                                    </>
                                                                ) : (
                                                                    type === 'payable' ? "Confirm Payment" : "Mark as Received"
                                                                )}
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <DollarSign className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold">Payments</h1>
                </div>
            </div>

            <Tabs defaultValue="payables" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="payables">I Owe (Payables)</TabsTrigger>
                    <TabsTrigger value="receivables">Owed to Me (Receivables)</TabsTrigger>
                </TabsList>
                <TabsContent value="payables" className="mt-6">
                    <DebtList groups={payables} type="payable" />
                </TabsContent>
                <TabsContent value="receivables" className="mt-6">
                    <DebtList groups={receivables} type="receivable" />
                </TabsContent>
            </Tabs>
        </div>
    );
}
