import { ApplicationError } from "@/lib/errors";
import { handleRouteError, successResponse } from "@/lib/api";
import { getCurrentSession } from "@/modules/auth/session/sessionCookie";
import { InventoryService } from "@/modules/inventory/inventory.service";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      throw new ApplicationError("Authentication required.", 401);
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = ["1", "true", "yes"].includes(
      searchParams.get("refresh")?.trim().toLowerCase() ?? "",
    );
    const inventory = await new InventoryService().getInventoryForUser(session.user, {
      forceRefresh,
    });

    return successResponse(inventory, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
