export interface SteamProfile {
  avatar: string | null;
  avatarFull: string | null;
  avatarMedium: string | null;
  personaName: string;
  profileUrl: string | null;
  steamId: string;
}

export interface SessionUser {
  createdAt: string;
  id: string;
  lastLoginAt: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  steamAvatar: string | null;
  steamAvatarFull: string | null;
  steamAvatarMedium: string | null;
  steamId: string;
  steamPersonaName: string;
  steamProfileUrl: string | null;
  tradeLink: string | null;
  updatedAt: string;
}

export interface AuthenticatedSession {
  expiresAt: Date;
  sessionId: string;
  user: SessionUser;
}
