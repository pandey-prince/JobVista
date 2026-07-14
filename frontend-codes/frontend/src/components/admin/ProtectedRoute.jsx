import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import LoadingState from "@/components/shared/LoadingState";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user || user.role !== "admin") {
      navigate("/admin/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <LoadingState
        variant="page"
        message="Checking admin session"
        description="Hang tight while we verify your access."
        className="py-20"
      />
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return children;
};

export default ProtectedRoute;
