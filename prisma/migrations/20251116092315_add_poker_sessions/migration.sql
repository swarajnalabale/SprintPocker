-- AlterTable
ALTER TABLE "stories" ADD COLUMN     "poker_session_id" INTEGER;

-- CreateTable
CREATE TABLE "poker_sessions" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "admin_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poker_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "poker_sessions_session_id_key" ON "poker_sessions"("session_id");

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_poker_session_id_fkey" FOREIGN KEY ("poker_session_id") REFERENCES "poker_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
