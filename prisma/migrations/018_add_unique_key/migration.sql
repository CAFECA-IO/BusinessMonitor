/*
  Warnings:

  - A unique constraint covering the columns `[backup_key_hash]` on the table `identity_account` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "identity_account_backup_key_hash_key" ON "public"."identity_account"("backup_key_hash");
