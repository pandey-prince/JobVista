import React from "react";
import Navbar from "./shared/Navbar";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";

const SavedJobs = () => {
  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold">Saved Jobs</h1>
        <p className="mt-2 text-gray-600">
          Bookmark roles you want to revisit. Saving jobs from the job board is coming in the next update.
        </p>
        <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <Bookmark className="mx-auto h-10 w-10 text-[#6A38C2]" />
          <h2 className="mt-4 text-xl font-semibold">No saved jobs yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Browse fresh IT openings and save the ones you like. Your saved list will appear here.
          </p>
          <Link to="/jobs">
            <Button className="mt-6 bg-[#6A38C2] hover:bg-[#5b30a6]">Browse jobs</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SavedJobs;
