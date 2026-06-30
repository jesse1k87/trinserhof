-- AlterEnum
ALTER TYPE "AuditEvent" ADD VALUE 'PROPERTY_CREATED';
ALTER TYPE "AuditEvent" ADD VALUE 'PROPERTY_UPDATED';

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "checkInTime" TEXT NOT NULL,
    "checkOutTime" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "cityTaxPerPersonPerNight" DOUBLE PRECISION NOT NULL,
    "taxRegistryNumber" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "bic" TEXT NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- Seed the default property up front so existing rooms can be backfilled with a
-- valid foreign key before the relation is made mandatory. This is idempotent:
-- the canonical fixture lives in prisma/seed.ts, which leaves an existing row
-- untouched, so editing the property in the app is never overwritten.
INSERT INTO "Property" (
    "id", "name", "legalName", "website", "phone", "checkInTime", "checkOutTime",
    "address", "cityTaxPerPersonPerNight", "taxRegistryNumber", "iban", "bic"
) VALUES (
    'HOTEL_TRINSERHOF', 'Hotel Trinserhof', 'Hotel Trinserhof GmbH',
    'https://www.trinserhof.at', '+43 5275 0000', '15:00', '10:00',
    'Trins 1, 6152 Trins, Austria', 2.6, 'ATU00000000',
    'AT00 0000 0000 0000 0000', 'XXXXATWW'
) ON CONFLICT ("id") DO NOTHING;

-- AlterTable: add the mandatory propertyId. Existing rooms are backfilled with
-- the default property via a temporary default that is then dropped, so the
-- column matches the schema (no default) afterwards.
ALTER TABLE "Room" ADD COLUMN "propertyId" TEXT NOT NULL DEFAULT 'HOTEL_TRINSERHOF';
ALTER TABLE "Room" ALTER COLUMN "propertyId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
