import React, { useEffect, useState } from "react";
import Job from "./Job";
import { useDispatch, useSelector } from "react-redux";
import { setSearchedQuery } from "@/redux/jobSlice";
import FilterCard from "./FilterCard";
import { emptyJobFilters } from "@/utils/jobFilters";
import usePaginatedJobs from "@/hooks/usePaginatedJobs";
import Pagination from "@/components/shared/Pagination";
import JobMasonryGrid from "@/components/shared/JobMasonryGrid";
import LoadingState from "@/components/shared/LoadingState";

const JOBS_PER_PAGE = 12;

const Browse = () => {
  const { searchedQuery } = useSelector((store) => store.job);
  const [selectedFilters, setSelectedFilters] = useState(emptyJobFilters);
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();

  const { jobs, pagination, loading } = usePaginatedJobs({
    page,
    limit: JOBS_PER_PAGE,
    keyword: searchedQuery,
    filters: selectedFilters,
  });

  useEffect(() => {
    return () => {
      dispatch(setSearchedQuery(""));
    };
  }, [dispatch]);

  useEffect(() => {
    setPage(1);
  }, [searchedQuery, selectedFilters]);

  const handleFilterChange = (nextFilters) => {
    setSelectedFilters(nextFilters);
    setPage(1);
  };

  return (
    <div>
      <div className="mx-auto my-10 max-w-7xl px-4 sm:px-6">
        <h1 className="my-10 text-xl font-bold">
          Search Results ({pagination?.total ?? jobs.length})
        </h1>
        <p className="-mt-8 mb-6 text-sm text-muted-foreground">
          India IT jobs from company career pages.
        </p>

        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="w-full lg:w-72 lg:shrink-0">
            <FilterCard
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onClear={() => handleFilterChange(emptyJobFilters)}
            />
          </div>
          {loading ? (
            <LoadingState
              variant="cards"
              message="Loading search results"
              description="Matching roles from company career pages."
              skeletonCount={6}
              className="flex-1"
            />
          ) : jobs.length === 0 ? (
            <div className="flex-1 rounded-md border border-dashed border-border bg-card p-10 text-center">
              <h2 className="text-lg font-semibold">No jobs match your search</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try removing one filter or searching another role.
              </p>
            </div>
          ) : (
            <div className="flex-1">
              <JobMasonryGrid>
                {jobs.map((job) => (
                  <Job key={job._id} job={job} />
                ))}
              </JobMasonryGrid>
              <Pagination
                className="mt-8"
                page={pagination?.page || page}
                totalPages={pagination?.totalPages || 1}
                total={pagination?.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Browse;
