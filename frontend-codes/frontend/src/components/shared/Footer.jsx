import React from "react";
import { Bot, BriefcaseBusiness, Building2, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-t-gray-200 py-8 mt-10">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <h2 className="text-xl font-bold">
              Job<span className="text-[#F83002]">Vista</span>
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              A smarter job portal for candidates and recruiters, supported by JobMate.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">For Candidates</h3>
            <p className="text-sm text-gray-500 flex gap-2 items-center">
              <BriefcaseBusiness className="h-4 w-4" /> Search jobs
            </p>
            <p className="text-sm text-gray-500 flex gap-2 items-center mt-1">
              <Bot className="h-4 w-4" /> Resume and interview help
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">For Recruiters</h3>
            <p className="text-sm text-gray-500 flex gap-2 items-center">
              <Building2 className="h-4 w-4" /> Manage companies
            </p>
            <p className="text-sm text-gray-500 flex gap-2 items-center mt-1">
              <BriefcaseBusiness className="h-4 w-4" /> Post jobs
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Contact</h3>
            <p className="text-sm text-gray-500 flex gap-2 items-center">
              <Mail className="h-4 w-4" /> support@jobvista.demo
            </p>
            <p className="text-sm text-gray-500 mt-3">(c) 2026 JobVista. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
