-- Aus der Textspalte "ordner" wird ein echter Ordner: anlegen, umbenennen und
-- loeschen unabhaengig davon, ob gerade ein Bericht darin liegt.

-- CreateTable
CREATE TABLE "report_folders" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_folders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "report_folders_projectId_idx" ON "report_folders"("projectId");
CREATE UNIQUE INDEX "report_folders_projectId_name_key" ON "report_folders"("projectId", "name");

ALTER TABLE "report_folders" ADD CONSTRAINT "report_folders_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reports" ADD COLUMN "folderId" TEXT;

-- Bestehende Ordnernamen aus der Textspalte in echte Ordner ueberfuehren.
-- Die Spalte "ordner" existiert nur, wenn die Vorgaengermigration schon lief;
-- auf einer frischen Datenbank ist hier schlicht nichts zu tun.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reports' AND column_name = 'ordner'
    ) THEN
        INSERT INTO "report_folders" ("id", "projectId", "name", "createdAt", "updatedAt")
        SELECT gen_random_uuid(), "projectId", "ordner", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM "reports"
        WHERE "ordner" IS NOT NULL AND btrim("ordner") <> ''
        GROUP BY "projectId", "ordner";

        UPDATE "reports" r
        SET "folderId" = f."id"
        FROM "report_folders" f
        WHERE f."projectId" = r."projectId" AND f."name" = r."ordner";

        DROP INDEX IF EXISTS "reports_projectId_ordner_idx";
        ALTER TABLE "reports" DROP COLUMN "ordner";
    END IF;
END $$;

CREATE INDEX "reports_folderId_idx" ON "reports"("folderId");

ALTER TABLE "reports" ADD CONSTRAINT "reports_folderId_fkey"
    FOREIGN KEY ("folderId") REFERENCES "report_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
