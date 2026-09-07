-- AlterTable: Titel und Ordner am Bericht.
-- Beides kommt aus dem eigenstaendigen Wochenbericht-Tool: der Titel steht dort
-- gross ueber dem Protokoll, der Ordner gruppiert die Tagesblaetter zu einem
-- Wochenbericht. Ohne die Spalten gingen sie beim Import verloren.
ALTER TABLE "reports" ADD COLUMN "titel" TEXT;
ALTER TABLE "reports" ADD COLUMN "ordner" TEXT;

-- Berichte eines Wochenberichts werden ueber den Ordnernamen zusammengesucht.
CREATE INDEX "reports_projectId_ordner_idx" ON "reports"("projectId", "ordner");
