import { z } from "zod";

export const expenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required").max(500, "Description is too long"),
  paid_by: z.string().min(1, "User ID is required"),
  category: z.enum(["food", "printing", "supplies", "other"]),
  currency: z.string().default("USD"),
  receipt_url: z.string().url("Invalid URL").optional().nullable(),
});

export const settlementSchema = z.object({
  expense_id: z.string().uuid("Invalid expense ID"),
  owed_by: z.string().min(1, "User ID is required"),
  amount_owed: z.number().positive("Amount must be positive"),
  status: z.enum(["pending", "paid"]).default("pending"),
});

export const updateExpenseSchema = expenseSchema.partial();
export const updateSettlementSchema = settlementSchema.partial();

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type SettlementInput = z.infer<typeof settlementSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type UpdateSettlementInput = z.infer<typeof updateSettlementSchema>;

