import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trackerApi } from "@/api";

const TRACKER_STAGES = [
  { id: "applied", label: "Applied" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
];

const useTrackedApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await trackerApi.list();
      if (res.data.success) setApplications(res.data.applications || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const moveStage = async (application, stage) => {
    try {
      setUpdatingId(application._id);
      await trackerApi.update(application._id, { stage });
      setApplications((prev) =>
        prev.map((item) => (item._id === application._id ? { ...item, stage } : item)),
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update stage");
    } finally {
      setUpdatingId(null);
    }
  };

  const trackApplication = async (payload) => {
    const res = await trackerApi.create(payload);
    return res.data;
  };

  return {
    applications,
    loading,
    updatingId,
    stages: TRACKER_STAGES,
    fetchApplications,
    moveStage,
    trackApplication,
  };
};

export default useTrackedApplications;
