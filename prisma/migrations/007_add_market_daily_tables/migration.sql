-- CreateTable
CREATE TABLE "public"."market_daily_price" (
    "id" SERIAL NOT NULL,
    "market" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "trade_volume" BIGINT,
    "trade_value" DECIMAL(30,0),
    "trade_count" INTEGER,
    "open_price" DECIMAL(20,4),
    "high_price" DECIMAL(20,4),
    "low_price" DECIMAL(20,4),
    "close_price" DECIMAL(20,4),
    "change_sign" TEXT,
    "change_amount" DECIMAL(20,4),
    "final_bid_price" DECIMAL(20,4),
    "final_bid_volume" BIGINT,
    "final_ask_price" DECIMAL(20,4),
    "final_ask_volume" BIGINT,
    "pe_ratio" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_daily_price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."market_daily_summary" (
    "id" SERIAL NOT NULL,
    "market" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "trade_value" DECIMAL(30,0),
    "trade_volume" BIGINT,
    "trade_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_daily_summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_daily_price_market_date_symbol_idx" ON "public"."market_daily_price"("market", "date", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "market_daily_price_market_date_symbol_key" ON "public"."market_daily_price"("market", "date", "symbol");

-- CreateIndex
CREATE INDEX "market_daily_summary_market_date_category_idx" ON "public"."market_daily_summary"("market", "date", "category");

-- CreateIndex
CREATE UNIQUE INDEX "market_daily_summary_market_date_category_key" ON "public"."market_daily_summary"("market", "date", "category");
