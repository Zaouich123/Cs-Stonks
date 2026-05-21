import {
  Prisma,
  UserNotificationSeverity,
  UserNotificationType,
  type PrismaClient,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

interface CreateUserNotificationInput {
  message: string;
  metadata?: Record<string, unknown>;
  severity?: UserNotificationSeverity;
  title: string;
  type?: UserNotificationType;
  userId: string;
}

export async function createUserNotification(
  input: CreateUserNotificationInput,
  client: PrismaClient = prisma,
) {
  return client.userNotification.create({
    data: {
      message: input.message,
      metadata: (input.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
      severity: input.severity ?? UserNotificationSeverity.INFO,
      title: input.title,
      type: input.type ?? UserNotificationType.SYSTEM,
      userId: input.userId,
    },
  });
}
