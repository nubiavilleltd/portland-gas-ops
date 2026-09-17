"use client";

import { useEffect } from "react";
import { getBrandThemeVariables, useCompanyBranding } from "@/lib/company-branding";

export default function BrandTheme() {
  const { primaryColor, secondaryColor } = useCompanyBranding();

  useEffect(() => {
    const root = document.documentElement;
    const variables = getBrandThemeVariables(primaryColor, secondaryColor);

    for (const [property, value] of Object.entries(variables)) {
      root.style.setProperty(property, value);
    }

    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      variables["--brand-secondary"],
    );
  }, [primaryColor, secondaryColor]);

  return null;
}
