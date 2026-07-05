import React, { useEffect, useState } from "react";
import Navbar from "../shared/Navbar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import axios from "axios";
import { SCRAPED_JOB_API_END_POINT, CAREER_SOURCE_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { Loader2, RefreshCw, Trash2, Upload } from "lucide-react";

const defaultForm = {
  name: "",
  companyName: "",
  url: "",
  scraperType: "",
  isActive: true,
  selectors: {
    jobList: "",
    title: "",
    description: "",
    location: "",
    link: "",
  },
};

const ScrapeSources = () => {
  const [sources, setSources] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncingSourceId, setSyncingSourceId] = useState("");

  const fetchSources = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${SCRAPED_JOB_API_END_POINT}/sources`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setSources(res.data.sources);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load sources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const detectType = async (url) => {
    if (!url) return;
    try {
      const res = await axios.post(
        `${SCRAPED_JOB_API_END_POINT}/sources/detect`,
        { url },
        { withCredentials: true }
      );
      if (res.data.success) {
        setForm((prev) => ({
          ...prev,
          scraperType: res.data.scraperType,
          companyName: prev.companyName || res.data.suggestedCompanyName,
          name: prev.name || `${res.data.suggestedCompanyName} Careers`,
        }));
      }
    } catch {
      // detection is optional
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.url) {
      toast.error("Career page URL is required");
      return;
    }

    try {
      setSaving(true);
      const res = await axios.post(
        `${SCRAPED_JOB_API_END_POINT}/sources`,
        form,
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setForm(defaultForm);
        fetchSources();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add source");
    } finally {
      setSaving(false);
    }
  };

  const handleFullSync = async () => {
    try {
      setSyncing(true);
      const res = await axios.post(
        `${SCRAPED_JOB_API_END_POINT}/sync`,
        {},
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(
          `Sync done: ${res.data.summary?.newJobsCount || 0} new jobs found`
        );
        fetchSources();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleSourceSync = async (sourceId) => {
    try {
      setSyncingSourceId(sourceId);
      const res = await axios.post(
        `${SCRAPED_JOB_API_END_POINT}/sources/${sourceId}/sync`,
        {},
        { withCredentials: true }
      );
      if (res.data.success) {
        const result = res.data.result;
        toast.success(
          result.success
            ? `Synced ${result.jobsFound || 0} jobs (${result.newJobsCount || 0} new)`
            : result.error || "Source sync failed"
        );
        fetchSources();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Source sync failed");
    } finally {
      setSyncingSourceId("");
    }
  };

  const toggleSource = async (source) => {
    try {
      await axios.put(
        `${SCRAPED_JOB_API_END_POINT}/sources/${source._id}`,
        { isActive: !source.isActive },
        { withCredentials: true }
      );
      fetchSources();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update source");
    }
  };

  const deleteSource = async (sourceId) => {
    try {
      await axios.delete(`${SCRAPED_JOB_API_END_POINT}/sources/${sourceId}`, {
        withCredentials: true,
      });
      toast.success("Source removed");
      fetchSources();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete source");
    }
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setImporting(true);
      const res = await axios.post(
        `${CAREER_SOURCE_API_END_POINT}/import/excel`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (res.data.success) {
        toast.success(
          `Imported ${res.data.summary.created} new, ${res.data.summary.existing} existing, ${res.data.summary.active} active scrapers`
        );
        fetchSources();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Excel import failed");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const activeCount = sources.filter((s) => s.isActive).length;
  const pendingCount = sources.filter((s) => !s.isActive).length;

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto my-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-2xl">Career Page Sources</h1>
            <p className="text-sm text-gray-500">
              {sources.length} companies configured · {activeCount} active scrapers · {pendingCount} pending setup
            </p>
            <p className="text-xs text-gray-400 mt-1">
              IT jobs are synced automatically from companies with Greenhouse, Lever, or Ashby career pages.
            </p>
          </div>
          <Button onClick={handleFullSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync All
          </Button>
        </div>

        <div className="bg-[#f7f4ff] border border-[#e4d8ff] rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-lg">Bulk import from Excel / CSV</h2>
          <p className="text-sm text-gray-600 mt-2">
            Upload a spreadsheet with columns: <strong>companyName</strong>, <strong>careerUrl</strong> (optional: name, scraperType).
            Imported companies are public for all users.
          </p>
          <label htmlFor="excel-import" className="inline-block mt-4 cursor-pointer">
            <Button type="button" variant="outline" disabled={importing}>
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload Excel / CSV
            </Button>
          </label>
          <input
            id="excel-import"
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleExcelImport}
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-lg p-6 mb-8 space-y-4"
        >
          <h2 className="font-semibold text-lg">Add career page</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Career page URL</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                onBlur={(e) => detectType(e.target.value)}
                placeholder="https://boards.greenhouse.io/stripe"
              />
            </div>
            <div>
              <Label>Display name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Stripe Careers"
              />
            </div>
            <div>
              <Label>Company name</Label>
              <Input
                value={form.companyName}
                onChange={(e) =>
                  setForm({ ...form, companyName: e.target.value })
                }
                placeholder="Stripe"
              />
            </div>
            <div>
              <Label>Scraper type</Label>
              <Input
                value={form.scraperType}
                onChange={(e) =>
                  setForm({ ...form, scraperType: e.target.value })
                }
                placeholder="greenhouse / lever / ashby / generic"
              />
            </div>
          </div>

          {form.scraperType === "generic" && (
            <div className="grid md:grid-cols-2 gap-4 border-t pt-4">
              <div>
                <Label>Job list selector</Label>
                <Input
                  value={form.selectors.jobList}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      selectors: { ...form.selectors, jobList: e.target.value },
                    })
                  }
                  placeholder=".job-card"
                />
              </div>
              <div>
                <Label>Title selector</Label>
                <Input
                  value={form.selectors.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      selectors: { ...form.selectors, title: e.target.value },
                    })
                  }
                  placeholder="h3"
                />
              </div>
              <div>
                <Label>Description selector</Label>
                <Input
                  value={form.selectors.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      selectors: {
                        ...form.selectors,
                        description: e.target.value,
                      },
                    })
                  }
                  placeholder=".description"
                />
              </div>
              <div>
                <Label>Link selector</Label>
                <Input
                  value={form.selectors.link}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      selectors: { ...form.selectors, link: e.target.value },
                    })
                  }
                  placeholder="a"
                />
              </div>
            </div>
          )}

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Add Source
          </Button>
        </form>

        {loading ? (
          <div className="flex items-center justify-center text-gray-500 py-10">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading sources
          </div>
        ) : (
          <Table>
            <TableCaption>Configured career page sources</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{source.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        {source.url}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{source.scraperType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        source.isActive
                          ? "text-green-700"
                          : "text-gray-600"
                      }
                      variant="ghost"
                    >
                      {source.isActive ? "Active" : "Disabled"}
                    </Badge>
                    <Badge
                      className={
                        source.lastScrapeStatus === "success"
                          ? "text-green-700"
                          : source.lastScrapeStatus === "error"
                            ? "text-red-700"
                            : "text-gray-600"
                      }
                      variant="ghost"
                    >
                      {source.lastScrapeStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{source.jobsFoundCount || 0}</TableCell>
                  <TableCell>
                    {source.lastScrapedAt
                      ? new Date(source.lastScrapedAt).toLocaleString()
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSourceSync(source._id)}
                      disabled={syncingSourceId === source._id}
                    >
                      {syncingSourceId === source._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Sync"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleSource(source)}
                    >
                      {source.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteSource(source._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default ScrapeSources;
