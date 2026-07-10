import React, { useEffect, useState } from "react";
import Job from "./Job";
import { useDispatch, useSelector } from "react-redux";
import { setSearchedQuery } from "@/redux/jobSlice";
import useGetAllJobs from "@/hooks/useGetAllJobs";
import FilterCard from "./FilterCard";
import { emptyJobFilters, filterJobs } from "@/utils/jobFilters";

const Browse = () => {
  useGetAllJobs();

  const { allJobs = [] } = useSelector((store) => store.job);
  const { searchedQuery } = useSelector((store) => store.job);
  const [selectedFilters, setSelectedFilters] = useState(emptyJobFilters);
  const dispatch = useDispatch();
  const filteredJobs = filterJobs(allJobs, searchedQuery, selectedFilters);

  useEffect(() => {
    return () => {
      dispatch(setSearchedQuery(""));
    };
  }, [dispatch]);

  return (
    <div>
      <div className="mx-auto my-10 max-w-7xl px-4 sm:px-6">
        <h1 className="my-10 text-xl font-bold">
          Search Results ({filteredJobs.length})
        </h1>
        <p className="-mt-8 mb-6 text-sm text-gray-500">
          India IT jobs from career pages and JobVista recruiters.
        </p>

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
              <h2 className="text-lg font-semibold">No jobs match your search</h2>
              <p className="mt-2 text-sm text-gray-500">Try removing one filter or searching another role.</p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => (
                <Job key={job._id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Browse;
