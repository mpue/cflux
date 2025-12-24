-- AlterTable
ALTER TABLE "incidents" ADD COLUMN     "projectId" TEXT;

-- CreateIndex
CREATE INDEX "incidents_projectId_idx" ON "incidents"("projectId");

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
