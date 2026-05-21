import { z } from "zod";

const STEAM_NEWS_URL = "https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/";
const CS2_APP_ID = "730";

const steamNewsSchema = z.object({
  appnews: z.object({
    newsitems: z
      .array(
        z.object({
          contents: z.string().optional(),
          date: z.number(),
          feedlabel: z.string().optional(),
          title: z.string(),
          url: z.string().url().optional(),
        }),
      )
      .default([]),
  }),
});

export interface Cs2NewsItem {
  date: string;
  details: string[];
  feedLabel: string | null;
  fullText: string;
  href: string;
  summary: string;
  title: string;
}

function cleanNewsText(value: string) {
  const text = value
    .replace(/\\r\\n|\\n|\\r/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\\(?=[A-Z])/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  return text.replace(/([a-z0-9)])(?=[A-Z])/g, "$1 ");
}

function getNewsDetails(text: string) {
  return text
    .split(/(?:\n+|(?<=\.)\s+)/)
    .map((line) => line.replace(/^[-*\\\s]+/, "").trim())
    .filter((line) => line.length > 8)
    .slice(0, 4);
}

function fallbackNews(): Cs2NewsItem[] {
  return [
    {
      date: new Date("2026-05-20T08:00:00.000Z").toISOString(),
      details: [
        "Live CS2 news will appear here when Steam responds.",
        "The dashboard keeps this widget readable even if the feed is temporarily unavailable.",
      ],
      feedLabel: "Cs-Stonks",
      fullText:
        "Steam news could not be fetched right now. The widget is wired and will display live CS2 news when Steam responds.",
      href: "https://www.counter-strike.net/news",
      summary:
        "Steam news could not be fetched right now. The widget is wired and will display live CS2 news when Steam responds.",
      title: "CS2 news feed ready",
    },
  ];
}

export async function getLatestCs2News(count = 3): Promise<Cs2NewsItem[]> {
  const url = new URL(STEAM_NEWS_URL);
  url.searchParams.set("appid", CS2_APP_ID);
  url.searchParams.set("count", String(count));
  url.searchParams.set("maxlength", "700");
  url.searchParams.set("format", "json");

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return fallbackNews();
    }

    const payload = steamNewsSchema.parse(await response.json());
    const items = payload.appnews.newsitems.map((item) => {
      const cleanText = cleanNewsText(item.contents ?? "");
      const details = getNewsDetails(cleanText);

      return {
        date: new Date(item.date * 1000).toISOString(),
        details,
        feedLabel: item.feedlabel ?? null,
        fullText: cleanText,
        href: item.url ?? "https://www.counter-strike.net/news",
        summary: details.length > 0 ? details[0] ?? cleanText.slice(0, 220) : cleanText.slice(0, 220),
        title: item.title,
      };
    });

    return items.length > 0 ? items : fallbackNews();
  } catch {
    return fallbackNews();
  }
}
