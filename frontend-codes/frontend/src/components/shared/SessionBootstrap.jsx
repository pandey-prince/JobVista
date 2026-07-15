import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { authApi, savedJobsApi, dismissedJobsApi } from "@/api";
import { setLoading, setUser } from "@/redux/authSlice";
import { setSavedJobKeys } from "@/redux/savedJobsSlice";
import { setDismissedJobKeys } from "@/redux/dismissedJobsSlice";

const SessionBootstrap = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);

  useEffect(() => {
    const restoreSession = async () => {
      dispatch(setLoading(true));
      try {
        const response = await authApi.me();
        if (response.data?.success && response.data?.user) {
          dispatch(setUser(response.data.user));
        } else {
          dispatch(setUser(null));
        }
      } catch {
        dispatch(setUser(null));
      } finally {
        dispatch(setLoading(false));
      }
    };

    restoreSession();
  }, [dispatch]);

  useEffect(() => {
    const loadStudentKeys = async () => {
      if (!user || user.role !== "student") return;
      try {
        const [savedRes, dismissedRes] = await Promise.all([
          savedJobsApi.keys(),
          dismissedJobsApi.keys(),
        ]);
        if (savedRes.data?.success) {
          dispatch(setSavedJobKeys(savedRes.data.jobKeys || []));
        }
        if (dismissedRes.data?.success) {
          dispatch(setDismissedJobKeys(dismissedRes.data.jobKeys || []));
        }
      } catch {
        // optional on bootstrap
      }
    };
    loadStudentKeys();
  }, [dispatch, user]);

  return null;
};

export default SessionBootstrap;
