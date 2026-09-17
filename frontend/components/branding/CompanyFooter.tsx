"use client";

import { useCompanyBranding } from "@/lib/company-branding";

export default function CompanyFooter() {
  const { name } = useCompanyBranding();
  return (
    <p className="text-center text-xs text-brand-text-secondary mt-6">
      {name} &mdash; Internal Platform
    </p>
  );
}
