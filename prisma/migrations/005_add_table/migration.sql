-- CreateEnum
CREATE TYPE "public"."PoliticalType" AS ENUM ('contribution', 'donation');

-- CreateTable
CREATE TABLE "public"."political_activity" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "event" TEXT NOT NULL,
    "type" "public"."PoliticalType" NOT NULL DEFAULT 'donation',
    "amount" DECIMAL(30,8) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "recipient" TEXT,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "political_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_pc_company_date" ON "public"."political_activity"("company_id", "date");

-- CreateIndex
CREATE INDEX "idx_pc_company_type_date" ON "public"."political_activity"("company_id", "type", "date");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_pc_company_event_date_recipient_type" ON "public"."political_activity"("company_id", "event", "date", "recipient", "type");

-- AddForeignKey
ALTER TABLE "public"."political_activity" ADD CONSTRAINT "political_activity_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
