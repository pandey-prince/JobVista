import { useEffect, useState } from "react";
import axios from "axios";
import { STATS_API_END_POINT } from "@/utils/constant";

const defaultStats = {
  totalJobs: 0,
  companiesMonitored: 0,
  jobsAddedToday: 0,
  scrapedJobs: 0,
};

const useGetPublicStats = () => {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${STATS_API_END_POINT}/public`);
        if (response.data?.success && response.data?.stats) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error("Failed to load public stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
};

export default useGetPublicStats;
