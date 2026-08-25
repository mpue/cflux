-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- AlterTable: Projekt-Branding (Logo und Farben, editierbar)
ALTER TABLE "projects" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "projects" ADD COLUMN "primaryColor" TEXT;
ALTER TABLE "projects" ADD COLUMN "secondaryColor" TEXT;
ALTER TABLE "projects" ADD COLUMN "accentColor" TEXT;

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "weekday" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "referent" TEXT,
    "rundgangDurchgefuehrt" TEXT,
    "weitereTeilnehmer" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_areas" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "report_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_photos" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_findings" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "feststellung" TEXT,
    "bereich" TEXT,
    "klassifizierung" TEXT,
    "ampel" TEXT,
    "stopp" TEXT,
    "massnahme" TEXT,
    "verantwortlich" TEXT,
    "termin" TIMESTAMP(3),
    "status" TEXT,
    "erledigtAm" TIMESTAMP(3),
    "enablon" TEXT,
    "photoId" TEXT,

    CONSTRAINT "report_findings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_projectId_idx" ON "reports"("projectId");
CREATE INDEX "reports_date_idx" ON "reports"("date");
CREATE INDEX "reports_createdById_idx" ON "reports"("createdById");
CREATE INDEX "report_areas_reportId_idx" ON "report_areas"("reportId");
CREATE INDEX "report_photos_reportId_idx" ON "report_photos"("reportId");
CREATE INDEX "report_photos_uploadedById_idx" ON "report_photos"("uploadedById");
CREATE INDEX "report_findings_reportId_idx" ON "report_findings"("reportId");
CREATE INDEX "report_findings_photoId_idx" ON "report_findings"("photoId");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "report_areas" ADD CONSTRAINT "report_areas_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "report_photos" ADD CONSTRAINT "report_photos_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "report_photos" ADD CONSTRAINT "report_photos_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "report_findings" ADD CONSTRAINT "report_findings_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "report_findings" ADD CONSTRAINT "report_findings_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "report_photos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
