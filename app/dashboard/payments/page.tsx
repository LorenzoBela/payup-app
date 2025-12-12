"use client";

import { useEffect, useState } from "react";
import { useTeam } from "@/components/dashboard/team-provider";
import { getMyPendingSettlements, getMyReceivables, markSettlementAsPaid, markSettlementsAsPaid, verifySettlement, rejectSettlement } from "@/app/actions/expenses";
import { updateGcashNumber } from "@/app/actions/auth";
import { useGcashNumber } from "@/lib/hooks/use-dashboard-data";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Loader2, DollarSign, Wallet, CheckCircle2, ArrowUpRight, ArrowDownLeft, ChevronDown, ChevronUp, XCircle, Check, Smartphone, Edit2, Save, Clock, Image, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PaymentModal } from "@/components/dashboard/payment-modal";
import { BatchPaymentModal } from "@/components/dashboard/batch-payment-modal";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PaymentSummary } from "@/components/dashboard/payment-summary";

interface Person {
    id: string;
    name: string;
    email: string;
    gcash_number?: string | null;
}

interface PendingSettlement {
    id: string;
    amount: number;
    expense_description: string;
    expense_amount: number;
    expense_date: Date;
    category: string;
    person: Person;
    status: 'pending' | 'unconfirmed' | 'paid';
    payment_method?: string | null;
    proof_url?: string | null;
    // Deadline fields
    is_monthly?: boolean;
    deadline?: Date | null;
    deadline_day?: number | null;
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
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedSettlement, setSelectedSettlement] = useState<any>(null);

    // Verification modal state
    const [verificationModalOpen, setVerificationModalOpen] = useState(false);
    const [settlementToVerify, setSettlementToVerify] = useState<PendingSettlement | null>(null);

    // Batch payment modal state
    const [batchPaymentModalOpen, setBatchPaymentModalOpen] = useState(false);
    const [batchPaymentData, setBatchPaymentData] = useState<{
        settlements: { id: string; amount: number; expense_description: string }[];
        recipientName: string;
        recipientGcash?: string | null;
        totalAmount: number;
    } | null>(null);

    // GCash number - now using SWR hook (loads in parallel with other data)
    const { gcashNumber: myGcashNumber, mutate: mutateGcash } = useGcashNumber();
    const [isEditingGcash, setIsEditingGcash] = useState(false);
    const [savingGcash, setSavingGcash] = useState(false);
    const [gcashInput, setGcashInput] = useState<string>("");

    // Update gcashInput when myGcashNumber loads
    useEffect(() => {
        if (myGcashNumber && !gcashInput) {
            setGcashInput(myGcashNumber);
        }
    }, [myGcashNumber, gcashInput]);

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

    const handleSaveGcash = async () => {
        setSavingGcash(true);
        try {
            const result = await updateGcashNumber(gcashInput);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("GCash number saved successfully!");
                mutateGcash(); // Revalidate SWR cache
                setIsEditingGcash(false);
            }
        } catch (error) {
            toast.error("Failed to save GCash number");
        } finally {
            setSavingGcash(false);
        }
    };

    const handleCancelEdit = () => {
        setGcashInput(myGcashNumber);
        setIsEditingGcash(false);
    };

    const handleAction = async (settlementId: string, type: 'pay' | 'collect' | 'verify' | 'reject') => {
        setProcessingId(settlementId);
        try {
            if (type === 'pay') {
                // Should open modal instead
                // Keeping validation logic safe
                const result = await markSettlementAsPaid(settlementId, "CASH");
                // ... default fallback behavior
            } else if (type === 'verify') {
                const result = await verifySettlement(settlementId);
                if (result.success) {
                    toast.success("Payment verified!");
                    await fetchData();
                } else {
                    toast.error(result.error || "Verification failed");
                }
            } else if (type === 'reject') {
                const result = await rejectSettlement(settlementId);
                if (result.success) {
                    toast.success("Payment rejected!");
                    await fetchData();
                } else {
                    toast.error(result.error || "Rejection failed");
                }
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setProcessingId(null);
        }
    };

    const handleBatchAction = async (settlementIds: string[], type: 'pay' | 'collect') => {
        setProcessingId('batch');
        try {
            const result = await markSettlementsAsPaid(settlementIds);
            if (result.success) {
                toast.success(type === 'pay' ? "All payments successful!" : "All marked as received!");
                await fetchData();
            } else {
                toast.error(result.error || "Batch action failed");
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

    const openPaymentModal = (settlement: any) => {
        setSelectedSettlement({
            id: settlement.id,
            amount: settlement.amount,
            owed_to: settlement.person,
            expense_description: settlement.expense_description
        });
        setPaymentModalOpen(true);
    };

    const DebtList = ({ groups, type }: { groups: GroupedDebt[], type: 'payable' | 'receivable' }) => {
        const [openStates, setOpenStates] = useState<Record<string, boolean>>({});


        const toggleOpen = (id: string) => {
            setOpenStates(prev => ({ ...prev, [id]: !prev[id] }));
        };

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
            <div className="grid gap-4">
                {groups.map((group) => {
                    const isOpen = openStates[group.personId] ?? false;
                    return (
                        <Card key={group.personId} className="overflow-hidden border shadow-sm">
                            <Collapsible open={isOpen} onOpenChange={() => toggleOpen(group.personId)}>
                                <div className="flex items-center justify-between p-4 bg-card hover:bg-muted/10 transition-colors">
                                    <CollapsibleTrigger asChild>
                                        <div className="flex items-center gap-4 flex-1 cursor-pointer">
                                            <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                                                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </Button>
                                            <div className={`p-2 rounded-full ${type === 'payable' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                {type === 'payable' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                    {group.person.name}
                                                    <span className="text-sm font-normal text-muted-foreground">
                                                        ({group.settlements.length} items)
                                                    </span>
                                                </h3>
                                            </div>
                                        </div>
                                    </CollapsibleTrigger>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right mr-2">
                                            <p className={`text-xl font-bold ${type === 'payable' ? 'text-red-600' : 'text-green-600'}`}>
                                                PHP {group.totalAmount.toFixed(2)}
                                            </p>
                                        </div>
                                        {type === 'payable' ? (
                                            // Pay All - Open BatchPaymentModal
                                            <Button
                                                size="sm"
                                                variant="default"
                                                disabled={processingId !== null}
                                                onClick={() => {
                                                    setBatchPaymentData({
                                                        settlements: group.settlements.map(s => ({
                                                            id: s.id,
                                                            amount: s.amount,
                                                            expense_description: s.expense_description
                                                        })),
                                                        recipientName: group.person.name,
                                                        recipientGcash: group.person.gcash_number,
                                                        totalAmount: group.totalAmount
                                                    });
                                                    setBatchPaymentModalOpen(true);
                                                }}
                                            >
                                                Pay All
                                            </Button>
                                        ) : (
                                            // Collect All - Keep simple dialog for creditors
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={processingId !== null}
                                                        className="border-green-600 text-green-600 hover:bg-green-50"
                                                    >
                                                        Collect All
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Confirm Batch Receipt</DialogTitle>
                                                        <DialogDescription>
                                                            Are you sure you want to mark all {group.settlements.length} debts from {group.person.name} as received?
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4">
                                                        <Alert>
                                                            <DollarSign className="h-4 w-4" />
                                                            <AlertTitle>Total Amount</AlertTitle>
                                                            <AlertDescription className="font-bold text-lg mt-1">
                                                                PHP {group.totalAmount.toFixed(2)}
                                                            </AlertDescription>
                                                        </Alert>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => { }}>Cancel</Button>
                                                        <Button
                                                            onClick={() => handleBatchAction(group.settlements.map(s => s.id), 'collect')}
                                                            disabled={processingId !== null}
                                                            variant="outline"
                                                            className="border-green-600 text-green-600 hover:bg-green-50"
                                                        >
                                                            {processingId === 'batch' ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                "Confirm"
                                                            )}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                </div>

                                <CollapsibleContent>
                                    <div className="border-t bg-muted/5 px-4">
                                        <ul className="divide-y divide-border">
                                            {group.settlements.map((settlement) => (
                                                <li key={settlement.id} className="py-3 px-2 hover:bg-muted/10 transition-colors">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-medium truncate text-sm">{settlement.expense_description}</p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                                {settlement.is_monthly && settlement.deadline ? (
                                                                    <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                                                                        <Clock className="w-3 h-3" />
                                                                        Due: {new Date(settlement.deadline).toLocaleDateString(undefined, {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </span>
                                                                ) : (
                                                                    <span>{new Date(settlement.expense_date).toLocaleDateString()}</span>
                                                                )}
                                                                <span>•</span>
                                                                <span>Original: PHP {settlement.expense_amount.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-right">
                                                                <span className="font-semibold text-sm whitespace-nowrap block">
                                                                    PHP {settlement.amount.toFixed(2)}
                                                                </span>
                                                                {settlement.status === 'unconfirmed' && (
                                                                    <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">
                                                                        Unconfirmed
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {type === 'payable' ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant={settlement.status === 'unconfirmed' ? "outline" : "default"}
                                                                    disabled={settlement.status === 'unconfirmed'}
                                                                    onClick={() => openPaymentModal(settlement)}
                                                                    className="h-7 text-xs px-2"
                                                                >
                                                                    {settlement.status === 'unconfirmed' ? "Pending" : "Pay"}
                                                                </Button>
                                                            ) : (
                                                                <>
                                                                    {settlement.status === 'unconfirmed' ? (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-7 text-xs px-2"
                                                                            onClick={() => {
                                                                                setSettlementToVerify(settlement);
                                                                                setVerificationModalOpen(true);
                                                                            }}
                                                                            disabled={processingId !== null}
                                                                        >
                                                                            <Eye className="h-3 w-3 mr-1" /> Review
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleAction(settlement.id, 'collect')} // Keep legacy 'mark as received' just in case, or disable? Let's keep for manual overrides.
                                                                            disabled={processingId !== null}
                                                                            className="h-7 text-xs px-2"
                                                                        >
                                                                            Collect
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </Card>
                    );
                })}
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

            <PaymentSummary payables={payables} receivables={receivables} />

            {/* GCash Number Settings */}
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 dark:border-blue-800">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-500 text-white">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">GCash Number</CardTitle>
                                <CardDescription className="text-sm">
                                    Set your GCash number so others can pay you via GCash
                                </CardDescription>
                            </div>
                        </div>
                        {!isEditingGcash && myGcashNumber && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditingGcash(true)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                            >
                                <Edit2 className="w-4 h-4 mr-1" /> Edit
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isEditingGcash || !myGcashNumber ? (
                        <div className="flex gap-2 items-center">
                            <Input
                                placeholder="09xxxxxxxxx"
                                value={gcashInput}
                                onChange={(e) => setGcashInput(e.target.value)}
                                className="max-w-xs bg-white dark:bg-gray-900"
                            />
                            <Button
                                onClick={handleSaveGcash}
                                disabled={savingGcash || !gcashInput}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {savingGcash ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-1" /> Save
                                    </>
                                )}
                            </Button>
                            {isEditingGcash && myGcashNumber && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold tracking-wider text-blue-600 dark:text-blue-400">
                                {myGcashNumber}
                            </p>
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                        {myGcashNumber
                            ? "Your GCash number is saved. Others will see this when they pay you via GCash."
                            : "Enter your 11-digit GCash number starting with 09."
                        }
                    </p>
                </CardContent>
            </Card>

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
            </Tabs >

            {/* Modal for Payments */}
            {
                selectedSettlement && (
                    <PaymentModal
                        open={paymentModalOpen}
                        onOpenChange={setPaymentModalOpen}
                        settlement={selectedSettlement}
                        onSuccess={fetchData}
                    />
                )
            }

            {/* Verification Modal */}
            <Dialog open={verificationModalOpen} onOpenChange={setVerificationModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Review Payment
                        </DialogTitle>
                        <DialogDescription>
                            Review the payment proof before verifying or rejecting this payment.
                        </DialogDescription>
                    </DialogHeader>

                    {settlementToVerify && (
                        <div className="space-y-4">
                            {/* Payment Details */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">From</span>
                                    <span className="font-medium">{settlementToVerify.person.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">For</span>
                                    <span className="font-medium text-sm truncate max-w-[200px]">{settlementToVerify.expense_description}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Payment Method</span>
                                    <span className="font-medium">{settlementToVerify.payment_method || 'Cash'}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <span className="text-sm font-medium">Amount</span>
                                    <span className="text-xl font-bold text-primary">PHP {settlementToVerify.amount.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Proof of Payment */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Image className="h-4 w-4" />
                                    Proof of Payment
                                </h4>
                                {settlementToVerify.proof_url ? (
                                    <div className="relative rounded-lg overflow-hidden border bg-muted/30">
                                        <a href={settlementToVerify.proof_url} target="_blank" rel="noreferrer">
                                            <img
                                                src={settlementToVerify.proof_url}
                                                alt="Proof of payment"
                                                className="w-full max-h-[400px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                            />
                                        </a>
                                        <div className="absolute bottom-2 right-2">
                                            <Button variant="secondary" size="sm" asChild>
                                                <a href={settlementToVerify.proof_url} target="_blank" rel="noreferrer">
                                                    <ArrowUpRight className="h-3 w-3 mr-1" /> Open Full Size
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed text-muted-foreground">
                                        <Image className="h-10 w-10 mb-2 opacity-50" />
                                        <p className="text-sm">No proof of payment provided</p>
                                        <p className="text-xs">Payment was made with {settlementToVerify.payment_method || 'Cash'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                        <Button
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={async () => {
                                if (settlementToVerify) {
                                    setProcessingId(settlementToVerify.id);
                                    const result = await rejectSettlement(settlementToVerify.id);
                                    if (result.success) {
                                        toast.success("Payment rejected");
                                        setVerificationModalOpen(false);
                                        setSettlementToVerify(null);
                                        await fetchData();
                                    } else {
                                        toast.error(result.error || "Failed to reject");
                                    }
                                    setProcessingId(null);
                                }
                            }}
                            disabled={processingId !== null}
                        >
                            {processingId === settlementToVerify?.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Reject
                        </Button>
                        <Button
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={async () => {
                                if (settlementToVerify) {
                                    setProcessingId(settlementToVerify.id);
                                    const result = await verifySettlement(settlementToVerify.id);
                                    if (result.success) {
                                        toast.success("Payment verified!");
                                        setVerificationModalOpen(false);
                                        setSettlementToVerify(null);
                                        await fetchData();
                                    } else {
                                        toast.error(result.error || "Failed to verify");
                                    }
                                    setProcessingId(null);
                                }
                            }}
                            disabled={processingId !== null}
                        >
                            {processingId === settlementToVerify?.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4 mr-2" />
                            )}
                            {settlementToVerify?.payment_method === 'GCASH' ? 'Accept' : 'Acknowledge'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Batch Payment Modal */}
            {batchPaymentData && (
                <BatchPaymentModal
                    open={batchPaymentModalOpen}
                    onOpenChange={setBatchPaymentModalOpen}
                    settlements={batchPaymentData.settlements}
                    recipientName={batchPaymentData.recipientName}
                    recipientGcash={batchPaymentData.recipientGcash}
                    totalAmount={batchPaymentData.totalAmount}
                    onSuccess={() => {
                        fetchData();
                        setBatchPaymentData(null);
                    }}
                />
            )}
        </div >
    );
}
