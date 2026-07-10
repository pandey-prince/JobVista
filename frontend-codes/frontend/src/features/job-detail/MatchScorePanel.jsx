import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

const MatchScorePanel = ({ matchScore, matchLoading, onLoad, showForStudent }) => {
  if (!showForStudent) return null;

  return (
    <div className="rounded-lg border border-brand/20 bg-brand-muted p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand" />
        <h2 className="font-bold text-lg">Your match</h2>
      </div>
      {matchLoading ? (
        <div className="mt-4 flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Calculating fit...
        </div>
      ) : matchScore ? (
        <div className="mt-4">
          <p className="text-3xl font-bold text-brand">{matchScore.score}%</p>
          {matchScore.strengths?.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium">Strengths</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                {matchScore.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {matchScore.gaps?.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium">Gaps</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                {matchScore.gaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {matchScore.tip && <p className="mt-3 text-sm text-muted-foreground">{matchScore.tip}</p>}
        </div>
      ) : (
        <Button variant="outline" className="mt-4" onClick={onLoad}>
          Get match score
        </Button>
      )}
    </div>
  );
};

export default MatchScorePanel;
