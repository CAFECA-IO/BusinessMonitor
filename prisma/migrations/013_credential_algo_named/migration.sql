/*
  Warnings:

  - You are about to drop the column `algorithm` on the `credential` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."WebAuthnAlgo" AS ENUM ('ES256', 'RS256', 'EdDSA');

-- AlterTable
ALTER TABLE "public"."credential" DROP COLUMN "algorithm",
ADD COLUMN     "algorithm_named" "public"."WebAuthnAlgo" NOT NULL DEFAULT 'ES256',
ADD COLUMN     "public_key_alg" INTEGER;
