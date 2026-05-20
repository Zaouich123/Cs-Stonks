import { prisma } from "@/lib/db/prisma";
import type { SteamProfile } from "@/modules/auth/types/auth.types";
import type { UserProfileUpdateInput } from "@/modules/users/types/user.types";
import { toSessionUser } from "@/modules/users/types/user.types";

export class UserService {
  constructor(private readonly client = prisma) {}

  async upsertSteamUser(profile: SteamProfile) {
    const now = new Date();

    const user = await this.client.user.upsert({
      create: {
        lastLoginAt: now,
        steamAvatar: profile.avatar,
        steamAvatarFull: profile.avatarFull,
        steamAvatarMedium: profile.avatarMedium,
        steamId: profile.steamId,
        steamPersonaName: profile.personaName,
        steamProfileUrl: profile.profileUrl,
      },
      update: {
        lastLoginAt: now,
        steamAvatar: profile.avatar,
        steamAvatarFull: profile.avatarFull,
        steamAvatarMedium: profile.avatarMedium,
        steamPersonaName: profile.personaName,
        steamProfileUrl: profile.profileUrl,
      },
      where: {
        steamId: profile.steamId,
      },
    });

    await this.client.userProfileAudit.create({
      data: {
        action: "profile_synced",
        metadata: {
          steamId: profile.steamId,
        },
        userId: user.id,
      },
    });

    return user;
  }

  async getPublicUserById(userId: string) {
    const user = await this.client.user.findUnique({
      where: {
        id: userId,
      },
    });

    return user ? toSessionUser(user) : null;
  }

  async updateProfile(userId: string, input: UserProfileUpdateInput) {
    const user = await this.client.user.update({
      data: {
        phoneCountryCode: input.phoneCountryCode,
        phoneNumber: input.phoneNumber,
        phoneVerified: false,
        tradeLink: input.tradeLink,
      },
      where: {
        id: userId,
      },
    });

    await this.client.userProfileAudit.create({
      data: {
        action: "profile_settings_updated",
        metadata: {
          phoneUpdated: input.phoneNumber !== null,
          tradeLinkUpdated: input.tradeLink !== null,
        },
        userId,
      },
    });

    return toSessionUser(user);
  }
}
