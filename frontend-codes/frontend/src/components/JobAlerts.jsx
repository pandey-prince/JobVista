import React from "react";
import Navbar from "./shared/Navbar";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";

const JobAlerts = () => {
  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold">Job Alerts</h1>
        <p className="mt-2 text-gray-600">
          Get email notifications for new IT jobs — daily digest at 8 PM IST and instant alerts for watched companies.
        </p>
        <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <Bell className="mx-auto h-10 w-10 text-[#6A38C2]" />
          <h2 className="mt-4 text-xl font-semibold">Set up your first alert</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Create keyword alerts and watch companies to get notified when fresh roles appear on their career pages.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/my-companies">
              <Button variant="outline">Manage watchlist</Button>
            </Link>
            <Link to="/jobs">
              <Button className="bg-[#6A38C2] hover:bg-[#5b30a6]">Browse jobs</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobAlerts;
