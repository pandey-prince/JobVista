import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const AuthRoute = ({ children, roles }) => {
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (roles?.length && !roles.includes(user.role)) {
      navigate("/");
    }
  }, [user, navigate, roles]);

  if (!user) {
    return null;
  }

  if (roles?.length && !roles.includes(user.role)) {
    return null;
  }

  return children;
};

export default AuthRoute;
