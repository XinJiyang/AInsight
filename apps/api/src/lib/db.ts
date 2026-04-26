import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __ainsightPrisma: PrismaClient | undefined
}

export function isDatabaseEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export const prisma =
  globalThis.__ainsightPrisma ??
  new PrismaClient({
    log: ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__ainsightPrisma = prisma
}
