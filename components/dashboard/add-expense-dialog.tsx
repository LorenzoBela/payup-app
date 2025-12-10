"use client";

import { useState, useMemo } from "react";
import { Plus, Calendar, Calculator, Info } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createExpense, createMonthlyExpense } from "@/app/actions/expenses";

interface AddExpenseDialogProps {
  teamId: string;
  onExpenseAdded?: () => void;
}

export function AddExpenseDialog({ teamId, onExpenseAdded }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMonthlyMode, setIsMonthlyMode] = useState(false);

  // Regular expense form
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
  });

  // Monthly expense form
  const [monthlyData, setMonthlyData] = useState({
    description: "",
    totalAmount: "",
    numberOfMonths: "",
    deadlineDay: "",
    category: "",
  });

  // Calculate breakdown for monthly mode
  const monthlyBreakdown = useMemo(() => {
    const total = parseFloat(monthlyData.totalAmount) || 0;
    const months = parseInt(monthlyData.numberOfMonths) || 1;

    if (total <= 0 || months <= 0) return null;

    // Round UP for no decimals
    const monthlyAmount = Math.ceil(total / months);

    return {
      monthlyAmount,
      total,
      months,
    };
  }, [monthlyData.totalAmount, monthlyData.numberOfMonths]);

  const resetForm = () => {
    setFormData({ description: "", amount: "", category: "" });
    setMonthlyData({
      description: "",
      totalAmount: "",
      numberOfMonths: "",
      deadlineDay: "",
      category: ""
    });
    setIsMonthlyMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isMonthlyMode) {
        // Validate monthly fields
        const totalAmount = parseFloat(monthlyData.totalAmount);
        const numberOfMonths = parseInt(monthlyData.numberOfMonths);
        const deadlineDay = parseInt(monthlyData.deadlineDay);

        if (!monthlyData.description.trim()) {
          toast.error("Please enter a description");
          setIsSubmitting(false);
          return;
        }
        if (isNaN(totalAmount) || totalAmount <= 0) {
          toast.error("Please enter a valid total amount");
          setIsSubmitting(false);
          return;
        }
        if (isNaN(numberOfMonths) || numberOfMonths < 1 || numberOfMonths > 24) {
          toast.error("Number of months must be between 1 and 24");
          setIsSubmitting(false);
          return;
        }
        if (isNaN(deadlineDay) || deadlineDay < 1 || deadlineDay > 31) {
          toast.error("Deadline day must be between 1 and 31");
          setIsSubmitting(false);
          return;
        }

        const result = await createMonthlyExpense({
          description: monthlyData.description,
          totalAmount,
          numberOfMonths,
          deadlineDay,
          category: monthlyData.category.trim() || "Monthly",
          teamId,
        });

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(
            `Monthly expense created! ₱${result.breakdown?.perParticipantAmount}/person/month`,
            { duration: 5000 }
          );
          resetForm();
          setOpen(false);
          onExpenseAdded?.();
        }
      } else {
        // Regular expense
        const result = await createExpense({
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category.trim() || "General",
          teamId,
        });

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Expense added successfully!");
          resetForm();
          setOpen(false);
          onExpenseAdded?.();
        }
      }
    } catch {
      toast.error("Failed to add expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              {isMonthlyMode
                ? "Create a payment plan split across multiple months."
                : "Record a one-time group expense split among all members."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Monthly Mode Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <Label htmlFor="monthly-mode" className="font-medium cursor-pointer">
                  Monthly Payment Mode
                </Label>
              </div>
              <Switch
                id="monthly-mode"
                checked={isMonthlyMode}
                onCheckedChange={setIsMonthlyMode}
              />
            </div>

            {isMonthlyMode ? (
              /* Monthly Mode Form */
              <>
                <div className="grid gap-2">
                  <Label htmlFor="monthly-description">Description</Label>
                  <Input
                    id="monthly-description"
                    placeholder="e.g., Project materials, Monthly dues"
                    value={monthlyData.description}
                    onChange={(e) =>
                      setMonthlyData({ ...monthlyData, description: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="total-amount">Total Amount (₱)</Label>
                    <Input
                      id="total-amount"
                      type="number"
                      step="1"
                      min="1"
                      placeholder="1000"
                      value={monthlyData.totalAmount}
                      onChange={(e) =>
                        setMonthlyData({ ...monthlyData, totalAmount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="num-months">Number of Months</Label>
                    <Input
                      id="num-months"
                      type="number"
                      min="1"
                      max="24"
                      placeholder="3"
                      value={monthlyData.numberOfMonths}
                      onChange={(e) =>
                        setMonthlyData({ ...monthlyData, numberOfMonths: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="deadline-day">Deadline Day (1-31)</Label>
                    <Input
                      id="deadline-day"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="5"
                      value={monthlyData.deadlineDay}
                      onChange={(e) =>
                        setMonthlyData({ ...monthlyData, deadlineDay: e.target.value })
                      }
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      e.g., &quot;5&quot; means every 5th of each month
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="monthly-category">Category</Label>
                    <Input
                      id="monthly-category"
                      placeholder="e.g., Monthly"
                      value={monthlyData.category}
                      onChange={(e) =>
                        setMonthlyData({ ...monthlyData, category: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Breakdown Preview */}
                {monthlyBreakdown && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">Payment Breakdown</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">₱{monthlyBreakdown.total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Months:</span>
                        <span className="font-medium">{monthlyBreakdown.months}</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between text-primary font-semibold">
                          <span>Per Month:</span>
                          <span>₱{monthlyBreakdown.monthlyAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 mt-3 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>
                        Per-person amount will be calculated after splitting among all team members (rounded up).
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Regular Mode Form */
              <>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Team lunch, Printing costs"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (₱)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Food, Transport, Supplies"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank for &quot;General&quot;
                  </p>
                </div>
              </>
            )}
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
              {isSubmitting
                ? "Adding..."
                : isMonthlyMode
                  ? "Create Monthly Plan"
                  : "Add Expense"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
