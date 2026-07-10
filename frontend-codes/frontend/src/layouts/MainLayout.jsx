import { Outlet } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";

const MainLayout = () => {
  return (
    <div className="mx-2">
      <Navbar />
      <Outlet />
    </div>
  );
};

export default MainLayout;
