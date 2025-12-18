-- AlterEnum
ALTER TYPE "TimeEntryStatus" ADD VALUE 'ON_PAUSE';

-- AlterTable
ALTER TABLE "time_entries" ADD COLUMN     "pauseStartedAt" TIMESTAMP(3);
