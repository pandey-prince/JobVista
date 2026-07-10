import { useEffect, useState } from "react";
import { toast } from "sonner";
import { alertsApi } from "@/api";

const useJobAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await alertsApi.list();
      if (res.data.success) setAlerts(res.data.alerts || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const createAlert = async (form) => {
    try {
      setSaving(true);
      const res = await alertsApi.create(form);
      if (res.data.success) {
        toast.success("Alert created");
        await fetchAlerts();
        return true;
      }
      return false;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create alert");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteAlert = async (id) => {
    try {
      await alertsApi.remove(id);
      toast.success("Alert deleted");
      await fetchAlerts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete alert");
    }
  };

  const toggleAlert = async (alert) => {
    try {
      await alertsApi.update(alert._id, { ...alert, isActive: !alert.isActive });
      await fetchAlerts();
    } catch {
      toast.error("Failed to update alert");
    }
  };

  const sendTestEmail = async () => {
    try {
      const res = await alertsApi.testEmail();
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send test email");
    }
  };

  return {
    alerts,
    loading,
    saving,
    createAlert,
    deleteAlert,
    toggleAlert,
    sendTestEmail,
  };
};

export default useJobAlerts;
