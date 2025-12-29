-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollType" AS ENUM ('MONTHLY', 'BONUS', 'CORRECTION');

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "PayrollType" NOT NULL DEFAULT 'MONTHLY',
    "notes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_entries" (
    "id" TEXT NOT NULL,
    "payrollPeriodId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "regularHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sundayHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "holidayHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "baseSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimePay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sundayBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "holidayBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ahvDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alvDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nbuvDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pensionDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "absenceDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vacationDaysTaken" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sickDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_configurations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthlySalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hourlySalary" DOUBLE PRECISION,
    "overtimeRate" DOUBLE PRECISION NOT NULL DEFAULT 125,
    "nightRate" DOUBLE PRECISION NOT NULL DEFAULT 125,
    "sundayRate" DOUBLE PRECISION NOT NULL DEFAULT 150,
    "holidayRate" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "ahvRate" DOUBLE PRECISION NOT NULL DEFAULT 5.3,
    "alvRate" DOUBLE PRECISION NOT NULL DEFAULT 1.1,
    "nbuvRate" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "pensionRate" DOUBLE PRECISION NOT NULL DEFAULT 7.0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payroll_periods_year_month_idx" ON "payroll_periods"("year", "month");

-- CreateIndex
CREATE INDEX "payroll_periods_status_idx" ON "payroll_periods"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_periods_year_month_type_key" ON "payroll_periods"("year", "month", "type");

-- CreateIndex
CREATE INDEX "payroll_entries_userId_idx" ON "payroll_entries"("userId");

-- CreateIndex
CREATE INDEX "payroll_entries_payrollPeriodId_idx" ON "payroll_entries"("payrollPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_entries_payrollPeriodId_userId_key" ON "payroll_entries"("payrollPeriodId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "salary_configurations_userId_key" ON "salary_configurations"("userId");

-- CreateIndex
CREATE INDEX "salary_configurations_userId_idx" ON "salary_configurations"("userId");

-- CreateIndex
CREATE INDEX "salary_configurations_isActive_idx" ON "salary_configurations"("isActive");

-- AddForeignKey
ALTER TABLE "payroll_entries" ADD CONSTRAINT "payroll_entries_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "payroll_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_entries" ADD CONSTRAINT "payroll_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_configurations" ADD CONSTRAINT "salary_configurations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
