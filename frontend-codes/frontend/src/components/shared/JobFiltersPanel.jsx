import React, { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import FilterCard from "@/components/FilterCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { emptyJobFilters } from "@/utils/jobFilters";

const countActiveFilters = (filters) =>
  Object.entries(filters).reduce((count, [key, values]) => {
    if (key === "sortBy") return count + (values && values !== "fresher" ? 1 : 0);
    return count + (values?.length || 0);
  }, 0);

const JobFiltersPanel = ({ selectedFilters, onFilterChange, onClear }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(selectedFilters);

  const activeCount = useMemo(() => countActiveFilters(selectedFilters), [selectedFilters]);

  useEffect(() => {
    if (mobileOpen) setDraftFilters(selectedFilters);
  }, [mobileOpen, selectedFilters]);

  const handleApply = () => {
    onFilterChange(draftFilters);
    setMobileOpen(false);
  };

  const handleClear = () => {
    onClear();
    setDraftFilters(emptyJobFilters);
    setMobileOpen(false);
  };

  return (
    <>
      <div className="lg:hidden">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center gap-2"
          onClick={() => setMobileOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 ? (
            <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">
              {activeCount}
            </span>
          ) : null}
        </Button>

        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Filter jobs</DialogTitle>
            </DialogHeader>
            <FilterCard
              selectedFilters={draftFilters}
              onFilterChange={setDraftFilters}
              onClear={() => setDraftFilters(emptyJobFilters)}
              hideHeaderActions
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClear}>
                Clear all
              </Button>
              <Button type="button" onClick={handleApply}>
                Apply filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="hidden lg:block">
        <FilterCard
          selectedFilters={selectedFilters}
          onFilterChange={onFilterChange}
          onClear={onClear}
        />
      </div>
    </>
  );
};

export default JobFiltersPanel;
