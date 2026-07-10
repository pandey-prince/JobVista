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
import MatchScorePanel from "@/features/job-detail/MatchScorePanel";
import { getJobBadges } from "@/utils/jobBadges";
import useSavedJobs from "@/hooks/useSavedJobs";

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
  const [applying, setApplying] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [isTracked, setIsTracked] = useState(false);
  const [matchScore, setMatchScore] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const { isSaved, toggleSaveJob } = useSavedJobs();

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
    return singleJob.requirements.filter(Boolean);
  }, [singleJob]);

  const applyOnCompanySite = () => {
    if (singleJob?.applicationLink) {
      window.open(singleJob.applicationLink, "_blank", "noopener,noreferrer");
    }
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
    const fetchSingleJob = async () => {
      try {
        setLoading(true);
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
        toast.error(error.response?.data?.message || "Unable to load job details");
      } finally {
        setLoading(false);
      }
    };

    fetchSingleJob();
  }, [jobId, scrapedJobId, isScrapedJob, isExternalJob, dispatch, user?._id]);

  useEffect(() => {
    if (!user || user.role !== "student" || !singleJob?._id) return;
    loadMatchScore(false);
  }, [user?._id, user?.role, singleJob?._id, jobId]);

  if (loading) {
    return (
      <div>
        <div className="max-w-6xl mx-auto my-16 flex items-center justify-center text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading job details
        </div>
      </div>
    );
  }

  if (!singleJob) {
    return (
      <div>
        <div className="max-w-6xl mx-auto my-16 border border-dashed border-gray-300 rounded-md p-10 text-center">
          <h1 className="font-bold text-xl">Job not found</h1>
          <p className="text-sm text-gray-500 mt-2">This job may have been removed or is no longer available.</p>
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
        <section className="bg-white border border-gray-200 rounded-lg p-6">
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
                <p className="text-gray-600 mt-2">
                  {singleJob?.company?.name || "JobVista Company"} · {singleJob.location}
                </p>
                {badges.isCareerPage && singleJob.sourceUrl && (
                  <a
                    href={singleJob.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-[#6A38C2] hover:underline"
                  >
                    View original career page →
                  </a>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge className="text-blue-700 font-bold" variant="ghost">
                    {singleJob.position || 1} Positions
                  </Badge>
                  <Badge className="text-[#7209b7] font-bold" variant="ghost">
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
                className={isSaved(jobId) ? "border-[#6A38C2] text-[#6A38C2]" : ""}
              >
                <Bookmark className={`mr-2 h-4 w-4 ${isSaved(jobId) ? "fill-current" : ""}`} />
                {isSaved(jobId) ? "Saved" : "Save job"}
              </Button>

            {isScrapedJob || isExternalJob ? (
              <>
              <Button
                onClick={applyOnCompanySite}
                className="rounded-lg min-w-36 bg-[#7209b7] hover:bg-[#5f32ad]"
              >
                Apply on {singleJob?.company?.name || singleJob.externalSource || "company"} site
              </Button>
              <Button
                variant="outline"
                onClick={markAsApplied}
                disabled={isTracked || tracking}
              >
                {tracking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isTracked ? "Tracked in pipeline" : "Mark as applied"}
              </Button>
              </>
            ) : (
              <Button
                onClick={applyJobHandler}
                disabled={isApplied || applying}
                className={`rounded-lg min-w-36 ${
                  isApplied ? "bg-gray-600 cursor-not-allowed" : "bg-[#7209b7] hover:bg-[#5f32ad]"
                }`}
              >
                {applying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isApplied ? "Already Applied" : "Apply Now"}
              </Button>
            )}
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-[1fr_320px] gap-6 mt-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="font-bold text-xl">Job Description</h2>
            <p className="text-gray-700 leading-7 mt-4">{singleJob.description}</p>

            <div className="mt-8">
              <h2 className="font-bold text-xl">Requirements</h2>
              {requirements.length ? (
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  {requirements.map((item, index) => (
                    <div key={`${item}-${index}`} className="flex gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-3">Requirements were not added by the recruiter.</p>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <MatchScorePanel
              showForStudent={user?.role === "student"}
              matchScore={matchScore}
              matchLoading={matchLoading}
              onLoad={() => loadMatchScore(true)}
            />

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="font-bold text-lg">Job Overview</h2>
              <div className="space-y-4 mt-4">
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-[#6A38C2]" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{singleJob.location}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <BriefcaseBusiness className="h-5 w-5 text-[#6A38C2]" />
                  <div>
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="font-medium">{singleJob.experienceLevel || "Not specified"} yrs</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <IndianRupee className="h-5 w-5 text-[#6A38C2]" />
                  <div>
                    <p className="text-sm text-gray-500">Salary</p>
                    <p className="font-medium">{salaryText}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Users className="h-5 w-5 text-[#6A38C2]" />
                  <div>
                    <p className="text-sm text-gray-500">Applicants</p>
                    <p className="font-medium">{singleJob.applications?.length || 0}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CalendarDays className="h-5 w-5 text-[#6A38C2]" />
                  <div>
                    <p className="text-sm text-gray-500">Posted Date</p>
                    <p className="font-medium">{formatDate(singleJob.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock3 className="h-5 w-5 text-[#6A38C2]" />
                  <div>
                    <p className="text-sm text-gray-500">Job Type</p>
                    <p className="font-medium">{singleJob.jobType}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#f7f4ff] border border-[#e4d8ff] rounded-lg p-5">
              <h2 className="font-bold text-lg">
                {badges.isCareerPage ? "Direct from career page" : "Need help applying?"}
              </h2>
              <p className="text-sm text-gray-600 mt-2">
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
