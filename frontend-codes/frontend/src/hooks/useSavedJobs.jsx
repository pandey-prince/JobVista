import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { savedJobsApi } from "@/api";
import {
  addSavedJobKey,
  removeSavedJobKey,
  setSavedJobKeys,
  setSavedJobs,
  setSavedJobsLoading,
} from "@/redux/savedJobsSlice";

const useSavedJobs = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);
  const { savedJobKeys, savedJobs, loading } = useSelector((store) => store.savedJobs);

  const fetchSavedJobs = useCallback(async () => {
    if (!user) return;
    try {
      dispatch(setSavedJobsLoading(true));
      const [listRes, keysRes] = await Promise.all([
        savedJobsApi.list(),
        savedJobsApi.keys(),
      ]);
      if (listRes.data?.success) dispatch(setSavedJobs(listRes.data.savedJobs || []));
      if (keysRes.data?.success) dispatch(setSavedJobKeys(keysRes.data.jobKeys || []));
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(setSavedJobsLoading(false));
    }
  }, [dispatch, user]);

  const toggleSaveJob = async (job) => {
    if (!user) {
      toast.error("Login to save jobs");
      return false;
    }

    const jobKey = String(job._id);
    const isSaved = savedJobKeys.includes(jobKey);

    try {
      if (isSaved) {
        await savedJobsApi.remove(jobKey);
        dispatch(removeSavedJobKey(jobKey));
        toast.success("Removed from saved jobs");
        return false;
      }

      await savedJobsApi.save({ jobKey, ...job });
      dispatch(addSavedJobKey(jobKey));
      toast.success("Job saved");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update saved job");
      return isSaved;
    }
  };

  return {
    savedJobKeys,
    savedJobs,
    loading,
    fetchSavedJobs,
    toggleSaveJob,
    isSaved: (jobKey) => savedJobKeys.includes(String(jobKey)),
  };
};

export default useSavedJobs;
