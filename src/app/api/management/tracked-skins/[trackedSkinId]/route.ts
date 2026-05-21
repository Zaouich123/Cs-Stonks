import { handleRouteError, successResponse } from "@/lib/api";
import { ManagementService } from "@/modules/management/services/managementService";
import { requireManagementSession } from "@/modules/management/services/requireManagementSession";

interface RouteContext {
  params: Promise<{
    trackedSkinId: string;
  }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireManagementSession();
    const { trackedSkinId } = await context.params;
    const result = await new ManagementService().deleteTrackedSkin(session.user.id, trackedSkinId);

    return successResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
