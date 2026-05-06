import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

// Use singleton pattern to avoid multiple PrismaClient instances
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error']
          : ['error'],
    });
  }

  return prisma;
}

export { PrismaClient };
