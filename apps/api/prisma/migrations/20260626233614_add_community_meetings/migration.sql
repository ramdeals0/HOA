-- CreateTable
CREATE TABLE "community_meetings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "meeting_type" TEXT NOT NULL DEFAULT 'GENERAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_meetings_tenant_id_idx" ON "community_meetings"("tenant_id");

-- CreateIndex
CREATE INDEX "community_meetings_scheduled_at_idx" ON "community_meetings"("scheduled_at");

-- AddForeignKey
ALTER TABLE "community_meetings" ADD CONSTRAINT "community_meetings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
