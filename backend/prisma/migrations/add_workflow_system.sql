-- CreateEnum
CREATE TYPE "WorkflowStepType" AS ENUM ('APPROVAL', 'NOTIFICATION', 'CONDITION', 'DELAY');

-- CreateEnum
CREATE TYPE "WorkflowStepStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WorkflowInstanceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "definition" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WorkflowStepType" NOT NULL,
    "order" INTEGER NOT NULL,
    "approverUserIds" TEXT,
    "approverGroupIds" TEXT,
    "requireAllApprovers" BOOLEAN NOT NULL DEFAULT false,
    "config" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_template_workflows" (
    "id" TEXT NOT NULL,
    "invoiceTemplateId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_template_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "status" "WorkflowInstanceStatus" NOT NULL DEFAULT 'PENDING',
    "currentStepId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instance_steps" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "status" "WorkflowStepStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_instance_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_steps_workflowId_idx" ON "workflow_steps"("workflowId");

-- CreateIndex
CREATE INDEX "workflow_steps_order_idx" ON "workflow_steps"("order");

-- CreateIndex
CREATE INDEX "invoice_template_workflows_invoiceTemplateId_idx" ON "invoice_template_workflows"("invoiceTemplateId");

-- CreateIndex
CREATE INDEX "invoice_template_workflows_workflowId_idx" ON "invoice_template_workflows"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_template_workflows_invoiceTemplateId_workflowId_key" ON "invoice_template_workflows"("invoiceTemplateId", "workflowId");

-- CreateIndex
CREATE INDEX "workflow_instances_workflowId_idx" ON "workflow_instances"("workflowId");

-- CreateIndex
CREATE INDEX "workflow_instances_invoiceId_idx" ON "workflow_instances"("invoiceId");

-- CreateIndex
CREATE INDEX "workflow_instances_status_idx" ON "workflow_instances"("status");

-- CreateIndex
CREATE INDEX "workflow_instance_steps_instanceId_idx" ON "workflow_instance_steps"("instanceId");

-- CreateIndex
CREATE INDEX "workflow_instance_steps_stepId_idx" ON "workflow_instance_steps"("stepId");

-- CreateIndex
CREATE INDEX "workflow_instance_steps_status_idx" ON "workflow_instance_steps"("status");

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_template_workflows" ADD CONSTRAINT "invoice_template_workflows_invoiceTemplateId_fkey" FOREIGN KEY ("invoiceTemplateId") REFERENCES "invoice_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_template_workflows" ADD CONSTRAINT "invoice_template_workflows_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instance_steps" ADD CONSTRAINT "workflow_instance_steps_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instance_steps" ADD CONSTRAINT "workflow_instance_steps_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "workflow_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instance_steps" ADD CONSTRAINT "workflow_instance_steps_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert Workflow Module
INSERT INTO modules (id, name, key, description, icon, route, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Workflows',
  'workflows',
  'Genehmigungsworkflows verwalten',
  '🔄',
  '/workflows',
  17,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (key) DO NOTHING;
