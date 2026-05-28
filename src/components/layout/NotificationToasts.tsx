"use client";

import * as React from "react";
import { Bell, Check, X } from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { formatManagementNotification } from "@/lib/management/formatManagementNotification";
import type { ManagementNotification } from "@/modules/management/types/management.types";

interface ApiResponse<T> {
  data?: T;
  ok: boolean;
}

const severityClassNames = {
  ERROR: "border-rose-400/25 bg-rose-500/15 text-rose-100",
  INFO: "border-[#4da3ff]/25 bg-[#4da3ff]/15 text-[#c9e4ff]",
  SUCCESS: "border-emerald-400/25 bg-emerald-500/15 text-emerald-100",
  WARNING: "border-amber-400/25 bg-amber-500/15 text-amber-100",
};

export function NotificationToasts() {
  const { language } = usePreferences();
  const [visibleNotifications, setVisibleNotifications] = React.useState<ManagementNotification[]>([]);
  const dismissedIds = React.useRef(new Set<string>());

  const loadNotifications = React.useCallback(async () => {
    try {
      const response = await fetch("/api/management/notifications", {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as ApiResponse<{
        notifications: ManagementNotification[];
      }>;

      if (!payload.ok) {
        return;
      }

      const unread = (payload.data?.notifications ?? [])
        .filter((notification) => !notification.isRead && !dismissedIds.current.has(notification.id))
        .slice(0, 3);

      setVisibleNotifications(unread);
    } catch {
      setVisibleNotifications([]);
    }
  }, []);

  React.useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => void loadNotifications(), 30_000);

    window.addEventListener("focus", loadNotifications);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", loadNotifications);
    };
  }, [loadNotifications]);

  const dismiss = (notificationId: string) => {
    dismissedIds.current.add(notificationId);
    setVisibleNotifications((current) => current.filter((notification) => notification.id !== notificationId));
  };

  const markAsRead = async (notificationId: string) => {
    dismiss(notificationId);

    try {
      await fetch(`/api/management/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
    } catch {
      // The next poll will reconcile the local state if the request fails.
    }
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-24 z-[95] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      {visibleNotifications.map((notification) => (
        (() => {
          const content = formatManagementNotification(notification, language);

          return (
            <div
              className={`rounded-2xl border p-4 shadow-[0_18px_50px_rgba(0,0,0,0.38)] backdrop-blur-xl ${
                severityClassNames[notification.severity]
              }`}
              key={notification.id}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-black/18">
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-white">{content.title}</p>
                  <p className="mt-1 text-sm leading-5 text-white/72">{content.message}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    className="rounded-full border border-white/10 bg-black/12 p-1.5 text-white/65 transition hover:text-white"
                    onClick={() => void markAsRead(notification.id)}
                    title={language === "FR" ? "Marquer comme lue" : "Mark as read"}
                    type="button"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="rounded-full border border-white/10 bg-black/12 p-1.5 text-white/65 transition hover:text-white"
                    onClick={() => dismiss(notification.id)}
                    title={language === "FR" ? "Masquer" : "Dismiss"}
                    type="button"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      ))}
    </div>
  );
}
