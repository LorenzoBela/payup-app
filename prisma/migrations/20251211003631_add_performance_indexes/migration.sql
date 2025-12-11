-- DropIndex
DROP INDEX "expenses_paid_by_idx";

-- DropIndex
DROP INDEX "settlements_owed_by_idx";

-- DropIndex
DROP INDEX "settlements_status_idx";

-- DropIndex
DROP INDEX "users_role_idx";

-- CreateIndex
CREATE INDEX "activity_logs_user_id_created_at_idx" ON "activity_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "expenses_team_id_deleted_at_created_at_idx" ON "expenses"("team_id", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "expenses_paid_by_deleted_at_idx" ON "expenses"("paid_by", "deleted_at");

-- CreateIndex
CREATE INDEX "settlements_expense_id_status_deleted_at_idx" ON "settlements"("expense_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "settlements_owed_by_status_deleted_at_idx" ON "settlements"("owed_by", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "settlements_status_deleted_at_idx" ON "settlements"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_deleted_at_idx" ON "users"("role", "deleted_at");
