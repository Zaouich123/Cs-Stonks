import { ApplicationError } from "@/lib/errors";
import { handleRouteError, readOptionalJson, successResponse } from "@/lib/api";
import { getCurrentSession } from "@/modules/auth/session/sessionCookie";
import { UserService } from "@/modules/users/services/userService";
import { parseUserProfileUpdate } from "@/modules/users/validators/profileValidators";

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      throw new ApplicationError("Authentication required.", 401);
    }

    const input = parseUserProfileUpdate(await readOptionalJson(request));
    const user = await new UserService().updateProfile(session.user.id, input);

    return successResponse(user, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
