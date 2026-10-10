-- CreateTable
CREATE TABLE "EventGuest" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventGuest_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EventDrink" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventDrink_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EventGuest_secret_key" ON "EventGuest"("secret");
CREATE UNIQUE INDEX "EventGuest_event_memberId_key" ON "EventGuest"("event", "memberId");
CREATE UNIQUE INDEX "EventDrink_guestId_channel_key" ON "EventDrink"("guestId", "channel");
ALTER TABLE "EventGuest" ADD CONSTRAINT "EventGuest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ReferralMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventDrink" ADD CONSTRAINT "EventDrink_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "EventGuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
