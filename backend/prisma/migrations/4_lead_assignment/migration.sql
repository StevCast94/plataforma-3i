-- AlterTable
ALTER TABLE "ProductInquiry" ADD COLUMN     "assignedToId" TEXT;

-- CreateIndex
CREATE INDEX "ProductInquiry_assignedToId_idx" ON "ProductInquiry"("assignedToId");

-- AddForeignKey
ALTER TABLE "ProductInquiry" ADD CONSTRAINT "ProductInquiry_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
