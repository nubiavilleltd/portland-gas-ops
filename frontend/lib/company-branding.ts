import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const BRANDING_STORAGE_KEY = "company-branding";
export const DEFAULT_COMPANY_NAME = "Your Company";

export interface CompanyBranding {
  name: string;
  logoDataUrl: string | null;
}

interface CompanyBrandingState extends CompanyBranding {
  isConfigured: boolean;
  hasHydrated: boolean;
  setBranding: (branding: CompanyBranding) => void;
  resetBranding: () => void;
}

export const useCompanyBranding = create<CompanyBrandingState>()(
  persist(
    (set) => ({
      name: DEFAULT_COMPANY_NAME,
      logoDataUrl: null,
      isConfigured: false,
      hasHydrated: false,
      setBranding: ({ name, logoDataUrl }) =>
        set({ name: name.trim(), logoDataUrl, isConfigured: true }),
      resetBranding: () =>
        set({ name: DEFAULT_COMPANY_NAME, logoDataUrl: null, isConfigured: false }),
    }),
    {
      name: BRANDING_STORAGE_KEY,
      storage: createJSONStorage(() => window.localStorage),
      skipHydration: true,
      partialize: ({ name, logoDataUrl, isConfigured }) => ({
        name,
        logoDataUrl,
        isConfigured,
      }),
      onRehydrateStorage: () => () => {
        useCompanyBranding.setState({ hasHydrated: true });
      },
    }
  )
);

export function getStoredCompanyBranding(): CompanyBranding {
  if (typeof window === "undefined") {
    return { name: DEFAULT_COMPANY_NAME, logoDataUrl: null };
  }

  try {
    const raw = window.localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!raw) return { name: DEFAULT_COMPANY_NAME, logoDataUrl: null };

    const parsed = JSON.parse(raw) as {
      state?: Partial<CompanyBrandingState>;
    };
    const name = parsed.state?.name?.trim();

    return {
      name: name || DEFAULT_COMPANY_NAME,
      logoDataUrl: parsed.state?.logoDataUrl ?? null,
    };
  } catch {
    return { name: DEFAULT_COMPANY_NAME, logoDataUrl: null };
  }
}
