import { handleRouteError, readOptionalJson, successResponse } from "@/lib/api";
import { ManagementService } from "@/modules/management/services/managementService";
import { requireManagementSession } from "@/modules/management/services/requireManagementSession";

interface RouteContext {
  params: Promise<{
    tradeId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireManagementSession();
    const { tradeId } = await context.params;
    const trades = await new ManagementService().updateTrade(
      session.user.id,
      tradeId,
      await readOptionalJson(request),
    );

    return successResponse({ trades });
  } catch (error) {
    return handleRouteError(error);
  }
}
