import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import CompanyLogo from "./CompanyLogo";
import Pagination from "@/components/shared/Pagination";
import LoadingState from "@/components/shared/LoadingState";
import JobMasonryGrid from "@/components/shared/JobMasonryGrid";
import { careerSourceApi } from "@/api";
import { companyJobsPath } from "@/utils/companySlug";
import { buildCompaniesFromJobFeed } from "@/utils/companyDirectory";
import usePageTitle from "@/hooks/usePageTitle";
import { ExternalLink, MapPin, RefreshCw, Search } from "lucide-react";

const PAGE_SIZE = 12;
/** Show this many rows before the list scrolls; keeps card height stable in masonry */
const VISIBLE_BEFORE_SCROLL = 4;
/** Cap DOM nodes for huge companies (e.g. Cisco 100+) — rest via “View all” */
const MAX_JOBS_IN_CARD = 40;

const responseHasJobLists = (sources = []) =>
  sources.some((source) => Array.isArray(source.jobs) && source.jobs.length > 0);

const companyCardWeight = (source) => {
  if (!source) return 1;
  const jobs = Array.isArray(source.jobs) ? source.jobs : [];
  const listed = Math.min(jobs.length, MAX_JOBS_IN_CARD);
  const visibleRows = Math.min(VISIBLE_BEFORE_SCROLL, listed);
  // Header + capped visible rows (+ scroll chrome) + footer — scroll doesn't grow the card
  return 5 + visibleRows * 2 + (listed > VISIBLE_BEFORE_SCROLL ? 1 : 0);
};

const MonitoredCompaniesPage = () => {
  usePageTitle("Companies with open roles");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sources, setSources] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        let nextSources = [];
        let nextPagination = null;

        try {
          const res = await careerSourceApi.listPublic({
            page,
            limit: PAGE_SIZE,
            search,
            withJobs: true,
          });

          if (res.data?.success && responseHasJobLists(res.data.sources || [])) {
            nextSources = (res.data.sources || []).filter(
              (source) => (source.activeJobCount || source.jobs?.length || 0) > 0,
            );
            nextPagination = res.data.pagination || null;
          }
        } catch {
          // Fall through to jobs-feed grouping
        }

        if (!nextSources.length) {
          const fallback = await buildCompaniesFromJobFeed({
            search,
            page,
            limit: PAGE_SIZE,
          });
          nextSources = fallback.sources;
          nextPagination = fallback.pagination;
        }

        if (cancelled) return;
        setSources(nextSources);
        setPagination(nextPagination);
      } catch (err) {
        if (cancelled) return;
        setSources([]);
        setPagination(null);
        setError(err.response?.data?.message || err.message || "Unable to load companies");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [page, search, retryKey]);

  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="mx-auto max-w-7xl overflow-x-hidden px-4 py-10 sm:px-6">
      <div className="max-w-3xl">
        <span className="rounded-full bg-brand-muted px-4 py-2 text-sm font-medium text-brand">
          Live openings
        </span>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          Companies on <span className="text-brand">JobLeLo</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Each card shows a company with open roles and the jobs we currently track for them.
          Companies with no openings are hidden.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search companies..."
            className="pl-9"
            aria-label="Search companies with open roles"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Loading..."
            : `Showing ${sources.length} of ${total}${search ? " match" : " companies"}`}
        </p>
      </div>

      {loading ? (
        <div className="mt-8">
          <LoadingState
            variant="cards"
            message="Loading companies"
            description="Grouping live openings by company."
            skeletonCount={4}
          />
        </div>
      ) : error ? (
        <div className="mt-8 rounded-md border border-dashed border-destructive/40 bg-card p-10 text-center">
          <h2 className="text-lg font-semibold">Could not load companies</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 gap-2"
            onClick={() => setRetryKey((key) => key + 1)}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : sources.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-border bg-card p-10 text-center">
          <h2 className="text-lg font-semibold">
            {search ? "No companies match your search" : "No companies with open roles yet"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {search
              ? `Try another name, or clear “${search}”.`
              : "Check back after the next career-page sync."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {search ? (
              <Button type="button" variant="outline" onClick={() => setSearchInput("")}>
                Clear search
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to="/jobs">Browse all jobs</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <JobMasonryGrid
            className="mt-8"
            maxColumns={3}
            layout="full"
            getItemWeight={(index) => companyCardWeight(sources[index])}
          >
            {sources.map((source) => {
              const name = source.companyName || source.name || "Company";
              const jobsPath = source.slug
                ? `/companies/${source.slug}`
                : companyJobsPath(name);
              const jobs = Array.isArray(source.jobs) ? source.jobs : [];
              const count = source.activeJobCount || jobs.length;
              const listedJobs = jobs.slice(0, MAX_JOBS_IN_CARD);
              const scrollable = listedJobs.length > VISIBLE_BEFORE_SCROLL;
              const notInCard = Math.max(0, count - listedJobs.length);

              return (
                <article
                  key={source._id || source.slug || name}
                  className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-brand/35"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <CompanyLogo company={{ name }} className="h-11 w-11 shrink-0" />
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold">{name}</h2>
                        <p className="text-sm font-medium text-brand">
                          {count} open {count === 1 ? "role" : "roles"}
                        </p>
                      </div>
                    </div>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-brand"
                      >
                        Careers
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>

                  <ul
                    className={
                      scrollable
                        ? "mt-4 max-h-56 space-y-1 overflow-y-auto overscroll-contain border-t border-border pt-3 pr-1 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.4)_transparent]"
                        : "mt-4 space-y-1 border-t border-border pt-3"
                    }
                  >
                    {listedJobs.map((job) => (
                      <li key={job._id}>
                        <Link
                          to={jobsPath}
                          className="block rounded-lg px-1 py-1.5 transition-colors hover:bg-brand-muted/50"
                        >
                          <p className="text-sm font-medium leading-snug text-foreground">
                            {job.title}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {job.location || "Not specified"}
                              {job.experienceLevel ? ` · ${job.experienceLevel}` : ""}
                            </span>
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {notInCard > 0 ? (
                    <p className="mt-1 px-1 text-xs text-muted-foreground">
                      +{notInCard} more on company page
                    </p>
                  ) : null}

                  <div className="mt-4 border-t border-border pt-3">
                    <Button asChild variant="brand" size="sm" className="rounded-full">
                      <Link to={jobsPath}>View all jobs</Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </JobMasonryGrid>

          <div className="mt-8">
            <Pagination
              page={pagination?.page || page}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to="/jobs">Browse open roles</Link>
        </Button>
        <Button asChild className="bg-brand hover:bg-brand/90">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
};

export default MonitoredCompaniesPage;
