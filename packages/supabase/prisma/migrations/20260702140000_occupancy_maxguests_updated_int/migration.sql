-- AlterTable: narrow occupancy from a float to a whole-number count.
ALTER TABLE "Occupancy" ALTER COLUMN "occupancy" TYPE INTEGER USING ROUND("occupancy"::numeric)::integer;

-- AlterTable: add maxGuests, backfilled to 0 for existing rows so the column
-- can be made required without a default.
ALTER TABLE "Occupancy" ADD COLUMN "maxGuests" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Occupancy" ALTER COLUMN "maxGuests" DROP DEFAULT;

-- AlterTable: add updated, backfilled to the row's own date for existing rows
-- so the column can be made required without a default.
ALTER TABLE "Occupancy" ADD COLUMN "updated" DATE NOT NULL DEFAULT CURRENT_DATE;
UPDATE "Occupancy" SET "updated" = "date";
ALTER TABLE "Occupancy" ALTER COLUMN "updated" DROP DEFAULT;
