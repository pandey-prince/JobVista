import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Navbar from './components/shared/Navbar'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Home from './components/Home'
import Jobs from './components/Jobs'
import Browse from './components/Browse'
import Profile from './components/Profile'
import ProfileSetup from './components/ProfileSetup'
import JobDescription from './components/JobDescription'
import Companies from './components/admin/Companies'
import CompanyCreate from './components/admin/CompanyCreate'
import CompanySetup from './components/admin/CompanySetup'
import AdminJobs from "./components/admin/AdminJobs";
import PostJob from './components/admin/PostJob'
import Applicants from './components/admin/Applicants'
import ScrapeSources from './components/admin/ScrapeSources'
import CompanyLists from './components/CompanyLists'
import SavedJobs from './components/SavedJobs'
import JobAlerts from './components/JobAlerts'
import ProtectedRoute from './components/admin/ProtectedRoute'
import AuthRoute from './components/shared/AuthRoute'
import JobMateChatbot from './components/JobMateChatbot'
import SessionBootstrap from './components/shared/SessionBootstrap'


const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <Signup />
  },
  {
    path: "/jobs",
    element: <Jobs />
  },
  {
    path: "/description/:id",
    element: <JobDescription />
  },
  {
    path: "/browse",
    element: <Browse />
  },
  {
    path: "/profile",
    element: <AuthRoute><Profile /></AuthRoute>
  },
  {
    path: "/profile/setup",
    element: <AuthRoute roles={["student"]}><ProfileSetup /></AuthRoute>
  },
  {
    path: "/my-companies",
    element: <AuthRoute><CompanyLists /></AuthRoute>
  },
  {
    path: "/saved-jobs",
    element: <AuthRoute roles={["student"]}><SavedJobs /></AuthRoute>
  },
  {
    path: "/alerts",
    element: <AuthRoute roles={["student"]}><JobAlerts /></AuthRoute>
  },
  // recruiter dashboard
  {
    path:"/admin/companies",
    element: <ProtectedRoute><Companies/></ProtectedRoute>
  },
  {
    path:"/admin/companies/create",
    element: <ProtectedRoute><CompanyCreate/></ProtectedRoute> 
  },
  {
    path:"/admin/companies/:id",
    element:<ProtectedRoute><CompanySetup/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs",
    element:<ProtectedRoute><AdminJobs/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs/create",
    element:<ProtectedRoute><PostJob/></ProtectedRoute> 
  },
  {
    path:"/admin/jobs/:id/applicants",
    element:<ProtectedRoute><Applicants/></ProtectedRoute> 
  },
  {
    path:"/admin/scrape-sources",
    element:<ProtectedRoute><ScrapeSources/></ProtectedRoute>
  },

])
function App() {

  return (
    <div className='mx-2'>
      <SessionBootstrap />
      <RouterProvider router={appRouter} />
      <JobMateChatbot />
    </div>
  )
}

export default App
