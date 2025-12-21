-- CreateTable
CREATE TABLE "invoice_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "companyName" TEXT NOT NULL DEFAULT 'Ihre Firma',
    "companyStreet" TEXT NOT NULL DEFAULT '',
    "companyZip" TEXT NOT NULL DEFAULT '',
    "companyCity" TEXT NOT NULL DEFAULT '',
    "companyCountry" TEXT NOT NULL DEFAULT 'Schweiz',
    "companyPhone" TEXT NOT NULL DEFAULT '',
    "companyEmail" TEXT NOT NULL DEFAULT '',
    "companyWebsite" TEXT NOT NULL DEFAULT '',
    "companyTaxId" TEXT NOT NULL DEFAULT '',
    "companyIban" TEXT NOT NULL DEFAULT '',
    "companyBank" TEXT NOT NULL DEFAULT '',
    "headerText" TEXT,
    "footerText" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#2563eb',
    "logoUrl" TEXT,
    "introText" TEXT,
    "paymentTermsText" TEXT,
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "showTaxId" BOOLEAN NOT NULL DEFAULT true,
    "showPaymentInfo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoice_templates_name_key" ON "invoice_templates"("name");
