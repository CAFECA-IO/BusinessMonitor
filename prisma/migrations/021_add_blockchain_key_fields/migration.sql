-- AlterTable
ALTER TABLE "public"."identity_account" ADD COLUMN     "blockchain_address" TEXT,
ADD COLUMN     "blockchain_public_key" TEXT,
ADD COLUMN     "derivation_nonce" TEXT,
ADD COLUMN     "encrypted_blockchain_key" TEXT;
