import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const CompanyLogo = ({ company, className = "h-14 w-14", fallbackClassName = "" }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const companyName = company?.name || "Company";
  const initial = companyName.charAt(0).toUpperCase();
  const hasLogo = Boolean(company?.logo) && !imageFailed;

  return (
    <Avatar className={`rounded-md border border-gray-200 bg-white ${className}`}>
      {hasLogo && (
        <AvatarImage
          src={company.logo}
          alt={`${companyName} logo`}
          className="object-contain p-1"
          onError={() => setImageFailed(true)}
        />
      )}
      <AvatarFallback
        className={`rounded-md bg-[#f3edff] text-[#6A38C2] font-bold ${fallbackClassName}`}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
};

export default CompanyLogo;
