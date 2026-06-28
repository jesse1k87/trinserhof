import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

let db: PrismaClient | undefined;

export const getDb = () => {
  if (!db) {
    db = new PrismaClient();
  }
  return db;
};
