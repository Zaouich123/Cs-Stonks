import { handleRouteError, successResponse } from "@/lib/api";
import { ManagementService } from "@/modules/management/services/managementService";
import { requireManagementSession } from "@/modules/management/services/requireManagementSession";

export async function GET() {
  try {
    const session = await requireManagementSession();
    const notifications = await new ManagementService().listNotifications(session.user.id);

    return successResponse({ notifications });
  } catch (error) {
    return handleRouteError(error);
  }
}
