import React from "react";
import { useParams } from "react-router-dom";
import usePageTitle from "@/hooks/usePageTitle";

const formatSlug = (slug) =>
  (slug || "company")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const CompanyJobsPage = () => {
  const { slug } = useParams();
  const companyName = formatSlug(slug);

  usePageTitle(`${companyName} Jobs`);

  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h1 className="text-2xl font-bold">{companyName} Jobs</h1>
      <p className="mt-2 text-muted-foreground">Company job listings coming soon.</p>
    </div>
  );
};

export default CompanyJobsPage;
