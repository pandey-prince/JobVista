const buildUrl = (type, slug) => {
  if (type === "greenhouse") return `https://boards.greenhouse.io/${slug}`;
  if (type === "lever") return `https://jobs.lever.co/${slug}`;
  if (type === "ashby") return `https://jobs.ashbyhq.com/${slug}`;
  return "";
};

const testGreenhouse = async (slug) => {
  const response = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`
  );
  if (!response.ok) return null;
  const data = await response.json();
  return Array.isArray(data.jobs) && data.jobs.length > 0
    ? { scraperType: "greenhouse", slug, count: data.jobs.length }
    : null;
};

const testLever = async (slug) => {
  const response = await fetch(
    `https://api.lever.co/v0/postings/${slug}?mode=json`
  );
  if (!response.ok) return null;
  const data = await response.json();
  return Array.isArray(data) && data.length > 0
    ? { scraperType: "lever", slug, count: data.length }
    : null;
};

const testAshby = async (slug) => {
  const response = await fetch(
    `https://api.ashbyhq.com/posting-api/job-board/${slug}`
  );
  if (!response.ok) return null;
  const data = await response.json();
  return Array.isArray(data.jobs) && data.jobs.length > 0
    ? { scraperType: "ashby", slug, count: data.jobs.length }
    : null;
};

const testers = [testGreenhouse, testLever, testAshby];

export const probeCareerSource = async (slugs = []) => {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))];

  for (const slug of uniqueSlugs) {
    for (const test of testers) {
      const result = await test(slug);
      if (result) {
        return {
          url: buildUrl(result.scraperType, result.slug),
          scraperType: result.scraperType,
          isActive: true,
          jobsFoundCount: result.count,
        };
      }
    }
  }

  return null;
};

export const slugsFromCompanyName = (name = "") => {
  const parts = name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const joined = parts.join("");
  const first = parts[0] || joined;

  return [...new Set([first, joined, parts.slice(0, 2).join(""), parts.slice(0, 3).join("")])];
};
