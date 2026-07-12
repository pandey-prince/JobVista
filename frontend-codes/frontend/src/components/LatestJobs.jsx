import React from "react";
import LatestJobCards from "./LatestJobCards";
import LoadingState, { JobGridSkeleton } from "@/components/shared/LoadingState";

const LatestJobs = ({ jobs = [], loading = false }) => {
  if (!loading && jobs.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto my-20 px-4 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold sm:text-4xl">
            <span className="text-brand">Fresh</span> IT job openings
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            New India IT roles from company career pages — with freshness badges on every card.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-10 space-y-4">
          <LoadingState variant="inline" message="Loading latest openings" />
          <JobGridSkeleton count={6} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-5">
          {jobs.length === 0 ? (
            <div className="col-span-full border border-dashed border-border rounded-md p-8 text-center bg-card">
              <h2 className="font-semibold">No jobs available yet</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Try searching a role or check again after new career-page listings sync.
              </p>
            </div>
          ) : (
            jobs.map((job) => <LatestJobCards key={job._id} job={job} />)
          )}
        </div>
      )}
    </div>
  );
};

export default LatestJobs;
