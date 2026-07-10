import React, { useEffect, useState } from "react";
import Job from "./Job";
import useSavedJobs from "@/hooks/useSavedJobs";
import { Bookmark, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const SavedJobs = () => {
  const { savedJobs, loading, fetchSavedJobs } = useSavedJobs();

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold">Saved Jobs</h1>
        <p className="mt-2 text-gray-600">
          Roles you bookmarked to apply later.
        </p>

        {loading ? (
          <div className="mt-16 flex items-center justify-center text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading saved jobs...
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <Bookmark className="mx-auto h-10 w-10 text-[#6A38C2]" />
            <h2 className="mt-4 text-xl font-semibold">No saved jobs yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Tap Save on any job card to keep it here.
            </p>
            <Link to="/jobs">
              <Button className="mt-6 bg-[#6A38C2] hover:bg-[#5b30a6]">Browse jobs</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedJobs.map((entry) => (
              <Job key={entry.jobKey} job={entry.job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
