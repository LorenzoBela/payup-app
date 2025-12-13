"use client";

import { useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateExpense } from "@/app/actions/expenses";

interface EditExpenseDialogProps {
    expenseId: string;
    currentDescription: string;
    currentNote?: string | null;
    onExpenseUpdated?: () => void;
    triggerClassName?: string;
    iconOnly?: boolean;
}

export function EditExpenseDialog({
    expenseId,
    currentDescription,
    currentNote,
    onExpenseUpdated,
    triggerClassName,
    iconOnly = false,
}: EditExpenseDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [description, setDescription] = useState(currentDescription);
    const [note, setNote] = useState(currentNote || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim()) {
            toast.error("Description is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await updateExpense({
                expenseId,
                description: description.trim(),
                note: note.trim() || undefined,
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Expense updated successfully!");
                setOpen(false);
                onExpenseUpdated?.();
            }
        } catch {
            toast.error("Failed to update expense. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            // Reset to current values when opening
            setDescription(currentDescription);
            setNote(currentNote || "");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {iconOnly ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={triggerClassName}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        className={triggerClassName}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Expense</DialogTitle>
                        <DialogDescription>
                            Update the expense description and note.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Input
                                id="edit-description"
                                placeholder="e.g., Team lunch, Printing costs"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-note">Note (Optional)</Label>
                            <Textarea
                                id="edit-note"
                                placeholder="Add any additional notes or context..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={3}
                                className="resize-none"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
