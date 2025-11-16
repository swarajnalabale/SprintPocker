-- CreateTable
CREATE TABLE "retro_meetings" (
    "id" SERIAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retro_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retro_columns" (
    "id" SERIAL NOT NULL,
    "retro_meeting_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retro_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retro_items" (
    "id" SERIAL NOT NULL,
    "retro_meeting_id" INTEGER NOT NULL,
    "column_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retro_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "retro_columns" ADD CONSTRAINT "retro_columns_retro_meeting_id_fkey" FOREIGN KEY ("retro_meeting_id") REFERENCES "retro_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retro_items" ADD CONSTRAINT "retro_items_retro_meeting_id_fkey" FOREIGN KEY ("retro_meeting_id") REFERENCES "retro_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retro_items" ADD CONSTRAINT "retro_items_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "retro_columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
