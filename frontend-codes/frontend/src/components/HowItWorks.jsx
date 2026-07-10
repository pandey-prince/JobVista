import React from "react";
import { Bell, Building2, Search } from "lucide-react";

const steps = [
  {
    icon: Building2,
    title: "We monitor career pages",
    description:
      "JobVista watches 100+ company career boards across India and syncs new IT openings automatically.",
  },
  {
    icon: Search,
    title: "You discover fresh roles",
    description:
      "Browse fresher and 0–3 year IT jobs with clear badges showing when a role was posted and where it came from.",
  },
  {
    icon: Bell,
    title: "Get alerted early",
    description:
      "Watch companies you care about and receive email alerts when new jobs appear — often before aggregator sites.",
  },
];

const HowItWorks = () => {
  return (
    <section className="mx-auto my-20 max-w-7xl px-4 sm:px-6">
      <div className="text-center">
        <span className="rounded-full bg-brand-muted px-4 py-2 text-sm font-medium text-brand">
          How JobVista works
        </span>
        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
          Fresh IT jobs, <span className="text-brand">straight from the source</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Not another generic job board. JobVista focuses on IT roles in India pulled directly from
          company career pages and trusted remote feeds.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-muted text-brand">
              <step.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-brand">Step {index + 1}</p>
            <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
