import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Bot, Linkedin, Mail, MapPin, Twitter } from "lucide-react";
import { Button } from "../ui/button";

const footerLinks = {
  platform: [
    { label: "Browse jobs", to: "/jobs" },
    { label: "Explore categories", to: "/jobs" },
    { label: "Latest openings", to: "/jobs" },
  ],
  candidatesGuest: [
    { label: "Create account", to: "/signup" },
    { label: "Saved jobs", to: "/saved-jobs" },
    { label: "Job alerts", to: "/alerts" },
    { label: "Your profile", to: "/profile" },
  ],
  candidatesStudent: [
    { label: "Saved jobs", to: "/saved-jobs" },
    { label: "Job alerts", to: "/alerts" },
    { label: "Your profile", to: "/profile" },
    { label: "My companies", to: "/my-companies" },
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
  const { user, loading: authLoading } = useSelector((store) => store.auth);

  const candidateLinks = useMemo(() => {
    if (!user) return footerLinks.candidatesGuest;
    return footerLinks.candidatesStudent;
  }, [user]);

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
            {authLoading ? null : !user ? (
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/signup">Create free account</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/saved-jobs">View saved jobs</Link>
                </Button>
                <Button asChild variant="brand" className="rounded-full">
                  <Link to="/alerts">Set job alerts</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-0 pt-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Link to="/" className="inline-block">
              <h2 className="text-2xl font-bold">
                Job<span className="text-accent-orange">LeLo</span>
              </h2>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              India&apos;s modern job portal for tech talent. Discover roles from company career
              pages, track applications, and get AI-powered career guidance with JobMate.
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

            <div className="mt-6 flex items-center gap-3 pb-10">
              <a
                href="mailto:support@joblelo.online"
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
                aria-label="JobLeLo on LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
                aria-label="JobLeLo on X"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          <FooterLinkColumn title="Platform" links={footerLinks.platform} />
          <FooterLinkColumn title="For job seekers" links={candidateLinks} />
        </div>
      </div>

      <div className="relative overflow-hidden bg-card pb-0">
        <p
          className="pointer-events-none m-0 translate-y-[6%] select-none whitespace-nowrap pb-0 text-center font-black uppercase leading-[0.68] tracking-[-0.06em] text-[clamp(6rem,26vw,22rem)] text-transparent bg-gradient-to-b from-foreground/35 via-foreground/20 to-foreground/5 bg-clip-text"
          aria-hidden="true"
        >
          JOBVISTA
        </p>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-b from-transparent via-card/70 to-card"
          aria-hidden="true"
        />
      </div>
    </footer>
  );
};

export default Footer;
