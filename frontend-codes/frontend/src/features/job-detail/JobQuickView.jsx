import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, BriefcaseBusiness, IndianRupee, MapPin } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import JobFreshnessBadges from "@/components/shared/JobFreshnessBadges";
import { getJobBadges } from "@/utils/jobBadges";
import useSavedJobs from "@/hooks/useSavedJobs";

const JobQuickView = ({ job, open, onOpenChange }) => {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const { isSaved, toggleSaveJob } = useSavedJobs();

  if (!job) return null;

  const badges = getJobBadges(job);
  const saved = isSaved(job._id);
  const isScrapedJob = String(job._id || "").startsWith("scraped-");
  const isExternalFeed = job.external && !isScrapedJob;
  const salaryText =
    typeof job.salary === "number" ? `${job.salary} LPA` : job.salary || "Not disclosed";

  const handleApply = () => {
    if (isExternalFeed || isScrapedJob) {
      if (job.applicationLink) {
        window.open(job.applicationLink, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }
    onOpenChange(false);
    navigate(`/description/${job._id}`);
  };

  const handleSave = async () => {
    await toggleSaveJob(job);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-6">
            <CompanyLogo company={job.company} className="h-12 w-12 shrink-0" />
            <div className="min-w-0 text-left">
              <DialogTitle className="text-xl leading-snug">{job.title}</DialogTitle>
              <DialogDescription className="mt-1 text-base text-muted-foreground">
                {job.company?.name || "Company"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <JobFreshnessBadges job={job} size="md" />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="h-4 w-4 text-[#6A38C2]" />
              <span>{job.location || "India"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <IndianRupee className="h-4 w-4 text-[#6A38C2]" />
              <span>{salaryText}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <BriefcaseBusiness className="h-4 w-4 text-[#6A38C2]" />
              <span>{job.jobType || "Full-time"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Badge variant="outline">{job.experienceLevel || "Open"} yrs</Badge>
            </div>
          </div>

          {job.description && (
            <p className="text-sm leading-6 text-muted-foreground line-clamp-4">{job.description}</p>
          )}

          {badges.isCareerPage && (
            <p className="text-xs text-muted-foreground">
              Synced from {job.externalSource || job.company?.name} career page
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={handleSave}
            className={saved ? "border-[#6A38C2] text-[#6A38C2]" : ""}
          >
            <Bookmark className={`mr-2 h-4 w-4 ${saved ? "fill-current" : ""}`} />
            {saved ? "Saved" : "Save job"}
          </Button>
          <Button onClick={handleApply} className="bg-[#7209b7] hover:bg-[#5f32ad]">
            {isExternalFeed || isScrapedJob ? "Apply on company site" : "Apply now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobQuickView;
