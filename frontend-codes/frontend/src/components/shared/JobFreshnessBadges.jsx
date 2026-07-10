import React from "react";
import { Badge } from "../ui/badge";
import { getJobBadges, getSourceBadgeStyle } from "@/utils/jobBadges";

const JobFreshnessBadges = ({ job, size = "sm" }) => {
  const badges = getJobBadges(job);
  const source = getSourceBadgeStyle(badges.sourceType, badges.sourceLabel);
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {badges.isPostedToday && (
        <Badge
          variant="outline"
          className={`${textSize} border-amber-300 bg-amber-50 font-semibold text-amber-800`}
        >
          Posted today
        </Badge>
      )}
      {badges.isNew && !badges.isPostedToday && (
        <Badge
          variant="outline"
          className={`${textSize} border-orange-300 bg-orange-50 font-semibold text-orange-800`}
        >
          New
        </Badge>
      )}
      {badges.isCareerPage && (
        <Badge
          variant="outline"
          className={`${textSize} border-emerald-300 bg-emerald-50 font-semibold text-emerald-800`}
        >
          Career page
        </Badge>
      )}
      <Badge
        variant="outline"
        className={`${textSize} font-medium ${source.className}`}
      >
        {source.label}
      </Badge>
    </div>
  );
};

export default JobFreshnessBadges;
