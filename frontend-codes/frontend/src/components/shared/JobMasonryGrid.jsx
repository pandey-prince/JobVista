import React, { useEffect, useMemo, useState } from "react";

const getColumnCount = () => {
  if (typeof window === "undefined") return 1;
  if (window.matchMedia("(min-width: 1024px)").matches) return 3;
  if (window.matchMedia("(min-width: 768px)").matches) return 2;
  return 1;
};

const JobMasonryGrid = ({ children, className = "", maxColumns = 3 }) => {
  const [columnCount, setColumnCount] = useState(getColumnCount);
  const items = React.Children.toArray(children);

  useEffect(() => {
    const updateColumns = () => {
      setColumnCount(Math.min(getColumnCount(), maxColumns));
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, [maxColumns]);

  const columns = useMemo(() => {
    const cols = Array.from({ length: columnCount }, () => []);
    items.forEach((child, index) => {
      cols[index % columnCount].push(child);
    });
    return cols;
  }, [items, columnCount]);

  return (
    <div className={`flex items-start gap-4 ${className}`}>
      {columns.map((column, index) => (
        <div key={index} className="flex min-w-0 flex-1 flex-col gap-4">
          {column}
        </div>
      ))}
    </div>
  );
};

export default JobMasonryGrid;
