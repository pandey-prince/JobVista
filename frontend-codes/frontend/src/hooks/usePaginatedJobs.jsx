import { useCallback, useEffect, useMemo, useState } from "react";
import { jobsApi } from "@/api";
import { filtersToQueryParams } from "@/utils/jobFilters";

const usePaginatedJobs = ({
  page = 1,
  limit = 30,
  keyword = "",
  filters = {},
  enabled = true,
}) => {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  const refetch = useCallback(() => {
    setRefetchKey((key) => key + 1);
  }, []);

  const removeJobById = useCallback((jobId) => {
    const key = String(jobId);
    setJobs((prev) => prev.filter((job) => String(job._id) !== key));
    setPagination((prev) =>
      prev
        ? {
            ...prev,
            total: Math.max(0, (prev.total || 0) - 1),
          }
        : prev,
    );
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await jobsApi.list({
          keyword,
          page,
          limit,
          ...filtersToQueryParams(filters),
        });

        if (cancelled) return;

        if (res.data.success) {
          setJobs(res.data.jobs || []);
          setPagination(res.data.pagination || null);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchJobs();

    return () => {
      cancelled = true;
    };
  }, [page, limit, keyword, filterKey, enabled, refetchKey]);

  return { jobs, pagination, loading, error, refetch, removeJobById };
};

export default usePaginatedJobs;
