-- CreateEnum
CREATE TYPE "ActiveStatus" AS ENUM ('Online', 'DoNotDisturb', 'Idle', 'Offline');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceCount" (
    "time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channelName" TEXT NOT NULL DEFAULT '',
    "value" INTEGER NOT NULL,
    "userId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MessageCount" (
    "time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "count" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "ActivityCount" (
    "time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "status" "ActiveStatus" NOT NULL
);

-- CreateIndex
CREATE INDEX "VoiceCount_time_idx" ON "VoiceCount"("time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "VoiceCount_userId_time_key" ON "VoiceCount"("userId", "time");

-- CreateIndex
CREATE INDEX "MessageCount_time_idx" ON "MessageCount"("time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "MessageCount_userId_time_key" ON "MessageCount"("userId", "time");

-- CreateIndex
CREATE INDEX "ActivityCount_time_idx" ON "ActivityCount"("time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ActivityCount_userId_time_key" ON "ActivityCount"("userId", "time");

-- AddForeignKey
ALTER TABLE "VoiceCount" ADD CONSTRAINT "VoiceCount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageCount" ADD CONSTRAINT "MessageCount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityCount" ADD CONSTRAINT "ActivityCount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
