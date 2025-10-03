/*
  Warnings:

  - You are about to drop the column `stock_symbol_id` on the `market_daily_price` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."market_daily_price" DROP CONSTRAINT "market_daily_price_stock_symbol_id_fkey";

-- DropIndex
DROP INDEX "public"."market_daily_price_stock_symbol_id_idx";

-- AlterTable
ALTER TABLE "public"."market_daily_price" DROP COLUMN "stock_symbol_id";

-- CreateIndex
CREATE INDEX "market_daily_price_symbol_idx" ON "public"."market_daily_price"("symbol");

-- AddForeignKey
ALTER TABLE "public"."market_daily_price" ADD CONSTRAINT "market_daily_price_symbol_fkey" FOREIGN KEY ("symbol") REFERENCES "public"."stock_symbol"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;
