"use client";

import * as React from "react";

import { DashboardWidgetGrid } from "@/components/management/DashboardWidgetGrid";
import { ManagementHeader } from "@/components/management/ManagementHeader";
import { ManagementSummaryCards } from "@/components/management/ManagementSummaryCards";
import type { ManagementDashboardData } from "@/modules/management/types/management.types";
import type { SessionUser } from "@/modules/auth/types/auth.types";

interface ManagementDashboardClientProps {
  data: ManagementDashboardData;
  user: SessionUser;
}

export function ManagementDashboardClient({ data, user }: ManagementDashboardClientProps) {
  const [dashboardData, setDashboardData] = React.useState(data);

  return (
    <div className="flex flex-col gap-6">
      <ManagementHeader summary={dashboardData.summary} user={user} />
      <ManagementSummaryCards summary={dashboardData.summary} />
      <DashboardWidgetGrid
        data={dashboardData}
        onTrackedSkinsChange={(trackedSkins) =>
          setDashboardData((current) => ({
            ...current,
            summary: {
              ...current.summary,
              trackedSkins: trackedSkins.length,
            },
            trackedSkins,
          }))
        }
        onWidgetsChange={(widgets) => setDashboardData((current) => ({ ...current, widgets }))}
      />
    </div>
  );
}
