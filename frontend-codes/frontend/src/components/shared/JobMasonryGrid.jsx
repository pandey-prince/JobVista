import React, { useEffect, useMemo, useState } from "react";

/** @param {"sidebar" | "full"} layout */
const getColumnCount = (layout = "sidebar") => {
  if (typeof window === "undefined") return 1;

  if (layout === "full") {
    // Full-width pages (e.g. /companies) — 3 cols from lg
    if (window.matchMedia("(min-width: 1024px)").matches) return 3;
    if (window.matchMedia("(min-width: 640px)").matches) return 2;
    return 1;
  }

  // Jobs page with filters sidebar — 3 cols only on wide screens
  if (window.matchMedia("(min-width: 1280px)").matches) return 3;
  if (window.matchMedia("(min-width: 768px)").matches) return 2;
  return 1;
};

/**
 * Packs children into columns by always appending to the shortest column
 * (by weight), so the bottom edge stays more even than round-robin.
 */
const JobMasonryGrid = ({
  children,
  className = "",
  maxColumns = 3,
  layout = "sidebar",
  /** Optional: (index) => number — taller cards should return a larger weight */
  getItemWeight,
}) => {
  const [columnCount, setColumnCount] = useState(() =>
    Math.min(getColumnCount(layout), maxColumns),
  );
  const items = React.Children.toArray(children);

  useEffect(() => {
    const updateColumns = () => {
      setColumnCount(Math.min(getColumnCount(layout), maxColumns));
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, [maxColumns, layout]);

  const columns = useMemo(() => {
    const cols = Array.from({ length: columnCount }, () => []);
    const heights = Array.from({ length: columnCount }, () => 0);

    items.forEach((child, index) => {
      let shortest = 0;
      for (let i = 1; i < columnCount; i += 1) {
        if (heights[i] < heights[shortest]) shortest = i;
      }

      const weight =
        typeof getItemWeight === "function"
          ? Math.max(1, Number(getItemWeight(index)) || 1)
          : 1;

      cols[shortest].push(child);
      heights[shortest] += weight;
    });

    return cols;
  }, [items, columnCount, getItemWeight]);

  return (
    <div className={`flex w-full min-w-0 items-start gap-4 ${className}`}>
      {columns.map((column, index) => (
        <div key={index} className="flex min-w-0 flex-1 flex-col gap-4">
          {column}
        </div>
      ))}
    </div>
  );
};

export default JobMasonryGrid;
