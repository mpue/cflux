/*
  Warnings:

  - Added the required column `entityId` to the `workflow_instances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityType` to the `workflow_instances` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "travel_expenses" ADD COLUMN     "workflowId" TEXT;

-- AlterTable: Add columns as nullable first
ALTER TABLE "workflow_instances" 
ADD COLUMN "entityId" TEXT,
ADD COLUMN "entityType" TEXT,
ALTER COLUMN "invoiceId" DROP NOT NULL;

-- Migrate existing data: Set entityType and entityId for existing records
UPDATE "workflow_instances" 
SET "entityType" = 'INVOICE', 
    "entityId" = "invoiceId"
WHERE "invoiceId" IS NOT NULL;

-- Make columns required now that data is migrated
ALTER TABLE "workflow_instances" 
ALTER COLUMN "entityId" SET NOT NULL,
ALTER COLUMN "entityType" SET NOT NULL;

-- CreateIndex
CREATE INDEX "travel_expenses_workflowId_idx" ON "travel_expenses"("workflowId");

-- CreateIndex
CREATE INDEX "workflow_instances_entityType_entityId_idx" ON "workflow_instances"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "travel_expenses" ADD CONSTRAINT "travel_expenses_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;
