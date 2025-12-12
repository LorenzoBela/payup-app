"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload, CheckCircle2, DollarSign } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase-client";
import { toast } from "sonner";
import { getGcashNumber } from "@/app/actions/auth";
import { markSettlementsAsPaidWithMethod } from "@/app/actions/expenses";

interface Settlement {
    id: string;
    amount: number;
    expense_description: string;
}

interface BatchPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    settlements: Settlement[];
    recipientName: string;
    recipientGcash?: string | null;
    totalAmount: number;
    onSuccess: () => void;
}

export function BatchPaymentModal({
    open,
    onOpenChange,
    settlements,
    recipientName,
    recipientGcash,
    totalAmount,
    onSuccess
}: BatchPaymentModalProps) {
    const [activeTab, setActiveTab] = useState("cash");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [myGcash, setMyGcash] = useState<string>("");
    const [fetchingGcash, setFetchingGcash] = useState(false);

    // Fetch user's GCash number when dialog opens
    useEffect(() => {
        if (open && activeTab === 'gcash') {
            setFetchingGcash(true);
            getGcashNumber()
                .then(res => {
                    if (res.number) setMyGcash(res.number);
                })
                .finally(() => setFetchingGcash(false));
        }
    }, [open, activeTab]);

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setProofFile(null);
            setActiveTab("cash");
        }
    }, [open]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };

    const handleCashPayment = async () => {
        setLoading(true);
        try {
            const settlementIds = settlements.map(s => s.id);
            const result = await markSettlementsAsPaidWithMethod(settlementIds, "CASH");
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`All ${settlements.length} payments marked as paid via Cash! Waiting for verification.`);
                onSuccess();
                onOpenChange(false);
            }
        } catch (error) {
            toast.error("Failed to submit payments");
        } finally {
            setLoading(false);
        }
    };

    const handleGcashPayment = async () => {
        if (!proofFile) {
            toast.error("Please upload a proof of payment");
            return;
        }

        setUploading(true);
        try {
            // Upload Proof
            const supabase = createSupabaseClient();
            const fileExt = proofFile.name.split('.').pop();
            const fileName = `batch_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, proofFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('receipts')
                .getPublicUrl(filePath);

            // Mark all as Paid with GCash + Proof
            const settlementIds = settlements.map(s => s.id);
            const result = await markSettlementsAsPaidWithMethod(settlementIds, "GCASH", publicUrl);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`All ${settlements.length} payments submitted via GCash! Waiting for verification.`);
                onSuccess();
                onOpenChange(false);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload proof or submit payments");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Pay All to {recipientName}</DialogTitle>
                    <DialogDescription>
                        You are paying <span className="font-semibold text-primary">{settlements.length} items</span> totaling <span className="font-semibold text-primary">PHP {totalAmount.toFixed(2)}</span>
                    </DialogDescription>
                </DialogHeader>

                {/* Summary */}
                <Alert>
                    <DollarSign className="h-4 w-4" />
                    <AlertTitle>Total Amount</AlertTitle>
                    <AlertDescription className="font-bold text-xl mt-1">
                        PHP {totalAmount.toFixed(2)}
                    </AlertDescription>
                </Alert>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="cash">Cash</TabsTrigger>
                        <TabsTrigger value="gcash">GCash</TabsTrigger>
                    </TabsList>

                    <TabsContent value="cash" className="space-y-4 py-4">
                        <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground text-center">
                            <p>Hand over <strong>PHP {totalAmount.toFixed(2)}</strong> in cash to <strong>{recipientName}</strong>.</p>
                            <p className="mt-2">Click below to mark all payments as paid. The recipient will need to verify receiving them.</p>
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleCashPayment}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Mark All as Paid via Cash
                        </Button>
                    </TabsContent>

                    <TabsContent value="gcash" className="space-y-4 py-4">
                        {fetchingGcash ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
                        ) : (
                            <>
                                {/* Recipient GCash Info */}
                                <div className="space-y-2">
                                    <Label>Send to GCash</Label>
                                    <div className="p-3 border rounded-md bg-muted/20">
                                        <p className="text-sm font-medium">{recipientName}</p>
                                        <p className="text-xl font-bold tracking-wider text-primary">
                                            {recipientGcash || "No GCash Number Linked"}
                                        </p>
                                        {!recipientGcash && (
                                            <p className="text-xs text-red-500 mt-1">Recipient hasn't set their GCash number yet. Ask them for it.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Amount to Send */}
                                <div className="space-y-2">
                                    <Label>Amount to Send</Label>
                                    <div className="p-3 border rounded-md bg-green-50 dark:bg-green-950/30">
                                        <p className="text-2xl font-bold text-green-600">PHP {totalAmount.toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Proof Upload */}
                                <div className="space-y-2">
                                    <Label>Proof of Payment</Label>
                                    <div className="grid w-full items-center gap-1.5">
                                        <Input id="proof" type="file" accept="image/*" onChange={handleFileChange} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Upload a screenshot of the GCash receipt showing the full amount.</p>
                                </div>

                                <Button
                                    className="w-full mt-4"
                                    onClick={handleGcashPayment}
                                    disabled={uploading || loading || !proofFile}
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                    Submit Payment Proof
                                </Button>
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
