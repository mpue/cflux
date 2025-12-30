-- CreateEnum
CREATE TYPE "TravelExpenseType" AS ENUM ('FLIGHT', 'TRAIN', 'CAR', 'TAXI', 'ACCOMMODATION', 'MEALS', 'OTHER');

-- CreateTable
CREATE TABLE "travel_expenses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TravelExpenseType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "destination" TEXT,
    "purpose" TEXT,
    "distance" DOUBLE PRECISION,
    "vehicleType" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CHF',
    "receipt" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "travel_expenses_userId_idx" ON "travel_expenses"("userId");

-- CreateIndex
CREATE INDEX "travel_expenses_approverId_idx" ON "travel_expenses"("approverId");

-- CreateIndex
CREATE INDEX "travel_expenses_status_idx" ON "travel_expenses"("status");

-- CreateIndex
CREATE INDEX "travel_expenses_date_idx" ON "travel_expenses"("date");

-- AddForeignKey
ALTER TABLE "travel_expenses" ADD CONSTRAINT "travel_expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_expenses" ADD CONSTRAINT "travel_expenses_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
