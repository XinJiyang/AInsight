-- CreateEnum
CREATE TYPE "SourceCategory" AS ENUM ('official', 'research', 'media', 'community');

-- CreateEnum
CREATE TYPE "FeedType" AS ENUM ('rss', 'atom', 'html');

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "homepageUrl" TEXT NOT NULL,
    "category" "SourceCategory" NOT NULL,
    "sourceType" "FeedType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keywords" TEXT[],
    "author" TEXT,
    "link" TEXT,
    "publishedAt" TIMESTAMP(3),
    "crawledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_sourceKey_key" ON "Source"("sourceKey");

-- CreateIndex
CREATE UNIQUE INDEX "NewsItem_externalId_key" ON "NewsItem"("externalId");

-- CreateIndex
CREATE INDEX "NewsItem_publishedAt_idx" ON "NewsItem"("publishedAt");

-- CreateIndex
CREATE INDEX "NewsItem_sourceId_idx" ON "NewsItem"("sourceId");

-- AddForeignKey
ALTER TABLE "NewsItem" ADD CONSTRAINT "NewsItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
