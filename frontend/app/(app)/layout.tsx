import Providers from "@/components/Providers";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
