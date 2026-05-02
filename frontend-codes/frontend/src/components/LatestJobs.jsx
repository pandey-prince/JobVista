import React from "react";
import LatestJobCards from "./LatestJobCards";
import { useSelector } from "react-redux";

const LatestJobs = () => {
  const { allJobs } = useSelector((store) => store.job);

  const jobsToDisplay = Array.isArray(allJobs) ? allJobs.slice(0, 6) : [];

  return (
    <div className="max-w-7xl mx-auto my-20">
      <h1 className="text-4xl font-bold">
        <span className="text-[#6A38C2]">Latest & Top </span> Job Openings
      </h1>
      <p className="text-sm text-gray-500 mt-2">
        Includes JobVista jobs and remote openings from trusted external sources.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-5">
        {jobsToDisplay.length === 0 ? (
          <div className="col-span-full border border-dashed border-gray-300 rounded-md p-8 text-center">
            <h2 className="font-semibold">No jobs available yet</h2>
            <p className="text-sm text-gray-500 mt-1">Try searching a role or check again after recruiters post new openings.</p>
          </div>
        ) : (
          jobsToDisplay.map((job) => <LatestJobCards key={job._id} job={job} />)
        )}
      </div>
    </div>
  );
};

export default LatestJobs;
