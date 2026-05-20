import { getAppUrl, buildSteamOpenIdLoginUrl } from "@/modules/auth/steam/steamOpenId";
import { verifySteamOpenIdCallback } from "@/modules/auth/steam/steamOpenIdVerifier";
import { SteamProfileClient } from "@/modules/auth/steam/steamProfileClient";
import { SessionService } from "@/modules/auth/session/sessionService";
import { UserService } from "@/modules/users/services/userService";

export class SteamAuthService {
  constructor(
    private readonly profileClient = new SteamProfileClient(),
    private readonly userService = new UserService(),
    private readonly sessionService = new SessionService(),
  ) {}

  getLoginUrl(request: Request) {
    return buildSteamOpenIdLoginUrl(getAppUrl(request));
  }

  async completeLogin(request: Request) {
    const url = new URL(request.url);
    const { steamId } = await verifySteamOpenIdCallback(url.searchParams);
    const profile = await this.profileClient.getPlayerSummary(steamId);
    const user = await this.userService.upsertSteamUser(profile);
    const session = await this.sessionService.createSession(user.id);

    return {
      session,
      user,
    };
  }
}
