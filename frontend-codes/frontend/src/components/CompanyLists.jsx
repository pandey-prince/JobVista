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
import {
  Bookmark,
  Heart,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Bell,
  BellOff,
} from "lucide-react";
import Job from "./Job";

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
  const [submitForm, setSubmitForm] = useState({
    companyName: "",
    url: "",
    addToWatchlist: true,
  });
  const [wishlistForm, setWishlistForm] = useState({
    companyName: "",
    careerUrl: "",
    notes: "",
  });

  const fetchLists = async (type = activeTab) => {
    const res = await careerSourceApi.listUserLists(type);
    if (res.data.success) setLists(res.data.lists);
  };

  const fetchPublicSources = async () => {
    const res = await careerSourceApi.listPublic();
    if (res.data.success) setPublicSources(res.data.sources);
  };

  const fetchWatchlistJobs = async () => {
    const res = await careerSourceApi.listWatchlistJobs();
    if (res.data.success) setWatchlistJobs(res.data.jobs);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchLists(activeTab),
        fetchPublicSources(),
        fetchWatchlistJobs(),
      ]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load company lists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadAll();
  }, [user, activeTab]);

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
        await loadAll();
        setActiveTab("watchlist");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit career page");
    } finally {
      setSubmitting(false);
    }
  };

  const addWishlistCompany = async (e) => {
    e.preventDefault();
    if (!wishlistForm.companyName) {
      toast.error("Company name is required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await careerSourceApi.addList({
        listType: "wishlist",
        companyName: wishlistForm.companyName,
        careerUrl: wishlistForm.careerUrl,
        notes: wishlistForm.notes,
        createSource: Boolean(wishlistForm.careerUrl),
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setWishlistForm({ companyName: "", careerUrl: "", notes: "" });
        await fetchLists("wishlist");
        setActiveTab("wishlist");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to wishlist");
    } finally {
      setSubmitting(false);
    }
  };

  const addFromCatalog = async (source, listType) => {
    try {
      const res = await careerSourceApi.addList({ listType, jobSourceId: source._id });
      if (res.data.success) {
        toast.success(`Added ${source.companyName} to ${listType}`);
        await fetchLists(listType);
        if (listType === "watchlist") await fetchWatchlistJobs();
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
      await fetchLists("watchlist");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update alerts");
    }
  };

  const removeListItem = async (id) => {
    try {
      await careerSourceApi.removeList(id);
      toast.success("Removed from your list");
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove");
    }
  };

  const filteredSources = publicSources.filter((source) => {
    const q = sourceSearch.toLowerCase();
    return (
      source.companyName?.toLowerCase().includes(q) ||
      source.name?.toLowerCase().includes(q)
    );
  });

  const tabs = [
    { id: "watchlist", label: "Watchlist", icon: Bookmark },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "submit", label: "Submit Career Page", icon: Link2 },
    { id: "browse", label: "Browse Companies", icon: Plus },
  ];

  return (
    <div>
      <div className="max-w-6xl mx-auto my-10 px-2">
        <div className="mb-6">
          <h1 className="font-bold text-2xl">My Companies</h1>
          <p className="text-sm text-gray-500">
            Submit career pages, track companies in your watchlist, and save dream companies to your wishlist.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading
          </div>
        ) : (
          <>
            {activeTab === "watchlist" && (
              <div className="space-y-8">
                <section className="bg-white border rounded-lg p-6">
                  <h2 className="font-semibold text-lg mb-4">Your watchlist</h2>
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
                                {item.careerUrl && (
                                  <a
                                    href={item.careerUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
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
                                className={item.alertEnabled === false ? "" : "bg-[#6A38C2]"}
                                onClick={() => toggleWatchlistAlert(item)}
                              >
                                {item.alertEnabled === false ? (
                                  <BellOff className="h-4 w-4 mr-1" />
                                ) : (
                                  <Bell className="h-4 w-4 mr-1" />
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
                    <p className="text-sm text-gray-500">
                      No companies in your watchlist yet. Browse companies or submit a career page.
                    </p>
                  )}
                </section>

                {watchlistJobs.length > 0 && (
                  <section>
                    <h2 className="font-semibold text-lg mb-4">Latest IT jobs from your watchlist</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {watchlistJobs.slice(0, 8).map((job) => (
                        <Job key={job._id} job={job} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === "wishlist" && (
              <div className="space-y-6">
                <form
                  onSubmit={addWishlistCompany}
                  className="bg-white border rounded-lg p-6 space-y-4"
                >
                  <h2 className="font-semibold text-lg">Add to wishlist</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Company name</Label>
                      <Input
                        value={wishlistForm.companyName}
                        onChange={(e) =>
                          setWishlistForm({ ...wishlistForm, companyName: e.target.value })
                        }
                        placeholder="e.g. Google"
                      />
                    </div>
                    <div>
                      <Label>Career page URL (optional)</Label>
                      <Input
                        value={wishlistForm.careerUrl}
                        onChange={(e) =>
                          setWishlistForm({ ...wishlistForm, careerUrl: e.target.value })
                        }
                        placeholder="https://careers.google.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Notes (optional)</Label>
                    <Input
                      value={wishlistForm.notes}
                      onChange={(e) =>
                        setWishlistForm({ ...wishlistForm, notes: e.target.value })
                      }
                      placeholder="Why you want to join this company"
                    />
                  </div>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Add to wishlist
                  </Button>
                </form>

                <section className="bg-white border rounded-lg p-6">
                  <h2 className="font-semibold text-lg mb-4">Your wishlist</h2>
                  {lists.length ? (
                    <div className="space-y-3">
                      {lists.map((item) => (
                        <div
                          key={item._id}
                          className="flex items-center justify-between border rounded-md p-4"
                        >
                          <div>
                            <p className="font-medium">{item.companyName}</p>
                            {item.notes && (
                              <p className="text-sm text-gray-500">{item.notes}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeListItem(item._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Your wishlist is empty.</p>
                  )}
                </section>
              </div>
            )}

            {activeTab === "submit" && (
              <form
                onSubmit={submitCareerPage}
                className="bg-white border rounded-lg p-6 space-y-4 max-w-2xl"
              >
                <h2 className="font-semibold text-lg">Submit a career page</h2>
                <p className="text-sm text-gray-500">
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
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Submit & scrape
                </Button>
              </form>
            )}

            {activeTab === "browse" && (
              <section className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="font-semibold text-lg">All public companies ({publicSources.length})</h2>
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSources.map((source) => (
                      <TableRow key={source._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{source.companyName}</p>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 hover:underline"
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
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addFromCatalog(source, "watchlist")}
                          >
                            Watchlist
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addFromCatalog(source, "wishlist")}
                          >
                            Wishlist
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyLists;
