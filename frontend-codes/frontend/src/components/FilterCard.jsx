import React, { useEffect, useState } from "react";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { careerSourceApi } from "@/api";

const filterData = [
  {
    key: "locations",
    filterType: "City / Location",
    array: [
      "Bangalore",
      "Hyderabad",
      "Pune",
      "Mumbai",
      "Delhi NCR",
      "Chennai",
      "Kolkata",
      "Ahmedabad",
      "Remote",
    ],
  },
  {
    key: "workModes",
    filterType: "Work Mode",
    array: ["Remote", "Hybrid", "On-site"],
  },
  {
    key: "experienceLevels",
    filterType: "Experience",
    array: ["Fresher", "0-1 year", "1-3 years", "3-5 years", "5+ years", "Internship"],
  },
  {
    key: "roles",
    filterType: "Role / Skill",
    array: [
      "Software Engineer",
      "Frontend / React",
      "Backend / Node",
      "Full Stack",
      "DevOps / Cloud",
      "Data / ML / AI",
      "QA / Testing",
      "Java",
      "Python",
    ],
  },
  {
    key: "jobTypes",
    filterType: "Job Type",
    array: ["Full-time", "Internship", "Contract", "Part-time"],
  },
  {
    key: "postedWithin",
    filterType: "Posted",
    array: ["Last 24 hours", "Last 7 days", "Last 30 days"],
  },
];

const countActiveFilters = (filters) =>
  Object.entries(filters).reduce((count, [key, values]) => {
    if (key === "sortBy") return count + (values && values !== "newest" ? 1 : 0);
    return count + (values?.length || 0);
  }, 0);

const FilterCard = ({ selectedFilters, onFilterChange, onClear, hideHeaderActions = false }) => {
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchCompanies = async () => {
      try {
        setCompaniesLoading(true);
        const res = await careerSourceApi.listPublic({ limit: 100 });
        if (cancelled || !res.data.success) return;

        const names = (res.data.sources || [])
          .map((source) => source.companyName)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

        setCompanies([...new Set(names)]);
      } catch {
        if (!cancelled) setCompanies([]);
      } finally {
        if (!cancelled) setCompaniesLoading(false);
      }
    };

    fetchCompanies();
    return () => {
      cancelled = true;
    };
  }, []);

  const changeHandler = (groupKey, value) => {
    const currentValues = selectedFilters[groupKey] || [];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    onFilterChange({ ...selectedFilters, [groupKey]: nextValues });
  };

  const handleSortChange = (value) => {
    onFilterChange({ ...selectedFilters, sortBy: value });
  };

  const activeCount = countActiveFilters(selectedFilters);

  return (
    <div className="w-full rounded-md border border-border bg-card p-3 shadow-sm">
      {!hideHeaderActions ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold">Filter Jobs</h1>
              {activeCount > 0 ? (
                <p className="text-xs text-muted-foreground">{activeCount} active</p>
              ) : null}
            </div>
            <Button type="button" variant="link" className="px-0 text-sm" onClick={onClear}>
              Clear all
            </Button>
          </div>
          <hr className="mt-3" />
        </>
      ) : null}

      <div className="mt-4">
        <h2 className="text-base font-bold">Sort by</h2>
        <Select value={selectedFilters.sortBy || "newest"} onValueChange={handleSortChange}>
          <SelectTrigger className="mt-2" aria-label="Sort jobs">
            <SelectValue placeholder="Sort jobs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="company">Company A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        <h2 className="text-base font-bold">Company</h2>
        {companiesLoading ? (
          <p className="my-2 text-sm text-muted-foreground">Loading companies…</p>
        ) : companies.length === 0 ? (
          <p className="my-2 text-sm text-muted-foreground">No companies available</p>
        ) : (
          <div className="mt-2 max-h-48 overflow-y-auto pr-1">
            {companies.map((company, idx) => {
              const itemId = `filter-companies-${idx}`;
              return (
                <div key={company} className="my-2 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFilters.companies?.includes(company) || false}
                    id={itemId}
                    onChange={() => changeHandler("companies", company)}
                    className="h-4 w-4 cursor-pointer accent-brand"
                  />
                  <Label htmlFor={itemId} className="cursor-pointer text-sm">
                    {company}
                  </Label>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {filterData.map((data) => (
        <div key={data.key} className="mt-4">
          <h2 className="text-base font-bold">{data.filterType}</h2>
          {data.array.map((item, idx) => {
            const itemId = `filter-${data.key}-${idx}`;
            return (
              <div key={item} className="my-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedFilters[data.key]?.includes(item) || false}
                  id={itemId}
                  onChange={() => changeHandler(data.key, item)}
                  className="h-4 w-4 cursor-pointer accent-brand"
                />
                <Label htmlFor={itemId} className="cursor-pointer text-sm">
                  {item}
                </Label>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default FilterCard;
