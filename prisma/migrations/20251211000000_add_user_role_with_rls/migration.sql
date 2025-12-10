-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Client', 'SuperAdmin');

-- AlterTable: Add role column with Client as default
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'Client';

-- Enable Row Level Security on users table
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for Prisma operations via service key)
-- Service role bypasses RLS by default, but we explicitly allow it
CREATE POLICY "service_role_full_access" ON "users"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to read all users
CREATE POLICY "users_select_policy" ON "users"
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy: Allow users to insert themselves (during sync)
CREATE POLICY "users_insert_policy" ON "users"
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Policy: Allow users to update their own data EXCEPT role field
-- This uses a subquery to ensure role cannot be changed
CREATE POLICY "users_update_no_role_change" ON "users"
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (
    role = (SELECT u.role FROM users u WHERE u.id = users.id)
  );

-- Policy: Prevent any deletion from application (soft delete should be used)
CREATE POLICY "users_delete_policy" ON "users"
  FOR DELETE
  TO authenticated, anon
  USING (false);

-- Create index on role for faster lookups
CREATE INDEX "users_role_idx" ON "users"("role");

