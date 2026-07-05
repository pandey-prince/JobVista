import puppeteer from "puppeteer";
import { stripHtml } from "./normalize.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SELECTOR_PRESETS = [
  {
    jobList: "a.job[href*='reqid/']",
    title: ".job-title",
    location: ".job-location",
    link: "",
  },
  {
    jobList: ".job-listing__link, .job-listing, [data-automation-id='jobTitle']",
    title: ".job-listing__title, [data-automation-id='jobTitle']",
    location: ".job-listing__location, [data-automation-id='locations']",
    link: "a[href]",
  },
  {
    jobList: "article, .job, .job-tile, .posting",
    title: "h2, h3, .job-title, .posting-title",
    location: ".location, .job-location",
    link: "a[href]",
  },
  {
    jobList: ".iCIMS_JobsTable .row, tr[data-job-id]",
    title: ".title, .jobTitle",
    location: ".location, .jobLocation",
    link: "a[href*='/jobs/']",
  },
  {
    jobList: "[data-testid='job-card'], .job-card, .jobs-card",
    title: "h2, h3, .job-title",
    location: ".location, .job-location",
    link: "a[href]",
  },
  {
    jobList: "li.opening, .opening",
    title: ".posting-title, h3, a",
    location: ".sort-by-location, .location",
    link: "a[href]",
  },
  {
    jobList: "a[href*='job'], a[href*='career'], a[href*='opening']",
    title: "",
    location: "",
    link: "",
  },
];

const launchBrowser = async () =>
  puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

const scrapeWithSelectors = async (page, source, selectors) => {
  const waitMs = Number(selectors.waitMs || process.env.PUPPETEER_WAIT_MS || 6000);
    await page.goto(source.url, { waitUntil: "networkidle2", timeout: 60000 });
    await delay(waitMs);

    const iframeSrc = await page.evaluate(() => {
      const frame = document.querySelector("iframe[src*='job'], iframe[src*='career'], iframe[src*='icims']");
      return frame?.src || "";
    });
    if (iframeSrc && iframeSrc.startsWith("http")) {
      await page.goto(iframeSrc, { waitUntil: "networkidle2", timeout: 60000 });
      await delay(waitMs);
    }

  return page.evaluate(
    ({ jobList, title, location, link, baseUrl }) => {
      const resolveUrl = (href = "") => {
        try {
          return new URL(href, baseUrl).toString();
        } catch {
          return href;
        }
      };

      return Array.from(document.querySelectorAll(jobList))
        .map((container) => {
          const titleEl = title ? container.querySelector(title) : container;
          const titleText = titleEl?.textContent?.trim() || "";
          const locationText = location
            ? container.querySelector(location)?.textContent?.trim() || "Not specified"
            : "Not specified";
          const linkEl = link
            ? container.querySelector(link)
            : container.matches("a[href]")
              ? container
              : container.querySelector("a[href]");
          const href = linkEl?.getAttribute("href") || "";
          const applicationUrl = resolveUrl(href);

          if (!titleText || !applicationUrl || titleText.length < 3) return null;

          return {
            externalId: applicationUrl,
            title: titleText,
            description: titleText,
            location: locationText,
            applicationUrl,
          };
        })
        .filter(Boolean);
    },
    {
      jobList: selectors.jobList,
      title: selectors.title || "",
      location: selectors.location || "",
      link: selectors.link || "a[href]",
      baseUrl: source.url,
    }
  );
};

export const scrapeAutoPuppeteer = async (source) => {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    const customSelectors = source.selectors?.jobList ? [source.selectors] : [];
    const presets = [...customSelectors, ...SELECTOR_PRESETS];

    for (const selectors of presets) {
      const jobs = await scrapeWithSelectors(page, source, selectors);
      if (jobs.length >= 1) {
        return jobs.map((job) => ({
          ...job,
          description: stripHtml(job.description),
          jobType: "Full-time",
          salary: "Not disclosed",
          requirements: [],
          companyName: source.companyName,
          companyLogo: "",
        }));
      }
    }

    throw new Error("Auto Puppeteer could not find job listings on career page");
  } finally {
    await browser.close();
  }
};
