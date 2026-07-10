import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const IDLE_CLOSE_MS = 1000;

const ExpandableJobSearch = ({
  className,
  defaultQuery = "",
  onSearch,
  placeholder,
  onOpenChange,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(defaultQuery);
  const inputRef = useRef(null);
  const closeTimerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, IDLE_CLOSE_MS);
  };

  useEffect(() => () => clearCloseTimer(), []);

  const openSearch = () => {
    clearCloseTimer();
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    onSearch?.(trimmed);
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, IDLE_CLOSE_MS);
  };

  const handleBlur = (event) => {
    if (containerRef.current?.contains(event.relatedTarget)) return;
    scheduleClose();
  };

  const handleChange = (event) => {
    setQuery(event.target.value);
    if (!event.target.value.trim()) {
      scheduleClose();
    } else {
      clearCloseTimer();
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-end transition-[width] duration-200",
        open ? "w-full max-w-md" : "w-11",
        className,
      )}
    >
      <AnimatePresence mode="wait">
        {open ? (
          <motion.form
            key="search-form"
            ref={containerRef}
            initial={{ opacity: 0, width: 48 }}
            animate={{ opacity: 1, width: "100%" }}
            exit={{ opacity: 0, width: 48 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onSubmit={handleSubmit}
            onBlur={handleBlur}
            className="flex h-11 w-full max-w-md overflow-hidden rounded-full border border-border bg-card shadow-lg sm:h-12"
          >
            <input
              ref={inputRef}
              type="search"
              name="job-search"
              placeholder={placeholder || "Search SDE, React, Python, Data..."}
              value={query}
              onChange={handleChange}
              onFocus={clearCloseTimer}
              className="min-w-0 flex-1 border-0 bg-transparent px-4 text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Search jobs"
            />
            <button
              type="submit"
              aria-label="Search jobs"
              className="inline-flex h-full shrink-0 items-center justify-center bg-brand px-4 text-brand-foreground transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <Search className="h-5 w-5" />
            </button>
          </motion.form>
        ) : (
          <motion.button
            key="search-icon"
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onClick={openSearch}
            aria-label="Open job search"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-brand/40 hover:bg-brand-muted hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpandableJobSearch;
