/*
  Warnings:

  - You are about to drop the column `blockchain_public_key` on the `identity_account` table. All the data in the column will be lost.
  - You are about to drop the column `encrypted_blockchain_key` on the `identity_account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."authenticator" ADD COLUMN     "label" TEXT;

-- AlterTable
ALTER TABLE "public"."device_pairing_session" ADD COLUMN     "pending_candidate_data" JSONB;

-- AlterTable
ALTER TABLE "public"."identity_account" DROP COLUMN "blockchain_public_key",
DROP COLUMN "encrypted_blockchain_key",
ADD COLUMN     "deployment_salt" TEXT DEFAULT '0',
ADD COLUMN     "init_public_key" JSONB;
