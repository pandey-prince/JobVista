import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import Home from "@/components/Home";
import Login from "@/components/auth/Login";
import Signup from "@/components/auth/Signup";
import Jobs from "@/components/Jobs";
import Browse from "@/components/Browse";
import Profile from "@/components/Profile";
import ProfileSetup from "@/components/ProfileSetup";
import JobDescription from "@/components/JobDescription";
import CompanyLists from "@/components/CompanyLists";
import SavedJobs from "@/components/SavedJobs";
import JobAlerts from "@/components/JobAlerts";
import AuthRoute from "@/components/shared/AuthRoute";

export const appRouter = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
      { path: "/jobs", element: <Jobs /> },
      { path: "/description/:id", element: <JobDescription /> },
      { path: "/browse", element: <Browse /> },
      { path: "/profile", element: <AuthRoute roles={["student"]}><Profile /></AuthRoute> },
      {
        path: "/profile/setup",
        element: (
          <AuthRoute roles={["student"]}>
            <ProfileSetup />
          </AuthRoute>
        ),
      },
      { path: "/my-companies", element: <AuthRoute roles={["student"]}><CompanyLists /></AuthRoute> },
      {
        path: "/saved-jobs",
        element: (
          <AuthRoute roles={["student"]}>
            <SavedJobs />
          </AuthRoute>
        ),
      },
      {
        path: "/alerts",
        element: (
          <AuthRoute roles={["student"]}>
            <JobAlerts />
          </AuthRoute>
        ),
      },
    ],
  },
]);
