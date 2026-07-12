import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { adminApi } from "@/api";
import { SCRAPED_JOB_API_END_POINT, CAREER_SOURCE_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";

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
  const [searchParams] = useSearchParams();
  const [sources, setSources] = useState([]);
  const [filterText, setFilterText] = useState(searchParams.get("search") || "");
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncingSourceId, setSyncingSourceId] = useState("");

  const fetchSources = async () => {
    try {
      setLoading(true);
      const res = await adminApi.listSources();
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

  const handleSourceSync = async (sourceId, scraperType) => {
    if (scraperType === "auto-puppeteer" || scraperType === "puppeteer") {
      toast.message("Puppeteer sources sync on GitHub Actions", {
        description: "Render skips browser scrapers. Use the daily CI workflow or priority queue.",
      });
    }
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
  const query = filterText.trim().toLowerCase();
  const visibleSources = query
    ? sources.filter((source) =>
        [source.companyName, source.name, source.url, source.scraperType]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : sources;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Career page sources</h1>
          <p className="text-sm text-muted-foreground">
            {sources.length} companies configured · {activeCount} active · {pendingCount} inactive
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <Link to="/admin" className="text-brand hover:underline">
              Back to dashboard
            </Link>
          </p>
        </div>
        <Button onClick={handleFullSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync all (API on Render)
          </Button>
        </div>

        <div className="mb-6">
          <Label>Filter list</Label>
          <Input
            className="mt-2 max-w-md"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search company or URL..."
          />
        </div>

        <div className="mb-8 rounded-lg border border-brand/20 bg-brand-muted p-6">
          <h2 className="font-semibold text-lg">Bulk import from Excel / CSV</h2>
          <p className="text-sm text-muted-foreground mt-2">
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
          className="bg-card border border-border rounded-lg p-6 mb-8 space-y-4"
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
          <div className="flex items-center justify-center text-muted-foreground py-10">
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
                <TableHead>Scraped</TableHead>
                <TableHead>In DB</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleSources.map((source) => (
                <TableRow key={source._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{source.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
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
                          : "text-muted-foreground"
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
                            : "text-muted-foreground"
                      }
                      variant="ghost"
                    >
                      {source.lastScrapeStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{source.jobsFoundCount || 0}</TableCell>
                  <TableCell>{source.activeJobsInDb || 0}</TableCell>
                  <TableCell>{source.visibleJobsOnSite || 0}</TableCell>
                  <TableCell>
                    {source.lastScrapedAt
                      ? new Date(source.lastScrapedAt).toLocaleString()
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSourceSync(source._id, source.scraperType)}
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
  );
};

export default ScrapeSources;
