import { fetchJson } from "./fetchHtml.js";

const parseWorkdayPath = (pathname = "") => {
  const parts = pathname.split("/").filter(Boolean);
  let locale = "en-US";
  let site = "";

  if (parts.length >= 2 && /^[a-z]{2}-[A-Z]{2}$/.test(parts[0])) {
    locale = parts[0];
    site = parts[parts.length - 1];
  } else if (parts.length) {
    site = parts[parts.length - 1];
  }

  return { locale, site };
};

const buildWorkdayApplicationUrl = (host, locale, site, externalPath = "") => {
  const path = String(externalPath || "").startsWith("/") ? externalPath : `/${externalPath}`;
  return `${host}/${locale}/${site}${path}`;
};

const parseWorkdayConfig = (source) => {
  if (source.selectors?.tenant && source.selectors?.site) {
    return {
      tenant: source.selectors.tenant,
      wdServer: source.selectors.wdServer || "wd5",
      site: source.selectors.site,
      locale: source.selectors.locale || "en-US",
    };
  }

  try {
    const parsed = new URL(source.url);
    const hostMatch = parsed.hostname.match(/^([a-z0-9-]+)\.(wd[0-9]+)\.myworkdayjobs\.com$/i);
    if (!hostMatch) {
      throw new Error("Invalid Workday URL");
    }

    const [, tenant, wdServer] = hostMatch;
    const { locale, site } = parseWorkdayPath(parsed.pathname);
    if (!site) {
      throw new Error("Workday URL must include a career site path");
    }

    return { tenant, wdServer, site, locale };
  } catch (error) {
    throw new Error(`Workday config error: ${error.message}`);
  }
};

export const scrapeWorkday = async (source) => {
  const { tenant, wdServer, site, locale } = parseWorkdayConfig(source);
  const host = `https://${tenant}.${wdServer}.myworkdayjobs.com`;
  const apiUrl = `${host}/wday/cxs/${tenant}/${site}/jobs`;

  const data = await fetchJson(apiUrl, {
    method: "POST",
    headers: {
      Referer: `${host}/${locale}/${site}`,
    },
    body: JSON.stringify({
      appliedFacets: {},
      limit: 20,
      offset: 0,
      searchText: "",
    }),
  });

  const postings = data?.jobPostings;
  if (!Array.isArray(postings) || !postings.length) {
    throw new Error("No jobs found on Workday career site");
  }

  return postings.map((job) => {
    const applicationUrl = buildWorkdayApplicationUrl(host, locale, site, job.externalPath);
    return {
      externalId: job.externalPath || applicationUrl,
      title: job.title,
      description: "",
      location: job.locationsText || "Not specified",
      jobType: "Full-time",
      salary: "Not disclosed",
      requirements: [],
      applicationUrl,
      companyName: source.companyName,
      companyLogo: "",
    };
  });
};
