-- CreateEnum
CREATE TYPE "ReminderLevel" AS ENUM ('FIRST_REMINDER', 'SECOND_REMINDER', 'FINAL_REMINDER');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'PAID', 'ESCALATED', 'CANCELLED');

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "reminderNumber" TEXT NOT NULL,
    "level" "ReminderLevel" NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "reminderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "reminderFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interestAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "subject" TEXT,
    "message" TEXT,
    "notes" TEXT,
    "sentDate" TIMESTAMP(3),
    "sentBy" TEXT,
    "paidDate" TIMESTAMP(3),
    "paymentSlipRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_settings" (
    "id" TEXT NOT NULL,
    "firstReminderDays" INTEGER NOT NULL DEFAULT 7,
    "secondReminderDays" INTEGER NOT NULL DEFAULT 14,
    "finalReminderDays" INTEGER NOT NULL DEFAULT 21,
    "firstReminderFee" DOUBLE PRECISION NOT NULL DEFAULT 10.00,
    "secondReminderFee" DOUBLE PRECISION NOT NULL DEFAULT 20.00,
    "finalReminderFee" DOUBLE PRECISION NOT NULL DEFAULT 30.00,
    "defaultInterestRate" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "firstReminderPaymentDays" INTEGER NOT NULL DEFAULT 10,
    "secondReminderPaymentDays" INTEGER NOT NULL DEFAULT 7,
    "finalReminderPaymentDays" INTEGER NOT NULL DEFAULT 5,
    "autoSendReminders" BOOLEAN NOT NULL DEFAULT false,
    "autoEscalate" BOOLEAN NOT NULL DEFAULT false,
    "firstReminderTemplate" TEXT,
    "secondReminderTemplate" TEXT,
    "finalReminderTemplate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reminders_reminderNumber_key" ON "reminders"("reminderNumber");

-- CreateIndex
CREATE INDEX "reminders_invoiceId_idx" ON "reminders"("invoiceId");

-- CreateIndex
CREATE INDEX "reminders_status_idx" ON "reminders"("status");

-- CreateIndex
CREATE INDEX "reminders_level_idx" ON "reminders"("level");

-- CreateIndex
CREATE INDEX "reminders_reminderDate_idx" ON "reminders"("reminderDate");

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
