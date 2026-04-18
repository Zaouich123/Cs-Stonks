interface ResolveSteamImageInput {
  fallbackImageUrl?: string | null;
  imageInventoryPath?: string | null;
  steamImageUrl?: string | null;
}

function asNullableUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function buildInventoryImageUrl(imageInventoryPath?: string | null): string | null {
  if (!imageInventoryPath) {
    return null;
  }

  return `https://community.akamai.steamstatic.com/economy/image/${encodeURIComponent(imageInventoryPath)}`;
}

export function resolveSteamImage(input: ResolveSteamImageInput) {
  const fallbackImageUrl = asNullableUrl(input.fallbackImageUrl);
  const explicitSteamImageUrl = asNullableUrl(input.steamImageUrl);
  const inventoryImageUrl = buildInventoryImageUrl(asNullableUrl(input.imageInventoryPath));
  const steamImageUrl = explicitSteamImageUrl ?? fallbackImageUrl ?? inventoryImageUrl;
  const imageUrl = fallbackImageUrl ?? steamImageUrl ?? inventoryImageUrl;

  return {
    imageUrl,
    steamImageUrl,
  };
}
