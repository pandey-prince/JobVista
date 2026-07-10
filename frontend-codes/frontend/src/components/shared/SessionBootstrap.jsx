import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { authApi, savedJobsApi } from "@/api";
import { setLoading, setUser } from "@/redux/authSlice";
import { setSavedJobKeys } from "@/redux/savedJobsSlice";

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
    const loadSavedKeys = async () => {
      if (!user || user.role !== "student") return;
      try {
        const response = await savedJobsApi.keys();
        if (response.data?.success) {
          dispatch(setSavedJobKeys(response.data.jobKeys || []));
        }
      } catch {
        // optional on bootstrap
      }
    };
    loadSavedKeys();
  }, [dispatch, user]);

  return null;
};

export default SessionBootstrap;
