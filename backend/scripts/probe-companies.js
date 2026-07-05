import { INDIA_COMPANY_SOURCES } from "../data/indiaCompanySources.js";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const ACTIVE_TYPES = new Set([
  "greenhouse",
  "lever",
  "ashby",
  "tcs-ibegin",
  "successfactors-rss",
  "smartdreamers",
]);

const fetchPage = async (url, redirects = 5) => {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    const finalUrl = res.url;
    const html = res.ok ? await res.text() : "";
    return { ok: res.ok, status: res.status, finalUrl, html: html.slice(0, 50000) };
  } catch (e) {
    return { ok: false, error: e.message, finalUrl: url, html: "" };
  }
};

const detectFromText = (html, finalUrl) => {
  const lower = html.toLowerCase();
  const urlLower = finalUrl.toLowerCase();

  if (urlLower.includes("greenhouse.io") || lower.includes("boards.greenhouse.io"))
    return "greenhouse";
  if (urlLower.includes("lever.co") || lower.includes("jobs.lever.co")) return "lever";
  if (urlLower.includes("ashbyhq.com") || lower.includes("jobs.ashbyhq.com")) return "ashby";
  if (urlLower.includes("myworkdayjobs.com") || lower.includes("myworkdayjobs.com"))
    return "workday";
  if (urlLower.includes("smartrecruiters.com") || lower.includes("smartrecruiters.com"))
    return "smartrecruiters";
  if (
    lower.includes("successfactors") ||
    lower.includes("sapsf.eu") ||
    lower.includes("jobs2web.com") ||
    urlLower.includes("/services/rss/job")
  )
    return "successfactors-rss";
  if (urlLower.includes("icims.com") || lower.includes("icims.com")) return "icims";
  if (urlLower.includes("digitalcareers.infosys.com")) return "smartdreamers";
  if (urlLower.includes("ibegin.tcsapps.com")) return "tcs-ibegin";

  const ghMatch = html.match(/boards\.greenhouse\.io\/([a-z0-9_-]+)/i);
  if (ghMatch) return `greenhouse:${ghMatch[1]}`;

  const leverMatch = html.match(/jobs\.lever\.co\/([a-z0-9_-]+)/i);
  if (leverMatch) return `lever:${leverMatch[1]}`;

  const ashbyMatch = html.match(/jobs\.ashbyhq\.com\/([a-z0-9_-]+)/i);
  if (ashbyMatch) return `ashby:${ashbyMatch[1]}`;

  const wdMatch =
    html.match(/https?:\/\/([a-z0-9-]+\.wd[0-9]+\.myworkdayjobs\.com[^"'\\s]*)/i) ||
    html.match(/([a-z0-9-]+\.wd[0-9]+\.myworkdayjobs\.com)/i);
  if (wdMatch) return `workday:${wdMatch[1].replace(/^https?:\/\//, "").split(/[?"']/)[0]}`;

  const srMatch = html.match(/jobs\.smartrecruiters\.com\/([A-Za-z0-9_-]+)/i);
  if (srMatch) return `smartrecruiters:${srMatch[1]}`;

  return "unknown";
};

const pending = INDIA_COMPANY_SOURCES.filter(
  (c) => !c.isActive && !ACTIVE_TYPES.has(c.scraperType)
);

console.log(`Probing ${pending.length} companies...\n`);

for (const company of pending) {
  const url = company.careersUrl || company.url;
  const page = await fetchPage(url);
  const detected = detectFromText(page.html, page.finalUrl);
  console.log(
    JSON.stringify({
      company: company.companyName,
      url,
      finalUrl: page.finalUrl,
      status: page.status || page.error,
      detected,
    })
  );
  await new Promise((r) => setTimeout(r, 300));
}
