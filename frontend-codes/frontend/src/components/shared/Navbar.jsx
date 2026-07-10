import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import UserAvatar from "./UserAvatar";
import ThemeToggle from "./ThemeToggle";
import { LogOut, Menu, User2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import { setUser } from "@/redux/authSlice";
import { toast } from "sonner";

const Navbar = () => {
  const { user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logoutHandler = async () => {
    try {
      const res = await axios.post(
        `${USER_API_END_POINT}/logout`,
        {},
        {
          withCredentials: true,
        },
      );
      if (res.data.success) {
        dispatch(setUser(null));
        navigate("/");
        toast.success("Successfully Signout");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  const navigationLinks =
    user && user.role === "recruiter"
      ? [
          { label: "Companies", to: "/admin/companies" },
          { label: "Jobs", to: "/admin/jobs" },
          { label: "Scrape Sources", to: "/admin/scrape-sources" },
        ]
      : [
          { label: "Home", to: "/" },
          { label: "Jobs", to: "/jobs" },
          ...(user
            ? [
                { label: "Saved", to: "/saved-jobs" },
                { label: "Alerts", to: "/alerts" },
                { label: "My Companies", to: "/my-companies" },
              ]
            : []),
        ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    closeMobileMenu();
    await logoutHandler();
  };

  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div
          onClick={() => {
            closeMobileMenu();
            navigate("/");
          }}
          className="cursor-pointer"
        >
          <h1 className="text-xl font-bold sm:text-2xl">
            Job<span className="text-accent-orange">Vista</span>
          </h1>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <ul className="flex items-center gap-5 font-medium">
            {navigationLinks.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
          {!user ? (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/signup">
                <Button variant="brand">
                  Signup
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ThemeToggle />
            <Popover>
              <PopoverTrigger asChild>
                <UserAvatar
                  name={user?.fullname}
                  className="cursor-pointer font-bold pb-1.5"
                />
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div>
                  <div className="flex gap-2 space-y-2">
                    <UserAvatar name={user?.fullname} className="cursor-pointer" />
                    <div className="min-w-0">
                      <h4 className="font-medium">{user?.fullname}</h4>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {user?.profile?.bio}
                      </p>
                    </div>
                  </div>
                  <div className="my-2 flex flex-col text-muted-foreground">
                    <div className="flex w-fit items-center gap-2 cursor-pointer">
                      <User2 />
                      <Button variant="link">
                        <Link to="/profile">View Profile</Link>
                      </Button>
                    </div>

                    <div className="flex w-fit items-center gap-2 cursor-pointer">
                      <LogOut />
                      <Button onClick={logoutHandler} variant="link">
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="mx-auto max-w-7xl border-t border-border px-4 py-4 md:hidden sm:px-6">
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-3 font-medium">
              {navigationLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} onClick={closeMobileMenu}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {!user ? (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={closeMobileMenu}>
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link to="/signup" onClick={closeMobileMenu}>
                  <Button variant="brand" className="w-full">
                    Signup
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-center gap-3">
                  <UserAvatar name={user?.fullname} className="cursor-pointer font-bold" />
                  <div className="min-w-0">
                    <h4 className="truncate font-medium">{user?.fullname}</h4>
                    <p className="truncate text-sm text-muted-foreground">
                      {user?.profile?.bio}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2 text-muted-foreground">
                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2"
                  >
                    <User2 className="h-4 w-4" />
                    <span>View Profile</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Navbar;
