import { handleRouteError, successResponse } from "@/lib/api";
import { ManagementService } from "@/modules/management/services/managementService";
import { requireManagementSession } from "@/modules/management/services/requireManagementSession";

interface RouteContext {
  params: Promise<{
    notificationId: string;
  }>;
}

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const session = await requireManagementSession();
    const { notificationId } = await context.params;
    const notifications = await new ManagementService().markNotificationRead(
      session.user.id,
      notificationId,
    );

    return successResponse({ notifications });
  } catch (error) {
    return handleRouteError(error);
  }
}
