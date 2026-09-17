import { DEFAULT_COMPANY_NAME } from "@/lib/company-branding";

// Static company details will move to the database in a later phase. Name and
// logo are already resolved through the frontend branding store.
export const COMPANY_INFO = {
  name: DEFAULT_COMPANY_NAME,
  tagline: "Operations Platform",
  address: "",
  phone: "",
  email: "",
  website: "",
  logoPath: "",
} as const;

export const COMPANY_BANK_DETAILS = {
  bankName: "GTBank",
  accountName: DEFAULT_COMPANY_NAME,
  accountNumber: "0123456789",
} as const;
