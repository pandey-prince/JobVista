import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Building2, CheckCircle2, Circle, Loader2, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import useOnboardingProgress from "./useOnboardingProgress";

const STEP_ICONS = {
  profile: User,
  watchlist: Building2,
  alert: Bell,
};

const OnboardingChecklist = ({
  user,
  variant = "card",
  className,
  onDismiss,
}) => {
  const { steps, completedCount, totalSteps, isComplete, nextStep, loading } =
    useOnboardingProgress(user);

  if (!user || user.role !== "student" || isComplete) return null;

  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "border-b border-border bg-card px-4 py-3 sm:px-6",
          className,
        )}
      >
        <div className="mx-auto flex max-w-7xl items-start gap-3 sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              Finish setup ({completedCount}/{totalSteps} complete)
            </p>
            {loading ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Checking your progress…
              </p>
            ) : nextStep ? (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Next:{" "}
                <Link to={nextStep.href} className="font-medium text-brand hover:underline">
                  {nextStep.title}
                </Link>
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {nextStep ? (
              <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
                <Link to={nextStep.href}>Continue</Link>
              </Button>
            ) : null}
            {onDismiss ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={onDismiss}
                aria-label="Dismiss onboarding banner"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Get started with JobVista</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Three quick steps to unlock matches, company alerts, and daily digests.
          </p>
        </div>
        <Badge variant="secondary" className="self-start">
          {completedCount}/{totalSteps} done
        </Badge>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <ul className="mt-5 space-y-3">
        {steps.map((step) => {
          const Icon = STEP_ICONS[step.id] || Circle;
          return (
            <li
              key={step.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4",
                step.complete
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border bg-card",
              )}
            >
              <div className="mt-0.5 shrink-0">
                {step.complete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{step.title}</p>
                  <Badge variant="outline" className="text-xs">
                    {loading && !step.complete ? "…" : step.progressLabel}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
              {!step.complete ? (
                <Button asChild size="sm" variant="outline" className="shrink-0 self-center">
                  <Link to={step.href}>Start</Link>
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default OnboardingChecklist;
