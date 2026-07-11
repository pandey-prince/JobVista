import { useEffect, useMemo, useState } from "react";
import { alertsApi, careerSourceApi } from "@/api";

export const ONBOARDING_WATCHLIST_TARGET = 3;
export const ONBOARDING_ALERTS_TARGET = 1;

export const isProfileOnboardingComplete = (user) => {
  const profile = user?.profile;
  if (!profile) return false;
  if (profile.profileCompletionSkipped) return false;
  return Boolean(profile.profileCompletedAt);
};

const useOnboardingProgress = (user) => {
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!user) {
      setWatchlistCount(0);
      setAlertsCount(0);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchProgress = async () => {
      setLoading(true);
      try {
        const [listsRes, alertsRes] = await Promise.all([
          careerSourceApi.listUserLists("watchlist", { page: 1, limit: 1 }),
          alertsApi.list(),
        ]);

        if (cancelled) return;

        if (listsRes.data.success) {
          setWatchlistCount(listsRes.data.pagination?.total ?? 0);
        }
        if (alertsRes.data.success) {
          setAlertsCount((alertsRes.data.alerts || []).length);
        }
      } catch {
        if (!cancelled) {
          setWatchlistCount(0);
          setAlertsCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProgress();

    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  const profileComplete = isProfileOnboardingComplete(user);
  const watchlistComplete = watchlistCount >= ONBOARDING_WATCHLIST_TARGET;
  const alertsComplete = alertsCount >= ONBOARDING_ALERTS_TARGET;

  const steps = useMemo(
    () => [
      {
        id: "profile",
        title: "Complete your profile",
        description: "Add skills and education for better matches",
        complete: profileComplete,
        href: "/profile/setup",
        progressLabel: profileComplete ? "Done" : "Incomplete",
      },
      {
        id: "watchlist",
        title: "Watch 3 companies",
        description: "Get instant alerts when they post new jobs",
        complete: watchlistComplete,
        href: "/my-companies",
        progressLabel: `${Math.min(watchlistCount, ONBOARDING_WATCHLIST_TARGET)}/${ONBOARDING_WATCHLIST_TARGET}`,
      },
      {
        id: "alert",
        title: "Create 1 job alert",
        description: "Daily digest when new roles match your keywords",
        complete: alertsComplete,
        href: "/alerts",
        progressLabel: alertsComplete ? "Done" : `${alertsCount}/${ONBOARDING_ALERTS_TARGET}`,
      },
    ],
    [profileComplete, watchlistComplete, alertsComplete, watchlistCount, alertsCount],
  );

  const completedCount = steps.filter((step) => step.complete).length;
  const isComplete = completedCount === steps.length;
  const nextStep = steps.find((step) => !step.complete) ?? null;

  return {
    steps,
    completedCount,
    totalSteps: steps.length,
    isComplete,
    nextStep,
    loading,
    watchlistCount,
    alertsCount,
  };
};

export default useOnboardingProgress;
