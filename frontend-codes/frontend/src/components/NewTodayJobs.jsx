import React from "react";
import { Link } from "react-router-dom";
import LatestJobCards from "./LatestJobCards";
import LoadingState, { JobGridSkeleton } from "@/components/shared/LoadingState";
import { Button } from "./ui/button";

const NewTodayJobs = ({ jobs = [], loading = false }) => {
  if (!loading && jobs.length === 0) return null;

  return (
    <section className="mx-auto my-16 max-w-7xl px-4 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div>
          <div className="mb-2 inline-flex items-center rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand">
            Posted in the last 24 hours
          </div>
          <h2 className="text-3xl font-bold sm:text-4xl">
            New <span className="text-brand">today</span>
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            Fresh roles that landed on company career pages in the past day — before they spread elsewhere.
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0 rounded-full">
          <Link to="/jobs">View all jobs</Link>
        </Button>
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          <LoadingState variant="inline" message="Loading today's openings" />
          <JobGridSkeleton count={6} />
        </div>
      ) : (
        <div className="my-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <LatestJobCards key={job._id} job={job} />
          ))}
        </div>
      )}
    </section>
  );
};

export default NewTodayJobs;
