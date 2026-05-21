import { ApplicationError } from "@/lib/errors";
import { getCurrentSession } from "@/modules/auth/session/sessionCookie";

export async function requireManagementSession() {
  const session = await getCurrentSession();

  if (!session) {
    throw new ApplicationError("Authentication required.", 401);
  }

  return session;
}
