import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
}));

vi.mock("@/modules/auth/session/sessionCookie", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

import { requireManagementSession } from "@/modules/management/services/requireManagementSession";

describe("requireManagementSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the current session when authenticated", async () => {
    const session = { sessionId: "session-1", user: { id: "user-1" } };
    mocks.getCurrentSession.mockResolvedValue(session);

    await expect(requireManagementSession()).resolves.toBe(session);
  });

  it("throws when there is no current session", async () => {
    mocks.getCurrentSession.mockResolvedValue(null);

    await expect(requireManagementSession()).rejects.toMatchObject({
      message: "Authentication required.",
      status: 401,
    });
  });
});
