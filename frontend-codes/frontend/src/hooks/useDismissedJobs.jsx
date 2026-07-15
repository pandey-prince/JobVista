import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { dismissedJobsApi } from "@/api";
import {
  addDismissedJobKey,
  removeDismissedJobKey,
  setDismissedJobKeys,
  setDismissedJobs,
  setDismissedJobsLoading,
} from "@/redux/dismissedJobsSlice";

const useDismissedJobs = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);
  const { dismissedJobKeys, dismissedJobs, loading } = useSelector(
    (store) => store.dismissedJobs,
  );

  const fetchDismissedJobs = useCallback(async () => {
    if (!user) return;
    try {
      dispatch(setDismissedJobsLoading(true));
      const [listRes, keysRes] = await Promise.all([
        dismissedJobsApi.list(),
        dismissedJobsApi.keys(),
      ]);
      if (listRes.data?.success) {
        dispatch(setDismissedJobs(listRes.data.dismissedJobs || []));
      }
      if (keysRes.data?.success) {
        dispatch(setDismissedJobKeys(keysRes.data.jobKeys || []));
      }
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(setDismissedJobsLoading(false));
    }
  }, [dispatch, user]);

  const dismissJob = async (job) => {
    if (!user) {
      toast.error("Login to hide jobs");
      return false;
    }

    const jobKey = String(job._id);

    try {
      await dismissedJobsApi.dismiss({ jobKey, ...job });
      dispatch(addDismissedJobKey(jobKey));
      toast.success("Marked as not interested", {
        description: "You can restore it anytime from Hidden jobs.",
      });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to hide job");
      return false;
    }
  };

  const undismissJob = async (jobKey) => {
    if (!user) return false;
    const key = String(jobKey);

    try {
      await dismissedJobsApi.remove(key);
      dispatch(removeDismissedJobKey(key));
      toast.success("Job restored to your feed");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to restore job");
      return false;
    }
  };

  return {
    dismissedJobKeys,
    dismissedJobs,
    loading,
    fetchDismissedJobs,
    dismissJob,
    undismissJob,
    isDismissed: (jobKey) => dismissedJobKeys.includes(String(jobKey)),
  };
};

export default useDismissedJobs;
