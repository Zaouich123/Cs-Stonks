import { handleRouteError, successResponse } from "@/lib/api";
import { InventoryService } from "@/modules/inventory/inventory.service";
import { ManagementService } from "@/modules/management/services/managementService";
import { requireManagementSession } from "@/modules/management/services/requireManagementSession";

export async function GET(request: Request) {
  try {
    const session = await requireManagementSession();
    const { searchParams } = new URL(request.url);
    const forceRefresh = ["1", "true", "yes"].includes(
      searchParams.get("refresh")?.trim().toLowerCase() ?? "",
    );

    if (forceRefresh) {
      await new InventoryService().getInventoryForUser(session.user, {
        forceRefresh: true,
      });
    }

    const inventory = await new ManagementService().getInventoryValue(session.user.id);

    return successResponse(inventory);
  } catch (error) {
    return handleRouteError(error);
  }
}
