/*
  Warnings:

  - You are about to drop the column `contentType` on the `document_nodes` table. All the data in the column will be lost.
  - You are about to drop the column `externalUrl` on the `document_nodes` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `document_nodes` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `document_nodes` table. All the data in the column will be lost.
  - You are about to drop the column `nodeTypeId` on the `document_nodes` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `document_nodes` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `document_nodes` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `document_nodes` table. All the data in the column will be lost.
  - You are about to drop the `document_node_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `document_node_types` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type` to the `document_nodes` table without a default value. This is not possible if the table is not empty.
  - Made the column `content` on table `document_nodes` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "document_node_groups" DROP CONSTRAINT "document_node_groups_nodeId_fkey";

-- DropForeignKey
ALTER TABLE "document_node_groups" DROP CONSTRAINT "document_node_groups_userGroupId_fkey";

-- DropForeignKey
ALTER TABLE "document_nodes" DROP CONSTRAINT "document_nodes_nodeTypeId_fkey";

-- DropIndex
DROP INDEX "document_nodes_createdById_idx";

-- DropIndex
DROP INDEX "document_nodes_nodeTypeId_idx";

-- DropIndex
DROP INDEX "document_nodes_slug_idx";

-- DropIndex
DROP INDEX "document_nodes_sortOrder_idx";

-- DropIndex
DROP INDEX "document_nodes_updatedById_idx";

-- AlterTable
ALTER TABLE "document_nodes" DROP COLUMN "contentType",
DROP COLUMN "externalUrl",
DROP COLUMN "isActive",
DROP COLUMN "metadata",
DROP COLUMN "nodeTypeId",
DROP COLUMN "slug",
DROP COLUMN "sortOrder",
DROP COLUMN "tags",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "content" SET NOT NULL,
ALTER COLUMN "content" SET DEFAULT '';

-- DropTable
DROP TABLE "document_node_groups";

-- DropTable
DROP TABLE "document_node_types";

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "documentNodeId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_versions_documentNodeId_idx" ON "document_versions"("documentNodeId");

-- CreateIndex
CREATE INDEX "document_versions_version_idx" ON "document_versions"("version");

-- CreateIndex
CREATE INDEX "document_nodes_deletedAt_idx" ON "document_nodes"("deletedAt");

-- CreateIndex
CREATE INDEX "document_nodes_order_idx" ON "document_nodes"("order");

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentNodeId_fkey" FOREIGN KEY ("documentNodeId") REFERENCES "document_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
