import { afterEach, describe, expect, it, vi } from "vitest";

import { getLatestCs2News } from "@/modules/management/services/cs2NewsService";

function response(payload: unknown, ok = true) {
  return {
    json: vi.fn().mockResolvedValue(payload),
    ok,
  } as unknown as Response;
}

describe("cs2NewsService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches and cleans CS2 news from Steam", async () => {
    const fetch = vi.fn().mockResolvedValue(
      response({
        appnews: {
          newsitems: [
            {
              contents:
                "Line one with &quot;quotes&quot;.<br>SecondLine continues.\\n- Third detail with &amp; entity.",
              date: 1770000000,
              feedlabel: "Steam",
              title: "Patch notes",
              url: "https://steam.test/news",
            },
          ],
        },
      }),
    );
    vi.stubGlobal("fetch", fetch);

    const news = await getLatestCs2News(1);

    expect(fetch).toHaveBeenCalledWith(expect.any(URL), {
      cache: "no-store",
      signal: expect.any(AbortSignal),
    });
    const url = fetch.mock.calls[0][0] as URL;
    expect(url.searchParams.get("appid")).toBe("730");
    expect(url.searchParams.get("count")).toBe("1");
    expect(news[0]).toMatchObject({
      date: "2026-02-02T02:40:00.000Z",
      feedLabel: "Steam",
      href: "https://steam.test/news",
      summary: expect.stringContaining("Line one"),
      title: "Patch notes",
    });
    expect(news[0].fullText).toContain('"quotes"');
    expect(news[0].fullText).toContain("Second Line");
    expect(news[0].details.length).toBeGreaterThan(0);
  });

  it("falls back when Steam returns no items, non-ok responses, or invalid payloads", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response({ appnews: { newsitems: [] } }))
      .mockResolvedValueOnce(response({}, false))
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetch);

    await expect(getLatestCs2News()).resolves.toMatchObject([
      {
        feedLabel: "Cs-Stonks",
        title: "CS2 news feed ready",
      },
    ]);
    await expect(getLatestCs2News()).resolves.toMatchObject([
      {
        feedLabel: "Cs-Stonks",
        title: "CS2 news feed ready",
      },
    ]);
    await expect(getLatestCs2News()).resolves.toMatchObject([
      {
        feedLabel: "Cs-Stonks",
        title: "CS2 news feed ready",
      },
    ]);
  });
});
