import { PrismaClient } from '@prisma/client';
import {
  type AccountingCategory,
  type Room,
  type RoomType,
  type RoomTypeId,
  priceAmountSchema,
} from '@trinserhof/types';
import {
  getAccountingCategoryValidationErrors,
  getRoomTypeValidationErrors,
  getRoomValidationErrors,
} from '@trinserhof/helpers';

// Seeds reference data that should exist in every build of the PMS.
//
// This is meant to run as part of the build (see the `build`/`db:seed` scripts
// in package.json) and is **idempotent**: every fixture is inserted only when it
// is missing, and existing rows are left untouched — so re-running it never
// overwrites edits made later in the app. DATABASE_URL is read from
// packages/supabase/.env, the same file `prisma db push`/`migrate` use, so no
// extra setup is needed beyond what migrations already require.

const prisma = new PrismaClient();

// -----------------------------------------------------------------------------
// Fixtures — edit these to change what gets seeded.
// -----------------------------------------------------------------------------

// The hotel's room types. These used to be a hardcoded enum; they now live as
// `RoomType` rows so they can be managed from the PMS app. `Room.type` and
// `Price.roomTypeId` reference a room type's `id`.
const ROOM_TYPES: RoomType[] = [
  { id: 'SUITE', label: 'Suite', description: 'Spacious suite with a separate sitting area.' },
  { id: 'STANDARD', label: 'Standard', description: 'Comfortable standard double room.' },
  { id: 'BERGSTEIGER', label: 'Bergsteiger', description: 'Cosy room for mountaineers.' },
  { id: 'FAMILY', label: 'Family', description: 'Larger room that sleeps a family.' },
];

// The hotel's rooms, keyed by room number (`id`). `floor` is derived from the
// room number and `color` is assigned per room type for the calendar.
const ROOMS: Room[] = [
  {
    id: '101',
    type: 'STANDARD',
    maxCustomers: 2,
    floor: 1,
    color: '#3b82f6',
    balcony: true,
    tv: true,
    shower: true,
    bathtub: false,
    toilet: true,
    phone: false,
    desk: false,
    mountainView: false,
    kingBed: 1,
    spaces: 1,
  },
  {
    id: '102',
    type: 'BERGSTEIGER',
    maxCustomers: 2,
    floor: 1,
    color: '#10b981',
    balcony: false,
    tv: false,
    shower: true,
    bathtub: true,
    toilet: true,
    phone: false,
    desk: true,
    mountainView: true,
    queenBed: 1,
    spaces: 1,
  },
  {
    id: '103',
    type: 'STANDARD',
    maxCustomers: 2,
    floor: 1,
    color: '#3b82f6',
    balcony: true,
    tv: true,
    shower: true,
    bathtub: true,
    toilet: true,
    phone: false,
    desk: false,
    mountainView: true,
    queenBed: 1,
    spaces: 1,
  },
  {
    id: '104',
    type: 'SUITE',
    maxCustomers: 2,
    floor: 1,
    color: '#a855f7',
    balcony: true,
    tv: true,
    shower: true,
    toilet: true,
    desk: true,
    mountainView: true,
    kingBed: 1,
    spaces: 2,
  },
  {
    id: '106',
    type: 'BERGSTEIGER',
    maxCustomers: 2,
    floor: 1,
    color: '#10b981',
    balcony: true,
    tv: false,
    shower: true,
    bathtub: false,
    toilet: true,
    phone: false,
    desk: false,
    mountainView: true,
    queenBed: 1,
    spaces: 1,
  },
  {
    id: '107',
    type: 'BERGSTEIGER',
    maxCustomers: 2,
    floor: 1,
    color: '#10b981',
    balcony: true,
    tv: false,
    shower: true,
    bathtub: true,
    toilet: true,
    phone: false,
    desk: false,
    mountainView: true,
    queenBed: 1,
    spaces: 1,
  },
  {
    id: '108',
    type: 'BERGSTEIGER',
    maxCustomers: 2,
    floor: 1,
    color: '#10b981',
    balcony: true,
    tv: true,
    shower: true,
    bathtub: false,
    toilet: true,
    phone: false,
    desk: false,
    mountainView: true,
    queenBed: 1,
    spaces: 1,
  },
  {
    id: '109',
    type: 'BERGSTEIGER',
    maxCustomers: 2,
    floor: 1,
    color: '#10b981',
    balcony: true,
    tv: true,
    shower: true,
    bathtub: true,
    toilet: true,
    phone: false,
    desk: false,
    mountainView: true,
    queenBed: 1,
    spaces: 1,
  },
  {
    id: '110',
    type: 'BERGSTEIGER',
    maxCustomers: 1,
    floor: 1,
    color: '#10b981',
    balcony: true,
    tv: false,
    shower: true,
    bathtub: false,
    toilet: true,
    phone: false,
    desk: false,
    mountainView: false,
    singleBed: 1,
    spaces: 1,
  },
  {
    id: '111',
    type: 'STANDARD',
    maxCustomers: 2,
    floor: 1,
    color: '#3b82f6',
    balcony: true,
    tv: true,
    shower: true,
    bathtub: false,
    toilet: true,
    phone: false,
    desk: false,
    mountainView: false,
    kingBed: 1,
    spaces: 1,
  },
  {
    id: '112',
    type: 'BERGSTEIGER',
    maxCustomers: 2,
    floor: 1,
    color: '#10b981',
    balcony: false,
    tv: false,
    shower: true,
    bathtub: true,
    toilet: true,
    phone: false,
    desk: false,
    mountainView: true,
    queenBed: 1,
    spaces: 1,
  },
  {
    id: '113',
    type: 'STANDARD',
    maxCustomers: 2,
    floor: 1,
    color: '#3b82f6',
    balcony: true,
    tv: false,
    shower: true,
    bathtub: true,
    toilet: true,
    phone: false,
    desk: false,
    mountainView: true,
    queenBed: 1,
    spaces: 1,
  },
  {
    id: '114',
    type: 'SUITE',
    maxCustomers: 2,
    floor: 1,
    color: '#a855f7',
    balcony: true,
    tv: true,
    shower: true,
    toilet: true,
    mountainView: true,
    kingBed: 1,
    spaces: 2,
  },
  {
    id: '116',
    type: 'BERGSTEIGER',
    maxCustomers: 2,
    floor: 1,
    color: '#10b981',
    balcony: true,
    tv: false,
    shower: true,
    bathtub: false,
    toilet: true,
    phone: false,
    desk: false,
    mountainView: true,
    queenBed: 1,
    spaces: 1,
  },
  {
    id: '117',
    type: 'BERGSTEIGER',
    maxCustomers: 2,
    floor: 1,
    color: '#10b981',
    balcony: true,
    tv: false,
    shower: true,
    bathtub: false,
    toilet: true,
    phone: false,
    desk: false,
    mountainView: false,
    queenBed: 1,
    spaces: 1,
  },
  {
    id: '118',
    type: 'BERGSTEIGER',
    maxCustomers: 2,
    floor: 1,
    color: '#10b981',
    balcony: true,
    tv: true,
    shower: true,
    bathtub: false,
    toilet: true,
    phone: false,
    desk: false,
    mountainView: true,
    queenBed: 1,
    spaces: 1,
  },
  {
    id: '120',
    type: 'SUITE',
    maxCustomers: 2,
    floor: 1,
    color: '#a855f7',
    balcony: true,
    tv: true,
    shower: true,
    bathtub: false,
    toilet: true,
    phone: false,
    desk: true,
    mountainView: true,
    kingBed: 1,
    spaces: 2,
  },
  {
    id: '121',
    type: 'FAMILY',
    maxCustomers: 4,
    floor: 1,
    color: '#f59e0b',
    balcony: true,
    tv: true,
    shower: true,
    bathtub: true,
    toilet: true,
    mountainView: false,
    kingBed: 1,
    sleepSofa: 1,
    spaces: 2,
  },
  {
    id: '124',
    type: 'FAMILY',
    maxCustomers: 4,
    floor: 1,
    color: '#f59e0b',
    balcony: true,
    tv: true,
    shower: true,
    bathtub: true,
    toilet: true,
    phone: false,
    desk: false,
    mountainView: false,
    kingBed: 1,
    sleepSofa: 1,
    spaces: 2,
  },
];

// Base nightly price per room type (a Price row with a null date). Per-night
// overrides are intentionally not seeded — those are entered in the app.
const BASE_PRICES: Array<{ roomType: RoomTypeId; amount: number }> = [
  { roomType: 'SUITE', amount: 165 },
  { roomType: 'STANDARD', amount: 149 },
  { roomType: 'BERGSTEIGER', amount: 135 },
  { roomType: 'FAMILY', amount: 149 },
];

// The hotel's accounting categories (tax rate + ledger code + calendar colour
// per category). `ledgerCode` defaults to 0 and `color` to #3b82f6 where the
// source data didn't have one — both can be edited later in the app.
const ACCOUNTING_CATEGORIES: AccountingCategory[] = [
  {
    id: '236c1646-9733-449e-85ed-0425d3878943',
    name: 'Trinkgeld',
    taxRate: 0,
    ledgerCode: 0,
    color: '#3b82f6',
  },
  {
    id: '24075df5-5d12-4a7a-88df-6c481f9cbfc1',
    name: 'Stay',
    taxRate: 10,
    ledgerCode: 0,
    color: '#3b82f6',
  },
  {
    id: '37384f25-55f5-4c0e-b80d-eb2ee1d0b462',
    name: 'Nächtigung ohne Frühstück',
    taxRate: 0,
    ledgerCode: 0,
    color: '#3b82f6',
  },
  {
    id: '3aeae3f1-521e-4669-a028-a0b00c86b0d8',
    name: 'Spirituosen',
    taxRate: 0,
    ledgerCode: 0,
    color: '#d1cccc',
  },
  {
    id: '3c930bdc-ff7a-4449-a8d5-fd1e4c2dd5d3',
    name: 'Frühstück',
    taxRate: 0,
    ledgerCode: 0,
    color: '#3b82f6',
  },
  {
    id: '43816fb6-3ecb-4222-ba6c-53c85f879574',
    name: 'Bier',
    taxRate: 10,
    ledgerCode: 0,
    color: '#969217',
  },
  {
    id: '4805a387-b8f8-4c80-b835-1287e1cb4a91',
    name: 'Sekt',
    taxRate: 0,
    ledgerCode: 0,
    color: '#eddb12',
  },
  {
    id: '70c88be1-9d8c-48f5-a1c7-f2159feadb91',
    name: 'Halbpension',
    taxRate: 0,
    ledgerCode: 0,
    color: '#16a1d0',
  },
  {
    id: '87ff1bfc-92fe-4e43-89aa-3250b14feeac',
    name: 'Ortstaxe',
    taxRate: 0,
    ledgerCode: 0,
    color: '#3b82f6',
  },
  {
    id: 'a1982009-b412-429a-9ac5-b29732a1291b',
    name: 'Nächtigung mit Frühstück',
    taxRate: 0,
    ledgerCode: 0,
    color: '#173196',
  },
  {
    id: 'a31b3a81-3b7d-401d-a78c-ac094705ccf4',
    name: 'Wein',
    taxRate: 0,
    ledgerCode: 0,
    color: '#a21010',
  },
  {
    id: 'b2761012-8545-4713-abf4-227c8f5a1159',
    name: 'Speisen',
    taxRate: 0,
    ledgerCode: 0,
    color: '#569629',
  },
  {
    id: 'b7e5a35d-548f-4670-b274-b2613a2d7968',
    name: 'Eis',
    taxRate: 0,
    ledgerCode: 0,
    color: '#ff9f80',
  },
  {
    id: 'd7c01411-5b3d-4bf5-9814-63221a19b2fb',
    name: 'Alkoholfreie Getränke',
    taxRate: 10,
    ledgerCode: 0,
    color: '#577ea1',
  },
  {
    id: 'dc13dedd-4bf1-412e-96b5-8357a88a5d33',
    name: 'Heissgetränke',
    taxRate: 0,
    ledgerCode: 0,
    color: '#3b82f6',
  },
  {
    id: 'f4ea4a70-71dd-4317-ab51-e8cbb9eab7b4',
    name: 'Anzahlung',
    taxRate: 20,
    ledgerCode: 0,
    color: '#3b82f6',
  },
];

// -----------------------------------------------------------------------------

type SeedResult = { inserted: number; skipped: number };

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

const seedRoomTypes = async (): Promise<SeedResult> => {
  let inserted = 0;
  let skipped = 0;
  for (const roomType of ROOM_TYPES) {
    const errors = getRoomTypeValidationErrors(roomType);
    if (errors.length > 0) {
      throw new Error(`Invalid room type fixture ${roomType.id}: ${errors.join(', ')}`);
    }

    const existing = await prisma.roomType.findUnique({ where: { id: roomType.id } });
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.roomType.create({
      data: { id: roomType.id, label: roomType.label, description: roomType.description ?? null },
    });
    inserted += 1;
    console.log(`  + room type ${roomType.id} (${roomType.label})`);
  }
  return { inserted, skipped };
};

const seedRooms = async (): Promise<SeedResult> => {
  let inserted = 0;
  let skipped = 0;
  for (const room of ROOMS) {
    const errors = getRoomValidationErrors(room);
    if (errors.length > 0) {
      throw new Error(`Invalid room fixture ${room.id}: ${errors.join(', ')}`);
    }

    const existing = await prisma.room.findUnique({ where: { id: room.id } });
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.room.create({ data: toRoomData(room) });
    inserted += 1;
    console.log(`  + room ${room.id} (${room.type})`);
  }
  return { inserted, skipped };
};

const seedBasePrices = async (): Promise<SeedResult> => {
  let inserted = 0;
  let skipped = 0;
  for (const { roomType, amount } of BASE_PRICES) {
    const result = priceAmountSchema.safeParse(amount);
    if (!result.success) {
      throw new Error(
        `Invalid base price fixture ${roomType}: ${result.error.issues.map((i) => i.message).join(', ')}`,
      );
    }

    // A base price is the Price row whose `date` is null. Postgres treats NULLs
    // in the (roomTypeId, date) unique index as distinct from one another, so it
    // can't be targeted with a compound `findUnique` — match the null date with
    // `findFirst` instead (same reasoning as `upsertPrice` in src/index.ts).
    const existing = await prisma.price.findFirst({
      where: { roomTypeId: roomType, date: null },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.price.create({ data: { roomTypeId: roomType, date: null, amount } });
    inserted += 1;
    console.log(`  + base price ${roomType} = ${amount}`);
  }
  return { inserted, skipped };
};

const seedAccountingCategories = async (): Promise<SeedResult> => {
  let inserted = 0;
  let skipped = 0;
  for (const category of ACCOUNTING_CATEGORIES) {
    const errors = getAccountingCategoryValidationErrors(category);
    if (errors.length > 0) {
      throw new Error(`Invalid accounting category fixture ${category.id}: ${errors.join(', ')}`);
    }

    const existing = await prisma.accountingCategory.findUnique({ where: { id: category.id } });
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.accountingCategory.create({
      data: {
        id: category.id,
        name: category.name,
        taxRate: category.taxRate,
        ledgerCode: category.ledgerCode,
        color: category.color,
      },
    });
    inserted += 1;
    console.log(`  + accounting category ${category.id} (${category.name})`);
  }
  return { inserted, skipped };
};

const main = async () => {
  console.log('Seeding @trinserhof/supabase fixtures…');

  const roomTypes = await seedRoomTypes();
  const rooms = await seedRooms();
  const basePrices = await seedBasePrices();
  const accountingCategories = await seedAccountingCategories();

  console.log('\nDone:');
  console.log(`  room types:  ${roomTypes.inserted} inserted, ${roomTypes.skipped} already present`);
  console.log(`  rooms:       ${rooms.inserted} inserted, ${rooms.skipped} already present`);
  console.log(
    `  base prices: ${basePrices.inserted} inserted, ${basePrices.skipped} already present`,
  );
  console.log(
    `  accounting categories: ${accountingCategories.inserted} inserted, ${accountingCategories.skipped} already present`,
  );
};

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
