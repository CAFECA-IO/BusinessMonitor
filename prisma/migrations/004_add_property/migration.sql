/*
  Warnings:

  - You are about to drop the column `name` on the `patent` table. All the data in the column will be lost.
  - Added the required column `date` to the `patent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `patent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."patent" DROP COLUMN "name",
ADD COLUMN     "application_no" TEXT,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "kind" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."trademark" ADD COLUMN     "application_no" TEXT,
ADD COLUMN     "status" TEXT;
