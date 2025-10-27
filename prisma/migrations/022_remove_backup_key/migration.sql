/*
  Warnings:

  - You are about to drop the column `backup_key_hash` on the `identity_account` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."identity_account_backup_key_hash_key";

-- AlterTable
ALTER TABLE "public"."identity_account" DROP COLUMN "backup_key_hash";
