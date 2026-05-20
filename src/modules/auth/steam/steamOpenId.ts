const DEFAULT_STEAM_OPENID_PROVIDER_URL = "https://steamcommunity.com/openid/login";

export function getAppUrl(request?: Request) {
  if (process.env.APP_URL?.trim()) {
    return process.env.APP_URL.trim().replace(/\/$/, "");
  }

  if (request) {
    return new URL(request.url).origin;
  }

  return "http://localhost:3000";
}

export function getSteamOpenIdProviderUrl() {
  return process.env.STEAM_OPENID_PROVIDER_URL?.trim() || DEFAULT_STEAM_OPENID_PROVIDER_URL;
}

export function buildSteamOpenIdLoginUrl(appUrl: string) {
  const returnTo = `${appUrl}/api/auth/steam/callback`;
  const url = new URL(getSteamOpenIdProviderUrl());

  url.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
  url.searchParams.set("openid.mode", "checkid_setup");
  url.searchParams.set("openid.return_to", returnTo);
  url.searchParams.set("openid.realm", appUrl);
  url.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
  url.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");

  return url;
}
