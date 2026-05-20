import { z } from "zod";
import { analyzeUrl, CS2Inspect, decodeMaskedUrl, requiresSteamClient } from "cs2-inspect-lib";

import { handleRouteError, readOptionalJson, successResponse } from "@/lib/api";

const inspectRequestSchema = z.object({
  url: z.string().trim().min(1),
});

function serializeDecodedItem(decoded: Awaited<ReturnType<CS2Inspect["inspectItem"]>>) {
  const item = decoded as unknown as Record<string, unknown>;

  return {
    customName: typeof item.customname === "string" ? item.customname : null,
    defindex: typeof item.defindex === "number" ? item.defindex : null,
    itemId:
      typeof item.itemid === "bigint"
        ? item.itemid.toString()
        : typeof item.itemid === "number"
          ? String(item.itemid)
          : null,
    killEaterValue: typeof item.killeatervalue === "number" ? item.killeatervalue : null,
    paintIndex: typeof item.paintindex === "number" ? item.paintindex : null,
    paintSeed: typeof item.paintseed === "number" ? item.paintseed : null,
    paintWear: typeof item.paintwear === "number" ? item.paintwear : null,
    quality: typeof item.quality === "number" ? item.quality : null,
    rarity: typeof item.rarity === "number" ? item.rarity : null,
    sourceInspectUrl: typeof item.inspectUrl === "string" ? item.inspectUrl : null,
    stickerCount: Array.isArray(item.stickers) ? item.stickers.length : 0,
  };
}

export async function POST(request: Request) {
  try {
    const body = inspectRequestSchema.parse(await readOptionalJson(request));
    const analysis = analyzeUrl(body.url);
    const needsSteam = requiresSteamClient(body.url);
    const steamUsername = process.env.STEAM_USERNAME;
    const steamPassword = process.env.STEAM_PASSWORD;
    const canUseServerSteam = Boolean(steamUsername && steamPassword);

    if (!needsSteam) {
      const decoded = decodeMaskedUrl(body.url);

      return successResponse({
        canUseServerSteam,
        decoded: serializeDecodedItem(decoded),
        requiresSteamClient: false,
        urlType: analysis.url_type,
      });
    }

    if (!canUseServerSteam) {
      return successResponse({
        canUseServerSteam: false,
        decoded: null,
        requiresSteamClient: true,
        urlType: analysis.url_type,
      });
    }

    const inspector = new CS2Inspect({
      enableLogging: false,
      steamClient: {
        enabled: true,
        password: steamPassword,
        requestTimeout: 20000,
        username: steamUsername,
      },
      validateInput: true,
    });

    await inspector.initializeSteamClient();
    const decoded = await inspector.inspectItem(body.url);
    await inspector.disconnectSteamClient();

    return successResponse({
      canUseServerSteam: true,
      decoded: serializeDecodedItem(decoded),
      requiresSteamClient: true,
      urlType: analysis.url_type,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
