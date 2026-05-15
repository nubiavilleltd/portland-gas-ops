import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

export default function ModulePage() {
  const name = "safety";
  return (
    <AppLayout pageTitle={name}>
      <PageHeader title={name} description="This module is under active development." className="mb-6" />
      <EmptyState
        title="Coming soon"
        description="This module page will be built next. The backend API stubs are ready."
        action={<Button href="/safety/demo">Open UI Demo</Button>}
      />
    </AppLayout>
  );
}
