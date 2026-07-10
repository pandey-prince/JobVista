import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const CompanyLogo = ({ company, className = "h-14 w-14", fallbackClassName = "" }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const companyName = company?.name || "Company";
  const initial = companyName.charAt(0).toUpperCase();
  const hasLogo = Boolean(company?.logo) && !imageFailed;

  return (
    <Avatar className={`rounded-md border border-border bg-card ${className}`}>
      {hasLogo && (
        <AvatarImage
          src={company.logo}
          alt={`${companyName} logo`}
          className="object-contain p-1"
          onError={() => setImageFailed(true)}
        />
      )}
      <AvatarFallback
        className={`rounded-md bg-brand-muted text-brand font-bold ${fallbackClassName}`}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
};

export default CompanyLogo;
