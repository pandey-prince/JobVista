import puppeteer from "puppeteer";
import { stripHtml } from "./normalize.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const launchBrowser = async () => {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

  return puppeteer.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
};

export const scrapePuppeteer = async (source) => {
  const { selectors } = source;
  if (!selectors?.jobList) {
    throw new Error("Puppeteer scraper requires a jobList CSS selector");
  }

  const waitMs = Number(selectors.waitMs || process.env.PUPPETEER_WAIT_MS || 5000);
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.goto(source.url, { waitUntil: "networkidle2", timeout: 60000 });
    await delay(waitMs);

    const jobs = await page.evaluate(
      ({ jobList, title, description, location, link, baseUrl }) => {
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
            const descriptionText = description
              ? container.querySelector(description)?.textContent?.trim() || titleText
              : titleText;
            const locationText = location
              ? container.querySelector(location)?.textContent?.trim() || "Not specified"
              : "Not specified";
            const linkEl = link
              ? container.querySelector(link)
              : container.querySelector("a[href]");
            const href = linkEl?.getAttribute("href") || "";
            const applicationUrl = resolveUrl(href);

            if (!titleText || !applicationUrl) return null;

            return {
              externalId: applicationUrl,
              title: titleText,
              description: descriptionText,
              location: locationText,
              applicationUrl,
            };
          })
          .filter(Boolean);
      },
      {
        jobList: selectors.jobList,
        title: selectors.title || "",
        description: selectors.description || "",
        location: selectors.location || "",
        link: selectors.link || "a[href]",
        baseUrl: source.url,
      }
    );

    return jobs.map((job) => ({
      ...job,
      description: stripHtml(job.description),
      jobType: "Full-time",
      salary: "Not disclosed",
      requirements: [],
      companyName: source.companyName,
      companyLogo: "",
    }));
  } finally {
    await browser.close();
  }
};
