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
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

const statCards = (summary) => [
  { label: "Companies monitored", value: summary.totalSources ?? "—" },
  { label: "Active sources", value: summary.activeSources ?? "—" },
  { label: "Jobs in database", value: summary.totalActiveJobsInDb ?? "—" },
  { label: "Visible on site", value: summary.totalVisibleJobsOnSite ?? "—" },
  { label: "Companies with visible jobs", value: summary.companiesWithVisibleJobs ?? "—" },
  { label: "Sync errors", value: summary.sourcesWithErrors ?? "—" },
];

const AdminDashboard = () => {
  const [summary, setSummary] = useState({});
  const [sources, setSources] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.dashboard({
        page,
        limit: 50,
        search,
        status: statusFilter || undefined,
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
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const applySearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ops dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Complete list of monitored career sources with scraped vs visible job counts.
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
            >
              {status || "All statuses"}
            </Button>
          ))}
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
                  <TableHead>Scraper</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Sync</TableHead>
                  <TableHead>Scraped</TableHead>
                  <TableHead>In DB</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>Last sync</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source._id}>
                    <TableCell>
                      <div className="min-w-[140px]">
                        <Link
                          to={`/admin/sources?search=${encodeURIComponent(source.companyName)}`}
                          className="font-medium text-brand hover:underline"
                        >
                          {source.companyName}
                        </Link>
                        <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                          {source.url}
                        </p>
                        {source.lastScrapeError ? (
                          <p className="mt-1 text-xs text-red-600 line-clamp-2">
                            {source.lastScrapeError}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{source.scraperType}</Badge>
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
                  </TableRow>
                ))}
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
