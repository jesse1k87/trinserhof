-- AlterTable: add the new email field. Backfilled with the seeded address for
-- existing rows so the column can be made required without a default,
-- matching the rest of the Property model's required text fields.
ALTER TABLE "Property" ADD COLUMN "email" TEXT NOT NULL DEFAULT '';
UPDATE "Property" SET "email" = 'info@trinserhof.at' WHERE "id" = 'HOTEL_TRINSERHOF' AND "email" = '';
ALTER TABLE "Property" ALTER COLUMN "email" DROP DEFAULT;
