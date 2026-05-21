import { handleRouteError, readOptionalJson, successResponse } from "@/lib/api";
import { ManagementService } from "@/modules/management/services/managementService";
import { requireManagementSession } from "@/modules/management/services/requireManagementSession";

export async function GET() {
  try {
    const session = await requireManagementSession();
    const trades = await new ManagementService().listTrades(session.user.id);

    return successResponse({ trades });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireManagementSession();
    const trades = await new ManagementService().createTrade(
      session.user.id,
      await readOptionalJson(request),
    );

    return successResponse({ trades }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
