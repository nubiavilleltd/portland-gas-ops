import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

interface Props {
  children: React.ReactNode;
  pageTitle?: string;
}

export default function AppLayout({ children, pageTitle }: Props) {
  return (
    <div className="flex h-screen bg-brand-bg">
      <AppSidebar />
      <div className="flex flex-col flex-1 ml-64 min-h-screen overflow-hidden">
        <AppHeader pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
