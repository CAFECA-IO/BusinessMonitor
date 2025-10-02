-- CreateEnum
CREATE TYPE "public"."PairingStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."device_pairing_session" (
    "id" TEXT NOT NULL,
    "status" "public"."PairingStatus" NOT NULL DEFAULT 'PENDING',
    "challenge" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "identityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_pairing_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "device_pairing_session_expiresAt_idx" ON "public"."device_pairing_session"("expiresAt");
