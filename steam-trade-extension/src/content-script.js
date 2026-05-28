/* global chrome */

const DEFAULT_API_BASE = "http://localhost:3000";
const LEGACY_API_BASES = new Set(["http://localhost:3001"]);
const ENABLE_NEW_TRADE_ITEM_BADGES = true;
const HOVER_CACHE = new Map();
const HOVER_DIAGNOSTICS = new Map();
const INVENTORY_CACHE = new Map();
let analyzeTimer = null;
let inventoryBadgeRunId = 0;
let lastNewTradeOfferSignature = null;
let lastVisibleInventorySignature = null;

function logDebug() {}

function isTradeOfferPage() {
  return window.location.hostname === "steamcommunity.com" && window.location.pathname.includes("tradeoffer");
}

function isNewTradeOfferPage() {
  return window.location.pathname.toLowerCase().includes("/tradeoffer/new");
}

function getStorageValue(defaults) {
  if (!globalThis.chrome?.storage?.sync) {
    return Promise.resolve(defaults);
  }

  return new Promise((resolve) => {
    chrome.storage.sync.get(defaults, resolve);
  });
}

async function getConfig() {
  const config = await getStorageValue({
    apiBase: DEFAULT_API_BASE,
  });
  const storedApiBase = String(config.apiBase || DEFAULT_API_BASE).replace(/\/+$/u, "");

  return {
    apiBase: LEGACY_API_BASES.has(storedApiBase) ? DEFAULT_API_BASE : storedApiBase,
  };
}

function normalizeText(value) {
  return value.replace(/\s+/gu, " ").trim();
}

function normalizeName(value) {
  return normalizeText(value).toLowerCase();
}

function parseTradeOfferId(offerRoot) {
  const rootId = offerRoot.id?.match(/tradeofferid_(\d+)/u)?.[1];

  if (rootId) {
    return rootId;
  }

  const pathId = window.location.pathname.match(/\/tradeoffer\/(\d+)/u)?.[1];

  if (pathId) {
    return pathId;
  }

  const link = offerRoot.querySelector("[onclick*='ShowTradeOffer'], a[href*='ShowTradeOffer']");
  const scriptValue = link?.getAttribute("onclick") ?? link?.getAttribute("href") ?? "";

  return scriptValue.match(/ShowTradeOffer\(\s*['"](\d+)['"]/u)?.[1] ?? null;
}

function getOfferRoots() {
  const roots = [...document.querySelectorAll(".tradeoffer")];

  if (roots.length > 0) {
    return roots;
  }

  const yourContainer = findFirstExisting([
    "#your_slots",
    "#trade_yours",
    ".trade_yours",
    "[id*='your'][id*='slot']",
    "[id*='your'][class*='slot']",
  ]);
  const theirContainer = findFirstExisting([
    "#their_slots",
    "#trade_theirs",
    ".trade_theirs",
    "[id*='their'][id*='slot']",
    "[id*='their'][class*='slot']",
  ]);

  if (yourContainer && theirContainer) {
    let root = yourContainer;

    while (root && root !== document.body) {
      if (root.contains(theirContainer)) {
        return [root];
      }

      root = root.parentElement;
    }
  }

  const detailElement = document.querySelector(
    "#trade_yours, #trade_theirs, #your_slots, #their_slots, .trade_area, #tradeoffer, .tradeoffer_items_ctn",
  );
  const detailRoot =
    detailElement?.closest(".trade_area, #tradeoffer, .responsive_page_content, .responsive_page_template_content") ??
    detailElement;

  return detailRoot ? [detailRoot] : [];
}

function findFirstExisting(selectors, root = document) {
  for (const selector of selectors) {
    const element = root.querySelector(selector);

    if (element) {
      return element;
    }
  }

  return null;
}

function getDirection(offerRoot) {
  const header = normalizeText(offerRoot.querySelector(".tradeoffer_header")?.textContent ?? "").toLowerCase();
  const path = window.location.pathname.toLowerCase();

  if (
    path.includes("/sent") ||
    header.includes("vous avez propose") ||
    header.includes("vous avez proposé") ||
    header.includes("you offered")
  ) {
    return "sent";
  }

  return "received";
}

function getTradeItemElements(container) {
  const elements = [
    ...container.querySelectorAll(
      ".trade_item[data-economy-item], .trade_item, .tradeoffer_item, .itemHolder .item, .slot .item, [data-economy-item]",
    ),
  ].filter(
    (element) =>
      element instanceof HTMLElement &&
      (Boolean(getEconomyElement(element)) ||
        Boolean(element.querySelector("img")) ||
        Boolean(getComputedStyle(element).backgroundImage.match(/url\(/u))),
  );

  return [...new Set(elements)];
}

function getInlineItemName(element) {
  const attributes = [
    element.getAttribute("data-market-hash-name"),
    element.getAttribute("data-market_hash_name"),
    element.getAttribute("data-name"),
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.querySelector("img")?.getAttribute("alt"),
    element.querySelector(".hover_item_name")?.textContent,
    element.querySelector(".item_desc_item_name")?.textContent,
    element.querySelector(".item_desc_name")?.textContent,
    element.querySelector(".trade_item_desc_name")?.textContent,
  ];

  const candidate = attributes
    .map((value) => (value ? normalizeText(value) : ""))
    .find((value) => value.length > 2 && !value.toLowerCase().includes("counter-strike 2"));

  return candidate ?? null;
}

function getImageUrl(element) {
  const src = element.querySelector("img")?.getAttribute("src") ?? null;

  if (src) {
    return src.startsWith("//") ? `https:${src}` : src;
  }

  const backgroundImage = getComputedStyle(element).backgroundImage;
  const backgroundMatch = backgroundImage.match(/url\(["']?([^"')]+)["']?\)/u);
  const backgroundUrl = backgroundMatch?.[1] ?? null;

  if (!backgroundUrl || backgroundUrl === "none") {
    return null;
  }

  return backgroundUrl.startsWith("//") ? `https:${backgroundUrl}` : backgroundUrl;
}

function getEconomyElement(element) {
  return element.matches("[data-economy-item]")
    ? element
    : element.closest("[data-economy-item]") ?? element.querySelector("[data-economy-item]");
}

function getAmount(element) {
  const countText =
    element.querySelector(".item_count, .trade_item_count, .inventory_item_stack_amount")?.textContent ?? "1";
  const numericText = normalizeText(countText).replace(/[^\d]/gu, "");
  const amount = Number(numericText || "1");

  return Number.isFinite(amount) && amount > 0 ? amount : 1;
}

function isVisibleElement(element) {
  const rect = element.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0;
}

function readJsonAttribute(selector, attribute) {
  const value = document.querySelector(selector)?.getAttribute(attribute);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readPageStringVariable(name) {
  const pattern = new RegExp(`var\\s+${name}\\s*=\\s*['"]([^'"]+)['"]`, "u");

  for (const script of document.scripts) {
    const match = script.textContent?.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function getCurrentSteamId() {
  const userInfo = readJsonAttribute("#application_config", "data-userinfo");

  return userInfo?.steamid ? String(userInfo.steamid) : readPageStringVariable("g_steamID");
}

function getTradePartnerSteamId() {
  return readPageStringVariable("g_ulTradePartnerSteamID");
}

function isTheirInventoryActive() {
  const inventoryBox = document.querySelector("#inventory_box");

  if (inventoryBox?.classList.contains("their_inventory_active")) {
    return true;
  }

  if (inventoryBox?.classList.contains("your_inventory_active")) {
    return false;
  }

  return Boolean(document.querySelector("#inventory_select_their_inventory.active"));
}

function parseAssetIdentity(element) {
  const idCandidate = element.id || element.querySelector("[id^='item']")?.id || "";
  const idMatch = idCandidate.match(/^item(\d+)_(\d+)_(\d+)$/u);

  if (idMatch) {
    return {
      appId: idMatch[1],
      assetId: idMatch[3],
      contextId: idMatch[2],
    };
  }

  const linkValue = element.querySelector("a[href*='/inventory/#']")?.getAttribute("href") ?? "";
  const linkMatch = linkValue.match(/#(\d+)_(\d+)_(\d+)/u);

  if (!linkMatch) {
    return null;
  }

  return {
    appId: linkMatch[1],
    assetId: linkMatch[3],
    contextId: linkMatch[2],
  };
}

function getOwnerSteamId(element) {
  if (element.closest("#your_slots, #trade_yours")) {
    return getCurrentSteamId();
  }

  if (element.closest("#their_slots, #trade_theirs")) {
    return getTradePartnerSteamId();
  }

  const inventoryContainerId = element.closest(".inventory_ctn[id^='inventory_']")?.id ?? "";
  const inventoryContainerMatch = inventoryContainerId.match(/^inventory_(\d+)_(\d+)_(\d+)$/u);

  if (inventoryContainerMatch?.[1]) {
    return inventoryContainerMatch[1];
  }

  if (element.closest("#inventories, #inventory_box")) {
    return isTheirInventoryActive() ? getTradePartnerSteamId() : getCurrentSteamId();
  }

  const profileLink = element.querySelector("a[href*='/profiles/']")?.getAttribute("href") ?? "";
  const profileMatch = profileLink.match(/\/profiles\/(\d+)/u);

  return profileMatch?.[1] ?? getCurrentSteamId();
}

function getDescriptionFromInventoryPayload(payload, assetId) {
  const inventory = payload?.rgInventory;
  const descriptions = payload?.rgDescriptions;
  const asset = Array.isArray(inventory)
    ? inventory.find((entry) => String(entry?.id ?? entry?.assetid) === String(assetId))
    : inventory?.[assetId];

  if (!asset || !descriptions) {
    return null;
  }

  const descriptionKey = `${asset.classid}_${asset.instanceid}`;
  const description = descriptions[descriptionKey];

  if (!description) {
    return null;
  }

  const name = description.market_hash_name || description.market_name || description.name;

  if (typeof name !== "string" || name.trim().length < 2) {
    return null;
  }

  return {
    imageUrl: description.icon_url
      ? `https://community.fastly.steamstatic.com/economy/image/${description.icon_url}/96fx96f`
      : null,
    name: normalizeText(name),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`inventory ${response.status}`);
  }

  return response.json();
}

async function fetchInventoryItemInfo(element) {
  const identity = parseAssetIdentity(element);
  const ownerSteamId = getOwnerSteamId(element);

  if (!identity || !ownerSteamId) {
    HOVER_DIAGNOSTICS.set("last", "missing asset identity");
    logDebug("Item resolution skipped: missing asset identity or owner.", {
      element: describeElement(element),
      identity,
      ownerSteamId,
    });
    return null;
  }

  const cacheKey = `${ownerSteamId}/${identity.appId}/${identity.contextId}`;

  logDebug("Resolving item through inventory payload.", {
    cacheHit: INVENTORY_CACHE.has(cacheKey),
    cacheKey,
    element: describeElement(element),
    identity,
    ownerSteamId,
  });

  if (!INVENTORY_CACHE.has(cacheKey)) {
    INVENTORY_CACHE.set(
      cacheKey,
      (async () => {
        const inventoryUrl =
          `https://steamcommunity.com/profiles/${ownerSteamId}/inventory/json/` +
          `${identity.appId}/${identity.contextId}?l=english`;

        try {
          logDebug("Fetching inventory JSON.", {
            appId: identity.appId,
            contextId: identity.contextId,
            ownerSteamId,
            url: inventoryUrl,
          });

          return await fetchJson(inventoryUrl);
        } catch (error) {
          const sessionId = readPageStringVariable("g_sessionID");
          const partnerSteamId = getTradePartnerSteamId();

          if (ownerSteamId !== partnerSteamId || !sessionId) {
            logDebug("Inventory JSON failed without partner fallback.", {
              error: error instanceof Error ? error.message : String(error),
              ownerSteamId,
              partnerSteamId,
            });
            throw error;
          }

          const partnerUrl =
            "https://steamcommunity.com/tradeoffer/new/partnerinventory/" +
            `?sessionid=${encodeURIComponent(sessionId)}` +
            `&partner=${encodeURIComponent(partnerSteamId)}` +
            `&appid=${encodeURIComponent(identity.appId)}` +
            `&contextid=${encodeURIComponent(identity.contextId)}` +
            "&l=english";

          logDebug("Fetching partner inventory fallback.", {
            appId: identity.appId,
            contextId: identity.contextId,
            partnerSteamId,
            url: partnerUrl.replace(/sessionid=[^&]+/u, "sessionid=<hidden>"),
          });

          return fetchJson(partnerUrl);
        }
      })(),
    );
  }

  try {
    const payload = await INVENTORY_CACHE.get(cacheKey);
    const itemInfo = getDescriptionFromInventoryPayload(payload, identity.assetId);

    if (!itemInfo) {
      HOVER_DIAGNOSTICS.set("last", `asset ${identity.assetId} missing from inventory payload`);
      logDebug("Inventory payload did not contain the asset description.", {
        assetId: identity.assetId,
        cacheKey,
      });
    } else {
      logDebug("Item resolved from inventory payload.", {
        assetId: identity.assetId,
        cacheKey,
        name: itemInfo.name,
      });
    }

    return itemInfo;
  } catch (error) {
    HOVER_DIAGNOSTICS.set("last", error instanceof Error ? error.message : "inventory fetch failed");
    logDebug("Item resolution failed through inventory payload.", {
      cacheKey,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function parseEconomyItem(element) {
  const economyElement = getEconomyElement(element);
  const value = economyElement?.getAttribute("data-economy-item") ?? "";
  const match =
    value.match(/classinfo\/(\d+)\/(\d+)\/(\d+)/u) ??
    value.match(/classinfo\/(\d+)\/2\/(\d+)\/(\d+)/u) ??
    value.match(/(\d+)\/2\/(\d+)\/(\d+)/u);

  if (!match) {
    return null;
  }

  return {
    appId: match[1],
    classId: match[2],
    instanceId: match[3],
  };
}

function extractBuildHoverPayload(html) {
  const marker = "BuildHover";
  const markerIndex = html.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const firstBraceIndex = html.indexOf("{", markerIndex);

  if (firstBraceIndex === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = firstBraceIndex; index < html.length; index += 1) {
    const character = html[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return html.slice(firstBraceIndex, index + 1);
      }
    }
  }

  return null;
}

function readNameFromHoverHtml(html) {
  const buildHoverPayload = extractBuildHoverPayload(html);

  if (buildHoverPayload) {
    try {
      const payload = JSON.parse(buildHoverPayload);
      const marketHashName = payload.market_hash_name || payload.market_name || payload.name;

      if (typeof marketHashName === "string" && marketHashName.trim().length > 2) {
        return normalizeText(marketHashName);
      }
    } catch {
      // Steam may change the inline payload shape; fall through to DOM parsing.
    }
  }

  const documentFromHover = new DOMParser().parseFromString(html, "text/html");
  const selectors = [
    ".hover_item_name",
    ".item_desc_item_name",
    ".item_desc_name",
    ".market_listing_item_name",
    "h1",
  ];

  let name = null;

  for (const selector of selectors) {
    const value = normalizeText(documentFromHover.querySelector(selector)?.textContent ?? "");

    if (value.length > 2) {
      name = value;
      break;
    }
  }

  if (!name) {
    const titleMatch = html.match(/class=["'][^"']*(?:hover_item_name|item_desc_item_name)[^"']*["'][^>]*>([^<]+)/iu);

    name = titleMatch ? normalizeText(titleMatch[1]) : null;
  }

  if (!name) {
    return null;
  }

  const fullText = normalizeText(documentFromHover.body.textContent ?? "");
  const exteriorMatch = fullText.match(
    /Exterior:\s*(Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)/iu,
  );
  const exterior = exteriorMatch?.[1];

  if (exterior && !name.includes("(")) {
    return `${name} (${exterior})`;
  }

  return name;
}

async function fetchItemNameFromSteam(element) {
  const economyItem = parseEconomyItem(element);

  if (!economyItem) {
    HOVER_DIAGNOSTICS.set("last", "missing data-economy-item");
    return null;
  }

  const key = `${economyItem.appId}/${economyItem.classId}/${economyItem.instanceId}`;

  if (HOVER_CACHE.has(key)) {
    return HOVER_CACHE.get(key);
  }

  const url = `https://steamcommunity.com/economy/itemclasshover/${economyItem.appId}/${economyItem.classId}/${economyItem.instanceId}?content_only=1&l=english`;

  try {
    const response = await fetch(url, {
      credentials: "include",
    });

    if (!response.ok) {
      HOVER_DIAGNOSTICS.set("last", `hover ${response.status} for ${key}`);
      HOVER_CACHE.set(key, null);
      return null;
    }

    const hoverHtml = await response.text();
    const name = readNameFromHoverHtml(hoverHtml);

    if (!name) {
      HOVER_DIAGNOSTICS.set(
        "last",
        `hover response without market_hash_name for ${key} (${hoverHtml.length} chars)`,
      );
    }

    HOVER_CACHE.set(key, name);
    return name;
  } catch (error) {
    HOVER_DIAGNOSTICS.set("last", error instanceof Error ? error.message : "hover fetch failed");
    HOVER_CACHE.set(key, null);
    return null;
  }
}

async function resolveItem(element) {
  const inlineName = getInlineItemName(element);
  const inventoryItemInfo = inlineName ? null : await fetchInventoryItemInfo(element);
  const name = inlineName ?? inventoryItemInfo?.name ?? (await fetchItemNameFromSteam(element));

  if (!name) {
    return null;
  }

  return {
    amount: getAmount(element),
    element,
    imageUrl: getImageUrl(element) ?? inventoryItemInfo?.imageUrl ?? null,
    name,
  };
}

async function resolveContainerItems(container) {
  const elements = getTradeItemElements(container);
  const items = await Promise.all(elements.map((element) => resolveItem(element)));

  return {
    detectedCount: elements.length,
    items: items.filter(Boolean),
    namedCount: items.filter(Boolean).length,
  };
}

function getVisibleInventoryRoot() {
  return findFirstExisting([
    "#inventories",
    "#inventory_box",
    "#inventory_yours",
    ".inventory_ctn",
    ".inventory_page",
  ]);
}

async function parseVisibleInventoryItems() {
  const inventoryRoot = getVisibleInventoryRoot();

  if (!inventoryRoot) {
    return {
      detectedCount: 0,
      items: [],
      namedCount: 0,
      root: null,
    };
  }

  const elements = getTradeItemElements(inventoryRoot).filter((element) => {
    if (!isVisibleElement(element)) {
      return false;
    }

    if (element.closest("#your_slots, #their_slots, #trade_yours, #trade_theirs")) {
      return false;
    }

    return true;
  });
  const items = await Promise.all(elements.map((element) => resolveItem(element)));
  const resolvedItems = items.filter(Boolean);

  return {
    detectedCount: elements.length,
    items: aggregateItems(resolvedItems),
    namedCount: resolvedItems.length,
    root: inventoryRoot,
  };
}

function aggregateItems(items) {
  const map = new Map();

  for (const item of items) {
    const key = normalizeName(item.name);
    const current = map.get(key);

    if (current) {
      current.amount += item.amount;
      current.elements.push(item.element);
      current.imageUrl = current.imageUrl || item.imageUrl;
      continue;
    }

    map.set(key, {
      amount: item.amount,
      elements: [item.element],
      imageUrl: item.imageUrl,
      name: item.name,
    });
  }

  return [...map.values()];
}

function getItemsSignature(items) {
  return items
    .map((item) => `${normalizeName(item.name)}:${item.amount}`)
    .sort()
    .join("|");
}

function getNewTradeOfferSignature(offer) {
  return [
    `give=${getItemsSignature(offer?.itemsToGive ?? [])}`,
    `receive=${getItemsSignature(offer?.itemsToReceive ?? [])}`,
  ].join(";");
}

function getVisibleInventorySignature(inventory) {
  return [
    `root=${inventory?.root?.id ?? "unknown"}`,
    `items=${getItemsSignature(inventory?.items ?? [])}`,
  ].join(";");
}

async function parseOffer(offerRoot) {
  const containers = [...offerRoot.querySelectorAll(".tradeoffer_items")];
  const primary = containers.find((container) => container.classList.contains("primary")) ?? containers[0];
  const secondary = containers.find((container) => container.classList.contains("secondary")) ?? containers[1];

  if (primary && secondary) {
    const direction = getDirection(offerRoot);
    const primaryResult = await resolveContainerItems(primary);
    const secondaryResult = await resolveContainerItems(secondary);
    const primaryAggregated = aggregateItems(primaryResult.items);
    const secondaryAggregated = aggregateItems(secondaryResult.items);

    return {
      debug: {
        mode: "tradeoffer-list",
        primaryDetected: primaryResult.detectedCount,
        primaryNamed: primaryResult.namedCount,
        secondaryDetected: secondaryResult.detectedCount,
        secondaryNamed: secondaryResult.namedCount,
      },
      direction,
      panels: {
        give: direction === "sent" ? primary : secondary,
        receive: direction === "sent" ? secondary : primary,
      },
      itemsToGive: direction === "sent" ? primaryAggregated : secondaryAggregated,
      itemsToReceive: direction === "sent" ? secondaryAggregated : primaryAggregated,
      root: offerRoot,
      tradeOfferId: parseTradeOfferId(offerRoot),
    };
  }

  const yourContainer = findFirstExisting(
    [
    "#trade_yours",
    "#your_slots",
    ".trade_yours",
    "[id*='your'][id*='slot']",
    "[id*='your'][class*='slot']",
    ],
    offerRoot,
  );
  const theirContainer = findFirstExisting(
    [
    "#trade_theirs",
    "#their_slots",
    ".trade_theirs",
    "[id*='their'][id*='slot']",
    "[id*='their'][class*='slot']",
    ],
    offerRoot,
  );

  if (!yourContainer || !theirContainer) {
    return {
      debug: {
        mode: "tradeoffer-detail",
        reason: "Missing your/their containers.",
        rootClasses: offerRoot.className,
      },
      direction: "received",
      itemsToGive: [],
      itemsToReceive: [],
      renderTarget: offerRoot,
      root: offerRoot,
      tradeOfferId: parseTradeOfferId(offerRoot),
    };
  }

  const yourResult = await resolveContainerItems(yourContainer);
  const theirResult = await resolveContainerItems(theirContainer);
  const yourItems = aggregateItems(yourResult.items);
  const theirItems = aggregateItems(theirResult.items);

  return {
    debug: {
      mode: "tradeoffer-detail",
      theirDetected: theirResult.detectedCount,
      theirNamed: theirResult.namedCount,
      yourDetected: yourResult.detectedCount,
      yourNamed: yourResult.namedCount,
    },
    direction: "received",
    panels: {
      give: yourContainer,
      receive: theirContainer,
    },
    itemsToGive: yourItems,
    itemsToReceive: theirItems,
    renderTarget: theirContainer,
    root: offerRoot,
    tradeOfferId: parseTradeOfferId(offerRoot),
  };
}

async function requestAnalysis(apiBase, offer) {
  const toPayload = (items) =>
    items.map((item) => ({
      amount: item.amount,
      imageUrl: item.imageUrl,
      name: item.name,
    }));
  const requestPayload = {
    itemsToGive: toPayload(offer.itemsToGive),
    itemsToReceive: toPayload(offer.itemsToReceive),
    source: "steam-extension",
    tradeOfferId: offer.tradeOfferId,
  };

  logDebug("Requesting Cs-Stonks analysis.", {
    apiBase,
    giveCount: requestPayload.itemsToGive.length,
    giveNames: requestPayload.itemsToGive.map((item) => `${item.amount}x ${item.name}`),
    receiveCount: requestPayload.itemsToReceive.length,
    receiveNames: requestPayload.itemsToReceive.map((item) => `${item.amount}x ${item.name}`),
    tradeOfferId: requestPayload.tradeOfferId,
  });

  const response = await fetch(`${apiBase}/api/extension/trade-analysis`, {
    body: JSON.stringify(requestPayload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    logDebug("Cs-Stonks analysis request failed.", {
      error: payload?.error?.message ?? null,
      status: response.status,
    });
    throw new Error(payload?.error?.message ?? `Cs-Stonks API error ${response.status}`);
  }

  logDebug("Cs-Stonks analysis received.", {
    netValue: payload.data?.summary?.netValue ?? null,
    totalGiven: payload.data?.summary?.totalGiven ?? null,
    totalReceived: payload.data?.summary?.totalReceived ?? null,
    unpricedItems: payload.data?.summary?.unpricedItems ?? null,
  });

  return payload.data;
}

function formatMoney(value) {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("fr-FR", {
    currency: "EUR",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function formatSignedMoney(value) {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }

  const amount = Math.abs(value);
  const sign = value >= 0 ? "+" : "-";

  return `${sign}${formatMoney(amount)}`;
}

function createInlineTotal(label, value, tone) {
  const total = document.createElement("div");
  total.className = `cs-stonks-inventory-total ${tone ?? ""}`;
  total.innerHTML = `
    <span>${label}</span>
    <strong>${value}</strong>
  `;

  return total;
}

function insertPanelTotal(panel, total) {
  const tradeOfferPanel = panel.matches("#trade_yours, #trade_theirs")
    ? panel
    : panel.closest("#trade_yours, #trade_theirs");

  if (tradeOfferPanel) {
    const header = tradeOfferPanel.querySelector(".offerheader");
    const itemBox = tradeOfferPanel.querySelector(".trade_item_box");
    const target = header ?? itemBox;

    if (target) {
      target.insertAdjacentElement(header ? "afterend" : "beforebegin", total);
      logDebug("Inserted panel total outside Steam slot container.", {
        panel: describeElement(panel),
        target: describeElement(target),
        totalClass: total.className,
      });
      return;
    }
  }

  const titleElement = [...panel.querySelectorAll("*")].find((element) =>
    /a propos|a proposé|propose|proposé|offered|en echange|en échange|in exchange/iu.test(
      normalizeText(element.textContent ?? ""),
    ),
  );

  if (titleElement) {
    titleElement.insertAdjacentElement("afterend", total);
    return;
  }

  const firstItem = panel.querySelector(".trade_item, .tradeoffer_item, [data-economy-item]");

  if (firstItem) {
    const slotContainer = firstItem.closest("#your_slots, #their_slots");

    if (slotContainer) {
      slotContainer.insertAdjacentElement("beforebegin", total);
      logDebug("Inserted panel total before Steam slot container fallback.", {
        panel: describeElement(panel),
        slotContainer: describeElement(slotContainer),
        totalClass: total.className,
      });
      return;
    }

    firstItem.insertAdjacentElement("beforebegin", total);
    return;
  }

  panel.appendChild(total);
}

function applyItemBadges(offer, analysis) {
  const pricedItems = [...analysis.offer.itemsToGive, ...analysis.offer.itemsToReceive];
  const priceByName = new Map(pricedItems.map((item) => [normalizeName(item.name), item.unitPriceEur]));
  const rawItems = [...offer.itemsToGive, ...offer.itemsToReceive];

  for (const item of rawItems) {
    const unitPrice = priceByName.get(normalizeName(item.name)) ?? null;

    for (const element of item.elements) {
      applyPriceBadge(element, unitPrice);
    }
  }
}

function applyPricedItemBadges(rawItems, pricedItems) {
  const priceByName = new Map(pricedItems.map((item) => [normalizeName(item.name), item.unitPriceEur]));

  for (const item of rawItems) {
    const unitPrice = priceByName.get(normalizeName(item.name)) ?? null;

    for (const element of item.elements) {
      applyPriceBadge(element, unitPrice);
    }
  }
}

function clearInventoryBadges(inventoryRoot) {
  inventoryRoot?.querySelectorAll(".cs-stonks-item-badge").forEach((element) => element.remove());
}

function getItemBadgeHost(element) {
  if (!isNewTradeOfferPage()) {
    return element;
  }

  return element.closest(".itemHolder, .trade_slot") ?? element;
}

function applyPriceBadge(element, unitPrice) {
  const host = getItemBadgeHost(element);

  element.querySelector(".cs-stonks-item-badge")?.remove();
  host.querySelector(":scope > .cs-stonks-item-badge")?.remove();
  host.classList.add("cs-stonks-item-badge-host");

  const badge = document.createElement("div");
  badge.className = "cs-stonks-item-badge";
  badge.textContent = formatMoney(unitPrice);
  host.appendChild(badge);
}

async function updateVisibleInventoryBadges(apiBase) {
  const runId = ++inventoryBadgeRunId;

  logDebug("Visible inventory badge update started.", { runId });

  if (isNewTradeOfferPage() && !ENABLE_NEW_TRADE_ITEM_BADGES) {
    clearInventoryBadges(getVisibleInventoryRoot());
    logDebug("Visible inventory badge update disabled on new trade page.", {
      reason: "Steam tradeoffer/new mutates item nodes during add/remove.",
      runId,
    });
    return;
  }

  try {
    const inventory = await parseVisibleInventoryItems();
    const inventorySignature = getVisibleInventorySignature(inventory);

    if (runId !== inventoryBadgeRunId) {
      logDebug("Visible inventory badge update cancelled: stale run.", {
        currentRunId: inventoryBadgeRunId,
        runId,
      });
      return;
    }

    if (inventorySignature === lastVisibleInventorySignature) {
      logDebug("Visible inventory unchanged; badge update skipped.", {
        signature: inventorySignature,
      });
      return;
    }

    lastVisibleInventorySignature = inventorySignature;
    clearInventoryBadges(inventory.root);

    logDebug("Parsed visible inventory.", {
      detected: inventory.detectedCount,
      named: inventory.namedCount,
      signature: inventorySignature,
    });

    if (inventory.items.length === 0) {
      logDebug("Visible inventory has no resolved items.", {
        detected: inventory.detectedCount,
        named: inventory.namedCount,
      });
      return;
    }

    const inventoryAnalysis = await requestAnalysis(apiBase, {
      itemsToGive: inventory.items,
      itemsToReceive: [],
      tradeOfferId: "visible-inventory",
    });

    if (runId !== inventoryBadgeRunId) {
      logDebug("Visible inventory badge apply cancelled: stale run.", {
        currentRunId: inventoryBadgeRunId,
        runId,
      });
      return;
    }

    applyPricedItemBadges(inventory.items, inventoryAnalysis.offer.itemsToGive);
    logDebug("Visible inventory badges applied.", {
      pricedCount: inventoryAnalysis.offer.itemsToGive.length,
      runId,
    });
  } catch (error) {
    logDebug("Visible inventory badge update skipped.", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function getOfferVerdictText(summary) {
  if (summary.unpricedItems > 0 || summary.netValue === null) {
    return {
      label: "Analyse incomplete",
      tone: "neutral",
    };
  }

  if (summary.netValue >= 0) {
    return {
      label: "Bénéfice",
      tone: "positive",
    };
  }

  return {
    label: "Déficit",
    tone: "negative",
  };
}

function renderNewTradeAnalysis(offer, analysis) {
  offer.root.querySelectorAll(
    ".cs-stonks-analysis, .cs-stonks-inline-summary, .cs-stonks-inventory-total, .cs-stonks-new-trade-summary",
  ).forEach((element) => element.remove());

  const summary = analysis.summary;
  const verdict = getOfferVerdictText(summary);
  const card = document.createElement("div");

  card.className = `cs-stonks-new-trade-summary ${verdict.tone}`;
  card.innerHTML = `
    <div class="cs-stonks-new-trade-header">
      <strong>${verdict.label}</strong>
      <div class="cs-stonks-new-trade-net">${formatSignedMoney(summary.netValue)}</div>
    </div>
    ${
      summary.unpricedItems > 0
        ? `<div class="cs-stonks-inline-warning">${summary.unpricedItems} item(s) sans prix</div>`
        : ""
    }
  `;

  const rightColumn =
    offer.root.closest(".tradeoffer") ??
    findFirstExisting(["#trade_right", ".trade_right", "#trade_area", ".trade_area"], document) ??
    offer.root;
  const target = offer.panels?.give ?? offer.renderTarget ?? rightColumn;

  logDebug("Rendering new trade summary.", {
    giveCount: offer.itemsToGive.length,
    receiveCount: offer.itemsToReceive.length,
    target: describeElement(target),
    totalGiven: summary.totalGiven,
    totalReceived: summary.totalReceived,
  });

  target.insertAdjacentElement("beforebegin", card);

  if (ENABLE_NEW_TRADE_ITEM_BADGES) {
    applyItemBadges(offer, analysis);
  } else {
    logDebug("Trade slot item badges disabled on new trade page.", {
      reason: "Keep Steam draggable/clickable item nodes untouched.",
    });
  }
}

function renderAnalysis(offer, analysis) {
  offer.root.querySelector(".cs-stonks-analysis")?.remove();
  offer.root.querySelector(".cs-stonks-inline-summary")?.remove();
  offer.root.querySelectorAll(".cs-stonks-inventory-total").forEach((element) => element.remove());

  const summary = analysis.summary;
  const netTone = summary.netValue === null ? "neutral" : summary.netValue >= 0 ? "positive" : "negative";
  const netLabel = summary.netValue === null ? "Gain net" : summary.netValue >= 0 ? "Benefice" : "Deficit";
  const summaryBar = document.createElement("div");

  summaryBar.className = `cs-stonks-inline-summary ${netTone}`;
  summaryBar.innerHTML = `
    <div>
      <span>Cs-Stonks</span>
      <strong>${netLabel} ${formatMoney(summary.netValue)}</strong>
    </div>
  `;

  if (summary.unpricedItems > 0) {
    const warning = document.createElement("div");
    warning.className = "cs-stonks-inline-warning";
    warning.textContent = `${summary.unpricedItems} item(s) sans prix`;
    summaryBar.appendChild(warning);
  }

  const firstTradePanel =
    offer.root.querySelector(".tradeoffer_items.primary") ??
    offer.root.querySelector(".tradeoffer_items") ??
    offer.renderTarget ??
    offer.root;

  const firstPanelTitle =
    firstTradePanel.querySelector(".tradeoffer_items_banner, .tradeoffer_items_owner, .tradeoffer_items_header") ??
    firstTradePanel.firstElementChild;

  if (firstPanelTitle) {
    firstPanelTitle.insertAdjacentElement("beforebegin", summaryBar);
  } else {
    firstTradePanel.prepend(summaryBar);
  }

  if (offer.panels?.give) {
    insertPanelTotal(offer.panels.give, createInlineTotal("Total donne", formatMoney(summary.totalGiven), "negative"));
  }

  if (offer.panels?.receive) {
    insertPanelTotal(offer.panels.receive, createInlineTotal("Total recu", formatMoney(summary.totalReceived), "positive"));
  }

  applyItemBadges(offer, analysis);
}

function renderError(offerRoot, message) {
  offerRoot.querySelectorAll(".cs-stonks-analysis").forEach((element) => element.remove());
  logDebug("Rendering error panel.", { message, root: describeElement(offerRoot) });

  const card = document.createElement("div");
  card.className = "cs-stonks-analysis neutral";
  card.innerHTML = `
    <div class="cs-stonks-card-header">
      <div>
        <div class="cs-stonks-kicker">Cs-Stonks</div>
        <h3>Analyse indisponible</h3>
      </div>
    </div>
    <div class="cs-stonks-warning">${message}</div>
  `;

  const target = offerRoot.querySelector(".tradeoffer_footer") ?? offerRoot;

  if (target === offerRoot) {
    offerRoot.prepend(card);
    return;
  }

  target.insertAdjacentElement("beforebegin", card);
}

function clearExtensionUi(offerRoot) {
  offerRoot.querySelectorAll(
    ".cs-stonks-analysis, .cs-stonks-inline-summary, .cs-stonks-inventory-total, .cs-stonks-new-trade-summary, .cs-stonks-item-badge",
  ).forEach((element) => element.remove());
}

function clearAllExtensionUi() {
  document.querySelectorAll(
    ".cs-stonks-analysis, .cs-stonks-inline-summary, .cs-stonks-inventory-total, .cs-stonks-new-trade-summary, .cs-stonks-item-badge",
  ).forEach((element) => element.remove());
}

function describeElement(element) {
  if (!element) {
    return null;
  }

  const id = element.id ? `#${element.id}` : "";
  const classes = element.className && typeof element.className === "string"
    ? `.${element.className.trim().replace(/\s+/gu, ".")}`
    : "";

  return `${element.tagName.toLowerCase()}${id}${classes}`;
}

function getDebugMessage(offer) {
  const debug = offer?.debug;

  if (!debug) {
    return "Aucun diagnostic disponible.";
  }

  if (debug.mode === "tradeoffer-list") {
    return `Diagnostic: mode liste, primary ${debug.primaryNamed}/${debug.primaryDetected} items nommes, secondary ${debug.secondaryNamed}/${debug.secondaryDetected} items nommes. Hover: ${HOVER_DIAGNOSTICS.get("last") ?? "aucun detail"}.`;
  }

  if (debug.mode === "tradeoffer-detail") {
    if (debug.reason) {
      return `Diagnostic: ${debug.reason}`;
    }

    return `Diagnostic: mode detail, your ${debug.yourNamed}/${debug.yourDetected} items nommes, their ${debug.theirNamed}/${debug.theirDetected} items nommes. Hover: ${HOVER_DIAGNOSTICS.get("last") ?? "aucun detail"}.`;
  }

  return "Diagnostic: structure Steam inconnue.";
}

async function analyzeTradeOffers() {
  if (!isTradeOfferPage()) {
    return;
  }

  const config = await getConfig();
  const roots = getOfferRoots();
  logDebug("Analyze scheduled.", {
    apiBase: config.apiBase,
    isNewTradeOfferPage: isNewTradeOfferPage(),
    pathname: window.location.pathname,
    roots: roots.map((root) => describeElement(root)),
  });

  for (const root of roots) {
    if (root.dataset.csStonksAnalyzing === "true") {
      root.dataset.csStonksQueued = "true";
      continue;
    }

    if (
      !isNewTradeOfferPage() &&
      root.dataset.csStonksAnalyzed === "true" &&
      root.querySelector(".cs-stonks-analysis, .cs-stonks-inline-summary")
    ) {
      continue;
    }

    root.dataset.csStonksAnalyzing = "true";

    try {
      const offer = await parseOffer(root);
      logDebug("Parsed offer.", {
        debug: offer?.debug,
        give: offer?.itemsToGive.length ?? 0,
        giveNames: offer?.itemsToGive.map((item) => `${item.amount}x ${item.name}`) ?? [],
        receive: offer?.itemsToReceive.length ?? 0,
        receiveNames: offer?.itemsToReceive.map((item) => `${item.amount}x ${item.name}`) ?? [],
        root: describeElement(root),
      });

      let newTradeOfferSignature = null;

      if (isNewTradeOfferPage()) {
        newTradeOfferSignature = getNewTradeOfferSignature(offer);
        void updateVisibleInventoryBadges(config.apiBase);
      }

      if (!offer || (offer.itemsToGive.length === 0 && offer.itemsToReceive.length === 0)) {
        if (isNewTradeOfferPage()) {
          document.querySelectorAll(
            ".cs-stonks-analysis, .cs-stonks-inline-summary, .cs-stonks-inventory-total, .cs-stonks-new-trade-summary",
          ).forEach((element) => element.remove());
          logDebug("Empty new trade offer detected; all Cs-Stonks UI cleared and no error rendered.", {
            debug: offer?.debug,
          });
          lastNewTradeOfferSignature = newTradeOfferSignature;
          root.dataset.csStonksAnalyzing = "false";
          continue;
        }

        renderError(root, `Impossible de lire les items Steam sur cette offre. ${getDebugMessage(offer)}`);
        continue;
      }

      if (
        isNewTradeOfferPage() &&
        newTradeOfferSignature === lastNewTradeOfferSignature &&
        root.querySelector(".cs-stonks-new-trade-summary")
      ) {
        logDebug("New trade offer content unchanged; skipping duplicate offer analysis.", {
          signature: newTradeOfferSignature,
        });
        root.dataset.csStonksAnalyzing = "false";
        continue;
      }

      const analysis = await requestAnalysis(config.apiBase, offer);

      if (isNewTradeOfferPage()) {
        renderNewTradeAnalysis(offer, analysis);
        lastNewTradeOfferSignature = newTradeOfferSignature;
      } else {
        renderAnalysis(offer, analysis);
      }
    } catch (error) {
      renderError(
        root,
        error instanceof Error
          ? error.message
          : "Impossible de contacter Cs-Stonks. Verifie que l'application tourne en local.",
      );
    } finally {
      const queued = root.dataset.csStonksQueued === "true";

      root.dataset.csStonksQueued = "false";
      root.dataset.csStonksAnalyzing = "false";
      root.dataset.csStonksAnalyzed = "true";

      if (queued) {
        scheduleAnalyze();
      }
    }
  }
}

function scheduleAnalyze() {
  window.clearTimeout(analyzeTimer);
  analyzeTimer = window.setTimeout(() => {
    void analyzeTradeOffers();
  }, 400);
}

if (isTradeOfferPage()) {
  logDebug("Content script loaded.", {
    href: window.location.href,
  });

  scheduleAnalyze();

  const observer = new MutationObserver(() => {
    scheduleAnalyze();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
