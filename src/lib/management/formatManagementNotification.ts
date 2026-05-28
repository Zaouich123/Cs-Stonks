import type { UserNotificationSeverity, UserNotificationType } from "@prisma/client";

type Language = "FR" | "EN";

interface NotificationLike {
  message: string;
  metadata: unknown;
  severity: UserNotificationSeverity;
  title: string;
  type: UserNotificationType;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function formatAmount(value: number, currency: string | null) {
  return `${value.toFixed(2)} ${currency ?? ""}`.trim();
}

export function formatManagementNotification(notification: NotificationLike, language: Language) {
  const metadata = asRecord(notification.metadata);

  if (notification.type === "PRICE_ALERT") {
    const direction = asString(metadata.direction);
    const itemName = asString(metadata.itemName);
    const currency = asString(metadata.currency);
    const price = asNumber(metadata.price);
    const threshold = asNumber(metadata.threshold);

    if (itemName && price !== null && threshold !== null) {
      const title =
        direction === "below"
          ? language === "FR"
            ? "Seuil bas atteint"
            : "Lower threshold reached"
          : language === "FR"
            ? "Seuil haut atteint"
            : "Upper threshold reached";
      const message =
        direction === "below"
          ? language === "FR"
            ? `${itemName} est a ${formatAmount(price, currency)}, sous le seuil ${formatAmount(threshold, currency)}.`
            : `${itemName} is at ${formatAmount(price, currency)}, below the ${formatAmount(threshold, currency)} threshold.`
          : language === "FR"
            ? `${itemName} est a ${formatAmount(price, currency)}, au-dessus du seuil ${formatAmount(threshold, currency)}.`
            : `${itemName} is at ${formatAmount(price, currency)}, above the ${formatAmount(threshold, currency)} threshold.`;

      return { message, title };
    }
  }

  if (notification.type === "CS2_UPDATE") {
    const newsTitle = asString(metadata.newsTitle) ?? notification.message;

    return {
      message: newsTitle,
      title: language === "FR" ? "Nouvelle news CS2" : "New CS2 news",
    };
  }

  return {
    message: notification.message,
    title: notification.title,
  };
}
