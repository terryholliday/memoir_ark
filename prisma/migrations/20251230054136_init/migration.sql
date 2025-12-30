-- CreateTable
CREATE TABLE "FamilyShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "accessLevel" TEXT NOT NULL DEFAULT 'read',
    "accessToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scopeAllChapters" BOOLEAN NOT NULL DEFAULT true,
    "scopeChapterIds" TEXT NOT NULL DEFAULT '[]',
    "scopeCollectionIds" TEXT NOT NULL DEFAULT '[]',
    "ledgerEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerSync" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "ledgerEventId" TEXT,
    "ledgerHash" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,

    CONSTRAINT "LedgerSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FamilyShare_accessToken_key" ON "FamilyShare"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyShare_userId_recipientEmail_key" ON "FamilyShare"("userId", "recipientEmail");

-- CreateIndex
CREATE INDEX "LedgerSync_userId_resourceType_idx" ON "LedgerSync"("userId", "resourceType");

-- CreateIndex
CREATE INDEX "LedgerSync_resourceId_idx" ON "LedgerSync"("resourceId");

-- AddForeignKey
ALTER TABLE "FamilyShare" ADD CONSTRAINT "FamilyShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
