import { DashboardWidgetSize, DashboardWidgetType } from "@prisma/client";

export interface DefaultDashboardWidget {
  enabled: boolean;
  position: number;
  size: DashboardWidgetSize;
  widgetType: DashboardWidgetType;
}

export const DEFAULT_DASHBOARD_WIDGETS: DefaultDashboardWidget[] = [
  {
    enabled: true,
    position: 1,
    size: DashboardWidgetSize.WIDE,
    widgetType: DashboardWidgetType.TRACKED_SKIN_CHART,
  },
  {
    enabled: true,
    position: 2,
    size: DashboardWidgetSize.MEDIUM,
    widgetType: DashboardWidgetType.INVENTORY_VALUE,
  },
  {
    enabled: false,
    position: 3,
    size: DashboardWidgetSize.MEDIUM,
    widgetType: DashboardWidgetType.MARKETPLACE_SALES,
  },
  {
    enabled: false,
    position: 4,
    size: DashboardWidgetSize.MEDIUM,
    widgetType: DashboardWidgetType.TRADE_TRACKER,
  },
  {
    enabled: false,
    position: 5,
    size: DashboardWidgetSize.MEDIUM,
    widgetType: DashboardWidgetType.NOTIFICATIONS,
  },
  {
    enabled: false,
    position: 6,
    size: DashboardWidgetSize.MEDIUM,
    widgetType: DashboardWidgetType.CS2_UPDATE,
  },
];

export function getWidgetLabel(widgetType: DashboardWidgetType) {
  switch (widgetType) {
    case DashboardWidgetType.TRACKED_SKIN_CHART:
      return "Tracked skins";
    case DashboardWidgetType.INVENTORY_VALUE:
      return "Inventory value";
    case DashboardWidgetType.CS2_UPDATE:
      return "CS2 updates";
    case DashboardWidgetType.MARKETPLACE_SALES:
      return "Marketplace sales";
    case DashboardWidgetType.TRADE_TRACKER:
      return "Trade tracker";
    case DashboardWidgetType.NOTIFICATIONS:
      return "Notifications";
  }
}
