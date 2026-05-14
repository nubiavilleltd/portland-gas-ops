import Image from "next/image";
import logo from "@/public/Portland-gas-logo.png";

export default function AuthBrand() {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="h-16 w-16 rounded-2xl bg-white shadow-sm border border-brand-border flex items-center justify-center mb-4 p-2">
        <Image src={logo} alt="Portland Gas" width={48} height={48} priority />
      </div>
      <h1 className="text-lg font-semibold text-brand-text-primary">Portland Gas</h1>
      <p className="text-sm text-brand-purple">Operations Platform</p>
    </div>
  );
}
