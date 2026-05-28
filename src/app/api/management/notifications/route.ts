import { DashboardWidgetType } from "@prisma/client";

import { handleRouteError, successResponse } from "@/lib/api";
import { ManagementService } from "@/modules/management/services/managementService";
import { requireManagementSession } from "@/modules/management/services/requireManagementSession";

export async function GET() {
  try {
    const session = await requireManagementSession();
    const service = new ManagementService();
    const widgets = await service.getWidgets(session.user.id);
    const newsWidgetEnabled = widgets.some(
      (widget) => widget.widgetType === DashboardWidgetType.CS2_UPDATE && widget.enabled,
    );
    const notifications = await service.listNotifications(session.user.id, {
      evaluateCs2News: newsWidgetEnabled,
      evaluatePriceAlerts: true,
      includeCs2News: newsWidgetEnabled,
    });

    return successResponse({ notifications });
  } catch (error) {
    return handleRouteError(error);
  }
}
