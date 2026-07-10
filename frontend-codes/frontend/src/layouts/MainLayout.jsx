import { Outlet } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

const MainLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20 text-foreground sm:pb-24">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
