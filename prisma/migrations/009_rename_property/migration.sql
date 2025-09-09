/*
  Warnings:

  - You are about to drop the column `companyId` on the `stock_symbol` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `stock_symbol` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `stock_symbol` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `stock_symbol` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."stock_symbol" DROP CONSTRAINT "stock_symbol_companyId_fkey";

-- AlterTable
ALTER TABLE "public"."stock_symbol" DROP COLUMN "companyId",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "company_id" INTEGER,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."stock_symbol" ADD CONSTRAINT "stock_symbol_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
