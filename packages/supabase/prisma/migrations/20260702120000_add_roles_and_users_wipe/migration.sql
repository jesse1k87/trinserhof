-- AlterEnum: new audit event emitted when the Role/User tables are wiped from
-- the "Wipe data" page (mirrors the existing BOOKINGS_WIPED / CUSTOMERS_WIPED /
-- ROOMS_WIPED).
ALTER TYPE "AuditEvent" ADD VALUE 'ROLES_AND_USERS_WIPED';

-- Grant the existing OWNER role the new <ENTITY>:DELETE permissions that gate the
-- "Wipe data" page's new "Roles & users" button. The seed (prisma/seed.ts) only
-- inserts roles that are missing and never edits an existing row, so this
-- backfill is needed for the OWNER role already present in the database.
-- Idempotent: each value is only appended when not already granted.
UPDATE "Role"
SET "permissions" = array_append("permissions", 'ROLE:DELETE')
WHERE "id" = 'OWNER' AND NOT ('ROLE:DELETE' = ANY ("permissions"));

UPDATE "Role"
SET "permissions" = array_append("permissions", 'USER:DELETE')
WHERE "id" = 'OWNER' AND NOT ('USER:DELETE' = ANY ("permissions"));
