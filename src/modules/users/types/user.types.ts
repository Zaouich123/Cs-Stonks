import type { User } from "@prisma/client";

import type { SessionUser, SteamProfile } from "@/modules/auth/types/auth.types";

export type SteamUserProfileInput = SteamProfile;

export interface UserProfileUpdateInput {
  phoneCountryCode?: string | null;
  phoneNumber?: string | null;
  tradeLink?: string | null;
}

export function toSessionUser(user: User): SessionUser {
  return {
    createdAt: user.createdAt.toISOString(),
    id: user.id,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    phoneCountryCode: user.phoneCountryCode,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
    steamAvatar: user.steamAvatar,
    steamAvatarFull: user.steamAvatarFull,
    steamAvatarMedium: user.steamAvatarMedium,
    steamId: user.steamId,
    steamPersonaName: user.steamPersonaName,
    steamProfileUrl: user.steamProfileUrl,
    tradeLink: user.tradeLink,
    updatedAt: user.updatedAt.toISOString(),
  };
}
