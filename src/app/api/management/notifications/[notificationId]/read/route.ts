import { DashboardWidgetType } from "@prisma/client";

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
    const service = new ManagementService();

    await service.markNotificationRead(session.user.id, notificationId);

    const widgets = await service.getWidgets(session.user.id);
    const newsWidgetEnabled = widgets.some(
      (widget) => widget.widgetType === DashboardWidgetType.CS2_UPDATE && widget.enabled,
    );
    const notifications = await service.listNotifications(session.user.id, {
      includeCs2News: newsWidgetEnabled,
    });

    return successResponse({ notifications });
  } catch (error) {
    return handleRouteError(error);
  }
}
