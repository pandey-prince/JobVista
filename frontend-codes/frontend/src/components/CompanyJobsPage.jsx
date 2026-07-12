import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { careerSourceApi } from "@/api";
import Job from "./Job";
import CompanyLogo from "./CompanyLogo";
import Pagination from "@/components/shared/Pagination";
import LoadingState, { JobGridSkeleton } from "@/components/shared/LoadingState";
import usePageTitle from "@/hooks/usePageTitle";
import { Button } from "./ui/button";
import { ExternalLink, RefreshCw } from "lucide-react";
import { formatRelativeTime } from "@/utils/formatRelativeTime";

const formatSlug = (slug) =>
  (slug || "company")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const JOBS_PER_PAGE = 12;

const CompanyJobsPage = () => {
  const { slug } = useParams();
  const [source, setSource] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);

  const companyName = source?.companyName || formatSlug(slug);

  usePageTitle(`${companyName} Jobs`);

  useEffect(() => {
    setPage(1);
  }, [slug]);

  useEffect(() => {
    if (!slug) return undefined;

    let cancelled = false;

    const fetchCompanyJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await careerSourceApi.getCompanyJobs(slug, {
          page,
          limit: JOBS_PER_PAGE,
        });

        if (cancelled) return;

        if (res.data.success) {
          setSource(res.data.source || null);
          setJobs(res.data.jobs || []);
          setPagination(res.data.pagination || null);
        } else {
          setError(new Error(res.data.message || "Unable to load company jobs"));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setSource(null);
          setJobs([]);
          setPagination(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCompanyJobs();

    return () => {
      cancelled = true;
    };
  }, [slug, page, retryKey]);

  const lastSynced = formatRelativeTime(source?.lastScrapedAt);
  const isNotFound = error?.response?.status === 404;

  if (loading && !source) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <LoadingState variant="inline" message={`Loading ${formatSlug(slug)} jobs`} />
        <div className="mt-8">
          <JobGridSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Company not found</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn&apos;t find a monitored career page matching this company.
        </p>
        <Button asChild className="mt-6 rounded-full bg-brand hover:bg-brand/90">
          <Link to="/jobs">Browse all jobs</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Unable to load company jobs</h1>
        <p className="mt-2 text-muted-foreground">
          {error.response?.data?.message || "Please try again in a moment."}
        </p>
        <Button
          className="mt-6 rounded-full"
          variant="outline"
          onClick={() => setRetryKey((key) => key + 1)}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <CompanyLogo
              company={{ name: companyName }}
              className="h-16 w-16 shrink-0"
            />
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{companyName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Open roles from the official careers page
                {pagination?.total != null ? ` · ${pagination.total} live openings` : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {lastSynced ? (
                  <span className="inline-flex items-center gap-1">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Synced {lastSynced}
                  </span>
                ) : null}
                {source?.lastScrapeStatus ? (
                  <span className="rounded-full bg-brand-muted px-2 py-0.5 font-medium text-brand">
                    {source.lastScrapeStatus}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          {source?.url ? (
            <Button asChild variant="outline" className="shrink-0 rounded-full">
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Careers page
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          <LoadingState variant="inline" message="Refreshing openings" />
          <JobGridSkeleton count={6} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <h2 className="font-semibold">No active openings right now</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Check back after the next sync or browse other companies on JobLeLo.
          </p>
          <Button asChild variant="outline" className="mt-4 rounded-full">
            <Link to="/jobs">Browse all jobs</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Job key={job._id} job={job} />
            ))}
          </div>
          <Pagination
            className="mt-8"
            page={pagination?.page || page}
            totalPages={pagination?.totalPages || 1}
            total={pagination?.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default CompanyJobsPage;
