-- CreateEnum
CREATE TYPE "public"."Board" AS ENUM ('LISTED', 'OTC');

-- DropIndex
DROP INDEX "public"."market_daily_price_market_date_symbol_idx";

-- AlterTable
ALTER TABLE "public"."market_daily_price" ADD COLUMN     "stock_symbol_id" INTEGER;

-- CreateTable
CREATE TABLE "public"."stock_symbol" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "board" "public"."Board" NOT NULL,
    "companyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_symbol_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_symbol_symbol_key" ON "public"."stock_symbol"("symbol");

-- CreateIndex
CREATE INDEX "market_daily_price_stock_symbol_id_idx" ON "public"."market_daily_price"("stock_symbol_id");

-- AddForeignKey
ALTER TABLE "public"."stock_symbol" ADD CONSTRAINT "stock_symbol_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."market_daily_price" ADD CONSTRAINT "market_daily_price_stock_symbol_id_fkey" FOREIGN KEY ("stock_symbol_id") REFERENCES "public"."stock_symbol"("id") ON DELETE SET NULL ON UPDATE CASCADE;
