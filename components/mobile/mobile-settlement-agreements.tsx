"use client";

import { useState, useEffect } from "react";
import { useTeam } from "@/components/dashboard/team-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Handshake, ArrowLeftRight, Check, X, Clock, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
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

interface MobileSettlementAgreementsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MobileSettlementAgreements({ open, onOpenChange }: MobileSettlementAgreementsProps) {
    const { selectedTeam } = useTeam();
    const [mutualDebts, setMutualDebts] = useState<MutualDebt[]>([]);
    const [pendingAgreements, setPendingAgreements] = useState<SettlementAgreement[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);

    // Detail sheet state
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState<MutualDebt | null>(null);
    const [selectedAgreement, setSelectedAgreement] = useState<SettlementAgreement | null>(null);
    const [mode, setMode] = useState<'propose' | 'respond'>('propose');

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
        if (open) {
            fetchData();
        }
    }, [open, selectedTeam]);

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
                toast.success(`Proposal sent to ${selectedDebt.userName}!`);
                setDetailOpen(false);
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
                toast.success(accept ? "Settlement accepted!" : "Settlement rejected.");
                setDetailOpen(false);
                setSelectedAgreement(null);
                await fetchData();
            }
        } catch (error) {
            toast.error("Failed to respond");
        } finally {
            setProcessing(null);
        }
    };

    const openProposeSheet = (debt: MutualDebt) => {
        setSelectedDebt(debt);
        setSelectedAgreement(null);
        setMode('propose');
        setDetailOpen(true);
    };

    const openResponseSheet = (agreement: SettlementAgreement) => {
        setSelectedAgreement(agreement);
        setSelectedDebt(null);
        setMode('respond');
        setDetailOpen(true);
    };

    const getNetResultText = (iOwe: number, theyOwe: number, otherName: string) => {
        const net = theyOwe - iOwe;
        if (net > 0) {
            return `${otherName} will owe you ₱${net.toFixed(0)}`;
        } else if (net < 0) {
            return `You will owe ${otherName} ₱${Math.abs(net).toFixed(0)}`;
        } else {
            return "Both debts cancelled!";
        }
    };

    const incomingCount = pendingAgreements.filter(a => !a.isProposer).length;

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="bottom" className="rounded-t-3xl p-0 max-h-[85vh]">
                    <div className="flex flex-col h-full max-h-[85vh]">
                        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
                            <SheetTitle className="text-xl flex items-center gap-2">
                                <Handshake className="w-5 h-5 text-purple-500" />
                                Settlement Agreements
                                {incomingCount > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                        {incomingCount}
                                    </Badge>
                                )}
                            </SheetTitle>
                            <p className="text-sm text-muted-foreground">Cancel out mutual debts</p>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                </div>
                            ) : mutualDebts.length === 0 && pendingAgreements.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <Handshake className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2">No Mutual Debts</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs">
                                        When you and a team member owe each other money, you can settle here
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4 pb-4">
                                    {/* Incoming Proposals */}
                                    {pendingAgreements.filter(a => !a.isProposer).length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                Needs Your Response
                                            </h4>
                                            {pendingAgreements
                                                .filter(a => !a.isProposer)
                                                .map((agreement) => (
                                                    <Card
                                                        key={agreement.id}
                                                        className="p-4 border-purple-200 bg-purple-50/50 dark:bg-purple-950/20"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium">{agreement.proposerName}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    wants to settle ₱{Math.min(agreement.proposerOwes, agreement.responderOwes).toFixed(0)}
                                                                </p>
                                                            </div>
                                                            <Button size="sm" onClick={() => openResponseSheet(agreement)}>
                                                                Review
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                ))}
                                        </div>
                                    )}

                                    {/* Your Pending Proposals */}
                                    {pendingAgreements.filter(a => a.isProposer).length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Your Proposals
                                            </h4>
                                            {pendingAgreements
                                                .filter(a => a.isProposer)
                                                .map((agreement) => (
                                                    <Card key={agreement.id} className="p-4 bg-muted/30">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium">To {agreement.responderName}</p>
                                                                <p className="text-xs text-muted-foreground">Waiting for response</p>
                                                            </div>
                                                            <Badge variant="outline">Pending</Badge>
                                                        </div>
                                                    </Card>
                                                ))}
                                        </div>
                                    )}

                                    {/* Settlement Opportunities */}
                                    {mutualDebts.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                <Sparkles className="w-3 h-3" />
                                                Opportunities
                                            </h4>
                                            {mutualDebts.map((debt) => (
                                                <Card key={debt.userId} className="p-4">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <ArrowLeftRight className="w-4 h-4 text-purple-500" />
                                                                <span className="font-medium">{debt.userName}</span>
                                                            </div>
                                                            <span className="text-xs text-green-600 font-medium">
                                                                Save ₱{Math.min(debt.iOwe, debt.theyOwe).toFixed(0)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-muted-foreground">
                                                                You owe ₱{debt.iOwe.toFixed(0)} • They owe ₱{debt.theyOwe.toFixed(0)}
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-purple-300 text-purple-700"
                                                                onClick={() => openProposeSheet(debt)}
                                                            >
                                                                Propose
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Detail Sheet for Propose/Respond */}
            <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
                <SheetContent side="bottom" className="rounded-t-3xl p-0 max-h-[70vh]">
                    <div className="flex flex-col h-full">
                        <SheetHeader className="px-6 pt-6 pb-4 border-b">
                            <SheetTitle className="flex items-center gap-2">
                                <Handshake className="w-5 h-5 text-purple-500" />
                                {mode === 'propose' ? 'Propose Settlement' : 'Settlement Proposal'}
                            </SheetTitle>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {mode === 'propose' && selectedDebt && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-center">
                                            <p className="text-xs text-muted-foreground">You owe</p>
                                            <p className="text-xl font-bold text-red-600">₱{selectedDebt.iOwe.toFixed(0)}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-center">
                                            <p className="text-xs text-muted-foreground">They owe</p>
                                            <p className="text-xl font-bold text-green-600">₱{selectedDebt.theyOwe.toFixed(0)}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-center">
                                        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                            {getNetResultText(selectedDebt.iOwe, selectedDebt.theyOwe, selectedDebt.userName)}
                                        </p>
                                    </div>

                                    <p className="text-xs text-muted-foreground text-center">
                                        {selectedDebt.userName} needs to accept for this to take effect
                                    </p>
                                </div>
                            )}

                            {mode === 'respond' && selectedAgreement && (
                                <div className="space-y-4">
                                    <p className="text-sm text-center text-muted-foreground">
                                        From <span className="font-medium text-foreground">{selectedAgreement.proposerName}</span>
                                    </p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-center">
                                            <p className="text-xs text-muted-foreground">You owe them</p>
                                            <p className="text-xl font-bold text-red-600">₱{selectedAgreement.responderOwes.toFixed(0)}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-center">
                                            <p className="text-xs text-muted-foreground">They owe you</p>
                                            <p className="text-xl font-bold text-green-600">₱{selectedAgreement.proposerOwes.toFixed(0)}</p>
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
                        </div>

                        <SheetFooter className="px-6 py-4 border-t">
                            {mode === 'propose' ? (
                                <div className="flex gap-2 w-full">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setDetailOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                                        onClick={handlePropose}
                                        disabled={processing !== null}
                                    >
                                        {processing ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Handshake className="w-4 h-4 mr-2" />
                                                Send Proposal
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-2 w-full">
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-red-300 text-red-700"
                                        onClick={() => handleRespond(false)}
                                        disabled={processing !== null}
                                    >
                                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                            <>
                                                <X className="w-4 h-4 mr-2" />
                                                Reject
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        onClick={() => handleRespond(true)}
                                        disabled={processing !== null}
                                    >
                                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                            <>
                                                <Check className="w-4 h-4 mr-2" />
                                                Accept
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </SheetFooter>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
