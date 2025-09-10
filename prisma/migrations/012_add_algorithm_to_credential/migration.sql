/*
  Warnings:

  - Added the required column `algorithm` to the `credential` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."credential" ADD COLUMN     "algorithm" INTEGER NOT NULL;
