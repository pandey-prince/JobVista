import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import Pagination from "@/components/shared/Pagination";
import monitoredCompanies from "@/data/monitoredCompanies.json";
import { ExternalLink, Search } from "lucide-react";

const PAGE_SIZE = 50;

const MonitoredCompaniesPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return monitoredCompanies;
    return monitoredCompanies.filter((company) => {
      const name = String(company.companyName || "").toLowerCase();
      const regions = (company.regions || []).join(" ").toLowerCase();
      return name.includes(q) || regions.includes(q);
    });
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const onSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="max-w-3xl">
        <span className="rounded-full bg-brand-muted px-4 py-2 text-sm font-medium text-brand">
          Career boards we monitor
        </span>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          Companies on <span className="text-brand">JobLeLo</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Search {monitoredCompanies.length} career sites we watch for IT openings in India.
          Open a name to visit that company&apos;s own careers page.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search company or region..."
            className="pl-9"
            aria-label="Search monitored companies"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Showing {pageRows.length} of {filtered.length}
          {search.trim() ? " match" : " companies"}
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Regions</TableHead>
              <TableHead className="w-[120px]">Careers site</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((company) => (
              <TableRow key={`${company.companyName}-${company.url}`}>
                <TableCell>
                  <a
                    href={company.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand hover:underline"
                  >
                    {company.companyName}
                  </a>
                </TableCell>
                <TableCell>
                  {(company.regions || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {company.regions.map((region) => (
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
                  <a
                    href={company.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
                  >
                    Open
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No companies match &ldquo;{search.trim()}&rdquo;.
        </p>
      ) : null}

      <div className="mt-6">
        <Pagination
          page={safePage}
          totalPages={totalPages}
          total={filtered.length}
          onPageChange={setPage}
        />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to="/jobs">Browse open roles</Link>
        </Button>
        <Button asChild className="bg-brand hover:bg-brand/90">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
};

export default MonitoredCompaniesPage;
