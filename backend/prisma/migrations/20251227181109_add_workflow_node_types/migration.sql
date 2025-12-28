-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkflowStepType" ADD VALUE 'EMAIL';
ALTER TYPE "WorkflowStepType" ADD VALUE 'DATE_CONDITION';
ALTER TYPE "WorkflowStepType" ADD VALUE 'VALUE_CONDITION';
ALTER TYPE "WorkflowStepType" ADD VALUE 'TEXT_CONDITION';
ALTER TYPE "WorkflowStepType" ADD VALUE 'LOGIC_AND';
ALTER TYPE "WorkflowStepType" ADD VALUE 'LOGIC_OR';
