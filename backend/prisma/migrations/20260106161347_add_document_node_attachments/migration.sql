-- CreateTable
CREATE TABLE "document_node_attachments" (
    "id" TEXT NOT NULL,
    "documentNodeId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "document_node_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_node_attachment_versions" (
    "id" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "document_node_attachment_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_node_attachments_documentNodeId_idx" ON "document_node_attachments"("documentNodeId");

-- CreateIndex
CREATE INDEX "document_node_attachments_isActive_idx" ON "document_node_attachments"("isActive");

-- CreateIndex
CREATE INDEX "document_node_attachments_deletedAt_idx" ON "document_node_attachments"("deletedAt");

-- CreateIndex
CREATE INDEX "document_node_attachment_versions_attachmentId_idx" ON "document_node_attachment_versions"("attachmentId");

-- CreateIndex
CREATE INDEX "document_node_attachment_versions_version_idx" ON "document_node_attachment_versions"("version");

-- AddForeignKey
ALTER TABLE "document_node_attachments" ADD CONSTRAINT "document_node_attachments_documentNodeId_fkey" FOREIGN KEY ("documentNodeId") REFERENCES "document_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_node_attachments" ADD CONSTRAINT "document_node_attachments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_node_attachments" ADD CONSTRAINT "document_node_attachments_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_node_attachment_versions" ADD CONSTRAINT "document_node_attachment_versions_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "document_node_attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_node_attachment_versions" ADD CONSTRAINT "document_node_attachment_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
