import { PrismaClient } from "@prisma/client";

declare global {
  var __csStonksPrisma__: PrismaClient | undefined;
}

export const prisma =
  global.__csStonksPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__csStonksPrisma__ = prisma;
}

