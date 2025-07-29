-- CreateTable
CREATE TABLE "company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "registration_no" TEXT NOT NULL,
    "representative" TEXT,
    "registration_country" TEXT,
    "established_date" TIMESTAMP(3),
    "capital_amount" DECIMAL(65,30),
    "paid_in_capital" DECIMAL(65,30),
    "capital_ranking" INTEGER,
    "address" TEXT,
    "website_url" TEXT,
    "logo_url" TEXT,
    "last_update_time" TIMESTAMP(3),
    "registration_agency" TEXT,
    "status" TEXT,
    "organization_type" TEXT,
    "business_items" TEXT,
    "contributions" JSONB,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "shareholder_type" TEXT,

    CONSTRAINT "investor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_investor" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "investor_id" INTEGER NOT NULL,
    "position" TEXT,
    "share_ratio" DECIMAL(65,30),
    "representative_juridical_person" TEXT,
    "investment_date" TIMESTAMP(3),

    CONSTRAINT "company_investor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_history" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "change_date" TIMESTAMP(3) NOT NULL,
    "change_type" TEXT NOT NULL,
    "change_detail" JSONB NOT NULL,

    CONSTRAINT "company_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "related_company" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "related_company_id" INTEGER NOT NULL,
    "relation_type" TEXT,
    "related_business_id" TEXT,

    CONSTRAINT "related_company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_price" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "open_price" DECIMAL(65,30),
    "high_price" DECIMAL(65,30),
    "low_price" DECIMAL(65,30),
    "close_price" DECIMAL(65,30),
    "volume" INTEGER,

    CONSTRAINT "stock_price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_indicator" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "market_cap" DECIMAL(65,30),
    "pe_ratio" DECIMAL(65,30),
    "dividend_yield" DECIMAL(65,30),
    "investor_sentiment" JSONB,

    CONSTRAINT "market_indicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_flag" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "flag_type" TEXT NOT NULL,
    "flag_value" INTEGER NOT NULL,
    "flagged_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_flag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry_code" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "industry_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_export_data" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" TEXT,
    "total_import" DECIMAL(65,30),
    "total_export" DECIMAL(65,30),

    CONSTRAINT "import_export_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "government_tender" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "project_title" TEXT NOT NULL,
    "agency_name" TEXT,
    "award_date" TIMESTAMP(3),
    "award_amount" DECIMAL(65,30),
    "awarded" BOOLEAN,

    CONSTRAINT "government_tender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trademark" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "image_url" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "trademark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patent" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "patent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_report" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "report_type" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "financial_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" TEXT,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_scope" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "business_scope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "image_url" TEXT,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "user_name" TEXT,
    "user_avatar" TEXT,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "parent_id" INTEGER,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CompanyIndustry" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CompanyIndustry_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_registration_no_key" ON "company"("registration_no");

-- CreateIndex
CREATE UNIQUE INDEX "company_investor_company_id_investor_id_key" ON "company_investor"("company_id", "investor_id");

-- CreateIndex
CREATE UNIQUE INDEX "related_company_company_id_related_company_id_key" ON "related_company"("company_id", "related_company_id");

-- CreateIndex
CREATE INDEX "stock_price_company_id_date_idx" ON "stock_price"("company_id", "date");

-- CreateIndex
CREATE INDEX "market_indicator_company_id_date_idx" ON "market_indicator"("company_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "industry_code_code_key" ON "industry_code"("code");

-- CreateIndex
CREATE INDEX "financial_report_company_id_report_type_period_idx" ON "financial_report"("company_id", "report_type", "period");

-- CreateIndex
CREATE INDEX "business_scope_company_id_code_idx" ON "business_scope"("company_id", "code");

-- CreateIndex
CREATE INDEX "news_company_id_date_idx" ON "news"("company_id", "date");

-- CreateIndex
CREATE INDEX "Comment_company_id_created_at_idx" ON "Comment"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "_CompanyIndustry_B_index" ON "_CompanyIndustry"("B");

-- AddForeignKey
ALTER TABLE "company_investor" ADD CONSTRAINT "company_investor_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_investor" ADD CONSTRAINT "company_investor_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_history" ADD CONSTRAINT "company_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "related_company" ADD CONSTRAINT "related_company_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "related_company" ADD CONSTRAINT "related_company_related_company_id_fkey" FOREIGN KEY ("related_company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_price" ADD CONSTRAINT "stock_price_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_indicator" ADD CONSTRAINT "market_indicator_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_flag" ADD CONSTRAINT "risk_flag_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_export_data" ADD CONSTRAINT "import_export_data_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "government_tender" ADD CONSTRAINT "government_tender_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trademark" ADD CONSTRAINT "trademark_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patent" ADD CONSTRAINT "patent_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report" ADD CONSTRAINT "financial_report_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_scope" ADD CONSTRAINT "business_scope_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyIndustry" ADD CONSTRAINT "_CompanyIndustry_A_fkey" FOREIGN KEY ("A") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyIndustry" ADD CONSTRAINT "_CompanyIndustry_B_fkey" FOREIGN KEY ("B") REFERENCES "industry_code"("id") ON DELETE CASCADE ON UPDATE CASCADE;
