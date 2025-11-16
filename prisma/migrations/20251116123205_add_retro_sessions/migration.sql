-- AlterTable
ALTER TABLE "retro_meetings" ADD COLUMN     "retro_session_id" INTEGER;

-- CreateTable
CREATE TABLE "retro_sessions" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "admin_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retro_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "retro_sessions_session_id_key" ON "retro_sessions"("session_id");

-- AddForeignKey
ALTER TABLE "retro_meetings" ADD CONSTRAINT "retro_meetings_retro_session_id_fkey" FOREIGN KEY ("retro_session_id") REFERENCES "retro_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
