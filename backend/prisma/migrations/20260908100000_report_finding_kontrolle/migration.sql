-- Enablon faellt weg, stattdessen gibt es die Spalte "Kontrolle" am Ende der
-- Feststellungstabelle. Beides sind eigenstaendige Angaben, deshalb kein
-- Rename: der Enablon-Inhalt wird bewusst verworfen.
ALTER TABLE "report_findings" DROP COLUMN IF EXISTS "enablon";
ALTER TABLE "report_findings" ADD COLUMN "kontrolle" TEXT;
