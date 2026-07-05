import { stripHtml } from "./normalize.js";
import { fetchJson } from "./fetchHtml.js";

const parseWorkdayConfig = (source) => {
  if (source.selectors?.tenant && source.selectors?.site) {
    return {
      tenant: source.selectors.tenant,
      wdServer: source.selectors.wdServer || "wd5",
      site: source.selectors.site,
    };
  }

  try {
    const parsed = new URL(source.url);
    const hostMatch = parsed.hostname.match(/^([a-z0-9-]+)\.(wd[0-9]+)\.myworkdayjobs\.com$/i);
    if (!hostMatch) {
      throw new Error("Invalid Workday URL");
    }

    const [, tenant, wdServer] = hostMatch;
    const site = parsed.pathname.split("/").filter(Boolean).pop();
    if (!site) {
      throw new Error("Workday URL must include a career site path");
    }

    return { tenant, wdServer, site };
  } catch (error) {
    throw new Error(`Workday config error: ${error.message}`);
  }
};

export const scrapeWorkday = async (source) => {
  const { tenant, wdServer, site } = parseWorkdayConfig(source);
  const host = `https://${tenant}.${wdServer}.myworkdayjobs.com`;
  const apiUrl = `${host}/wday/cxs/${tenant}/${site}/jobs`;

  const data = await fetchJson(apiUrl, {
    method: "POST",
    headers: {
      Referer: `${host}/en-US/${site}`,
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
    const applicationUrl = `${host}/en-US${job.externalPath}`;
    return {
      externalId: job.externalPath || applicationUrl,
      title: job.title,
      description: job.locationsText || job.title,
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
