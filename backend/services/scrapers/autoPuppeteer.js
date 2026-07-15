import puppeteer from "puppeteer";
import { stripHtml } from "./normalize.js";
import { getPuppeteerOverride } from "../../data/puppeteerSelectors.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PUPPETEER_MAX_PAGES = Number(process.env.PUPPETEER_MAX_PAGES || 10);
/** Hard cap for one company scrape (browser closed on timeout). */
const PUPPETEER_SOURCE_TIMEOUT_MS = Number(
  process.env.PUPPETEER_SOURCE_TIMEOUT_MS || 90000,
);
const PUPPETEER_NAV_TIMEOUT_MS = Number(
  process.env.PUPPETEER_NAV_TIMEOUT_MS || 45000,
);
/** When no saved/override selectors, try at most this many generic presets. */
const PUPPETEER_MAX_GENERIC_PRESETS = Math.max(
  1,
  Number(process.env.PUPPETEER_MAX_GENERIC_PRESETS || 2) || 2,
);

const DEFAULT_NEXT_SELECTORS = [
  "button[aria-label*='Next' i]",
  "a[aria-label*='Next' i]",
  "button[title*='Next' i]",
  "a[title*='Next' i]",
  "[data-ui-id*='next' i]",
  "[data-test-id*='next' i]",
  "button.oj-pagingcontrol-nav-next",
  ".oj-pagingcontrol-nav-next",
  "li.oj-enabled a.oj-pagingcontrol-nav-next",
  "button.job-search-button",
];

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
  const fromOverride = override?.selectors?.jobList ? override.selectors : null;
  const saved = source.selectors?.jobList ? source.selectors : null;

  let presets;
  if (fromOverride || saved) {
    presets = [{ ...(fromOverride || {}), ...(saved || {}) }];
  } else {
    presets = SELECTOR_PRESETS.slice(0, PUPPETEER_MAX_GENERIC_PRESETS);
  }

  return {
    // Prefer curated override URL when present (Mongo may still hold a stale marketing page).
    url: override?.url || source.url,
    presets,
  };
};

/** Fields safe to persist onto JobSource.selectors after a winning scrape. */
export const pickPersistableSelectors = (selectors = {}) => {
  const out = {};
  for (const key of [
    "jobList",
    "title",
    "description",
    "location",
    "link",
    "hrefPattern",
    "waitMs",
    "waitUntil",
    "minTitleLength",
    "scroll",
    "nextButton",
    "maxPages",
    "timeoutMs",
  ]) {
    if (selectors[key] !== undefined && selectors[key] !== null && selectors[key] !== "") {
      out[key] = selectors[key];
    }
  }
  return out;
};

const extractJobsFromDom = async (page, selectors) => {
  const hrefPattern = selectors.hrefPattern || "";
  const minTitleLength = Number(selectors.minTitleLength || 3);

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

const clickNextPage = async (page, nextButtonSelector = "") => {
  const candidates = [
    ...(nextButtonSelector ? [nextButtonSelector] : []),
    ...DEFAULT_NEXT_SELECTORS,
  ];

  const clicked = await page.evaluate((selectorList) => {
    const isVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      if (el.disabled || el.getAttribute("aria-disabled") === "true") return false;
      if (el.classList.contains("oj-disabled")) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    for (const selector of selectorList) {
      try {
        const el = document.querySelector(selector);
        if (isVisible(el)) {
          el.click();
          return true;
        }
      } catch {
        /* invalid selector */
      }
    }

    const labels = ["next", "show more", "load more", "see more", "more jobs"];
    for (const el of document.querySelectorAll("button, a, [role='button']")) {
      const text = `${el.textContent || ""} ${el.getAttribute("aria-label") || ""}`
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
      if (!labels.some((label) => text.includes(label))) continue;
      if (/previous|prev|back/.test(text)) continue;
      if (!isVisible(el)) continue;
      el.click();
      return true;
    }

    return false;
  }, candidates);

  return Boolean(clicked);
};

const scrapeWithSelectors = async (page, source, selectors, baseUrl) => {
  const waitMs = Number(selectors.waitMs || process.env.PUPPETEER_WAIT_MS || 6000);
  const waitUntil = selectors.waitUntil || "domcontentloaded";
  const timeoutMs = Number(
    selectors.timeoutMs || PUPPETEER_NAV_TIMEOUT_MS || 45000,
  );

  page.setDefaultNavigationTimeout(timeoutMs);
  page.setDefaultTimeout(timeoutMs);

  await page.goto(baseUrl, { waitUntil, timeout: timeoutMs });
  await delay(waitMs);
  await dismissCookieBanners(page);
  if (selectors.scroll) {
    try {
      await autoScroll(page);
      await delay(2000);
    } catch (error) {
      console.warn(`[AutoPuppeteer] scroll skipped: ${error.message.slice(0, 100)}`);
    }
  }

  try {
    await page.waitForSelector(selectors.jobList, {
      timeout: Math.min(timeoutMs, 20000),
    });
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
    const alreadyOnAts = /oraclecloud\.com\/hcmUI|myworkdayjobs|greenhouse|lever\.co|icims|ashbyhq/i.test(
      baseUrl,
    );
    if (!alreadyOnAts) {
      await page.goto(iframeSrc, { waitUntil, timeout: timeoutMs });
      await delay(waitMs);
      if (selectors.scroll) {
        await autoScroll(page);
        await delay(1500);
      }
    }
  }

  const collected = [];
  const seen = new Set();

  const mergeJobs = (pageJobs = []) => {
    let added = 0;
    for (const job of pageJobs) {
      const key = job.externalId || job.applicationUrl;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      collected.push(job);
      added += 1;
    }
    return added;
  };

  mergeJobs(await extractJobsFromDom(page, selectors).catch(async (error) => {
    if (!/Execution context was destroyed|Target closed/i.test(error.message)) {
      throw error;
    }
    console.warn(
      `[AutoPuppeteer] extract retry after navigation (${error.message.slice(0, 80)})`,
    );
    await delay(2500);
    await page.waitForSelector(selectors.jobList, { timeout: 20000 }).catch(() => {});
    return extractJobsFromDom(page, selectors);
  }));

  const maxPages = Number(selectors.maxPages || PUPPETEER_MAX_PAGES);
  for (let pageIndex = 1; pageIndex < maxPages; pageIndex += 1) {
    const beforeCount = collected.length;
    const clicked = await clickNextPage(page, selectors.nextButton || "");
    if (!clicked) break;

    await delay(Math.max(1500, Math.floor(waitMs / 2)));
    if (selectors.scroll) {
      await autoScroll(page);
      await delay(800);
    }

    try {
      await page.waitForSelector(selectors.jobList, { timeout: 10000 });
    } catch {
      /* continue best-effort */
    }

    const added = mergeJobs(await extractJobsFromDom(page, selectors));
    if (!added || collected.length === beforeCount) break;
  }

  return collected;
};

export const scrapeAutoPuppeteer = async (source) => {
  const browser = await launchBrowser();
  let timeoutHandle;

  try {
    const work = (async () => {
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      );

      const { url, presets } = buildSelectorPlan(source);
      console.log(
        `[AutoPuppeteer] "${source.companyName}" url=${url} presets=${presets.length} timeoutMs=${PUPPETEER_SOURCE_TIMEOUT_MS}`,
      );

      for (let i = 0; i < presets.length; i += 1) {
        const selectors = presets[i];
        console.log(
          `[AutoPuppeteer] "${source.companyName}" trying preset ${i + 1}/${presets.length}`,
        );
        const jobs = await scrapeWithSelectors(page, source, selectors, url);
        if (jobs.length >= 1) {
          console.log(
            `[AutoPuppeteer] "${source.companyName}" scraped ${jobs.length} raw job(s)`,
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
            usedSelectors: pickPersistableSelectors(selectors),
          };
        }
      }

      throw new Error("Auto Puppeteer could not find job listings on career page");
    })();

    const timedOut = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(
          new Error(
            `Auto Puppeteer timed out after ${PUPPETEER_SOURCE_TIMEOUT_MS}ms for ${source.companyName}`,
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
