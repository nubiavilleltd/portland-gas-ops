import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkInitiationForm from "../components/WorkInitiationForm";

export default function NewWorkInitiationPage() {
  return (
    <AppLayout pageTitle="New Work Initiation">
      <PageHeader
        title="New Work Initiation"
        description="Describe the operational work, related asset, and assignment plan."
        className="mb-6"
      />
      <WorkInitiationForm />
    </AppLayout>
  );
}
