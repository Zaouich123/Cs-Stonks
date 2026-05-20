import { createHmac, randomBytes } from "node:crypto";

import { prisma } from "@/lib/db/prisma";
import type { AuthenticatedSession } from "@/modules/auth/types/auth.types";
import { toSessionUser } from "@/modules/users/types/user.types";

const DEFAULT_SESSION_MAX_AGE_DAYS = 30;
const DEV_SESSION_SECRET = "dev-only-cs-stonks-session-secret";

function getSessionSecret() {
  return process.env.SESSION_SECRET?.trim() || DEV_SESSION_SECRET;
}

function getSessionMaxAgeDays() {
  const parsed = Number(process.env.SESSION_MAX_AGE_DAYS);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_MAX_AGE_DAYS;
}

export function getSessionMaxAgeSeconds() {
  return getSessionMaxAgeDays() * 24 * 60 * 60;
}

export function hashSessionToken(token: string) {
  return createHmac("sha256", getSessionSecret()).update(token).digest("hex");
}

export class SessionService {
  constructor(private readonly client = prisma) {}

  async createSession(userId: string) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + getSessionMaxAgeSeconds() * 1000);
    const session = await this.client.session.create({
      data: {
        expiresAt,
        sessionTokenHash: hashSessionToken(token),
        userId,
      },
    });

    return {
      expiresAt,
      sessionId: session.id,
      token,
    };
  }

  async getSessionByToken(token: string | null | undefined): Promise<AuthenticatedSession | null> {
    if (!token) {
      return null;
    }

    const session = await this.client.session.findUnique({
      include: {
        user: true,
      },
      where: {
        sessionTokenHash: hashSessionToken(token),
      },
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.client.session.delete({
        where: {
          id: session.id,
        },
      });

      return null;
    }

    return {
      expiresAt: session.expiresAt,
      sessionId: session.id,
      user: toSessionUser(session.user),
    };
  }

  async deleteSessionByToken(token: string | null | undefined) {
    if (!token) {
      return;
    }

    await this.client.session.deleteMany({
      where: {
        sessionTokenHash: hashSessionToken(token),
      },
    });
  }
}
