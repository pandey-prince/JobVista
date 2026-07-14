import puppeteer from "puppeteer";
import { stripHtml } from "./normalize.js";
import { getPuppeteerOverride } from "../../data/puppeteerSelectors.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SELECTOR_PRESETS = [
  {
    jobList: "a.job-title-link",
    title: "",
    location: ".job-location, .location",
    link: "",
    hrefPattern: "/jobs/",
    minTitleLength: 8,
  },
  {
    jobList: "a.job-link",
    title: "",
    location: ".location-and-id, .location",
    link: "",
    hrefPattern: "/jobs/",
    minTitleLength: 10,
  },
  {
    jobList: "[data-automation-id='jobTitle']",
    title: "",
    location: "[data-automation-id='locations']",
    link: "a[href*='/job/']",
    hrefPattern: "/job/",
    minTitleLength: 8,
  },
  {
    jobList: ".job-tile",
    title: ".job-list-item__content span",
    location: ".job-list-item__content span:nth-of-type(2)",
    link: "a.job-list-item__link, a[href*='/job/']",
    waitMs: 15000,
    scroll: true,
    hrefPattern: "/job/",
    minTitleLength: 5,
  },
  {
    jobList: ".iCIMS_JobContainer, .iCIMS_JobsTable tr",
    title: ".iCIMS_InfoTitle a, .title",
    location: ".iCIMS_JobHeaderData, .location",
    link: "a[href*='/jobs/']",
    hrefPattern: "/jobs/",
    minTitleLength: 8,
  },
  {
    jobList: "li.opening, .opening",
    title: ".posting-title, h3, a",
    location: ".sort-by-location, .location",
    link: "a[href]",
    hrefPattern: "job",
    minTitleLength: 8,
  },
  {
    jobList: "[data-testid='job-card'], .job-card, .jobs-card",
    title: "h2, h3, .job-title",
    location: ".location, .job-location",
    link: "a[href]",
    minTitleLength: 8,
  },
  {
    jobList: "article, .job, .posting",
    title: "h2, h3, .job-title, .posting-title",
    location: ".location, .job-location",
    link: "a[href]",
    minTitleLength: 8,
  },
];

const launchBrowser = async () =>
  puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

const dismissCookieBanners = async (page) => {
  await page.evaluate(() => {
    const labels = ["accept", "agree", "allow all", "got it", "i agree", "ok"];
    for (const button of document.querySelectorAll("button, a[role='button']")) {
      const text = (button.textContent || "").trim().toLowerCase();
      if (labels.some((label) => text.includes(label))) {
        button.click();
        break;
      }
    }
  });
};

const autoScroll = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const step = 600;
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        total += step;
        if (total >= document.body.scrollHeight || total > 4800) {
          clearInterval(timer);
          resolve();
        }
      }, 250);
    });
  });
};

const buildSelectorPlan = (source) => {
  const override = getPuppeteerOverride(source.companyName);
  const merged = {
    ...(override?.selectors || {}),
    ...(source.selectors?.jobList ? source.selectors : {}),
  };

  const custom = merged.jobList ? [merged] : [];
  return {
    url: override?.url || source.url,
    presets: custom.length ? custom : SELECTOR_PRESETS,
  };
};

const scrapeWithSelectors = async (page, source, selectors, baseUrl) => {
  const waitMs = Number(selectors.waitMs || process.env.PUPPETEER_WAIT_MS || 6000);
  const waitUntil = selectors.waitUntil || "domcontentloaded";
  const timeoutMs = Number(selectors.timeoutMs || 60000);
  const hrefPattern = selectors.hrefPattern || "";
  const minTitleLength = Number(selectors.minTitleLength || 3);

  await page.goto(baseUrl, { waitUntil, timeout: timeoutMs });
  await delay(waitMs);
  await dismissCookieBanners(page);
  if (selectors.scroll) {
    await autoScroll(page);
    await delay(2000);
  }

  try {
    await page.waitForSelector(selectors.jobList, { timeout: Math.min(timeoutMs, 25000) });
  } catch {
    // Some boards render lazily; continue with best-effort scrape.
  }

  const iframeSrc = await page.evaluate(() => {
    const allow = (src) => {
      if (!src.startsWith("http")) return false;
      if (/doubleclick|flashtalking|googletagmanager|facebook\.com/i.test(src)) {
        return false;
      }
      return /icims|greenhouse|lever\.co|myworkdayjobs|ashbyhq|oraclecloud\.com\/hcmUI/i.test(
        src,
      );
    };

    for (const frame of document.querySelectorAll("iframe[src]")) {
      const src = frame.getAttribute("src") || "";
      if (allow(src)) return src;
    }
    return "";
  });

  if (iframeSrc && iframeSrc.startsWith("http")) {
    await page.goto(iframeSrc, { waitUntil, timeout: timeoutMs });
    await delay(waitMs);
    if (selectors.scroll) {
      await autoScroll(page);
      await delay(1500);
    }
  }

  return page.evaluate(
    ({ jobList, title, location, link, pageUrl, hrefPattern, minTitleLength }) => {
      const resolveUrl = (href = "") => {
        try {
          return new URL(href, pageUrl).toString();
        } catch {
          return href;
        }
      };

      const isNavJunk = (text) =>
        /^(home|careers|login|sign in|apply now|read more|skip|menu|search|benefits|teams|locations|job categories|sitemap|join talent|my application|cookie|privacy|terms)/i.test(
          text,
        );

      const matchesHref = (href) => {
        if (!hrefPattern) return true;
        return href.toLowerCase().includes(hrefPattern.toLowerCase());
      };

      const cleanLocationText = (value = "") => {
        let text = String(value || "")
          .replace(/\s+/g, " ")
          .trim();
        if (!text) return "Not specified";

        text = text
          .replace(/,?\s*(?:and|&)?\s*\+?\s*\d+\s*more\b/gi, "")
          .replace(/\s+/g, " ")
          .trim();
        text = text.replace(/^[,|/·•\-–—]+|[,|/·•\-–—]+$/g, "").trim();

        if (!text || /^(?:and|&)?\s*\+?\s*\d+\s*more$/i.test(text)) {
          return "Not specified";
        }

        return text;
      };

      const readLocation = (container, locationSelector) => {
        const candidates = [];

        if (locationSelector) {
          container.querySelectorAll(locationSelector).forEach((el) => {
            const t = el.textContent?.trim();
            if (t) candidates.push(t);
          });
        }

        container
          .querySelectorAll(
            "[class*='location'], [data-automation-id*='ocation'], .job-list-item__location, .job-location",
          )
          .forEach((el) => {
            const t = el.textContent?.trim();
            if (t) candidates.push(t);
          });

        for (const candidate of candidates) {
          const cleaned = cleanLocationText(candidate);
          if (cleaned !== "Not specified") return cleaned;
        }

        if (candidates.length) {
          return cleanLocationText(candidates[0]);
        }

        return "Not specified";
      };

      const seen = new Set();

      const resolveLinkEl = (container, linkSelector) => {
        if (!linkSelector) {
          if (container.matches("a[href]")) return container;
          return container.querySelector("a[href]");
        }
        return (
          container.querySelector(linkSelector) ||
          (container.matches("a[href]") ? container : null)
        );
      };

      return Array.from(document.querySelectorAll(jobList))
        .map((container) => {
          const titleEl = title ? container.querySelector(title) : container;
          let titleText = titleEl?.textContent?.trim() || "";
          const locationText = readLocation(container, location);
          const linkEl = resolveLinkEl(container, link);
          const href = linkEl?.getAttribute("href") || "";
          const applicationUrl = resolveUrl(href);

          if (!titleText && linkEl) {
            titleText = linkEl.textContent?.trim() || "";
          }
          if (!titleText) {
            const span = container.querySelector(
              ".job-list-item__content span, [data-automation-id='jobTitle'], h2, h3",
            );
            titleText = span?.textContent?.trim() || "";
          }

          if (
            !titleText ||
            !applicationUrl ||
            titleText.length < minTitleLength ||
            isNavJunk(titleText) ||
            !matchesHref(applicationUrl)
          ) {
            return null;
          }

          if (seen.has(applicationUrl)) return null;
          seen.add(applicationUrl);

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
      link: selectors.link ?? "",
      pageUrl: page.url(),
      hrefPattern,
      minTitleLength,
    },
  );
};

export const scrapeAutoPuppeteer = async (source) => {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    const { url, presets } = buildSelectorPlan(source);

    for (const selectors of presets) {
      const jobs = await scrapeWithSelectors(page, source, selectors, url);
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
