-- CreateTable
CREATE TABLE "public"."company_view" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_view_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_company_day" ON "public"."company_view"("company_id", "day");

-- CreateIndex
CREATE INDEX "idx_view_day" ON "public"."company_view"("day");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_company_day_ip" ON "public"."company_view"("company_id", "day", "ip_hash");

-- AddForeignKey
ALTER TABLE "public"."company_view" ADD CONSTRAINT "company_view_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
