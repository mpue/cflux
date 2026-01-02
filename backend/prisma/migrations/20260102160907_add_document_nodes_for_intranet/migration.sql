-- CreateEnum
CREATE TYPE "DocumentContentType" AS ENUM ('MARKDOWN', 'LINK', 'CONTAINER');

-- CreateEnum
CREATE TYPE "DocumentPermissionLevel" AS ENUM ('READ', 'WRITE', 'ADMIN');

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
CREATE TABLE "document_nodes" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "nodeTypeId" TEXT NOT NULL,
    "contentType" "DocumentContentType" NOT NULL DEFAULT 'MARKDOWN',
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "content" TEXT,
    "externalUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tags" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "document_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_node_groups" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "userGroupId" TEXT NOT NULL,
    "permissionLevel" "DocumentPermissionLevel" NOT NULL DEFAULT 'READ',
    "inherited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_node_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_node_types_typeKey_key" ON "document_node_types"("typeKey");

-- CreateIndex
CREATE INDEX "document_nodes_parentId_idx" ON "document_nodes"("parentId");

-- CreateIndex
CREATE INDEX "document_nodes_nodeTypeId_idx" ON "document_nodes"("nodeTypeId");

-- CreateIndex
CREATE INDEX "document_nodes_createdById_idx" ON "document_nodes"("createdById");

-- CreateIndex
CREATE INDEX "document_nodes_updatedById_idx" ON "document_nodes"("updatedById");

-- CreateIndex
CREATE INDEX "document_nodes_slug_idx" ON "document_nodes"("slug");

-- CreateIndex
CREATE INDEX "document_nodes_sortOrder_idx" ON "document_nodes"("sortOrder");

-- CreateIndex
CREATE INDEX "document_node_groups_nodeId_idx" ON "document_node_groups"("nodeId");

-- CreateIndex
CREATE INDEX "document_node_groups_userGroupId_idx" ON "document_node_groups"("userGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "document_node_groups_nodeId_userGroupId_key" ON "document_node_groups"("nodeId", "userGroupId");

-- AddForeignKey
ALTER TABLE "document_nodes" ADD CONSTRAINT "document_nodes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "document_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_nodes" ADD CONSTRAINT "document_nodes_nodeTypeId_fkey" FOREIGN KEY ("nodeTypeId") REFERENCES "document_node_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_nodes" ADD CONSTRAINT "document_nodes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_nodes" ADD CONSTRAINT "document_nodes_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_node_groups" ADD CONSTRAINT "document_node_groups_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "document_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_node_groups" ADD CONSTRAINT "document_node_groups_userGroupId_fkey" FOREIGN KEY ("userGroupId") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
