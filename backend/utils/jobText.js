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

export const extractExperienceFromTitle = (title = "") => {
  const parenMatch = title.match(/\(([^)]*(?:year|yr|experience|exp|fresher|intern)[^)]*)\)/i);
  if (parenMatch) return parenMatch[1].trim();

  const rangeMatch = title.match(/(\d+\s*[-–]\s*\d+\s*years?)/i);
  if (rangeMatch) return rangeMatch[1];

  const singleMatch = title.match(/(\d+\+?\s*years?)/i);
  if (singleMatch) return singleMatch[1];

  if (/fresher|graduate|intern/i.test(title)) return "Fresher / Intern";

  return null;
};
