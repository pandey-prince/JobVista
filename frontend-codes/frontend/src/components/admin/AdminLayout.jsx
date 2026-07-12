import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { LayoutDashboard, Database, LogOut } from "lucide-react";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/redux/authSlice";
import { toast } from "sonner";

const navClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-brand-muted text-brand"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;

const AdminLayout = () => {
  const { user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await axios.post(`${USER_API_END_POINT}/logout`, {}, { withCredentials: true });
      dispatch(setUser(null));
      navigate("/admin/login");
      toast.success("Logged out");
    } catch {
      dispatch(setUser(null));
      navigate("/admin/login");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <Link to="/admin" className="text-xl font-bold">
              Job<span className="text-brand">LeLo</span> Ops
            </Link>
            <p className="text-xs text-muted-foreground">Career source monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="space-y-1">
            <NavLink to="/admin" end className={navClass}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink to="/admin/sources" className={navClass}>
              <Database className="h-4 w-4" />
              Sources
            </NavLink>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
