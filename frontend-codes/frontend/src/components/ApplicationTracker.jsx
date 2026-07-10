import React from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import useTrackedApplications from "@/features/application-tracker/useTrackedApplications";

const STAGE_COLORS = {
  applied: "bg-slate-100 text-slate-800",
  shortlisted: "bg-blue-100 text-blue-800",
  interview: "bg-violet-100 text-violet-800",
  offer: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const ApplicationTracker = () => {
  const { applications, loading, updatingId, stages, moveStage } = useTrackedApplications();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading application tracker...
      </div>
    );
  }

  if (!applications.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
        <h3 className="text-lg font-semibold">No tracked applications yet</h3>
        <p className="mt-2 text-sm text-gray-500">
          Apply to jobs or mark external applications as applied to track them here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="grid min-w-[900px] grid-cols-5 gap-4">
        {stages.map((stage) => {
          const items = applications.filter((app) => app.stage === stage.id);
          return (
            <div key={stage.id} className="rounded-xl border bg-gray-50 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">{stage.label}</h3>
                <Badge variant="outline">{items.length}</Badge>
              </div>
              <div className="space-y-3">
                {items.map((application) => (
                  <div key={application._id} className="rounded-lg border bg-white p-3 shadow-sm">
                    <p className="font-medium leading-snug">{application.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{application.companyName}</p>
                    {application.location && (
                      <p className="mt-1 text-xs text-gray-400">{application.location}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {stages
                        .filter((s) => s.id !== application.stage)
                        .map((nextStage) => (
                          <Button
                            key={nextStage.id}
                            size="sm"
                            variant="outline"
                            className={`h-7 px-2 text-xs ${STAGE_COLORS[nextStage.id] || ""}`}
                            disabled={updatingId === application._id}
                            onClick={() => moveStage(application, nextStage.id)}
                          >
                            {nextStage.label}
                          </Button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApplicationTracker;
