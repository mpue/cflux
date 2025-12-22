-- AlterTable invoice_templates add logo position fields
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "logoPosition" TEXT;
ALTER TABLE "invoice_templates" ADD COLUMN IF NOT EXISTS "logoAlignment" TEXT NOT NULL DEFAULT 'left';
