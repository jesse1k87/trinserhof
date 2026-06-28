import { PrismaClient, type BookingStatus as PrismaBookingStatus } from '@prisma/client';
import {
  type AccountingCategory,
  type AuditEvent,
  type Booking,
  type Customer,
  type Invoice,
  type Product,
  type RestaurantReservation,
  type RestaurantTable,
  type RoleDefinition,
  type Room,
  type RoomType,
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
  getRoleValidationErrors,
  getRoomTypeValidationErrors,
  getRoomValidationErrors,
  getTableValidationErrors,
  mergeCustomerFields,
  uuidv4,
} from '@trinserhof/helpers';
import { getSupabaseClient } from './client';

export * from './client';
export * from './auth';

// Only `mergeCustomers`, `wipeBookings` and `importBookings` below need real
// cross-table atomicity (Prisma's `$transaction`), which plain PostgREST calls
// can't give us. Everything else in this file goes through `getSupabaseClient()`
// (browser-safe). These three still run Prisma directly, so they only work
// server-side for now (e.g. from a script) — calling them from the PMS app's
// browser bundle will throw, same as the rest of this file used to.
let db: PrismaClient | undefined;

const getDb = () => {
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
  note: booking.note ?? '',
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
  const { error } = await getSupabaseClient().from('Booking').upsert(data);
  if (error) throw error;
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
  const { error } = await getSupabaseClient().from('Customer').upsert(data);
  if (error) throw error;
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
// Server-side only (Prisma) — see the note above `getDb`.
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
  products: invoice.products as unknown,
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
  const { error } = await getSupabaseClient().from('Invoice').upsert(data);
  if (error) throw error;
  return invoice;
};

const toProductData = (product: Product) => ({
  id: product.id,
  name: product.name,
  price: product.price,
  accountingCategoryId: product.accountingCategoryId,
  variants: product.variants ? (product.variants as unknown) : null,
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
  const { error } = await getSupabaseClient().from('Product').upsert(data);
  if (error) throw error;
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
  const { error } = await getSupabaseClient().from('AccountingCategory').upsert(data);
  if (error) throw error;
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
  const { error } = await getSupabaseClient().from('Room').upsert(data);
  if (error) throw error;
  return room;
};

const toRoleData = (role: RoleDefinition) => ({
  id: role.id,
  name: role.name,
  permissions: role.permissions,
});

export const saveRole = async (role: RoleDefinition): Promise<RoleDefinition> => {
  const normalized: RoleDefinition = {
    ...role,
    id: role.id.trim(),
    name: role.name.trim(),
  };

  const validationErrors = getRoleValidationErrors(normalized);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid role data: ${validationErrors.join(', ')}`);
  }

  const { error } = await getSupabaseClient().from('Role').upsert(toRoleData(normalized));
  if (error) throw error;
  return normalized;
};

const toRoomTypeData = (roomType: RoomType) => ({
  id: roomType.id,
  label: roomType.label,
  description: roomType.description ?? null,
  basePrice: roomType.basePrice,
});

export const saveRoomType = async (roomType: RoomType): Promise<RoomType> => {
  const normalized: RoomType = { ...roomType, id: roomType.id.trim() };

  const validationErrors = getRoomTypeValidationErrors(normalized);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid room type data: ${validationErrors.join(', ')}`);
  }

  const { error } = await getSupabaseClient().from('RoomType').upsert(toRoomTypeData(normalized));
  if (error) throw error;
  return normalized;
};

// Pricing is keyed by room *type* (and by night), not by individual room: the
// base price per night lives on `RoomType.basePrice` (see `saveRoomType`
// above), and a `Price` row with a `date` is a per-night override that wins
// over the base for that night. `(roomTypeId, date)` is meant to be unique, so
// reads/writes here go through a manual select + update/insert instead of a
// plain upsert.
const assertValidPriceAmount = (price: number) => {
  const result = priceAmountSchema.safeParse(price);
  if (!result.success) {
    throw new Error(`Invalid price data: ${result.error.issues.map((i) => i.message).join(', ')}`);
  }
};

export const savePriceOverride = async (date: string, roomTypeId: RoomTypeId, amount: number) => {
  assertValidPriceAmount(amount);
  const supabase = getSupabaseClient();
  const { data: existingRows, error: selectError } = await supabase
    .from('Price')
    .select('id')
    .eq('roomTypeId', roomTypeId)
    .eq('date', date)
    .limit(1);
  if (selectError) throw selectError;
  const existing = existingRows?.[0];

  if (existing) {
    const { error } = await supabase.from('Price').update({ amount }).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('Price').insert({ roomTypeId, date, amount });
    if (error) throw error;
  }
};

export const deletePriceOverride = async (date: string, roomType: RoomTypeId) => {
  const { error } = await getSupabaseClient()
    .from('Price')
    .delete()
    .eq('roomTypeId', roomType)
    .eq('date', date);
  if (error) throw error;
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
  const { error } = await getSupabaseClient().from('RestaurantTable').upsert(data);
  if (error) throw error;
  return table;
};

export const deleteTable = async (tableId: string) => {
  const { error } = await getSupabaseClient().from('RestaurantTable').delete().eq('id', tableId);
  if (error) throw error;
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
  const { error } = await getSupabaseClient().from('RestaurantReservation').upsert(data);
  if (error) throw error;
  return restaurantReservation;
};

export const deleteRestaurantReservation = async (restaurantReservationId: string) => {
  const { error } = await getSupabaseClient()
    .from('RestaurantReservation')
    .delete()
    .eq('id', restaurantReservationId);
  if (error) throw error;
};

export const logAuditEvent = async (event: AuditEvent, email?: string | null) => {
  if (!email) return;
  try {
    const { error } = await getSupabaseClient()
      .from('AuditLogEntry')
      .insert({ id: uuidv4(), email, event, timestamp: Date.now() });
    if (error) throw error;
  } catch (error) {
    console.error(error);
  }
};

export type WipeBookingsResult = {
  bookingsDeleted: number;
  restaurantReservationsDeleted: number;
  auditLogEntriesDeleted: number;
};

// Server-side only (Prisma) — see the note above `getDb`.
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
  const { data, error } = await getSupabaseClient().from('Customer').delete().select('id');
  if (error) throw error;
  await logAuditEvent('CUSTOMERS_WIPED', actorEmail);
  return { customersDeleted: data?.length ?? 0 };
};

export type ImportBookingsResult = {
  imported: number;
  skipped: Array<{ id: string; errors: string[] }>;
};

// Bulk-imports bookings, overwriting any booking whose id already exists, in
// chunks of 500 (one transaction per chunk rather than one per booking). Records
// that fail validation are skipped and returned so the caller can report them
// instead of aborting the whole import.
// Server-side only (Prisma) — see the note above `getDb`.
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
