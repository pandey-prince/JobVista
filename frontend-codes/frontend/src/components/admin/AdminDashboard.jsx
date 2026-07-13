import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "@/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import LoadingState from "@/components/shared/LoadingState";
import Pagination from "@/components/shared/Pagination";
import { companyJobsPath } from "@/utils/companySlug";
import { Download, ExternalLink, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE_OPTIONS = [50, 100, 200, 500];

const statCards = (summary) => [
  { label: "Companies monitored", value: summary.totalSources ?? "—" },
  { label: "Active sources", value: summary.activeSources ?? "—" },
  { label: "Needs attention", value: summary.sourcesNeedingAttention ?? "—" },
  { label: "Jobs in database", value: summary.totalActiveJobsInDb ?? "—" },
  { label: "Visible on site", value: summary.totalVisibleJobsOnSite ?? "—" },
  { label: "Sync errors", value: summary.sourcesWithErrors ?? "—" },
];

const reasonClassName = (health) => {
  if (health === "error" || health === "blocked") return "text-red-600";
  if (health === "waiting") return "text-amber-700";
  return "text-muted-foreground";
};

const csvEscape = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const buildCsv = (sources = []) => {
  const headers = [
    "companyName",
    "name",
    "url",
    "scraperType",
    "runHost",
    "sourceOrigin",
    "regions",
    "isActive",
    "isPublic",
    "lastScrapeStatus",
    "syncHealth",
    "syncReason",
    "lastScrapedAt",
    "jobsFoundCount",
    "activeJobsInDb",
    "visibleJobsOnSite",
    "lastScrapeError",
    "sitePath",
  ];

  const lines = [headers.join(",")];
  for (const source of sources) {
    const row = [
      source.companyName,
      source.name,
      source.url,
      source.scraperType,
      source.runHostLabel || source.runHost,
      source.sourceOrigin,
      (source.regions || []).join("; "),
      source.isActive ? "yes" : "no",
      source.isPublic ? "yes" : "no",
      source.lastScrapeStatus,
      source.syncHealth || "",
      source.syncReason || "",
      source.lastScrapedAt ? new Date(source.lastScrapedAt).toISOString() : "",
      source.jobsFoundCount ?? 0,
      source.activeJobsInDb ?? 0,
      source.visibleJobsOnSite ?? 0,
      source.lastScrapeError || "",
      companyJobsPath(source.companyName),
    ].map(csvEscape);
    lines.push(row.join(","));
  }
  return lines.join("\n");
};

const downloadCsv = (sources) => {
  const blob = new Blob([buildCsv(sources)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `joblelo-sources-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const AdminDashboard = () => {
  const [summary, setSummary] = useState({});
  const [sources, setSources] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [needsAttention, setNeedsAttention] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.dashboard({
        page,
        limit,
        search,
        status: statusFilter || undefined,
        needsAttention: needsAttention ? "true" : undefined,
        sortBy: "companyName",
      });
      if (res.data.success) {
        setSummary(res.data.summary || {});
        setSources(res.data.sources || []);
        setPagination(res.data.pagination || null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, needsAttention]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, needsAttention, limit]);

  const applySearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const setStatusChip = (status) => {
    setNeedsAttention(false);
    setStatusFilter(status);
  };

  const toggleNeedsAttention = () => {
    setStatusFilter("");
    setNeedsAttention((prev) => !prev);
  };

  const exportCurrentFilters = async () => {
    try {
      setExporting(true);
      const res = await adminApi.dashboard({
        page: 1,
        limit: 500,
        search,
        status: statusFilter || undefined,
        needsAttention: needsAttention ? "true" : undefined,
        sortBy: "companyName",
      });
      if (!res.data.success) {
        throw new Error(res.data.message || "Export failed");
      }
      const rows = res.data.sources || [];
      downloadCsv(rows);
      toast.success(`Exported ${rows.length} companies`);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ops dashboard</h1>
        <p className="text-sm text-muted-foreground">
          All monitored companies with job counts, last sync time, and why a source is not
          scraping when applicable.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {statCards(summary).map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={applySearch} className="flex max-w-md flex-1 gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search company, URL, scraper type..."
          />
          <Button type="submit" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {["", "success", "error", "never", "pending"].map((status) => (
            <Button
              key={status || "all"}
              size="sm"
              variant={!needsAttention && statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusChip(status)}
            >
              {status || "All statuses"}
            </Button>
          ))}
          <Button
            size="sm"
            variant={needsAttention ? "default" : "outline"}
            onClick={toggleNeedsAttention}
          >
            Needs attention
            {typeof summary.sourcesNeedingAttention === "number"
              ? ` (${summary.sourcesNeedingAttention})`
              : ""}
          </Button>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exporting}
            onClick={exportCurrentFilters}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/sources">Manage sources</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingState variant="page" message="Loading dashboard" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Career site</TableHead>
                  <TableHead>Regions</TableHead>
                  <TableHead>Scraper</TableHead>
                  <TableHead>Runs on</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Sync</TableHead>
                  <TableHead>Scraped</TableHead>
                  <TableHead>In DB</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>Last sync</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Site</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => {
                  const sitePath = companyJobsPath(source.companyName);
                  return (
                    <TableRow key={source._id}>
                      <TableCell>
                        <div className="min-w-[140px]">
                          <Link
                            to={`/admin/sources?search=${encodeURIComponent(source.companyName)}`}
                            className="font-medium text-brand hover:underline"
                          >
                            {source.companyName}
                          </Link>
                          <p className="mt-1 text-xs text-muted-foreground">{source.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {source.url ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex max-w-[220px] items-center gap-1 text-sm text-brand hover:underline"
                            title={source.url}
                          >
                            <span className="truncate">{source.url.replace(/^https?:\/\//, "")}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(source.regions || []).length > 0 ? (
                          <div className="flex max-w-[160px] flex-wrap gap-1">
                            {source.regions.map((region) => (
                              <Badge key={region} variant="outline">
                                {region}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{source.scraperType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            source.runHost === "github-puppeteer"
                              ? "border-amber-500 text-amber-700"
                              : source.runHost === "none"
                                ? "border-muted-foreground text-muted-foreground"
                                : "border-green-500 text-green-700"
                          }
                        >
                          {source.runHostLabel || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={source.isActive ? "default" : "secondary"}>
                          {source.isActive ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            source.lastScrapeStatus === "success"
                              ? "border-green-500 text-green-700"
                              : source.lastScrapeStatus === "error"
                                ? "border-red-500 text-red-700"
                                : ""
                          }
                        >
                          {source.lastScrapeStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{source.jobsFoundCount || 0}</TableCell>
                      <TableCell>{source.activeJobsInDb || 0}</TableCell>
                      <TableCell>{source.visibleJobsOnSite || 0}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {source.lastScrapedAt
                          ? new Date(source.lastScrapedAt).toLocaleString()
                          : "Never"}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        {source.syncReason ? (
                          <p
                            className={`text-xs leading-snug ${reasonClassName(source.syncHealth)}`}
                            title={source.syncReason}
                          >
                            {source.syncReason}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          to={sitePath}
                          className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
                          title="Open public company page"
                        >
                          View
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {sources.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No sources match.</p>
          ) : null}

          <Pagination
            page={pagination?.page || page}
            totalPages={pagination?.totalPages || 1}
            total={pagination?.total}
            onPageChange={setPage}
          />
        </>
      )}

      {loading ? null : (
        <p className="text-xs text-muted-foreground">
          Last platform sync:{" "}
          {summary.lastSyncAt
            ? new Date(summary.lastSyncAt).toLocaleString()
            : "Not available"}
        </p>
      )}
    </div>
  );
};

export default AdminDashboard;
