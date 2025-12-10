-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "deadline_day" INTEGER,
ADD COLUMN     "is_monthly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "month_number" INTEGER,
ADD COLUMN     "parent_expense_id" TEXT,
ADD COLUMN     "total_months" INTEGER;

-- CreateIndex
CREATE INDEX "expenses_parent_expense_id_idx" ON "expenses"("parent_expense_id");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_parent_expense_id_fkey" FOREIGN KEY ("parent_expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
