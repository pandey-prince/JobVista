import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { applicationsApi, jobsApi, trackerApi } from "@/api";
import { setSingleJob } from "@/redux/jobSlice";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import CompanyLogo from "./CompanyLogo";
import JobFreshnessBadges from "./shared/JobFreshnessBadges";
import LoadingState from "@/components/shared/LoadingState";
import MatchScorePanel from "@/features/job-detail/MatchScorePanel";
import { getJobBadges } from "@/utils/jobBadges";
import useSavedJobs from "@/hooks/useSavedJobs";
import usePageTitle from "@/hooks/usePageTitle";
import { useJobMateContext } from "@/context/JobMateContext";
import { cleanJobText, toDescriptionParagraphs } from "@/utils/jobText";

const formatDate = (value) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const JobDescription = () => {
  const { singleJob } = useSelector((store) => store.job);
  const { user } = useSelector((store) => store.auth);
  const [isApplied, setIsApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [applying, setApplying] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [isTracked, setIsTracked] = useState(false);
  const [matchScore, setMatchScore] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const { isSaved, toggleSaveJob } = useSavedJobs();
  const { setJobContext } = useJobMateContext();

  const params = useParams();
  const jobId = params.id;
  const isScrapedJob = String(jobId || "").startsWith("scraped-");
  const isExternalJob =
    String(jobId || "").startsWith("remotive-") ||
    String(jobId || "").startsWith("arbeitnow-");
  const scrapedJobId = isScrapedJob ? jobId.replace("scraped-", "") : jobId;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const requirements = useMemo(() => {
    if (!singleJob?.requirements?.length) return [];
    return singleJob.requirements.map((item) => cleanJobText(String(item))).filter(Boolean);
  }, [singleJob]);

  const descriptionParagraphs = useMemo(
    () => toDescriptionParagraphs(singleJob?.description, 20),
    [singleJob?.description],
  );

  const pageTitle = useMemo(() => {
    if (singleJob?.title && singleJob?.company?.name) {
      return `${singleJob.title} at ${singleJob.company.name}`;
    }
    if (singleJob?.title) return singleJob.title;
    return "Job Details";
  }, [singleJob?.title, singleJob?.company?.name]);

  usePageTitle(pageTitle);

  const applyOnCompanySite = () => {
    if (singleJob?.applicationLink) {
      window.open(singleJob.applicationLink, "_blank", "noopener,noreferrer");
      return;
    }
    toast.error("Apply link is not available for this role.");
  };

  const markAsApplied = async () => {
    if (!user) {
      toast.error("Please login to track applications");
      navigate("/login");
      return;
    }

    try {
      setTracking(true);
      const res = await trackerApi.create({
          jobKey: jobId,
          title: singleJob?.title,
          companyName: singleJob?.company?.name,
          location: singleJob?.location,
          applicationUrl: singleJob?.applicationLink,
          sourceType: getJobBadges(singleJob)?.sourceType,
      });
      if (res.data.success) {
        setIsTracked(true);
        toast.success("Added to your application tracker");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to track application");
    } finally {
      setTracking(false);
    }
  };

  const loadMatchScore = async (showLoginToast = false) => {
    if (!user) {
      if (showLoginToast) {
        toast.error("Login to see your match score");
        navigate("/login");
      }
      return;
    }

    try {
      setMatchLoading(true);
      const res = await jobsApi.matchScore(jobId);
      if (res.data.success) setMatchScore(res.data.match);
    } catch (error) {
      if (showLoginToast) {
        toast.error(error.response?.data?.message || "Unable to calculate match score");
      }
    } finally {
      setMatchLoading(false);
    }
  };

  const applyJobHandler = async () => {
    if (!user) {
      toast.error("Please login as a candidate before applying.");
      navigate("/login");
      return;
    }

    try {
      setApplying(true);
      const res = await applicationsApi.apply(jobId);

      if (res.data.success) {
        setIsApplied(true);
        setIsTracked(true);
        dispatch(
          setSingleJob({
            ...singleJob,
            applications: [...(singleJob?.applications || []), { applicant: user?._id }],
          }),
        );
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to apply for this job");
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    if (!singleJob?._id) {
      setJobContext(null);
      return undefined;
    }

    setJobContext({
      jobId: singleJob._id,
      title: singleJob.title,
      company: singleJob.company?.name,
      description: singleJob.description,
    });

    return () => setJobContext(null);
  }, [singleJob?._id, singleJob?.title, singleJob?.company?.name, singleJob?.description, setJobContext]);

  useEffect(() => {
    const fetchSingleJob = async () => {
      try {
        setLoading(true);
        setFetchFailed(false);
        dispatch(setSingleJob(null));

        const res = isScrapedJob
          ? await jobsApi.getScrapedById(scrapedJobId)
          : await jobsApi.getById(jobId);

        if (res.data.success) {
          dispatch(setSingleJob(res.data.job));
          if (!isScrapedJob && !isExternalJob) {
            setIsApplied(
              res.data.job.applications?.some(
                (application) =>
                  application.applicant === user?._id || application.applicant?._id === user?._id,
              ) || false,
            );
          }
        } else {
          dispatch(setSingleJob(null));
          setFetchFailed(true);
        }

        if (user?.role === "student") {
          try {
            const trackedRes = await trackerApi.list();
            if (trackedRes.data.success) {
              setIsTracked(
                trackedRes.data.applications?.some((item) => item.jobKey === jobId) || false,
              );
            }
          } catch {
            // tracker optional on load
          }
        }
      } catch (error) {
        dispatch(setSingleJob(null));
        setFetchFailed(true);
        toast.error(error.response?.data?.message || "Unable to load job details");
      } finally {
        setLoading(false);
      }
    };

    fetchSingleJob();
  }, [jobId, scrapedJobId, isScrapedJob, isExternalJob, dispatch, user?._id, user?.role]);

  useEffect(() => {
    if (!user || user.role !== "student" || !singleJob?._id) return;
    loadMatchScore(false);
  }, [user?._id, user?.role, singleJob?._id, jobId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto my-16">
        <LoadingState
          variant="page"
          message="Loading job details"
          description="Fetching role description, requirements, and apply link."
        />
      </div>
    );
  }

  if (!singleJob || fetchFailed) {
    return (
      <div>
        <div className="max-w-6xl mx-auto my-16 border border-dashed border-border rounded-md p-10 text-center">
          <h1 className="font-bold text-xl">Job not found</h1>
          <p className="text-sm text-muted-foreground mt-2">This job may have been removed or is no longer available.</p>
        </div>
      </div>
    );
  }

  const salaryText =
    typeof singleJob.salary === "number" ? `${singleJob.salary} LPA` : singleJob.salary || "Not disclosed";
  const badges = getJobBadges(singleJob);

  return (
    <div>
      <main className="max-w-6xl mx-auto my-8">
        <section className="bg-card border border-border rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex gap-4">
              <CompanyLogo company={singleJob?.company} className="h-16 w-16" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-bold text-3xl">{singleJob.title}</h1>
                  <Badge variant="outline">{singleJob.jobType}</Badge>
                </div>
                <div className="mt-3">
                  <JobFreshnessBadges job={singleJob} size="md" />
                </div>
                <p className="text-muted-foreground mt-2">
                  {singleJob?.company?.name || "Company"} · {singleJob.location?.trim() || "Not specified"}
                </p>
                {badges.isCareerPage && singleJob.sourceUrl && (
                  <a
                    href={singleJob.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
                  >
                    View original career page →
                  </a>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge className="text-blue-700 font-bold" variant="ghost">
                    {singleJob.position || 1} Positions
                  </Badge>
                  <Badge className="text-accent-amber font-bold" variant="ghost">
                    {salaryText}
                  </Badge>
                  <Badge className="text-green-700 font-bold" variant="ghost">
                    {badges.freshnessLabel}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => toggleSaveJob(singleJob)}
                className={isSaved(jobId) ? "border-brand text-brand" : ""}
              >
                <Bookmark className={`mr-2 h-4 w-4 ${isSaved(jobId) ? "fill-current" : ""}`} />
                {isSaved(jobId) ? "Saved" : "Save job"}
              </Button>

            {isScrapedJob || isExternalJob ? (
              <>
                <div className="space-y-2">
                  <Button
                    onClick={applyOnCompanySite}
                    disabled={!singleJob?.applicationLink}
                    className="w-full rounded-lg min-w-36 bg-accent-amber text-white hover:bg-accent-amber/90 disabled:opacity-60"
                  >
                    Apply on company site
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Opens company site — come back to track status
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={markAsApplied}
                  disabled={isTracked || tracking}
                  className="w-full"
                >
                  {tracking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isTracked ? "Tracked in pipeline" : "Track application"}
                </Button>
                {badges.isCareerPage ? (
                  <p className="text-xs text-muted-foreground">
                    Sourced from official careers page
                    {singleJob.sourceUrl ? (
                      <>
                        {" · "}
                        <a
                          href={singleJob.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-brand hover:underline"
                        >
                          View source
                        </a>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </>
            ) : (
              <Button
                onClick={applyJobHandler}
                disabled={isApplied || applying}
                className={`rounded-lg min-w-36 ${
                  isApplied ? "bg-muted-foreground cursor-not-allowed" : "bg-accent-amber text-white hover:bg-accent-amber/90"
                }`}
              >
                {applying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isApplied ? "Already Applied" : "Apply Now"}
              </Button>
            )}
            </div>
          </div>
        </section>

        <section className="mt-6 grid items-start gap-6 md:grid-cols-[1fr_320px]">
          <div className="w-full self-start rounded-lg border border-border bg-card p-6">
            <h2 className="font-bold text-xl">Job Description</h2>
            <div className="mt-4 space-y-4">
              {descriptionParagraphs.length ? (
                descriptionParagraphs.map((paragraph, index) => (
                  <p key={index} className="text-foreground/80 leading-7">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground">No description available.</p>
              )}
            </div>

            <div className={descriptionParagraphs.length ? "mt-6" : "mt-4"}>
              <h2 className="font-bold text-xl">Requirements</h2>
              {requirements.length ? (
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  {requirements.map((item, index) => (
                    <div key={`${item}-${index}`} className="flex gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-3">No detailed requirements listed for this role.</p>
              )}
            </div>
          </div>

          <aside className="w-full space-y-4 self-start">
            <MatchScorePanel
              showForStudent={user?.role === "student"}
              matchScore={matchScore}
              matchLoading={matchLoading}
              onLoad={() => loadMatchScore(true)}
            />

            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="font-bold text-lg">Job Overview</h2>
              <div className="space-y-4 mt-4">
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{singleJob.location?.trim() || "Not specified"}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <BriefcaseBusiness className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-medium">{singleJob.experienceLevel || "Not specified"} yrs</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <IndianRupee className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm text-muted-foreground">Salary</p>
                    <p className="font-medium">{salaryText}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Users className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm text-muted-foreground">Applicants</p>
                    <p className="font-medium">{singleJob.applications?.length || 0}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CalendarDays className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm text-muted-foreground">Posted Date</p>
                    <p className="font-medium">{formatDate(singleJob.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock3 className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm text-muted-foreground">Job Type</p>
                    <p className="font-medium">{singleJob.jobType}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-brand/20 bg-brand-muted p-5">
              <h2 className="font-bold text-lg">
                {badges.isCareerPage ? "Direct from career page" : "Need help applying?"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {badges.isCareerPage
                  ? `This role was synced from ${singleJob.sourceName || singleJob.externalSource || "a company career page"}. Last verified ${formatDate(singleJob.lastSeenAt || singleJob.createdAt)}.`
                  : "Ask JobMate to improve your resume, write a cover letter, or prepare interview answers for this role."}
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
};

export default JobDescription;
