-- AlterTable
ALTER TABLE "users" ADD COLUMN "photo_url" TEXT;

-- AlterTable
ALTER TABLE "tenant_users" ADD COLUMN "show_in_directory" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tenant_users" ADD COLUMN "directory_share_email" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tenant_users" ADD COLUMN "directory_share_phone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tenant_users" ADD COLUMN "directory_share_address" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tenant_users" ADD COLUMN "directory_share_photo" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "tenant_users_tenant_id_show_in_directory_idx" ON "tenant_users"("tenant_id", "show_in_directory");
