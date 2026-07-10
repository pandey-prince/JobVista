import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ page, totalPages, total, onPageChange, className = "" }) => {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div
      className={`flex flex-col items-center justify-between gap-3 sm:flex-row ${className}`}
    >
      <p className="text-sm text-muted-foreground">
        Showing page {page} of {totalPages}
        {typeof total === "number" ? ` · ${total} total` : ""}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
