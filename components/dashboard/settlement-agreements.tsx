"use client";

import { useState, useEffect } from "react";
import { useTeam } from "@/components/dashboard/team-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Handshake, ArrowRight, Check, X, Clock, ArrowLeftRight, Sparkles } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
    detectMutualDebts,
    proposeSettlementAgreement,
    respondToSettlementAgreement,
    getSettlementAgreements,
} from "@/app/actions/expenses";

interface MutualDebt {
    userId: string;
    userName: string;
    userEmail: string;
    iOwe: number;
    theyOwe: number;
    netAmount: number;
    mySettlementIds: string[];
    theirSettlementIds: string[];
}

interface SettlementAgreement {
    id: string;
    proposerId: string;
    proposerName: string;
    responderId: string;
    responderName: string;
    proposerOwes: number;
    responderOwes: number;
    netAmount: number;
    status: string;
    proposedAt: Date;
    respondedAt: Date | null;
    isProposer: boolean;
}

export function SettlementAgreements() {
    const { selectedTeam } = useTeam();
    const [mutualDebts, setMutualDebts] = useState<MutualDebt[]>([]);
    const [pendingAgreements, setPendingAgreements] = useState<SettlementAgreement[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);

    // Proposal dialog state
    const [proposeDialogOpen, setProposeDialogOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState<MutualDebt | null>(null);

    // Response dialog state
    const [responseDialogOpen, setResponseDialogOpen] = useState(false);
    const [selectedAgreement, setSelectedAgreement] = useState<SettlementAgreement | null>(null);

    const fetchData = async () => {
        if (!selectedTeam) return;
        setLoading(true);
        try {
            const [debtsResult, agreementsResult] = await Promise.all([
                detectMutualDebts(selectedTeam.id),
                getSettlementAgreements(selectedTeam.id),
            ]);
            setMutualDebts(debtsResult.mutualDebts);
            setPendingAgreements(agreementsResult.pending);
        } catch (error) {
            console.error("Failed to fetch settlement data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedTeam]);

    const handlePropose = async () => {
        if (!selectedTeam || !selectedDebt) return;

        setProcessing(selectedDebt.userId);
        try {
            const result = await proposeSettlementAgreement({
                teamId: selectedTeam.id,
                responderId: selectedDebt.userId,
                proposerOwes: selectedDebt.iOwe,
                responderOwes: selectedDebt.theyOwe,
                settlementIds: [...selectedDebt.mySettlementIds, ...selectedDebt.theirSettlementIds],
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Settlement proposal sent to ${selectedDebt.userName}!`);
                setProposeDialogOpen(false);
                setSelectedDebt(null);
                await fetchData();
            }
        } catch (error) {
            toast.error("Failed to send proposal");
        } finally {
            setProcessing(null);
        }
    };

    const handleRespond = async (accept: boolean) => {
        if (!selectedAgreement) return;

        setProcessing(selectedAgreement.id);
        try {
            const result = await respondToSettlementAgreement(selectedAgreement.id, accept);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(accept ? "Settlement accepted! Debts cancelled." : "Settlement rejected.");
                setResponseDialogOpen(false);
                setSelectedAgreement(null);
                await fetchData();
            }
        } catch (error) {
            toast.error("Failed to respond to agreement");
        } finally {
            setProcessing(null);
        }
    };

    const openProposeDialog = (debt: MutualDebt) => {
        setSelectedDebt(debt);
        setProposeDialogOpen(true);
    };

    const openResponseDialog = (agreement: SettlementAgreement) => {
        setSelectedAgreement(agreement);
        setResponseDialogOpen(true);
    };

    // Calculate net result text
    const getNetResultText = (iOwe: number, theyOwe: number, otherName: string) => {
        const net = theyOwe - iOwe;
        if (net > 0) {
            return `After settlement, ${otherName} will owe you ₱${net.toFixed(2)}`;
        } else if (net < 0) {
            return `After settlement, you will owe ${otherName} ₱${Math.abs(net).toFixed(2)}`;
        } else {
            return "Both debts will be completely cancelled!";
        }
    };

    // No mutual debts and no pending agreements - don't show the section
    if (!loading && mutualDebts.length === 0 && pendingAgreements.length === 0) {
        return null;
    }

    return (
        <>
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 dark:border-purple-800">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-purple-500 text-white">
                            <Handshake className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                Settlement Agreements
                                {pendingAgreements.filter(a => !a.isProposer).length > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                        {pendingAgreements.filter(a => !a.isProposer).length} pending
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="text-sm">
                                Cancel out mutual debts with team members
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                        </div>
                    ) : (
                        <>
                            {/* Pending Agreements - Requiring Your Response */}
                            {pendingAgreements.filter(a => !a.isProposer).length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Awaiting Your Response
                                    </h4>
                                    {pendingAgreements
                                        .filter(a => !a.isProposer)
                                        .map((agreement) => (
                                            <div
                                                key={agreement.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="text-sm">
                                                        <span className="font-medium">{agreement.proposerName}</span>
                                                        <span className="text-muted-foreground"> wants to settle</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-purple-600">
                                                        ₱{Math.min(agreement.proposerOwes, agreement.responderOwes).toFixed(0)} saved
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => openResponseDialog(agreement)}
                                                    >
                                                        Review
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {/* Your Pending Proposals */}
                            {pendingAgreements.filter(a => a.isProposer).length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground">
                                        Your Pending Proposals
                                    </h4>
                                    {pendingAgreements
                                        .filter(a => a.isProposer)
                                        .map((agreement) => (
                                            <div
                                                key={agreement.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                                    <div className="text-sm">
                                                        <span className="text-muted-foreground">Waiting for </span>
                                                        <span className="font-medium">{agreement.responderName}</span>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    Pending
                                                </Badge>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {/* Mutual Debt Opportunities */}
                            {mutualDebts.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        Settlement Opportunities
                                    </h4>
                                    {mutualDebts.map((debt) => (
                                        <div
                                            key={debt.userId}
                                            className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900 border"
                                        >
                                            <div className="flex items-center gap-3">
                                                <ArrowLeftRight className="w-4 h-4 text-purple-500" />
                                                <div className="text-sm">
                                                    <div className="font-medium">{debt.userName}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        You owe ₱{debt.iOwe.toFixed(0)} • They owe ₱{debt.theyOwe.toFixed(0)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-green-600 font-medium">
                                                    Save ₱{Math.min(debt.iOwe, debt.theyOwe).toFixed(0)}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                                    onClick={() => openProposeDialog(debt)}
                                                    disabled={processing !== null}
                                                >
                                                    Propose
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Propose Settlement Dialog */}
            <Dialog open={proposeDialogOpen} onOpenChange={setProposeDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Handshake className="w-5 h-5 text-purple-500" />
                            Propose Settlement
                        </DialogTitle>
                        <DialogDescription>
                            Cancel out mutual debts with {selectedDebt?.userName}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDebt && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                                    <p className="text-xs text-muted-foreground mb-1">You owe</p>
                                    <p className="text-lg font-bold text-red-600">₱{selectedDebt.iOwe.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center justify-center">
                                    <ArrowLeftRight className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                                    <p className="text-xs text-muted-foreground mb-1">They owe</p>
                                    <p className="text-lg font-bold text-green-600">₱{selectedDebt.theyOwe.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-center">
                                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                    {getNetResultText(selectedDebt.iOwe, selectedDebt.theyOwe, selectedDebt.userName)}
                                </p>
                            </div>

                            <p className="text-xs text-muted-foreground text-center">
                                {selectedDebt.userName} will need to accept this proposal for it to take effect.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setProposeDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePropose}
                            disabled={processing !== null}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Handshake className="w-4 h-4 mr-2" />
                                    Send Proposal
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Response Dialog */}
            <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Handshake className="w-5 h-5 text-purple-500" />
                            Settlement Proposal
                        </DialogTitle>
                        <DialogDescription>
                            {selectedAgreement?.proposerName} wants to settle mutual debts
                        </DialogDescription>
                    </DialogHeader>

                    {selectedAgreement && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                                    <p className="text-xs text-muted-foreground mb-1">You owe them</p>
                                    <p className="text-lg font-bold text-red-600">
                                        ₱{selectedAgreement.responderOwes.toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center">
                                    <ArrowLeftRight className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                                    <p className="text-xs text-muted-foreground mb-1">They owe you</p>
                                    <p className="text-lg font-bold text-green-600">
                                        ₱{selectedAgreement.proposerOwes.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-center">
                                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                    {getNetResultText(
                                        selectedAgreement.responderOwes,
                                        selectedAgreement.proposerOwes,
                                        selectedAgreement.proposerName
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleRespond(false)}
                            disabled={processing !== null}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                            {processing === selectedAgreement?.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <X className="w-4 h-4 mr-2" />
                                    Reject
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => handleRespond(true)}
                            disabled={processing !== null}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {processing === selectedAgreement?.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Accept
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
