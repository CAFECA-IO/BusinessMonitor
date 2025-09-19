/*
  Warnings:

  - You are about to drop the `credential` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `user_id` on table `comment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."comment" DROP CONSTRAINT "comment_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."credential" DROP CONSTRAINT "credential_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."comment" ALTER COLUMN "user_id" SET NOT NULL;

-- DropTable
DROP TABLE "public"."credential";

-- DropTable
DROP TABLE "public"."user";

-- CreateTable
CREATE TABLE "public"."IdentityAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photo" TEXT,
    "ethereum_address" TEXT NOT NULL,
    "encrypted_private_key" TEXT NOT NULL,
    "backup_key_hash" TEXT,

    CONSTRAINT "IdentityAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Authenticator" (
    "id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "identity_account_id" TEXT NOT NULL,
    "credential_public_key" TEXT NOT NULL,
    "counter" BIGINT NOT NULL,
    "algorithm" "public"."WebAuthnAlgo" NOT NULL DEFAULT 'ES256',

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityAccount_ethereum_address_key" ON "public"."IdentityAccount"("ethereum_address");

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_credential_id_key" ON "public"."Authenticator"("credential_id");

-- AddForeignKey
ALTER TABLE "public"."comment" ADD CONSTRAINT "comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."IdentityAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Authenticator" ADD CONSTRAINT "Authenticator_identity_account_id_fkey" FOREIGN KEY ("identity_account_id") REFERENCES "public"."IdentityAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
