-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'password_reset',
    "memberId" TEXT,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportRequest_status_idx" ON "SupportRequest"("status");
