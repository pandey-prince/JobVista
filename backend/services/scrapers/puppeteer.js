import puppeteer from "puppeteer";
import { stripHtml } from "./normalize.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PUPPETEER_SOURCE_TIMEOUT_MS = Number(
  process.env.PUPPETEER_SOURCE_TIMEOUT_MS || 90000,
);
const PUPPETEER_NAV_TIMEOUT_MS = Number(
  process.env.PUPPETEER_NAV_TIMEOUT_MS || 45000,
);

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
  const timeoutMs = Number(selectors.timeoutMs || PUPPETEER_NAV_TIMEOUT_MS || 45000);
  const browser = await launchBrowser();
  let timeoutHandle;

  try {
    const work = (async () => {
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(timeoutMs);
      page.setDefaultTimeout(timeoutMs);
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      );

      console.log(
        `[Puppeteer] "${source.companyName}" url=${source.url} timeoutMs=${PUPPETEER_SOURCE_TIMEOUT_MS}`,
      );

      // networkidle2 often hangs on boards with continuous analytics traffic
      await page.goto(source.url, {
        waitUntil: "domcontentloaded",
        timeout: timeoutMs,
      });
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
                ? container.querySelector(description)?.textContent?.trim() ||
                  titleText
                : titleText;
              const locationText = location
                ? container.querySelector(location)?.textContent?.trim() ||
                  "Not specified"
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
        },
      );

      console.log(
        `[Puppeteer] "${source.companyName}" scraped ${jobs.length} raw job(s)`,
      );

      return {
        jobs: jobs.map((job) => ({
          ...job,
          description: stripHtml(job.description),
          jobType: "Full-time",
          salary: "Not disclosed",
          requirements: [],
          companyName: source.companyName,
          companyLogo: "",
        })),
        usedSelectors: {
          jobList: selectors.jobList,
          title: selectors.title || "",
          description: selectors.description || "",
          location: selectors.location || "",
          link: selectors.link || "",
        },
      };
    })();

    const timedOut = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(
          new Error(
            `Puppeteer timed out after ${PUPPETEER_SOURCE_TIMEOUT_MS}ms for ${source.companyName}`,
          ),
        );
      }, PUPPETEER_SOURCE_TIMEOUT_MS);
    });

    return await Promise.race([work, timedOut]);
  } finally {
    clearTimeout(timeoutHandle);
    await browser.close().catch(() => {});
  }
};
