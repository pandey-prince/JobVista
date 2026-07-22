/**
 * Decide whether a JobSource's listings should be hidden from the public job feed.
 * - Confirmed board-gone errors (404/410): hide immediately
 * - Other scrape errors: hide after SOURCE_ERROR_HIDE_HOURS (default 24)
 */
export const SOURCE_ERROR_HIDE_HOURS = Math.max(
  1,
  Number(process.env.SOURCE_ERROR_HIDE_HOURS || 24) || 24,
);

export const isBoardGoneScrapeError = (message = "") =>
  /\b(404|410)\b/.test(String(message)) ||
  /document not found|board_gone|couldn't find anything|no jobs found|could not find job listings/i.test(
    String(message),
  );

export const shouldHideSourceFromPublicFeed = (source) => {
  if (!source || source.lastScrapeStatus !== "error") return false;

  if (isBoardGoneScrapeError(source.lastScrapeError)) {
    return true;
  }

  const scrapedAt = source.lastScrapedAt
    ? new Date(source.lastScrapedAt).getTime()
    : 0;
  if (!scrapedAt || Number.isNaN(scrapedAt)) return true;

  return Date.now() - scrapedAt >= SOURCE_ERROR_HIDE_HOURS * 60 * 60 * 1000;
};

export const getPublicFeedHiddenSourceIds = async (JobSource) => {
  const errored = await JobSource.find({ lastScrapeStatus: "error" })
    .select("_id lastScrapeStatus lastScrapeError lastScrapedAt")
    .lean();

  return errored
    .filter((source) => shouldHideSourceFromPublicFeed(source))
    .map((source) => String(source._id));
};
