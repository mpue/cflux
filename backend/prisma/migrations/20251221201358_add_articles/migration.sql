-- CreateTable
CREATE TABLE "article_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "articleNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "articleGroupId" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'Stück',
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 7.7,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "article_groups_name_key" ON "article_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "articles_articleNumber_key" ON "articles"("articleNumber");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_articleGroupId_fkey" FOREIGN KEY ("articleGroupId") REFERENCES "article_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
