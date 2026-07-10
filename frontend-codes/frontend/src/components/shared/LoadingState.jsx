import React from "react";
import { BriefcaseBusiness, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const JobCardSkeleton = ({ className }) => (
  <div
    className={cn(
      "rounded-xl border border-border bg-card p-5 shadow-sm",
      className,
    )}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
    </div>
    <div className="mt-4 flex items-center gap-3">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-muted" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-32 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-5 w-4/5 animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-3/5 animate-pulse rounded-full bg-muted" />
    </div>
    <div className="mt-4 flex gap-2">
      <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
      <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
    </div>
  </div>
);

export const JobGridSkeleton = ({ count = 6, className }) => (
  <div
    className={cn(
      "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
      className,
    )}
  >
    {Array.from({ length: count }).map((_, index) => (
      <JobCardSkeleton key={index} />
    ))}
  </div>
);

const LoadingState = ({
  message = "Loading...",
  description,
  variant = "page",
  skeletonCount = 6,
  className,
}) => {
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm",
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin text-brand" />
        <span>{message}</span>
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className={cn("w-full space-y-4", className)}>
        <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand-muted/40 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/15">
            <Loader2 className="h-4 w-4 animate-spin text-brand" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{message}</p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        <JobGridSkeleton count={skeletonCount} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center",
        className,
      )}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand/20" />
        <span className="absolute inset-2 animate-pulse rounded-full bg-brand/10" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-brand/30 bg-brand-muted">
          <BriefcaseBusiness className="h-5 w-5 text-brand" />
        </div>
        <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 animate-spin text-brand" />
      </div>
      <div>
        <p className="font-medium text-foreground">{message}</p>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
};

export default LoadingState;
