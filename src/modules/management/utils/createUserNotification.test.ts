import { UserNotificationSeverity, UserNotificationType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { createUserNotification } from "@/modules/management/utils/createUserNotification";

describe("createUserNotification", () => {
  it("creates notifications with defaults", async () => {
    const client = {
      userNotification: {
        create: vi.fn().mockResolvedValue({ id: "notification-1" }),
      },
    };

    await expect(
      createUserNotification(
        {
          message: "Hello",
          title: "Welcome",
          userId: "user-1",
        },
        client as never,
      ),
    ).resolves.toEqual({ id: "notification-1" });
    expect(client.userNotification.create).toHaveBeenCalledWith({
      data: {
        message: "Hello",
        metadata: undefined,
        severity: UserNotificationSeverity.INFO,
        title: "Welcome",
        type: UserNotificationType.SYSTEM,
        userId: "user-1",
      },
    });
  });

  it("creates notifications with explicit metadata, severity, and type", async () => {
    const client = {
      userNotification: {
        create: vi.fn().mockResolvedValue({ id: "notification-2" }),
      },
    };

    await createUserNotification(
      {
        message: "Price moved",
        metadata: { itemId: "item-1" },
        severity: UserNotificationSeverity.WARNING,
        title: "Alert",
        type: UserNotificationType.PRICE_ALERT,
        userId: "user-1",
      },
      client as never,
    );

    expect(client.userNotification.create).toHaveBeenCalledWith({
      data: {
        message: "Price moved",
        metadata: { itemId: "item-1" },
        severity: UserNotificationSeverity.WARNING,
        title: "Alert",
        type: UserNotificationType.PRICE_ALERT,
        userId: "user-1",
      },
    });
  });
});
