import { useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { setLoading, setUser } from "@/redux/authSlice";
import { USER_API_END_POINT } from "@/utils/constant";

const SessionBootstrap = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const restoreSession = async () => {
      dispatch(setLoading(true));
      try {
        const response = await axios.get(`${USER_API_END_POINT}/me`, {
          withCredentials: true,
        });
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

  return null;
};

export default SessionBootstrap;
