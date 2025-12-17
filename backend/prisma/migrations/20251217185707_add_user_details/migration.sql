/*
  Warnings:

  - A unique constraint covering the columns `[employeeNumber]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ahvNumber]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ahvNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "civilStatus" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'Schweiz',
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "employeeNumber" TEXT,
ADD COLUMN     "entryDate" TIMESTAMP(3),
ADD COLUMN     "exitDate" TIMESTAMP(3),
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "isCrossBorderCommuter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "placeOfBirth" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "streetNumber" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeNumber_key" ON "users"("employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_ahvNumber_key" ON "users"("ahvNumber");
