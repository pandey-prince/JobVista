import { slugsFromCompanyName } from "./probeCareerSource.js";

export const slugifyCompanyName = (name = "") =>
  String(name)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join("");

export const companyNameMatchesSlug = (companyName = "", slug = "") => {
  const normalized = String(slug || "")
    .toLowerCase()
    .trim();
  if (!normalized) return false;

  const candidates = slugsFromCompanyName(companyName);
  return candidates.includes(normalized) || slugifyCompanyName(companyName) === normalized;
};
