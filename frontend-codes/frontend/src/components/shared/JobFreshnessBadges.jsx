import React from "react";
import { Badge } from "../ui/badge";
import { getJobBadges, getSourceBadgeStyle } from "@/utils/jobBadges";

const JobFreshnessBadges = ({ job, size = "sm" }) => {
  const badges = getJobBadges(job);
  const source = getSourceBadgeStyle(badges.sourceType, badges.sourceLabel);
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const brandOutline = `${textSize} border-brand/30 bg-brand-muted font-semibold text-brand`;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {badges.isPostedToday && (
        <Badge variant="outline" className={brandOutline}>
          Posted today
        </Badge>
      )}
      {badges.isNew && !badges.isPostedToday && (
        <Badge variant="outline" className={brandOutline}>
          New
        </Badge>
      )}
      {badges.isCareerPage && (
        <Badge variant="outline" className={brandOutline}>
          Career page
        </Badge>
      )}
      <Badge variant="outline" className={`${textSize} font-medium ${source.className}`}>
        {source.label}
      </Badge>
    </div>
  );
};

export default JobFreshnessBadges;
