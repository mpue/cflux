-- CreateTable
CREATE TABLE "project_time_allocations" (
    "id" TEXT NOT NULL,
    "timeEntryId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_time_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_time_allocations_timeEntryId_idx" ON "project_time_allocations"("timeEntryId");

-- CreateIndex
CREATE INDEX "project_time_allocations_projectId_idx" ON "project_time_allocations"("projectId");

-- AddForeignKey
ALTER TABLE "project_time_allocations" ADD CONSTRAINT "project_time_allocations_timeEntryId_fkey" FOREIGN KEY ("timeEntryId") REFERENCES "time_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_time_allocations" ADD CONSTRAINT "project_time_allocations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
