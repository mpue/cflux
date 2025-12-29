-- CreateTable
CREATE TABLE "user_group_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_group_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_group_memberships_userId_idx" ON "user_group_memberships"("userId");

-- CreateIndex
CREATE INDEX "user_group_memberships_userGroupId_idx" ON "user_group_memberships"("userGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "user_group_memberships_userId_userGroupId_key" ON "user_group_memberships"("userId", "userGroupId");

-- AddForeignKey
ALTER TABLE "user_group_memberships" ADD CONSTRAINT "user_group_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group_memberships" ADD CONSTRAINT "user_group_memberships_userGroupId_fkey" FOREIGN KEY ("userGroupId") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
