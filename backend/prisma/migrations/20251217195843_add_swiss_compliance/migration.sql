-- CreateEnum
CREATE TYPE "ViolationType" AS ENUM ('REST_TIME', 'MAX_WEEKLY_HOURS', 'MAX_DAILY_HOURS', 'MISSING_PAUSE', 'OVERTIME_LIMIT', 'NIGHT_WORK', 'SUNDAY_WORK');

-- CreateEnum
CREATE TYPE "ViolationSeverity" AS ENUM ('WARNING', 'CRITICAL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "canton" TEXT DEFAULT 'ZH',
ADD COLUMN     "contractHours" DOUBLE PRECISION,
ADD COLUMN     "exemptFromTracking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weeklyHours" INTEGER NOT NULL DEFAULT 45;

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "canton" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overtime_balances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "regularOvertime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sundayHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overtime_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_violations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ViolationType" NOT NULL,
    "severity" "ViolationSeverity" NOT NULL DEFAULT 'WARNING',
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "actualValue" TEXT,
    "requiredValue" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_settings" (
    "id" TEXT NOT NULL,
    "defaultWeeklyHours" INTEGER NOT NULL DEFAULT 45,
    "defaultCanton" TEXT NOT NULL DEFAULT 'ZH',
    "overtimeLimit170" BOOLEAN NOT NULL DEFAULT true,
    "enableAutoWarnings" BOOLEAN NOT NULL DEFAULT true,
    "enableEmailAlerts" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "holidays_date_key" ON "holidays"("date");

-- CreateIndex
CREATE INDEX "holidays_date_canton_idx" ON "holidays"("date", "canton");

-- CreateIndex
CREATE UNIQUE INDEX "overtime_balances_userId_year_key" ON "overtime_balances"("userId", "year");

-- CreateIndex
CREATE INDEX "compliance_violations_userId_date_idx" ON "compliance_violations"("userId", "date");

-- CreateIndex
CREATE INDEX "compliance_violations_resolved_severity_idx" ON "compliance_violations"("resolved", "severity");

-- AddForeignKey
ALTER TABLE "overtime_balances" ADD CONSTRAINT "overtime_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_violations" ADD CONSTRAINT "compliance_violations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
