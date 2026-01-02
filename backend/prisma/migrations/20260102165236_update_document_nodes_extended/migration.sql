/*
  Warnings:

  - The `type` column on the `document_nodes` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DocumentNodeType" AS ENUM ('FOLDER', 'DOCUMENT', 'LINK');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentContentType" ADD VALUE 'HTML';
ALTER TYPE "DocumentContentType" ADD VALUE 'PLAIN_TEXT';

-- AlterTable
ALTER TABLE "document_nodes" ADD COLUMN     "contentType" TEXT NOT NULL DEFAULT 'HTML',
ADD COLUMN     "externalUrl" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "nodeTypeKey" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "tags" JSONB,
DROP COLUMN "type",
ADD COLUMN     "type" "DocumentNodeType" NOT NULL DEFAULT 'DOCUMENT';

-- CreateTable
CREATE TABLE "document_node_types" (
    "id" TEXT NOT NULL,
    "typeKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "icon" TEXT,
    "module" TEXT NOT NULL,
    "schema" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_node_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_node_group_permissions" (
    "id" TEXT NOT NULL,
    "documentNodeId" TEXT NOT NULL,
    "userGroupId" TEXT NOT NULL,
    "permissionLevel" "DocumentPermissionLevel" NOT NULL DEFAULT 'READ',
    "inherited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_node_group_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_node_types_typeKey_key" ON "document_node_types"("typeKey");

-- CreateIndex
CREATE INDEX "document_node_group_permissions_documentNodeId_idx" ON "document_node_group_permissions"("documentNodeId");

-- CreateIndex
CREATE INDEX "document_node_group_permissions_userGroupId_idx" ON "document_node_group_permissions"("userGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "document_node_group_permissions_documentNodeId_userGroupId_key" ON "document_node_group_permissions"("documentNodeId", "userGroupId");

-- CreateIndex
CREATE INDEX "document_nodes_nodeTypeKey_idx" ON "document_nodes"("nodeTypeKey");

-- CreateIndex
CREATE INDEX "document_nodes_slug_idx" ON "document_nodes"("slug");

-- AddForeignKey
ALTER TABLE "document_nodes" ADD CONSTRAINT "document_nodes_nodeTypeKey_fkey" FOREIGN KEY ("nodeTypeKey") REFERENCES "document_node_types"("typeKey") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_node_group_permissions" ADD CONSTRAINT "document_node_group_permissions_documentNodeId_fkey" FOREIGN KEY ("documentNodeId") REFERENCES "document_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_node_group_permissions" ADD CONSTRAINT "document_node_group_permissions_userGroupId_fkey" FOREIGN KEY ("userGroupId") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
