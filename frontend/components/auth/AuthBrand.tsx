import CompanyLogo from "@/components/branding/CompanyLogo";
import { useCompanyBranding } from "@/lib/company-branding";

export default function AuthBrand() {
  const { name } = useCompanyBranding();

  return (
    <div className="flex flex-col items-center mb-8">
      <CompanyLogo size={64} className="mb-4 rounded-2xl" />
      <h1 className="text-lg font-semibold text-brand-text-primary">{name}</h1>
      <p className="text-sm text-brand-purple">Operations Platform</p>
    </div>
  );
}
