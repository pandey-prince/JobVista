import React, { useEffect, useMemo, useState } from "react";
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
import {
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  IndianRupee,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import LoadingState from "@/components/shared/LoadingState";
import CompanyLogo from "@/components/CompanyLogo";
import JobFreshnessBadges from "@/components/shared/JobFreshnessBadges";
import { getJobBadges } from "@/utils/jobBadges";
import useSavedJobs from "@/hooks/useSavedJobs";
import { jobsApi } from "@/api";
import { toast } from "sonner";
import {
  cleanJobText,
  formatJobPostedDate,
  getJobExperienceLabel,
  toDescriptionParagraphs,
} from "@/utils/jobText";

const JobQuickView = ({ job, open, onOpenChange }) => {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const { isSaved, toggleSaveJob } = useSavedJobs();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !job) {
      setDetails(null);
      return;
    }

    let cancelled = false;

    const loadDetails = async () => {
      setLoading(true);
      try {
        const isScrapedJob = String(job._id || "").startsWith("scraped-");
        const res = isScrapedJob
          ? await jobsApi.getScrapedById(job.scrapedJobId || String(job._id).replace("scraped-", ""))
          : await jobsApi.getById(job._id);

        if (!cancelled && res.data.success) {
          setDetails(res.data.job);
        } else if (!cancelled) {
          setDetails(job);
        }
      } catch {
        if (!cancelled) setDetails(job);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [open, job]);

  const displayJob = details || job;
  const descriptionParagraphs = useMemo(
    () => toDescriptionParagraphs(displayJob?.description, 10),
    [displayJob?.description],
  );

  if (!job) return null;
  const requirements = (displayJob?.requirements || [])
    .map((item) => cleanJobText(String(item)))
    .filter(Boolean)
    .slice(0, 8);

  const badges = getJobBadges(displayJob);
  const saved = isSaved(displayJob._id);
  const isScrapedJob = String(displayJob._id || "").startsWith("scraped-");
  const isExternalFeed = displayJob.external && !isScrapedJob;
  const salaryText =
    typeof displayJob.salary === "number"
      ? `${displayJob.salary} LPA`
      : displayJob.salary || "Not disclosed";
  const experienceLabel = getJobExperienceLabel(displayJob);
  const postedDate = formatJobPostedDate(displayJob.createdAt);

  const handleApply = () => {
    if (isExternalFeed || isScrapedJob) {
      if (displayJob.applicationLink) {
        window.open(displayJob.applicationLink, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Apply link is not available for this role.");
      }
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }
    onOpenChange(false);
    navigate(`/description/${displayJob._id}`);
  };

  const handleSave = async () => {
    await toggleSaveJob(displayJob);
  };

  const openFullDetails = () => {
    onOpenChange(false);
    navigate(`/description/${displayJob._id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-md flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <div className="flex items-start gap-3 pr-6">
            <CompanyLogo company={displayJob.company} className="h-12 w-12 shrink-0" />
            <div className="min-w-0 text-left">
              <DialogTitle className="text-xl leading-snug">{displayJob.title}</DialogTitle>
              <DialogDescription className="mt-1 text-base text-muted-foreground">
                {displayJob.company?.name || "Company"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <JobFreshnessBadges job={displayJob} size="md" />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-brand" />
              <span>{displayJob.location?.trim() || "Not specified"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <IndianRupee className="h-4 w-4 shrink-0 text-brand" />
              <span>{salaryText}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <BriefcaseBusiness className="h-4 w-4 shrink-0 text-brand" />
              <span>{displayJob.jobType || "Full-time"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Users className="h-4 w-4 shrink-0 text-brand" />
              <span>{experienceLabel}</span>
            </div>
            {postedDate && (
              <div className="flex items-center gap-2 text-sm text-foreground sm:col-span-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-brand" />
                <span>Posted {postedDate}</span>
              </div>
            )}
            {displayJob.position ? (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Badge variant="outline">{displayJob.position} open positions</Badge>
              </div>
            ) : null}
          </div>

          {loading ? (
            <LoadingState
              variant="inline"
              message="Loading full job details"
              className="mx-auto my-6"
            />
          ) : (
            <>
              {descriptionParagraphs.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <h3 className="text-sm font-semibold text-foreground">About this role</h3>
                  <div className="mt-3 space-y-3">
                    {descriptionParagraphs.map((paragraph, index) => (
                      <p key={index} className="text-sm leading-6 text-foreground/90">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {requirements.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Key requirements</h3>
                  <ul className="mt-2 space-y-1.5">
                    {requirements.map((item, index) => (
                      <li key={index} className="text-sm leading-6 text-muted-foreground">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {badges.isCareerPage && (
                <p className="text-xs text-muted-foreground">
                  Synced from {displayJob.externalSource || displayJob.company?.name} career page
                  {displayJob.sourceUrl ? (
                    <>
                      {" · "}
                      <a
                        href={displayJob.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:underline"
                      >
                        View source
                      </a>
                    </>
                  ) : null}
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              onClick={handleSave}
              className={saved ? "border-brand text-brand" : ""}
            >
              <Bookmark className={`mr-2 h-4 w-4 ${saved ? "fill-current" : ""}`} />
              {saved ? "Saved" : "Save job"}
            </Button>
            <Button variant="ghost" onClick={openFullDetails}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Full details
            </Button>
          </div>
          <Button
            onClick={handleApply}
            className="w-full bg-accent-amber text-white hover:bg-accent-amber/90 sm:w-auto"
          >
            {isExternalFeed || isScrapedJob ? "Apply on company site" : "Apply now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobQuickView;
