-- CreateEnum
CREATE TYPE "ResolutionType" AS ENUM ('RESOLUTION', 'VIEWPOINT');

-- CreateEnum
CREATE TYPE "ResolutionStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "resolutions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ResolutionType" NOT NULL DEFAULT 'RESOLUTION',
    "status" "ResolutionStatus" NOT NULL DEFAULT 'DRAFT',
    "opens_at" TIMESTAMP(3),
    "closes_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resolution_options" (
    "id" TEXT NOT NULL,
    "resolution_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resolution_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resolution_votes" (
    "id" TEXT NOT NULL,
    "resolution_id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resolution_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resolutions_tenant_id_idx" ON "resolutions"("tenant_id");

-- CreateIndex
CREATE INDEX "resolutions_status_idx" ON "resolutions"("status");

-- CreateIndex
CREATE INDEX "resolution_options_resolution_id_idx" ON "resolution_options"("resolution_id");

-- CreateIndex
CREATE INDEX "resolution_votes_resolution_id_idx" ON "resolution_votes"("resolution_id");

-- CreateIndex
CREATE INDEX "resolution_votes_user_id_idx" ON "resolution_votes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "resolution_votes_resolution_id_user_id_key" ON "resolution_votes"("resolution_id", "user_id");

-- AddForeignKey
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolution_options" ADD CONSTRAINT "resolution_options_resolution_id_fkey" FOREIGN KEY ("resolution_id") REFERENCES "resolutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolution_votes" ADD CONSTRAINT "resolution_votes_resolution_id_fkey" FOREIGN KEY ("resolution_id") REFERENCES "resolutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolution_votes" ADD CONSTRAINT "resolution_votes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "resolution_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolution_votes" ADD CONSTRAINT "resolution_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
