import React, { useEffect, useMemo, useState } from "react";
import Job from "./Job";
import useSavedJobs from "@/hooks/useSavedJobs";
import { Bookmark, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import Pagination from "@/components/shared/Pagination";
import JobMasonryGrid from "@/components/shared/JobMasonryGrid";

const SAVED_JOBS_PAGE_SIZE = 9;

const SavedJobs = () => {
  const { savedJobs, loading, fetchSavedJobs } = useSavedJobs();
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  const totalPages = Math.max(1, Math.ceil(savedJobs.length / SAVED_JOBS_PAGE_SIZE));
  const pagedJobs = useMemo(() => {
    const start = (page - 1) * SAVED_JOBS_PAGE_SIZE;
    return savedJobs.slice(start, start + SAVED_JOBS_PAGE_SIZE);
  }, [savedJobs, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold">Saved Jobs</h1>
        <p className="mt-2 text-muted-foreground">Roles you bookmarked to apply later.</p>

        {loading ? (
          <div className="mt-16 flex items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading saved jobs...
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Bookmark className="mx-auto h-10 w-10 text-brand" />
            <h2 className="mt-4 text-xl font-semibold">No saved jobs yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Tap Save on any job card to keep it here.
            </p>
            <Link to="/jobs">
              <Button className="mt-6 bg-brand hover:bg-brand/90">Browse jobs</Button>
            </Link>
          </div>
        ) : (
          <>
            <JobMasonryGrid className="mt-8">
              {pagedJobs.map((entry) => (
                <Job key={entry.jobKey} job={entry.job} />
              ))}
            </JobMasonryGrid>
            <Pagination
              className="mt-8"
              page={page}
              totalPages={totalPages}
              total={savedJobs.length}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
