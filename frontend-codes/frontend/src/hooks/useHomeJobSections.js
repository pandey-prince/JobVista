import { useEffect, useState } from "react";
import { jobsApi } from "@/api";

const POSTED_24H_MS = 24 * 60 * 60 * 1000;

const isPostedWithin24Hours = (job) => {
  if (!job?.createdAt) return false;
  return Date.now() - new Date(job.createdAt).getTime() <= POSTED_24H_MS;
};

export default function useHomeJobSections() {
  const [newTodayJobs, setNewTodayJobs] = useState([]);
  const [latestJobs, setLatestJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const res = await jobsApi.list({ page: 1, limit: 24 });
        if (cancelled || !res.data.success) return;

        const jobs = res.data.jobs || [];
        const today = jobs.filter(isPostedWithin24Hours).slice(0, 6);
        const todayIds = new Set(today.map((job) => job._id));
        const latest = jobs.filter((job) => !todayIds.has(job._id)).slice(0, 6);

        setNewTodayJobs(today);
        setLatestJobs(latest);
      } catch (error) {
        console.error("Failed to load home job sections", error);
        if (!cancelled) {
          setNewTodayJobs([]);
          setLatestJobs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { newTodayJobs, latestJobs, loading };
}
