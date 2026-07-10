import React from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  BriefcaseBusiness,
  Building2,
  Linkedin,
  Mail,
  MapPin,
  Twitter,
} from "lucide-react";
import { Button } from "../ui/button";

const footerLinks = {
  platform: [
    { label: "Browse jobs", to: "/jobs" },
    { label: "Explore categories", to: "/browse" },
    { label: "Latest openings", to: "/jobs" },
  ],
  candidates: [
    { label: "Create account", to: "/signup" },
    { label: "Saved jobs", to: "/saved-jobs" },
    { label: "Job alerts", to: "/alerts" },
    { label: "Your profile", to: "/profile" },
  ],
  employers: [
    { label: "Recruiter signup", to: "/signup" },
    { label: "Post a job", to: "/admin/jobs/create" },
    { label: "Manage companies", to: "/admin/companies" },
    { label: "Applicant pipeline", to: "/admin/jobs" },
  ],
};

const FooterLinkColumn = ({ title, links }) => (
  <div>
    <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
      {title}
    </h3>
    <ul className="mt-4 space-y-2.5">
      {links.map((link) => (
        <li key={link.to + link.label}>
          <Link
            to={link.to}
            className="text-sm text-muted-foreground transition-colors hover:text-brand"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="border-b border-border bg-brand-muted/50">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
              Start your search
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Find your next IT role in India
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Curated listings, smart alerts, and JobMate AI to help you apply with confidence.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button asChild variant="brand" className="rounded-full">
              <Link to="/jobs">Browse jobs</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/signup">Create free account</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link to="/" className="inline-block">
              <h2 className="text-2xl font-bold">
                Job<span className="text-accent-orange">Vista</span>
              </h2>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              India&apos;s modern job portal for tech talent and hiring teams. Discover roles,
              track applications, and get AI-powered career guidance with JobMate.
            </p>

            <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>Built for India&apos;s IT hiring ecosystem</span>
              </li>
              <li className="flex items-start gap-2">
                <Bot className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>JobMate AI for resume and interview prep</span>
              </li>
            </ul>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="mailto:support@jobvista.demo"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
                aria-label="Email support"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
                aria-label="JobVista on LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
                aria-label="JobVista on X"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          <FooterLinkColumn title="Platform" links={footerLinks.platform} />
          <FooterLinkColumn title="For job seekers" links={footerLinks.candidates} />
          <FooterLinkColumn title="For employers" links={footerLinks.employers} />
        </div>

        <div className="mt-10 grid gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Fresh IT listings</p>
              <p className="text-xs text-muted-foreground">Updated daily from trusted sources</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-orange/10 text-accent-orange">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Recruiter tools</p>
              <p className="text-xs text-muted-foreground">Post jobs and manage applicants in one place</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-muted/20">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center text-sm text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
          <p>&copy; {year} JobVista. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <a href="mailto:support@jobvista.demo" className="transition-colors hover:text-brand">
              support@jobvista.demo
            </a>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
