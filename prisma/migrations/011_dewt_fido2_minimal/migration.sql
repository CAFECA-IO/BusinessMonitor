/*
  Warnings:

  - You are about to drop the `login_ticket` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."login_ticket" DROP CONSTRAINT "login_ticket_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."comment" ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "public"."credential" ADD COLUMN     "device_note" TEXT,
ADD COLUMN     "rp_id" TEXT,
ADD COLUMN     "transports" TEXT;

-- DropTable
DROP TABLE "public"."login_ticket";

-- CreateIndex
CREATE INDEX "idx_credential_user" ON "public"."credential"("user_id");

-- CreateIndex
CREATE INDEX "idx_credential_credidhash" ON "public"."credential"("cred_id_hash");

-- AddForeignKey
ALTER TABLE "public"."comment" ADD CONSTRAINT "comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
