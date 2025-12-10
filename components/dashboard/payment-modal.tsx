"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase-client";
import { toast } from "sonner";
import { getGcashNumber, updateGcashNumber } from "@/app/actions/auth";
import { markSettlementAsPaid } from "@/app/actions/expenses";

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    settlement: {
        id: string;
        amount: number;
        owed_to: {
            name: string;
            gcash_number?: string | null;
        };
        expense_description: string;
    };
    onSuccess: () => void;
}

export function PaymentModal({ open, onOpenChange, settlement, onSuccess }: PaymentModalProps) {
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };

    const handleCashPayment = async () => {
        setLoading(true);
        try {
            // Cash payment requires no proof, status -> UNCONFIRMED
            const result = await markSettlementAsPaid(settlement.id, "CASH");
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Marked as paid! Waiting for verification.");
                onSuccess();
                onOpenChange(false);
            }
        } catch (error) {
            toast.error("Failed to submit payment");
        } finally {
            setLoading(false);
        }
    };

    const handleGcashPayment = async () => {
        if (!proofFile) {
            toast.error("Please upload a proof of payment");
            return;
        }

        if (!myGcash) { // Should be enforced? Maybe just enforce registering it once.
            // If user entered a number in the input, save it first
            // But let's assume the UI handles enforcing saving if it's empty
        }

        // 1. Save GCash number if it was empty and user entered one (handled by a separate 'Save' button or implicitly? Let's do implicit if new)
        // Actually, let's make them save it first if missing so we don't mix concerns too much.

        setUploading(true);
        try {
            // 2. Upload Proof
            const supabase = createSupabaseClient();
            const fileExt = proofFile.name.split('.').pop();
            const fileName = `${settlement.id}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, proofFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('receipts')
                .getPublicUrl(filePath);

            // 3. Mark as Paid with GCash + Proof
            const result = await markSettlementAsPaid(settlement.id, "GCASH", publicUrl);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Payment submitted! Waiting for verification.");
                onSuccess();
                onOpenChange(false);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload proof or submit payment");
        } finally {
            setUploading(false);
        }
    };

    const handleSaveGcash = async () => {
        setLoading(true);
        try {
            const result = await updateGcashNumber(myGcash);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("GCash number saved!");
            }
        } catch (error) {
            toast.error("Failed to save GCash number");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Make Payment</DialogTitle>
                    <DialogDescription>
                        Paying <span className="font-semibold text-primary">PHP {settlement.amount.toFixed(2)}</span> to {settlement.owed_to.name}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="cash">Cash</TabsTrigger>
                        <TabsTrigger value="gcash">GCash</TabsTrigger>
                    </TabsList>

                    <TabsContent value="cash" className="space-y-4 py-4">
                        <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground text-center">
                            <p>Hand over the cash to <strong>{settlement.owed_to.name}</strong>.</p>
                            <p className="mt-2">Click below to mark this as paid. The recipient will need to verify receiving it.</p>
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleCashPayment}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Mark as Paid via Cash
                        </Button>
                    </TabsContent>

                    <TabsContent value="gcash" className="space-y-4 py-4">
                        {fetchingGcash ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
                        ) : (
                            <>
                                {/* Step 1: Recipient Info */}
                                <div className="space-y-2">
                                    <Label>Send to GCash</Label>
                                    <div className="p-3 border rounded-md bg-muted/20">
                                        <p className="text-sm font-medium">{settlement.owed_to.name}</p>
                                        <p className="text-xl font-bold tracking-wider text-primary">
                                            {settlement.owed_to.gcash_number || "No GCash Number Linked"}
                                        </p>
                                        {!settlement.owed_to.gcash_number && (
                                            <p className="text-xs text-red-500 mt-1">Recipient hasn't set their GCash number yet. Ask them for it.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2: My Info */}
                                <div className="space-y-2">
                                    <Label>Your GCash Number</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="09xxxxxxxxx"
                                            value={myGcash}
                                            onChange={(e) => setMyGcash(e.target.value)}
                                        />
                                        <Button variant="outline" size="sm" onClick={handleSaveGcash} disabled={loading}>Save</Button>
                                    </div>
                                </div>

                                {/* Step 3: Proof */}
                                <div className="space-y-2">
                                    <Label>Proof of Payment</Label>
                                    <div className="grid w-full max-w-sm items-center gap-1.5">
                                        <Input id="proof" type="file" accept="image/*" onChange={handleFileChange} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Upload a screenshot of the GCash receipt.</p>
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
