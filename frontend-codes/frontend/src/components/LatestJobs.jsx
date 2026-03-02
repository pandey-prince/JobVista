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

      <div className="grid grid-cols-3 gap-4 my-5">
        {jobsToDisplay.length === 0 ? (
          <span>No Job Available</span>
        ) : (
          jobsToDisplay.map((job) => <LatestJobCards key={job._id} job={job} />)
        )}
      </div>
    </div>
  );
};

export default LatestJobs;
