const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export const decodeHtmlEntities = (value = "") =>
  String(value).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const lower = entity.toLowerCase();
    if (NAMED_ENTITIES[lower]) return NAMED_ENTITIES[lower];
    if (lower.startsWith("#x")) {
      const code = parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : match;
    }
    if (lower.startsWith("#")) {
      const code = parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCharCode(code) : match;
    }
    return match;
  });

export const stripHtmlTags = (value = "") => String(value).replace(/<[^>]*>/g, " ");

export const cleanJobText = (value = "", { maxLength } = {}) => {
  if (!value) return "";

  let text = String(value);
  for (let i = 0; i < 4; i += 1) {
    const decoded = decodeHtmlEntities(text);
    const stripped = stripHtmlTags(decoded);
    const normalized = stripped.replace(/\s+/g, " ").trim();
    if (normalized === text) break;
    text = normalized;
  }

  text = text.replace(/\s+/g, " ").trim();
  if (!maxLength || text.length <= maxLength) return text;

  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > maxLength * 0.65 ? cut.slice(0, lastSpace) : cut}…`;
};

export const stripHtml = (value = "") => cleanJobText(value);

const collapseWs = (value = "") => String(value).replace(/\s+/g, " ").trim();

/** Normalize scraper/board experience into a filter-friendly string. */
export const normalizeExperienceValue = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const text = collapseWs(value);
  if (!text) return "";

  if (/^\d+(\.\d+)?$/.test(text)) {
    const n = Number(text);
    if (n === 0) return "0";
    return `${n} years`;
  }

  if (/^\d+(\.\d+)?\+$/.test(text)) {
    return `${text} years`;
  }

  if (/\b(fresher|freshers|entry[- ]?level|new[- ]?grad|graduate|intern(?:ship)?)\b/i.test(text) && !/\d/.test(text)) {
    return "Fresher / Intern";
  }

  const rangeMatch = text.match(/(\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i);
  if (rangeMatch) return `${collapseWs(rangeMatch[1])} years`;

  const singleMatch = text.match(/(\d+(?:\.\d+)?\+?)\s*(?:years?|yrs?)/i);
  if (singleMatch) return `${singleMatch[1]} years`;

  const bareRange = text.match(/^(\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?)$/);
  if (bareRange) return `${collapseWs(bareRange[1])} years`;

  return text;
};

export const extractExperienceFromTitle = (title = "") => {
  const parenMatch = title.match(/\(([^)]*(?:year|yr|experience|exp|fresher|intern)[^)]*)\)/i);
  if (parenMatch) return normalizeExperienceValue(parenMatch[1]) || parenMatch[1].trim();

  const rangeMatch = title.match(/(\d+\s*[-–]\s*\d+\s*years?)/i);
  if (rangeMatch) return normalizeExperienceValue(rangeMatch[1]) || rangeMatch[1];

  const singleMatch = title.match(/(\d+\+?\s*years?)/i);
  if (singleMatch) return normalizeExperienceValue(singleMatch[1]) || singleMatch[1];

  if (/fresher|graduate|intern/i.test(title)) return "Fresher / Intern";

  return null;
};

export const extractExperienceFromText = (text = "") => {
  if (!text) return null;
  const body = String(text);

  const labeled = body.match(
    /(?:experience|exp(?:erience)?|yrs?(?:\s+of\s+experience)?)\s*[:=]?\s*(\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?\+?)\s*(?:years?|yrs?)?/i,
  );
  if (labeled) {
    return normalizeExperienceValue(labeled[1]) || null;
  }

  const rangeMatch = body.match(/(\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i);
  if (rangeMatch) return normalizeExperienceValue(`${rangeMatch[1]} years`) || null;

  const singleMatch = body.match(/(\d+(?:\.\d+)?\+?)\s*(?:years?|yrs?)(?:\s+of\s+experience)?/i);
  if (singleMatch) return normalizeExperienceValue(`${singleMatch[1]} years`) || null;

  if (/\b(fresher|freshers|entry[- ]?level|new[- ]?grad|graduate)\b/i.test(body)) {
    return "Fresher / Intern";
  }
  if (/\b(internship|intern)\b/i.test(body)) {
    return "Fresher / Intern";
  }

  return null;
};

/**
 * Best available experience signal for a scraped/normalized job.
 * Returns "" when unknown (mapper can fall back / show "Not specified").
 */
export const resolveExperienceLevel = (job = {}) => {
  const explicit = job.experienceLevel ?? job.experience;
  const fromExplicit = normalizeExperienceValue(explicit);
  if (fromExplicit) return fromExplicit;

  const fromTitle = extractExperienceFromTitle(job.title || "");
  if (fromTitle) return fromTitle;

  const requirementsText = Array.isArray(job.requirements)
    ? job.requirements.join(" ")
    : String(job.requirements || "");
  const fromBody = extractExperienceFromText(
    `${job.description || ""} ${requirementsText}`,
  );
  if (fromBody) return fromBody;

  return "";
};
