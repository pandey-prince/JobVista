import React, { useEffect, useMemo, useState } from "react";
import useDismissedJobs from "@/hooks/useDismissedJobs";
import { EyeOff } from "lucide-react";
import LoadingState from "@/components/shared/LoadingState";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import Pagination from "@/components/shared/Pagination";

const HIDDEN_JOBS_PAGE_SIZE = 12;

const HiddenJobs = () => {
  const { dismissedJobs, loading, fetchDismissedJobs, undismissJob } = useDismissedJobs();
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchDismissedJobs();
  }, [fetchDismissedJobs]);

  const totalPages = Math.max(1, Math.ceil(dismissedJobs.length / HIDDEN_JOBS_PAGE_SIZE));
  const pagedJobs = useMemo(() => {
    const start = (page - 1) * HIDDEN_JOBS_PAGE_SIZE;
    return dismissedJobs.slice(start, start + HIDDEN_JOBS_PAGE_SIZE);
  }, [dismissedJobs, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold">Hidden jobs</h1>
        <p className="mt-2 text-muted-foreground">
          Roles you marked as not interested. Undo anytime to see them on /jobs again.
        </p>

        {loading ? (
          <LoadingState
            variant="cards"
            message="Loading hidden jobs"
            description="Fetching jobs you dismissed."
            skeletonCount={3}
            className="mt-10"
          />
        ) : dismissedJobs.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <EyeOff className="mx-auto h-10 w-10 text-brand" />
            <h2 className="mt-4 text-xl font-semibold">No hidden jobs</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Tap Not interested on a job card to hide it from your feed.
            </p>
            <Button asChild className="mt-6 bg-brand hover:bg-brand/90">
              <Link to="/jobs">Browse jobs</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="mt-8 divide-y divide-border rounded-xl border border-border bg-card">
              {pagedJobs.map((entry) => (
                <li
                  key={entry.jobKey}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {entry.job?.title || entry.jobSnapshot?.title || "Untitled role"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.job?.company?.name ||
                        entry.jobSnapshot?.companyName ||
                        "Company"}
                      {entry.job?.location || entry.jobSnapshot?.location
                        ? ` · ${entry.job?.location || entry.jobSnapshot?.location}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => undismissJob(entry.jobKey)}
                  >
                    Undo
                  </Button>
                </li>
              ))}
            </ul>
            <Pagination
              className="mt-8"
              page={page}
              totalPages={totalPages}
              total={dismissedJobs.length}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default HiddenJobs;
