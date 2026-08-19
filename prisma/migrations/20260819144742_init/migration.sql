-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringSlot" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,

    CONSTRAINT "RecurringSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayOverride" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "DayOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OverrideSlot" (
    "id" TEXT NOT NULL,
    "dayOverrideId" TEXT NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,

    CONSTRAINT "OverrideSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PinAttempt" (
    "id" TEXT NOT NULL,
    "groupSlug" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PinAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_slug_key" ON "Group"("slug");

-- CreateIndex
CREATE INDEX "Member_groupId_idx" ON "Member"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_groupId_name_key" ON "Member"("groupId", "name");

-- CreateIndex
CREATE INDEX "RecurringSlot_memberId_idx" ON "RecurringSlot"("memberId");

-- CreateIndex
CREATE INDEX "DayOverride_memberId_date_idx" ON "DayOverride"("memberId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DayOverride_memberId_date_key" ON "DayOverride"("memberId", "date");

-- CreateIndex
CREATE INDEX "OverrideSlot_dayOverrideId_idx" ON "OverrideSlot"("dayOverrideId");

-- CreateIndex
CREATE INDEX "PinAttempt_groupSlug_ip_at_idx" ON "PinAttempt"("groupSlug", "ip", "at");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringSlot" ADD CONSTRAINT "RecurringSlot_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayOverride" ADD CONSTRAINT "DayOverride_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OverrideSlot" ADD CONSTRAINT "OverrideSlot_dayOverrideId_fkey" FOREIGN KEY ("dayOverrideId") REFERENCES "DayOverride"("id") ON DELETE CASCADE ON UPDATE CASCADE;
