import { ApplicationError } from "@/lib/errors";
import { handleRouteError, successResponse } from "@/lib/api";
import { getCurrentSession } from "@/modules/auth/session/sessionCookie";
import { SteamProfileClient } from "@/modules/auth/steam/steamProfileClient";
import { UserService } from "@/modules/users/services/userService";
import { toSessionUser } from "@/modules/users/types/user.types";

export async function POST() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      throw new ApplicationError("Authentication required.", 401);
    }

    const profile = await new SteamProfileClient().getPlayerSummary(session.user.steamId);
    const user = await new UserService().upsertSteamUser(profile);

    return successResponse(toSessionUser(user), 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
