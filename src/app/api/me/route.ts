import { ApplicationError } from "@/lib/errors";
import { handleRouteError, successResponse } from "@/lib/api";
import { getCurrentSession } from "@/modules/auth/session/sessionCookie";

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      throw new ApplicationError("Authentication required.", 401);
    }

    return successResponse(session.user, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
