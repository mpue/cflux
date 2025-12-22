-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "templateId" TEXT;

-- CreateIndex
CREATE INDEX "invoices_templateId_idx" ON "invoices"("templateId");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "invoice_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
