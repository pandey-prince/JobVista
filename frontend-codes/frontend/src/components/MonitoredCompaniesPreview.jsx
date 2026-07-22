import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { careerSourceApi } from "@/api";
import { companyJobsPath } from "@/utils/companySlug";

const PREVIEW_COUNT = 24;

const MonitoredCompaniesPreview = () => {
  const [sources, setSources] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const res = await careerSourceApi.listPublic({
          page: 1,
          limit: PREVIEW_COUNT,
          withJobs: true,
        });
        if (cancelled || !res.data.success) return;
        setSources(res.data.sources || []);
        setTotal(res.data.pagination?.total ?? (res.data.sources || []).length);
      } catch (error) {
        console.error("Failed to load company preview", error);
        if (!cancelled) {
          setSources([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && sources.length === 0) return null;

  return (
    <section className="mx-auto my-20 max-w-7xl px-4 sm:px-6">
      <div className="text-center">
        <span className="rounded-full bg-brand-muted px-4 py-2 text-sm font-medium text-brand">
          Companies with openings
        </span>
        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
          {loading ? "Career boards" : `${total} companies`}{" "}
          <span className="text-brand">hiring on JobLeLo</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Open a company to see every live IT role we currently track from its career page.
        </p>
      </div>

      {loading ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">Loading companies…</p>
      ) : (
        <ul className="mx-auto mt-10 grid max-w-5xl list-none grid-cols-2 gap-x-6 gap-y-3 p-0 text-left sm:grid-cols-3 md:grid-cols-4">
          {sources.map((source) => {
            const name = source.companyName || source.name || "Company";
            const path = source.slug ? `/companies/${source.slug}` : companyJobsPath(name);
            return (
              <li key={source._id}>
                <Link
                  to={path}
                  className="group inline-flex max-w-full items-center gap-1 text-sm font-medium text-foreground hover:text-brand"
                  title={name}
                >
                  <span className="truncate">{name}</span>
                  {source.activeJobCount ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      ({source.activeJobCount})
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 flex justify-center">
        <Button asChild className="rounded-full bg-brand hover:bg-brand/90">
          <Link to="/companies">View all companies</Link>
        </Button>
      </div>
    </section>
  );
};

export default MonitoredCompaniesPreview;
