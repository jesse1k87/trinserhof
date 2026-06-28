import { PrismaClient } from '@prisma/client';
import { type Room, priceAmountSchema } from '@trinserhof/types';
import { getRoomTypeValidationErrors, getRoomValidationErrors } from '@trinserhof/helpers';
import { ROOMS } from './fixtures/ROOMS';
import { ROOM_TYPES } from './fixtures/ROOM_TYPES';
import { BASE_PRICES } from './fixtures/BASE_PRICES';

const prisma = new PrismaClient();

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

  const roomTypes = await seedRoomTypes();
  const rooms = await seedRooms();
  const basePrices = await seedBasePrices();

  console.log('\nDone:');
  console.log(
    `  room types:  ${roomTypes.inserted} inserted, ${roomTypes.skipped} already present`,
  );
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
