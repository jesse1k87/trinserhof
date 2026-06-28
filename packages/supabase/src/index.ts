import { PrismaClient, Prisma, type BookingStatus as PrismaBookingStatus } from '@prisma/client';
import {
  type AccountingCategory,
  type AuditEvent,
  type Booking,
  type Customer,
  type Invoice,
  type Product,
  type RestaurantReservation,
  type RestaurantTable,
  type Room,
  type RoomTypeId,
  priceAmountSchema,
} from '@trinserhof/types';
import {
  getAccountingCategoryValidationErrors,
  getBookingValidationErrors,
  getCustomerValidationErrors,
  getInvoiceValidationErrors,
  getProductValidationErrors,
  getRestaurantReservationValidationErrors,
  getRoomValidationErrors,
  getTableValidationErrors,
  mergeCustomerFields,
  uuidv4,
} from '@trinserhof/helpers';

export * from '@prisma/client';

let db: PrismaClient | undefined;

export const getDb = () => {
  if (!db) {
    db = new PrismaClient();
  }
  return db;
};

const toBookingData = (booking: Booking) => ({
  id: booking.id,
  created: new Date(booking.created),
  origin: booking.origin,
  status: booking.status as PrismaBookingStatus,
  checkIn: new Date(booking.checkIn),
  checkOut: new Date(booking.checkOut),
  cancelled: booking.cancelled ? new Date(booking.cancelled) : null,
  confirmed: booking.confirmed ? new Date(booking.confirmed) : null,
  checkedIn: booking.checkedIn ? new Date(booking.checkedIn) : null,
  checkedOut: booking.checkedOut ? new Date(booking.checkedOut) : null,
  roomId: booking.roomId,
  customers: booking.customers,
  adults: booking.adults,
  children: booking.children,
  pets: booking.pets,
  pricePerNight: booking.pricePerNight ?? null,
});

export const saveBooking = async (booking: Booking) => {
  if (!booking.id) {
    booking.id = uuidv4();
  }

  const validationErrors = getBookingValidationErrors(booking);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid booking data: ${validationErrors.join(', ')}`);
  }

  const data = toBookingData(booking);
  await getDb().booking.upsert({ where: { id: booking.id }, create: data, update: data });
  return booking;
};

const toCustomerData = (customer: Customer) => ({
  id: customer.id,
  created: new Date(customer.created),
  name: customer.name,
  surname: customer.surname ?? null,
  email: customer.email ?? null,
  phone: customer.phone ?? null,
  dateOfBirth: customer.dateOfBirth ? new Date(customer.dateOfBirth) : null,
  nationality: customer.nationality ?? null,
  language: customer.language ?? null,
  street: customer.street ?? null,
  streetNumber: customer.streetNumber ?? null,
  postcode: customer.postcode ?? null,
  city: customer.city ?? null,
  country: customer.country ?? null,
});

export const saveCustomer = async (customer: Customer) => {
  if (!customer.id) {
    customer.id = uuidv4();
  }

  const validationErrors = getCustomerValidationErrors(customer);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid customer data: ${validationErrors.join(', ')}`);
  }

  const data = toCustomerData(customer);
  await getDb().customer.upsert({ where: { id: customer.id }, create: data, update: data });
  return customer;
};

export type MergeCustomersResult = {
  survivor: Customer;
  bookingsUpdated: number;
  restaurantReservationsUpdated: number;
};

// Merges `secondary` into `primary`. The surviving record keeps `primary`'s id and
// fills any of its empty fields from `secondary` (see `mergeCustomerFields`). Every
// reference to `secondary`'s id elsewhere in the database — bookings' `customers`
// arrays and table reservations' `customerId` — is repointed at `primary`'s id, and
// `secondary` is deleted. Everything runs in a single transaction so the merge is
// atomic: callers never observe a dangling reference to the removed customer.
export const mergeCustomers = async (
  primary: Customer,
  secondary: Customer,
): Promise<MergeCustomersResult> => {
  if (primary.id === secondary.id) {
    throw new Error('Cannot merge a customer into itself.');
  }

  const survivor = mergeCustomerFields(primary, secondary);

  const validationErrors = getCustomerValidationErrors(survivor);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid customer data: ${validationErrors.join(', ')}`);
  }

  return getDb().$transaction(async (tx) => {
    await tx.customer.update({ where: { id: survivor.id }, data: toCustomerData(survivor) });

    const affectedBookings = await tx.booking.findMany({
      where: { customers: { has: secondary.id } },
    });
    for (const booking of affectedBookings) {
      const repointed = booking.customers.map((id) => (id === secondary.id ? primary.id : id));
      // De-dupe in case the booking already referenced the surviving customer too.
      const deduped = repointed.filter((id, index) => repointed.indexOf(id) === index);
      await tx.booking.update({ where: { id: booking.id }, data: { customers: deduped } });
    }

    const { count: restaurantReservationsUpdated } = await tx.restaurantReservation.updateMany({
      where: { customerId: secondary.id },
      data: { customerId: primary.id },
    });

    await tx.customer.delete({ where: { id: secondary.id } });

    return { survivor, bookingsUpdated: affectedBookings.length, restaurantReservationsUpdated };
  });
};

const toInvoiceData = (invoice: Invoice) => ({
  id: invoice.id,
  number: invoice.number,
  created: new Date(invoice.created),
  customerId: invoice.customerId,
  bookingIds: invoice.bookingIds,
  products: invoice.products as unknown as Prisma.InputJsonValue,
  notes: invoice.notes ?? null,
});

export const saveInvoice = async (invoice: Invoice) => {
  if (!invoice.id) {
    invoice.id = uuidv4();
  }

  const validationErrors = getInvoiceValidationErrors(invoice);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid invoice data: ${validationErrors.join(', ')}`);
  }

  const data = toInvoiceData(invoice);
  await getDb().invoice.upsert({ where: { id: invoice.id }, create: data, update: data });
  return invoice;
};

const toProductData = (product: Product) => ({
  id: product.id,
  name: product.name,
  price: product.price,
  accountingCategoryId: product.accountingCategoryId,
  variants: product.variants
    ? (product.variants as unknown as Prisma.InputJsonValue)
    : Prisma.DbNull,
});

export const saveProduct = async (product: Product) => {
  if (!product.id) {
    product.id = uuidv4();
  }

  const validationErrors = getProductValidationErrors(product);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid product data: ${validationErrors.join(', ')}`);
  }

  const data = toProductData(product);
  await getDb().product.upsert({ where: { id: product.id }, create: data, update: data });
  return product;
};

const toAccountingCategoryData = (category: AccountingCategory) => ({
  id: category.id,
  name: category.name,
  taxRate: category.taxRate,
  ledgerCode: category.ledgerCode,
  color: category.color,
});

export const saveAccountingCategory = async (category: AccountingCategory) => {
  if (!category.id) {
    category.id = uuidv4();
  }

  const validationErrors = getAccountingCategoryValidationErrors(category);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid accounting category data: ${validationErrors.join(', ')}`);
  }

  const data = toAccountingCategoryData(category);
  await getDb().accountingCategory.upsert({
    where: { id: category.id },
    create: data,
    update: data,
  });
  return category;
};

const toRoomData = (room: Room) => ({
  id: room.id,
  type: room.type,
  maxCustomers: room.maxCustomers,
  floor: room.floor,
  color: room.color,
  balcony: room.balcony ?? null,
  tv: room.tv ?? null,
  shower: room.shower ?? null,
  bathtub: room.bathtub ?? null,
  toilet: room.toilet ?? null,
  phone: room.phone ?? null,
  desk: room.desk ?? null,
  mountainView: room.mountainView ?? null,
  kingBed: room.kingBed ?? null,
  queenBed: room.queenBed ?? null,
  singleBed: room.singleBed ?? null,
  sleepSofa: room.sleepSofa ?? null,
  spaces: room.spaces ?? null,
});

export const saveRoom = async (room: Room) => {
  const validationErrors = getRoomValidationErrors(room);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid room data: ${validationErrors.join(', ')}`);
  }

  const data = toRoomData(room);
  await getDb().room.upsert({ where: { id: room.id }, create: data, update: data });
  return room;
};

// Pricing is keyed by room *type* (and by night), not by individual room: a base
// price (no override for that night) is stored as a `Price` row with a null
// `date`, and an override is a row with that night's date. The `(roomTypeId,
// date)` pair is meant to be unique, but Prisma's generated compound-unique
// lookup helper doesn't accept `null` for `date`, so reads/writes here go through
// a plain `findFirst`/`create`/`update` instead of `upsert`.
const assertValidPriceAmount = (price: number) => {
  const result = priceAmountSchema.safeParse(price);
  if (!result.success) {
    throw new Error(`Invalid price data: ${result.error.issues.map((i) => i.message).join(', ')}`);
  }
};

const upsertPrice = async (roomTypeId: RoomTypeId, date: Date | null, amount: number) => {
  const existing = await getDb().price.findFirst({ where: { roomTypeId, date } });
  if (existing) {
    await getDb().price.update({ where: { id: existing.id }, data: { amount } });
  } else {
    await getDb().price.create({ data: { roomTypeId, date, amount } });
  }
};

export const saveBasePrice = async (roomType: RoomTypeId, price: number) => {
  assertValidPriceAmount(price);
  await upsertPrice(roomType, null, price);
};

export const savePriceOverride = async (date: string, roomType: RoomTypeId, price: number) => {
  assertValidPriceAmount(price);
  await upsertPrice(roomType, new Date(date), price);
};

export const deletePriceOverride = async (date: string, roomType: RoomTypeId) => {
  await getDb().price.deleteMany({ where: { roomTypeId: roomType, date: new Date(date) } });
};

const toTableData = (table: RestaurantTable) => ({
  id: table.id,
  number: table.number,
  areaName: table.areaName,
  maxGuests: table.maxGuests,
});

export const saveTable = async (table: RestaurantTable) => {
  if (!table.id) {
    table.id = uuidv4();
  }

  const validationErrors = getTableValidationErrors(table);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid table data: ${validationErrors.join(', ')}`);
  }

  const data = toTableData(table);
  await getDb().restaurantTable.upsert({ where: { id: table.id }, create: data, update: data });
  return table;
};

export const deleteTable = async (tableId: string) => {
  await getDb().restaurantTable.deleteMany({ where: { id: tableId } });
};

const toRestaurantReservationData = (restaurantReservation: RestaurantReservation) => ({
  id: restaurantReservation.id,
  start: new Date(restaurantReservation.start),
  numberOfPeople: restaurantReservation.numberOfPeople,
  tableId: restaurantReservation.tableId ?? null,
  customerId: restaurantReservation.customerId ?? null,
});

export const saveRestaurantReservation = async (restaurantReservation: RestaurantReservation) => {
  if (!restaurantReservation.id) {
    restaurantReservation.id = uuidv4();
  }

  const validationErrors = getRestaurantReservationValidationErrors(restaurantReservation);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid table reservation data: ${validationErrors.join(', ')}`);
  }

  const data = toRestaurantReservationData(restaurantReservation);
  await getDb().restaurantReservation.upsert({
    where: { id: restaurantReservation.id },
    create: data,
    update: data,
  });
  return restaurantReservation;
};

export const deleteRestaurantReservation = async (restaurantReservationId: string) => {
  await getDb().restaurantReservation.deleteMany({ where: { id: restaurantReservationId } });
};

export const logAuditEvent = async (event: AuditEvent, email?: string | null) => {
  if (!email) return;
  try {
    await getDb().auditLogEntry.create({ data: { email, event, timestamp: Date.now() } });
  } catch (error) {
    console.error(error);
  }
};

export type WipeBookingsResult = {
  bookingsDeleted: number;
  restaurantReservationsDeleted: number;
  auditLogEntriesDeleted: number;
};

export const wipeBookings = async (actorEmail?: string | null): Promise<WipeBookingsResult> => {
  const [bookingsDeleted, restaurantReservationsDeleted, auditLogEntriesDeleted] =
    await getDb().$transaction([
      getDb().booking.deleteMany(),
      getDb().restaurantReservation.deleteMany(),
      getDb().auditLogEntry.deleteMany(),
    ]);

  await logAuditEvent('BOOKINGS_WIPED', actorEmail);

  return {
    bookingsDeleted: bookingsDeleted.count,
    restaurantReservationsDeleted: restaurantReservationsDeleted.count,
    auditLogEntriesDeleted: auditLogEntriesDeleted.count,
  };
};

export type WipeCustomersResult = {
  customersDeleted: number;
};

export const wipeCustomers = async (actorEmail?: string | null): Promise<WipeCustomersResult> => {
  const { count } = await getDb().customer.deleteMany();
  await logAuditEvent('CUSTOMERS_WIPED', actorEmail);
  return { customersDeleted: count };
};

export type ImportBookingsResult = {
  imported: number;
  skipped: Array<{ id: string; errors: string[] }>;
};

// Bulk-imports bookings, overwriting any booking whose id already exists, in
// chunks of 500 (one transaction per chunk rather than one per booking). Records
// that fail validation are skipped and returned so the caller can report them
// instead of aborting the whole import.
export const importBookings = async (
  bookings: Booking[],
  actorEmail?: string | null,
): Promise<ImportBookingsResult> => {
  const valid: Booking[] = [];
  const skipped: Array<{ id: string; errors: string[] }> = [];

  for (const booking of bookings) {
    if (!booking.id) {
      booking.id = uuidv4();
    }
    const errors = getBookingValidationErrors(booking);
    if (errors.length > 0) {
      skipped.push({ id: booking.id || '(no id)', errors });
    } else {
      valid.push(booking);
    }
  }

  const CHUNK_SIZE = 500;
  for (let start = 0; start < valid.length; start += CHUNK_SIZE) {
    const chunk = valid.slice(start, start + CHUNK_SIZE);
    await getDb().$transaction(
      chunk.map((booking) => {
        const data = toBookingData(booking);
        return getDb().booking.upsert({ where: { id: booking.id }, create: data, update: data });
      }),
    );
  }

  if (valid.length > 0) {
    await logAuditEvent('BOOKINGS_IMPORTED', actorEmail);
  }

  return { imported: valid.length, skipped };
};
