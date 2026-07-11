import { KNOWN_CAREER_BOARDS } from "../data/knownCareerBoards.js";
import { mergePuppeteerSelectors } from "../data/puppeteerSelectors.js";
import { slugsFromCompanyName } from "./probeCareerSource.js";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const testGreenhouse = async (slug) => {
  const response = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`
  );
  if (!response.ok) return null;
  const data = await response.json();
  return data.jobs?.length
    ? {
        url: `https://boards.greenhouse.io/${slug}`,
        scraperType: "greenhouse",
        isActive: true,
      }
    : null;
};

const testLever = async (slug) => {
  const response = await fetch(
    `https://api.lever.co/v0/postings/${slug}?mode=json`
  );
  if (!response.ok) return null;
  const data = await response.json();
  return Array.isArray(data) && data.length
    ? { url: `https://jobs.lever.co/${slug}`, scraperType: "lever", isActive: true }
    : null;
};

const testAshby = async (slug) => {
  const response = await fetch(
    `https://api.ashbyhq.com/posting-api/job-board/${slug}`
  );
  if (!response.ok) return null;
  const data = await response.json();
  return data.jobs?.length
    ? {
        url: `https://jobs.ashbyhq.com/${slug}`,
        scraperType: "ashby",
        isActive: true,
      }
    : null;
};

const testSmartRecruiters = async (slug) => {
  const response = await fetch(
    `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=3`
  );
  if (!response.ok) return null;
  const data = await response.json();
  return data.content?.length
    ? {
        url: `https://jobs.smartrecruiters.com/${slug}`,
        scraperType: "smartrecruiters",
        isActive: true,
        selectors: { slug },
      }
    : null;
};

const testWorkdayUrl = async (url) => {
  try {
    const parsed = new URL(url);
    const hostMatch = parsed.hostname.match(
      /^([a-z0-9-]+)\.(wd[0-9]+)\.myworkdayjobs\.com$/i
    );
    if (!hostMatch) return null;

    const [, tenant, wdServer] = hostMatch;
    const site = parsed.pathname.split("/").filter(Boolean).pop();
    const host = `https://${tenant}.${wdServer}.myworkdayjobs.com`;

    const response = await fetch(`${host}/wday/cxs/${tenant}/${site}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: `${host}/en-US/${site}`,
        "User-Agent": UA,
      },
      body: JSON.stringify({
        appliedFacets: {},
        limit: 3,
        offset: 0,
        searchText: "",
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.jobPostings?.length
      ? { url: `${host}/en-US/${site}`, scraperType: "workday", isActive: true }
      : null;
  } catch {
    return null;
  }
};

const testSuccessFactorsRss = async (baseUrl) => {
  const rssUrl = `${baseUrl.replace(/\/$/, "")}/services/rss/job/?locale=en_US`;
  try {
    const response = await fetch(rssUrl, {
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml" },
    });
    if (!response.ok) return null;
    const xml = await response.text();
    return xml.includes("<item>")
      ? { url: rssUrl, scraperType: "successfactors-rss", isActive: true }
      : null;
  } catch {
    return null;
  }
};

const extractWorkdayFromHtml = (html) => {
  const match = html.match(
    /https?:\/\/([a-z0-9-]+\.wd[0-9]+\.myworkdayjobs\.com\/en-US\/[A-Za-z0-9_]+)/i
  );
  return match?.[1] ? `https://${match[1]}` : null;
};

const fetchCareerPage = async (url) => {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    const finalUrl = response.url;
    const html = response.ok ? await response.text() : "";
    return { finalUrl, html: html.slice(0, 80000) };
  } catch {
    return { finalUrl: url, html: "" };
  }
};

const probeBySlug = async (companyName) => {
  const slugs = slugsFromCompanyName(companyName);
  for (const slug of slugs) {
    for (const test of [
      testGreenhouse,
      testLever,
      testAshby,
      testSmartRecruiters,
    ]) {
      const result = await test(slug);
      if (result) return result;
    }
  }
  return null;
};

export const resolveCareerBoard = async (company) => {
  if (company.scraperType && company.url && company.isActive) {
    return {
      name: company.name,
      companyName: company.companyName,
      url: company.url,
      scraperType: company.scraperType,
      selectors: company.selectors || {},
      isActive: true,
    };
  }

  const known = KNOWN_CAREER_BOARDS[company.companyName];
  if (known) {
    const merged = mergePuppeteerSelectors(company.companyName, {
      url: known.url,
      scraperType: known.scraperType,
      selectors: known.selectors || {},
      isActive: known.isActive !== false,
    });
    return {
      name: company.name,
      companyName: company.companyName,
      url: merged.url,
      scraperType: merged.scraperType || known.scraperType,
      selectors: merged.selectors || {},
      isActive: known.isActive === false ? false : merged.isActive !== false,
    };
  }

  const careersUrl = company.careersUrl || company.url;
  if (!careersUrl) {
    return null;
  }

  const slugResult = await probeBySlug(company.companyName);
  if (slugResult) {
    return {
      name: company.name,
      companyName: company.companyName,
      ...slugResult,
      selectors: slugResult.selectors || {},
    };
  }

  const page = await fetchCareerPage(careersUrl);

  const workdayUrl =
    (page.finalUrl.includes("myworkdayjobs.com")
      ? page.finalUrl.split("?")[0]
      : null) || extractWorkdayFromHtml(page.html);

  if (workdayUrl) {
    const workdayResult = await testWorkdayUrl(workdayUrl);
    if (workdayResult) {
      return {
        name: company.name,
        companyName: company.companyName,
        ...workdayResult,
        selectors: {},
      };
    }
  }

  const sfBase = page.finalUrl.includes("careers.")
    ? new URL(page.finalUrl).origin
    : careersUrl;
  const sfResult = await testSuccessFactorsRss(sfBase);
  if (sfResult) {
    return {
      name: company.name,
      companyName: company.companyName,
      ...sfResult,
      selectors: {},
    };
  }

  if (page.html) {
    const puppeteerMerged = mergePuppeteerSelectors(company.companyName, {
      url: page.finalUrl || careersUrl,
      scraperType: "auto-puppeteer",
      selectors: {},
      isActive: true,
    });
    return {
      name: company.name,
      companyName: company.companyName,
      url: puppeteerMerged.url,
      scraperType: "auto-puppeteer",
      selectors: puppeteerMerged.selectors || {},
      isActive: true,
    };
  }

  return null;
};
