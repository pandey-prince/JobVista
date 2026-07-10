import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const JobSearchBar = ({ className, defaultQuery = "", onSearch, placeholder }) => {
  const [query, setQuery] = useState(defaultQuery);

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch?.(query.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex h-12 w-full overflow-hidden rounded-full border border-border bg-card shadow-lg sm:h-14",
        className,
      )}
    >
      <input
        type="search"
        name="job-search"
        placeholder={placeholder || "Search SDE, React, Python, Data..."}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="min-w-0 flex-1 border-0 bg-transparent px-4 text-foreground outline-none placeholder:text-muted-foreground sm:px-5"
        aria-label="Search jobs"
      />
      <button
        type="submit"
        aria-label="Search jobs"
        className="inline-flex h-full shrink-0 items-center justify-center bg-brand px-4 text-brand-foreground transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-6"
      >
        <Search className="h-5 w-5" />
      </button>
    </form>
  );
};

export default JobSearchBar;
