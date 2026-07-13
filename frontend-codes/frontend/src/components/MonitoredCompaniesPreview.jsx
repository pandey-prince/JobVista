import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import monitoredCompanies from "@/data/monitoredCompanies.json";
import { ExternalLink } from "lucide-react";

const PREVIEW_COUNT = 24;

const MonitoredCompaniesPreview = () => {
  const preview = useMemo(() => {
    const seen = new Set();
    const unique = [];
    for (const company of monitoredCompanies) {
      const key = String(company.companyName || "").toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      unique.push(company);
      if (unique.length >= PREVIEW_COUNT) break;
    }
    return unique;
  }, []);

  const totalUnique = useMemo(() => {
    const seen = new Set(
      monitoredCompanies.map((c) => String(c.companyName || "").toLowerCase()).filter(Boolean),
    );
    return seen.size;
  }, []);

  return (
    <section className="mx-auto my-20 max-w-7xl px-4 sm:px-6">
      <div className="text-center">
        <span className="rounded-full bg-brand-muted px-4 py-2 text-sm font-medium text-brand">
          Companies we monitor
        </span>
        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
          {totalUnique} career boards,{" "}
          <span className="text-brand">straight from the source</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Each name opens that company&apos;s own careers site. JobLeLo watches these pages for
          fresh IT roles in India.
        </p>
      </div>

      <ul className="mx-auto mt-10 grid max-w-5xl list-none grid-cols-2 gap-x-6 gap-y-3 p-0 text-left sm:grid-cols-3 md:grid-cols-4">
        {preview.map((company) => (
          <li key={`${company.companyName}-${company.url}`}>
            <a
              href={company.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex max-w-full items-center gap-1 text-sm font-medium text-foreground hover:text-brand"
              title={company.url}
            >
              <span className="truncate">{company.companyName}</span>
              <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex justify-center">
        <Button asChild className="rounded-full bg-brand hover:bg-brand/90">
          <Link to="/companies">View all monitored companies</Link>
        </Button>
      </div>
    </section>
  );
};

export default MonitoredCompaniesPreview;
