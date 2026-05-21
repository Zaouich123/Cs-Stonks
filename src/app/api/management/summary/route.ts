import { handleRouteError, successResponse } from "@/lib/api";
import { ManagementService } from "@/modules/management/services/managementService";
import { requireManagementSession } from "@/modules/management/services/requireManagementSession";

export async function GET() {
  try {
    const session = await requireManagementSession();
    const summary = await new ManagementService().getSummary(session.user.id);

    return successResponse(summary);
  } catch (error) {
    return handleRouteError(error);
  }
}
