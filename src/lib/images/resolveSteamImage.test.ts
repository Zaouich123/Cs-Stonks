import { describe, expect, it } from "vitest";

import { resolveSteamImage } from "@/lib/images/resolveSteamImage";

describe("resolveSteamImage", () => {
  it("prefers the explicit provider image and mirrors it as steam image when needed", () => {
    expect(
      resolveSteamImage({
        fallbackImageUrl: "https://community.akamai.steamstatic.com/economy/image/hash123",
      }),
    ).toEqual({
      imageUrl: "https://community.akamai.steamstatic.com/economy/image/hash123",
      steamImageUrl: "https://community.akamai.steamstatic.com/economy/image/hash123",
    });
  });

  it("builds a deterministic CDN url from an inventory path when no direct image is present", () => {
    expect(
      resolveSteamImage({
        imageInventoryPath: "econ/tools/tag",
      }),
    ).toEqual({
      imageUrl: "https://community.akamai.steamstatic.com/economy/image/econ%2Ftools%2Ftag",
      steamImageUrl: "https://community.akamai.steamstatic.com/economy/image/econ%2Ftools%2Ftag",
    });
  });
});
