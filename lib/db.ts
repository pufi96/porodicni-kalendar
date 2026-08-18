import { PrismaClient } from "@prisma/client";

// U dev-u Next hot-reload pravi novi modul pri svakoj izmeni, pa bi se
// bez ovoga otvarala nova konekcija na svaki save dok baza ne pukne.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
