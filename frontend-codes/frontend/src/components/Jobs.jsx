import React, { useState } from "react";
import FilterCard from "./FilterCard";
import Job from "./Job";
import { Button } from "./ui/button";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useGetAllJobs from "@/hooks/useGetAllJobs";
import { emptyJobFilters, filterJobs } from "@/utils/jobFilters";

const Jobs = () => {
  useGetAllJobs();
  const { allJobs = [], searchedQuery } = useSelector((store) => store.job);
  const navigate = useNavigate();
  const [selectedFilters, setSelectedFilters] = useState(emptyJobFilters);

  const filteredJobs = filterJobs(allJobs, searchedQuery, selectedFilters);

  return (
    <div>
      <div className="mx-auto mt-5 max-w-7xl px-4 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
          <h1 className="text-2xl font-bold">Fresh IT Jobs</h1>
          <p className="text-sm text-gray-500">
            India IT roles from company career pages and JobVista recruiters. Use filters for city, experience, and work mode.
          </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/alerts")}>
            Create job alert
          </Button>
        </div>
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="w-full lg:w-72 lg:shrink-0">
            <FilterCard
              selectedFilters={selectedFilters}
              onFilterChange={setSelectedFilters}
              onClear={() => setSelectedFilters(emptyJobFilters)}
            />
          </div>

          {filteredJobs.length === 0 ? (
            <div className="flex-1 rounded-md border border-dashed border-border bg-card p-10 text-center">
              <h2 className="text-lg font-semibold">No jobs match your filters</h2>
              <p className="mt-2 text-sm text-gray-500">Try removing one filter or searching another role.</p>
            </div>
          ) : (
            <div className="flex-1 pb-5 lg:h-[88vh] lg:overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map((job) => (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Job job={job} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
