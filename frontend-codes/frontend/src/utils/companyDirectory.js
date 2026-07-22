import { jobsApi } from "@/api";
import { companyJobsPath, slugifyCompanyName } from "@/utils/companySlug";

const companyGroupKey = (name = "") => String(name).trim().toLowerCase();

/**
 * Fallback when career-sources?withJobs=true is not deployed yet:
 * build company cards from the same jobs feed the Jobs page uses.
 */
export async function buildCompaniesFromJobFeed({
  search = "",
  page = 1,
  limit = 12,
} = {}) {
  const pageSize = 48;
  const first = await jobsApi.list({ page: 1, limit: pageSize, keyword: search });
  if (!first.data?.success) {
    throw new Error(first.data?.message || "Unable to load jobs");
  }

  const totalJobs = first.data.pagination?.total || (first.data.jobs || []).length;
  const totalPages = Math.max(
    1,
    first.data.pagination?.totalPages || Math.ceil(totalJobs / pageSize) || 1,
  );

  let allJobs = [...(first.data.jobs || [])];
  const maxPages = Math.min(totalPages, 15);

  for (let p = 2; p <= maxPages; p += 1) {
    const res = await jobsApi.list({ page: p, limit: pageSize, keyword: search });
    if (!res.data?.success) break;
    allJobs = allJobs.concat(res.data.jobs || []);
  }

  const groups = new Map();
  for (const job of allJobs) {
    const companyName = String(job?.company?.name || "").trim();
    if (!companyName) continue;
    const key = companyGroupKey(companyName);
    if (!groups.has(key)) {
      groups.set(key, {
        _id: key,
        companyName,
        name: companyName,
        slug: slugifyCompanyName(companyName),
        url: "",
        jobs: [],
      });
    }
    groups.get(key).jobs.push(job);
  }

  let companies = Array.from(groups.values())
    .map((group) => ({
      ...group,
      activeJobCount: group.jobs.length,
    }))
    .filter((group) => group.activeJobCount > 0)
    .sort((a, b) => a.companyName.localeCompare(b.companyName));

  if (search) {
    const needle = search.toLowerCase();
    companies = companies.filter((c) => c.companyName.toLowerCase().includes(needle));
  }

  const total = companies.length;
  const totalCompanyPages = Math.max(1, Math.ceil(total / limit) || 1);
  const safePage = Math.min(Math.max(1, page), totalCompanyPages);
  const start = (safePage - 1) * limit;
  const sources = companies.slice(start, start + limit);

  return {
    sources,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages: totalCompanyPages,
      hasNextPage: safePage < totalCompanyPages,
      hasPrevPage: safePage > 1,
    },
  };
}

export { companyJobsPath };
