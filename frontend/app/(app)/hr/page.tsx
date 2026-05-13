import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function ModulePage() {
  const name = "hr";
  return (
    <AppLayout pageTitle={name}>
      <PageHeader title={name} description="This module is under active development." className="mb-6" />
      <EmptyState title="Coming soon" description="This module page will be built next. The backend API stubs are ready." />
    </AppLayout>
  );
}
