-- CreateEnum
CREATE TYPE "ActiveStatus" AS ENUM ('Online', 'DoNotDisturb', 'Idle', 'Offline');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildSettings" (
    "id" TEXT NOT NULL,
    "allUserRegister" BOOLEAN NOT NULL DEFAULT false,
    "voiceCount" BOOLEAN NOT NULL DEFAULT true,
    "messageCount" BOOLEAN NOT NULL DEFAULT false,
    "activityCount" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GuildSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceCount" (
    "time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channelName" TEXT NOT NULL DEFAULT '',
    "value" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MessageCount" (
    "time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
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
CREATE UNIQUE INDEX "VoiceCount_userId_guildId_time_key" ON "VoiceCount"("userId", "guildId", "time");

-- CreateIndex
CREATE INDEX "MessageCount_time_idx" ON "MessageCount"("time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "MessageCount_userId_guildId_time_key" ON "MessageCount"("userId", "guildId", "time");

-- CreateIndex
CREATE INDEX "ActivityCount_time_idx" ON "ActivityCount"("time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ActivityCount_userId_time_key" ON "ActivityCount"("userId", "time");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildSettings" ADD CONSTRAINT "GuildSettings_id_fkey" FOREIGN KEY ("id") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceCount" ADD CONSTRAINT "VoiceCount_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceCount" ADD CONSTRAINT "VoiceCount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageCount" ADD CONSTRAINT "MessageCount_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageCount" ADD CONSTRAINT "MessageCount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityCount" ADD CONSTRAINT "ActivityCount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
