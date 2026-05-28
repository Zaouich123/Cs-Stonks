"use client";

import * as React from "react";
import { Check, CircleAlert } from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { EmptyState } from "@/components/management/widgets/EmptyState";
import { WidgetShell } from "@/components/management/widgets/WidgetShell";
import { formatManagementNotification } from "@/lib/management/formatManagementNotification";
import type { ManagementNotification } from "@/modules/management/types/management.types";

const severityStyles = {
  ERROR: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  INFO: "border-[#4da3ff]/20 bg-[#4da3ff]/10 text-[#9acbff]",
  SUCCESS: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  WARNING: "border-amber-400/20 bg-amber-400/10 text-amber-200",
};

export function NotificationsWidget({
  notifications: initialNotifications,
}: {
  notifications: ManagementNotification[];
}) {
  const { language } = usePreferences();
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const markAsRead = async (notificationId: string) => {
    setPendingId(notificationId);

    try {
      const response = await fetch(`/api/management/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      const payload = await response.json();

      if (payload.ok) {
        setNotifications(payload.data.notifications);
      }
    } finally {
      setPendingId(null);
    }
  };

  return (
    <WidgetShell
      eyebrow={language === "FR" ? "Alertes" : "Alerts"}
      title={language === "FR" ? "Notifications" : "Notifications"}
    >
      {notifications.length === 0 ? (
        <EmptyState
          actionHref="/prices"
          actionLabel={language === "FR" ? "Creer une alerte" : "Create alert"}
          description={
            language === "FR"
              ? "Les alertes de prix des skins suivis et les news CS2 apparaitront ici."
              : "Tracked skin price alerts and CS2 news will appear here."
          }
          title={language === "FR" ? "Aucune notification" : "No notifications"}
        />
      ) : (
        <div className="space-y-3">
          {notifications.slice(0, 6).map((notification) => {
            const content = formatManagementNotification(notification, language);

            return (
              <div
                className={`rounded-2xl border p-4 ${
                  notification.isRead ? "border-white/8 bg-white/[0.025]" : severityStyles[notification.severity]
                }`}
                key={notification.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-white">{content.title}</p>
                      <p className="mt-1 text-sm leading-5 text-white/52">{content.message}</p>
                    </div>
                  </div>
                  {!notification.isRead ? (
                    <button
                      className="rounded-full border border-white/10 p-2 text-white/62 transition hover:text-white disabled:opacity-45"
                      disabled={pendingId === notification.id}
                      onClick={() => markAsRead(notification.id)}
                      type="button"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WidgetShell>
  );
}
