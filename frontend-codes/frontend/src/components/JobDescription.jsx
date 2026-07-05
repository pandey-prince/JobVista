import React, { useEffect, useMemo, useState } from "react";
import Navbar from "./shared/Navbar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { APPLICATION_API_END_POINT, JOB_API_END_POINT, SCRAPED_JOB_API_END_POINT } from "@/utils/constant";
import { setSingleJob } from "@/redux/jobSlice";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
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

const formatDate = (value) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getDaysAgo = (value) => {
  if (!value) return "Recently posted";
  const difference = Date.now() - new Date(value).getTime();
  const days = Math.max(Math.floor(difference / (1000 * 60 * 60 * 24)), 0);
  return days === 0 ? "Posted today" : `Posted ${days} days ago`;
};

const JobDescription = () => {
  const { singleJob } = useSelector((store) => store.job);
  const { user } = useSelector((store) => store.auth);
  const [isApplied, setIsApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const params = useParams();
  const jobId = params.id;
  const isScrapedJob = String(jobId || "").startsWith("scraped-");
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

  const applyJobHandler = async () => {
    if (!user) {
      toast.error("Please login as a candidate before applying.");
      navigate("/login");
      return;
    }

    try {
      setApplying(true);
      const res = await axios.get(`${APPLICATION_API_END_POINT}/apply/${jobId}`, {
        withCredentials: true,
      });

      if (res.data.success) {
        setIsApplied(true);
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
        const endpoint = isScrapedJob
          ? `${SCRAPED_JOB_API_END_POINT}/${scrapedJobId}`
          : `${JOB_API_END_POINT}/get/${jobId}`;

        const res = await axios.get(endpoint, {
          withCredentials: true,
        });

        if (res.data.success) {
          dispatch(setSingleJob(res.data.job));
          if (!isScrapedJob) {
            setIsApplied(
              res.data.job.applications?.some(
                (application) =>
                  application.applicant === user?._id || application.applicant?._id === user?._id,
              ) || false,
            );
          }
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load job details");
      } finally {
        setLoading(false);
      }
    };

    fetchSingleJob();
  }, [jobId, scrapedJobId, isScrapedJob, dispatch, user?._id]);

  if (loading) {
    return (
      <div>
        <Navbar />
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
        <Navbar />
        <div className="max-w-6xl mx-auto my-16 border border-dashed border-gray-300 rounded-md p-10 text-center">
          <h1 className="font-bold text-xl">Job not found</h1>
          <p className="text-sm text-gray-500 mt-2">This job may have been removed or is no longer available.</p>
        </div>
      </div>
    );
  }

  const salaryText =
    typeof singleJob.salary === "number" ? `${singleJob.salary} LPA` : singleJob.salary || "Not disclosed";

  return (
    <div>
      <Navbar />
      <main className="max-w-6xl mx-auto my-8">
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex gap-4">
              <CompanyLogo company={singleJob?.company} className="h-16 w-16" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-bold text-3xl">{singleJob.title}</h1>
                  <Badge variant="outline">{singleJob.jobType}</Badge>
                  {singleJob.isNew && <Badge className="text-orange-700 font-bold" variant="ghost">New</Badge>}
                  {isScrapedJob && (
                    <Badge className="text-green-700 font-bold" variant="ghost">
                      {singleJob.externalSource || singleJob.sourceName}
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mt-2">
                  {singleJob?.company?.name || "JobVista Company"} - {singleJob.location}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge className="text-blue-700 font-bold" variant="ghost">
                    {singleJob.position || 1} Positions
                  </Badge>
                  <Badge className="text-[#7209b7] font-bold" variant="ghost">
                    {salaryText}
                  </Badge>
                  <Badge className="text-green-700 font-bold" variant="ghost">
                    {getDaysAgo(singleJob.createdAt)}
                  </Badge>
                </div>
              </div>
            </div>

            {isScrapedJob ? (
              <Button
                onClick={applyOnCompanySite}
                className="rounded-lg min-w-36 bg-[#7209b7] hover:bg-[#5f32ad]"
              >
                Apply on {singleJob?.company?.name || "company"} site
              </Button>
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
                {isScrapedJob ? "Sourced listing" : "Need help applying?"}
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                {isScrapedJob
                  ? `This role was synced from ${singleJob.sourceName || singleJob.externalSource || "a company career page"}. Last seen ${formatDate(singleJob.lastSeenAt || singleJob.createdAt)}.`
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
