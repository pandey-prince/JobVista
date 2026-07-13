import { normalizeCareerUrl } from "../services/careerSource.service.js";
import { parseCareerSourcesSpreadsheet } from "./parseCareerSourcesSpreadsheet.js";

const titleCaseRegion = (value = "") => {
  const cleaned = String(value).trim();
  if (!cleaned) return "";
  return cleaned
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

/**
 * Parse region-first JSON career lists.
 * Format: [{ "region": "NOIDA" }, { "companyName", "careerUrl", ... }, ...]
 * Also accepts { companies: [...] } or a plain company array.
 */
export const parseCareerSourcesJson = (bufferOrText, fallbackRegion = "") => {
  const text =
    typeof bufferOrText === "string"
      ? bufferOrText
      : Buffer.isBuffer(bufferOrText)
        ? bufferOrText.toString("utf8")
        : "";

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file");
  }

  let region = titleCaseRegion(fallbackRegion);
  let rows = [];

  if (Array.isArray(parsed)) {
    rows = parsed;
  } else if (parsed && Array.isArray(parsed.companies)) {
    region = titleCaseRegion(parsed.region || fallbackRegion) || region;
    rows = parsed.companies;
  } else {
    throw new Error("JSON must be an array of companies or { companies: [...] }");
  }

  if (!rows.length) {
    throw new Error("The uploaded JSON file is empty");
  }

  const companies = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] || {};

    if (row.region && !row.companyName && !row.careerUrl && !row.url) {
      region = titleCaseRegion(row.region);
      continue;
    }

    const companyName = String(row.companyName || "").trim();
    const rawUrl = String(row.careerUrl || row.url || "").trim();

    if (!companyName && !rawUrl) continue;

    if (!companyName || !rawUrl) {
      throw new Error(`Item ${i + 1} is missing companyName or careerUrl`);
    }

    let careerUrl;
    try {
      careerUrl = normalizeCareerUrl(rawUrl);
    } catch {
      throw new Error(`Item ${i + 1} has an invalid careerUrl: ${rawUrl}`);
    }

    if (!careerUrl) {
      throw new Error(`Item ${i + 1} has an invalid careerUrl`);
    }

    companies.push({
      companyName,
      careerUrl,
      name: String(row.name || "").trim() || `${companyName} Careers`,
      scraperType: String(row.scraperType || "").trim(),
      region: titleCaseRegion(row.region) || region,
    });
  }

  if (!companies.length) {
    throw new Error("No company rows found in the JSON file");
  }

  return { region, companies };
};

export const parseCareerSourcesUpload = (file) => {
  const name = String(file?.originalname || "").toLowerCase();
  const mime = String(file?.mimetype || "").toLowerCase();
  const isJson =
    name.endsWith(".json") ||
    mime.includes("application/json") ||
    mime.includes("+json");

  if (isJson) {
    return parseCareerSourcesJson(file.buffer);
  }

  const companies = parseCareerSourcesSpreadsheet(file.buffer);
  return { region: "", companies };
};

export { titleCaseRegion };
