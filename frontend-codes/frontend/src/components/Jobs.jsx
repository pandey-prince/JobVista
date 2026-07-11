import React, { useEffect, useState } from "react";
import FilterCard from "./FilterCard";
import Job from "./Job";
import { Button } from "./ui/button";
import { useDispatch, useSelector } from "react-redux";
import { setSearchedQuery } from "@/redux/jobSlice";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { emptyJobFilters } from "@/utils/jobFilters";
import usePaginatedJobs from "@/hooks/usePaginatedJobs";
import Pagination from "@/components/shared/Pagination";
import JobMasonryGrid from "@/components/shared/JobMasonryGrid";
import ExpandableJobSearch from "@/components/shared/ExpandableJobSearch";
import LoadingState from "@/components/shared/LoadingState";
import usePageTitle from "@/hooks/usePageTitle";
import { X } from "lucide-react";

const JOBS_PER_PAGE = 12;

const Jobs = () => {
  usePageTitle("Browse IT Jobs");

  const { searchedQuery } = useSelector((store) => store.job);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedFilters, setSelectedFilters] = useState(emptyJobFilters);
  const [page, setPage] = useState(1);

  const { jobs, pagination, loading, error } = usePaginatedJobs({
    page,
    limit: JOBS_PER_PAGE,
    keyword: searchedQuery,
    filters: selectedFilters,
  });

  useEffect(() => {
    setPage(1);
  }, [searchedQuery, selectedFilters]);

  const handleSearch = (query) => {
    dispatch(setSearchedQuery(query));
    setPage(1);
  };

  const clearSearch = () => {
    dispatch(setSearchedQuery(""));
    setPage(1);
  };

  const handleFilterChange = (nextFilters) => {
    setSelectedFilters(nextFilters);
    setPage(1);
  };

  return (
    <div>
      <div className="mx-auto mt-5 max-w-7xl px-4 sm:px-6">
        <div className="mb-5 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold">Fresh IT Jobs</h1>
              <p className="text-sm text-muted-foreground">
                India IT roles from company career pages. Use filters for city, experience, and work mode.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
              <ExpandableJobSearch
                className="w-full sm:w-auto sm:min-w-[3rem]"
                defaultQuery={searchedQuery}
                onSearch={handleSearch}
              />
              <Button variant="outline" onClick={() => navigate("/alerts")} className="hidden sm:inline-flex">
                Create job alert
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/alerts")}
            className="w-full sm:hidden"
          >
            Create job alert
          </Button>
          {searchedQuery ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Showing results for{" "}
                <span className="font-medium text-foreground">&quot;{searchedQuery}&quot;</span>
                {pagination?.total != null ? ` (${pagination.total} jobs)` : ""}
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={clearSearch} className="h-8 px-2">
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            </div>
          ) : null}
        </div>
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
              message="Finding fresh IT jobs"
              description="Pulling the latest roles from company career pages."
              skeletonCount={6}
              className="flex-1"
            />
          ) : error ? (
            <div className="flex-1 rounded-md border border-dashed border-destructive/40 bg-card p-10 text-center">
              <h2 className="text-lg font-semibold">Could not load jobs</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The job feed is temporarily unavailable. Please refresh or try again in a moment.
              </p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex-1 rounded-md border border-dashed border-border bg-card p-10 text-center">
              <h2 className="text-lg font-semibold">No jobs match your filters</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try removing one filter or searching another role.
              </p>
            </div>
          ) : (
            <div className="flex-1 pb-5">
              <JobMasonryGrid>
                {jobs.map((job) => (
                  <motion.div
                    key={job._id}
                    className="w-full"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Job job={job} />
                  </motion.div>
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

export default Jobs;
