import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const AuthRoute = ({ children, roles }) => {
  const { user, loading } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (roles?.length && !roles.includes(user.role)) {
      navigate("/");
    }
  }, [user, loading, navigate, roles]);

  // Wait for session restore only when we have no user yet (avoid redirect flicker).
  if (loading && !user) {
    return null;
  }

  if (!user) {
    return null;
  }

  if (roles?.length && !roles.includes(user.role)) {
    return null;
  }

  return children;
};

export default AuthRoute;
