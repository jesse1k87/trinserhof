-- Rename Price.amount -> Price.base: this column has only ever held the
-- per-night override amount (the base price per room type lives on
-- RoomType.basePrice), so "base" is a clearer name for what it stores.
ALTER TABLE "Price" RENAME COLUMN "amount" TO "base";

-- AlterTable: signed adjustment on top of "base", defaulting existing rows to
-- no markup.
ALTER TABLE "Price" ADD COLUMN "markup" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AddForeignKey: roomTypeId now references RoomType directly instead of being
-- a loose string.
ALTER TABLE "Price" ADD CONSTRAINT "Price_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
