import { handleRouteError, readOptionalJson, successResponse } from "@/lib/api";
import { ManagementService } from "@/modules/management/services/managementService";
import { requireManagementSession } from "@/modules/management/services/requireManagementSession";

export async function GET() {
  try {
    const session = await requireManagementSession();
    const trackedSkins = await new ManagementService().listTrackedSkins(session.user.id);

    return successResponse({ trackedSkins });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireManagementSession();
    const trackedSkins = await new ManagementService().createTrackedSkin(
      session.user.id,
      await readOptionalJson(request),
    );

    return successResponse({ trackedSkins }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
