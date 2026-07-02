-- RenameTable
ALTER TABLE "RoomTypeOccupancy" RENAME TO "Occupancy";
ALTER TABLE "Occupancy" RENAME CONSTRAINT "RoomTypeOccupancy_pkey" TO "Occupancy_pkey";
ALTER TABLE "Occupancy" RENAME CONSTRAINT "RoomTypeOccupancy_roomTypeId_fkey" TO "Occupancy_roomTypeId_fkey";
ALTER INDEX "RoomTypeOccupancy_roomTypeId_date_key" RENAME TO "Occupancy_roomTypeId_date_key";

-- AlterTable: widen occupancy from a fixed-point Decimal(5,2) to a float.
ALTER TABLE "Occupancy" ALTER COLUMN "occupancy" TYPE DOUBLE PRECISION USING "occupancy"::double precision;
