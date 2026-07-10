import { useEffect, useMemo, useState } from "react";
import { jobsApi } from "@/api";
import { filtersToQueryParams } from "@/utils/jobFilters";

const usePaginatedJobs = ({
  page = 1,
  limit = 12,
  keyword = "",
  filters = {},
  enabled = true,
}) => {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

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
  }, [page, limit, keyword, filterKey, enabled]);

  return { jobs, pagination, loading, error };
};

export default usePaginatedJobs;
