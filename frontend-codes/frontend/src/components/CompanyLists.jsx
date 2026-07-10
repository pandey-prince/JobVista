import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { careerSourceApi } from "@/api";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Bookmark, Link2, Loader2, Plus, Trash2, Bell, BellOff } from "lucide-react";
import Job from "./Job";
import Pagination from "@/components/shared/Pagination";

const WATCHLIST_PAGE_SIZE = 10;
const BROWSE_PAGE_SIZE = 20;
const WATCHLIST_JOBS_PAGE_SIZE = 8;

const CompanyLists = () => {
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("watchlist");
  const [lists, setLists] = useState([]);
  const [publicSources, setPublicSources] = useState([]);
  const [watchlistJobs, setWatchlistJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sourceSearch, setSourceSearch] = useState("");
  const [watchlistPage, setWatchlistPage] = useState(1);
  const [browsePage, setBrowsePage] = useState(1);
  const [watchlistJobsPage, setWatchlistJobsPage] = useState(1);
  const [listsPagination, setListsPagination] = useState(null);
  const [browsePagination, setBrowsePagination] = useState(null);
  const [watchlistJobsPagination, setWatchlistJobsPagination] = useState(null);
  const [submitForm, setSubmitForm] = useState({
    companyName: "",
    url: "",
    addToWatchlist: true,
  });
  const [manualForm, setManualForm] = useState({
    companyName: "",
    careerUrl: "",
    notes: "",
  });

  const fetchLists = async (page = watchlistPage) => {
    const res = await careerSourceApi.listUserLists("watchlist", {
      page,
      limit: WATCHLIST_PAGE_SIZE,
    });
    if (res.data.success) {
      setLists(res.data.lists);
      setListsPagination(res.data.pagination);
    }
  };

  const fetchPublicSources = async (page = browsePage, search = sourceSearch) => {
    const res = await careerSourceApi.listPublic({
      page,
      limit: BROWSE_PAGE_SIZE,
      search,
    });
    if (res.data.success) {
      setPublicSources(res.data.sources);
      setBrowsePagination(res.data.pagination);
    }
  };

  const fetchWatchlistJobs = async (page = watchlistJobsPage) => {
    const res = await careerSourceApi.listWatchlistJobs({
      page,
      limit: WATCHLIST_JOBS_PAGE_SIZE,
    });
    if (res.data.success) {
      setWatchlistJobs(res.data.jobs);
      setWatchlistJobsPagination(res.data.pagination);
    }
  };

  const loadWatchlistTab = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchLists(watchlistPage),
        fetchWatchlistJobs(watchlistJobsPage),
      ]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  };

  const loadBrowseTab = async () => {
    try {
      setLoading(true);
      await fetchPublicSources(browsePage, sourceSearch);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (activeTab === "submit") setLoading(false);
  }, [user, activeTab, navigate]);

  useEffect(() => {
    if (!user || activeTab !== "watchlist") return;
    loadWatchlistTab();
  }, [user, activeTab, watchlistPage, watchlistJobsPage]);

  useEffect(() => {
    if (!user || activeTab !== "browse") return;
    loadBrowseTab();
  }, [user, activeTab, browsePage, sourceSearch]);

  useEffect(() => {
    setBrowsePage(1);
  }, [sourceSearch]);

  const submitCareerPage = async (e) => {
    e.preventDefault();
    if (!submitForm.url) {
      toast.error("Career page URL is required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await careerSourceApi.submit(submitForm);
      if (res.data.success) {
        toast.success(res.data.message);
        setSubmitForm({ companyName: "", url: "", addToWatchlist: true });
        setWatchlistPage(1);
        setWatchlistJobsPage(1);
        await loadWatchlistTab();
        setActiveTab("watchlist");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit career page");
    } finally {
      setSubmitting(false);
    }
  };

  const addManualCompany = async (e) => {
    e.preventDefault();
    if (!manualForm.companyName) {
      toast.error("Company name is required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await careerSourceApi.addList({
        listType: "watchlist",
        companyName: manualForm.companyName,
        careerUrl: manualForm.careerUrl,
        notes: manualForm.notes,
        createSource: Boolean(manualForm.careerUrl),
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setManualForm({ companyName: "", careerUrl: "", notes: "" });
        setWatchlistPage(1);
        await fetchLists(1);
        setActiveTab("watchlist");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add company");
    } finally {
      setSubmitting(false);
    }
  };

  const addFromCatalog = async (source) => {
    try {
      const res = await careerSourceApi.addList({ listType: "watchlist", jobSourceId: source._id });
      if (res.data.success) {
        toast.success(`Added ${source.companyName} to watchlist`);
        await fetchLists(watchlistPage);
        await fetchWatchlistJobs(watchlistJobsPage);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add company");
    }
  };

  const toggleWatchlistAlert = async (item) => {
    const isOn = item.alertEnabled !== false;
    try {
      await careerSourceApi.updateList(item._id, { alertEnabled: !isOn });
      toast.success(!isOn ? "Instant alerts enabled" : "Alerts paused");
      await fetchLists();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update alerts");
    }
  };

  const removeListItem = async (id) => {
    try {
      await careerSourceApi.removeList(id);
      toast.success("Removed from watchlist");
      await fetchLists(watchlistPage);
      await fetchWatchlistJobs(watchlistJobsPage);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove");
    }
  };

  const tabs = [
    { id: "watchlist", label: "Watchlist", icon: Bookmark },
    { id: "submit", label: "Submit Career Page", icon: Link2 },
    { id: "browse", label: "Browse Companies", icon: Plus },
  ];

  return (
    <div>
      <div className="mx-auto my-10 max-w-6xl px-2">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Companies</h1>
          <p className="text-sm text-muted-foreground">
            Track companies you care about. Get instant alerts when they post new IT jobs and see their latest openings here.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading
          </div>
        ) : (
          <>
            {activeTab === "watchlist" && (
              <div className="space-y-8">
                <form
                  onSubmit={addManualCompany}
                  className="space-y-4 rounded-lg border border-border bg-card p-6"
                >
                  <h2 className="text-lg font-semibold">Add a company</h2>
                  <p className="text-sm text-muted-foreground">
                    Save any company with optional notes. Add a career page URL to start scraping and alerts.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Company name</Label>
                      <Input
                        value={manualForm.companyName}
                        onChange={(e) =>
                          setManualForm({ ...manualForm, companyName: e.target.value })
                        }
                        placeholder="e.g. Razorpay"
                      />
                    </div>
                    <div>
                      <Label>Career page URL (optional)</Label>
                      <Input
                        value={manualForm.careerUrl}
                        onChange={(e) =>
                          setManualForm({ ...manualForm, careerUrl: e.target.value })
                        }
                        placeholder="https://careers.company.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Notes (optional)</Label>
                    <Input
                      value={manualForm.notes}
                      onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                      placeholder="Why you're tracking this company"
                    />
                  </div>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add to watchlist
                  </Button>
                </form>

                <section className="rounded-lg border border-border bg-card p-6">
                  <h2 className="mb-4 text-lg font-semibold">Your watchlist</h2>
                  {lists.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>IT Jobs</TableHead>
                          <TableHead>Alerts</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lists.map((item) => (
                          <TableRow key={item._id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.companyName}</p>
                                {item.notes && (
                                  <p className="text-xs text-muted-foreground">{item.notes}</p>
                                )}
                                {item.careerUrl && (
                                  <a
                                    href={item.careerUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-brand hover:underline"
                                  >
                                    Career page
                                  </a>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {item.jobSource?.isActive ? "Scraping active" : "Saved"}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.activeJobCount || 0}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant={item.alertEnabled === false ? "outline" : "default"}
                                className={item.alertEnabled === false ? "" : "bg-brand"}
                                onClick={() => toggleWatchlistAlert(item)}
                              >
                                {item.alertEnabled === false ? (
                                  <BellOff className="mr-1 h-4 w-4" />
                                ) : (
                                  <Bell className="mr-1 h-4 w-4" />
                                )}
                                {item.alertEnabled === false ? "Off" : "On"}
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeListItem(item._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No companies yet. Browse the catalog or submit a career page to get started.
                    </p>
                  )}
                  <Pagination
                    className="mt-6"
                    page={listsPagination?.page || watchlistPage}
                    totalPages={listsPagination?.totalPages || 1}
                    total={listsPagination?.total}
                    onPageChange={setWatchlistPage}
                  />
                </section>

                {watchlistJobs.length > 0 && (
                  <section>
                    <h2 className="mb-4 text-lg font-semibold">Latest IT jobs from your watchlist</h2>
                    <div className="grid items-start gap-4 md:grid-cols-2">
                      {watchlistJobs.map((job) => (
                        <Job key={job._id} job={job} />
                      ))}
                    </div>
                    <Pagination
                      className="mt-6"
                      page={watchlistJobsPagination?.page || watchlistJobsPage}
                      totalPages={watchlistJobsPagination?.totalPages || 1}
                      total={watchlistJobsPagination?.total}
                      onPageChange={setWatchlistJobsPage}
                    />
                  </section>
                )}
              </div>
            )}

            {activeTab === "submit" && (
              <form
                onSubmit={submitCareerPage}
                className="max-w-2xl space-y-4 rounded-lg border border-border bg-card p-6"
              >
                <h2 className="text-lg font-semibold">Submit a career page</h2>
                <p className="text-sm text-muted-foreground">
                  Add any company career portal. If it supports Greenhouse, Lever, or Ashby, IT jobs will be scraped for everyone on JobVista.
                </p>
                <div>
                  <Label>Career page URL</Label>
                  <Input
                    value={submitForm.url}
                    onChange={(e) => setSubmitForm({ ...submitForm, url: e.target.value })}
                    placeholder="https://boards.greenhouse.io/company"
                    required
                  />
                </div>
                <div>
                  <Label>Company name (optional)</Label>
                  <Input
                    value={submitForm.companyName}
                    onChange={(e) =>
                      setSubmitForm({ ...submitForm, companyName: e.target.value })
                    }
                    placeholder="Company name"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={submitForm.addToWatchlist}
                    onChange={(e) =>
                      setSubmitForm({ ...submitForm, addToWatchlist: e.target.checked })
                    }
                  />
                  Also add to my watchlist
                </label>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit & scrape
                </Button>
              </form>
            )}

            {activeTab === "browse" && (
              <section className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold">
                    All public companies ({browsePagination?.total ?? publicSources.length})
                  </h2>
                  <Input
                    className="max-w-xs"
                    placeholder="Search companies"
                    value={sourceSearch}
                    onChange={(e) => setSourceSearch(e.target.value)}
                  />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {publicSources.map((source) => (
                      <TableRow key={source._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{source.companyName}</p>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-brand hover:underline"
                            >
                              View careers
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{source.sourceOrigin || "seed"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="ghost">
                            {source.isActive ? source.scraperType : "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addFromCatalog(source)}
                          >
                            Add to watchlist
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination
                  className="mt-6"
                  page={browsePagination?.page || browsePage}
                  totalPages={browsePagination?.totalPages || 1}
                  total={browsePagination?.total}
                  onPageChange={setBrowsePage}
                />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyLists;
