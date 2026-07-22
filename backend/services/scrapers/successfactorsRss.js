import { stripHtml } from "./normalize.js";
import { fetchText } from "./fetchHtml.js";

const decodeEntities = (value = "") =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const readTag = (block, tag) => {
  const match = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return decodeEntities((match?.[1] || match?.[2] || "").trim());
};

const parseLocationFromTitle = (title = "") => {
  const match = title.match(/\(([^)]+)\)\s*$/);
  return match?.[1]?.trim() || "India";
};

const parseTitleFromRss = (title = "") => title.replace(/\s*\([^)]+\)\s*$/, "").trim();

/**
 * Build SuccessFactors RSS URL from a careers host (never fall back to another company).
 */
export const resolveSuccessfactorsRssUrl = (sourceUrl = "") => {
  const trimmed = String(sourceUrl || "").trim();
  if (!trimmed) {
    throw new Error("SuccessFactors careers URL is required");
  }

  if (trimmed.includes("/services/rss/") || /\.xml(\?|$)/i.test(trimmed)) {
    return trimmed;
  }

  let parsed;
  try {
    parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error(`Invalid SuccessFactors careers URL: ${trimmed}`);
  }

  return `${parsed.origin}/services/rss/job/?locale=en_US`;
};

export const scrapeSuccessfactorsRss = async (source) => {
  const rssUrl = resolveSuccessfactorsRssUrl(source.url);

  const xml = await fetchText(rssUrl, {
    headers: { Accept: "application/rss+xml, application/xml, text/xml, */*" },
  });

  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  if (!items.length) {
    return [];
  }

  return items.map((item) => {
    const rawTitle = readTag(item, "title");
    const link = readTag(item, "link");
    const description = stripHtml(readTag(item, "description"));
    const guid = readTag(item, "guid") || link;

    return {
      externalId: guid || link,
      title: parseTitleFromRss(rawTitle),
      description: description.slice(0, 5000) || rawTitle,
      location: parseLocationFromTitle(rawTitle),
      jobType: "Full-time",
      salary: "Not disclosed",
      requirements: [],
      applicationUrl: link,
      companyName: source.companyName,
      companyLogo: "",
    };
  });
};
