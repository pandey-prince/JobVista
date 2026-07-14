import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import LoadingState from "@/components/shared/LoadingState";

const AuthRoute = ({ children, roles }) => {
  const { user, loading } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (roles?.length && !roles.includes(user.role)) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate, roles]);

  if (loading) {
    return (
      <LoadingState
        variant="page"
        message="Checking your session"
        description="Hang tight while we restore your account."
        className="py-20"
      />
    );
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
