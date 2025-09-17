/*
  Warnings:

  - You are about to drop the `Authenticator` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IdentityAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Authenticator" DROP CONSTRAINT "Authenticator_identity_account_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."comment" DROP CONSTRAINT "comment_user_id_fkey";

-- DropTable
DROP TABLE "public"."Authenticator";

-- DropTable
DROP TABLE "public"."IdentityAccount";

-- CreateTable
CREATE TABLE "public"."identity_account" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "photo" TEXT,
    "ethereum_address" TEXT NOT NULL,
    "encrypted_private_key" TEXT NOT NULL,
    "backup_key_hash" TEXT,

    CONSTRAINT "identity_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."authenticator" (
    "id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "credential_public_key" TEXT NOT NULL,
    "identity_account_id" TEXT NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "algorithm" "public"."WebAuthnAlgo" NOT NULL DEFAULT 'ES256',
    "user_handle" TEXT NOT NULL,

    CONSTRAINT "authenticator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "identity_account_ethereum_address_key" ON "public"."identity_account"("ethereum_address");

-- CreateIndex
CREATE UNIQUE INDEX "authenticator_credential_id_key" ON "public"."authenticator"("credential_id");

-- CreateIndex
CREATE UNIQUE INDEX "authenticator_user_handle_key" ON "public"."authenticator"("user_handle");

-- AddForeignKey
ALTER TABLE "public"."comment" ADD CONSTRAINT "comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."identity_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."authenticator" ADD CONSTRAINT "authenticator_identity_account_id_fkey" FOREIGN KEY ("identity_account_id") REFERENCES "public"."identity_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
