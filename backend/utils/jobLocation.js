const INDIA_PLACE_PATTERNS = [
  /india/i,
  /(bangalore|bengaluru|mumbai|delhi|new delhi|hyderabad|pune|chennai|kolkata)/i,
  /(gurgaon|gurugram|noida|ahmedabad|chandigarh|kochi|jaipur|indore|bhubaneswar|vizag|visakhapatnam)/i,
  /(tamil nadu|karnataka|maharashtra|telangana|west bengal|gujarat|rajasthan|uttar pradesh)/i,
];

/** UI crumbs like "and 1 more" / "+2 more" from multi-location job boards. */
const AND_MORE_PATTERN = /,?\s*(?:and|&)?\s*\+?\s*\d+\s*more\b/gi;
const ONLY_AND_MORE_PATTERN = /^(?:and|&)?\s*\+?\s*\d+\s*more$/i;

const UNSPECIFIED_EXACT_PATTERN =
  /^(not\s*specified|n\/?a|none|null|unknown|-|_|\.|tbd|to\s*be\s*decided|multiple\s*locations?|various|anywhere)$/i;

/**
 * Strip career-board overflow crumbs and collapse whitespace.
 */
export const cleanLocationNoise = (value = "") => {
  let text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";

  text = text.replace(AND_MORE_PATTERN, "").replace(/\s+/g, " ").trim();
  text = text.replace(/^[,|/·•\-–—]+|[,|/·•\-–—]+$/g, "").trim();

  if (!text || ONLY_AND_MORE_PATTERN.test(text)) return "";

  return text;
};

/**
 * Vague / unspecified locations should still be eligible for the India browse/persist gate.
 */
export const isVagueLocation = (location = "") => {
  const cleaned = cleanLocationNoise(location);
  if (!cleaned) return true;
  if (UNSPECIFIED_EXACT_PATTERN.test(cleaned)) return true;
  if (ONLY_AND_MORE_PATTERN.test(String(location || "").trim())) return true;
  // Bare overflow residue that cleaning couldn't fully normalize
  if (/^\+?\s*\d+\s*more$/i.test(cleaned)) return true;
  return false;
};

const extractPlaceFromText = (text = "") => {
  const source = String(text || "");
  if (!source.trim()) return "";

  // Prefer known India places even when glued to surrounding tokens (Puppeteer title noise).
  for (const pattern of INDIA_PLACE_PATTERNS) {
    const match = source.match(pattern);
    if (match) {
      const place = match[0];
      if (/^india$/i.test(place)) return "India";
      return place.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  // "Some City, IN" / "Some City, India"
  const cityIn = source.match(
    /\b([A-Za-z][A-Za-z .'-]{1,40}?),\s*(IN|India)\b/i,
  );
  if (cityIn) {
    const city = cityIn[1].trim();
    return /india/i.test(cityIn[2]) ? `${city}, India` : `${city}, IN`;
  }

  const remote = source.match(/\bremote(?:\s*[-–—,]?\s*india)?\b/i);
  if (remote) return remote[0];

  return "";
};

/**
 * Normalize a scraped location for storage + filters.
 * Falls back to places embedded in the title when the board location is junk.
 */
export const normalizeJobLocation = (location = "", { title = "" } = {}) => {
  const cleaned = cleanLocationNoise(location);

  if (cleaned && !isVagueLocation(cleaned)) {
    return cleaned;
  }

  const fromTitle = extractPlaceFromText(title);
  if (fromTitle) return fromTitle;

  if (cleaned && /remote/i.test(cleaned)) return cleaned;

  return "Not specified";
};
