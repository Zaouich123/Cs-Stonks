import { handleRouteError, readOptionalJson, successResponse } from "@/lib/api";
import { ManagementService } from "@/modules/management/services/managementService";
import { requireManagementSession } from "@/modules/management/services/requireManagementSession";

export async function GET() {
  try {
    const session = await requireManagementSession();
    const widgets = await new ManagementService().getWidgets(session.user.id);

    return successResponse({ widgets });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireManagementSession();
    const widgets = await new ManagementService().updateWidgets(
      session.user.id,
      await readOptionalJson(request),
    );

    return successResponse({ widgets });
  } catch (error) {
    return handleRouteError(error);
  }
}
