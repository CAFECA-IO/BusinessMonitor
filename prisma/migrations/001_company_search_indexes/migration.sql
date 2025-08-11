-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateIndex
CREATE INDEX "idx_company_name_trgm" ON "public"."company" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_company_regno_pattern" ON "public"."company"("registration_no" text_pattern_ops);
