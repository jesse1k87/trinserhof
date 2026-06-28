import { PrismaClient } from '@prisma/client';
import { type Room, type RoomTypeId, priceAmountSchema } from '@trinserhof/types';
import { getRoomValidationErrors } from '@trinserhof/helpers';

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

const main = async () => {
  console.log('Seeding @trinserhof/supabase fixtures…');

  const rooms = await seedRooms();
  const basePrices = await seedBasePrices();

  console.log('\nDone:');
  console.log(`  rooms:       ${rooms.inserted} inserted, ${rooms.skipped} already present`);
  console.log(
    `  base prices: ${basePrices.inserted} inserted, ${basePrices.skipped} already present`,
  );
};

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
