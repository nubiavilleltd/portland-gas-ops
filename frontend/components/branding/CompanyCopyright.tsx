"use client";

import { useCompanyBranding } from "@/lib/company-branding";

export default function CompanyCopyright() {
  const { name } = useCompanyBranding();
  return <p className="text-xs text-gray-400 text-center">© {new Date().getFullYear()} {name} · Internal use only</p>;
}
