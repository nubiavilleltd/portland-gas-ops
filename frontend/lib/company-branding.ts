import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const BRANDING_STORAGE_KEY = "company-branding";
export const DEFAULT_COMPANY_NAME = "Your Company";
export const DEFAULT_PRIMARY_COLOR = "#7234BD";
export const DEFAULT_SECONDARY_COLOR = "#1C043B";
export type LogoBackground = "light" | "dark" | "none";
export const DEFAULT_LOGO_BACKGROUND: LogoBackground = "light";
export type WorkspaceStatus = "unknown" | "pending_setup" | "active" | "suspended" | "closed";

export function normalizeHexColor(value: string | null | undefined, fallback: string): string {
  const candidate = value?.trim() ?? "";
  return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate.toUpperCase() : fallback;
}

function hexToRgb(hex: string) {
  const normalized = normalizeHexColor(hex, "#000000");
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

export function mixHex(color: string, mixWith: string, amount: number) {
  const source = hexToRgb(color);
  const target = hexToRgb(mixWith);
  const channel = (value: number, targetValue: number) =>
    Math.round(value + (targetValue - value) * amount)
      .toString(16)
      .padStart(2, "0");

  return `#${channel(source.r, target.r)}${channel(source.g, target.g)}${channel(source.b, target.b)}`.toUpperCase();
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function getContrastTextColor(color: string): "#FFFFFF" | "#111118" {
  const luminance = relativeLuminance(color);
  const darkLuminance = relativeLuminance("#111118");
  const whiteContrast = (1 + 0.05) / (luminance + 0.05);
  const darkContrast = (Math.max(luminance, darkLuminance) + 0.05) /
    (Math.min(luminance, darkLuminance) + 0.05);
  return whiteContrast >= darkContrast ? "#FFFFFF" : "#111118";
}

export function getContrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getBrandThemeVariables(primaryColor: string, secondaryColor: string) {
  const primary = normalizeHexColor(primaryColor, DEFAULT_PRIMARY_COLOR);
  const secondary = normalizeHexColor(secondaryColor, DEFAULT_SECONDARY_COLOR);

  return {
    "--brand-primary": primary,
    "--brand-primary-foreground": getContrastTextColor(primary),
    "--brand-primary-light": mixHex(primary, "#FFFFFF", 0.22),
    "--brand-primary-dark": mixHex(primary, "#000000", 0.22),
    "--brand-primary-faint": mixHex(primary, "#FFFFFF", 0.94),
    "--brand-primary-mid": mixHex(primary, "#FFFFFF", 0.84),
    "--brand-secondary": secondary,
    "--brand-secondary-foreground": getContrastTextColor(secondary),
    "--brand-secondary-light": mixHex(secondary, "#FFFFFF", 0.22),
    "--brand-secondary-dark": mixHex(secondary, "#000000", 0.22),
    "--brand-secondary-faint": mixHex(secondary, "#FFFFFF", 0.94),
    "--brand-secondary-mid": mixHex(secondary, "#FFFFFF", 0.84),
  } as const;
}

export interface CompanyBranding {
  name: string;
  logoDataUrl: string | null;
  logoBackground: LogoBackground;
  primaryColor: string;
  secondaryColor: string;
}

interface CompanyBrandingState extends CompanyBranding {
  hasHydrated: boolean;
  hasResolvedWorkspace: boolean;
  setBranding: (branding: CompanyBranding) => void;
  setWorkspaceResolved: (resolved: boolean) => void;
  resetBranding: () => void;
}

export const useCompanyBranding = create<CompanyBrandingState>()(
  persist(
    (set) => ({
      name: DEFAULT_COMPANY_NAME,
      logoDataUrl: null,
      logoBackground: DEFAULT_LOGO_BACKGROUND,
      primaryColor: DEFAULT_PRIMARY_COLOR,
      secondaryColor: DEFAULT_SECONDARY_COLOR,
      hasHydrated: false,
      hasResolvedWorkspace: false,
      setBranding: ({ name, logoDataUrl, logoBackground, primaryColor, secondaryColor }) =>
        set({
          name: name.trim(),
          logoDataUrl,
          logoBackground: logoBackground === "dark" || logoBackground === "none" ? logoBackground : DEFAULT_LOGO_BACKGROUND,
          primaryColor: normalizeHexColor(primaryColor, DEFAULT_PRIMARY_COLOR),
          secondaryColor: normalizeHexColor(secondaryColor, DEFAULT_SECONDARY_COLOR),
        }),
      setWorkspaceResolved: (hasResolvedWorkspace) => set({ hasResolvedWorkspace }),
      resetBranding: () =>
        set({
          name: DEFAULT_COMPANY_NAME,
          logoDataUrl: null,
          logoBackground: DEFAULT_LOGO_BACKGROUND,
          primaryColor: DEFAULT_PRIMARY_COLOR,
          secondaryColor: DEFAULT_SECONDARY_COLOR,
        }),
    }),
    {
      name: BRANDING_STORAGE_KEY,
      storage: createJSONStorage(() => window.localStorage),
      skipHydration: true,
      partialize: ({ name, logoDataUrl, logoBackground, primaryColor, secondaryColor }) => ({
        name,
        logoDataUrl,
        logoBackground,
        primaryColor,
        secondaryColor,
      }),
      onRehydrateStorage: () => () => {
        useCompanyBranding.setState({ hasHydrated: true });
      },
    }
  )
);

export function getStoredCompanyBranding(): CompanyBranding {
  if (typeof window === "undefined") {
    return {
      name: DEFAULT_COMPANY_NAME,
      logoDataUrl: null,
      logoBackground: DEFAULT_LOGO_BACKGROUND,
      primaryColor: DEFAULT_PRIMARY_COLOR,
      secondaryColor: DEFAULT_SECONDARY_COLOR,
    };
  }

  try {
    const raw = window.localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!raw) {
      return {
        name: DEFAULT_COMPANY_NAME,
        logoDataUrl: null,
        logoBackground: DEFAULT_LOGO_BACKGROUND,
        primaryColor: DEFAULT_PRIMARY_COLOR,
        secondaryColor: DEFAULT_SECONDARY_COLOR,
      };
    }

    const parsed = JSON.parse(raw) as {
      state?: Partial<CompanyBrandingState>;
    };
    const name = parsed.state?.name?.trim();
    const storedLogoBackground = parsed.state?.logoBackground;

    return {
      name: name || DEFAULT_COMPANY_NAME,
      logoDataUrl: parsed.state?.logoDataUrl ?? null,
      logoBackground: storedLogoBackground === "dark" || storedLogoBackground === "none"
        ? storedLogoBackground
        : DEFAULT_LOGO_BACKGROUND,
      primaryColor: normalizeHexColor(parsed.state?.primaryColor, DEFAULT_PRIMARY_COLOR),
      secondaryColor: normalizeHexColor(parsed.state?.secondaryColor, DEFAULT_SECONDARY_COLOR),
    };
  } catch {
    return {
      name: DEFAULT_COMPANY_NAME,
      logoDataUrl: null,
      logoBackground: DEFAULT_LOGO_BACKGROUND,
      primaryColor: DEFAULT_PRIMARY_COLOR,
      secondaryColor: DEFAULT_SECONDARY_COLOR,
    };
  }
}
