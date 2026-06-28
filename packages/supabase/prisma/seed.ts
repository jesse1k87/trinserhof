import { PrismaClient } from '@prisma/client';
import { type Room } from '@trinserhof/types';
import {
  getAccountingCategoryValidationErrors,
  getRoomTypeValidationErrors,
  getRoomValidationErrors,
} from '@trinserhof/helpers';
import { ROOMS } from './fixtures/ROOMS';
import { ROOM_TYPES } from './fixtures/ROOM_TYPES';
import { ACCOUNTING_CATEGORIES } from './fixtures/ACCOUNTING_CATEGORIES';
import { USERS } from './fixtures/USERS';

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
      data: {
        id: roomType.id,
        label: roomType.label,
        description: roomType.description ?? null,
        basePrice: roomType.basePrice,
      },
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

const seedUsers = async (): Promise<SeedResult> => {
  let inserted = 0;
  let skipped = 0;
  for (const user of USERS) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.user.create({ data: { email: user.email, role: user.role } });
    inserted += 1;
    console.log(`  + user ${user.email} (${user.role})`);
  }
  return { inserted, skipped };
};

const main = async () => {
  console.log('Seeding @trinserhof/supabase fixtures…');

  const roomTypes = await seedRoomTypes();
  const rooms = await seedRooms();
  const users = await seedUsers();
  const accountingCategories = await seedAccountingCategories();

  console.log('\nDone:');
  console.log(`room types: ${roomTypes.inserted} inserted, ${roomTypes.skipped} already present`);
  console.log(`rooms:      ${rooms.inserted} inserted, ${rooms.skipped} already present`);
  console.log(`users:      ${users.inserted} inserted, ${users.skipped} already present`);
  console.log(
    `categories: ${accountingCategories.inserted} inserted, ${accountingCategories.skipped} already present`,
  );
};

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
