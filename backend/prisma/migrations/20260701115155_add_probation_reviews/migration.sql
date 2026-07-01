-- CreateEnum
CREATE TYPE "ProbationReviewType" AS ENUM ('DAY_30', 'DAY_60', 'DAY_90', 'FINAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ProbationReviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProbationDecision" AS ENUM ('CONTINUE', 'EXTEND_PROBATION', 'TERMINATE');

-- CreateTable
CREATE TABLE "probation_reviews" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "ProbationReviewType" NOT NULL DEFAULT 'DAY_30',
    "status" "ProbationReviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "conductedDate" TIMESTAMP(3),
    "conductedById" TEXT,
    "hrPresent" BOOLEAN NOT NULL DEFAULT false,
    "ratingPerformance" INTEGER,
    "ratingIntegration" INTEGER,
    "ratingCollaboration" INTEGER,
    "ratingGoals" INTEGER,
    "strengths" TEXT,
    "developmentAreas" TEXT,
    "employeeFeedback" TEXT,
    "agreements" TEXT,
    "decision" "ProbationDecision",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "probation_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "probation_reviews_employeeId_idx" ON "probation_reviews"("employeeId");

-- CreateIndex
CREATE INDEX "probation_reviews_status_idx" ON "probation_reviews"("status");

-- CreateIndex
CREATE INDEX "probation_reviews_scheduledDate_idx" ON "probation_reviews"("scheduledDate");

-- AddForeignKey
ALTER TABLE "probation_reviews" ADD CONSTRAINT "probation_reviews_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "probation_reviews" ADD CONSTRAINT "probation_reviews_conductedById_fkey" FOREIGN KEY ("conductedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

