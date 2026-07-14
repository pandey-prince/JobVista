import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { jobsApi } from "@/api";
import Job from "./Job";
import LoadingState, { JobGridSkeleton } from "@/components/shared/LoadingState";
import { Button } from "./ui/button";
import { Target } from "lucide-react";

const hasProfileSignals = (user) =>
  Boolean(user?.profile?.skills?.length || user?.profile?.preferredJobRoles?.length);

const RecommendedJobs = () => {
  const { user, loading: authLoading } = useSelector((store) => store.auth);
  const [jobs, setJobs] = useState([]);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return undefined;

    let cancelled = false;

    const fetchRecommended = async () => {
      try {
        setLoading(true);
        const res = await jobsApi.recommended({ limit: 6 });
        if (cancelled) return;
        if (res.data.success) {
          setJobs(res.data.jobs || []);
          setPersonalized(Boolean(res.data.personalized));
        }
      } catch (error) {
        console.error("Failed to load recommended jobs", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRecommended();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  if (authLoading || !user) return null;

  if (!hasProfileSignals(user)) {
    return (
      <section className="mx-auto my-16 max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Target className="mx-auto h-8 w-8 text-brand" />
          <h2 className="mt-3 text-2xl font-bold">Jobs for you</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Add skills and preferred roles to your profile and we&apos;ll surface openings that match your background.
          </p>
          <Button asChild className="mt-5 rounded-full bg-brand hover:bg-brand/90">
            <Link to="/profile/setup">Complete your profile</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto my-16 max-w-7xl px-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Jobs <span className="text-brand">for you</span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {personalized
              ? "Matched to your skills and preferred roles from live career-page listings."
              : "Hand-picked openings based on your profile — add more skills for sharper matches."}
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0 rounded-full">
          <Link to="/jobs">Browse all jobs</Link>
        </Button>
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          <LoadingState variant="inline" message="Finding jobs for you" />
          <JobGridSkeleton count={6} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No strong matches yet. Try updating your skills or check back after the next sync.
          </p>
          <Button asChild variant="outline" className="mt-4 rounded-full">
            <Link to="/profile">Update profile</Link>
          </Button>
        </div>
      ) : (
        <div className="my-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Job key={job._id} job={job} />
          ))}
        </div>
      )}
    </section>
  );
};

export default RecommendedJobs;
