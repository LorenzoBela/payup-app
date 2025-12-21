-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('pending', 'accepted', 'rejected', 'expired');

-- CreateTable
CREATE TABLE "settlement_agreements" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "proposer_id" TEXT NOT NULL,
    "responder_id" TEXT NOT NULL,
    "proposer_owes" DOUBLE PRECISION NOT NULL,
    "responder_owes" DOUBLE PRECISION NOT NULL,
    "net_amount" DOUBLE PRECISION NOT NULL,
    "settlement_ids" TEXT[],
    "status" "AgreementStatus" NOT NULL DEFAULT 'pending',
    "proposed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "settlement_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "settlement_agreements_team_id_status_idx" ON "settlement_agreements"("team_id", "status");

-- CreateIndex
CREATE INDEX "settlement_agreements_proposer_id_status_idx" ON "settlement_agreements"("proposer_id", "status");

-- CreateIndex
CREATE INDEX "settlement_agreements_responder_id_status_idx" ON "settlement_agreements"("responder_id", "status");

-- AddForeignKey
ALTER TABLE "settlement_agreements" ADD CONSTRAINT "settlement_agreements_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
