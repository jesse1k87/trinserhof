-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('light', 'dark');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingOrigin" AS ENUM ('AIRBNB', 'BOOKING_COM', 'EMAIL', 'IN_PERSON', 'JESSE', 'PHONE', 'UNKNOWN', 'WEBSITE_FORM', 'WEBSITE_FORM_MEWS');

-- CreateEnum
CREATE TYPE "AuditEvent" AS ENUM ('LOGIN', 'LOGOUT', 'BOOKING_CREATED', 'BOOKING_UPDATED', 'BOOKING_RESTORED', 'CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'CUSTOMERS_MERGED', 'INVOICE_CREATED', 'INVOICE_UPDATED', 'ROLE_CREATED', 'ROLE_UPDATED', 'ROOM_CREATED', 'ROOM_UPDATED', 'ROOM_TYPE_CREATED', 'ROOM_TYPE_UPDATED', 'PRICE_BASE_UPDATED', 'PRICE_OVERRIDE_SET', 'PRICE_OVERRIDE_REMOVED', 'TABLE_CREATED', 'TABLE_UPDATED', 'TABLE_RESERVATION_CREATED', 'TABLE_RESERVATION_UPDATED', 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_RESTORED', 'ACCOUNTING_CATEGORY_CREATED', 'ACCOUNTING_CATEGORY_UPDATED', 'ACCOUNTING_CATEGORY_RESTORED', 'MIGRATE_LEGACY_BOOKINGS', 'BOOKINGS_WIPED', 'BOOKINGS_IMPORTED', 'CUSTOMERS_WIPED');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[],

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'BLOCKED',
    "image" TEXT,
    "theme" "Theme",

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origin" "BookingOrigin" NOT NULL DEFAULT 'UNKNOWN',
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "checkIn" DATE NOT NULL,
    "checkOut" DATE NOT NULL,
    "cancelled" TIMESTAMP(3),
    "confirmed" TIMESTAMP(3),
    "checkedIn" TIMESTAMP(3),
    "checkedOut" TIMESTAMP(3),
    "roomId" TEXT NOT NULL,
    "customers" TEXT[],
    "adults" INTEGER NOT NULL,
    "children" INTEGER NOT NULL,
    "pets" INTEGER NOT NULL,
    "pricePerNight" DOUBLE PRECISION,
    "note" TEXT NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogEntry" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "event" "AuditEvent" NOT NULL,
    "timestamp" BIGINT NOT NULL,

    CONSTRAINT "AuditLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "created" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" DATE,
    "nationality" TEXT,
    "language" TEXT,
    "street" TEXT,
    "streetNumber" TEXT,
    "postcode" TEXT,
    "city" TEXT,
    "country" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "created" DATE NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookingIds" TEXT[],
    "products" JSONB NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "accountingCategoryId" TEXT NOT NULL,
    "variants" JSONB,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxRate" INTEGER NOT NULL,
    "ledgerCode" INTEGER NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "AccountingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantTable" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "areaName" TEXT NOT NULL,
    "maxGuests" INTEGER NOT NULL,

    CONSTRAINT "RestaurantTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantReservation" (
    "id" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "numberOfPeople" INTEGER NOT NULL,
    "tableId" TEXT,
    "customerId" TEXT,

    CONSTRAINT "RestaurantReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomType" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "maxCustomers" INTEGER NOT NULL,
    "floor" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "balcony" BOOLEAN,
    "tv" BOOLEAN,
    "shower" BOOLEAN,
    "bathtub" BOOLEAN,
    "toilet" BOOLEAN,
    "phone" BOOLEAN,
    "desk" BOOLEAN,
    "mountainView" BOOLEAN,
    "kingBed" INTEGER,
    "queenBed" INTEGER,
    "singleBed" INTEGER,
    "sleepSofa" INTEGER,
    "spaces" INTEGER,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Price" (
    "id" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "date" DATE,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Price_roomTypeId_date_key" ON "Price"("roomTypeId", "date");
