import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { Bell, Loader2, Plus, Send, Trash2 } from "lucide-react";
import useJobAlerts from "@/features/alerts/useJobAlerts";

const emptyForm = {
  name: "",
  keyword: "",
  location: "",
  experienceLevel: "",
  companyName: "",
  sourceType: "",
};

const JobAlerts = () => {
  const {
    alerts,
    loading,
    saving,
    createAlert,
    deleteAlert,
    toggleAlert,
    sendTestEmail,
  } = useJobAlerts();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Alert name is required");
      return;
    }
    const ok = await createAlert(form);
    if (ok) {
      setForm(emptyForm);
      setShowForm(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Alerts</h1>
          <p className="mt-2 text-muted-foreground">
            Daily digest at 8 PM IST. Watchlist companies send instant alerts when they post new jobs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={sendTestEmail}>
            <Send className="mr-2 h-4 w-4" />
            Test email
          </Button>
          <Button className="bg-brand" onClick={() => setShowForm((prev) => !prev)}>
            <Plus className="mr-2 h-4 w-4" />
            New alert
          </Button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Create alert</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Alert name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="SDE roles in Bangalore"
              />
            </div>
            <div>
              <Label>Keyword</Label>
              <Input
                value={form.keyword}
                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                placeholder="software engineer, react"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Bangalore, Remote"
              />
            </div>
            <div>
              <Label>Experience</Label>
              <Input
                value={form.experienceLevel}
                onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                placeholder="fresher, intern"
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="TCS, Infosys"
              />
            </div>
            <div>
              <Label>Source</Label>
              <select
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.sourceType}
                onChange={(e) => setForm({ ...form, sourceType: e.target.value })}
              >
                <option value="">Any source</option>
                <option value="career_page">Career page only</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={saving} className="bg-brand">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save alert
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="mt-16 flex justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Bell className="mx-auto h-10 w-10 text-brand" />
          <h2 className="mt-4 text-xl font-semibold">No alerts yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Create keyword alerts for roles you care about. You'll get a daily email at 8 PM IST when new jobs match.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {alerts.map((alert) => (
            <div key={alert._id} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{alert.name}</h3>
                    <Badge variant={alert.isActive ? "default" : "outline"}>
                      {alert.isActive ? "Active" : "Paused"}
                    </Badge>
                    <Badge variant="outline">Daily 8 PM IST</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {alert.keyword && <span>Keyword: {alert.keyword}</span>}
                    {alert.location && <span>· {alert.location}</span>}
                    {alert.experienceLevel && <span>· {alert.experienceLevel}</span>}
                    {alert.companyName && <span>· {alert.companyName}</span>}
                    {alert.sourceType && <span>· {alert.sourceType}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleAlert(alert)}>
                    {alert.isActive ? "Pause" : "Activate"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteAlert(alert._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobAlerts;
