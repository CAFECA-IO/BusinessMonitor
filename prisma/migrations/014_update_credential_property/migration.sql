/*
  Warnings:

  - You are about to drop the column `algorithm_named` on the `credential` table. All the data in the column will be lost.
  - You are about to drop the column `counter` on the `credential` table. All the data in the column will be lost.
  - You are about to drop the column `public_key_alg` on the `credential` table. All the data in the column will be lost.
  - Added the required column `algorithm` to the `credential` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."credential" DROP COLUMN "algorithm_named",
DROP COLUMN "counter",
DROP COLUMN "public_key_alg",
ADD COLUMN     "algorithm" "public"."WebAuthnAlgo" NOT NULL;

-- AlterTable
ALTER TABLE "public"."user" ALTER COLUMN "email" DROP NOT NULL;
