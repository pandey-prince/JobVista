import { Outlet } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background pb-20 text-foreground sm:pb-24">
      <Navbar />
      <Outlet />
    </div>
  );
};

export default MainLayout;
