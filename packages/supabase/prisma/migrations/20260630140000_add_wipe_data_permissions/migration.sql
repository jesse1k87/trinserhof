-- AlterEnum: new audit event emitted when the Rooms table is wiped from the
-- "Wipe data" page (mirrors the existing BOOKINGS_WIPED / CUSTOMERS_WIPED).
ALTER TYPE "AuditEvent" ADD VALUE 'ROOMS_WIPED';

-- Grant the existing OWNER role the new <ENTITY>:DELETE permissions that gate the
-- "Wipe data" page's buttons. The seed (prisma/seed.ts) only inserts roles that
-- are missing and never edits an existing row, so this backfill is needed for the
-- OWNER role already present in the database. Idempotent: each value is only
-- appended when not already granted.
UPDATE "Role"
SET "permissions" = array_append("permissions", 'BOOKING:DELETE')
WHERE "id" = 'OWNER' AND NOT ('BOOKING:DELETE' = ANY ("permissions"));

UPDATE "Role"
SET "permissions" = array_append("permissions", 'CUSTOMER:DELETE')
WHERE "id" = 'OWNER' AND NOT ('CUSTOMER:DELETE' = ANY ("permissions"));

UPDATE "Role"
SET "permissions" = array_append("permissions", 'ROOM:DELETE')
WHERE "id" = 'OWNER' AND NOT ('ROOM:DELETE' = ANY ("permissions"));
