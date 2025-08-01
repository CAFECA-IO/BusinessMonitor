-- CreateTable
CREATE TABLE "public"."company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "registration_no" TEXT NOT NULL,
    "parent_reg_no" TEXT,
    "representative" TEXT,
    "registration_country" TEXT,
    "established_date" TIMESTAMP(3),
    "capital_amount" DECIMAL(30,8),
    "paid_in_capital" DECIMAL(30,8),
    "capital_ranking" INTEGER,
    "address" TEXT,
    "website_url" TEXT,
    "logo_url" TEXT,
    "registration_agency" TEXT,
    "status" TEXT,
    "organization_type" TEXT,
    "business_items" JSONB,
    "contributions" JSONB,
    "shareholding_status" TEXT,
    "share_price" DECIMAL(30,8),
    "total_issued_shares" BIGINT,
    "multiple_voting_rights" TEXT,
    "special_voting_rights" TEXT,
    "last_change_date" TIMESTAMP(3),
    "last_approved_change" TIMESTAMP(3),
    "status_date" TIMESTAMP(3),
    "status_doc_no" TEXT,
    "foreign_company_name" TEXT,
    "directors" JSONB,
    "managers" JSONB,
    "suspension_start_date" TIMESTAMP(3),
    "suspension_end_date" TIMESTAMP(3),
    "suspension_agency" TEXT,
    "old_business_items_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_relation" (
    "id" SERIAL NOT NULL,
    "parent_reg_no" TEXT NOT NULL,
    "child_reg_no" TEXT NOT NULL,
    "relation" TEXT,

    CONSTRAINT "company_relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."investor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "shareholder_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_investor" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "investor_id" INTEGER NOT NULL,
    "position" TEXT,
    "share_ratio" DECIMAL(65,30),
    "representative_juridical_person" TEXT,
    "investment_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_investor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_history" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "change_date" TIMESTAMP(3) NOT NULL,
    "change_type" TEXT NOT NULL,
    "change_detail" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."related_company" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "related_company_id" INTEGER NOT NULL,
    "relation_type" TEXT,
    "related_business_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "related_company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_price" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "open_price" DECIMAL(30,8),
    "high_price" DECIMAL(30,8),
    "low_price" DECIMAL(30,8),
    "close_price" DECIMAL(30,8),
    "volume" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."market_indicator" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "market_cap" DECIMAL(65,30),
    "pe_ratio" DECIMAL(65,30),
    "dividend_yield" DECIMAL(65,30),
    "investor_sentiment" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_indicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."risk_flag" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "flag_type" TEXT NOT NULL,
    "flag_value" INTEGER NOT NULL,
    "flagged_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_flag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."industry_code" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industry_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."import_export_data" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" TEXT,
    "total_import" DECIMAL(65,30),
    "total_export" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_export_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."government_tender" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "project_title" TEXT NOT NULL,
    "agency_name" TEXT,
    "award_date" TIMESTAMP(3),
    "award_amount" DECIMAL(65,30),
    "awarded" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "government_tender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trademark" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "image_url" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trademark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patent" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."financial_report" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "report_type" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."announcement" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."business_scope" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_scope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."news" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comment" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "user_name" TEXT,
    "user_avatar" TEXT,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "parent_id" INTEGER,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."import_log" (
    "id" SERIAL NOT NULL,
    "folder_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "total_count" INTEGER NOT NULL,
    "success_count" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_CompanyIndustry" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CompanyIndustry_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_registration_no_key" ON "public"."company"("registration_no");

-- CreateIndex
CREATE UNIQUE INDEX "company_relation_parent_reg_no_child_reg_no_key" ON "public"."company_relation"("parent_reg_no", "child_reg_no");

-- CreateIndex
CREATE UNIQUE INDEX "company_investor_company_id_investor_id_key" ON "public"."company_investor"("company_id", "investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "related_company_company_id_related_company_id_key" ON "public"."related_company"("company_id", "related_company_id");

-- CreateIndex
CREATE INDEX "stock_price_company_id_date_idx" ON "public"."stock_price"("company_id", "date");

-- CreateIndex
CREATE INDEX "market_indicator_company_id_date_idx" ON "public"."market_indicator"("company_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "industry_code_code_key" ON "public"."industry_code"("code");

-- CreateIndex
CREATE INDEX "financial_report_company_id_report_type_period_idx" ON "public"."financial_report"("company_id", "report_type", "period");

-- CreateIndex
CREATE INDEX "business_scope_company_id_code_idx" ON "public"."business_scope"("company_id", "code");

-- CreateIndex
CREATE INDEX "news_company_id_date_idx" ON "public"."news"("company_id", "date");

-- CreateIndex
CREATE INDEX "comment_company_id_created_at_idx" ON "public"."comment"("company_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "import_log_folder_path_file_name_key" ON "public"."import_log"("folder_path", "file_name");

-- CreateIndex
CREATE INDEX "_CompanyIndustry_B_index" ON "public"."_CompanyIndustry"("B");

-- AddForeignKey
ALTER TABLE "public"."company_relation" ADD CONSTRAINT "company_relation_parent_reg_no_fkey" FOREIGN KEY ("parent_reg_no") REFERENCES "public"."company"("registration_no") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_relation" ADD CONSTRAINT "company_relation_child_reg_no_fkey" FOREIGN KEY ("child_reg_no") REFERENCES "public"."company"("registration_no") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_investor" ADD CONSTRAINT "company_investor_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_investor" ADD CONSTRAINT "company_investor_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_history" ADD CONSTRAINT "company_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."related_company" ADD CONSTRAINT "related_company_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."related_company" ADD CONSTRAINT "related_company_related_company_id_fkey" FOREIGN KEY ("related_company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_price" ADD CONSTRAINT "stock_price_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."market_indicator" ADD CONSTRAINT "market_indicator_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."risk_flag" ADD CONSTRAINT "risk_flag_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."import_export_data" ADD CONSTRAINT "import_export_data_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."government_tender" ADD CONSTRAINT "government_tender_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trademark" ADD CONSTRAINT "trademark_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patent" ADD CONSTRAINT "patent_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."financial_report" ADD CONSTRAINT "financial_report_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcement" ADD CONSTRAINT "announcement_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."business_scope" ADD CONSTRAINT "business_scope_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."news" ADD CONSTRAINT "news_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comment" ADD CONSTRAINT "comment_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comment" ADD CONSTRAINT "comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CompanyIndustry" ADD CONSTRAINT "_CompanyIndustry_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CompanyIndustry" ADD CONSTRAINT "_CompanyIndustry_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."industry_code"("id") ON DELETE CASCADE ON UPDATE CASCADE;
