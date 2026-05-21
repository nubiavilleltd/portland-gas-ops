import Image from "next/image";
import logo from "@/public/Portland-gas-logo.png";

export default function AuthBrand() {
  return (
    <div className="flex flex-col items-center mb-8">
      <Image src={logo} alt="Portland Gas" width={64} height={64} priority className="mb-4" />
      <h1 className="text-lg font-semibold text-brand-text-primary">Portland Gas</h1>
      <p className="text-sm text-brand-purple">Operations Platform</p>
    </div>
  );
}
