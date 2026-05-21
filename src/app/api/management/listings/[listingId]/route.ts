import { handleRouteError, readOptionalJson, successResponse } from "@/lib/api";
import { ManagementService } from "@/modules/management/services/managementService";
import { requireManagementSession } from "@/modules/management/services/requireManagementSession";

interface RouteContext {
  params: Promise<{
    listingId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireManagementSession();
    const { listingId } = await context.params;
    const listings = await new ManagementService().updateListing(
      session.user.id,
      listingId,
      await readOptionalJson(request),
    );

    return successResponse({ listings });
  } catch (error) {
    return handleRouteError(error);
  }
}
